-- ai_search_schools_by_affiliation.sql
-- Finds secondary schools affiliated with a given primary school
-- Takes primary school name/slug and returns matching secondary schools with affiliation details

CREATE OR REPLACE FUNCTION ai_search_schools_by_affiliation(
  primary_school_input TEXT
)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  address TEXT,
  gender TEXT,
  track TEXT,
  posting_group INT,
  cop_nonaffiliated_max INT,
  cop_nonaffiliated_min INT,
  cop_affiliated_max INT,
  cop_affiliated_min INT,
  affiliation_bonus_points INT,
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH normalized_input AS (
    -- Normalize the input to match both name and slug formats
    SELECT
      LOWER(TRIM(primary_school_input)) AS search_text,
      LOWER(TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(primary_school_input, '''', '', 'g'),  -- Remove apostrophes
          '[^a-z0-9\s-]', '', 'g'                                -- Remove special chars except hyphens
        ),
        '\s+', '-', 'g'                                          -- Replace spaces with hyphens
      ))) AS search_slug
  ),
  cop_latest AS (
    -- Extract latest COP data from cop_ranges JSONB
    SELECT
      swf.code,
      NULLIF((elem->>'posting_group'), '')::int as posting_group,
      NULLIF((elem->>'nonaffiliated_max_score'), '')::int as cop_nonaffiliated_max,
      NULLIF((elem->>'nonaffiliated_min_score'), '')::int as cop_nonaffiliated_min,
      NULLIF((elem->>'affiliated_max_score'), '')::int as cop_affiliated_max,
      NULLIF((elem->>'affiliated_min_score'), '')::int as cop_affiliated_min
    FROM secondary_with_affiliations swf
    CROSS JOIN LATERAL (
      SELECT e as elem
      FROM jsonb_array_elements(swf.cop_ranges) e
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
    cl.cop_nonaffiliated_max::INT,
    cl.cop_nonaffiliated_min::INT,
    cl.cop_affiliated_max::INT,
    cl.cop_affiliated_min::INT,
    -- Calculate affiliation bonus (how many points easier to get in)
    CASE
      WHEN cl.cop_affiliated_max IS NOT NULL AND cl.cop_nonaffiliated_max IS NOT NULL
      THEN (cl.cop_nonaffiliated_max - cl.cop_affiliated_max)::INT
      ELSE 2  -- Default 2-point bonus if specific data not available
    END::INT,
    -- Recommendation reason
    CASE
      WHEN cl.posting_group IS NULL THEN
        format('Integrated Program school affiliated with %s. Students from affiliated primary schools get priority admission.', primary_school_input)
      WHEN cl.cop_affiliated_max IS NOT NULL AND cl.cop_nonaffiliated_max IS NOT NULL THEN
        format('Affiliated school. Cut-off for %s students: AL %s-%s (vs non-affiliated: AL %s-%s). You get a %s-point advantage!',
          primary_school_input,
          cl.cop_affiliated_min, cl.cop_affiliated_max,
          cl.cop_nonaffiliated_min, cl.cop_nonaffiliated_max,
          (cl.cop_nonaffiliated_max - cl.cop_affiliated_max)
        )
      ELSE
        format('Affiliated with %s. Students from affiliated primary schools get priority admission with typically 2 AL points advantage.', primary_school_input)
    END::TEXT
  FROM secondary_with_affiliations s
  CROSS JOIN normalized_input ni
  LEFT JOIN cop_latest cl ON cl.code = s.code
  WHERE
    -- Match primary school by searching in affiliated_primaries JSONB array
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(s.affiliated_primaries) ap
      WHERE
        -- Match by primary_name (case-insensitive, fuzzy)
        LOWER(ap->>'primary_name') LIKE '%' || ni.search_text || '%'
        -- OR match by primary_slug (case-insensitive)
        OR LOWER(ap->>'primary_slug') LIKE '%' || ni.search_slug || '%'
        -- OR exact match on primary_name
        OR LOWER(TRIM(ap->>'primary_name')) = ni.search_text
        -- OR exact match on primary_slug
        OR LOWER(TRIM(ap->>'primary_slug')) = ni.search_slug
    )
  ORDER BY
    -- IP schools first
    CASE WHEN cl.posting_group IS NULL THEN 0 ELSE 1 END,
    -- Then by posting group (higher is better)
    CASE WHEN cl.posting_group IS NULL THEN 999 ELSE cl.posting_group END DESC,
    -- Then by COP affiliated max (lower is better - more competitive)
    CASE
      WHEN cl.cop_affiliated_max IS NULL THEN 999
      ELSE cl.cop_affiliated_max
    END,
    -- Finally by school name
    s.name;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ai_search_schools_by_affiliation TO anon, authenticated, service_role;
