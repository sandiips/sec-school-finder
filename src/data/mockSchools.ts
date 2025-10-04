import { SchoolProfile, SportsPerformance, CCAchievements, SchoolCulture, CutoffData } from '@/types/school';

// Available sports from /api/options (19 sports)
const AVAILABLE_SPORTS = [
  'Badminton', 'Basketball', 'Cross Country', 'Football', 'Hockey', 'Netball',
  'Rugby', 'Softball', 'Swimming', 'Table Tennis', 'Tennis', 'Track and Field',
  'Volleyball', 'Water Polo', 'Bowling', 'Golf', 'Sailing', 'Squash', 'Wushu'
];

// Available CCA categories (5 specific from /api/options)
const AVAILABLE_CCAS = [
  'Astronomy',
  'Chemistry Olympiad',
  'Math Olympiad',
  'Robotics',
  'National STEM'
];

// Generate realistic cut-off data (lower scores = better schools)
function generateCutoffData(schoolTier: 'top' | 'mid' | 'bottom', hasIP: boolean = false, hasAffiliated: boolean = false): CutoffData {
  const baseScores = {
    top: { ip: 6, aff: 10, pg3: 12, pg2: 15, pg1: 18 },
    mid: { ip: 8, aff: 14, pg3: 16, pg2: 20, pg1: 24 },
    bottom: { ip: 12, aff: 18, pg3: 22, pg2: 26, pg1: 28 }
  };

  const base = baseScores[schoolTier];

  return {
    ip: hasIP ? {
      min: base.ip,
      max: base.ip + 2,
      year: 2024
    } : undefined,
    affiliated: hasAffiliated ? {
      min: base.aff,
      max: base.aff + 2,
      year: 2024
    } : undefined,
    open: [
      { pg: 3, min: base.pg3, max: base.pg3 + 2, year: 2024 },
      { pg: 2, min: base.pg2, max: base.pg2 + 2, year: 2024 },
      { pg: 1, min: base.pg1, max: base.pg1 + 2, year: 2024 }
    ]
  };
}

// Generate realistic sports results based on school tier
function generateSportsPerformance(schoolTier: 'top' | 'mid' | 'bottom'): SportsPerformance {
  const numSports = Math.floor(Math.random() * 8) + 5; // 5-12 sports with data
  const selectedSports = AVAILABLE_SPORTS.slice().sort(() => 0.5 - Math.random()).slice(0, numSports);

  const results = ['Finals', 'Semifinals', 'Quarterfinals', 'Top 8', 'Top 16'];
  const divisions = ['A', 'B', 'C'];
  const genders = ['Boys', 'Girls', 'Mixed'];
  const years = [2022, 2023, 2024];

  const topSports = selectedSports.map(sport => {
    let strength: 'Very Strong' | 'Strong' | 'Fair';
    let numResults: number;

    // Determine strength and number of good results based on school tier
    if (schoolTier === 'top') {
      strength = Math.random() > 0.3 ? 'Very Strong' : 'Strong';
      numResults = Math.floor(Math.random() * 4) + 3; // 3-6 results
    } else if (schoolTier === 'mid') {
      strength = Math.random() > 0.5 ? 'Strong' : 'Fair';
      numResults = Math.floor(Math.random() * 3) + 2; // 2-4 results
    } else {
      strength = Math.random() > 0.7 ? 'Strong' : 'Fair';
      numResults = Math.floor(Math.random() * 2) + 1; // 1-2 results
    }

    // Generate detailed results
    const detailedResults = Array.from({ length: numResults }, () => {
      const year = years[Math.floor(Math.random() * years.length)];
      const division = divisions[Math.floor(Math.random() * divisions.length)];
      const gender = genders[Math.floor(Math.random() * genders.length)];

      // Better schools get better results more often
      let resultIndex: number;
      if (schoolTier === 'top') {
        resultIndex = Math.floor(Math.random() * 3); // Mostly Finals, Semifinals, Quarterfinals
      } else if (schoolTier === 'mid') {
        resultIndex = Math.floor(Math.random() * 4) + 1; // Mostly Semifinals to Top 8
      } else {
        resultIndex = Math.floor(Math.random() * 3) + 2; // Mostly Quarterfinals to Top 16
      }

      const result = results[resultIndex];

      return {
        year,
        division,
        gender,
        result,
        competition: 'National School Games'
      };
    });

    // Generate achievement summary based on results
    const finalsCount = detailedResults.filter(r => r.result === 'Finals').length;
    const semifinalsCount = detailedResults.filter(r => r.result === 'Semifinals').length;
    const quarterfinalsCount = detailedResults.filter(r => r.result === 'Quarterfinals').length;

    let achievementSummary = '';
    if (finalsCount > 0) {
      achievementSummary += `${finalsCount} Finals`;
      if (semifinalsCount > 0) achievementSummary += `, ${semifinalsCount} Semifinals`;
      achievementSummary += ` in ${Math.min(...detailedResults.map(r => r.year))}-${Math.max(...detailedResults.map(r => r.year))}`;
    } else if (semifinalsCount > 0) {
      achievementSummary += `${semifinalsCount} Semifinals`;
      if (quarterfinalsCount > 0) achievementSummary += `, ${quarterfinalsCount} Quarterfinals`;
      achievementSummary += ` in recent years`;
    } else if (quarterfinalsCount > 0) {
      achievementSummary += `${quarterfinalsCount} Quarterfinals, consistent competitive performances`;
    } else {
      achievementSummary += 'Regular competitive participation, developing program';
    }

    return {
      sport,
      strength,
      achievementSummary,
      detailedResults,
      years: [...new Set(detailedResults.map(r => r.year))].sort()
    };
  }).sort((a, b) => {
    // Sort by strength first, then by achievement quality
    const strengthOrder = { 'Very Strong': 3, 'Strong': 2, 'Fair': 1 };
    if (strengthOrder[a.strength] !== strengthOrder[b.strength]) {
      return strengthOrder[b.strength] - strengthOrder[a.strength];
    }
    return b.detailedResults.length - a.detailedResults.length;
  }).slice(0, 5); // Top 5 sports

  const sportsWithoutData = AVAILABLE_SPORTS.filter(sport => !selectedSports.includes(sport));

  return {
    topSports,
    totalSportsWithData: selectedSports.length,
    sportsWithoutData
  };
}

// Generate CCA achievements (5 specific categories)
function generateCCAchievements(): CCAchievements {
  const categories = ['astronomy', 'chemistryOlympiad', 'mathOlympiad', 'robotics', 'nationalStem'] as const;
  const result: Partial<CCAchievements> = {};
  let categoriesWithData = 0;

  categories.forEach(category => {
    const hasData = Math.random() > 0.3; // 70% chance of having data

    if (hasData) {
      const achievements = Math.floor(Math.random() * 5) + 1; // 1-5 achievements
      result[category] = {
        achievements,
        details: Array.from({ length: achievements }, (_, i) =>
          `Achievement ${i + 1} in ${AVAILABLE_CCAS[categories.indexOf(category)]}`
        ),
        hasData: true
      };
      categoriesWithData++;
    } else {
      result[category] = {
        achievements: 0,
        details: [],
        hasData: false
      };
    }
  });

  return {
    ...result,
    availableCategories: 5,
    categoriesWithData
  } as CCAchievements;
}

// Generate school culture data
function generateSchoolCulture(schoolName: string): SchoolCulture {
  const coreValuesList = [
    ['Excellence', 'Integrity', 'Innovation'],
    ['Character', 'Service', 'Leadership'],
    ['Respect', 'Responsibility', 'Resilience'],
    ['Wisdom', 'Compassion', 'Courage'],
    ['Truth', 'Excellence', 'Service']
  ];

  const characterFocusList = [
    ['Leadership Development', 'Character Building'],
    ['Critical Thinking', 'Innovation'],
    ['Service Learning', 'Community Engagement'],
    ['Global Citizenship', 'Cultural Awareness']
  ];

  const learningEnvironments = [
    'Innovation-driven with emphasis on critical thinking',
    'Tradition-based with modern teaching methods',
    'Collaborative learning with project-based approach',
    'Technology-enhanced personalized learning'
  ];

  const communityEngagements = [
    'Strong service learning programs with community partnerships',
    'Active parent-school collaboration and volunteer programs',
    'Extensive alumni network supporting current students',
    'Regular community service and environmental initiatives'
  ];

  return {
    coreValues: coreValuesList[Math.floor(Math.random() * coreValuesList.length)],
    characterFocus: characterFocusList[Math.floor(Math.random() * characterFocusList.length)],
    learningEnvironment: learningEnvironments[Math.floor(Math.random() * learningEnvironments.length)],
    communityEngagement: communityEngagements[Math.floor(Math.random() * communityEngagements.length)],
    description: `${schoolName} is committed to nurturing well-rounded individuals who excel academically while developing strong character and leadership skills. Our comprehensive curriculum emphasizes both intellectual growth and moral development, preparing students for future challenges. Through diverse co-curricular activities and community service programs, students develop essential life skills and social responsibility. Our dedicated teaching staff creates a supportive learning environment that encourages creativity, critical thinking, and collaborative problem-solving.`
  };
}

// Mock school data with realistic Singapore school names
export const mockSchools: SchoolProfile[] = [
  {
    code: '3017',
    name: 'Raffles Institution',
    address: '1 Raffles Institution Lane, Singapore 575954',
    gender: 'Boys',
    hasIP: true,
    ipDetails: 'Raffles Programme (RP) - 6-year integrated programme',
    distance: 2.3,
    cutoffs: generateCutoffData('top', true, true), // Has both IP and affiliated
    sports: generateSportsPerformance('top'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Raffles Institution')
  },
  {
    code: '3018',
    name: 'Raffles Girls\' School',
    address: '2 Braddell Rise, Singapore 518873',
    gender: 'Girls',
    hasIP: true,
    ipDetails: 'Raffles Girls\' Programme (RGP) - 6-year integrated programme',
    distance: 2.8,
    cutoffs: generateCutoffData('top', true, false), // Has IP, no affiliated
    sports: generateSportsPerformance('top'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Raffles Girls\' School')
  },
  {
    code: '3019',
    name: 'Hwa Chong Institution',
    address: '661 Bukit Timah Road, Singapore 269734',
    gender: 'Boys',
    hasIP: true,
    ipDetails: 'Integrated Programme (IP) - 6-year programme',
    distance: 3.5,
    cutoffs: generateCutoffData('top', true, true), // Has both IP and affiliated
    sports: generateSportsPerformance('top'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Hwa Chong Institution')
  },
  {
    code: '3020',
    name: 'Nanyang Girls\' High School',
    address: '2 Linden Drive, Singapore 288683',
    gender: 'Girls',
    hasIP: true,
    ipDetails: 'Integrated Programme (IP) - 6-year programme',
    distance: 4.1,
    cutoffs: generateCutoffData('top', true, false), // Has IP, no affiliated
    sports: generateSportsPerformance('top'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Nanyang Girls\' High School')
  },
  {
    code: '3021',
    name: 'Victoria School',
    address: '15 Siglap Link, Singapore 449724',
    gender: 'Boys',
    hasIP: false,
    distance: 5.2,
    cutoffs: generateCutoffData('top', false, true), // No IP, but has affiliated
    sports: generateSportsPerformance('top'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Victoria School')
  },
  {
    code: '3022',
    name: 'Methodist Girls\' School',
    address: '11 Blackmore Drive, Singapore 599986',
    gender: 'Girls',
    hasIP: false,
    distance: 3.7,
    cutoffs: generateCutoffData('mid', false, false), // No IP, No affiliated
    sports: generateSportsPerformance('mid'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Methodist Girls\' School')
  },
  {
    code: '3023',
    name: 'Anglo-Chinese School (Independent)',
    address: '121 Dover Road, Singapore 139650',
    gender: 'Boys',
    hasIP: true,
    ipDetails: 'Integrated Programme (IP) - 6-year programme',
    distance: 4.8,
    cutoffs: generateCutoffData('top', true, true), // Has both IP and affiliated
    sports: generateSportsPerformance('top'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Anglo-Chinese School (Independent)')
  },
  {
    code: '3024',
    name: 'Dunman High School',
    address: '10 Tanjong Rhu Road, Singapore 436895',
    gender: 'Co-ed',
    hasIP: true,
    ipDetails: 'Integrated Programme (IP) - 6-year programme',
    distance: 6.1,
    cutoffs: generateCutoffData('top', true, false), // Has IP, no affiliated
    sports: generateSportsPerformance('mid'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Dunman High School')
  },
  {
    code: '3025',
    name: 'River Valley High School',
    address: '6 Boon Lay Avenue, Singapore 649961',
    gender: 'Co-ed',
    hasIP: true,
    ipDetails: 'Integrated Programme (IP) - 6-year programme',
    distance: 7.3,
    cutoffs: generateCutoffData('mid', true, false), // Has IP, no affiliated
    sports: generateSportsPerformance('mid'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('River Valley High School')
  },
  {
    code: '3026',
    name: 'Cedar Girls\' Secondary School',
    address: '21 Bedok North Road, Singapore 469656',
    gender: 'Girls',
    hasIP: false,
    distance: 8.2,
    cutoffs: generateCutoffData('mid', false, true), // No IP, but has affiliated
    sports: generateSportsPerformance('mid'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Cedar Girls\' Secondary School')
  },
  {
    code: '3027',
    name: 'Chung Cheng High School (Main)',
    address: '825 Yishun Ring Road, Singapore 768683',
    gender: 'Co-ed',
    hasIP: false,
    distance: 12.5,
    cutoffs: generateCutoffData('mid', false, false), // No IP, no affiliated
    sports: generateSportsPerformance('mid'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Chung Cheng High School (Main)')
  },
  {
    code: '3028',
    name: 'Temasek Secondary School',
    address: '1 Bedok South Road, Singapore 460001',
    gender: 'Co-ed',
    hasIP: false,
    distance: 9.7,
    cutoffs: generateCutoffData('bottom', false, false), // No IP, No affiliated
    sports: generateSportsPerformance('bottom'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Temasek Secondary School')
  },
  {
    code: '3029',
    name: 'Bukit Merah Secondary School',
    address: '1 Bukit Merah Central, Singapore 159836',
    gender: 'Co-ed',
    hasIP: false,
    distance: 5.8,
    cutoffs: generateCutoffData('bottom', false, true), // No IP, but has affiliated
    sports: generateSportsPerformance('bottom'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Bukit Merah Secondary School')
  },
  {
    code: '3030',
    name: 'Jurong Secondary School',
    address: '1 Yuan Ching Road, Singapore 618643',
    gender: 'Co-ed',
    hasIP: false,
    distance: 15.2,
    cutoffs: generateCutoffData('bottom', false, false), // No IP, no affiliated
    sports: generateSportsPerformance('bottom'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Jurong Secondary School')
  },
  {
    code: '3031',
    name: 'Singapore Chinese Girls\' School',
    address: '142 Emerald Hill Road, Singapore 229588',
    gender: 'Girls',
    hasIP: true,
    ipDetails: 'Integrated Programme (IP) - 6-year programme',
    distance: 2.9,
    cutoffs: generateCutoffData('top', true, true), // Has both IP and affiliated
    sports: generateSportsPerformance('top'),
    ccas: generateCCAchievements(),
    culture: generateSchoolCulture('Singapore Chinese Girls\' School')
  }
];

// Helper functions for data generation
export function getSchoolByCode(code: string): SchoolProfile | undefined {
  return mockSchools.find(school => school.code === code);
}

export function getSchoolsByGender(gender: 'Boys' | 'Girls' | 'Co-ed' | 'Any'): SchoolProfile[] {
  if (gender === 'Any') return mockSchools;
  return mockSchools.filter(school => school.gender === gender);
}

export function getSchoolsWithIP(): SchoolProfile[] {
  return mockSchools.filter(school => school.hasIP);
}

export function getSchoolsNearLocation(lat: number, lng: number, maxDistance: number): SchoolProfile[] {
  // Simple distance filter for mock data
  return mockSchools.filter(school => (school.distance || 0) <= maxDistance);
}

// Validation functions for data consistency
export function validateSchoolProfile(profile: SchoolProfile): boolean {
  // Check required fields
  if (!profile.code || !profile.name || !profile.address) return false;

  // Validate PSLE scoring (lower = better)
  const cutoffs = profile.cutoffs;
  if (cutoffs.ip && (cutoffs.ip.min < 4 || cutoffs.ip.max > 30)) return false;

  // Sports validation - check if sports data exists
  if (profile.sports.topSports.length === 0) return false;

  // Validate CCA categories (max 5)
  if (profile.ccas.availableCategories > 5) return false;

  return true;
}

export function validateAllMockSchools(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  mockSchools.forEach(school => {
    if (!validateSchoolProfile(school)) {
      errors.push(`Invalid school profile: ${school.name}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}