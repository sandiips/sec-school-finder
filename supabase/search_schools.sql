
SELECT
  s.code,
  s.name,
  s.address,

  -- pick the right posting_group
  CASE
    WHEN sa.secondary_code IS NOT NULL THEN best.affiliated_posting_group
    ELSE best.nonaffiliated_posting_group
  END AS posting_group,

  (sa.secondary_code IS NOT NULL) AS is_affiliated,

  -- likewise choose the COP max
  CASE
    WHEN sa.secondary_code IS NOT NULL THEN best.affiliated_max_score
    ELSE best.nonaffiliated_max_score
  END AS match_max_score,

  -- call earth_distance for ordering by true miles
  earth_distance(
    ll_to_earth(user_lat, user_lng),
    ll_to_earth(s.lat, s.lng)
  ) AS distance_m

FROM public.schools s

  -- link to your affiliations table by slugifying the primary name
  LEFT JOIN public.secondary_affiliations sa
    ON sa.secondary_code = s.code
   AND regexp_replace(
         lower(sa.primary_name),
         '[^a-z0-9]+','-','g'
       ) = user_primary

  -- unpack COP ranges from your JSONB column into rows
  CROSS JOIN LATERAL (
    SELECT
      r.posting_group      AS nonaffiliated_posting_group,  -- from non‑aff branch
      r.affiliated_posting_group,                           -- from aff branch
      r.nonaffiliated_max_score,
      r.affiliated_max_score
    FROM jsonb_to_recordset(s.cop_ranges) AS r(
      year                         int,
      posting_group               int,
      affiliated_min_score        int,
      affiliated_qualifier        text,
      affiliated_posting_group    int,
      affiliated_max_score        int,
      affiliated_max_qualifier    text,
      nonaffiliated_min_score     int,
      nonaffiliated_qualifier     text,
      nonaffiliated_posting_group int,
      nonaffiliated_max_score     int,
      nonaffiliated_max_qualifier text
    )
    WHERE
      r.year = 2024
      AND (
        sa.secondary_code IS NOT NULL
        OR user_score <= r.nonaffiliated_max_score
      )
    ORDER BY
      -- pick the “easiest” COP for the student
      CASE
        WHEN sa.secondary_code IS NOT NULL THEN r.affiliated_max_score
        ELSE r.nonaffiliated_max_score
      END
    ASC
    LIMIT 1
  ) AS best

WHERE
  -- COP filter for non‑affiliated: you must be <= max
  (sa.secondary_code IS NULL AND user_score <= best.nonaffiliated_max_score)
  OR
  -- affiliated always pass
  sa.secondary_code IS NOT NULL

ORDER BY distance_m
LIMIT limit_count;

