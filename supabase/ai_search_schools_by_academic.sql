-- ai_search_schools_by_academic.sql
-- Purpose: Search and rank secondary schools by academic performance and specific academic programs
-- Used by: Intent 3 (Academic Rankings) - "What are the top IP schools?" or "Best schools for Math Olympiad?"
-- Returns: Top schools ranked by academic criteria
-- Schema: Uses school_cca_scores (school_slug, cca, score) joined to schools (code)

CREATE OR REPLACE FUNCTION ai_search_schools_by_academic(
  academic_focus TEXT DEFAULT 'Overall',  -- 'Overall', 'Astronomy', 'Chemistry Olympiad', 'Math Olympiad', 'Robotics', 'National STEM'
  gender_pref TEXT DEFAULT 'Any',         -- Gender preference: 'Any', 'Boys', 'Girls', 'Co-ed', 'Mixed'
  track_pref TEXT DEFAULT 'Any',          -- Track preference: 'Any', 'IP', 'O-Level'
  limit_count INT DEFAULT 10              -- Number of results to return
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
  WITH cca_data AS (
    -- Get CCA performance data if academic_focus matches a CCA category
    -- school_cca_scores uses school_slug (text) which matches schools.code::text
    SELECT
      scs.school_slug,
      scs.cca,
      scs.score AS cca_score,
      CASE
        WHEN scs.score >= 80 THEN 'Very Strong'
        WHEN scs.score >= 60 THEN 'Strong'
        WHEN scs.score >= 40 THEN 'Fair'
        ELSE 'Developing'
      END AS strength_rating
    FROM school_cca_scores scs
    WHERE
      (academic_focus = 'Overall' OR LOWER(scs.cca) = LOWER(academic_focus))
  ),
  cop_latest AS (
    -- Extract latest COP data for track/posting_group info
    SELECT
      s.code,
      (elem->>'posting_group')::text as pg_text,
      NULLIF((elem->>'posting_group'), '')::int as posting_group,
      NULLIF((elem->>'nonaffiliated_max_score'), '')::int as cop_max
    FROM schools s
    CROSS JOIN LATERAL (
      SELECT e as elem
      FROM jsonb_array_elements(s.cop_ranges) e
      ORDER BY (e->>'year')::int DESC
      LIMIT 1
    ) x
  ),
  overall_academic AS (
    -- Calculate overall academic strength based on cut-off scores and track
    SELECT
      cl.code,
      CASE
        -- IP schools get highest base score
        WHEN cl.posting_group IS NULL THEN 100
        -- PG3 schools with low cut-offs get high scores
        WHEN cl.posting_group = 3 AND cl.cop_max <= 10 THEN 90
        WHEN cl.posting_group = 3 AND cl.cop_max <= 15 THEN 80
        WHEN cl.posting_group = 3 THEN 70
        -- PG2 schools
        WHEN cl.posting_group = 2 AND cl.cop_max <= 20 THEN 60
        WHEN cl.posting_group = 2 THEN 50
        -- PG1 schools
        WHEN cl.posting_group = 1 THEN 40
        ELSE 30
      END AS overall_score
    FROM cop_latest cl
  )
  SELECT
    s.code::TEXT,
    s.name::TEXT,
    s.address::TEXT,
    COALESCE(s.gender, 'Co-ed')::TEXT as gender,
    CASE
      WHEN cl.posting_group IS NULL THEN 'IP'
      ELSE 'O-Level'
    END::TEXT AS track,
    cl.posting_group::INT,
    cl.cop_max::INT AS cop_max_score,
    CASE
      WHEN academic_focus = 'Overall' THEN COALESCE(oa.overall_score, 0)
      ELSE COALESCE(cd.cca_score, 0)
    END::NUMERIC AS academic_strength_score,
    ARRAY[]::TEXT[] AS cca_achievements,  -- No achievement details in current schema
    COALESCE(cd.strength_rating, 'No Data')::TEXT AS cca_strength_rating,
    CASE
      -- IP track recommendations
      WHEN cl.posting_group IS NULL AND academic_focus = 'Overall' THEN
        format('Top-tier Integrated Program school with 6-year pathway to A-Levels/IB (COP: %s)', cl.cop_max)
      WHEN cl.posting_group IS NULL AND cd.cca_score >= 80 THEN
        format('Prestigious IP school with exceptional %s program and national-level achievements', academic_focus)
      WHEN cl.posting_group IS NULL AND cd.cca_score >= 60 THEN
        format('Strong IP school with notable %s program and competitive track record', academic_focus)

      -- O-Level track with strong academics
      WHEN cl.posting_group = 3 AND cl.cop_max <= 10 AND academic_focus = 'Overall' THEN
        format('Premier autonomous school with excellent academic results (COP: %s)', cl.cop_max)
      WHEN cl.posting_group = 3 AND academic_focus = 'Overall' THEN
        format('Top-tier Posting Group 3 school with strong academic programs (COP: %s)', cl.cop_max)

      -- CCA-specific recommendations
      WHEN cd.cca_score >= 80 THEN
        format('Exceptional %s program with consistent high performance', academic_focus)
      WHEN cd.cca_score >= 60 THEN
        format('Strong %s program with notable achievements', academic_focus)
      WHEN cd.cca_score >= 40 THEN
        format('Developing %s program with growing competitive presence', academic_focus)

      -- General recommendations
      WHEN cl.posting_group = 2 THEN
        format('Solid Posting Group 2 school with balanced academic programs (COP: %s)', cl.cop_max)
      ELSE
        format('Established secondary school with comprehensive academic offerings (COP: %s)', cl.cop_max)
    END::TEXT AS recommendation_reason
  FROM schools s
  LEFT JOIN cop_latest cl ON cl.code = s.code
  LEFT JOIN cca_data cd ON cd.school_slug = s.code::text
  LEFT JOIN overall_academic oa ON oa.code = s.code
  WHERE
    -- Gender filter (handle Mixed as Co-ed)
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
    -- For specific CCA focus, only show schools with that CCA data OR all for Overall
    AND (
      academic_focus = 'Overall'
      OR cd.cca_score IS NOT NULL
    )
  ORDER BY
    -- Primary: Academic strength score (higher is better)
    CASE
      WHEN academic_focus = 'Overall' THEN COALESCE(oa.overall_score, 0)
      ELSE COALESCE(cd.cca_score, 0)
    END DESC,
    -- Secondary: Track (IP schools first - NULL posting_group means IP)
    CASE WHEN cl.posting_group IS NULL THEN 0 ELSE 1 END,
    -- Tertiary: Posting group (PG3=3 is best)
    CASE WHEN cl.posting_group IS NULL THEN 999 ELSE cl.posting_group END DESC,
    -- Quaternary: COP score (lower is better - more competitive)
    CASE WHEN cl.cop_max IS NULL THEN 999 ELSE cl.cop_max END,
    -- Quinary: School name
    s.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ai_search_schools_by_academic TO anon, authenticated, service_role;

-- Example usage:
-- SELECT * FROM ai_search_schools_by_academic('Overall', 'Any', 'IP', 10);  -- Top IP schools
-- SELECT * FROM ai_search_schools_by_academic('Math Olympiad', 'Any', 'Any', 10);  -- Best Math Olympiad schools
-- SELECT * FROM ai_search_schools_by_academic('Overall', 'Girls', 'Any', 10);  -- Top girls' schools
