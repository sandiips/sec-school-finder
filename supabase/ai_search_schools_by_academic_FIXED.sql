-- ai_search_schools_by_academic.sql - FIXED VERSION
-- Schema: Based on EXACT schema from supabase_forclaude/Table_Schemas.txt
-- school_cca_scores: code (TEXT), school_slug, cca, score, year
-- school_cca_details: code (integer), school_slug, cca, event_name, award, etc.

CREATE OR REPLACE FUNCTION ai_search_schools_by_academic(
  academic_focus TEXT DEFAULT 'Overall',
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
  cop_max_score INT,
  academic_strength_score NUMERIC,
  cca_achievements TEXT[],
  cca_strength_rating TEXT,
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH cca_scores_data AS (
    -- Get CCA scores for specific academic focus (code is TEXT in school_cca_scores!)
    SELECT
      scs.code::integer as code,
      scs.cca,
      scs.score,
      CASE
        WHEN scs.score >= 80 THEN 'Very Strong'
        WHEN scs.score >= 60 THEN 'Strong'
        WHEN scs.score >= 40 THEN 'Fair'
        ELSE 'Developing'
      END AS strength_rating
    FROM school_cca_scores scs
    WHERE
      (academic_focus = 'Overall' OR LOWER(scs.cca) = LOWER(academic_focus))
      AND scs.year = 2024
  ),
  cca_achievements AS (
    -- Get CCA achievements from school_cca_details (code is integer)
    SELECT
      scd.code,
      ARRAY_AGG(DISTINCT scd.award ORDER BY scd.award)
        FILTER (WHERE scd.award IS NOT NULL) AS achievements
    FROM school_cca_details scd
    WHERE
      (academic_focus = 'Overall' OR LOWER(scd.cca) = LOWER(academic_focus))
      AND scd.year >= 2022
    GROUP BY scd.code
  ),
  cop_latest AS (
    -- Extract posting_group and COP from cop_ranges
    SELECT
      s.code,
      NULLIF((elem->>'posting_group'), '')::int as posting_group,
      NULLIF((elem->>'nonaffiliated_max_score'), '')::int as cop_max
    FROM secondary_with_affiliations s
    CROSS JOIN LATERAL (
      SELECT e as elem
      FROM jsonb_array_elements(s.cop_ranges) e
      ORDER BY (e->>'year')::int DESC
      LIMIT 1
    ) x
  ),
  overall_academic AS (
    -- Calculate overall academic strength
    SELECT
      cl.code,
      CASE
        WHEN cl.posting_group IS NULL THEN 100  -- IP schools
        WHEN cl.posting_group = 3 AND cl.cop_max <= 10 THEN 90
        WHEN cl.posting_group = 3 AND cl.cop_max <= 15 THEN 80
        WHEN cl.posting_group = 3 THEN 70
        WHEN cl.posting_group = 2 AND cl.cop_max <= 20 THEN 60
        WHEN cl.posting_group = 2 THEN 50
        WHEN cl.posting_group = 1 THEN 40
        ELSE 30
      END AS overall_score
    FROM cop_latest cl
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
    cl.cop_max::INT,
    CASE
      WHEN academic_focus = 'Overall' THEN COALESCE(oa.overall_score, 0)
      ELSE COALESCE(csd.score, 0)
    END::NUMERIC,
    COALESCE(ca.achievements, ARRAY[]::TEXT[]),
    COALESCE(csd.strength_rating, 'No Data')::TEXT,
    CASE
      -- IP track recommendations
      WHEN cl.posting_group IS NULL AND academic_focus = 'Overall' THEN
        format('Top-tier Integrated Program school with 6-year pathway (COP: %s)', cl.cop_max)
      WHEN cl.posting_group IS NULL AND csd.score >= 80 THEN
        format('Prestigious IP school with exceptional %s program', academic_focus)
      WHEN cl.posting_group IS NULL AND csd.score >= 60 THEN
        format('Strong IP school with notable %s program', academic_focus)
      -- O-Level track
      WHEN cl.posting_group = 3 AND cl.cop_max <= 10 AND academic_focus = 'Overall' THEN
        format('Premier autonomous school (COP: %s)', cl.cop_max)
      WHEN cl.posting_group = 3 AND academic_focus = 'Overall' THEN
        format('Top-tier Posting Group 3 school (COP: %s)', cl.cop_max)
      -- CCA-specific
      WHEN csd.score >= 80 THEN
        format('Exceptional %s program with consistent high performance', academic_focus)
      WHEN csd.score >= 60 THEN
        format('Strong %s program with notable achievements', academic_focus)
      WHEN csd.score >= 40 THEN
        format('Developing %s program', academic_focus)
      -- General
      WHEN cl.posting_group = 2 THEN
        format('Solid Posting Group 2 school (COP: %s)', cl.cop_max)
      ELSE
        format('Established secondary school (COP: %s)', cl.cop_max)
    END::TEXT
  FROM secondary_with_affiliations s
  LEFT JOIN cop_latest cl ON cl.code = s.code
  LEFT JOIN cca_scores_data csd ON csd.code = s.code
  LEFT JOIN cca_achievements ca ON ca.code = s.code
  LEFT JOIN overall_academic oa ON oa.code = s.code
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
    -- For specific CCA focus, only show schools with that CCA data
    AND (
      academic_focus = 'Overall'
      OR csd.score IS NOT NULL
    )
  ORDER BY
    -- Primary: Academic strength score
    CASE
      WHEN academic_focus = 'Overall' THEN COALESCE(oa.overall_score, 0)
      ELSE COALESCE(csd.score, 0)
    END DESC,
    -- Secondary: IP schools first
    CASE WHEN cl.posting_group IS NULL THEN 0 ELSE 1 END,
    -- Tertiary: Posting group
    CASE WHEN cl.posting_group IS NULL THEN 999 ELSE cl.posting_group END DESC,
    -- Quaternary: COP score (lower is better)
    CASE WHEN cl.cop_max IS NULL THEN 999 ELSE cl.cop_max END,
    -- Quinary: School name
    s.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ai_search_schools_by_academic TO anon, authenticated, service_role;
