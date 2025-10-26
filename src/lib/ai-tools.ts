// src/lib/ai-tools.ts
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { traceable } from 'langsmith/traceable';

// Zod schema for the rankSchools tool parameters
export const rankSchoolsSchema = z.object({
  al_score: z.number()
    .min(4, "AL score must be at least 4")
    .max(30, "AL score must be at most 30")
    .describe("PSLE Achievement Level score (4-30, lower is better)"),

  postal_code: z.string()
    .regex(/^\d{6}$/, "Postal code must be exactly 6 digits")
    .describe("Singapore 6-digit postal code for distance calculation"),

  primary_school: z.string()
    .min(1, "Primary school name is required")
    .describe("Current primary school name for affiliation benefits"),

  gender_preference: z.enum(['Any', 'Boys', 'Girls', 'Co-ed'])
    .default('Any')
    .describe("School gender preference"),

  sports_selected: z.array(z.string())
    .default([])
    .describe("List of sports interests"),

  ccas_selected: z.array(z.string())
    .default([])
    .describe("List of CCA (Co-Curricular Activities) interests"),

  culture_selected: z.array(z.string())
    .default([])
    .describe("List of school culture traits preferences"),

  distance_importance: z.enum(['Low', 'Medium', 'High'])
    .default('Low')
    .describe("Importance of distance from home"),

  sports_importance: z.enum(['Low', 'Medium', 'High'])
    .default('Low')
    .describe("Importance of sports programs"),

  cca_importance: z.enum(['Low', 'Medium', 'High'])
    .default('Low')
    .describe("Importance of CCA programs"),

  culture_importance: z.enum(['Low', 'Medium', 'High'])
    .default('Low')
    .describe("Importance of school culture alignment")
});

export type RankSchoolsParams = z.infer<typeof rankSchoolsSchema>;

// Convert importance levels to weights
const toWeight = (importance: 'Low' | 'Medium' | 'High'): number => {
  switch (importance) {
    case 'High': return 0.4;
    case 'Medium': return 0.2;
    case 'Low': return 0.0;
    default: return 0.0;
  }
};

// Slugify function for primary school names (matches existing logic)
function slugify(input: string | null | undefined): string | null {
  if (!input) return null;
  return input
    .toLowerCase()
    .replace(/'/g, "'")            // normalize curly apostrophes
    .replace(/&/g, ' and ')
    .replace(/\./g, '')
    .replace(/[^a-z0-9'\s-]/g, '') // keep alnum, spaces, hyphens, apostrophes
    .trim()
    .replace(/['\s]+/g, '-')       // spaces/apostrophes -> hyphen
    .replace(/-+/g, '-');
}

// School result type from our ai_rank_schools function
export interface SchoolResult {
  code: string;
  name: string;
  address: string;
  distance_km: number;
  posting_group: number | null;
  track: string;
  is_affiliated: boolean;
  cop_max_score: number;
  sports_matches: string[];
  ccas_matches: string[];
  culture_matches: string[];
  culture_top_titles: string[];
  culture_top_strengths: number[];
  composite_score: number;
  match_summary: string;
  recommendation_reason: string;
  ai_metadata: Record<string, any>;
}

// Create the rankSchools tool function (wrapped with LangSmith tracing)
const executeRankSchoolsImpl = async (
  params: RankSchoolsParams
): Promise<string> => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Geocode postal code directly via Google Maps API (same as rankSchoolsSimple)
  const addressQuery = `${params.postal_code}, Singapore`;
  const geoResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${googleMapsApiKey}`
  );
  const geoData = await geoResponse.json();

  if (geoData.status !== 'OK' || !geoData.results?.length) {
    throw new Error(`Failed to geocode postal code "${params.postal_code}". Please check that it's a valid 6-digit Singapore postal code.`);
  }

  const { lat, lng } = geoData.results[0].geometry.location;

  // Convert importance levels to weights
  const weight_dist = toWeight(params.distance_importance);
  const weight_sport = toWeight(params.sports_importance);
  const weight_cca = toWeight(params.cca_importance);
  const weight_culture = toWeight(params.culture_importance);

  // Slugify primary school name
  const primary_slug = slugify(params.primary_school);

  try {
    // Call rank_schools1 RPC (same as /ranking page - proven to work)
    const { data, error } = await supabase.rpc('rank_schools1', {
      user_score: params.al_score,
      user_lat: lat,
      user_lng: lng,
      gender_pref: params.gender_preference,
      sports_selected: params.sports_selected,
      ccas_selected: params.ccas_selected,
      culture_selected: params.culture_selected,
      max_distance_km: 30, // Default for now
      weight_dist,
      weight_sport,
      weight_cca,
      weight_culture,
      limit_count: 6,
      primary_slug
      // Removed: ai_session_id (rank_schools1 doesn't have this parameter)
    });

    if (error) {
      console.error('rank_schools1 error:', error);
      throw new Error('School ranking failed');
    }

    const schools = (data || []) as SchoolResult[];

    if (schools.length === 0) {
      return `I couldn't find any schools matching your criteria (AL ${params.al_score}, postal code ${params.postal_code}).

This could mean:
1. The criteria might be too restrictive
2. Try adjusting your preferences or expanding your search area

Would you like me to search with different criteria?`;
    }

    // Format as readable string output
    const resultParts: string[] = [];

    // Add conversational summary
    resultParts.push(generateSummary(schools, params));
    resultParts.push('');

    // Add detailed school information
    schools.forEach((school, index) => {
      resultParts.push(`**${index + 1}. ${school.name}**${school.is_affiliated ? ' 🎓 *Affiliated*' : ''}`);
      resultParts.push(`📍 ${school.address} (${school.distance_km.toFixed(1)} km away)`);

      // Track and posting group
      if (school.track === 'IP') {
        resultParts.push(`🎓 Integrated Program (IP) - 6-year pathway`);
      } else if (school.posting_group) {
        resultParts.push(`🎓 Posting Group ${school.posting_group} - O-Level track`);
      }

      // Cut-off score
      if (school.cop_max_score) {
        if (school.is_affiliated) {
          resultParts.push(`📊 2024 Cut-off (Affiliated): AL ${school.cop_max_score} ✨`);
        } else {
          resultParts.push(`📊 2024 Cut-off: AL ${school.cop_max_score}`);
        }
      }

      // Sports matches
      if (school.sports_matches && school.sports_matches.length > 0) {
        resultParts.push(`⚽ **Strong in**: ${school.sports_matches.join(', ')}`);
      }

      // CCA matches
      if (school.ccas_matches && school.ccas_matches.length > 0) {
        resultParts.push(`🎯 **CCAs**: ${school.ccas_matches.join(', ')}`);
      }

      // Culture matches
      if (school.culture_matches && school.culture_matches.length > 0) {
        resultParts.push(`💡 **Culture**: ${school.culture_matches.join(', ')}`);
      }

      // Match summary and recommendation
      if (school.match_summary) {
        resultParts.push(`✨ ${school.match_summary}`);
      }

      if (school.recommendation_reason) {
        resultParts.push(`💬 ${school.recommendation_reason}`);
      }

      resultParts.push('');
    });

    // Add helpful tips
    resultParts.push(`💡 **Next Steps**:`);
    resultParts.push(`- Want to know more about a specific school? Just ask!`);
    resultParts.push(`- Want to see schools with different criteria? Let me know!`);

    return resultParts.join('\n');

  } catch (error) {
    console.error('Error in executeRankSchools:', error);
    throw error;
  }
};

// Export wrapped version with LangSmith tracing
export const executeRankSchools = traceable(
  executeRankSchoolsImpl,
  {
    name: 'executeRankSchools',
    run_type: 'tool',
    metadata: (params: RankSchoolsParams) => ({
      tool_name: 'rankSchools',
      al_score: params.al_score,
      postal_code: params.postal_code,
      primary_school: params.primary_school,
      has_preferences: params.sports_selected.length > 0 || params.ccas_selected.length > 0 || params.culture_selected.length > 0
    })
  }
);

// Generate a conversational summary based on results
function generateSummary(schools: SchoolResult[], params: RankSchoolsParams): string {
  if (schools.length === 0) {
    return "I couldn't find any schools that match your criteria. Let me help you adjust your preferences to find suitable options.";
  }

  const hasPreferences = params.sports_selected.length > 0 ||
                        params.ccas_selected.length > 0 ||
                        params.culture_selected.length > 0;

  const affiliatedCount = schools.filter(s => s.is_affiliated).length;
  const ipCount = schools.filter(s => s.track === 'IP').length;

  let summary = `I found ${schools.length} excellent school options for your AL score of ${params.al_score}. `;

  if (affiliatedCount > 0) {
    summary += `${affiliatedCount} ${affiliatedCount === 1 ? 'school is' : 'schools are'} affiliated with your primary school, giving you priority admission. `;
  }

  if (ipCount > 0) {
    summary += `${ipCount} ${ipCount === 1 ? 'offers' : 'offer'} the Integrated Program (6-year pathway without O-Levels). `;
  }

  if (hasPreferences) {
    const matchingSchools = schools.filter(s =>
      s.sports_matches.length > 0 ||
      s.ccas_matches.length > 0 ||
      s.culture_matches.length > 0
    );

    if (matchingSchools.length > 0) {
      summary += `${matchingSchools.length} ${matchingSchools.length === 1 ? 'school matches' : 'schools match'} your specific interests in `;

      const interests = [];
      if (params.sports_selected.length > 0) interests.push(`sports (${params.sports_selected.join(', ')})`);
      if (params.ccas_selected.length > 0) interests.push(`CCAs (${params.ccas_selected.join(', ')})`);
      if (params.culture_selected.length > 0) interests.push(`culture (${params.culture_selected.join(', ')})`);

      summary += interests.join(' and ') + '. ';
    }
  }

  summary += "These recommendations are ranked by admission eligibility, affiliation benefits, and your preferences.";

  return summary;
}

// Tool definition for OpenAI function calling
export const rankSchoolsTool = {
  name: 'rankSchools',
  description: 'Find and rank Singapore secondary schools based on student PSLE AL score, location, and preferences. Always use this tool when users ask for school recommendations.',
  parameters: {
    type: 'object',
    properties: {
      al_score: {
        type: 'number',
        minimum: 4,
        maximum: 30,
        description: 'PSLE Achievement Level score (4-30, lower is better)'
      },
      postal_code: {
        type: 'string',
        pattern: '^\\d{6}$',
        description: 'Singapore 6-digit postal code for distance calculation'
      },
      primary_school: {
        type: 'string',
        minLength: 1,
        description: 'Current primary school name for affiliation benefits'
      },
      gender_preference: {
        type: 'string',
        enum: ['Any', 'Boys', 'Girls', 'Co-ed'],
        default: 'Any',
        description: 'School gender preference'
      },
      sports_selected: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of sports interests from available options'
      },
      ccas_selected: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of CCA interests from available options'
      },
      culture_selected: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of school culture traits from available options'
      },
      distance_importance: {
        type: 'string',
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
        description: 'Importance of distance from home'
      },
      sports_importance: {
        type: 'string',
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
        description: 'Importance of sports programs'
      },
      cca_importance: {
        type: 'string',
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
        description: 'Importance of CCA programs'
      },
      culture_importance: {
        type: 'string',
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
        description: 'Importance of school culture alignment'
      }
    },
    required: ['al_score', 'postal_code', 'primary_school'],
    additionalProperties: false
  }
} as const;

// ============================================================================
// HELPER FUNCTIONS: Fetch Detailed Explanations from /api/explain
// ============================================================================

/**
 * Fetches detailed sport performance explanations for multiple schools
 * by calling the existing /api/explain endpoint used for school profiles.
 *
 * @returns Map<schoolCode, { explanation, one_liner }>
 */
async function fetchSportExplanations(params: {
  schools: { code: string; name: string }[];
  sports_selected: string[];
  inYear?: number;
}): Promise<Map<string, { explanation: string; one_liner: string }>> {
  try {
    // Use dynamic import to call the explain API directly (server-side)
    // This avoids HTTP overhead and port conflicts
    const { POST: explainHandler } = await import('@/app/api/explain/route');

    // Create a mock NextRequest object
    const mockRequest = {
      json: async () => ({
        schools: params.schools,
        sports_selected: params.sports_selected,
        inYear: params.inYear || 2024
      })
    } as any;

    const response = await explainHandler(mockRequest);
    const data = await response.json();

    const resultMap = new Map<string, { explanation: string; one_liner: string }>();

    if (data.per_school && Array.isArray(data.per_school)) {
      for (const school of data.per_school) {
        resultMap.set(school.code, {
          explanation: school.explanation || '',
          one_liner: school.one_liner || ''
        });
      }
    }

    return resultMap;
  } catch (error) {
    console.error('Error fetching sport explanations:', error);
    return new Map();
  }
}

/**
 * Fetches detailed CCA achievement explanations for multiple schools
 * by calling the existing /api/explain endpoint.
 *
 * @returns Map<schoolCode, ccaExplanation>
 */
async function fetchCcaExplanations(params: {
  schools: { code: string; name: string }[];
  ccas_selected: string[];
  inYear?: number;
}): Promise<Map<string, string>> {
  try {
    // Use dynamic import to call the explain API directly (server-side)
    // This avoids HTTP overhead and port conflicts
    const { POST: explainHandler } = await import('@/app/api/explain/route');

    // Create a mock NextRequest object
    const mockRequest = {
      json: async () => ({
        schools: params.schools,
        ccas_selected: params.ccas_selected,
        inYear: params.inYear || 2024
      })
    } as any;

    const response = await explainHandler(mockRequest);
    const data = await response.json();

    const resultMap = new Map<string, string>();

    if (data.per_school && Array.isArray(data.per_school)) {
      for (const school of data.per_school) {
        resultMap.set(school.code, school.cca_explanation || '');
      }
    }

    return resultMap;
  } catch (error) {
    console.error('Error fetching CCA explanations:', error);
    return new Map();
  }
}

// ============================================================================
// TOOL 2: Search Schools by Sport
// ============================================================================

export const searchSchoolsBySportSchema = z.object({
  sport_name: z.string()
    .min(1, "Sport name is required")
    .describe("Name of the sport to search for (e.g., 'Tennis', 'Basketball', 'Swimming')"),

  gender_preference: z.enum(['Any', 'Boys', 'Girls', 'Co-ed'])
    .default('Any')
    .describe("School gender preference"),

  track_preference: z.enum(['Any', 'IP', 'O-Level'])
    .default('Any')
    .describe("School track preference: IP (Integrated Program) or O-Level"),

  limit: z.number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Number of schools to return (1-20)")
});

export type SearchSchoolsBySportParams = z.infer<typeof searchSchoolsBySportSchema>;

export interface SportSchoolResult {
  code: string;
  name: string;
  address: string;
  gender: string;
  track: string;
  posting_group: number | null;
  sport_performance_score: number;
  sport_achievements: string[];
  sport_strength_rating: string;
  other_strong_sports: string[];
  recommendation_reason: string;
  // Enhanced fields from /api/explain endpoint
  sport_explanation?: string;      // Detailed multi-line explanation (e.g., "In Basketball, very strong in Boys with 5 Finals...")
  sport_one_liner?: string;         // Concise single-line summary
}

const executeSearchSchoolsBySportImpl = async (
  params: SearchSchoolsBySportParams,
  sessionId?: string
): Promise<{
  schools: SportSchoolResult[];
  summary: string;
  metadata: Record<string, any>;
}> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const aiSessionId = sessionId || nanoid();

  try {
    // Step 1: Get schools from RPC (basic sport data)
    const { data, error } = await supabase.rpc('ai_search_schools_by_sport', {
      sport_name: params.sport_name,
      gender_pref: params.gender_preference,
      track_pref: params.track_preference,
      limit_count: params.limit
    });

    if (error) {
      console.error('ai_search_schools_by_sport error:', error);
      throw new Error('Sport-based school search failed');
    }

    const schools = (data || []) as SportSchoolResult[];

    // Step 2: Enrich with detailed explanations from /api/explain
    if (schools.length > 0) {
      const schoolsForExplain = schools.map(s => ({ code: s.code, name: s.name }));
      console.log('[DEBUG] Fetching sport explanations for:', schoolsForExplain.length, 'schools');
      console.log('[DEBUG] Sport:', params.sport_name);

      const explanations = await fetchSportExplanations({
        schools: schoolsForExplain,
        sports_selected: [params.sport_name],
        inYear: 2024
      });

      console.log('[DEBUG] Explanations received:', explanations.size, 'entries');
      console.log('[DEBUG] Explanation codes:', Array.from(explanations.keys()));

      // Step 3: Merge detailed explanations into school results
      for (const school of schools) {
        const explanation = explanations.get(school.code);
        if (explanation) {
          console.log('[DEBUG] Adding explanation for school:', school.code);
          school.sport_explanation = explanation.explanation || school.recommendation_reason;
          school.sport_one_liner = explanation.one_liner || '';
        } else {
          console.log('[DEBUG] No explanation found for school:', school.code, '- using fallback');
          // Fallback to basic reason if /api/explain fails
          school.sport_explanation = school.recommendation_reason;
          school.sport_one_liner = '';
        }
      }
    }

    const summary = generateSportSummary(schools, params);

    const metadata = {
      sessionId: aiSessionId,
      searchParams: params,
      resultsCount: schools.length,
      generatedAt: new Date().toISOString(),
      searchType: 'sport',
      explanationsEnriched: schools.length > 0
    };

    console.log('[DEBUG] Final response being sent to AI - first school sample:');
    if (schools.length > 0) {
      console.log(JSON.stringify({
        code: schools[0].code,
        name: schools[0].name,
        has_sport_explanation: !!schools[0].sport_explanation,
        sport_explanation_preview: schools[0].sport_explanation?.substring(0, 100),
        has_sport_one_liner: !!schools[0].sport_one_liner,
        sport_achievements: schools[0].sport_achievements
      }, null, 2));
    }

    return { schools, summary, metadata };

  } catch (error) {
    console.error('Error in executeSearchSchoolsBySport:', error);
    throw error;
  }
};

// Export wrapped version with LangSmith tracing
export const executeSearchSchoolsBySport = traceable(
  executeSearchSchoolsBySportImpl,
  {
    name: 'executeSearchSchoolsBySport',
    run_type: 'tool',
    metadata: (params: SearchSchoolsBySportParams, sessionId?: string) => ({
      tool_name: 'searchSchoolsBySport',
      sport_name: params.sport_name,
      gender_preference: params.gender_preference,
      track_preference: params.track_preference,
      session_id: sessionId
    })
  }
);

function generateSportSummary(schools: SportSchoolResult[], params: SearchSchoolsBySportParams): string {
  if (schools.length === 0) {
    return `I couldn't find schools with ${params.sport_name} programs matching your criteria. This sport may not be widely offered, or you could try adjusting your filters.`;
  }

  const veryStrongCount = schools.filter(s => s.sport_strength_rating === 'Very Strong').length;
  const strongCount = schools.filter(s => s.sport_strength_rating === 'Strong').length;
  const ipCount = schools.filter(s => s.track === 'IP').length;

  let summary = `I found ${schools.length} schools with ${params.sport_name} programs. `;

  if (veryStrongCount > 0) {
    summary += `${veryStrongCount} ${veryStrongCount === 1 ? 'school has' : 'schools have'} exceptional ${params.sport_name} programs with top-tier national performance. `;
  }

  if (strongCount > 0) {
    summary += `${strongCount} ${strongCount === 1 ? 'school has' : 'schools have'} strong competitive ${params.sport_name} programs. `;
  }

  if (ipCount > 0) {
    summary += `${ipCount} ${ipCount === 1 ? 'offers' : 'offer'} the Integrated Program. `;
  }

  summary += `These schools are ranked by ${params.sport_name} performance, with the strongest programs shown first.`;

  return summary;
}

export const searchSchoolsBySportTool = {
  name: 'searchSchoolsBySport',
  description: 'Search for Singapore secondary schools with strong programs in a specific sport. Use this when users ask about sports performance like "best schools for tennis" or "which schools are strong in basketball".',
  parameters: {
    type: 'object',
    properties: {
      sport_name: {
        type: 'string',
        minLength: 1,
        description: 'Name of the sport to search for (e.g., "Tennis", "Basketball", "Swimming")'
      },
      gender_preference: {
        type: 'string',
        enum: ['Any', 'Boys', 'Girls', 'Co-ed'],
        default: 'Any',
        description: 'School gender preference'
      },
      track_preference: {
        type: 'string',
        enum: ['Any', 'IP', 'O-Level'],
        default: 'Any',
        description: 'School track preference: IP (Integrated Program) or O-Level'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Number of schools to return (1-20)'
      }
    },
    required: ['sport_name'],
    additionalProperties: false
  }
} as const;

// ============================================================================
// TOOL 3: Search Schools by CCA
// ============================================================================

export const searchSchoolsByCCASchema = z.object({
  cca_name: z.string()
    .min(1, "CCA name is required")
    .describe("Name of the CCA to search for (e.g., 'Robotics', 'Math Olympiad', 'Astronomy')"),

  gender_preference: z.enum(['Any', 'Boys', 'Girls', 'Co-ed'])
    .default('Any')
    .describe("School gender preference"),

  track_preference: z.enum(['Any', 'IP', 'O-Level'])
    .default('Any')
    .describe("School track preference: IP (Integrated Program) or O-Level"),

  limit: z.number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Number of schools to return (1-20)")
});

export type SearchSchoolsByCCAParams = z.infer<typeof searchSchoolsByCCASchema>;

export interface CCASchoolResult {
  code: string;
  name: string;
  address: string;
  gender: string;
  track: string;
  posting_group: number | null;
  cca_performance_score: number;
  cca_achievements: string[];
  cca_strength_rating: string;
  other_strong_ccas: string[];
  recommendation_reason: string;
  // Enhanced fields from /api/explain endpoint
  cca_explanation?: string;      // Detailed multi-line explanation
  cca_one_liner?: string;         // Concise single-line summary
}

const executeSearchSchoolsByCCAImpl = async (
  params: SearchSchoolsByCCAParams,
  sessionId?: string
): Promise<{
  schools: CCASchoolResult[];
  summary: string;
  metadata: Record<string, any>;
}> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const aiSessionId = sessionId || nanoid();

  try {
    // Step 1: Get schools from RPC (basic CCA data)
    const { data, error } = await supabase.rpc('ai_search_schools_by_cca', {
      cca_name: params.cca_name,
      gender_pref: params.gender_preference,
      track_pref: params.track_preference,
      limit_count: params.limit
    });

    if (error) {
      console.error('ai_search_schools_by_cca error:', error);
      throw new Error('CCA-based school search failed');
    }

    const schools = (data || []) as CCASchoolResult[];

    // Step 2: Enrich with detailed explanations from /api/explain
    if (schools.length > 0) {
      const schoolsForExplain = schools.map(s => ({ code: s.code, name: s.name }));
      console.log('[DEBUG] Fetching CCA explanations for:', schoolsForExplain.length, 'schools');
      console.log('[DEBUG] CCA:', params.cca_name);

      const explanations = await fetchCcaExplanations({
        schools: schoolsForExplain,
        ccas_selected: [params.cca_name],
        inYear: 2024
      });

      console.log('[DEBUG] CCA Explanations received:', explanations.size, 'entries');

      // Step 3: Merge detailed explanations into school results
      for (const school of schools) {
        const explanation = explanations.get(school.code);
        if (explanation) {
          console.log('[DEBUG] Adding CCA explanation for school:', school.code);
          school.cca_explanation = explanation || school.recommendation_reason;
          school.cca_one_liner = ''; // CCA explanations don't have one-liners like sports
        } else {
          console.log('[DEBUG] No CCA explanation found for school:', school.code, '- using fallback');
          // Fallback to basic reason if /api/explain fails
          school.cca_explanation = school.recommendation_reason;
          school.cca_one_liner = '';
        }
      }
    }

    const summary = generateCCASummary(schools, params);

    const metadata = {
      sessionId: aiSessionId,
      searchParams: params,
      resultsCount: schools.length,
      generatedAt: new Date().toISOString(),
      searchType: 'cca',
      explanationsEnriched: schools.length > 0
    };

    console.log('[DEBUG] Final CCA response - first school sample:');
    if (schools.length > 0) {
      console.log(JSON.stringify({
        code: schools[0].code,
        name: schools[0].name,
        has_cca_explanation: !!schools[0].cca_explanation,
        cca_explanation_preview: schools[0].cca_explanation?.substring(0, 100),
        cca_achievements: schools[0].cca_achievements
      }, null, 2));
    }

    return { schools, summary, metadata };

  } catch (error) {
    console.error('Error in executeSearchSchoolsByCCA:', error);
    throw error;
  }
};

// Export wrapped version with LangSmith tracing
export const executeSearchSchoolsByCCA = traceable(
  executeSearchSchoolsByCCAImpl,
  {
    name: 'executeSearchSchoolsByCCA',
    run_type: 'tool',
    metadata: (params: SearchSchoolsByCCAParams, sessionId?: string) => ({
      tool_name: 'searchSchoolsByCCA',
      cca_name: params.cca_name,
      session_id: sessionId
    })
  }
);

function generateCCASummary(schools: CCASchoolResult[], params: SearchSchoolsByCCAParams): string {
  if (schools.length === 0) {
    return `I couldn't find schools with ${params.cca_name} programs matching your criteria. This CCA may not be widely offered, or you could try adjusting your filters.`;
  }

  const veryStrongCount = schools.filter(s => s.cca_strength_rating === 'Very Strong').length;
  const strongCount = schools.filter(s => s.cca_strength_rating === 'Strong').length;
  const ipCount = schools.filter(s => s.track === 'IP').length;

  let summary = `I found ${schools.length} schools with ${params.cca_name} programs. `;

  if (veryStrongCount > 0) {
    summary += `${veryStrongCount} ${veryStrongCount === 1 ? 'school has' : 'schools have'} exceptional ${params.cca_name} programs with outstanding achievements. `;
  }

  if (strongCount > 0) {
    summary += `${strongCount} ${strongCount === 1 ? 'school has' : 'schools have'} strong competitive ${params.cca_name} programs. `;
  }

  if (ipCount > 0) {
    summary += `${ipCount} ${ipCount === 1 ? 'offers' : 'offer'} the Integrated Program. `;
  }

  summary += `These schools are ranked by ${params.cca_name} performance, with the strongest programs shown first.`;

  return summary;
}

export const searchSchoolsByCCATool = {
  name: 'searchSchoolsByCCA',
  description: 'Search for Singapore secondary schools with strong CCA (Co-Curricular Activities) programs. Use this when users ask about specific CCAs like "best schools for robotics" or "which schools are strong in Math Olympiad".',
  parameters: {
    type: 'object',
    properties: {
      cca_name: {
        type: 'string',
        minLength: 1,
        description: 'Name of the CCA to search for (e.g., "Robotics", "Math Olympiad", "Astronomy", "Chemistry Olympiad", "National STEM")'
      },
      gender_preference: {
        type: 'string',
        enum: ['Any', 'Boys', 'Girls', 'Co-ed'],
        default: 'Any',
        description: 'School gender preference'
      },
      track_preference: {
        type: 'string',
        enum: ['Any', 'IP', 'O-Level'],
        default: 'Any',
        description: 'School track preference: IP (Integrated Program) or O-Level'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Number of schools to return (1-20)'
      }
    },
    required: ['cca_name'],
    additionalProperties: false
  }
} as const;

// ============================================================================
// TOOL 4: Search Schools by Academic Focus
// ============================================================================

export const searchSchoolsByAcademicSchema = z.object({
  academic_focus: z.enum(['Overall', 'Astronomy', 'Chemistry Olympiad', 'Math Olympiad', 'Robotics', 'National STEM'])
    .default('Overall')
    .describe("Academic focus area: 'Overall' for general rankings, or specific CCA category"),

  gender_preference: z.enum(['Any', 'Boys', 'Girls', 'Co-ed'])
    .default('Any')
    .describe("School gender preference"),

  track_preference: z.enum(['Any', 'IP', 'O-Level'])
    .default('Any')
    .describe("School track preference: IP (Integrated Program) or O-Level"),

  limit: z.number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Number of schools to return (1-20)")
});

export type SearchSchoolsByAcademicParams = z.infer<typeof searchSchoolsByAcademicSchema>;

export interface AcademicSchoolResult {
  code: string;
  name: string;
  address: string;
  gender: string;
  track: string;
  posting_group: number | null;
  cop_max_score: number;
  academic_strength_score: number;
  cca_achievements: string[];
  cca_strength_rating: string;
  recommendation_reason: string;
}

const executeSearchSchoolsByAcademicImpl = async (
  params: SearchSchoolsByAcademicParams,
  sessionId?: string
): Promise<{
  schools: AcademicSchoolResult[];
  summary: string;
  metadata: Record<string, any>;
}> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const aiSessionId = sessionId || nanoid();

  try {
    const { data, error } = await supabase.rpc('ai_search_schools_by_academic', {
      academic_focus: params.academic_focus,
      gender_pref: params.gender_preference,
      track_pref: params.track_preference,
      limit_count: params.limit
    });

    if (error) {
      console.error('ai_search_schools_by_academic error:', error);
      throw new Error('Academic-based school search failed');
    }

    const schools = (data || []) as AcademicSchoolResult[];

    const summary = generateAcademicSummary(schools, params);

    const metadata = {
      sessionId: aiSessionId,
      searchParams: params,
      resultsCount: schools.length,
      generatedAt: new Date().toISOString(),
      searchType: 'academic'
    };

    return { schools, summary, metadata };

  } catch (error) {
    console.error('Error in executeSearchSchoolsByAcademic:', error);
    throw error;
  }
};

// Export wrapped version with LangSmith tracing
export const executeSearchSchoolsByAcademic = traceable(
  executeSearchSchoolsByAcademicImpl,
  {
    name: 'executeSearchSchoolsByAcademic',
    run_type: 'tool',
    metadata: (params: SearchSchoolsByAcademicParams, sessionId?: string) => ({
      tool_name: 'searchSchoolsByAcademic',
      academic_focus: params.academic_focus,
      session_id: sessionId
    })
  }
);

function generateAcademicSummary(schools: AcademicSchoolResult[], params: SearchSchoolsByAcademicParams): string {
  if (schools.length === 0) {
    return `I couldn't find schools matching your academic criteria. Try adjusting your filters or ask me for general academic rankings.`;
  }

  const ipCount = schools.filter(s => s.track === 'IP').length;
  const pg3Count = schools.filter(s => s.posting_group === 3).length;
  const topCopSchools = schools.filter(s => s.cop_max_score && s.cop_max_score <= 10).length;

  let summary = `I found ${schools.length} ${params.academic_focus === 'Overall' ? 'academically strong' : params.academic_focus} schools. `;

  if (ipCount > 0) {
    summary += `${ipCount} ${ipCount === 1 ? 'offers' : 'offer'} the prestigious Integrated Program (6-year pathway). `;
  }

  if (topCopSchools > 0) {
    summary += `${topCopSchools} ${topCopSchools === 1 ? 'has' : 'have'} highly competitive cut-off scores (COP ≤ 10). `;
  }

  if (params.academic_focus === 'Overall') {
    summary += `These schools are ranked by overall academic strength, considering track, posting group, and historical performance.`;
  } else {
    summary += `These schools are ranked by ${params.academic_focus} achievement and competitive track record.`;
  }

  return summary;
}

export const searchSchoolsByAcademicTool = {
  name: 'searchSchoolsByAcademic',
  description: 'Search for Singapore secondary schools by academic performance and specific academic programs. Use this when users ask about "top IP schools", "best schools for Math Olympiad", or "academically strong schools".',
  parameters: {
    type: 'object',
    properties: {
      academic_focus: {
        type: 'string',
        enum: ['Overall', 'Astronomy', 'Chemistry Olympiad', 'Math Olympiad', 'Robotics', 'National STEM'],
        default: 'Overall',
        description: "Academic focus: 'Overall' for general rankings, or specific CCA category"
      },
      gender_preference: {
        type: 'string',
        enum: ['Any', 'Boys', 'Girls', 'Co-ed'],
        default: 'Any',
        description: 'School gender preference'
      },
      track_preference: {
        type: 'string',
        enum: ['Any', 'IP', 'O-Level'],
        default: 'Any',
        description: 'School track preference: IP (Integrated Program) or O-Level'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Number of schools to return (1-20)'
      }
    },
    required: ['academic_focus'],
    additionalProperties: false
  }
} as const;

// ============================================================================
// TOOL 4: Get School Details
// ============================================================================

export const getSchoolDetailsSchema = z.object({
  school_identifier: z.string()
    .min(1, "School name or code is required")
    .describe("School name (e.g., 'Raffles Institution', 'ACSI') or school code (e.g., '1204')")
});

export type GetSchoolDetailsParams = z.infer<typeof getSchoolDetailsSchema>;

export interface SchoolDetailsResult {
  code: string;
  name: string;
  address: string;
  gender: string;
  track: string;
  posting_group: number | null;
  cop_max_score: number;
  cop_min_score: number;
  affiliated_primary_schools: string[];
  available_sports: string[];
  top_sports: string[];
  available_ccas: string[];
  cca_achievements: string[];
  culture_summary: string;
  culture_traits: string[];
  total_enrollment: number;
  contact_info: {
    website?: string;
    phone?: string;
    email?: string;
  };
  // Enhanced fields from /api/explain endpoint
  sports_explanation?: string;      // Detailed sport performance narrative
  sports_one_liner?: string;         // Concise sport summary
  ccas_explanation?: string;         // Detailed CCA achievements narrative
}

const executeGetSchoolDetailsImpl = async (
  params: GetSchoolDetailsParams,
  sessionId?: string
): Promise<{
  school: SchoolDetailsResult | null;
  summary: string;
  metadata: Record<string, any>;
}> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const aiSessionId = sessionId || nanoid();

  try {
    // Step 1: Get basic school details from RPC
    console.log('[DEBUG] Getting school details for:', params.school_identifier);

    const { data, error } = await supabase.rpc('ai_get_school_details', {
      school_identifier: params.school_identifier
    });

    if (error) {
      console.error('ai_get_school_details error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error('School details retrieval failed');
    }

    console.log('[DEBUG] RPC returned data:', data);
    console.log('[DEBUG] Number of schools found:', (data || []).length);

    const schools = (data || []) as SchoolDetailsResult[];
    const school = schools.length > 0 ? schools[0] : null;

    if (!school) {
      console.log('[DEBUG] No school found for identifier:', params.school_identifier);
      const summary = `I couldn't find a school matching "${params.school_identifier}". Could you provide the full school name or try a different spelling?`;
      const metadata = {
        sessionId: aiSessionId,
        searchParams: params,
        found: false,
        generatedAt: new Date().toISOString(),
        searchType: 'details'
      };
      return { school: null, summary, metadata };
    }

    console.log('[DEBUG] Found school:', school.name, '(code:', school.code, ')');

    // Step 2: Enrich with detailed sport explanations from /api/explain
    // Pass empty sports_selected array to get top 3 sports automatically
    const sportsExplanations = await fetchSportExplanations({
      schools: [{ code: school.code, name: school.name }],
      sports_selected: school.top_sports || [],  // Use top sports if available
      inYear: 2024
    });

    const sportData = sportsExplanations.get(school.code);
    if (sportData) {
      school.sports_explanation = sportData.explanation || 'Sports performance data not available';
      school.sports_one_liner = sportData.one_liner || '';
    } else {
      school.sports_explanation = 'Sports performance data not available';
      school.sports_one_liner = '';
    }

    // Step 3: Enrich with CCA explanations from /api/explain
    // Use available CCAs (limit to 5 as per system design)
    const ccasToQuery = school.available_ccas?.slice(0, 5) || [];
    if (ccasToQuery.length > 0) {
      const ccaExplanations = await fetchCcaExplanations({
        schools: [{ code: school.code, name: school.name }],
        ccas_selected: ccasToQuery,
        inYear: 2024
      });

      const ccaData = ccaExplanations.get(school.code);
      school.ccas_explanation = ccaData || 'CCA achievement data not available';
    } else {
      school.ccas_explanation = 'CCA achievement data not available';
    }

    // Step 4: Generate comprehensive summary
    const summary = generateComprehensiveSchoolSummary(school);

    const metadata = {
      sessionId: aiSessionId,
      searchParams: params,
      found: true,
      generatedAt: new Date().toISOString(),
      searchType: 'details',
      explanationsEnriched: true
    };

    return { school, summary, metadata };

  } catch (error) {
    console.error('Error in executeGetSchoolDetails:', error);
    throw error;
  }
};

// Export wrapped version with LangSmith tracing
export const executeGetSchoolDetails = traceable(
  executeGetSchoolDetailsImpl,
  {
    name: 'executeGetSchoolDetails',
    run_type: 'tool',
    metadata: (params: GetSchoolDetailsParams, sessionId?: string) => ({
      tool_name: 'getSchoolDetails',
      school_identifier: params.school_identifier,
      session_id: sessionId
    })
  }
);

/**
 * Generates a comprehensive, detailed summary for a school including
 * academic info, affiliations, sports performance, CCA achievements, and culture.
 */
function generateComprehensiveSchoolSummary(school: SchoolDetailsResult): string {
  const parts: string[] = [];

  // Header: School name and academic info
  parts.push(`Here's comprehensive information about **${school.name}**:`);
  parts.push('');

  // Academic track and cutoff
  if (school.track === 'IP') {
    const competitiveness = school.cop_max_score <= 8 ? 'highly competitive' :
                           school.cop_max_score <= 15 ? 'competitive' : 'accessible';
    parts.push(`**Academic:** Integrated Program (IP) school with 6-year pathway. 2024 COP: ${school.cop_max_score} (${competitiveness}).`);
  } else {
    const competitiveness = school.cop_max_score <= 8 ? 'highly competitive' :
                           school.cop_max_score <= 15 ? 'competitive' : 'accessible';
    parts.push(`**Academic:** Posting Group ${school.posting_group} school. 2024 COP: ${school.cop_max_score} (${competitiveness}).`);
  }
  parts.push('');

  // Affiliations
  if (school.affiliated_primary_schools && school.affiliated_primary_schools.length > 0) {
    const affs = school.affiliated_primary_schools.slice(0, 3).join(', ');
    parts.push(`**Affiliations:** Affiliated with ${affs}${school.affiliated_primary_schools.length > 3 ? ' and others' : ''}.`);
    parts.push('');
  }

  // Sports - use detailed explanation if available
  if (school.sports_explanation && school.sports_explanation !== 'Sports performance data not available') {
    parts.push(`**Sports Performance:**`);
    parts.push(school.sports_explanation);
    parts.push('');
  }

  // CCAs - use detailed explanation if available
  if (school.ccas_explanation && school.ccas_explanation !== 'CCA achievement data not available') {
    parts.push(`**Co-Curricular Achievements:**`);
    parts.push(school.ccas_explanation);
    parts.push('');
  }

  // Culture
  if (school.culture_summary && school.culture_summary !== 'School culture information not available') {
    parts.push(`**School Culture:**`);
    parts.push(school.culture_summary);
  }

  return parts.join('\n');
}

export const getSchoolDetailsTool = {
  name: 'getSchoolDetails',
  description: 'Get comprehensive information about a specific Singapore secondary school. Use this when users ask about a particular school like "Tell me about Raffles Institution" or "What\'s special about ACSI?".',
  parameters: {
    type: 'object',
    properties: {
      school_identifier: {
        type: 'string',
        minLength: 1,
        description: 'School name (e.g., "Raffles Institution", "ACSI") or school code (e.g., "1204")'
      }
    },
    required: ['school_identifier'],
    additionalProperties: false
  }
} as const;

// ===========================
// TOOL 6: Search Schools by Affiliation
// ===========================

export const searchSchoolsByAffiliationSchema = z.object({
  primary_school_name: z.string()
    .min(1, "Primary school name is required")
    .describe("Name of the primary school to search affiliations for (e.g., 'Rosyth School', 'Tao Nan School')")
});

export type SearchSchoolsByAffiliationParams = z.infer<typeof searchSchoolsByAffiliationSchema>;

export interface AffiliatedSchoolResult {
  code: string;
  name: string;
  address: string;
  gender: string;
  track: string;
  posting_group: number | null;
  cop_nonaffiliated_max: number | null;
  cop_nonaffiliated_min: number | null;
  cop_affiliated_max: number | null;
  cop_affiliated_min: number | null;
  affiliation_bonus_points: number;
  recommendation_reason: string;
}

const executeSearchSchoolsByAffiliationImpl = async (
  params: SearchSchoolsByAffiliationParams
): Promise<string> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Call the ai_search_schools_by_affiliation RPC function
  const { data, error } = await supabase
    .rpc('ai_search_schools_by_affiliation', {
      primary_school_input: params.primary_school_name
    });

  if (error) {
    console.error('Supabase RPC error (ai_search_schools_by_affiliation):', error);
    throw new Error(`Database error: ${error.message}`);
  }

  const results = (data || []) as AffiliatedSchoolResult[];

  if (results.length === 0) {
    return `I couldn't find any secondary schools affiliated with "${params.primary_school_name}". This could mean:

1. The primary school name might be slightly different (try the full official name)
2. The school might not have affiliated secondary schools
3. The primary school might be spelled differently

Could you double-check the primary school name? For example, "Rosyth School" or "Tao Nan School".`;
  }

  // Format the results
  const resultParts: string[] = [];

  resultParts.push(`I found **${results.length} secondary school${results.length > 1 ? 's' : ''}** affiliated with **${params.primary_school_name}**:`);
  resultParts.push('');

  results.forEach((school, index) => {
    resultParts.push(`**${index + 1}. ${school.name}**`);
    resultParts.push(`📍 ${school.address}`);

    // Track info
    if (school.track === 'IP') {
      resultParts.push(`🎓 Integrated Program (IP) - 6-year pathway`);
    } else {
      resultParts.push(`🎓 Posting Group ${school.posting_group} - O-Level track`);
    }

    // Gender
    if (school.gender && school.gender !== 'Co-ed') {
      resultParts.push(`👥 ${school.gender} school`);
    }

    // COP information with affiliation bonus
    if (school.cop_affiliated_max && school.cop_nonaffiliated_max) {
      const bonus = school.affiliation_bonus_points;
      resultParts.push(`📊 **2024 Cut-off Points:**`);
      resultParts.push(`   • Affiliated students (${params.primary_school_name}): AL ${school.cop_affiliated_min}-${school.cop_affiliated_max}`);
      resultParts.push(`   • Non-affiliated students: AL ${school.cop_nonaffiliated_min}-${school.cop_nonaffiliated_max}`);
      resultParts.push(`   • **Affiliation advantage: ${bonus} AL point${bonus > 1 ? 's' : ''}** 🎉`);
    } else if (school.cop_nonaffiliated_max) {
      resultParts.push(`📊 2024 Cut-off: AL ${school.cop_nonaffiliated_min}-${school.cop_nonaffiliated_max}`);
      resultParts.push(`   • Affiliated students typically get 2 AL points advantage`);
    }

    resultParts.push('');
  });

  // Add helpful explanation about affiliations
  resultParts.push(`💡 **About School Affiliation:**`);
  resultParts.push(`Students from ${params.primary_school_name} get priority admission to these schools with lower cut-off scores (typically 2 AL points advantage). This means it's easier to get into affiliated schools!`);

  if (results.length >= 2) {
    resultParts.push('');
    resultParts.push(`You can choose up to 3 affiliated schools during S1 posting to maximize your affiliation benefits.`);
  }

  return resultParts.join('\n');
};

// Export wrapped version with LangSmith tracing
export const executeSearchSchoolsByAffiliation = traceable(
  executeSearchSchoolsByAffiliationImpl,
  {
    name: 'executeSearchSchoolsByAffiliation',
    run_type: 'tool',
    metadata: (params: SearchSchoolsByAffiliationParams) => ({
      tool_name: 'searchSchoolsByAffiliation',
      primary_school_name: params.primary_school_name
    })
  }
);

export const searchSchoolsByAffiliationTool = {
  name: 'searchSchoolsByAffiliation',
  description: 'Find secondary schools affiliated with a specific primary school. Use this when users ask "What schools are affiliated with XXX primary?" or "Which secondary schools give priority to students from XXX Primary?". Returns schools with affiliation benefits and cut-off score advantages.',
  parameters: {
    type: 'object',
    properties: {
      primary_school_name: {
        type: 'string',
        minLength: 1,
        description: 'Name of the primary school to search affiliations for (e.g., "Rosyth School", "Tao Nan School", "Anderson Primary")'
      }
    },
    required: ['primary_school_name'],
    additionalProperties: false
  }
} as const;

// ===========================
// TOOL 7: Rank Schools Simple (Home Page RPC)
// ===========================

export const rankSchoolsSimpleSchema = z.object({
  al_score: z.number()
    .min(4, "AL score must be at least 4")
    .max(30, "AL score must be at most 30")
    .describe("PSLE Achievement Level score (4-30, lower is better)"),

  postal_code: z.string()
    .regex(/^\d{6}$/, "Postal code must be exactly 6 digits")
    .describe("Singapore 6-digit postal code for distance calculation"),

  primary_school: z.string()
    .min(1, "Primary school name is required")
    .describe("Current primary school name for affiliation benefits"),

  limit: z.number()
    .min(1)
    .max(20)
    .default(10)
    .optional()
    .describe("Number of schools to return (default: 10)")
});

export type RankSchoolsSimpleParams = z.infer<typeof rankSchoolsSimpleSchema>;

export interface SimpleSchoolResult {
  code: string;
  name: string;
  address: string;
  gender: string;
  distance_km: number;
  posting_group: number | null;
  track: string;
  is_affiliated: boolean;
  cop_max_score: number;
  cop_min_score: number;
}

const executeRankSchoolsSimpleImpl = async (
  params: RankSchoolsSimpleParams
): Promise<string> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Geocode postal code to get lat/lng
  const addressQuery = `${params.postal_code}, Singapore`;
  const geoRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${googleMapsApiKey}`
  ).then(r => r.json());

  if (geoRes.status !== 'OK' || !geoRes.results.length) {
    return `I couldn't geocode postal code "${params.postal_code}". Please check that it's a valid 6-digit Singapore postal code.`;
  }

  const { lat, lng } = geoRes.results[0].geometry.location;

  // Slugify primary school name for affiliation matching
  const primarySlug = slugify(params.primary_school);

  // Call rank_schools RPC (same as home page search)
  const { data, error } = await supabase.rpc('rank_schools', {
    user_score: params.al_score,
    user_lat: lat,
    user_lng: lng,
    gender_pref: 'Any',
    sports_selected: null,
    ccas_selected: null,
    culture_selected: null,
    max_distance_km: 50,  // Large radius for simple search
    weight_dist: 1,       // Distance-first ranking
    weight_sport: 0,
    weight_cca: 0,
    weight_culture: 0,
    limit_count: params.limit || 10,
    in_year: 2024,
    user_primary: primarySlug
  });

  if (error) {
    console.error('Supabase RPC error (rank_schools):', error);
    throw new Error(`Database error: ${error.message}`);
  }

  const results = (data || []) as SimpleSchoolResult[];

  if (results.length === 0) {
    return `I couldn't find any schools matching your criteria (AL ${params.al_score}, postal code ${params.postal_code}, primary school: ${params.primary_school}).

This could mean:
1. The postal code might be invalid
2. No schools are accessible with AL ${params.al_score} in your area
3. Try expanding your search by providing just your AL score

Would you like me to search for schools based on just your AL score instead?`;
  }

  const resultParts: string[] = [];

  resultParts.push(`Based on your profile (AL ${params.al_score}, postal code ${params.postal_code}, primary school: ${params.primary_school}), I found **${results.length} school${results.length > 1 ? 's' : ''}** you can likely get into:`);
  resultParts.push('');

  results.forEach((school, index) => {
    resultParts.push(`**${index + 1}. ${school.name}**${school.is_affiliated ? ' 🎓 *Affiliated*' : ''}`);
    resultParts.push(`📍 ${school.address} (${school.distance_km.toFixed(1)} km away)`);

    if (school.track === 'IP') {
      resultParts.push(`🎓 Integrated Program (IP) - 6-year pathway`);
    } else if (school.posting_group) {
      resultParts.push(`🎓 Posting Group ${school.posting_group} - O-Level track`);
    }

    if (school.gender && school.gender !== 'Co-ed') {
      resultParts.push(`👥 ${school.gender} school`);
    }

    if (school.cop_max_score) {
      const copRange = school.cop_min_score
        ? `AL ${school.cop_min_score}-${school.cop_max_score}`
        : `AL ${school.cop_max_score}`;

      if (school.is_affiliated) {
        resultParts.push(`📊 2024 Cut-off (Affiliated): ${copRange} ✨`);
      } else {
        resultParts.push(`📊 2024 Cut-off: ${copRange}`);
      }
    }

    resultParts.push('');
  });

  if (results.some(s => s.is_affiliated)) {
    resultParts.push(`✨ **Affiliation Bonus**: Schools marked with 🎓 *Affiliated* give you priority admission with lower cut-off scores!`);
    resultParts.push('');
  }

  resultParts.push(`💡 **Next Steps**:`);
  resultParts.push(`- Want to explore schools strong in specific sports or CCAs? Just ask!`);
  resultParts.push(`- Want more personalized recommendations with sports/CCA preferences? Let me know!`);

  return resultParts.join('\n');
};

// Export wrapped version with LangSmith tracing
export const executeRankSchoolsSimple = traceable(
  executeRankSchoolsSimpleImpl,
  {
    name: 'executeRankSchoolsSimple',
    run_type: 'tool',
    metadata: (params: RankSchoolsSimpleParams) => ({
      tool_name: 'rankSchoolsSimple',
      al_score: params.al_score,
      postal_code: params.postal_code,
      primary_school: params.primary_school
    })
  }
);

export const rankSchoolsSimpleTool = {
  name: 'rankSchoolsSimple',
  description: 'Find schools near the user based on AL score, postal code, and primary school (uses home page search algorithm). Use this when user provides all three pieces of information and wants simple personalized recommendations without specific sports/CCA/culture preferences. This is a distance-first search that shows schools the user can likely get into.',
  parameters: {
    type: 'object',
    properties: {
      al_score: {
        type: 'number',
        minimum: 4,
        maximum: 30,
        description: 'PSLE Achievement Level score (4-30, lower is better)'
      },
      postal_code: {
        type: 'string',
        pattern: '^\\d{6}$',
        description: 'Singapore 6-digit postal code for distance calculation'
      },
      primary_school: {
        type: 'string',
        minLength: 1,
        description: 'Current primary school name for affiliation benefits (e.g., "Rosyth School", "Tao Nan School")'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Number of schools to return (default: 10)'
      }
    },
    required: ['al_score', 'postal_code', 'primary_school'],
    additionalProperties: false
  }
} as const;