# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
npm run dev          # Start Next.js development server at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint validation

# No test suite is currently configured
```

# Claude Project Instructions

I'm a project manager with limited coding experience who is looking to become more technical. When you're coding and doing your work ensure that you ask enough clarifying questions or guide me as necessary so that we are building a robust, scalable, technically strong app

## Project Architecture

**School Advisor SG** is an AI-powered Singapore secondary school finder with sophisticated ranking algorithms and data analysis capabilities.

### Tech Stack
- **Next.js 15.4.2** with App Router and TypeScript
- **Supabase** PostgreSQL with custom RPC functions
- **SWR** for data fetching and caching
- **Tailwind CSS 4** for styling
- **Python ETL** scripts for data processing

### Core Application Flow

#### Two Main User Journeys
1. **Distance Search** (`/` home page): Quick postal code-based school search
2. **AI Assistant** (`/ranking`): Multi-criteria ranking with sports, CCA, and culture matching

#### Data Architecture
The application relies heavily on **Supabase RPC functions** rather than simple table queries:

- `rank_schools`: Distance-first ranking for home page
- `rank_schools1`: Multi-criteria ranking with weighted preferences
- `explain` API: Complex sports/CCA performance analysis

#### API Route Patterns
All API routes in `src/app/api/` follow this pattern:
- Supabase client creation with service role key
- Input validation for Singapore-specific data (PSLE scores 4-30, 6-digit postal codes)
- RPC function calls with complex parameter mapping
- Data transformation for UI consumption

### Singapore Education System Context

This application requires understanding of Singapore's education system:

- **PSLE Scores**: 4-30 scale (lower is better)
- **Primary School Affiliations**: Secondary schools affiliated with Primary schools can have a slightly easier cut-off point for primary school students (lower cutoff score schools are academically stronger; Cutoff 4 is the highest score a student can get)
- **Posting Groups**: PG3 (top tier) to PG1, plus Integrated Program (IP)
- **Cut-off Trends**: No cut-off trends are present. All cutoff scores are for 2024 only
- **National School Games**: Sports performance data source (2022-2024)

### Key File Locations

#### Database & ETL
- `supabase/rank_schools1.sql`: Main ranking algorithm (200+ lines)
- `supabase/tables_schema.sql`: Database structure
- `backend/`: Python scripts for data ingestion and processing

#### Documentation
- `baseline_spec.md`: Complete technical specification
- `Phase2spec.md`: School profiles and comparison tool requirements
- `todo.md`: Current development tasks

#### Core Components
- `src/app/page.tsx`: Distance-based search (400+ lines)
- `src/app/ranking/page.tsx`: AI-powered matching (1000+ lines with complex UI)
- `src/app/api/explain/route.ts`: Sports/CCA analysis (800+ lines)

## Development Context

### Current Development Phase
**Phase 2**: Implementing school profiles and comparison features (Apple-style design)

Progress:
- ✅ Specifications and requirements documented
- ⏳ Building individual school profile pages (`/school/[code]`)
- ⏳ Creating side-by-side comparison interface (`/compare`)

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_MAPS_API_KEY=
```

### Important Patterns

#### Supabase RPC Integration
```typescript
const { data, error } = await supabase.rpc('rank_schools1', {
  user_score: psle_score,
  user_lat: lat,
  user_lng: lng,
  // ... many parameters for ranking algorithm
});
```

#### Primary School Slug Generation
```typescript
function slugify(input: string): string | null {
  return input
    .toLowerCase()
    .replace(/'/g, "'")
    .replace(/&/g, ' and ')
    .replace(/\./g, '')
    .replace(/[^a-z0-9'\s-]/g, '')
    .trim()
    .replace(/['\s]+/g, '-');
}
```

#### Weight Mapping for Preferences
```typescript
const toWeight = (v: string) => (v === 'High' ? 0.4 : v === 'Medium' ? 0.2 : 0.0);
```

### Data Processing Pipeline

1. **ETL Scripts** (`backend/`): Python scripts ingest raw data
2. **Supabase Functions**: Complex SQL for school ranking and matching
3. **API Layer**: Next.js routes transform and validate data
4. **Frontend**: React components with SWR caching

### Design Principles

**Apple-Inspired UI**: Clean metric cards, subtle shadows, generous whitespace
- Consistent 8px grid spacing
- Pink accent color (#ec4899) for primary actions
- Badge system for school attributes (gender, IP status, affiliations)

### Notable Complexity Areas

#### Sports Performance Analysis
The `explain` API performs sophisticated analysis:
- Uses `school_sports_scores` table for aggregated performance data
- Scoring system: Higher scores = better performance (opposite of PSLE)
- Calculates strength ratings (Very Strong/Strong/Fair) based on score thresholds
- Generates natural language explanations with sport-specific achievements
- 19 available sports defined in `/api/options` route
- Handles missing data with "Sports data not available" messaging

#### Cut-off Score Logic
Complex affiliation-aware scoring:
- IP (Integrated Program) tracks
- Affiliated vs non-affiliated admission paths
- Multiple posting group options per school
- Historical trend analysis

#### CCA Achievement Analysis
Limited to 5 specific categories from `/api/options`:
- Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, National STEM
- Uses `school_cca_details` table for competition results and achievements
- Displays "CCA data not available" when no performance data exists
- Achievement tracking based on competition placements and awards

#### Culture Matching
AI-generated school culture summaries with:
- Core values extraction from `school_culture_summaries` table
- 15 culture traits available from `/api/options` route
- Character development focus analysis
- Learning environment categorization

## Critical Implementation Notes

- Always validate PSLE scores within 4-30 range (lower = better)
- Sports scoring: Higher scores = better performance (opposite of PSLE)
- Use `school_sports_scores` table for performance data (not `school_sport_results`)
- CCA categories limited to exactly 5 options from `/api/options` route
- Display "Sports or CCA data not available" for missing performance data
- Use Haversine formula for distance calculations
- Handle both `code` and `school_code` column variants in database queries
- Implement proper error handling for RPC function failures
- Consider mobile-first responsive design for all new components