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
   Expand COP ranges for target year
   posting_group: NULL => IP, 3 => PG3
   ========================= */
cop_expanded as (
  select
    b.code,
    (x->>'year')::int as year,
    nullif((x->>'posting_group'),'')::int as posting_group,  -- NULL for IP
    (x->>'nonaffiliated_min_score')::int as na_min,
    (x->>'nonaffiliated_max_score')::int as na_max,
    (x->>'affiliated_min_score')::int   as a_min,
    (x->>'affiliated_max_score')::int   as a_max
  from base b
  cross join lateral jsonb_array_elements(b.cop_ranges) x
  where (x->>'year')::int = in_year
),

/* =========================
   OPTIONS per school (emit a row for each qualifying track)
   - IP (track = 'IP'): qualification by IP band (posting_group IS NULL).
       IP doesn't have "affiliated" vs "open"; if only one set exists,
       coalesce it for min/max checks.
   - PG3_AFF (track = 'PG3_AFF'): only if child is affiliated AND score qualifies A-band.
   - PG3_OPEN (track = 'PG3_OPEN'): if score qualifies NA-band.
   ========================= */
ip_opt as (
  select
    b.code,
    'IP'::text as track,
    null::int  as posting_group,
    -- display cutoff: prefer affiliated max for IP if present, else non-aff
    coalesce(ce.a_max, ce.na_max) as cutoff_max
  from gendered b
  join cop_expanded ce on ce.code = b.code and ce.posting_group is null
  -- qualify if score inside the available IP band (aff or non-aff fields)
  where user_score between coalesce(ce.a_min, ce.na_min) and coalesce(ce.a_max, ce.na_max)
),

pg3_aff_opt as (
  select
    b.code,
    'PG3_AFF'::text as track,
    3::int          as posting_group,
    ce.a_max        as cutoff_max
  from gendered b
  join cop_expanded ce on ce.code = b.code and ce.posting_group = 3
  join user_aff ua     on ua.code = b.code and ua.is_affiliated = true
  where ce.a_min is not null and ce.a_max is not null
    and user_score between ce.a_min and ce.a_max
),

-- PG3 (open) — but suppress when an affiliated PG3 row exists for this school
pg3_open_opt as (
  select
    b.code,
    'PG3_OPEN'::text as track,
    3::int           as posting_group,
    ce.na_max        as cutoff_max
  from gendered b
  join cop_expanded ce on ce.code = b.code and ce.posting_group = 3
  where ce.na_min is not null and ce.na_max is not null
    and user_score between ce.na_min and ce.na_max
    -- 👇 NEW: if the child is affiliated and PG3_AFF exists for this school,
    -- do NOT emit PG3_OPEN (prevents a third duplicate row)
    and not exists (
      select 1
      from pg3_aff_opt pa
      where pa.code = b.code
    )
),


options as (
  select * from ip_opt
  union all
  select * from pg3_aff_opt
  union all
  select * from pg3_open_opt
),

/* =========================
   Row priority to enforce scenarios
   - Scenario 2 (affiliated + IP qualifies): same school yields IP first, then PG3_AFF.
   - Scenario 3 (affiliated, no IP): PG3_AFF first overall.
   - Scenario 1 (non-aff): IP then PG3_OPEN back-to-back.
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
              when o.track = 'IP'       then 0
              when o.track = 'PG3_AFF'  then 1
              else 9
            end
          else
            case
              when o.track = 'PG3_AFF'  then 0
              else 9
            end
        end
      else
        case
          when o.track = 'IP'        then 2
          when o.track = 'PG3_OPEN'  then 3
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
   SPORTS (match list + normalized score over selected)
   ========================= */
sports_join as (
  select
    ss.code::text as code,
    coalesce(
      array_agg(distinct ss.sport) filter (
        where array_length(sports_selected,1) is not null and ss.sport = any(sports_selected)
      ), '{}'
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
      ), '{}'
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
      ), '{}'
    ) as culture_matches,
    case
      when array_length(culture_selected,1) is null or array_length(culture_selected,1) = 0 then 0.0
      else avg(least(1.0, greatest(0.0, c.score_norm_0_1::double precision)))
           filter (where c.theme_key = any(culture_selected))
    end as culture_score_norm
  from public.school_culture_scores c
  group by c.school_code::text
),

effective_limits AS (
  SELECT
    CASE
      WHEN coalesce(gender_pref,'Any') IN ('Boys','Girls')
        THEN NULL::double precision     -- 👈 no cap when single-sex selected
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
    sj.sports_matches,
    cj.ccas_matches,
    uj.culture_matches,
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
)

select
  fr.code,
  fr.name,
  fr.address,
  fr.distance_km,
  fr.posting_group,
  fr.track,                 -- 'IP' | 'PG3_AFF' | 'PG3_OPEN'
  fr.is_affiliated,
  fr.cop_max_score,
  fr.sports_matches,
  fr.ccas_matches,
  fr.culture_matches,
  (coalesce(weight_dist,0)    * distance_score_norm) +
  (coalesce(weight_sport,0)   * sport_score_norm   ) +
  (coalesce(weight_cca,0)     * cca_score_norm     ) +
  (coalesce(weight_culture,0) * culture_score_norm ) as composite_score
FROM final_rows fr
CROSS JOIN effective_limits el
WHERE
  (el.eff_max_km IS NULL)                  -- 👈 Boys/Girls: whole SG
  OR (fr.distance_km <= el.eff_max_km)
  OR (fr.is_affiliated = true)             -- keep your affiliated override
ORDER BY
  fr.is_affiliated DESC,
  CASE
    WHEN fr.is_affiliated THEN CASE WHEN fr.track='IP' THEN 0 WHEN fr.track='PG3_AFF' THEN 1 ELSE 9 END
    ELSE                        CASE WHEN fr.track='IP' THEN 2 WHEN fr.track='PG3_OPEN' THEN 3 ELSE 9 END
  END,
  fr.cop_max_score ASC NULLS LAST,
  (fr.posting_group IS NULL) DESC,
  composite_score DESC,
  fr.distance_km ASC
LIMIT GREATEST(1, coalesce(limit_count, 10));