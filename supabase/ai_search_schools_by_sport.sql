-- ai_search_schools_by_sport.sql
-- Purpose: Search and rank secondary schools by specific sport performance
-- Used by: Intent 2 (Sport Rankings) - "Which schools are best for tennis?"
-- Returns: Top schools with strong performance in the specified sport
-- Schema: Uses school_sports_scores (school_slug, sport, score) joined to schools (code)

CREATE OR REPLACE FUNCTION ai_search_schools_by_sport(
  sport_name TEXT,                    -- Sport to search for (e.g., "Tennis", "Basketball")
  gender_pref TEXT DEFAULT 'Any',     -- Gender preference: 'Any', 'Boys', 'Girls', 'Co-ed', 'Mixed'
  track_pref TEXT DEFAULT 'Any',      -- Track preference: 'Any', 'IP', 'O-Level'
  limit_count INT DEFAULT 10          -- Number of results to return
)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  address TEXT,
  gender TEXT,
  track TEXT,
  posting_group INT,
  sport_performance_score NUMERIC,
  sport_achievements TEXT[],
  sport_strength_rating TEXT,
  other_strong_sports TEXT[],
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH sport_data AS (
    -- Get schools with performance data for the requested sport
    -- school_sports_scores uses school_slug (text) which matches schools.code::text
    SELECT
      sss.school_slug,
      sss.sport,
      sss.score,
      CASE
        WHEN sss.score >= 80 THEN 'Very Strong'
        WHEN sss.score >= 60 THEN 'Strong'
        WHEN sss.score >= 40 THEN 'Fair'
        ELSE 'Developing'
      END AS strength_rating
    FROM school_sports_scores sss
    WHERE LOWER(sss.sport) = LOWER(sport_name)
  ),
  other_sports AS (
    -- Get other strong sports (score >= 60) for each school
    SELECT
      school_slug,
      ARRAY_AGG(sport ORDER BY score DESC)
        FILTER (WHERE score >= 60 AND LOWER(sport) != LOWER(sport_name)) AS strong_sports
    FROM school_sports_scores
    GROUP BY school_slug
  ),
  cop_latest AS (
    -- Extract latest COP data for track/posting_group info
    SELECT
      s.code,
      (elem->>'posting_group')::text as pg_text,
      NULLIF((elem->>'posting_group'), '')::int as posting_group
    FROM schools s
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
    COALESCE(s.gender, 'Co-ed')::TEXT as gender,
    CASE
      WHEN cl.posting_group IS NULL THEN 'IP'
      ELSE 'O-Level'
    END::TEXT AS track,
    cl.posting_group::INT,
    COALESCE(sd.score, 0)::NUMERIC AS sport_performance_score,
    ARRAY[]::TEXT[] AS sport_achievements,  -- No achievement data in current schema
    COALESCE(sd.strength_rating, 'No Data')::TEXT AS sport_strength_rating,
    COALESCE(os.strong_sports, ARRAY[]::TEXT[]) AS other_strong_sports,
    CASE
      WHEN sd.score >= 80 THEN
        format('Exceptional %s program with consistent top-tier performance in national competitions', sport_name)
      WHEN sd.score >= 60 THEN
        format('Strong %s program with notable achievements and competitive track record', sport_name)
      WHEN sd.score >= 40 THEN
        format('Developing %s program with growing competitive presence', sport_name)
      ELSE
        format('Offers %s program - check with school for current program details', sport_name)
    END::TEXT AS recommendation_reason
  FROM schools s
  LEFT JOIN cop_latest cl ON cl.code = s.code
  LEFT JOIN sport_data sd ON sd.school_slug = s.code::text
  LEFT JOIN other_sports os ON os.school_slug = s.code::text
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
    -- Must have sport data for the requested sport
    AND sd.score IS NOT NULL
  ORDER BY
    -- Primary: Sport performance score (higher is better)
    COALESCE(sd.score, 0) DESC,
    -- Secondary: Track (IP schools first - NULL posting_group means IP)
    CASE WHEN cl.posting_group IS NULL THEN 0 ELSE 1 END,
    -- Tertiary: Posting group (PG3=3 is best)
    CASE WHEN cl.posting_group IS NULL THEN 999 ELSE cl.posting_group END DESC,
    -- Quaternary: School name
    s.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ai_search_schools_by_sport TO anon, authenticated, service_role;

-- Example usage:
-- SELECT * FROM ai_search_schools_by_sport('Tennis', 'Any', 'Any', 10);
-- SELECT * FROM ai_search_schools_by_sport('Basketball', 'Boys', 'IP', 5);
-- SELECT * FROM ai_search_schools_by_sport('Swimming', 'Any', 'O-Level', 10);
