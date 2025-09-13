
WITH
/* 0) Canonicalize incoming slug + normalized variant (handles apostrophes/hyphens) */
u AS (
  SELECT
    lower(coalesce(user_primary,''))                                         AS u_slug,
    regexp_replace(lower(coalesce(user_primary,'')), '[^a-z0-9]', '', 'g')  AS u_norm
),

/* 1) Base */
base AS (
  SELECT
    s.code::text                    AS code,
    s.name,
    s.address,
    s.lat::double precision         AS lat,
    s.lng::double precision         AS lng,
    s.gender,
    s.cop_ranges::jsonb             AS cop_ranges,
    s.affiliated_primaries::jsonb   AS affiliated_primaries,
    s.affiliated_primary_slugs::text[] AS affiliated_primary_slugs
  FROM public.secondary_with_affiliations s
),

/* 2) Affiliation flag (exact or normalized compare) */
user_aff AS (
  SELECT
    b.code,
    (
      (SELECT u_slug FROM u) <> ''
      AND (
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(b.affiliated_primaries) ap
          WHERE lower(ap->>'primary_slug') = (SELECT u_slug FROM u)
             OR regexp_replace(lower(ap->>'primary_slug'), '[^a-z0-9]', '', 'g')
                = (SELECT u_norm FROM u)
        )
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(b.affiliated_primary_slugs, ARRAY[]::text[])) aps
          WHERE lower(aps) = (SELECT u_slug FROM u)
             OR regexp_replace(lower(aps), '[^a-z0-9]', '', 'g')
                = (SELECT u_norm FROM u)
        )
      )
    ) AS is_affiliated
  FROM base b
),

/* 3) Distance (km) */
dist AS (
  SELECT
    b.code,
    2 * 6371 * asin(
      sqrt(
        pow(sin(radians((b.lat - user_lat)/2)),2) +
        cos(radians(user_lat)) * cos(radians(b.lat)) *
        pow(sin(radians((b.lng - user_lng)/2)),2)
      )
    )::double precision AS distance_km
  FROM base b
),

/* 4) Gender filter */
gendered AS (
  SELECT b.*
  FROM base b
  WHERE
    coalesce(gender_pref,'Any') = 'Any'
    OR (gender_pref IN ('Co-ed','Mixed') AND b.gender IN ('Co-ed','Mixed'))
    OR (gender_pref = 'Boys'  AND b.gender = 'Boys')
    OR (gender_pref = 'Girls' AND b.gender = 'Girls')
),

/* 5) Expand COP ranges for target year */
cop_expanded AS (
  SELECT
    b.code,
    (x->>'year')::int                     AS year,
    NULLIF((x->>'posting_group')::int,0)  AS posting_group,  -- NULL => IP
    (x->>'nonaffiliated_min_score')::int  AS na_min,
    (x->>'nonaffiliated_max_score')::int  AS na_max,
    (x->>'affiliated_min_score')::int     AS af_min,
    (x->>'affiliated_max_score')::int     AS af_max
  FROM base b
  CROSS JOIN LATERAL jsonb_array_elements(b.cop_ranges) x
  WHERE (x->>'year')::int = in_year
),

/* 6) Eligibility rows for ANY band the student qualifies in */
ip_qual AS (
  SELECT
    ce.code,
    ce.posting_group,                             -- NULL
    COALESCE(ce.af_max, ce.na_max) AS pick_cutoff
  FROM cop_expanded ce
  WHERE ce.posting_group IS NULL
    AND user_score BETWEEN COALESCE(ce.af_min, ce.na_min)
                        AND COALESCE(ce.af_max, ce.na_max)
),
pg_aff_qual AS (
  SELECT
    ce.code,
    ce.posting_group,                             -- 1|2|3
    ce.af_max AS pick_cutoff
  FROM cop_expanded ce
  JOIN user_aff ua ON ua.code = ce.code AND ua.is_affiliated = TRUE
  WHERE ce.posting_group IN (1,2,3)
    AND ce.af_min IS NOT NULL AND ce.af_max IS NOT NULL
    AND user_score BETWEEN ce.af_min AND ce.af_max
),
pg_open_qual AS (
  SELECT
    ce.code,
    ce.posting_group,                             -- 1|2|3
    ce.na_max AS pick_cutoff
  FROM cop_expanded ce
  WHERE ce.posting_group IN (1,2,3)
    AND ce.na_min IS NOT NULL AND ce.na_max IS NOT NULL
    AND user_score BETWEEN ce.na_min AND ce.na_max
),

elig_rows AS (
  SELECT * FROM ip_qual
  UNION ALL
  SELECT * FROM pg_aff_qual
  UNION ALL
  SELECT * FROM pg_open_qual
),

/* 7) Main pick for ordering: best among ANY qualified rows
      - Prefer IP (posting_group NULL)
      - Else lower Posting Group (1 before 2 before 3)
      - Then lower cutoff (lower is better)
*/
cop_pick AS (
  SELECT DISTINCT ON (er.code)
    er.code,
    er.posting_group,
    er.pick_cutoff AS cop_max_score
  FROM elig_rows er
  ORDER BY er.code, er.posting_group NULLS FIRST, er.pick_cutoff ASC
),

/* 8) Display helpers (badges) */
ip_display AS (
  SELECT
    ce.code,
    COALESCE(ce.af_max, ce.na_max) AS ip_cutoff_max
  FROM cop_expanded ce
  WHERE ce.posting_group IS NULL
    AND user_score BETWEEN COALESCE(ce.af_min, ce.na_min)
                        AND COALESCE(ce.af_max, ce.na_max)
),
pg_aff_display AS (
  SELECT DISTINCT ON (ce.code)
    ce.code,
    ce.posting_group AS aff_pg,
    ce.af_max        AS aff_pg_cutoff_max
  FROM cop_expanded ce
  JOIN user_aff ua ON ua.code = ce.code AND ua.is_affiliated = TRUE
  WHERE ce.posting_group IN (1,2,3)
    AND ce.af_min IS NOT NULL AND ce.af_max IS NOT NULL
    AND user_score BETWEEN ce.af_min AND ce.af_max
  ORDER BY ce.code, ce.posting_group ASC
),
pg_open_display AS (
  SELECT DISTINCT ON (ce.code)
    ce.code,
    ce.posting_group AS open_pg,
    ce.na_max        AS open_pg_cutoff_max
  FROM cop_expanded ce
  WHERE ce.posting_group IN (1,2,3)
    AND ce.na_min IS NOT NULL AND ce.na_max IS NOT NULL
    AND user_score BETWEEN ce.na_min AND ce.na_max
  ORDER BY ce.code, ce.posting_group ASC
),

/* 9) SPORTS / CCA / CULTURE (same as before) */
sports_join AS (
  SELECT
    ss.code::text AS code,
    COALESCE(
      array_agg(DISTINCT ss.sport) FILTER (
        WHERE array_length(sports_selected,1) IS NOT NULL AND ss.sport = ANY(sports_selected)
      ), '{}'
    ) AS sports_matches,
    CASE
      WHEN array_length(sports_selected,1) IS NULL OR array_length(sports_selected,1) = 0 THEN 0.0
      ELSE AVG(LEAST(1.0, NULLIF(ss.score,0)::double precision / 100.0))
           FILTER (WHERE ss.sport = ANY(sports_selected))
    END AS sport_score_norm
  FROM public.school_sports_scores ss
  GROUP BY ss.code::text
),
cca_join AS (
  SELECT
    sc.code::text AS code,
    COALESCE(
      array_agg(DISTINCT sc.cca) FILTER (
        WHERE array_length(ccas_selected,1) IS NOT NULL AND sc.cca = ANY(ccas_selected)
      ), '{}'
    ) AS ccas_matches,
    CASE
      WHEN array_length(ccas_selected,1) IS NULL OR array_length(ccas_selected,1) = 0 THEN 0.0
      ELSE AVG(LEAST(1.0, NULLIF(sc.score,0)::double precision / 100.0))
           FILTER (WHERE sc.cca = ANY(ccas_selected))
    END AS cca_score_norm
  FROM public.school_cca_scores sc
  GROUP BY sc.code::text
),
culture_join AS (
  SELECT
    c.school_code::text AS code,
    COALESCE(
      array_agg(DISTINCT c.theme_key) FILTER (
        WHERE array_length(culture_selected,1) IS NOT NULL AND c.theme_key = ANY(culture_selected)
      ), '{}'
    ) AS culture_matches,
    CASE
      WHEN array_length(culture_selected,1) IS NULL OR array_length(culture_selected,1) = 0 THEN 0.0
      ELSE AVG(LEAST(1.0, GREATEST(0.0, c.score_norm_0_1::double precision)))
           FILTER (WHERE c.theme_key = ANY(culture_selected))
    END AS culture_score_norm
  FROM public.school_culture_scores c
  GROUP BY c.school_code::text
),

/* 10) Assemble + score */
dist_join AS (
  SELECT b.code, d.distance_km
  FROM base b
  JOIN dist d ON d.code = b.code
),
scored AS (
  SELECT
    g.code, b.name, b.address,
    dj.distance_km,
    cp.posting_group,
    cp.cop_max_score,
    ua.is_affiliated,
    id.ip_cutoff_max,
    pad.aff_pg, pad.aff_pg_cutoff_max,
    pod.open_pg, pod.open_pg_cutoff_max,
    sj.sports_matches,
    cj.ccas_matches,
    uj.culture_matches,
    CASE
      WHEN max_distance_km IS NULL OR max_distance_km <= 0 THEN 1.0
      ELSE GREATEST(0.0, LEAST(1.0,
        1.0 - (COALESCE(dj.distance_km,0)::double precision / NULLIF(max_distance_km,0))
      ))
    END AS distance_score_norm,
    COALESCE(sj.sport_score_norm,  0.0) AS sport_score_norm,
    COALESCE(cj.cca_score_norm,    0.0) AS cca_score_norm,
    COALESCE(uj.culture_score_norm,0.0) AS culture_score_norm
  FROM gendered g
  JOIN base b                   ON b.code = g.code
  JOIN dist_join dj             ON dj.code = g.code
  JOIN cop_pick cp              ON cp.code = g.code            -- ⬅️ qualifies under ANY band
  LEFT JOIN user_aff ua         ON ua.code = g.code
  LEFT JOIN ip_display id       ON id.code = g.code
  LEFT JOIN pg_aff_display pad  ON pad.code = g.code          -- ⬅️ shows Affiliated PG if qualified
  LEFT JOIN pg_open_display pod ON pod.code = g.code          -- ⬅️ shows Open PG if qualified
  LEFT JOIN sports_join sj      ON sj.code = g.code
  LEFT JOIN cca_join   cj       ON cj.code = g.code
  LEFT JOIN culture_join uj     ON uj.code = g.code
)

SELECT
  code, name, address,
  distance_km,
  posting_group,
  cop_max_score,
  is_affiliated,
  ip_cutoff_max,
  aff_pg, aff_pg_cutoff_max,
  open_pg, open_pg_cutoff_max,
  sports_matches,
  ccas_matches,
  culture_matches,
  (COALESCE(weight_dist,0)    * distance_score_norm) +
  (COALESCE(weight_sport,0)   * sport_score_norm   ) +
  (COALESCE(weight_cca,0)     * cca_score_norm     ) +
  (COALESCE(weight_culture,0) * culture_score_norm ) AS composite_score
FROM scored
WHERE (max_distance_km IS NULL) OR (distance_km <= max_distance_km)
ORDER BY
  cop_max_score ASC NULLS LAST,       -- lower COP first
  (posting_group IS NULL) DESC,       -- IP above O-level streams
  composite_score DESC,
  distance_km ASC
LIMIT GREATEST(1, COALESCE(limit_count, 6));
