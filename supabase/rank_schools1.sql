/* =========================
   Base school rows
   ========================= */
with base as (
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
   posting_group: NULL => IP, 3 => PG3, 2 => PG2, 1 => PG1
   ========================= */
/* =========================
   Expand COP ranges for latest available year per school
   posting_group: NULL => IP, 3 => PG3, 2 => PG2, 1 => PG1
   ========================= */
cop_expanded as (
  select
    b.code,
    ly.latest_year as year,
    nullif((y->>'posting_group'),'')::int as posting_group,  -- NULL for IP
    (y->>'nonaffiliated_min_score')::int as na_min,
    (y->>'nonaffiliated_max_score')::int as na_max,
    (y->>'affiliated_min_score')::int   as a_min,
    (y->>'affiliated_max_score')::int   as a_max
  from base b
  -- find latest year inside the array
  cross join lateral (
    select max((e->>'year')::int) as latest_year
    from jsonb_array_elements(b.cop_ranges) e
  ) ly
  -- expand only rows for that latest year
  cross join lateral jsonb_array_elements(b.cop_ranges) y
  where (y->>'year')::int = ly.latest_year
),


/* =========================
   OPTIONS per school
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
  -- Affiliated options for PG3, PG2, PG1
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
  -- Open options for PG3, PG2, PG1 (only if no matching AFF for that school+group)
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
   Row priority (same logic as before)
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
   Pick the single best option per school
   (uses your sort_row_priority fallback, then prefers larger cutoff_max if tied)
   ========================= */
best as (
  select distinct on (r.code)
    r.*
  from ranked r
  order by
    r.code,
    r.sort_row_priority asc,   -- your fallback (IP/PG3/PG2/PG1, aff vs open)
    r.cutoff_max desc          -- if two rows tie, keep the one with the higher max cutoff
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
  from best r
  join base b on b.code = r.code
  join dist d on d.code = r.code
),

/* =========================
   SPORTS
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
   CCAs
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
   CULTURE
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
   CULTURE TAGS (top N by strength)
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
   Final rows with composite score
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
    coalesce(uj.culture_score_norm,0.0) as culture_score_norm
  from joined j
  left join sports_join sj  on sj.code = j.code
  left join cca_join    cj  on cj.code = j.code
  left join culture_join uj on uj.code = j.code
  left join culture_tags ct on ct.code = j.code
)

select
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
  (coalesce(weight_culture,0) * culture_score_norm ) as composite_score
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
  (fr.posting_group IS NULL) DESC,  -- keeps IP above O-level streams
  composite_score DESC,
  fr.distance_km ASC
LIMIT GREATEST(1, coalesce(limit_count, 10));