-- ai_search_schools_by_cca.sql
-- Search for schools with strong CCA (Co-Curricular Activities) programs
-- Similar structure to ai_search_schools_by_sport but for CCAs like Robotics, Math Olympiad, etc.

CREATE OR REPLACE FUNCTION ai_search_schools_by_cca(
  cca_name TEXT,
  gender_pref TEXT DEFAULT 'Any',
  track_pref TEXT DEFAULT 'Any',
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  address TEXT,
  gender TEXT,
  track TEXT,
  posting_group INT,
  cca_performance_score NUMERIC,
  cca_achievements TEXT[],
  cca_strength_rating TEXT,
  other_strong_ccas TEXT[],
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH cca_data AS (
    -- Get schools with performance data for the requested CCA
    SELECT
      scs.code::text as school_code,
      scs.cca,
      scs.score,
      CASE
        WHEN scs.score >= 80 THEN 'Very Strong'
        WHEN scs.score >= 60 THEN 'Strong'
        WHEN scs.score >= 40 THEN 'Fair'
        ELSE 'Developing'
      END AS strength_rating
    FROM school_cca_scores scs
    WHERE LOWER(scs.cca) = LOWER(cca_name)
      AND scs.year = 2023  -- Using 2023 as per your data
  ),
  cca_achievements AS (
    -- Get achievements from school_cca_details
    SELECT
      scd.code::text as school_code,
      ARRAY_AGG(DISTINCT
        CASE
          WHEN scd.position IS NOT NULL AND scd.position <= 3
            THEN 'Top ' || scd.position::text || ' finish'
          WHEN scd.award IS NOT NULL
            THEN scd.award
          ELSE NULL
        END
        ORDER BY CASE
          WHEN scd.position IS NOT NULL AND scd.position <= 3
            THEN 'Top ' || scd.position::text || ' finish'
          WHEN scd.award IS NOT NULL
            THEN scd.award
          ELSE NULL
        END
      ) FILTER (WHERE scd.position <= 3 OR scd.award IS NOT NULL) AS achievements
    FROM school_cca_details scd
    WHERE LOWER(scd.cca) = LOWER(cca_name)
      AND scd.year >= 2023
    GROUP BY scd.code
  ),
  other_ccas AS (
    -- Get other strong CCAs for each school
    SELECT
      scs2.code::text as school_code,
      ARRAY_AGG(scs2.cca ORDER BY scs2.score DESC)
        FILTER (WHERE scs2.score >= 60 AND LOWER(scs2.cca) != LOWER(cca_name)) AS strong_ccas
    FROM school_cca_scores scs2
    WHERE scs2.year = 2023
    GROUP BY scs2.code
  ),
  cop_latest AS (
    -- Extract posting_group from cop_ranges
    SELECT
      s.code as school_code,
      NULLIF((elem->>'posting_group'), '')::int as posting_group
    FROM secondary_with_affiliations s
    CROSS JOIN LATERAL (
      SELECT e as elem
      FROM jsonb_array_elements(s.cop_ranges) e
      ORDER BY (e->>'year')::int DESC
      LIMIT 1
    ) x
  )
  SELECT
    s.code::TEXT,
    s.name::TEXT,
    s.address::TEXT,
    COALESCE(s.gender, 'Co-ed')::TEXT,
    CASE
      WHEN cl.posting_group IS NULL THEN 'IP'
      ELSE 'O-Level'
    END::TEXT,
    cl.posting_group::INT,
    COALESCE(cd.score, 0)::NUMERIC,
    COALESCE(ca.achievements, ARRAY[]::TEXT[]),
    COALESCE(cd.strength_rating, 'No Data')::TEXT,
    COALESCE(oc.strong_ccas, ARRAY[]::TEXT[]),
    CASE
      WHEN cd.score >= 80 THEN
        format('Exceptional %s program with outstanding achievements', cca_name)
      WHEN cd.score >= 60 THEN
        format('Strong %s program with notable competition results', cca_name)
      WHEN cd.score >= 40 THEN
        format('Developing %s program with growing participation', cca_name)
      ELSE
        format('Offers %s program - check with school for details', cca_name)
    END::TEXT
  FROM secondary_with_affiliations s
  LEFT JOIN cop_latest cl ON cl.school_code = s.code
  LEFT JOIN cca_data cd ON cd.school_code = s.code::text
  LEFT JOIN cca_achievements ca ON ca.school_code = s.code::text
  LEFT JOIN other_ccas oc ON oc.school_code = s.code::text
  WHERE
    -- Gender filter
    (
      gender_pref = 'Any'
      OR COALESCE(s.gender, 'Co-ed') = gender_pref
      OR (gender_pref IN ('Co-ed', 'Mixed') AND COALESCE(s.gender, 'Co-ed') IN ('Co-ed', 'Mixed'))
    )
    -- Track filter
    AND (
      track_pref = 'Any'
      OR (track_pref = 'IP' AND cl.posting_group IS NULL)
      OR (track_pref = 'O-Level' AND cl.posting_group IS NOT NULL)
    )
    -- Must have CCA data
    AND cd.score IS NOT NULL
  ORDER BY
    COALESCE(cd.score, 0) DESC,
    CASE WHEN cl.posting_group IS NULL THEN 0 ELSE 1 END,
    CASE WHEN cl.posting_group IS NULL THEN 999 ELSE cl.posting_group END DESC,
    s.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ai_search_schools_by_cca TO anon, authenticated, service_role;

COMMENT ON FUNCTION ai_search_schools_by_cca IS 'Search for schools with strong CCA programs. Returns schools ranked by CCA performance with detailed achievement data. Supports filtering by gender and track (IP/O-Level).';
