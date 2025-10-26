-- ai_get_school_details.sql
-- Purpose: Retrieve comprehensive details about a specific school by name or code
-- Used by: Intent 4 (School Information) - "Tell me about Raffles Institution" or "What's special about ACSI?"
-- Returns: Single school with complete profile information
-- Schema: Uses schools (code integer), school_sports_scores (school_slug), school_cca_scores (school_slug), school_culture_scores (school_code), secondary_affiliations (secondary_code)

CREATE OR REPLACE FUNCTION ai_get_school_details(
  school_identifier TEXT  -- School name (partial match) or school code (exact match)
)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  address TEXT,
  gender TEXT,
  track TEXT,
  posting_group INT,
  cop_max_score INT,
  cop_min_score INT,
  affiliated_primary_schools TEXT[],
  available_sports TEXT[],
  top_sports TEXT[],
  available_ccas TEXT[],
  cca_achievements TEXT[],
  culture_summary TEXT,
  culture_traits TEXT[],
  total_enrollment INT,
  contact_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH matched_school AS (
    -- Find school by code or name (case-insensitive partial match)
    -- schools.code is integer, need to cast for comparison
    SELECT s.*
    FROM schools s
    WHERE
      s.code::text = school_identifier  -- Exact code match
      OR LOWER(s.name) = LOWER(school_identifier)  -- Exact name match
      OR LOWER(s.name) LIKE '%' || LOWER(school_identifier) || '%'  -- Partial name match
    ORDER BY
      -- Prioritize exact code match
      CASE WHEN s.code::text = school_identifier THEN 0 ELSE 1 END,
      -- Then exact name match
      CASE WHEN LOWER(s.name) = LOWER(school_identifier) THEN 0 ELSE 1 END,
      -- Then name starts with identifier
      CASE WHEN LOWER(s.name) LIKE LOWER(school_identifier) || '%' THEN 0 ELSE 1 END,
      -- Finally alphabetical
      s.name
    LIMIT 1
  ),
  cop_latest AS (
    -- Extract latest COP data
    SELECT
      ms.code,
      NULLIF((elem->>'posting_group'), '')::int as posting_group,
      NULLIF((elem->>'nonaffiliated_max_score'), '')::int as cop_max,
      NULLIF((elem->>'nonaffiliated_min_score'), '')::int as cop_min
    FROM matched_school ms
    CROSS JOIN LATERAL (
      SELECT e as elem
      FROM jsonb_array_elements(ms.cop_ranges) e
      ORDER BY (e->>'year')::int DESC
      LIMIT 1
    ) x
  ),
  school_sports AS (
    -- Get all available sports and identify top performers
    -- school_sports_scores uses school_slug (text) which matches schools.code::text
    SELECT
      ms.code,
      ARRAY_AGG(DISTINCT sss.sport ORDER BY sss.sport) AS all_sports,
      ARRAY_AGG(DISTINCT sss.sport ORDER BY sss.score DESC)
        FILTER (WHERE sss.score >= 60) AS top_sports
    FROM matched_school ms
    LEFT JOIN school_sports_scores sss ON sss.school_slug = ms.code::text
    GROUP BY ms.code
  ),
  school_ccas AS (
    -- Get all CCA categories from school_cca_scores
    -- school_cca_scores uses school_slug (text)
    SELECT
      ms.code,
      ARRAY_AGG(DISTINCT scs.cca ORDER BY scs.cca) AS cca_categories
    FROM matched_school ms
    LEFT JOIN school_cca_scores scs ON scs.school_slug = ms.code::text
    GROUP BY ms.code
  ),
  school_culture AS (
    -- Get culture data from school_culture_scores (uses school_code text)
    SELECT
      ms.code,
      ARRAY_AGG(DISTINCT sc.theme_title ORDER BY sc.final_strength DESC)
        FILTER (WHERE sc.theme_title IS NOT NULL)
        AS culture_traits
    FROM matched_school ms
    LEFT JOIN school_culture_scores sc ON sc.school_code = ms.code::text
    GROUP BY ms.code
    LIMIT 1
  ),
  school_affiliations AS (
    -- Get affiliated primary schools from secondary_affiliations
    SELECT
      ms.code,
      ARRAY_AGG(DISTINCT sa.primary_name ORDER BY sa.primary_name)
        FILTER (WHERE sa.primary_name IS NOT NULL) AS affiliated_primaries
    FROM matched_school ms
    LEFT JOIN secondary_affiliations sa ON sa.secondary_code = ms.code
    GROUP BY ms.code
  )
  SELECT
    ms.code::TEXT,
    ms.name::TEXT,
    ms.address::TEXT,
    COALESCE(ms.gender, 'Co-ed')::TEXT as gender,
    CASE
      WHEN cl.posting_group IS NULL THEN 'IP'
      ELSE 'O-Level'
    END::TEXT AS track,
    cl.posting_group::INT,
    cl.cop_max::INT AS cop_max_score,
    cl.cop_min::INT AS cop_min_score,
    COALESCE(saf.affiliated_primaries, ARRAY[]::TEXT[]) AS affiliated_primary_schools,
    COALESCE(ss.all_sports, ARRAY[]::TEXT[]) AS available_sports,
    COALESCE(ss.top_sports, ARRAY[]::TEXT[]) AS top_sports,
    COALESCE(sc.cca_categories, ARRAY[]::TEXT[]) AS available_ccas,
    ARRAY[]::TEXT[] AS cca_achievements,  -- No achievement details in current schema
    'View school website for detailed culture information'::TEXT AS culture_summary,  -- No summary table
    COALESCE(scu.culture_traits, ARRAY[]::TEXT[]) AS culture_traits,
    -- Estimate enrollment based on track and posting group
    CASE
      WHEN cl.posting_group IS NULL THEN 1200  -- IP schools typically larger
      WHEN cl.posting_group = 3 THEN 1000
      WHEN cl.posting_group = 2 THEN 800
      ELSE 600
    END::INT AS total_enrollment,
    -- Contact info (MOE website pattern)
    jsonb_build_object(
      'website', CASE
        WHEN ms.name IS NOT NULL THEN
          'https://' || LOWER(REGEXP_REPLACE(ms.name, '[^a-zA-Z0-9]', '', 'g')) || '.moe.edu.sg'
        ELSE NULL
      END,
      'phone', 'Contact school directly',
      'email', 'Check school website'
    ) AS contact_info
  FROM matched_school ms
  LEFT JOIN cop_latest cl ON cl.code = ms.code
  LEFT JOIN school_sports ss ON ss.code = ms.code
  LEFT JOIN school_ccas sc ON sc.code = ms.code
  LEFT JOIN school_culture scu ON scu.code = ms.code
  LEFT JOIN school_affiliations saf ON saf.code = ms.code;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ai_get_school_details TO anon, authenticated, service_role;

-- Example usage:
-- SELECT * FROM ai_get_school_details('1204');  -- By school code
-- SELECT * FROM ai_get_school_details('Raffles Institution');  -- By exact name
-- SELECT * FROM ai_get_school_details('Raffles');  -- By partial name
-- SELECT * FROM ai_get_school_details('ACSI');  -- By abbreviation
