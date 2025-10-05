// School data types based on Supabase table schemas

// Basic school information from secondary_with_affiliations table
export interface SecondarySchool {
  code: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cop_ranges: any; // JSONB - cut-off point ranges
  affiliated_primaries: any; // JSONB - affiliated primary schools
  affiliated_primary_slugs: string[];
  gender: 'Boys' | 'Girls' | 'Co-ed';
}

// Sports performance from school_sports_scores table (aggregated data)
export interface SchoolSportsScore {
  school_slug: string;
  sport: string;
  score: number; // Higher = better performance
  year: number;
  code: number;
  score_breakdown: {
    by_level?: Record<string, number>; // Zonal, National
    by_gender?: Record<string, number>; // Boys, Girls
    by_division?: Record<string, number>; // A, B, C
  } | null;
}

// CCA details from school_cca_details table
export interface SchoolCCADetail {
  id: string;
  code: number;
  school_slug: string;
  cca: string;
  year: number;
  event_name: string;
  level: string | null;
  category: string | null;
  gender: string | null;
  division: string | null;
  award: string | null;
  position: number | null;
  score: number | null;
  source_url: string | null;
  notes: string | null;
  event_key: string;
  created_at: string;
  updated_at: string;
}

// CCA scores from school_cca_scores table
export interface SchoolCCAScore {
  school_slug: string;
  cca: string;
  score: number;
  year: number;
  code: string;
}

// Sports results from school_sport_results table
export interface SchoolSportResult {
  school_slug: string;
  sport: string;
  year: number;
  division: string; // A, B, C
  gender: string; // Boys, Girls, Mixed
  result: string; // Finals, Semifinals, Quarterfinals, etc.
  competition?: string; // National School Games, Zonal, etc.
  sportCategory?: string | null; // Sport category when available
  code: number;
}

// Culture summaries from school_culture_summaries table
export interface SchoolCultureSummary {
  school_code: string;
  school_slug: string | null;
  school_name: string | null;
  short_summary: string;
  long_summary: string;
  sources: any; // JSONB array
  source_hash: string;
  updated_at: string;
}

// Cut-off data structure (2024 only, lower scores = better)
export interface CutoffData {
  ip?: {
    min: number;
    max: number;
    year: 2024;
  };
  affiliated?: {
    min: number;
    max: number;
    year: 2024;
  };
  open: {
    pg: 1 | 2 | 3; // PG3 = top tier, PG2 = mid, PG1 = bottom
    min: number | null;
    max: number | null;
    year: 2024;
  }[];
}

// Sports performance data (processed from school_sports_scores + school_sport_results)
export interface SportsPerformance {
  topSports: {
    sport: string;
    strength: 'Very Strong' | 'Strong' | 'Fair'; // From school_sports_scores.score thresholds
    achievementSummary: string; // Meaningful description from school_sport_results
    detailedResults: {
      year: number;
      division: string; // A, B, C
      gender: string; // Boys, Girls, Mixed
      result: string; // Finals, Semifinals, Quarterfinals, etc.
      competition?: string; // National School Games, Zonal, etc.
      sportCategory?: string | null; // Sport category when available
    }[];
    years: number[];
  }[];
  totalSportsWithData: number;
  sportsWithoutData: string[]; // Sports with "competition data not available"
}

// CCA achievements data (limited to 5 specific categories)
export interface CCAchievements {
  astronomy?: {
    achievements: number;
    details: string[];
    hasData: boolean;
  };
  chemistryOlympiad?: {
    achievements: number;
    details: string[];
    hasData: boolean;
  };
  mathOlympiad?: {
    achievements: number;
    details: string[];
    hasData: boolean;
  };
  robotics?: {
    achievements: number;
    details: string[];
    hasData: boolean;
  };
  nationalStem?: {
    achievements: number;
    details: string[];
    hasData: boolean;
  };
  availableCategories: number; // Max 5
  categoriesWithData: number;
}

// School culture data
export interface SchoolCulture {
  coreValues: string[];
  characterFocus: string[];
  learningEnvironment: string;
  communityEngagement: string;
  description: string; // 120-word summary
}

// Complete school profile interface
export interface SchoolProfile {
  // Basic Information
  code: string;
  name: string;
  address: string;
  gender: 'Boys' | 'Girls' | 'Co-ed';
  hasIP: boolean;
  ipDetails?: string;
  distance?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Cut-off Scores (2024 only, lower scores = better schools)
  cutoffs: CutoffData;

  // Sports Performance (higher scores = better)
  sports: SportsPerformance;

  // CCA Achievements (limited to 5 specific categories)
  ccas: CCAchievements;

  // School Culture
  culture: SchoolCulture;
}

// Comparison state management
export interface ComparisonState {
  selectedSchools: SchoolProfile[];
  maxSchools: 4;
  isComparing: boolean;
}

// Search and ranking interfaces (existing)
export interface SearchParams {
  score: number;
  primary: string;
  lat: number;
  lng: number;
  maxDistanceKm?: number;
}

export interface RankingParams {
  psle_score: number;
  gender: 'Any' | 'Boys' | 'Girls' | 'Co-ed';
  postal_code: string;
  primary_school: string;
  distance_importance: 'Low' | 'Medium' | 'High';
  sports_importance: 'Low' | 'Medium' | 'High';
  cca_importance: 'Low' | 'Medium' | 'High';
  culture_importance: 'Low' | 'Medium' | 'High';
  sports_selected: string[];
  ccas_selected: string[];
  culture_selected: string[];
  limit: number;
  lat: number;
  lng: number;
}

// Available options from /api/options
export interface OptionsData {
  sports: string[]; // 19 available sports
  ccas: string[]; // 5 specific categories: Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, National STEM
  culture: string[]; // 15 available traits
}

// Performance strength levels
export type PerformanceStrength = 'Very Strong' | 'Strong' | 'Fair';

// Posting group levels (PG3 = top tier)
export type PostingGroup = 1 | 2 | 3;