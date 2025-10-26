-- ai_get_school_details.sql - FIXED VERSION
-- Purpose: Retrieve comprehensive details about a specific school by name or code
-- Schema: Based on EXACT schema from supabase_forclaude/Table_Schemas.txt

CREATE OR REPLACE FUNCTION ai_get_school_details(
  school_identifier TEXT
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
  WITH normalized_input AS (
    -- Normalize user input for flexible matching
    -- Example: "Raffles Institution" -> "raffles institution"
    SELECT
      LOWER(TRIM(school_identifier)) as search_term,
      LOWER(TRIM(REGEXP_REPLACE(school_identifier, '\(.*?\)', '', 'g'))) as search_term_no_parens
  ),
  matched_school AS (
    -- Find school from secondary_with_affiliations
    -- Database stores actual names like "Raffles Institution (Secondary)"
    SELECT s.*
    FROM secondary_with_affiliations s, normalized_input ni
    WHERE
      -- Match by code (if user provides numeric code)
      s.code::text = school_identifier
      -- Exact match (case insensitive)
      OR LOWER(s.name) = ni.search_term
      -- Partial match without parentheses (flexible matching)
      -- "raffles" matches "Raffles Institution (Secondary)"
      OR LOWER(REGEXP_REPLACE(s.name, '\(.*?\)', '', 'g')) LIKE '%' || ni.search_term_no_parens || '%'
      -- Partial name match (any occurrence)
      OR LOWER(s.name) LIKE '%' || ni.search_term || '%'
      -- Starts with match
      OR LOWER(s.name) LIKE ni.search_term || '%'
    ORDER BY
      -- Prioritize: code match > exact match > starts with > contains
      CASE WHEN s.code::text = school_identifier THEN 0 ELSE 1 END,
      CASE WHEN LOWER(s.name) = ni.search_term THEN 0 ELSE 1 END,
      CASE WHEN LOWER(s.name) LIKE ni.search_term || '%' THEN 0 ELSE 1 END,
      LENGTH(s.name)  -- Prefer shorter names (more specific matches)
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
    -- Get sports from school_sports_scores (has code integer column)
    SELECT
      ms.code,
      ARRAY_AGG(sss.sport ORDER BY sss.sport) AS all_sports,
      ARRAY_AGG(sss.sport ORDER BY sss.score DESC) FILTER (WHERE sss.score >= 60) AS top_sports
    FROM matched_school ms
    LEFT JOIN school_sports_scores sss ON sss.code = ms.code
    GROUP BY ms.code
  ),
  school_ccas AS (
    -- Get CCAs from school_cca_scores (code is TEXT in this table!)
    SELECT
      ms.code,
      ARRAY_AGG(scs.cca ORDER BY scs.cca) AS cca_categories
    FROM matched_school ms
    LEFT JOIN school_cca_scores scs ON scs.code = ms.code::text
    GROUP BY ms.code
  ),
  school_cca_achievements AS (
    -- Get CCA achievements from school_cca_details (code is integer)
    SELECT
      ms.code,
      ARRAY_AGG(DISTINCT scd.award ORDER BY scd.award)
        FILTER (WHERE scd.award IS NOT NULL) AS achievements
    FROM matched_school ms
    LEFT JOIN school_cca_details scd ON scd.code = ms.code
    GROUP BY ms.code
  ),
  school_culture AS (
    -- Get culture from school_culture_summaries (school_code is TEXT)
    SELECT
      ms.code,
      scs.short_summary,
      scs.long_summary
    FROM matched_school ms
    LEFT JOIN school_culture_summaries scs ON scs.school_code = ms.code::text
  ),
  school_culture_traits AS (
    -- Get culture traits from school_culture_scores (if exists)
    SELECT
      ms.code,
      ARRAY_AGG(sc.theme_title ORDER BY sc.final_strength DESC)
        FILTER (WHERE sc.theme_title IS NOT NULL) AS culture_traits
    FROM matched_school ms
    LEFT JOIN school_culture_scores sc ON sc.school_code = ms.code::text
    GROUP BY ms.code
  ),
  primary_affiliations AS (
    -- Extract affiliated primaries from JSONB in secondary_with_affiliations
    SELECT
      ms.code,
      ARRAY(
        SELECT ap->>'primary_name'
        FROM jsonb_array_elements(ms.affiliated_primaries) ap
        ORDER BY ap->>'primary_name'
      ) AS affiliated_primaries
    FROM matched_school ms
  )
  SELECT
    ms.code::TEXT,
    ms.name::TEXT,
    ms.address::TEXT,
    COALESCE(ms.gender, 'Co-ed')::TEXT,
    CASE
      WHEN cl.posting_group IS NULL THEN 'IP'
      ELSE 'O-Level'
    END::TEXT AS track,
    cl.posting_group::INT,
    cl.cop_max::INT,
    cl.cop_min::INT,
    COALESCE(pa.affiliated_primaries, ARRAY[]::TEXT[]),
    COALESCE(ss.all_sports, ARRAY[]::TEXT[]),
    COALESCE(ss.top_sports, ARRAY[]::TEXT[]),
    COALESCE(sc.cca_categories, ARRAY[]::TEXT[]),
    COALESCE(sca.achievements, ARRAY[]::TEXT[]),
    COALESCE(scu.short_summary, 'School culture information not available')::TEXT,
    COALESCE(sct.culture_traits, ARRAY[]::TEXT[]),
    CASE
      WHEN cl.posting_group IS NULL THEN 1200
      WHEN cl.posting_group = 3 THEN 1000
      WHEN cl.posting_group = 2 THEN 800
      ELSE 600
    END::INT,
    jsonb_build_object(
      'website', 'https://' || LOWER(REGEXP_REPLACE(ms.name, '[^a-zA-Z0-9]', '', 'g')) || '.moe.edu.sg',
      'phone', 'Contact school directly',
      'email', 'Check school website'
    )
  FROM matched_school ms
  LEFT JOIN cop_latest cl ON cl.code = ms.code
  LEFT JOIN school_sports ss ON ss.code = ms.code
  LEFT JOIN school_ccas sc ON sc.code = ms.code
  LEFT JOIN school_cca_achievements sca ON sca.code = ms.code
  LEFT JOIN school_culture scu ON scu.code = ms.code
  LEFT JOIN school_culture_traits sct ON sct.code = ms.code
  LEFT JOIN primary_affiliations pa ON pa.code = ms.code;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ai_get_school_details TO anon, authenticated, service_role;
