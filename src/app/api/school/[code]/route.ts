// src/app/api/school/[code]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SchoolProfile, SportsPerformance, CCAchievements, SchoolCulture, CutoffData } from '@/types/school';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sports strength thresholds based on school_sports_scores data
const SPORTS_STRENGTH_THRESHOLDS = {
  VERY_STRONG: 350,
  STRONG: 200,
  FAIR: 0
} as const;

// Helper function to convert slug names to proper school names
function formatSchoolName(name: string): string {
  if (!name || typeof name !== 'string') return 'Unknown School';

  // If it's already a proper name (contains uppercase or special chars), return as is
  if (/[A-Z()]/.test(name)) {
    return name;
  }

  // Convert slug to proper name
  return name
    .split('-')
    .map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'ip') return 'IP';
      if (word.toLowerCase() === 'sec') return 'Secondary';
      if (word.toLowerCase() === 'sch') return 'School';
      if (word.toLowerCase() === 'pri') return 'Primary';
      if (word.toLowerCase() === 'jc') return 'Junior College';
      if (word.toLowerCase() === 'inst') return 'Institution';

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// The 5 specific CCA categories from requirements
const CCA_CATEGORIES = [
  'Astronomy',
  'Chemistry Olympiad',
  'Math Olympiad',
  'Robotics',
  'National STEM'
] as const;

interface RouteParams {
  params: Promise<{
    code: string;
  }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { code } = await params;

  // Validate school code
  if (!code || !/^\d+$/.test(code)) {
    return NextResponse.json(
      { error: 'Invalid school code. Must be a numeric value.' },
      { status: 400 }
    );
  }

  const schoolCode = parseInt(code);

  try {
    // Fetch basic school information including coordinates
    const { data: schoolData, error: schoolError } = await supabase
      .from('secondary_with_affiliations')
      .select('*, lat, lng')
      .eq('code', schoolCode)
      .single();

    if (schoolError || !schoolData) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Fetch all required data in parallel for performance
    const [
      sportsScoresResult,
      sportsResultsResult,
      ccaDetailsResult,
      cultureSummaryResult
    ] = await Promise.all([
      // Sports scores data (aggregated performance ratings)
      supabase
        .from('school_sports_scores')
        .select('*')
        .eq('code', schoolCode)
        .order('score', { ascending: false }),

      // Sports detailed results data (competition results)
      supabase
        .from('school_sport_results')
        .select('*')
        .eq('code', schoolCode.toString())
        .in('year', [2022, 2023, 2024])
        .order('year', { ascending: false }),

      // CCA achievements data for specific categories
      supabase
        .from('school_cca_details')
        .select('*')
        .eq('code', schoolCode)
        .in('cca', CCA_CATEGORIES)
        .order('year', { ascending: false }),

      // Culture summary data
      supabase
        .from('school_culture_summaries')
        .select('*')
        .eq('school_code', schoolCode.toString())
        .single()
    ]);

    // Process sports performance data
    const sports = await processSportsData(
      sportsScoresResult.data || [],
      sportsResultsResult.data || []
    );

    // Process CCA achievements data
    const ccas = await processCCAData(ccaDetailsResult.data || []);

    // Process culture data
    const culture = await processCultureData(cultureSummaryResult.data);

    // Process cut-off data
    const cutoffs = processCutoffData(schoolData.cop_ranges);

    // Build the complete school profile
    const schoolProfile: SchoolProfile = {
      code: schoolCode.toString(),
      name: formatSchoolName(schoolData.name),
      address: schoolData.address,
      gender: schoolData.gender,
      hasIP: hasIPProgram(cutoffs),
      coordinates: schoolData.lat && schoolData.lng ? {
        lat: schoolData.lat,
        lng: schoolData.lng
      } : undefined,
      cutoffs,
      sports,
      ccas,
      culture
    };

    return NextResponse.json(schoolProfile);

  } catch (error) {
    console.error('Error fetching school profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processSportsData(sportsScores: any[], sportsResults: any[]): Promise<SportsPerformance> {
  if (!sportsScores || sportsScores.length === 0) {
    return {
      topSports: [],
      totalSportsWithData: 0,
      sportsWithoutData: []
    };
  }

  // Group sports scores by sport name to eliminate duplicates
  const scoresBySport = sportsScores.reduce((acc, score) => {
    const sport = score.sport;
    if (!acc[sport]) {
      acc[sport] = [];
    }
    acc[sport].push(score);
    return acc;
  }, {} as Record<string, any[]>);

  // Group sports results by sport name for year-by-year analysis
  const resultsBySport = sportsResults.reduce((acc, result) => {
    const sport = result.sport;
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(result);
    return acc;
  }, {} as Record<string, any[]>);

  // Process each unique sport
  const sportsWithData = Object.keys(scoresBySport);
  const topSports = sportsWithData.map(sportName => {
    const sportScores = scoresBySport[sportName];
    const sportResults = resultsBySport[sportName] || [];

    // Use the highest score for strength determination
    const highestScore = Math.max(...sportScores.map((s: any) => s.score));
    const strength = determineStrength(highestScore);

    // Generate year-by-year breakdown
    const achievementSummary = generateYearlyAchievementSummary(sportName, sportResults);

    // Get detailed results grouped by year
    const detailedResults = parseYearlyResults(sportResults);

    // Get years with data
    const scoreYears = sportScores.map((s: any) => s.year);
    const resultYears = sportResults.map((r: any) => r.year);
    const allYears = [...new Set([...scoreYears, ...resultYears])].sort((a, b) => b - a);

    return {
      sport: sportName,
      strength,
      achievementSummary,
      detailedResults,
      years: allYears.length > 0 ? allYears : [2024]
    };
  })
  .sort((a, b) => {
    // Sort by strength first, then by sport name
    const strengthOrder = { 'Very Strong': 3, 'Strong': 2, 'Fair': 1 };
    const strengthDiff = strengthOrder[b.strength] - strengthOrder[a.strength];
    if (strengthDiff !== 0) return strengthDiff;
    return a.sport.localeCompare(b.sport);
  })
  .slice(0, 8); // Limit to top 8 sports

  // Get all available sports for comparison (from /api/options)
  const ALL_SPORTS = [
    'Badminton', 'Basketball', 'Bowling', 'Canoeing', 'Cricket', 'Floorball',
    'Football', 'Golf', 'Hockey', 'Swimming', 'Netball', 'SepakTakraw',
    'Softball', 'Table Tennis', 'Tennis', 'Volleyball', 'Water Polo', 'Rugby', 'Squash'
  ];

  const sportsWithoutData = ALL_SPORTS.filter(sport => !sportsWithData.includes(sport));

  return {
    topSports,
    totalSportsWithData: sportsWithData.length,
    sportsWithoutData
  };
}

function determineStrength(score: number): 'Very Strong' | 'Strong' | 'Fair' {
  if (score >= SPORTS_STRENGTH_THRESHOLDS.VERY_STRONG) return 'Very Strong';
  if (score >= SPORTS_STRENGTH_THRESHOLDS.STRONG) return 'Strong';
  return 'Fair';
}

function generateYearlyAchievementSummary(sport: string, results: any[]): string {
  if (!results || results.length === 0) {
    return `No recent competition data available for ${sport}`;
  }

  // Group results by year
  const resultsByYear = results.reduce((acc, result) => {
    const year = result.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(result);
    return acc;
  }, {} as Record<number, any[]>);

  // Generate year-by-year summary
  const yearSummaries = Object.entries(resultsByYear)
    .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort years descending
    .map(([year, yearResults]) => {
      const typedResults = yearResults as any[];
      const stages = typedResults.map((r: any) => r.stage).filter(Boolean);
      const divisions = [...new Set(typedResults.map((r: any) => r.division).filter(Boolean))];
      const genders = [...new Set(typedResults.map((r: any) => r.gender).filter(Boolean))];

      // Count specific achievements
      const finals = stages.filter(s => s.toLowerCase().includes('final')).length;
      const semifinals = stages.filter(s => s.toLowerCase().includes('semi')).length;
      const quarterfinals = stages.filter(s => s.toLowerCase().includes('quarter')).length;

      let yearSummary = `${year} - `;

      if (finals > 0) {
        yearSummary += `${finals} Finals`;
        if (semifinals > 0) yearSummary += `/${semifinals} Semifinals`;
        yearSummary += ` appearance`;
      } else if (semifinals > 0) {
        yearSummary += `${semifinals} Semifinals`;
        if (quarterfinals > 0) yearSummary += `/${quarterfinals} Quarterfinals`;
        yearSummary += ` appearance`;
      } else if (quarterfinals > 0) {
        yearSummary += `${quarterfinals} Quarterfinals appearance`;
      } else {
        yearSummary += `${typedResults.length} competition participations`;
      }

      if (divisions.length > 0) {
        yearSummary += ` in ${divisions.join(', ')} division${divisions.length > 1 ? 's' : ''}`;
      }

      if (genders.length > 0 && !genders.includes('Mixed')) {
        yearSummary += ` for ${genders.join(', ')}`;
      }

      return yearSummary;
    });

  return yearSummaries.join('; ');
}

function parseYearlyResults(results: any[]): any[] {
  return results.map(result => ({
    year: result.year,
    division: result.division || 'Open',
    gender: result.gender || 'Mixed',
    result: result.stage || 'Participation',
    competition: result.level || 'School Competition'
  }));
}

async function processCCAData(ccaData: any[]): Promise<CCAchievements> {
  const achievements: CCAchievements = {
    availableCategories: 5,
    categoriesWithData: 0
  };

  // Process each of the 5 specific categories
  CCA_CATEGORIES.forEach(category => {
    const categoryData = ccaData.filter(cca => cca.cca === category);
    const hasData = categoryData.length > 0;

    if (hasData) {
      achievements.categoriesWithData++;
    }

    const categoryKey = category.toLowerCase().replace(/\s+/g, '') as keyof CCAchievements;

    // Create achievement details with award information
    const details = categoryData.map(achievement => {
      let detail = `${achievement.year}`;

      if (achievement.award && achievement.event_name) {
        detail += ` - ${achievement.award} in ${achievement.event_name}`;
      } else if (achievement.event_name) {
        detail += ` - Participated in ${achievement.event_name}`;
      } else {
        detail += ` - Competition participation`;
      }

      // Add category context if available
      if (achievement.category && achievement.category !== achievement.cca) {
        detail += ` for ${achievement.category}`;
      }

      return detail;
    });

    switch (category) {
      case 'Astronomy':
        achievements.astronomy = {
          achievements: categoryData.length,
          details,
          hasData
        };
        break;
      case 'Chemistry Olympiad':
        achievements.chemistryOlympiad = {
          achievements: categoryData.length,
          details,
          hasData
        };
        break;
      case 'Math Olympiad':
        achievements.mathOlympiad = {
          achievements: categoryData.length,
          details,
          hasData
        };
        break;
      case 'Robotics':
        achievements.robotics = {
          achievements: categoryData.length,
          details,
          hasData
        };
        break;
      case 'National STEM':
        achievements.nationalStem = {
          achievements: categoryData.length,
          details,
          hasData
        };
        break;
    }
  });

  return achievements;
}

async function processCultureData(cultureData: any): Promise<SchoolCulture> {
  if (!cultureData) {
    return {
      coreValues: [],
      characterFocus: [],
      learningEnvironment: 'Information not available',
      communityEngagement: 'Information not available',
      description: 'School culture information is currently being updated.'
    };
  }

  // Extract culture themes from /api/options categories
  const coreValues = extractCultureThemes(cultureData.long_summary);

  return {
    coreValues,
    characterFocus: [], // Removed as per requirements
    learningEnvironment: '', // Removed as per requirements
    communityEngagement: '', // Removed as per requirements
    description: cultureData.short_summary || cultureData.long_summary || 'School culture information is being updated.'
  };
}

function extractCultureThemes(summary: string): string[] {
  // Culture categories from /api/options
  const cultureCategories = [
    'Service/Care', 'Integrity/Moral Courage', 'Excellence', 'Compassion/Empathy',
    'Leadership', 'Faith-based Character', 'People-centred Respect',
    'Passion & Lifelong Learning', 'Responsibility/Accountability',
    'Courage / Tenacity', 'Diversity & Inclusiveness', 'Innovation / Pioneering',
    'Accountability / Stewardship', 'Holistic Development', 'Scholarship & Leadership Excellence'
  ];

  if (!summary) return [];

  const foundThemes = cultureCategories.filter(theme => {
    const keywords = theme.toLowerCase().split(/[\/\s&]+/);
    return keywords.some(keyword =>
      summary.toLowerCase().includes(keyword) && keyword.length > 2
    );
  });

  return foundThemes.slice(0, 5); // Limit to 5 themes
}


function processCutoffData(copRanges: any): CutoffData {
  if (!copRanges || !Array.isArray(copRanges)) {
    return { open: [] };
  }

  const cutoffs: CutoffData = { open: [] };

  copRanges.forEach(range => {
    // IP program data (posting_group is null)
    if (range.posting_group === null && range.nonaffiliated_min_score && range.nonaffiliated_max_score) {
      cutoffs.ip = {
        min: range.nonaffiliated_min_score,
        max: range.nonaffiliated_max_score,
        year: 2024
      };
    }

    // Affiliated program data
    if (range.affiliated_min_score && range.affiliated_max_score) {
      cutoffs.affiliated = {
        min: range.affiliated_min_score,
        max: range.affiliated_max_score,
        year: 2024
      };
    }

    // Open posting group data - include even if scores are null to show "No data available"
    if (range.posting_group && [1, 2, 3].includes(range.posting_group)) {
      const pgData: any = {
        pg: range.posting_group as 1 | 2 | 3,
        year: 2024
      };

      if (range.nonaffiliated_min_score && range.nonaffiliated_max_score) {
        pgData.min = range.nonaffiliated_min_score;
        pgData.max = range.nonaffiliated_max_score;
      } else {
        // Mark as no data available
        pgData.min = null;
        pgData.max = null;
      }

      cutoffs.open.push(pgData);
    }
  });

  // Sort posting groups by tier (PG3 = top tier first)
  cutoffs.open.sort((a, b) => b.pg - a.pg);

  return cutoffs;
}

function hasIPProgram(cutoffs: CutoffData): boolean {
  return cutoffs.ip !== undefined;
}