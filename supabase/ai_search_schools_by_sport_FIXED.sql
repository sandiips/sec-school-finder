-- ai_search_schools_by_sport.sql - FIXED VERSION
-- Schema: Based on EXACT schema from supabase_forclaude/Table_Schemas.txt
-- school_sports_scores: code (integer), school_slug (text), sport, score, year
-- school_sport_results: code (text), sport, year, placement, medal, etc.

CREATE OR REPLACE FUNCTION ai_search_schools_by_sport(
  sport_name TEXT,
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
    -- school_sports_scores has code (integer)
    SELECT
      sss.code,
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
      AND sss.year = 2024
  ),
  sport_achievements AS (
    -- Get achievements from school_sport_results (code is TEXT here!)
    SELECT
      ssr.code::integer as code,
      ARRAY_AGG(DISTINCT
        CASE
          WHEN ssr.medal IS NOT NULL THEN ssr.medal || ' medal'
          WHEN ssr.placement <= 3 THEN 'Top ' || ssr.placement::text || ' finish'
          ELSE NULL
        END
        ORDER BY CASE
          WHEN ssr.medal IS NOT NULL THEN ssr.medal || ' medal'
          WHEN ssr.placement <= 3 THEN 'Top ' || ssr.placement::text || ' finish'
          ELSE NULL
        END
      ) FILTER (WHERE ssr.medal IS NOT NULL OR ssr.placement <= 3) AS achievements
    FROM school_sport_results ssr
    WHERE LOWER(ssr.sport) = LOWER(sport_name)
      AND ssr.year >= 2022
    GROUP BY ssr.code
  ),
  other_sports AS (
    -- Get other strong sports for each school
    SELECT
      code,
      ARRAY_AGG(sport ORDER BY score DESC)
        FILTER (WHERE score >= 60 AND LOWER(sport) != LOWER(sport_name)) AS strong_sports
    FROM school_sports_scores
    WHERE year = 2024
    GROUP BY code
  ),
  cop_latest AS (
    -- Extract posting_group from cop_ranges
    SELECT
      s.code,
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
    COALESCE(sd.score, 0)::NUMERIC,
    COALESCE(sa.achievements, ARRAY[]::TEXT[]),
    COALESCE(sd.strength_rating, 'No Data')::TEXT,
    COALESCE(os.strong_sports, ARRAY[]::TEXT[]),
    CASE
      WHEN sd.score >= 80 THEN
        format('Exceptional %s program with consistent top-tier performance', sport_name)
      WHEN sd.score >= 60 THEN
        format('Strong %s program with notable achievements', sport_name)
      WHEN sd.score >= 40 THEN
        format('Developing %s program with growing competitive presence', sport_name)
      ELSE
        format('Offers %s program - check with school for details', sport_name)
    END::TEXT
  FROM secondary_with_affiliations s
  LEFT JOIN cop_latest cl ON cl.code = s.code
  LEFT JOIN sport_data sd ON sd.code = s.code
  LEFT JOIN sport_achievements sa ON sa.code = s.code
  LEFT JOIN other_sports os ON os.code = s.code
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
    -- Must have sport data
    AND sd.score IS NOT NULL
  ORDER BY
    COALESCE(sd.score, 0) DESC,
    CASE WHEN cl.posting_group IS NULL THEN 0 ELSE 1 END,
    CASE WHEN cl.posting_group IS NULL THEN 999 ELSE cl.posting_group END DESC,
    s.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ai_search_schools_by_sport TO anon, authenticated, service_role;
