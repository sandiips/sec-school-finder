-- ai_rank_schools.sql
-- AI-optimized version of rank_schools1 with enhanced logging and conversational features

CREATE OR REPLACE FUNCTION ai_rank_schools(
  user_score integer,
  user_lat decimal,
  user_lng decimal,
  gender_pref text DEFAULT 'Any',
  sports_selected text[] DEFAULT '{}',
  ccas_selected text[] DEFAULT '{}',
  culture_selected text[] DEFAULT '{}',
  max_distance_km decimal DEFAULT 30,
  weight_dist decimal DEFAULT 0.2,
  weight_sport decimal DEFAULT 0.2,
  weight_cca decimal DEFAULT 0.2,
  weight_culture decimal DEFAULT 0.2,
  limit_count integer DEFAULT 6,
  primary_slug text DEFAULT NULL,
  ai_session_id text DEFAULT NULL
) RETURNS TABLE(
  code text,
  name text,
  address text,
  distance_km double precision,
  posting_group integer,
  track text,
  is_affiliated boolean,
  cop_max_score integer,
  sports_matches text[],
  ccas_matches text[],
  culture_matches text[],
  culture_top_titles text[],
  culture_top_strengths double precision[],
  composite_score double precision,
  -- AI-specific fields
  match_summary text,
  recommendation_reason text,
  ai_metadata jsonb
) LANGUAGE plpgsql AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  v_result_count integer;
  v_cache_key text;
BEGIN
  -- Start performance tracking
  start_time := clock_timestamp();

  -- Generate cache key for potential future caching
  v_cache_key := md5(concat(
    user_score, '|', user_lat, '|', user_lng, '|',
    gender_pref, '|', array_to_string(sports_selected, ','), '|',
    array_to_string(ccas_selected, ','), '|',
    array_to_string(culture_selected, ','), '|',
    max_distance_km, '|', weight_dist, '|', weight_sport, '|',
    weight_cca, '|', weight_culture, '|', primary_slug
  ));

  -- Log AI request (optional - for analytics)
  IF ai_session_id IS NOT NULL THEN
    INSERT INTO ai_request_logs (
      session_id,
      function_name,
      parameters,
      cache_key,
      requested_at
    ) VALUES (
      ai_session_id,
      'ai_rank_schools',
      jsonb_build_object(
        'user_score', user_score,
        'gender_pref', gender_pref,
        'sports_count', array_length(sports_selected, 1),
        'ccas_count', array_length(ccas_selected, 1),
        'culture_count', array_length(culture_selected, 1),
        'max_distance_km', max_distance_km
      ),
      v_cache_key,
      start_time
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
  WITH
  /* =========================
     Base school rows (same as rank_schools1)
     ========================= */
  base as (
    select
      s.code::text as code,
      s.name,
      s.address,
      s.lat::double precision as lat,
      s.lng::double precision as lng,
      s.gender,
      s.cop_ranges::jsonb as cop_ranges,
      s.affiliated_primaries::jsonb as affiliated_primaries
    from public.secondary_with_affiliations s
  ),

  /* =========================
     Distance (km) via haversine
     ========================= */
  dist as (
    select
      b.code,
      2 * 6371 * asin(
        sqrt(
          pow(sin(radians((b.lat - user_lat)/2)),2) +
          cos(radians(user_lat)) * cos(radians(b.lat)) *
          pow(sin(radians((b.lng - user_lng)/2)),2)
        )
      )::double precision as distance_km
    from base b
  ),

  /* =========================
     Gender filter (treat 'Mixed' as 'Co-ed')
     ========================= */
  gendered as (
    select b.*
    from base b
    where
      coalesce(gender_pref,'Any') = 'Any'
      or (gender_pref in ('Co-ed','Mixed') and b.gender in ('Co-ed','Mixed'))
      or (gender_pref = 'Boys' and b.gender = 'Boys')
      or (gender_pref = 'Girls' and b.gender = 'Girls')
  ),

  /* =========================
     Affiliation flag for the CHILD to this secondary
     ========================= */
  user_aff as (
    select
      b.code,
      (coalesce(primary_slug,'') <> '' and exists (
        select 1
        from jsonb_array_elements(b.affiliated_primaries) ap
        where lower(ap->>'primary_slug') = lower(primary_slug)
      )) as is_affiliated
    from base b
  ),

  /* =========================
     Expand COP ranges for latest available year per school
     ========================= */
  cop_expanded as (
    select
      b.code,
      (x.elem->>'year')::int as year,
      nullif((x.elem->>'posting_group'),'')::int as posting_group,
      (x.elem->>'nonaffiliated_min_score')::int as na_min,
      (x.elem->>'nonaffiliated_max_score')::int as na_max,
      (x.elem->>'affiliated_min_score')::int   as a_min,
      (x.elem->>'affiliated_max_score')::int   as a_max
    from base b
    cross join lateral (
      select y as elem
      from jsonb_array_elements(b.cop_ranges) y
      order by (y->>'year')::int desc
      limit 1
    ) as x
  ),

  /* =========================
     OPTIONS per school (same logic as rank_schools1)
     ========================= */
  ip_opt as (
    select
      b.code,
      'IP'::text as track,
      null::int  as posting_group,
      coalesce(ce.a_max, ce.na_max) as cutoff_max
    from gendered b
    join cop_expanded ce on ce.code = b.code and ce.posting_group is null
    where coalesce(ce.a_max, ce.na_max) IS NOT NULL
  and user_score <= coalesce(ce.a_max, ce.na_max)
  ),

  pg_aff_opt as (
    select
      b.code,
      ('PG' || ce.posting_group || '_AFF')::text as track,
      ce.posting_group,
      ce.a_max as cutoff_max
    from gendered b
    join cop_expanded ce on ce.code = b.code and ce.posting_group in (1,2,3)
    join user_aff ua     on ua.code = b.code and ua.is_affiliated = true
    where ce.a_max is not null
  and user_score <= ce.a_max
  ),

  pg_open_opt as (
    select
      b.code,
      ('PG' || ce.posting_group || '_OPEN')::text as track,
      ce.posting_group,
      ce.na_max as cutoff_max
    from gendered b
    join cop_expanded ce on ce.code = b.code and ce.posting_group in (1,2,3)
    where ce.na_max is not null
  and user_score <= ce.na_max
      and not exists (
        select 1
        from pg_aff_opt pa
        where pa.code = b.code
          and pa.posting_group = ce.posting_group
      )
  ),

  options as (
    select * from ip_opt
    union all
    select * from pg_aff_opt
    union all
    select * from pg_open_opt
  ),

  /* =========================
     Row priority (same logic)
     ========================= */
  ranked as (
    select
      o.*,
      ua.is_affiliated,
      case
        when ua.is_affiliated then
          case
            when exists (select 1 from ip_opt i where i.code = o.code) then
              case
                when o.track = 'IP'            then 0
                when o.track = 'PG3_AFF'       then 1
                when o.track = 'PG2_AFF'       then 2
                when o.track = 'PG1_AFF'       then 3
                else 9
              end
            else
              case
                when o.track = 'PG3_AFF'       then 0
                when o.track = 'PG2_AFF'       then 1
                when o.track = 'PG1_AFF'       then 2
                else 9
              end
          end
        else
          case
            when o.track = 'IP'            then 2
            when o.track = 'PG3_OPEN'      then 3
            when o.track = 'PG2_OPEN'      then 4
            when o.track = 'PG1_OPEN'      then 5
            else 9
          end
      end as sort_row_priority
    from options o
    left join user_aff ua on ua.code = o.code
  ),

  /* =========================
     Attach display fields + distance
     ========================= */
  joined as (
    select
      b.name,
      b.code,
      b.address,
      d.distance_km,
      r.track,
      r.posting_group,
      r.is_affiliated,
      r.sort_row_priority,
      r.cutoff_max as cop_max_score
    from ranked r
    join base b on b.code = r.code
    join dist d on d.code = r.code
  ),

  /* =========================
     SPORTS (same logic)
     ========================= */
  sports_join as (
    select
      ss.code::text as code,
      coalesce(
        array_agg(distinct ss.sport) filter (
          where array_length(sports_selected,1) is not null and ss.sport = any(sports_selected)
        ), '{}'::text[]
      ) as sports_matches,
      case
        when array_length(sports_selected,1) is null or array_length(sports_selected,1) = 0 then 0.0
        else avg(least(1.0, nullif(ss.score,0)::double precision / 100.0))
             filter (where ss.sport = any(sports_selected))
      end as sport_score_norm
    from public.school_sports_scores ss
    group by ss.code::text
  ),

  /* =========================
     CCAs (same logic)
     ========================= */
  cca_join as (
    select
      sc.code::text as code,
      coalesce(
        array_agg(distinct sc.cca) filter (
          where array_length(ccas_selected,1) is not null and sc.cca = any(ccas_selected)
        ), '{}'::text[]
      ) as ccas_matches,
      case
        when array_length(ccas_selected,1) is null or array_length(ccas_selected,1) = 0 then 0.0
        else avg(least(1.0, nullif(sc.score,0)::double precision / 100.0))
             filter (where sc.cca = any(ccas_selected))
      end as cca_score_norm
    from public.school_cca_scores sc
    group by sc.code::text
  ),

  /* =========================
     CULTURE (same logic)
     ========================= */
  culture_join as (
    select
      c.school_code::text as code,
      coalesce(
        array_agg(distinct c.theme_key) filter (
          where array_length(culture_selected,1) is not null and c.theme_key = any(culture_selected)
        ), '{}'::text[]
      ) as culture_matches,
      case
        when array_length(culture_selected,1) is null or array_length(culture_selected,1) = 0 then 0.0
        else avg(least(1.0, greatest(0.0, c.score_norm_0_1::double precision)))
             filter (where c.theme_key = any(culture_selected))
      end as culture_score_norm
    from public.school_culture_scores c
    group by c.school_code::text
  ),

  /* =========================
     CULTURE TAGS (same logic)
     ========================= */
  culture_tags as (
    select
      c.school_code::text as code,
      array_agg(c.theme_title order by c.final_strength desc) as culture_top_titles_all,
      array_agg(c.final_strength order by c.final_strength desc) as culture_top_strengths_all
    from public.school_culture_scores c
    group by c.school_code::text
  ),

  effective_limits AS (
    SELECT
      CASE
        WHEN coalesce(gender_pref,'Any') IN ('Boys','Girls')
          THEN NULL::double precision
        ELSE max_distance_km
      END AS eff_max_km
  ),

  /* =========================
     Final rows with composite score + AI enhancements
     ========================= */
  final_rows as (
    select
      j.name,
      j.code,
      j.address,
      j.distance_km,
      j.track,
      j.posting_group,
      j.is_affiliated,
      j.cop_max_score,
      j.sort_row_priority,
      sj.sports_matches,
      cj.ccas_matches,
      uj.culture_matches,
      (case when ct.culture_top_titles_all is null
            then '{}'::text[]
            else ct.culture_top_titles_all[1:3] end) as culture_top_titles,
      (case when ct.culture_top_strengths_all is null
            then '{}'::double precision[]
            else ct.culture_top_strengths_all[1:3] end) as culture_top_strengths,
      case
        when max_distance_km is null or max_distance_km <= 0 then 1.0
        else greatest(0.0, least(1.0, 1.0 - (coalesce(j.distance_km,0)::double precision / max_distance_km)))
      end as distance_score_norm,
      coalesce(sj.sport_score_norm,  0.0) as sport_score_norm,
      coalesce(cj.cca_score_norm,    0.0) as cca_score_norm,
      coalesce(uj.culture_score_norm,0.0) as culture_score_norm,
      -- AI-specific enhancements
      CASE
        WHEN array_length(coalesce(sj.sports_matches, '{}'), 1) > 0
             AND array_length(coalesce(cj.ccas_matches, '{}'), 1) > 0
             AND array_length(coalesce(uj.culture_matches, '{}'), 1) > 0
        THEN 'Excellent match: Strong in sports, CCAs, and culture'
        WHEN array_length(coalesce(sj.sports_matches, '{}'), 1) > 0
             AND array_length(coalesce(cj.ccas_matches, '{}'), 1) > 0
        THEN 'Great match: Strong in sports and CCAs'
        WHEN array_length(coalesce(sj.sports_matches, '{}'), 1) > 0
             AND array_length(coalesce(uj.culture_matches, '{}'), 1) > 0
        THEN 'Great match: Strong in sports and culture'
        WHEN array_length(coalesce(cj.ccas_matches, '{}'), 1) > 0
             AND array_length(coalesce(uj.culture_matches, '{}'), 1) > 0
        THEN 'Great match: Strong in CCAs and culture'
        WHEN array_length(coalesce(sj.sports_matches, '{}'), 1) > 0
        THEN 'Good match: Strong in your selected sports'
        WHEN array_length(coalesce(cj.ccas_matches, '{}'), 1) > 0
        THEN 'Good match: Strong in your selected CCAs'
        WHEN array_length(coalesce(uj.culture_matches, '{}'), 1) > 0
        THEN 'Good match: Aligns with your culture preferences'
        WHEN j.is_affiliated = true
        THEN 'Good match: Affiliated with your primary school'
        WHEN j.distance_km <= 5.0
        THEN 'Convenient location: Very close to home'
        ELSE 'Potential match: Meets your AL score requirements'
      END as match_summary,

      CASE
        WHEN j.is_affiliated = true AND j.track LIKE '%_AFF'
        THEN 'Priority admission through primary school affiliation with lower cut-off score'
        WHEN j.track = 'IP'
        THEN 'Integrated Program - 6-year pathway without O-Levels'
        WHEN j.posting_group = 3
        THEN 'Posting Group 3 - Top tier academic school'
        WHEN j.posting_group = 2
        THEN 'Posting Group 2 - Strong academic performance'
        WHEN j.posting_group = 1
        THEN 'Posting Group 1 - Solid academic foundation'
        ELSE 'Meets admission requirements'
      END as recommendation_reason
    from joined j
    left join sports_join sj  on sj.code = j.code
    left join cca_join    cj  on cj.code = j.code
    left join culture_join uj on uj.code = j.code
    left join culture_tags ct on ct.code = j.code
  )

  SELECT
    fr.code,
    fr.name,
    fr.address,
    fr.distance_km,
    fr.posting_group,
    fr.track,
    fr.is_affiliated,
    fr.cop_max_score,
    fr.sports_matches,
    fr.ccas_matches,
    fr.culture_matches,
    fr.culture_top_titles,
    fr.culture_top_strengths,
    (coalesce(weight_dist,0)    * distance_score_norm) +
    (coalesce(weight_sport,0)   * sport_score_norm   ) +
    (coalesce(weight_cca,0)     * cca_score_norm     ) +
    (coalesce(weight_culture,0) * culture_score_norm ) as composite_score,
    fr.match_summary,
    fr.recommendation_reason,
    jsonb_build_object(
      'sport_score', sport_score_norm,
      'cca_score', cca_score_norm,
      'culture_score', culture_score_norm,
      'distance_score', distance_score_norm,
      'total_matches', array_length(coalesce(fr.sports_matches, '{}'), 1) +
                      array_length(coalesce(fr.ccas_matches, '{}'), 1) +
                      array_length(coalesce(fr.culture_matches, '{}'), 1),
      'cache_key', v_cache_key,
      'generated_at', extract(epoch from clock_timestamp())
    ) as ai_metadata
  FROM final_rows fr
  CROSS JOIN effective_limits el
  WHERE
    (el.eff_max_km IS NULL)
    OR (fr.distance_km <= el.eff_max_km)
    OR (fr.is_affiliated = true)
  ORDER BY
    fr.is_affiliated DESC,
    fr.sort_row_priority ASC,
    fr.cop_max_score ASC NULLS LAST,
    (fr.posting_group IS NULL) DESC,
    composite_score DESC,
    fr.distance_km ASC
  LIMIT GREATEST(1, coalesce(limit_count, 6));

  -- Performance logging
  end_time := clock_timestamp();
  GET DIAGNOSTICS v_result_count = ROW_COUNT;

  -- Log performance metrics (optional)
  IF ai_session_id IS NOT NULL THEN
    UPDATE ai_request_logs arl
    SET
      completed_at = end_time,
      execution_time_ms = extract(milliseconds from (end_time - start_time)),
      response_metadata = jsonb_build_object(
        'cache_key', v_cache_key,
        'parameters_hash', md5(concat(user_score, gender_pref, array_to_string(sports_selected, ','))),
        'distance_filter_applied', max_distance_km < 50,
        'result_count', v_result_count
      )
    WHERE arl.session_id = ai_session_id
      AND arl.function_name = 'ai_rank_schools'
      AND arl.requested_at = start_time;
  END IF;

END;
$$;

-- Create logging table for AI analytics (optional)
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  function_name TEXT NOT NULL,
  parameters JSONB,
  cache_key TEXT,
  requested_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  execution_time_ms NUMERIC,
  result_count INTEGER,
  response_metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_session_function
ON ai_request_logs(session_id, function_name, requested_at DESC);

-- Comment
COMMENT ON FUNCTION ai_rank_schools IS 'AI-optimized school ranking function with enhanced conversational features, logging, and metadata for chatbot integration';