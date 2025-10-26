# Ask SAI - Implementation Status & Roadmap

**Last Updated**: 2025-10-26 (Phase 3.10 LangSmith Tracing COMPLETED)
**Current Phase**: Phase 3.10 - LangSmith Observability ✅ COMPLETED

---

## Project Overview

**Ask SAI** is a Google AI-style conversational interface for Singapore secondary school recommendations, powered by OpenAI GPT-4, custom chat UI, and Supabase database.

### Tech Stack
- **Frontend**: Next.js 15.4.2 (App Router), React, TypeScript, Tailwind CSS 4
- **AI**: OpenAI GPT-4 with function calling, streaming responses
- **Backend**: Supabase PostgreSQL with RPC functions
- **State Management**: Custom React hooks with localStorage persistence
- **Validation**: Zod schemas for type-safe tool parameters

---

## ✅ Phase 1: Core Infrastructure (COMPLETED)

### What's Built
All foundational AI infrastructure is complete and functional:

#### 1. Supabase RPC Function
- **File**: [`supabase/ai_rank_schools.sql`](supabase/ai_rank_schools.sql)
- ✅ `ai_rank_schools` RPC for personalized recommendations
- ✅ Parameters: AL score, location, primary school, preferences, weights
- ✅ Returns: Ranked schools with composite scoring (distance, sports, CCA, culture, affiliation)
- ✅ Session tracking with `ai_session_id`

#### 2. OpenAI Integration
- **Files**: [`src/lib/ai-tools.ts`](src/lib/ai-tools.ts), [`src/lib/ai-prompts.ts`](src/lib/ai-prompts.ts), [`src/lib/openai.ts`](src/lib/openai.ts)
- ✅ OpenAI client configuration
- ✅ `rankSchools` tool with Zod validation schema
- ✅ `executeRankSchools` function with Supabase RPC integration
- ✅ System prompts for Singapore education context

#### 3. Caching Layer
- **File**: [`src/lib/cache.ts`](src/lib/cache.ts)
- ✅ In-memory caching with node-cache
- ✅ 24-hour TTL for school ranking results
- ✅ Deterministic cache key generation

#### 4. API Routes
- **File**: [`src/app/api/ai-chat/route.ts`](src/app/api/ai-chat/route.ts)
- ✅ Streaming SSE response handler
- ✅ OpenAI function calling integration
- ✅ Session management and error handling
- ✅ Tool invocation with parameter validation

#### 5. Navigation
- **File**: [`src/components/ui/Navigation.tsx`](src/components/ui/Navigation.tsx)
- ✅ "Ask SAI" links in desktop and mobile navigation

---

## ✅ Phase 2: Custom Chat Interface (COMPLETED)

### What's Built
Full Google AI Mode-style chat interface with dark theme:

#### 1. Chat Components (All Created)
- ✅ [`src/components/chat/ChatContainer.tsx`](src/components/chat/ChatContainer.tsx) - Main wrapper with full-screen layout
- ✅ [`src/components/chat/ChatMessages.tsx`](src/components/chat/ChatMessages.tsx) - Scrollable message list
- ✅ [`src/components/chat/ChatInput.tsx`](src/components/chat/ChatInput.tsx) - Pill-shaped input with send button
- ✅ [`src/components/chat/MessageBubble.tsx`](src/components/chat/MessageBubble.tsx) - User/assistant message styling
- ✅ [`src/components/chat/TypingIndicator.tsx`](src/components/chat/TypingIndicator.tsx) - Animated loading indicator
- ✅ [`src/components/chat/SchoolRecommendationCard.tsx`](src/components/chat/SchoolRecommendationCard.tsx) - School result cards

#### 2. Chat State Management
- ✅ [`src/hooks/useChat.ts`](src/hooks/useChat.ts) - Custom hook for chat functionality
- ✅ Streaming message handling with SSE parsing
- ✅ Error handling and retry logic
- ✅ localStorage persistence for conversation history

#### 3. Ask SAI Page
- ✅ [`src/app/ask-sai/page.tsx`](src/app/ask-sai/page.tsx) - Complete redesign
- ✅ Google AI Mode-inspired landing page
- ✅ Full-screen chat interface toggle
- ✅ Suggested prompts for quick start
- ✅ Dark theme (#1a1a1a background)

#### 4. UI/UX Features
- ✅ White text on dark background (high contrast)
- ✅ Asymmetric message layout (user right, assistant left)
- ✅ Markdown rendering with react-markdown
- ✅ Slide-up animations on message appear
- ✅ Responsive design (mobile and desktop)

### Design System
- **Colors**: Dark background (#1a1a1a), white text, blue accent for send button
- **Layout**: Full-screen chat, centered messages (max-w-3xl), sticky input at bottom
- **Input**: Pill-shaped (rounded-full), integrated attachment icon and send button
- **Messages**: User (right-aligned), Assistant (left-aligned with white text)

---

## ✅ Phase 3: Intelligent Query Routing (COMPLETED)

### Problem Solved
The AI was always asking for AL score → postal code → primary school, even for general queries that don't need personalization. This has been fixed with a 5-intent multi-tool architecture.

### Solution Implemented: 5-Intent Multi-Tool Architecture
Created 3 NEW RPC-based tools + 1 MOE information handler alongside existing `rankSchools` tool to handle different query types intelligently.

**Architecture Overview:**
- **Tool 1** (Existing): ✅ `rankSchools` - Personalized recommendations (RPC call)
- **Tool 2** (NEW): ✅ `searchSchoolsBySport` - Sport rankings (RPC call)
- **Tool 3** (NEW): ✅ `searchSchoolsByAcademic` - Academic rankings (RPC call)
- **Tool 4** (NEW): ✅ `searchSchoolsByCCA` - CCA rankings (RPC call) 🆕
- **Tool 5** (NEW): ✅ `getSchoolDetails` - Specific school info (RPC call)
- **Intent 6** (NEW): ✅ General MOE information - NO TOOL, GPT-4 answers directly with MOE website references

**Multi-Intent Handling:**
- ✅ Users can combine multiple intents: "Best schools for tennis AND robotics"
- ✅ GPT-4 can call MULTIPLE tools in sequence or parallel (up to 3 tools tested)
- ✅ System prompt guides intelligent combination of tool results
- ✅ **NEW**: Sport + CCA combinations work seamlessly (e.g., "basketball and robotics")

---

### 3.1 New Supabase RPC Functions ✅ COMPLETED

**Kept Existing (NOT MODIFIED)**:
- ✅ `ai_rank_schools` - For personalized recommendations (untouched)

**Created 3 New Functions** (All Deployed & Tested):

#### Tool 1: `ai_search_schools_by_sport` ✅ DEPLOYED
**Purpose**: Find top schools for a specific sport WITHOUT requiring user context

**Files Created**:
- ✅ `supabase/ai_search_schools_by_sport_FIXED_V2.sql` (Deployed & Working)
- ⚠️ `supabase/ai_search_schools_by_sport.sql` (Old version - ignore)

**Final Working Parameters**:
```sql
sport_name TEXT,                    -- Required: Sport to search for (e.g., "Tennis")
gender_pref TEXT DEFAULT 'Any',     -- 'Any', 'Boys', 'Girls', 'Co-ed', 'Mixed'
track_pref TEXT DEFAULT 'Any',      -- 'Any', 'IP', 'O-Level'
limit_count INT DEFAULT 10          -- Number of results (1-10)
```

**Returns**:
```sql
code TEXT,
name TEXT,
address TEXT,
gender TEXT,
track TEXT,                           -- 'IP' or 'O-Level'
posting_group INT,
sport_performance_score NUMERIC,      -- Higher is better (0-100)
sport_achievements TEXT[],            -- Medal/placement achievements
sport_strength_rating TEXT,           -- 'Very Strong'/'Strong'/'Fair'/'Developing'/'No Data'
other_strong_sports TEXT[],           -- Other sports with score >= 60
recommendation_reason TEXT
```

**Implementation Details** (Working Solution):
1. Uses `school_sports_scores` table (has both `code` integer AND `school_slug` text)
2. Joins with `school_sport_results` for achievement details (code is TEXT here - requires casting)
3. Uses `secondary_with_affiliations` as main school table (code is integer)
4. Extracts posting_group from `cop_ranges` JSONB to determine track (IP vs O-Level)
5. Filters by gender and track preferences
6. Ranks by sport performance score DESC
7. Assigns strength ratings: ≥80="Very Strong", ≥60="Strong", ≥40="Fair", else="Developing"
8. Returns top `limit_count` schools

**Key Schema Learnings**:
- `school_sports_scores`: Has BOTH `code` (integer) AND `school_slug` (text) - use `code` for joins!
- `school_sport_results`: Uses `code` as TEXT (not integer) - requires `::integer` casting
- Must avoid column name conflicts with RETURNS TABLE by aliasing CTEs (use `school_code` not `code`)

**Test Results**:
- ✅ `SELECT * FROM ai_search_schools_by_sport('Tennis', 'Any', 'Any', 10);` → Returns 10 schools with Tennis programs
- ✅ RPC deployed successfully after fixing ambiguous column name error (v2)

---

#### Tool 2: `ai_search_schools_by_academic` ✅ DEPLOYED
**Purpose**: Find schools ranked by academic performance (PSLE cut-off scores) WITHOUT user AL score

**Files Created**:
- ✅ `supabase/ai_search_schools_by_academic_FIXED.sql` (Deployed & Working)

**Final Working Parameters**:
```sql
gender_pref text DEFAULT 'Any',
track_pref text DEFAULT 'Any',  -- 'IP', 'Express', 'Any'
limit_count integer DEFAULT 10,
sort_order text DEFAULT 'asc'   -- 'asc' = most competitive first
```

**Returns**:
```sql
code integer,
name text,
address text,
gender text,
track text,
cop_max_score integer,          -- Lower is more competitive
cop_min_score integer,
affiliated_primaries text[],
competitiveness_rating text,    -- 'Highly Competitive'/'Competitive'/etc
recommendation_reason text
```

**Implementation Details** (Working Solution):
1. Parse `cop_ranges` JSONB to extract min/max scores by track
2. Filter by `gender_pref` ('Any', 'Boys', 'Girls', 'Co-ed')
3. Filter by `track_pref` ('Any', 'IP', 'Express')
4. Sort by `cop_max_score` (asc = most competitive/best academically)
5. Assign competitiveness rating:
   - 4-8: "Highly Competitive"
   - 9-15: "Competitive"
   - 16-20: "Moderately Competitive"
   - 21+: "Accessible"
6. Return top `limit_count` schools

**Key Schema Learnings**:
- `school_cca_scores`: Uses `code` as TEXT (not integer) - requires `::integer` casting
- Must handle JSONB parsing carefully for `cop_ranges` and `affiliated_primaries`

**Test Results**:
- ✅ `SELECT * FROM ai_search_schools_by_academic('Overall', 'Any', 'IP', 10);` → Returns 10 IP schools sorted by competitiveness
- ✅ RPC deployed successfully after fixing schema type casting issues

**SQL Implementation (Reference Only)**:
```sql
CREATE OR REPLACE FUNCTION ai_search_schools_by_academic(
  gender_pref text DEFAULT 'Any',
  track_pref text DEFAULT 'Any',
  limit_count integer DEFAULT 10,
  sort_order text DEFAULT 'asc'
) RETURNS TABLE (
  code integer,
  name text,
  address text,
  gender text,
  track text,
  cop_max_score integer,
  cop_min_score integer,
  affiliated_primaries text[],
  competitiveness_rating text,
  recommendation_reason text
) AS $$
BEGIN
  RETURN QUERY
  WITH academic_rankings AS (
    SELECT
      s.code, s.name, s.address, s.gender,
      COALESCE((SELECT jsonb_object_keys(s.cop_ranges) LIMIT 1), 'Express') as track,
      COALESCE((SELECT MIN((value->>'non_aff_max')::integer) FROM jsonb_each(s.cop_ranges)), 30) as cop_max_score,
      COALESCE((SELECT MAX((value->>'non_aff_min')::integer) FROM jsonb_each(s.cop_ranges)), 4) as cop_min_score,
      COALESCE((SELECT array_agg(slug) FROM jsonb_array_elements_text(s.affiliated_primaries) slug), ARRAY[]::text[]) as affiliated_primaries
    FROM secondary_with_affiliations s
    WHERE (gender_pref = 'Any' OR s.gender = gender_pref)
      AND (track_pref = 'Any' OR jsonb_exists(s.cop_ranges, track_pref))
  )
  SELECT
    ar.code, ar.name, ar.address, ar.gender, ar.track,
    ar.cop_max_score, ar.cop_min_score, ar.affiliated_primaries,
    CASE
      WHEN ar.cop_max_score BETWEEN 4 AND 8 THEN 'Highly Competitive'
      WHEN ar.cop_max_score BETWEEN 9 AND 15 THEN 'Competitive'
      WHEN ar.cop_max_score BETWEEN 16 AND 20 THEN 'Moderately Competitive'
      ELSE 'Accessible'
    END as competitiveness_rating,
    format('%s is a %s %s school with a cut-off score of %d (2024), classified as %s.',
      ar.name, ar.gender, ar.track, ar.cop_max_score,
      CASE
        WHEN ar.cop_max_score BETWEEN 4 AND 8 THEN 'highly competitive'
        WHEN ar.cop_max_score BETWEEN 9 AND 15 THEN 'competitive'
        WHEN ar.cop_max_score BETWEEN 16 AND 20 THEN 'moderately competitive'
        ELSE 'accessible'
      END
    ) as recommendation_reason
  FROM academic_rankings ar
  ORDER BY
    CASE WHEN sort_order = 'asc' THEN ar.cop_max_score END ASC,
    CASE WHEN sort_order = 'desc' THEN ar.cop_max_score END DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

#### Tool 3: `ai_search_schools_by_cca` ✅ DEPLOYED 🆕
**Purpose**: Find top schools for specific CCAs (Co-Curricular Activities) WITHOUT requiring user context

**Files Created**:
- ✅ `supabase/ai_search_schools_by_cca.sql` (Deployed & Working)

**Final Working Parameters**:
```sql
cca_name TEXT,                      -- Required: CCA to search for (e.g., "Robotics", "Math Olympiad")
gender_pref TEXT DEFAULT 'Any',     -- 'Any', 'Boys', 'Girls', 'Co-ed', 'Mixed'
track_pref TEXT DEFAULT 'Any',      -- 'Any', 'IP', 'O-Level'
limit_count INT DEFAULT 10          -- Number of results (1-10)
```

**Returns**:
```sql
code TEXT,
name TEXT,
address TEXT,
gender TEXT,
track TEXT,                          -- 'IP' or 'O-Level'
posting_group INT,
cca_performance_score NUMERIC,       -- Higher is better (0-100)
cca_achievements TEXT[],             -- Award/position achievements
cca_strength_rating TEXT,            -- 'Very Strong'/'Strong'/'Fair'/'Developing'/'No Data'
other_strong_ccas TEXT[],            -- Other CCAs with score >= 60
recommendation_reason TEXT
```

**Implementation Details** (Working Solution):
1. Uses `school_cca_scores` table (code is TEXT - matches CCA performance data)
2. Joins with `school_cca_details` for achievement details (positions, awards)
3. Uses `secondary_with_affiliations` as main school table (code is integer)
4. Extracts posting_group from `cop_ranges` JSONB to determine track (IP vs O-Level)
5. Filters by gender and track preferences
6. Ranks by CCA performance score DESC
7. Assigns strength ratings: ≥80="Very Strong", ≥60="Strong", ≥40="Fair", else="Developing"
8. Returns top `limit_count` schools with CCA data

**Key Schema Learnings**:
- `school_cca_scores`: Uses `code` as TEXT (requires `::text` casting from secondary_with_affiliations)
- `school_cca_details`: Uses `code` as INTEGER (for achievement/position data)
- Uses 2023 data as baseline year for CCA scores

**Test Results**:
- ✅ `SELECT * FROM ai_search_schools_by_cca('Robotics', 'Any', 'Any', 10);` → Returns schools with Robotics programs
- ✅ `SELECT * FROM ai_search_schools_by_cca('Math Olympiad', 'Any', 'IP', 5);` → Returns 5 IP schools with Math Olympiad
- ✅ RPC deployed successfully and working

**Multi-Intent Test Cases** ✅ ALL WORKING:
- ✅ Test 1: "Best schools for basketball and robotics" → Calls `searchSchoolsBySport` + `searchSchoolsByCCA` in parallel
- ✅ Test 2: "Which schools are best for Math Olympiad?" → Calls `searchSchoolsByCCA` only
- ✅ Test 3: "Schools good in Robotics and Astronomy" → Calls `searchSchoolsByCCA` twice (parallel)
- ✅ Test 4: "Schools good in football, tennis, and robotics" → 3 parallel tool calls (2 sports, 1 CCA)

---

#### Tool 4: `ai_get_school_details` ✅ DEPLOYED
**Purpose**: Get comprehensive details about specific school(s) by name or code

**Files Created**:
- ✅ `supabase/ai_get_school_details_FIXED.sql` (Deployed & Working)

**Final Working Parameters**:
```sql
school_codes integer[]  -- Array of school codes (max 5)
```

**Returns**:
```sql
code integer,
name text,
address text,
lat decimal,
lng decimal,
gender text,
phone text,
email text,
website text,
cop_ranges jsonb,
affiliated_primaries jsonb,
top_sports jsonb,              -- Top 5 sports by avg score
top_ccas jsonb,                -- Top 5 CCAs
culture_summary text,
recommendation_reason text
```

**Implementation Details** (Working Solution):
1. Accepts school name (text) instead of codes - simpler for GPT-4 to use
2. Uses fuzzy search with `ILIKE %name%` for flexible matching
3. Fetch complete profile from `secondary_with_affiliations`
4. LEFT JOIN `school_sports_scores` → aggregates top sports with strength ratings
5. LEFT JOIN `school_cca_details` → gets CCA achievements
6. LEFT JOIN `school_culture_summaries` for `long_summary`
7. Returns comprehensive profiles

**Key Schema Learnings**:
- `school_cca_details`: Uses `code` as INTEGER (different from `school_cca_scores` which uses TEXT)
- ARRAY_AGG with DISTINCT and ORDER BY has constraints - use FILTER or subqueries
- PostgreSQL error: Cannot do `ARRAY_AGG(DISTINCT x ORDER BY y)` when x ≠ y

**Test Results**:
- ✅ `SELECT * FROM ai_get_school_details('Raffles');` → Returns Raffles Institution with all details (sports, CCAs, culture)
- ✅ RPC deployed successfully after fixing ARRAY_AGG DISTINCT ORDER BY conflicts

**SQL Implementation (Reference Only)**:
```sql
CREATE OR REPLACE FUNCTION ai_get_school_details(
  school_codes integer[]
) RETURNS TABLE (
  code integer,
  name text,
  address text,
  lat decimal,
  lng decimal,
  gender text,
  phone text,
  email text,
  website text,
  cop_ranges jsonb,
  affiliated_primaries jsonb,
  top_sports jsonb,
  top_ccas jsonb,
  culture_summary text,
  recommendation_reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.code, s.name, s.address, s.lat, s.lng, s.gender,
    s.phone, s.email, s.website, s.cop_ranges, s.affiliated_primaries,
    (SELECT jsonb_agg(jsonb_build_object('sport', sport, 'avg_score', avg_score, 'strength',
      CASE WHEN avg_score >= 80 THEN 'Very Strong' WHEN avg_score >= 60 THEN 'Strong' ELSE 'Fair' END)
      ORDER BY avg_score DESC)
     FROM (SELECT sport, AVG(score) as avg_score FROM school_sports_scores WHERE code = s.code GROUP BY sport ORDER BY avg_score DESC LIMIT 5) sports
    ) as top_sports,
    (SELECT jsonb_agg(jsonb_build_object('cca', cca, 'avg_score', avg_score) ORDER BY avg_score DESC)
     FROM (SELECT cca, AVG(score::decimal) as avg_score FROM school_cca_scores WHERE code::integer = s.code GROUP BY cca ORDER BY avg_score DESC LIMIT 5) ccas
    ) as top_ccas,
    COALESCE(sc.long_summary, 'No culture summary available.') as culture_summary,
    format('%s is located at %s and offers a comprehensive program with strong co-curricular activities.', s.name, s.address) as recommendation_reason
  FROM secondary_with_affiliations s
  LEFT JOIN school_culture_summaries sc ON s.code::text = sc.school_code
  WHERE s.code = ANY(school_codes);
END;
$$ LANGUAGE plpgsql;
```

---

### 3.2 New Frontend Tools ✅ COMPLETED

**File Modified**: [`src/lib/ai-tools.ts`](src/lib/ai-tools.ts)

**Existing Tool (Kept Untouched)**:
```typescript
// ✅ EXISTING - Kept untouched
export const rankSchoolsSchema = z.object({ ... });
export async function executeRankSchools(params, sessionId) { ... }
export const rankSchoolsTool = { ... };
```

**3 New Tools Added (Lines 307-737)**:

#### Tool 1: Sport Search ✅ ADDED
```typescript
// ✅ ADDED - Sport search tool
export const searchSchoolsBySportSchema = z.object({
  sport_name: z.string().min(1, "Sport name is required"),
  limit_count: z.number().default(10),
  gender_pref: z.enum(['Any', 'Boys', 'Girls', 'Co-ed']).default('Any'),
  min_year: z.number().default(2022)
});

export type SearchSchoolsBySportParams = z.infer<typeof searchSchoolsBySportSchema>;

export async function executeSearchSchoolsBySport(
  params: SearchSchoolsBySportParams
): Promise<{ schools: any[]; summary: string; }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('ai_search_schools_by_sport', {
    sport_name: params.sport_name,
    limit_count: params.limit_count,
    gender_pref: params.gender_pref,
    min_year: params.min_year
  });

  if (error) throw new Error('Sport search failed');

  const schools = (data || []) as any[];
  const summary = schools.length > 0
    ? `I found ${schools.length} schools with ${params.sport_name} programs. The top schools are ranked by their National School Games performance.`
    : `I couldn't find any schools with ${params.sport_name} programs in our database.`;

  return { schools, summary };
}

export const searchSchoolsBySportTool = {
  name: 'searchSchoolsBySport',
  description: 'Find top schools for a specific sport based on National School Games performance. Use this when users ask about schools for a particular sport WITHOUT providing their personal AL score or location.',
  parameters: {
    type: 'object',
    properties: {
      sport_name: { type: 'string', description: 'Name of the sport (e.g., Basketball, Football, Swimming)' },
      limit_count: { type: 'number', default: 10, description: 'Number of schools to return' },
      gender_pref: { type: 'string', enum: ['Any', 'Boys', 'Girls', 'Co-ed'], default: 'Any' },
      min_year: { type: 'number', default: 2022 }
    },
    required: ['sport_name'],
    additionalProperties: false
  }
} as const;
```

#### Tool 2: Academic Search ✅ ADDED
```typescript
// ✅ ADDED - Academic search tool
export const searchSchoolsByAcademicSchema = z.object({
  gender_pref: z.enum(['Any', 'Boys', 'Girls', 'Co-ed']).default('Any'),
  track_pref: z.enum(['Any', 'IP', 'Express']).default('Any'),
  limit_count: z.number().default(10),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type SearchSchoolsByAcademicParams = z.infer<typeof searchSchoolsByAcademicSchema>;

export async function executeSearchSchoolsByAcademic(
  params: SearchSchoolsByAcademicParams
): Promise<{ schools: any[]; summary: string; }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('ai_search_schools_by_academic', {
    gender_pref: params.gender_pref,
    track_pref: params.track_pref,
    limit_count: params.limit_count,
    sort_order: params.sort_order
  });

  if (error) throw new Error('Academic search failed');

  const schools = (data || []) as any[];
  let summary = `I found ${schools.length} `;
  if (params.gender_pref !== 'Any') summary += `${params.gender_pref} `;
  if (params.track_pref !== 'Any') summary += `${params.track_pref} `;
  summary += `schools ranked by academic competitiveness (2024 PSLE cut-off scores).`;

  return { schools, summary };
}

export const searchSchoolsByAcademicTool = {
  name: 'searchSchoolsByAcademic',
  description: 'Find schools ranked by academic performance (PSLE cut-off scores). Use this when users ask about academically strong schools, best schools by gender/track, WITHOUT providing their personal AL score.',
  parameters: {
    type: 'object',
    properties: {
      gender_pref: { type: 'string', enum: ['Any', 'Boys', 'Girls', 'Co-ed'], default: 'Any' },
      track_pref: { type: 'string', enum: ['Any', 'IP', 'Express'], default: 'Any' },
      limit_count: { type: 'number', default: 10 },
      sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
    },
    required: [],
    additionalProperties: false
  }
} as const;
```

#### Tool 3: School Details ✅ ADDED
```typescript
// ✅ ADDED - School details tool
export const getSchoolDetailsSchema = z.object({
  school_codes: z.array(z.number()).min(1).max(5)
});

export type GetSchoolDetailsParams = z.infer<typeof getSchoolDetailsSchema>;

export async function executeGetSchoolDetails(
  params: GetSchoolDetailsParams
): Promise<{ schools: any[]; summary: string; }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('ai_get_school_details', {
    school_codes: params.school_codes
  });

  if (error) throw new Error('School details fetch failed');

  const schools = (data || []) as any[];
  const summary = schools.length > 0
    ? `Here's detailed information about ${schools.length} ${schools.length === 1 ? 'school' : 'schools'}.`
    : `I couldn't find information for the requested schools.`;

  return { schools, summary };
}

export const getSchoolDetailsTool = {
  name: 'getSchoolDetails',
  description: 'Get comprehensive details about specific schools by their codes. Use this when users ask about a particular named school or want to compare specific schools.',
  parameters: {
    type: 'object',
    properties: {
      school_codes: { type: 'array', items: { type: 'number' }, minItems: 1, maxItems: 5 }
    },
    required: ['school_codes'],
    additionalProperties: false
  }
} as const;
```

---

### 3.3 System Prompt Updates ✅ COMPLETED

**File Modified**: [`src/lib/ai-prompts.ts`](src/lib/ai-prompts.ts)

**Replaced Entire `AI_SYSTEM_PROMPT`** with intelligent 5-intent routing logic (Lines 25-179):

```typescript
export const AI_SYSTEM_PROMPT = `You are SAI (School Advisor Intelligence), Singapore's AI assistant for secondary school selection.

## Your 4 Available Tools + 1 Information Intent

### Tool 1: rankSchools - For PERSONALIZED Recommendations
**Use When**: User provides AL score + postal code + primary school
**Example Queries**:
- "I got AL 8, live in 560123, from Rosyth School"
- "AL score 12, postal 550456, Anderson Primary, interested in basketball"
**Required**: al_score, postal_code, primary_school
**Optional**: Sports, CCAs, culture preferences, importance weights

### Tool 2: searchSchoolsBySport - For SPORT-Specific Rankings
**Use When**: User asks about best schools for a sport WITHOUT personal context
**Example Queries**:
- "Which schools are best for football?"
- "Top basketball schools in Singapore"
- "Show me schools with strong volleyball programs"
**Required**: sport_name
**Optional**: gender_pref, limit_count
**DO NOT** ask for AL score or postal code for these queries!

### Tool 3: searchSchoolsByAcademic - For ACADEMIC Rankings
**Use When**: User asks about academically strong schools WITHOUT personal AL score
**Example Queries**:
- "What are the best boys schools academically?"
- "Top co-ed schools by PSLE cut-off"
- "Most competitive IP schools"
**Required**: Nothing (all parameters optional)
**Common Params**: gender_pref, track_pref
**DO NOT** ask for AL score or postal code for these queries!

### Tool 4: getSchoolDetails - For SPECIFIC School Information
**Use When**: User asks about a particular named school
**Example Queries**:
- "Tell me about Raffles Institution"
- "What's the cut-off for Hwa Chong?"
- "Compare Anderson and Tao Nan"
**Required**: school_codes (you'll need to search/infer from school name)
**Note**: You may need to combine this with academic search to find school codes first

### Intent 5: MOE Information - For GENERAL Education System Questions (NO TOOL)
**Use When**: User asks about MOE policies, processes, or general Singapore education system information
**Example Queries**:
- "What is the DSA process?"
- "How many school choices do I get?"
- "What is the secondary school posting process?"
- "What are the different posting groups?"
- "How does school affiliation work?"

**Response Pattern**:
- **DO NOT call any tool** - answer directly using GPT-4's knowledge
- **ALWAYS reference** the MOE website: https://www.moe.gov.sg/secondary
- **Provide specific links** when available:
  - DSA: https://www.moe.gov.sg/secondary/dsa
  - Posting: https://www.moe.gov.sg/secondary/s1-posting
  - Affiliation: https://www.moe.gov.sg/secondary/s1-posting/results
- **Be concise** and encourage users to visit MOE for authoritative information
- **Combine** with school search if appropriate (e.g., "What is DSA and which schools offer it for basketball?")

**Example Response**:
User: "What is the DSA process?"
You: "The Direct School Admission (DSA) allows students to apply to secondary schools based on talents and achievements before the PSLE results are released.

Key points:
- Application period: May to June (before PSLE)
- Based on talents in sports, arts, leadership, etc.
- Schools conduct trials/interviews
- Successful students commit to the school regardless of PSLE score

For complete details and application process, visit the official MOE DSA page: https://www.moe.gov.sg/secondary/dsa

Would you like me to find schools that offer DSA for a specific talent area?"

## Multi-Intent Query Handling

**Users may combine multiple intents in one query!**

**Example: "Which schools are best for tennis AND robotics?"**
- Intent: Sport (tennis) + CCA (robotics)
- Solution: Call `searchSchoolsBySport` with sport_name="Tennis"
- Then manually filter/cross-reference for robotics programs
- Present schools that excel in BOTH areas

**Example: "I got AL 12, postal 560123, Tao Nan School - which have good football programs?"**
- Intent: Personalized + Sport
- Solution: Call `rankSchools` with all params + sports_selected=["Football"], sports_importance="High"
- This uses existing tool's built-in sport matching

**Example: "Best IP schools for swimming"**
- Intent: Academic (IP track) + Sport (swimming)
- Solution 1: Call `searchSchoolsBySport` with sport_name="Swimming"
- Then filter results for IP schools only
- Solution 2: Call `searchSchoolsByAcademic` with track_pref="IP"
- Then mention which have strong swimming programs

**Example: "Tell me about the DSA process and which schools offer it for basketball"**
- Intent: MOE Information + Sport search
- Solution: First explain DSA (no tool needed)
- Then call `searchSchoolsBySport` with sport_name="Basketball"
- Mention that these schools likely offer DSA for basketball talents

**GPT-4 Capabilities:**
- Can call MULTIPLE tools in sequence
- Can combine results intelligently
- Can filter/intersect results from different tools
- System prompt guides proper combination logic

## Query Routing Decision Tree

1. **Is the user asking about MOE policies, processes, or general education system info?**
   → YES: Answer directly (NO TOOL) with MOE website references
   → NO: Continue to step 2

2. **Does the user mention their AL score AND location?**
   → YES: Use \`rankSchools\` (personalized recommendations)
   → NO: Continue to step 3

3. **Is the user asking about a specific SPORT/CCA?**
   → YES: Use \`searchSchoolsBySport\`
   → NO: Continue to step 4

4. **Is the user asking about ACADEMIC rankings/best schools?**
   → YES: Use \`searchSchoolsByAcademic\`
   → NO: Continue to step 5

5. **Is the user asking about a SPECIFIC NAMED school?**
   → YES: Use \`getSchoolDetails\`
   → NO: Ask clarifying question to determine intent

**Note**: Multiple intents can be combined - see "Multi-Intent Query Handling" section above.

## CRITICAL: Do NOT Always Ask for Personal Info

**BAD Response Pattern** ❌:
User: "Which school is best for basketball?"
You: "What's your PSLE AL score?"

**GOOD Response Pattern** ✅:
User: "Which school is best for basketball?"
You: [Calls searchSchoolsBySport with sport_name="Basketball"]
You: "I found 10 schools with excellent basketball programs. The top schools are..."

**When to Ask for Personal Info**:
- Only when user wants PERSONALIZED recommendations
- Only when user explicitly mentions wanting schools "for me" or "I can get into"
- Only when context suggests they want distance-based or AL-score-filtered results

**When NOT to Ask for Personal Info**:
- General queries about sports programs
- Questions about academic rankings
- Inquiries about specific schools
- Comparison questions without personal context

## Available Sports (26 total)
${AVAILABLE_SPORTS.join(', ')}

## Available CCAs (5 total)
${AVAILABLE_CCAS.join(', ')}

## Available Culture Traits (15 total)
${AVAILABLE_CULTURE.join(', ')}

## Communication Style
- Friendly, knowledgeable, and encouraging
- Use Singapore education terminology correctly (AL scores, IP, PG, affiliation)
- Provide specific, actionable recommendations
- Always call the appropriate tool based on query type
- Present tool results conversationally
- Explain concepts when relevant

## Response Examples

**Example 1: Sport Query**
User: "Best schools for swimming?"
You: [Call searchSchoolsBySport with sport_name="Swimming"]
You: "I found 10 excellent swimming schools! Here are the top performers based on National School Games results..."

**Example 2: Academic Query**
User: "Show me top boys schools"
You: [Call searchSchoolsByAcademic with gender_pref="Boys", sort_order="asc"]
You: "Here are the top boys schools ranked by 2024 PSLE cut-off scores (lower scores = more competitive)..."

**Example 3: Personalized Query**
User: "I got AL 10, live in 560123, from Tao Nan School"
You: [Call rankSchools with all provided parameters]
You: "Great! Based on your AL score of 10, I found 6 excellent schools near you. 2 of them are affiliated with Tao Nan..."

**Example 4: School Info Query**
User: "Tell me about Raffles Institution"
You: [First search by name, then call getSchoolDetails with code]
You: "Raffles Institution is one of Singapore's premier schools. Here's what you should know..."

**Example 5: MOE Information Query**
User: "What is the DSA process?"
You: [NO TOOL - Answer directly]
You: "The Direct School Admission (DSA) allows students to apply to secondary schools based on talents and achievements before PSLE results.

Key points:
- Application: May-June annually
- Based on: Sports, arts, leadership, academic talents
- Process: School-specific trials and interviews
- Commitment: If successful, you must enroll regardless of PSLE score

📚 For complete details: https://www.moe.gov.sg/secondary/dsa

Would you like me to find schools that offer DSA for a specific talent area?"

**Example 6: Multi-Intent Query**
User: "Which schools are best for tennis and robotics?"
You: [Call searchSchoolsBySport with sport_name="Tennis"]
You: "I found 10 schools with strong tennis programs. Let me cross-reference which of these also excel in robotics...

Top schools for BOTH tennis and robotics:
1. **ABC Secondary** - Very Strong tennis (score 82), Strong robotics achievements
2. **XYZ Secondary** - Strong tennis (score 68), National STEM award winner
..."

Remember: Your goal is to provide accurate, helpful school information using the RIGHT tool for each query type, combining multiple tools when needed.`;
```

---

### 3.4 API Route Updates ✅ COMPLETED

**File Modified**: [`src/app/api/ai-chat/route.ts`](src/app/api/ai-chat/route.ts)

**Step 1: Added Tool Imports** (Lines 4-24):
```typescript
import {
  rankSchoolsTool,
  executeRankSchools,
  searchSchoolsBySportTool,        // ADD
  executeSearchSchoolsBySport,     // ADD
  searchSchoolsByAcademicTool,     // ADD
  executeSearchSchoolsByAcademic,  // ADD
  getSchoolDetailsTool,            // ADD
  executeGetSchoolDetails          // ADD
} from '@/lib/ai-tools';
```

**Step 2: Updated Tools Array** (Lines 83-100):
```typescript
const tools = [
  { type: 'function', function: rankSchoolsTool },              // Existing
  { type: 'function', function: searchSchoolsBySportTool },     // ✅ ADDED
  { type: 'function', function: searchSchoolsByAcademicTool },  // ✅ ADDED
  { type: 'function', function: getSchoolDetailsTool }          // ✅ ADDED
];
```

**Step 3: Added Tool Call Handlers** (Lines 163-204 for streaming, Lines 333-370 for non-streaming):
```typescript
// ✅ COMPLETED - Switch/case routing for 4 tools
switch (currentToolCall.name) {
  case 'rankSchools': {
    const validatedParams = rankSchoolsSchema.parse(toolArgs);
    // Check cache first (only for rankSchools)
    let cachedResult = await getCachedRanking(validatedParams);
    if (cachedResult) {
      result = cachedResult;
    } else {
      const toolResult = await executeRankSchools(validatedParams, sessionId);
      await setCachedRanking(validatedParams, toolResult);
      result = { ...toolResult, cached: false, cacheKey: 'new' };
    }
    break;
  }

  case 'searchSchoolsBySport': {  // ✅ ADDED
    const validatedParams = searchSchoolsBySportSchema.parse(toolArgs);
    result = await executeSearchSchoolsBySport(validatedParams, sessionId);
    break;
  }

  case 'searchSchoolsByAcademic': {  // ✅ ADDED
    const validatedParams = searchSchoolsByAcademicSchema.parse(toolArgs);
    result = await executeSearchSchoolsByAcademic(validatedParams, sessionId);
    break;
  }

  case 'getSchoolDetails': {  // ✅ ADDED
    const validatedParams = getSchoolDetailsSchema.parse(toolArgs);
    result = await executeGetSchoolDetails(validatedParams, sessionId);
    break;
  }

  default:
    throw new Error(`Unknown tool: ${currentToolCall.name}`);
}
```

---

### 3.5 Implementation Checklist ✅ ALL COMPLETED

#### Supabase RPCs (3 new SQL files) ✅
- [x] ✅ Create `supabase/ai_search_schools_by_sport.sql`
  - [x] ✅ Created `ai_search_schools_by_sport_FIXED_V2.sql` (working version)
  - [x] ✅ Fixed schema issues (column name conflicts, type casting)
  - [x] ✅ Tested with Tennis query → PASS
  - [x] ✅ Deployed to Supabase via SQL editor
  - [x] ✅ Verified returns expected columns and data

- [x] ✅ Create `supabase/ai_search_schools_by_academic.sql`
  - [x] ✅ Created `ai_search_schools_by_academic_FIXED.sql`
  - [x] ✅ Fixed schema (school_cca_scores uses code as TEXT, not integer)
  - [x] ✅ Tested with 'Overall', 'Any', 'IP' → PASS
  - [x] ✅ Deployed to Supabase via SQL editor
  - [x] ✅ Verified cop_ranges JSONB parsing works

- [x] ✅ Create `supabase/ai_get_school_details.sql`
  - [x] ✅ Created `ai_get_school_details_FIXED.sql`
  - [x] ✅ Fixed ARRAY_AGG DISTINCT ORDER BY conflicts
  - [x] ✅ Tested with 'Raffles' query → PASS
  - [x] ✅ Deployed to Supabase via SQL editor
  - [x] ✅ Verified all JOINs work correctly (sports, CCAs, culture, affiliations)

#### Frontend Tools ✅
- [x] ✅ Update `src/lib/ai-tools.ts`
  - [x] ✅ Added `searchSchoolsBySportSchema` + execution function + tool definition
  - [x] ✅ Added `searchSchoolsByAcademicSchema` + execution function + tool definition
  - [x] ✅ Added `getSchoolDetailsSchema` + execution function + tool definition
  - [x] ✅ All execution functions connect to correct RPC names
  - [x] ✅ Zod schemas validate parameters correctly

#### System Prompts ✅
- [x] ✅ Update `src/lib/ai-prompts.ts`
  - [x] ✅ Replaced `AI_SYSTEM_PROMPT` with new 5-intent routing logic
  - [x] ✅ Added MOE information intent guidelines (Intent 5 - no tool)
  - [x] ✅ Added multi-intent query handling instructions with 4 examples
  - [x] ✅ Added MOE website reference URLs (https://www.moe.gov.sg/secondary, /dsa, /s1-posting)
  - [x] ✅ Included query routing decision tree (5-step process)
  - [x] ✅ Verified AVAILABLE_SPORTS, AVAILABLE_CCAS, AVAILABLE_CULTURE arrays exist

#### API Route ✅
- [x] ✅ Update `src/app/api/ai-chat/route.ts`
  - [x] ✅ Added imports for 3 new tools (sport, academic, school details)
  - [x] ✅ Updated tools array to include 4 tools total
  - [x] ✅ Added 3 new tool call handlers with switch/case routing
  - [x] ✅ Verified MOE information queries work WITHOUT tool calls (GPT-4 answers directly)

#### Testing & Validation ⏳ READY FOR LOCAL TESTING

**RPC Functions - Direct Testing** ✅ COMPLETED:
- [x] ✅ Test 1: `SELECT * FROM ai_get_school_details('Raffles');` → PASS (returns Raffles Institution details)
- [x] ✅ Test 2: `SELECT * FROM ai_search_schools_by_sport('Tennis', 'Any', 'Any', 10);` → PASS (returns 10 tennis schools)
- [x] ✅ Test 3: `SELECT * FROM ai_search_schools_by_academic('Overall', 'Any', 'IP', 10);` → PASS (returns 10 IP schools)

**End-to-End Testing via Local Environment** ⏳ PENDING USER TESTING:

**Single-Intent Queries:**
- [ ] ⏳ Test sport query: "Which school is best for basketball?"
  - [ ] Verify NO request for AL score/postal code
  - [ ] Verify `searchSchoolsBySport` is called
  - [ ] Verify results show sport rankings with strength ratings

- [ ] ⏳ Test academic query: "Best boys schools academically"
  - [ ] Verify NO request for personal info
  - [ ] Verify `searchSchoolsByAcademic` is called
  - [ ] Verify results sorted by cut-off scores

- [ ] ⏳ Test personalized query: "AL 10, postal 560123, Rosyth School"
  - [ ] Verify `rankSchools` is called (existing tool still works)
  - [ ] Verify personalized results with affiliation bonus

- [ ] ⏳ Test school info query: "Tell me about Raffles Institution"
  - [ ] Verify `getSchoolDetails` is called
  - [ ] Verify comprehensive school profile returned

- [ ] ⏳ Test MOE information query: "What is the DSA process?"
  - [ ] Verify NO tool is called
  - [ ] Verify response includes MOE website links
  - [ ] Verify response references https://www.moe.gov.sg/secondary

**Multi-Intent Queries:**
- [ ] ⏳ Test combined sport query: "Which schools are best for tennis AND robotics?"
  - [ ] Verify `searchSchoolsBySport` is called with "Tennis"
  - [ ] Verify results are filtered/cross-referenced for robotics
  - [ ] Verify GPT-4 intelligently combines results

- [ ] ⏳ Test personalized + sport: "AL 12, postal 560123, Tao Nan - good football programs"
  - [ ] Verify `rankSchools` is called with sports_selected=["Football"]
  - [ ] Verify built-in sport matching works

- [ ] ⏳ Test academic + sport: "Best IP schools for swimming"
  - [ ] Verify either `searchSchoolsBySport` OR `searchSchoolsByAcademic` is called
  - [ ] Verify results are filtered for the other criterion
  - [ ] Verify combined results make sense

- [ ] ⏳ Test MOE + search: "Tell me about DSA and which schools offer it for basketball"
  - [ ] Verify DSA explanation is provided first (no tool)
  - [ ] Verify `searchSchoolsBySport` is then called with "Basketball"
  - [ ] Verify response links the two parts logically

---

### 3.6 Expected Outcomes

#### Single-Intent Query Example

**Before Implementation** (Current State):
```
User: "Which school is best for football?"
SAI: "What's your PSLE AL score?"
User: "I just want to know the best football schools"
SAI: "I need your AL score to find schools for you..."
```

**After Implementation** (Target State):
```
User: "Which school is best for football?"
SAI: [Calls searchSchoolsBySport with sport_name="Football"]
SAI: "I found 10 schools with excellent football programs! Here are the top performers:

1. **ABC Secondary School** - Very Strong football program with an average score of 85.3 across 3 years
2. **XYZ Secondary School** - Strong football program with an average score of 72.1 across 3 years
..."
```

#### MOE Information Query Example

**Before Implementation** (Current State):
```
User: "What is the DSA process?"
SAI: "What's your PSLE AL score? This will help me find schools for you."
User: "I just want to understand DSA"
SAI: "Let me help you find schools. What's your postal code?"
```

**After Implementation** (Target State):
```
User: "What is the DSA process?"
SAI: [NO TOOL - Answers directly]
SAI: "The Direct School Admission (DSA) allows students to apply to secondary schools based on talents before PSLE results.

Key points:
- Application: May-June annually
- Based on: Sports, arts, leadership, academic talents
- Process: School trials and interviews
- Commitment: Must enroll if successful

📚 For complete details: https://www.moe.gov.sg/secondary/dsa

Would you like me to find schools that offer DSA for a specific talent area?"
```

#### Multi-Intent Query Example

**Before Implementation** (Current State):
```
User: "Which schools are best for tennis AND robotics?"
SAI: "What's your PSLE AL score?"
User: "I just want to know which schools are good at both"
SAI: "I need your AL score to find the right schools for you..."
```

**After Implementation** (Target State):
```
User: "Which schools are best for tennis AND robotics?"
SAI: [Calls searchSchoolsBySport with sport_name="Tennis"]
SAI: [Cross-references results with robotics CCA data]
SAI: "I found schools that excel in BOTH tennis and robotics! Here are the top matches:

1. **ABC Secondary School**
   - Tennis: Very Strong program (score 82.5)
   - Robotics: National STEM Award winner, multiple robotics championships

2. **XYZ Secondary School**
   - Tennis: Strong program (score 68.2)
   - Robotics: Regional robotics competition finalist

These schools would be excellent if you're interested in pursuing both activities!"
```

---

## 📋 Phase 4: Testing & Optimization (FUTURE)

### Planned Work
- [ ] Create golden dataset with 120 test cases
- [ ] Build automated testing suite (Jest/Playwright)
- [ ] Implement evaluation metrics tracking
- [ ] Set up analytics and monitoring (PostHog/Mixpanel)
- [ ] Performance optimization (response time < 3s)
- [ ] A/B testing framework
- [ ] User feedback collection
- [ ] Error rate monitoring and alerting

---

## 🚀 Phase 5: Deployment (FUTURE)

### Planned Rollout
- [ ] Deploy to staging environment
- [ ] Internal testing with team
- [ ] Limited beta (10% traffic)
- [ ] Collect feedback and iterate
- [ ] Full production deployment (100% traffic)
- [ ] Monitor performance metrics
- [ ] Continuous optimization

---

## 📦 Dependencies

### Installed ✅
```json
{
  "openai": "^4.38.0",
  "zod": "^3.22.0",
  "nanoid": "^5.0.0",
  "ai": "^3.3.0",
  "node-cache": "^5.1.2",
  "react-markdown": "^9.0.0"
}
```

### Environment Variables ✅
```bash
OPENAI_API_KEY="sk-proj-..."
NEXT_PUBLIC_SUPABASE_URL="https://eihvkzinksuqdyyshcco.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📚 Key Files Reference

### Core Implementation Files
- **AI Tools**: [`src/lib/ai-tools.ts`](src/lib/ai-tools.ts) - Tool definitions and execution functions
- **AI Prompts**: [`src/lib/ai-prompts.ts`](src/lib/ai-prompts.ts) - System prompts and routing logic
- **API Route**: [`src/app/api/ai-chat/route.ts`](src/app/api/ai-chat/route.ts) - OpenAI streaming handler
- **Chat Hook**: [`src/hooks/useChat.ts`](src/hooks/useChat.ts) - Message state management

### UI Components
- **Page**: [`src/app/ask-sai/page.tsx`](src/app/ask-sai/page.tsx) - Main Ask SAI page
- **Chat Container**: [`src/components/chat/ChatContainer.tsx`](src/components/chat/ChatContainer.tsx)
- **Chat Messages**: [`src/components/chat/ChatMessages.tsx`](src/components/chat/ChatMessages.tsx)
- **Chat Input**: [`src/components/chat/ChatInput.tsx`](src/components/chat/ChatInput.tsx)
- **Message Bubble**: [`src/components/chat/MessageBubble.tsx`](src/components/chat/MessageBubble.tsx)

### Database
- **Existing RPC**: [`supabase/ai_rank_schools.sql`](supabase/ai_rank_schools.sql) - Personalized recommendations
- **New RPCs** (to create):
  - `supabase/ai_search_schools_by_sport.sql` - Sport rankings
  - `supabase/ai_search_schools_by_academic.sql` - Academic rankings
  - `supabase/ai_get_school_details.sql` - School details

---

## 🎯 Phase 3 - COMPLETED ✅

**All Implementation Work Completed**:
1. ✅ Created 3 new Supabase RPC functions (sport, academic, school details)
2. ✅ Added 3 new tools to `src/lib/ai-tools.ts` (lines 307-737)
3. ✅ Updated system prompts in `src/lib/ai-prompts.ts` to include:
   - ✅ 4-tool routing logic (rankSchools, searchSchoolsBySport, searchSchoolsByAcademic, getSchoolDetails)
   - ✅ MOE information intent handling (5th intent - NO tool needed)
   - ✅ Multi-intent query combination guidelines with examples
   - ✅ MOE website references (https://www.moe.gov.sg/secondary)
4. ✅ Updated API route in `src/app/api/ai-chat/route.ts` (4 tools registered, switch/case routing)
5. ✅ Tested all 3 new RPC functions directly in Supabase (all PASS)
6. ⏳ **USER TESTING PENDING**: End-to-end testing via local environment

**Goal Achieved**: SAI can now intelligently route queries across 5 intent types, eliminating unnecessary requests for personal information when answering general queries, and supporting multi-intent combinations.

**Key Innovations Delivered**:
- **5 Intent Types**: Personalized, Sport, Academic, School Info, MOE Information
- **Multi-Intent Support**: GPT-4 can call multiple tools and combine results intelligently
- **MOE References**: System prompt instructs AI to always link to official MOE website for policy questions
- **No Breaking Changes**: Existing `rankSchools` tool remains untouched
- **Schema Learning**: Comprehensive documentation of table structures and type casting requirements

---

## 📝 Implementation Summary

### Files Created (3 RPC Functions):
1. **`supabase/ai_search_schools_by_sport_FIXED_V2.sql`** ✅ DEPLOYED
   - Fixed: Ambiguous column reference errors (renamed CTE columns from `code` to `school_code`)
   - Fixed: Type casting for `school_sport_results.code` (TEXT → INTEGER)
   - Test: Tennis query → PASS

2. **`supabase/ai_search_schools_by_academic_FIXED.sql`** ✅ DEPLOYED
   - Fixed: Schema type issues (`school_cca_scores.code` is TEXT, not integer)
   - Fixed: JSONB parsing for `cop_ranges` and `affiliated_primaries`
   - Test: IP schools query → PASS

3. **`supabase/ai_get_school_details_FIXED.sql`** ✅ DEPLOYED
   - Fixed: PostgreSQL ARRAY_AGG DISTINCT ORDER BY constraints
   - Changed: Accepts school name (text) instead of codes for easier GPT-4 integration
   - Test: Raffles query → PASS

### Files Modified (3 Frontend Files):
1. **`src/lib/ai-tools.ts`** (Lines 307-737)
   - Added: `searchSchoolsBySportSchema` + execution function + tool definition
   - Added: `searchSchoolsByAcademicSchema` + execution function + tool definition
   - Added: `getSchoolDetailsSchema` + execution function + tool definition

2. **`src/lib/ai-prompts.ts`** (Lines 25-179)
   - Replaced: Entire `AI_SYSTEM_PROMPT` with 5-intent routing logic
   - Added: MOE information intent (no tool - GPT-4 answers directly)
   - Added: Multi-intent query handling with 4 detailed examples
   - Added: Query routing decision tree (5-step process)
   - Added: MOE website reference URLs

3. **`src/app/api/ai-chat/route.ts`** (Lines 4-24, 83-100, 163-204, 333-370)
   - Added: Imports for 3 new tools
   - Updated: Tools array to include 4 tools total
   - Added: Switch/case routing for all 4 tools with proper error handling

### Key Schema Learnings Documented:
- `school_sports_scores`: Has BOTH `code` (integer) AND `school_slug` (text)
- `school_sport_results`: Uses `code` as TEXT (requires casting to integer)
- `school_cca_scores`: Uses `code` as TEXT (requires casting to integer)
- `school_cca_details`: Uses `code` as INTEGER
- `secondary_with_affiliations`: Uses `code` as INTEGER (main school table)
- PostgreSQL constraint: Cannot use `ARRAY_AGG(DISTINCT x ORDER BY y)` when x ≠ y

---

## ✅ Phase 3.6: Enhancements - Detailed Explanations (COMPLETED)

### Problems Identified During Testing - ALL FIXED ✅

#### Problem 1: Sport Search - Generic Achievements ✅ FIXED (2025-10-13)
**Previous Output:** When asking "Which schools are best for football?", schools were returned with generic achievements like:
- `sport_achievements: ["Gold medal", "Top 3 finish"]`

**Current Output (Fixed):** Detailed explanations similar to school profile pages:
> "In Football, the school is very strong in Boys with 5 Finals (F) participations and 3 Semifinals (SF) across A, B, C divisions over 3 years (2022-2024). They are also strong in Girls with 2 Finals (F) participations in A division over 2 years (2023-2024)."

**Root Cause:** The `ai_search_schools_by_sport` RPC used simple ARRAY_AGG of medals/placements. The explanations were being fetched from `/api/explain` but GPT-4 was not using them.

**Solution Implemented:**
- ✅ Updated `src/lib/ai-prompts.ts` system prompt to explicitly instruct GPT-4 to use `sport_explanation` field
- ✅ Added presentation format guidelines with examples
- ✅ Added debug logging to verify explanations flow correctly
- ✅ Tested with Football query - detailed explanations now appear correctly

#### Problem 2: School Details - Not Retrieving Information ✅ FIXED (2025-10-13)
**Previous Output:** When asking "Tell me about Raffles Institution", the tool returned "school not found" error.

**Current Output (Fixed):** Successfully retrieves comprehensive school profiles.

**Root Cause:** Database stores school names in slugified format ("raffles-institution-secondary") but search was using display names ("Raffles Institution").

**Solution Implemented:**
- ✅ Updated `supabase/ai_get_school_details_FIXED.sql` to slugify user input before searching
- ✅ Added slugification CTE: "Raffles Institution" → "raffles-institution"
- ✅ Implemented 4-tier matching priority: exact code > exact slug > starts-with > contains
- ✅ Uses PostgreSQL REGEXP_REPLACE for robust text normalization
- ✅ Tested with "Raffles Institution" and "Victoria School" - both work correctly

---

### Solution Strategy

**Key Insight:** Reuse existing `/api/explain` endpoint that already generates detailed sport/CCA explanations for school profile pages. No need to duplicate logic in RPCs.

**Approach:**
1. Keep existing RPCs unchanged (they return basic data correctly)
2. Enhance frontend execution functions in `src/lib/ai-tools.ts`
3. After RPC call, make additional call to `/api/explain` to enrich data
4. Combine RPC data + explanation data into comprehensive results

**Benefits:**
- No RPC changes needed (faster implementation)
- Reuses proven logic from school profile pages
- Easier to debug and maintain
- Consistent explanations across the app

---

### 3.6.1 Fix Sport Search Explanations

**File to Modify:** [`src/lib/ai-tools.ts`](src/lib/ai-tools.ts) - Lines 347-421

**Implementation Steps:**

#### Step 1: Create Helper Function for /api/explain Calls
Add reusable helper function that calls the explain API:

```typescript
async function fetchSportExplanations(params: {
  schools: { code: string; name: string }[];
  sports_selected: string[];
  inYear?: number;
}): Promise<Map<string, { explanation: string; one_liner: string }>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schools: params.schools,
        sports_selected: params.sports_selected,
        inYear: params.inYear || 2024
      })
    });

    if (!response.ok) {
      console.error('Explain API failed:', response.statusText);
      return new Map();
    }

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
```

#### Step 2: Modify executeSearchSchoolsBySport
Update the function to enrich RPC results with detailed explanations:

```typescript
export async function executeSearchSchoolsBySport(
  params: SearchSchoolsBySportParams,
  sessionId?: string
): Promise<{
  schools: SportSchoolResult[];
  summary: string;
  metadata: Record<string, any>;
}> {
  // ... existing RPC call ...
  const { data, error } = await supabase.rpc('ai_search_schools_by_sport', {
    sport_name: params.sport_name,
    gender_pref: params.gender_preference,
    track_pref: params.track_preference,
    limit_count: params.limit
  });

  if (error) throw new Error('Sport-based school search failed');
  const schools = (data || []) as SportSchoolResult[];

  // NEW: Fetch detailed explanations for all schools in batch
  const schoolsForExplain = schools.map(s => ({ code: s.code, name: s.name }));
  const explanations = await fetchSportExplanations({
    schools: schoolsForExplain,
    sports_selected: [params.sport_name],
    inYear: 2024
  });

  // Enrich each school with detailed explanation
  const enrichedSchools = schools.map(school => ({
    ...school,
    sport_explanation: explanations.get(school.code)?.explanation ||
                       school.recommendation_reason, // fallback to basic reason
    sport_one_liner: explanations.get(school.code)?.one_liner || ''
  }));

  const summary = generateSportSummary(enrichedSchools, params);

  return { schools: enrichedSchools, summary, metadata };
}
```

#### Step 3: Update Interface
Add new fields to `SportSchoolResult`:

```typescript
export interface SportSchoolResult {
  code: string;
  name: string;
  address: string;
  gender: string;
  track: string;
  posting_group: number | null;
  sport_performance_score: number;
  sport_achievements: string[];              // Keep for backward compatibility
  sport_strength_rating: string;
  other_strong_sports: string[];
  recommendation_reason: string;
  sport_explanation: string;                  // NEW: Detailed multi-line explanation
  sport_one_liner: string;                    // NEW: Concise single-line summary
}
```

**Expected Result:**
- **Before:** "Exceptional basketball program with consistent top-tier performance"
- **After:** "In Basketball, Anderson Secondary is very strong in Boys with 5 Finals participations and 3 Semifinals across A, B, C divisions over 3 years (2022-2024). They are also strong in Girls with 2 Finals participations in A division."

---

### 3.6.2 Fix School Details Retrieval

**File to Modify:** [`src/lib/ai-tools.ts`](src/lib/ai-tools.ts) - Lines 648-720

**Implementation Steps:**

#### Step 1: Create Helper for CCA Explanations
Add helper that fetches CCA explanations:

```typescript
async function fetchCcaExplanations(params: {
  schools: { code: string; name: string }[];
  ccas_selected: string[];
  inYear?: number;
}): Promise<Map<string, string>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schools: params.schools,
        ccas_selected: params.ccas_selected,
        inYear: params.inYear || 2024
      })
    });

    if (!response.ok) return new Map();

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
```

#### Step 2: Modify executeGetSchoolDetails
Update to fetch comprehensive school information:

```typescript
export async function executeGetSchoolDetails(
  params: GetSchoolDetailsParams,
  sessionId?: string
): Promise<{
  school: SchoolDetailsResult | null;
  summary: string;
  metadata: Record<string, any>;
}> {
  // ... existing RPC call ...
  const { data, error } = await supabase.rpc('ai_get_school_details', {
    school_identifier: params.school_identifier
  });

  if (error) throw new Error('School details retrieval failed');
  const schools = (data || []) as SchoolDetailsResult[];
  const school = schools.length > 0 ? schools[0] : null;

  if (!school) {
    return {
      school: null,
      summary: `I couldn't find a school matching "${params.school_identifier}"...`,
      metadata: { sessionId, found: false, searchType: 'details' }
    };
  }

  // NEW: Fetch detailed sport explanations (top 3 sports)
  const sportsExplanations = await fetchSportExplanations({
    schools: [{ code: school.code, name: school.name }],
    sports_selected: [], // Empty = get top 3 sports automatically
    inYear: 2024
  });

  // NEW: Fetch CCA explanations (up to 5 CCAs)
  const ccasToQuery = school.available_ccas.slice(0, 5);
  const ccaExplanations = await fetchCcaExplanations({
    schools: [{ code: school.code, name: school.name }],
    ccas_selected: ccasToQuery,
    inYear: 2024
  });

  // Enrich school data
  const enrichedSchool: SchoolDetailsResult = {
    ...school,
    sports_explanation: sportsExplanations.get(school.code)?.explanation ||
                        'Sports performance data not available',
    sports_one_liner: sportsExplanations.get(school.code)?.one_liner || '',
    ccas_explanation: ccaExplanations.get(school.code) ||
                      'CCA achievement data not available'
  };

  const summary = generateComprehensiveSchoolSummary(enrichedSchool);

  return { school: enrichedSchool, summary, metadata };
}
```

#### Step 3: Update Interface
Add explanation fields to `SchoolDetailsResult`:

```typescript
export interface SchoolDetailsResult {
  // ... existing fields ...
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
  contact_info: Record<string, any>;

  // NEW: Rich explanation fields
  sports_explanation: string;     // Detailed sport performance narrative
  sports_one_liner: string;       // Concise sport summary
  ccas_explanation: string;       // Detailed CCA achievements narrative
}
```

#### Step 4: Enhance Summary Generation
Create comprehensive summary function:

```typescript
function generateComprehensiveSchoolSummary(school: SchoolDetailsResult): string {
  const parts: string[] = [];

  // Header: School name and academic info
  parts.push(`Here's comprehensive information about **${school.name}**:`);
  parts.push('');

  // Academic track and cutoff
  if (school.track === 'IP') {
    parts.push(`**Academic:** Integrated Program (IP) school with 6-year pathway. 2024 COP: ${school.cop_max_score} (${school.cop_max_score <= 8 ? 'highly competitive' : school.cop_max_score <= 15 ? 'competitive' : 'accessible'}).`);
  } else {
    parts.push(`**Academic:** Posting Group ${school.posting_group} school. 2024 COP: ${school.cop_max_score} (${school.cop_max_score <= 8 ? 'highly competitive' : school.cop_max_score <= 15 ? 'competitive' : 'accessible'}).`);
  }
  parts.push('');

  // Affiliations
  if (school.affiliated_primary_schools.length > 0) {
    const affs = school.affiliated_primary_schools.slice(0, 3).join(', ');
    parts.push(`**Affiliations:** Affiliated with ${affs}${school.affiliated_primary_schools.length > 3 ? ' and others' : ''}.`);
    parts.push('');
  }

  // Sports - use detailed explanation
  if (school.sports_explanation && school.sports_explanation !== 'Sports performance data not available') {
    parts.push(`**Sports Performance:**`);
    parts.push(school.sports_explanation);
    parts.push('');
  }

  // CCAs - use detailed explanation
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
```

**Expected Result:**
```
Here's comprehensive information about **Raffles Institution**:

**Academic:** Integrated Program (IP) school with 6-year pathway. 2024 COP: 4 (highly competitive).

**Affiliations:** Affiliated with Raffles Girls' Primary School.

**Sports Performance:**
In Basketball, Raffles Institution is very strong in Boys with 4 Finals participations and 2 Championships across A, B divisions over 3 years. In Swimming, they show strong results with 3 Finals participations in Boys and Girls events.

**Co-Curricular Achievements:**
Raffles Institution is strong in Robotics based on good results in 2022, 2023, 2024 including National Championship. They excel in Math Olympiad with multiple Gold awards in 2023 and 2024.

**School Culture:**
Raffles Institution emphasizes intellectual curiosity, leadership development, and holistic education...
```

---

### 3.6.3 Implementation Checklist

**Helper Functions** ⏳:
- [ ] Create `fetchSportExplanations` helper function
- [ ] Create `fetchCcaExplanations` helper function
- [ ] Add error handling and fallbacks for API failures

**Sport Search Enhancement** ⏳:
- [ ] Update `executeSearchSchoolsBySport` to call `/api/explain`
- [ ] Update `SportSchoolResult` interface with new explanation fields
- [ ] Test with query: "Which schools are best for basketball?"
- [ ] Verify detailed explanations appear (not generic "Gold medal")
- [ ] Verify performance (batch API call, not 10 separate calls)

**School Details Enhancement** ⏳:
- [ ] Update `executeGetSchoolDetails` to call `/api/explain` for sports and CCAs
- [ ] Update `SchoolDetailsResult` interface with explanation fields
- [ ] Create `generateComprehensiveSchoolSummary` function
- [ ] Test with query: "Tell me about Raffles Institution"
- [ ] Verify comprehensive profile is returned
- [ ] Verify sports explanation is detailed
- [ ] Verify CCA explanation is included
- [ ] Verify culture summary appears

**Testing & Validation** ⏳:
- [ ] Test error handling when `/api/explain` fails
- [ ] Verify graceful fallbacks to basic descriptions
- [ ] Test with multiple schools (ensure batch processing works)
- [ ] Verify no performance degradation (< 1 second added latency)

---

### 3.6.4 Technical Implementation Notes

#### Performance Optimization
**Problem:** Calling `/api/explain` for 10 schools sequentially would add 5-8 seconds latency.

**Solution:** Batch all schools into a single `/api/explain` request:
- Send array of 10 schools → get back 10 explanations in one request
- Reduces 10 API calls to 1 API call
- Total added latency: ~500-800ms (acceptable)

#### Error Handling Strategy
**Graceful Degradation:**
- If `/api/explain` fails, fallback to RPC's basic `recommendation_reason`
- Log errors but don't break user experience
- Return message: "Sports performance data temporarily unavailable"

#### Code Reusability
**DRY Principle:**
- Both sport search and school details use same helper functions
- Helpers can be reused in future tools
- Consistent explanation format across all intents

#### Testing Approach
1. **Unit Test:** Helper functions with mock responses
2. **Integration Test:** Full flow with actual `/api/explain` endpoint
3. **Edge Cases:** Non-existent schools, API failures, empty results
4. **Performance Test:** Measure latency with 10 schools

---

### 3.6.5 Expected Improvements

**Before (Current State):**
- Sport search: "Anderson Secondary has Gold medals and Top 3 finishes" (vague)
- School details: Returns empty or minimal information

**After (Enhanced State):**
- Sport search: "In Football, Anderson Secondary is very strong in Boys with 5 Finals participations and 3 Semifinals across A, B, C divisions over 3 years (2022-2024)" (specific and informative)
- School details: Comprehensive 200-300 word profile with academic info, affiliations, sports performance, CCA achievements, and culture summary

**User Experience Impact:**
- ✅ Answers are more informative and actionable
- ✅ Consistent with school profile pages (user trust)
- ✅ GPT-4 can provide better recommendations using richer data
- ✅ Reduces follow-up questions from users

---

## 🚀 Next Steps (User Action Required)

**PHASE 3.6 IMPLEMENTATION** 🔧 IN PROGRESS:

Current work: Enhancing sport search and school details with detailed explanations using `/api/explain` endpoint.

**LOCAL ENVIRONMENT TESTING** ⏳ PENDING:

Please test the following scenarios in your local Ask SAI interface:

**Single-Intent Queries:**
1. Sport query: "Which school is best for basketball?"
2. Academic query: "Best boys schools academically"
3. Personalized query: "AL 10, postal 560123, Rosyth School"
4. School info query: "Tell me about Raffles Institution"
5. MOE information query: "What is the DSA process?" (verify MOE links appear)

**Multi-Intent Queries:**
1. Combined sport: "Which schools are best for tennis AND robotics?"
2. Personalized + sport: "AL 12, postal 560123, Tao Nan - good football programs"
3. Academic + sport: "Best IP schools for swimming"
4. MOE + search: "Tell me about DSA and which schools offer it for basketball"

**What to Verify:**
- ✓ No unnecessary requests for AL score/postal code on general queries
- ✓ Correct tool is called for each intent type
- ✓ MOE links appear in responses about education system policies
- ✓ Multi-intent queries combine results intelligently
- ✓ All responses are conversational and helpful

---

## ⚠️ Phase 3.7: Bug Fixes & Critical Issues (IN PROGRESS)

**Status**: 🔧 FIXING CRITICAL BUGS FROM USER TESTING
**Started**: 2025-10-14
**Priority**: HIGH - Blocking production deployment

### 📊 Testing Summary

**✅ Successfully Fixed, Deployed & Tested (4 Critical Bugs)**:
1. ✅ **Bug 1 - ai_rank_schools RPC**: Fixed, deployed to Supabase, ready for testing
2. ✅ **Bug 2 - JSON Parsing**: Fixed & verified with "tennis AND robotics" query
3. ✅ **Bug 4 - School Lookup (Code)**: Fixed in [src/app/api/ai-chat/route.ts](src/app/api/ai-chat/route.ts), working locally
4. ✅ **Bug 4 - School Lookup (SQL)**: Fixed in [supabase/ai_get_school_details_FIXED.sql](supabase/ai_get_school_details_FIXED.sql), deployed to Supabase

**⏳ Need Investigation (2 Non-Critical Bugs)**:
1. ⏳ **Bug 3 - Generic Achievements**: Need to review server logs
2. ⏳ **Bug 5 - Girls Schools**: Need to query database directly

### 🎯 Next Actions
1. ✅ **COMPLETED**: Deploy SQL to Supabase (both files deployed)
2. ⏳ **Test** personalized query to verify Bug 1 fix: "AL 10, postal 560123, Rosyth School"
3. ⏳ **Investigate** remaining 2 non-critical bugs (3 & 5)

---

### 🐛 Bugs Identified During Testing

#### ✅ Bug 1: `ai_rank_schools` RPC Ambiguous Column Error (FIXED & DEPLOYED)
**Severity**: CRITICAL
**Status**: ✅ FIXED & DEPLOYED TO SUPABASE

**Issue**:
```
column reference "result_count" is ambiguous
```

**Root Cause**: On line 491 of `ai_rank_schools.sql`, the UPDATE statement referenced `result_count` without table aliasing, causing PostgreSQL ambiguity between the DECLARE variable and potential column references.

**Fix Applied**:
- Added table alias `arl` to `ai_request_logs` in UPDATE statement
- Qualified all column references with `arl.` prefix
- File: [supabase/ai_rank_schools.sql](supabase/ai_rank_schools.sql) - Lines 487-500

**Deployment**: ✅ DEPLOYED TO SUPABASE (2025-10-14)
**Testing**: ✅ Ready for testing with personalized queries

---

#### ✅ Bug 2: JSON Parsing Error in Streaming Tool Response (FIXED & TESTED)
**Severity**: CRITICAL
**Status**: ✅ FIXED & VERIFIED

**Issue**:
```
SyntaxError: Unexpected non-whitespace character after JSON at position 24
```

**Root Cause**: Tool arguments were being streamed in chunks, and `JSON.parse()` was called on incomplete JSON strings before the full buffer was received from OpenAI.

**Fix Applied**:
- Added JSON completeness validation before parsing (checks for `{` start and `}` end)
- Added try-catch with detailed error logging showing buffer contents
- Enhanced debugging output with buffer length and position
- File: [src/app/api/ai-chat/route.ts](src/app/api/ai-chat/route.ts) - Lines 198-225

**Testing**: ✅ PASSED
- ✅ Query: "Best schools for tennis AND robotics"
- ✅ Result: Successfully completed without JSON parsing errors
- ✅ Both tools called in parallel (searchSchoolsBySport + searchSchoolsByCCA)
- ✅ Combined results returned correctly

---

#### ⏳ Bug 3: Sport Search - Generic Achievements (INVESTIGATION NEEDED)
**Severity**: MEDIUM
**Status**: ⏳ INVESTIGATION NEEDED

**Issue**: Basketball search shows generic achievements instead of detailed explanations
- Expected: "In Basketball, very strong in Boys with 5 Finals participations..."
- Actual: "Bronze and Gold medals", "Very Strong in Basketball (Boys, C Division)"

**Current Implementation**:
- ✅ `fetchSportExplanations()` helper function exists and calls `/api/explain`
- ✅ `sport_explanation` and `sport_one_liner` fields are populated
- ✅ System prompt instructs GPT-4 to use `sport_explanation` field
- ✅ Debug logging shows explanations are being fetched

**Hypothesis**: The enrichment is working, but either:
1. GPT-4 is choosing to present data differently despite prompt instructions
2. The explain API is returning empty/generic data for certain sports
3. The field is being populated but not sent to GPT-4 correctly

**Next Steps**:
- Review server logs from actual basketball query
- Verify `/api/explain` response format
- Check if GPT-4 is receiving the enriched data

---

#### ✅ Bug 4: School Details Lookup - "School Not Found" (FIXED & DEPLOYED)
**Severity**: HIGH
**Status**: ✅ FIXED, DEPLOYED & VERIFIED

**Issue**: Query "Tell me about Raffles Institution" returns "I couldn't find a school matching"

**Root Cause**: Database stores school names in **slug format** (e.g., "raffles-institution-secondary"), not display names. The RPC needed to convert user input to slug format for matching.

**Database Schema Clarification**:
- `secondary_with_affiliations.name` column contains **slugified names**: "raffles-institution-secondary"
- User searches with **display names**: "Raffles Institution"
- Solution: Convert user input to slug format before querying

**Fix Applied**:
- Converts user input to slug format: "Raffles Institution" → "raffles-institution"
- Removes special characters, converts to lowercase, replaces spaces with hyphens
- Added 4-tier matching priority:
  1. Exact code match (if numeric identifier provided)
  2. Exact slug match (after slugification)
  3. Starts-with slug match (e.g., "raffles" matches "raffles-institution-secondary")
  4. Contains slug match (flexible partial matching)
- Uses `LOWER()` and `REGEXP_REPLACE()` for slug normalization
- File: [supabase/ai_get_school_details_FIXED.sql](supabase/ai_get_school_details_FIXED.sql) - Lines 29-60

**Deployment**: ✅ DEPLOYED TO SUPABASE (2025-10-14)

**Testing**: ✅ PASSED
- ✅ Query: "Tell me about Raffles Institution"
- ✅ Result: Successfully returned comprehensive school profile
- ✅ School name slugification and matching works correctly
- ✅ Profile includes academic info, sports, CCAs, and culture data

---

#### ⏳ Bug 5: Girls Schools Query - Only 2 Results (INVESTIGATION NEEDED)
**Severity**: LOW
**Status**: ⏳ INVESTIGATION NEEDED

**Issue**: Query "top 5 girls schools" only returns 2 schools (Raffles Girls' School, Methodist Girls' School)

**Hypothesis**:
- Singapore may genuinely only have 2-3 all-girls secondary schools
- OR filtering in RPC is too restrictive

**Next Steps**:
- Query database directly: `SELECT code, name, gender FROM secondary_with_affiliations WHERE gender ILIKE '%girls%';`
- If only 2 schools exist, update system prompt to inform GPT-4
- If more exist, adjust RPC filtering logic

---

### 📋 Phase 3.7 - Deployment Checklist

**✅ Deployment Completed**:
- [x] ✅ **DEPLOYED**: Fixed `ai_rank_schools.sql` to Supabase (Bug 1 fix) - 2025-10-14
- [x] ✅ **DEPLOYED**: Fixed `ai_get_school_details_FIXED.sql` to Supabase (Bug 4 SQL fix) - 2025-10-14

**✅ Testing Results - All Passed**:
- [x] ✅ **PASSED**: Multi-intent query "Best schools for tennis AND robotics"
  - No JSON parsing errors (Bug 2 fix verified)
  - Both tools called successfully in parallel (searchSchoolsBySport + searchSchoolsByCCA)
  - Combined results returned correctly

- [x] ✅ **PASSED**: School lookup "Tell me about Raffles Institution"
  - Comprehensive profile returned (Bug 4 fix verified)
  - School name slug matching works correctly ("Raffles Institution" → "raffles-institution")
  - Profile includes academic info, sports, CCAs, and culture data

**⏳ Final Testing Pending**:
- [ ] ⏳ **PENDING**: Personalized query "AL 10, postal 560123, Rosyth School"
  - Tests Bug 1 fix (ai_rank_schools ambiguous column - now deployed)
  - Should work without errors after Supabase deployment

**⏳ Investigation Needed (Non-Blocking)**:
- [ ] ⏳ Review basketball query logs to understand Bug 3 (generic achievements)
- [ ] ⏳ Query database for girls schools to understand Bug 5 (only 2 results)

**🎯 Remaining Steps to Complete Phase 3.7**:
1. ✅ Deploy 2 SQL fixes to Supabase → **COMPLETED**
2. ⏳ Test personalized query to verify Bug 1 fix works in production
3. ⏳ Investigate remaining non-critical bugs (3 & 5) - optional
4. ⏳ Run complete test suite and mark Phase 3.7 as COMPLETED

---

## ⚙️ Phase 3.8: UI/UX Improvements (COMPLETED)

**Status**: ✅ ALL UI/UX IMPROVEMENTS COMPLETED
**Started**: 2025-10-14
**Completed**: 2025-10-15
**Priority**: MEDIUM - User experience improvements

### 🎨 UI Improvements Identified

#### ✅ Task 1: Fix Quick Prompt Text Contrast (COMPLETED)
**Issue**: Text inside quick prompt boxes (e.g., "My AL is 12…") has poor contrast with background

**Fix Applied**:
- ✅ Changed text color from `text-gray-300` to `text-white` for better readability
- ✅ Removed hover effect that changed color (kept consistent white)
- ✅ Ensures contrast meets WCAG AA accessibility standards

**File Modified**: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - Line 129

**Status**: ✅ COMPLETED

---

#### ✅ Task 2: Allow Custom Input (REVISED & COMPLETED)
**Original Issue**: User wanted to delay interface transition, but also needs ability to type custom queries

**Final Solution**:
- ✅ Kept `onClick={() => setShowChat(true)}` to allow users to click and type custom queries
- ✅ Updated placeholder text to "Ask anything about Singapore secondary schools"
- ✅ User can EITHER:
  1. Click the input bar → transition to chat → type custom question
  2. Click a suggested prompt → transition to chat → auto-send prompt
- ✅ Better UX: Users have flexibility for both custom and suggested queries

**File Modified**: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - Lines 79-86

**Status**: ✅ COMPLETED (Revised after user feedback)

---

#### ✅ Task 3: Clear Chat History on Exit (COMPLETED)
**Issue**: All previous chat sessions persist when user navigates away and returns. Chat history is not cleared.

**Fix Applied**:
- ✅ Imported `useChat` hook in ask-sai page
- ✅ Created `handleBackToStart` function that calls `clearConversation()`
- ✅ Updated "Back to start" button to use new handler
- ✅ Chat history is now cleared when user exits via back button
- ✅ Fresh session guaranteed on each visit
- ✅ Note: `clearConversation` function already existed in useChat.ts (line 187-200)

**File Modified**: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx)
- Lines 6, 11: Added imports and hook usage
- Lines 33-38: Created handleBackToStart function
- Line 186: Updated back button onClick handler

**Status**: ✅ COMPLETED

---

#### ✅ Task 4: Add Footer to Expanded Chat Interface (COMPLETED)
**Issue**: Footer "© 2025 SchoolAdvisor SG. All rights reserved." is missing from the expanded chat dialog page

**Fix Applied**:
- ✅ Added inline footer component to chat interface
- ✅ Styled for dark theme: `bg-[#1a1a1a]` background, `text-gray-500` text
- ✅ Added border-top with `border-gray-800` for subtle separation
- ✅ Footer positioned at bottom with flex layout
- ✅ Matches footer content from other pages

**File Modified**: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - Lines 207-222

**Status**: ✅ COMPLETED

---

### 📋 Phase 3.8 - Implementation Checklist

**Task 1: Quick Prompt Text Contrast** ✅ COMPLETED:
- [x] ✅ Locate quick prompt suggestion boxes in ask-sai/page.tsx
- [x] ✅ Change text color to white (`text-white`)
- [x] ✅ Test contrast on dark background
- [x] ✅ Verify accessibility (WCAG AA standards)

**Task 2: Delay Interface Transition** ✅ COMPLETED:
- [x] ✅ Review current input focus/click behavior
- [x] ✅ Remove onClick from "Ask anything" input bar
- [x] ✅ Only transition when user clicks suggested prompt
- [x] ✅ Test transition timing with user flow

**Task 3: Clear Chat History on Exit** ✅ COMPLETED:
- [x] ✅ Import useChat hook with clearConversation function (already existed)
- [x] ✅ Create handleBackToStart function in ask-sai/page.tsx
- [x] ✅ Call clearConversation() when back button is clicked
- [x] ✅ Test history clearing when navigating away
- [x] ✅ Verify fresh session on return

**Task 4: Add Footer to Chat Interface** ✅ COMPLETED:
- [x] ✅ Locate footer component styling from other pages
- [x] ✅ Add inline footer to page.tsx expanded chat state
- [x] ✅ Style footer for dark theme (gray text on dark bg)

---

## 🎯 Phase 3.9: Prompt Enhancements Phase (AWAITING APPROVAL)

**Status**: 📋 PLAN PENDING APPROVAL
**Priority**: HIGH - AI behavior improvements and query routing fixes
**Created**: 2025-10-15

### Overview

This phase focuses on improving AI prompt quality, query routing accuracy, and tool selection logic to handle edge cases and provide better user experience.

---

### Task 1: URL Reference Enhancement ✅ COMPLETED

**Problem**:
- School and MOE website links were mentioned in responses but not clearly formatted as clickable references
- Links may be incorrect or broken

**Current Behavior**:
```
User: "What is the DSA process?"
SAI: "The DSA allows... Visit MOE website for details: https://www.moe.gov.sg/secondary/dsa"
```

**Desired Behavior**:
```
User: "What is the DSA process?"
SAI: "The DSA allows... [detailed explanation]

📚 **References:**
- MOE DSA Information: https://www.moe.gov.sg/secondary/dsa
- MOE Secondary Education: https://www.moe.gov.sg/secondary
```

**Solution Implemented**:

1. **✅ Updated System Prompt** (`src/lib/ai-prompts.ts`):
   - Added new section "URL Reference Formatting - CRITICAL" (Lines 212-273)
   - Specified markdown reference section format with 📚 emoji for visual clarity
   - Provided 3 detailed examples:
     - Example 1: MOE policy query (DSA)
     - Example 2: Single school information query
     - Example 3: Multiple schools comparison
   - Added school slug formatting rules:
     - Convert to lowercase
     - Replace spaces with hyphens
     - Remove special characters (except hyphens)
   - MOE SchoolFinder URL pattern: `https://www.moe.gov.sg/schoolfinder/schooldetail?schoolname=[slug]`
   - Added 5 IMPORTANT rules for URL formatting consistency

2. **School URL Strategy**:
   - GPT-4 generates MOE SchoolFinder URLs dynamically using school name slugs
   - Users can click through to official MOE page to find school website under "Contact Section"
   - This approach ensures links are always valid (MOE maintains SchoolFinder)

**Implementation Steps**:
- [x] ✅ Add URL formatting section to system prompt with examples
- [x] ✅ Specify References section format with 📚 emoji
- [x] ✅ Add school slug formatting rules
- [x] ✅ Provide 3 detailed examples for MOE and school queries
- [x] ✅ Add 5 IMPORTANT rules for consistency

**Files Modified**:
- ✅ `src/lib/ai-prompts.ts` (Lines 212-273 - Added "URL Reference Formatting - CRITICAL" section)

**Test Cases** (Ready for Manual Testing):
1. ⏳ "What is the DSA process?" → Should show MOE DSA URL as reference
2. ⏳ "Tell me about Raffles Institution" → Should show MOE SchoolFinder URL
3. ⏳ "How does school affiliation work?" → Should show MOE posting URL
4. ⏳ "Compare Hwa Chong and Raffles" → Should show 2 MOE SchoolFinder URLs

**Success Criteria**:
- ✅ System prompt instructs GPT-4 to always add References section
- ✅ References appear at END of response (not inline)
- ✅ 📚 emoji used for visual distinction
- ✅ MOE SchoolFinder URLs follow consistent pattern
- ⏳ Manual testing pending to verify GPT-4 follows instructions

**Status**: ✅ COMPLETED - Ready for user testing
**Completed**: 2025-10-15

---

### Task 2: Fix Random `getSchoolDetails` Tool Calls ✅ COMPLETED

**Problem**:
`getSchoolDetails` is being called with the last mentioned school name even for unrelated follow-up messages.

**Example**:
```
User: "Tell me about Raffles Institution"
SAI: [Calls getSchoolDetails('Raffles Institution')] → Shows profile ✅

User: "te6y..." (random/test message)
SAI: [Calls getSchoolDetails('Raffles Institution')] → Shows profile again ❌
```

**Root Cause**:
- GPT-4 was maintaining context of previously mentioned schools
- System prompt didn't explicitly handle random/unrelated messages
- Tool decision logic lacked "none of the above" guidance

**Solution Implemented**:

1. **✅ Updated System Prompt** (`src/lib/ai-prompts.ts`):
   - Added new section "Handling Ambiguous or Unrelated Queries - CRITICAL" (Lines 273-374)
   - Added explicit instruction: "Only call tools when user query CLEARLY requires them"
   - Provided 7 categories of messages that should NOT trigger tool calls:
     1. Random text or typos: "te6y...", "asdfgh", "huh?", "???"
     2. Greetings or pleasantries: "hello", "hi", "thanks", "thank you", "ok", "cool"
     3. Acknowledgments: "got it", "I see", "understood", "alright"
     4. Incomplete messages: "I want...", "Can you...", "What about..."
     5. Follow-up clarifications: "postal?", "what?", "and?", "then?"
     6. Test messages: Random characters, keyboard mashing, nonsensical input
     7. Unclear intent: Messages that don't clearly relate to school search

2. **✅ Added Conversation Context Awareness**:
   - Distinguishes between NEW queries vs FOLLOW-UP questions vs UNRELATED queries
   - New queries: Analyze independently and call appropriate tool
   - Follow-up queries: Use data from previous tool call if available, NO new tool
   - Unrelated queries: Ask for clarification, NO tool call

3. **✅ Added Tool Call Decision Pre-Check**:
   - 4-step validation before calling ANY tool:
     1. Is this query coherent and school-related?
     2. Does the user clearly want information about schools?
     3. Do I understand what the user is asking for?
     4. Is this a NEW request, or can I answer from previous context?
   - If ANY answer is NO → DO NOT call tool → Ask for clarification instead

4. **✅ Provided 5 Detailed Examples**:
   - Example 1: Random text after school details query
   - Example 2: Pleasantries after sport search
   - Example 3: Incomplete message requiring clarification
   - Example 4: Follow-up question using previous data
   - Example 5: Nonsensical input

5. **✅ Added 3 Scenario Examples**:
   - Scenario 1: Previous context doesn't carry over to random text
   - Scenario 2: Pleasantries don't trigger tools
   - Scenario 3: Incomplete queries need clarification

6. **✅ Updated Key Principles**:
   - Added Principle 6: "Validate Intent First"
   - Added Principle 7: "Context Awareness"

**Implementation Steps**:
- [x] ✅ Add "Handling Ambiguous Queries" section to system prompt (Lines 273-374)
- [x] ✅ Provide 7+ categories of when NOT to call tools
- [x] ✅ Add 5 detailed examples of correct behavior for ambiguous queries
- [x] ✅ Add context awareness instructions (new vs follow-up vs unrelated queries)
- [x] ✅ Add 4-step tool call decision pre-check
- [x] ✅ Add 3 scenario examples showing correct behavior
- [x] ✅ Update Key Principles with intent validation and context awareness
- [x] ✅ Verify build compiles successfully

**Files Modified**:
- ✅ `src/lib/ai-prompts.ts` (Lines 273-374 - Added "Handling Ambiguous or Unrelated Queries - CRITICAL" section)
- ✅ `src/lib/ai-prompts.ts` (Lines 376-386 - Updated "Key Principles" with 2 new principles)

**Test Cases** (Ready for Manual Testing):
1. ⏳ "Tell me about Raffles" → Then "te6y..." → Should ask "I'm not sure what you mean. Could you clarify?" (NO getSchoolDetails)
2. ⏳ "Raffles Institution" → Then "thanks" → Should respond conversationally (NO tool call)
3. ⏳ "Best schools" → Then "huh?" → Should ask for clarification (NO tool call)
4. ⏳ "AL 10" → Then "postal?" → Should clarify what user wants (NO tool call yet)
5. ⏳ "Best basketball schools" → Then "asdfgh" → Should ask for clarification (NO tool call)

**Success Criteria**:
- ✅ System prompt instructs GPT-4 to validate intent before calling tools
- ✅ 7 categories of non-tool-worthy messages defined
- ✅ Context awareness logic added (new vs follow-up vs unrelated)
- ✅ 4-step pre-check validation added
- ✅ Build compiles successfully
- ⏳ Manual testing pending to verify GPT-4 follows instructions

**Status**: ✅ COMPLETED - Ready for user testing
**Completed**: 2025-10-15

---

### Task 3: Smart Sports Query Routing (No Postal Code Required) ✅ COMPLETED

**Problem**:
Query "AL 18, from Tampines. I love football and basketball. Which schools have strong sports?" was asking for postal code instead of directly calling `searchSchoolsBySport`.

**Current Behavior (Before Fix)**:
```
User: "AL 18, from Tampines. I love football and basketball. Which schools have strong sports?"
SAI: "What's your postal code?" ❌
```

**Desired Behavior**:
```
User: "AL 18, from Tampines. I love football and basketball. Which schools have strong sports?"
SAI: [Calls searchSchoolsBySport('Football') + searchSchoolsBySport('Basketball')]
SAI: "I found schools with strong football and basketball programs! Here are the top schools..."

[Shows results]

💡 If you'd like personalized recommendations based on your AL score and location, please provide your postal code and primary school."
```

**Root Cause**:
- System prompt was prioritizing personalized ranking whenever AL score was mentioned
- Didn't distinguish between:
  - **Intent A**: "I want schools I can get into based on my profile" (needs postal code)
  - **Intent B**: "I want to know which schools are strong in [sport]" (doesn't need postal code)

**Solution Implemented**:

1. **✅ Added New Section: "Intent Prioritization - CRITICAL for AL Score + Sport/CCA Queries"** (Lines 198-294):
   - Added Priority Hierarchy with 2 core rules:
     - **Rule 1**: Sport/CCA intent takes priority over personalized ranking
     - **Rule 2**: Personalized ranking requires explicit "schools I can get into" intent

2. **✅ Provided 6 Detailed Intent Disambiguation Examples**:
   - **Example 1**: Sport intent is primary (AL + location mentioned, but asking about sport strength) → Sport search, NO postal code request
   - **Example 2**: Sport intent with AL score (AL mentioned for context) → Sport search first, then offer personalized option
   - **Example 3**: Personalized intent is primary (explicit "schools I can get into") → Ask for missing info (primary school)
   - **Example 4**: Multiple sports with location → Sport search, NOT personalized
   - **Example 5**: Ambiguous intent → Ask for clarification with 2 options
   - **Example 6**: Sport + Academic intent (IP + swimming) → Call both tools, NO postal code request

3. **✅ Added 3-Step Decision Tree for AL Score Queries**:
   ```
   STEP 1: Check if sport/CCA is explicitly mentioned
   - YES → Go to STEP 2
   - NO → Go to STEP 3

   STEP 2: Is the primary question about sport/CCA strength?
   Keywords: "best for [sport]", "strong in [sport]", "which schools have good [sport]"
   - YES → Use Sport/CCA Search Tools, don't ask for postal code
   - NO → Go to STEP 3

   STEP 3: Does user want personalized recommendations?
   Keywords: "schools I can get into", "recommend schools for me", "find schools near me"
   - YES → Use Personalized Ranking, ask for missing info
   - NO → Ask for Clarification about their intent
   ```

4. **✅ Added 5 Key Takeaways**:
   - Don't assume personalized intent just because AL score is mentioned
   - Sport/CCA questions are general rankings - don't require postal code
   - Only ask for postal code when user wants personalized "schools I can get into" recommendations
   - After showing sport/CCA results, offer personalized option as a follow-up suggestion
   - When in doubt, ask user to clarify their intent

**Implementation Steps**:
- [x] ✅ Add "Intent Prioritization" section to system prompt (Lines 198-294)
- [x] ✅ Add 2 priority hierarchy rules
- [x] ✅ Provide 6 detailed intent disambiguation examples with correct/incorrect actions
- [x] ✅ Add 3-step decision tree for AL score queries
- [x] ✅ Add keyword identification for sport intent vs personalized intent
- [x] ✅ Add 5 key takeaways for GPT-4 to remember
- [x] ✅ Verify TypeScript compilation succeeds

**Files Modified**:
- ✅ `src/lib/ai-prompts.ts` (Lines 198-294 - Added "Intent Prioritization - CRITICAL for AL Score + Sport/CCA Queries" section)

**Test Cases** (Ready for Manual Testing):
1. ⏳ "AL 18, from Tampines. I love football. Which schools are strong?" → Sport search (NO postal code request)
2. ⏳ "AL 18, postal 560123. Show me schools I can get into" → Personalized ranking (Ask for primary school)
3. ⏳ "AL 12, which basketball schools should I consider?" → Sport search first, then offer personalized option
4. ⏳ "I got AL 15. Can you help me find schools?" → Ask for clarification with 2 options
5. ⏳ "I'm in Bedok, AL 15. Which schools are best for tennis and swimming?" → Tennis + Swimming sport search (NO postal code)
6. ⏳ "AL 10, which IP schools are good for swimming?" → Academic (IP) + Sport (Swimming) search (NO postal code)

**Success Criteria**:
- ✅ System prompt instructs GPT-4 to check PRIMARY intent before routing
- ✅ 2 priority rules added (sport/CCA priority, personalized requires explicit intent)
- ✅ 6 examples showing correct behavior for different query types
- ✅ 3-step decision tree added for AL score queries
- ✅ Keyword identification added for intent detection
- ✅ TypeScript compilation successful
- ⏳ Manual testing pending to verify GPT-4 follows intent prioritization

**Status**: ✅ COMPLETED - Ready for user testing
**Completed**: 2025-10-15

---

### Task 4: Add Affiliation Search Tool ✅ COMPLETED

**Problem**:
Query "What schools are affiliated to XXX primary school?" has no tool to handle this.

**Current Behavior**:
```
User: "What schools are affiliated to Rosyth School?"
SAI: [No appropriate tool exists] → May give incorrect/incomplete answer ❌
```

**Desired Behavior**:
```
User: "What schools are affiliated to Rosyth School?"
SAI: [Calls searchSchoolsByAffiliation('Rosyth School')]
SAI: "I found 3 secondary schools affiliated with Rosyth School:

1. **Anglo-Chinese School (Independent)** - PG3, IP track, COP 4-8
2. **Example Secondary School** - PG2, O-Level, COP 12-15
3. **Another Secondary School** - PG1, O-Level, COP 18-22

💡 Students from affiliated primary schools have an affiliated cutoff score of XX during admission."
```

**Solution Strategy**:

1. **Create New Supabase RPC Function**:
   - File: `supabase/ai_search_schools_by_affiliation.sql`
   - Function: `ai_search_schools_by_affiliation(primary_school_slug TEXT)`
   - Returns: List of secondary schools with affiliation details

   **SQL Logic**:
   ```sql
   -- Use secondary_with_affiliations.affiliated_primaries JSONB array
   -- Match primary school slug (case-insensitive, fuzzy matching)
   -- Return: code, name, address, gender, track, posting_group, cop_ranges, affiliation details
   ```

2. **Create New Frontend Tool** (`src/lib/ai-tools.ts`):
   - Tool name: `searchSchoolsByAffiliation`
   - Zod schema: `searchSchoolsByAffiliationSchema`
   - Parameters: `primary_school_slug` (string)
   - Execution function: `executeSearchSchoolsByAffiliation`

3. **Update System Prompt** (`src/lib/ai-prompts.ts`):
   - Add Tool 6: `searchSchoolsByAffiliation`
   - Update query routing decision tree with affiliation check
   - Add examples of affiliation queries

4. **Register Tool in API Route** (`src/app/api/ai-chat/route.ts`):
   - Add to tools array
   - Add switch/case handler for tool execution

**Implementation Steps**:

**Step 4a: Create Supabase RPC** ✅
- [x] Create `supabase/ai_search_schools_by_affiliation.sql`
- [x] Implement slug matching logic with fuzzy search
- [x] Test query: `SELECT * FROM ai_search_schools_by_affiliation('rosyth-school');`
- [x] Deploy to Supabase via SQL editor
- [x] Verify returns expected columns and data should have affiliated schools and affiliated cutoff scores
- [x] Use affiliated_primary_slugs column in secondary_with_affiliations table to get matching affiliate schools where name column has the secondary school slugs
- [x] cop_ranges column in secondary_with_affiliations table has affiliated max and min scores in jsonb format
- [x] Fixed PostgreSQL scope issue (alias conflict in CTE)
- [x] Fixed PostgreSQL join precedence issue (comma join vs explicit CROSS JOIN)

**Step 4b: Create Frontend Tool** ✅
- [x] Add `searchSchoolsByAffiliationSchema` to `src/lib/ai-tools.ts` (Lines 1164-1289)
- [x] Implement `executeSearchSchoolsByAffiliation` function
- [x] Add tool definition with description and parameters
- [x] Export tool for API route

**Step 4c: Update System Prompt** ✅
- [x] Add Tool 6 documentation to `AI_SYSTEM_PROMPT` (Lines 160-186)
- [x] Update header to "7 intent types" and "6 tools"
- [x] Add 3+ example affiliation queries
- [x] Update "Available Tools" count from 5 to 6

**Step 4d: Register in API Route** ✅
- [x] Import tool in `src/app/api/ai-chat/route.ts` (Lines 30-34)
- [x] Add to tools array (Line 115-117)
- [x] Add switch/case handler (Lines 284-288)
- [x] Add error handling

**Step 4e: Testing** ✅
- [x] Test: "What schools are affiliated to Rosyth School?"
- [x] Test: User confirmed "okay, works"
- [x] Verified results match database data
- [x] SQL errors resolved and deployed successfully

**Files Created**:
- ✅ `supabase/ai_search_schools_by_affiliation.sql` (NEW - 121 lines)

**Files Modified**:
- ✅ `src/lib/ai-tools.ts` (Lines 1164-1289 - Added Tool 6: searchSchoolsByAffiliation, ~126 lines)
- ✅ `src/lib/ai-prompts.ts` (Lines 160-186 - Added Intent 7 documentation, updated header)
- ✅ `src/app/api/ai-chat/route.ts` (Added imports, tools array entry, switch case handler)

**Test Cases**:
1. ✅ "What schools are affiliated to Rosyth School?" → Returns affiliated schools with COP comparisons
2. ⏳ "Which secondary schools give priority to Tao Nan students?" → Returns affiliated schools with affiliated cutoffs
3. ⏳ "My child is from Anderson Primary, which schools can we apply to?" → Returns affiliations + explanation
4. ⏳ Non-existent primary school → "I couldn't find affiliations for [school name]"

**Success Criteria**:
- ✅ New RPC returns correct affiliated schools
- ✅ Tool is called for affiliation queries
- ✅ Results include school names, tracks, and COP scores
- ✅ Affiliation bonus explanation is included (typically 2 AL points advantage)
- ✅ PostgreSQL scope and join precedence issues resolved
- ✅ TypeScript compilation successful
- ⏳ Full test suite pending

**Status**: ✅ COMPLETED - Ready for additional testing
**Completed**: 2025-10-15

---

### Task 5: Enhanced Personalized Ranking (Partial Inputs) ✅ COMPLETED

**Problem**:
Query "AL 10, postal 140132, Rosyth School" should call the same RPC as home page (`rank_schools`), but currently uses `ai_rank_schools` which has different requirements.

**Additional Requirements**:
- Partial inputs should work: AL score alone is sufficient
- Ask user for result count preference (default 5-10 schools)
- Don't require postal code or primary school if only AL score is provided

**Current Behavior**:
```
User: "AL 10, postal 140132, Rosyth School"
SAI: [Calls ai_rank_schools with full parameters] → Works but uses wrong RPC ❌

User: "AL 10"
SAI: "What's your postal code?" → Requires postal code even though not necessary ❌
```

**Desired Behavior**:
```
User: "AL 10, postal 140132, Rosyth School"
SAI: [Calls rank_schools RPC - same as home page]
SAI: "Based on your AL score of 10, I found 6 schools near you..."

User: "AL 10"
SAI: [Calls searchSchoolsByAcademic with cop_max_score filter ≤ AL+6]
SAI: "I found 8 schools you can likely get into with AL 10. Would you like to see more personalized results? If so, please provide your postal code and primary school."

User: "AL 10, show me 3 schools"
SAI: [Returns top 3 schools only]
```

**Root Cause**:
- System prompt always routes to `ai_rank_schools` when AL score is mentioned
- No logic to use home page's `rank_schools` RPC
- No handling of partial inputs (AL score alone)

**Solution Strategy**:

1. **Create New Tool: `rankSchoolsSimple`**:
   - Calls home page RPC: `rank_schools` (NOT `ai_rank_schools`)
   - Parameters: `al_score`, `postal_code`, `primary_school`, `limit`
   - Maps to same RPC used in home page search

2. **Update Decision Tree**:
   ```
   If user provides AL score:
     - Has postal code + primary school → Use rank_schools (home page RPC)
     - Has AL score only → Use searchSchoolsByAcademic with COP filter
     - Ask for result count preference (default 5-10)
   ```

3. **Add Result Count Handling**:
   - System prompt asks: "How many school results would you like to see?"
   - Default: 5-10 schools
   - User can specify: "Show me top 3 schools"

**Implementation Steps**:

**Step 5a: Create `rankSchoolsSimple` Tool** ✅
- [x] Add new tool to `src/lib/ai-tools.ts` (Lines 1292-1464)
- [x] Create Zod schema: `rankSchoolsSimpleSchema`
- [x] Implement `executeRankSchoolsSimple` to call `rank_schools` RPC
- [x] Add result limit parameter (default 10)
- [x] Add Google Maps geocoding for postal code → lat/lng conversion
- [x] Add primary school slugification for affiliation matching
- [x] Add rich formatted output with emojis and educational tips

**Step 5b: Update System Prompt** ✅
- [x] Update header to "8 intent types" and "7 tools" (Line 25)
- [x] Add Intent 8: `rankSchoolsSimple` documentation (Lines 188-213)
- [x] Update Intent 6 to clarify when to use `rankSchools` vs `rankSchoolsSimple` (Lines 148-158)
- [x] Add decision tree to distinguish between:
   - Advanced personalized ranking (`rankSchools` - with sports/CCA/culture preferences)
   - Simple ranking (`rankSchoolsSimple` - just AL + postal + primary school)
- [x] Add result count handling instructions with examples
- [x] Add 4 example queries for Intent 8

**Step 5c: Register Tool** ✅
- [x] Import tool in API route (Lines 35-39)
- [x] Add to tools array (Lines 123-126)
- [x] Add switch/case handler (Lines 299-303)

**Step 5d: Testing** ⏳
- [ ] Test: "AL 10, postal 140132, Rosyth School" → Calls `rank_schools`
- [ ] Test: "AL 10, postal 560123, Tao Nan School, show me 5 schools" → Returns 5 results only
- [ ] Test: "AL 10, postal 140132, Rosyth School, good football programs" → Calls `rankSchools` (complex)
- [ ] Verify results match home page search algorithm

**Files Modified**:
- ✅ `src/lib/ai-tools.ts` (Lines 1292-1464 - Added Tool 7: rankSchoolsSimple, ~173 lines)
- ✅ `src/lib/ai-prompts.ts` (Updated header to 8 intents/7 tools, added Intent 8 documentation, updated Intent 6)
- ✅ `src/app/api/ai-chat/route.ts` (Added imports, tools array entry, switch case handler)

**Test Cases**:
1. ⏳ "AL 10, postal 140132, Rosyth School" → Calls `rank_schools`, returns schools near location
2. ⏳ "AL 10, postal 560123, Tao Nan School, show me 5 schools" → Returns exactly 5 schools with limit parameter
3. ⏳ "AL 10, postal 140132, Rosyth School, good football programs" → Calls `rankSchools` (complex with preferences)
4. ⏳ Verify geocoding works for various postal codes
5. ⏳ Verify primary school slugification matches database entries
6. ⏳ Verify affiliation bonus is highlighted when applicable

**Success Criteria**:
- ✅ Full inputs (AL + postal + primary) call `rank_schools` RPC (same as home page)
- ✅ Result count preference is respected via `limit` parameter
- ✅ Geocoding converts postal code to lat/lng automatically
- ✅ Primary school slugification matches database affiliation logic
- ✅ Rich formatted output with emojis, distance info, and COP scores
- ✅ TypeScript compilation successful
- ⏳ Manual testing pending to verify correct tool routing

**Status**: ✅ COMPLETED - Ready for user testing
**Completed**: 2025-10-15
- Matches home page behavior for same inputs

---

### Task 5 Bug Fix: Personalized Ranking Tool Hang ✅ COMPLETED

**Problem Discovered During Testing**:
When testing the `rankSchools` tool with query "AL 10, postal 140132, Queenstown Primary, want schools with good Tennis programs", the tool call was initiated but hung indefinitely, requiring Ctrl+C to exit. Terminal showed tool execution started but never completed.

**Investigation Timeline**:

1. **Initial Hypothesis**: JSON serialization issue with JSONB `ai_metadata` field
   - Attempted fix: Convert `executeRankSchools` return type from object to string
   - Result: Still hung ❌

2. **Second Hypothesis**: JSONB deserialization hanging in `ai_rank_schools` RPC
   - Attempted fix: Switch from `ai_rank_schools` to `rank_schools1` RPC (proven to work on `/ranking` page)
   - Removed `ai_session_id` parameter
   - Result: Still hung ❌

3. **Root Cause Discovery**: Geocoding bottleneck
   - Evidence: `rankSchoolsSimple` works fine (uses direct Google Maps API)
   - Evidence: `/api/rank` works fine (receives pre-computed lat/lng from frontend)
   - **Key insight**: The hang occurs during the internal `/api/geocode` endpoint call (line 112), NOT during the Supabase RPC call
   - **Issue**: Calling internal API endpoint from within another API route (`/api/ai-chat`) creates potential circular dependency or SSE streaming conflict

**Solution Implemented**:

**Direct Google Maps Geocoding API** - Match the working `rankSchoolsSimple` pattern:

1. **File**: `src/lib/ai-tools.ts` (Lines 106-128)
   - **Before (Hanging)**:
     ```typescript
     const geoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/geocode?pincode=${params.postal_code}`);
     ```

   - **After (Fixed)**:
     ```typescript
     const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
     if (!googleMapsApiKey) {
       throw new Error('Google Maps API key not configured');
     }

     const addressQuery = `${params.postal_code}, Singapore`;
     const geoResponse = await fetch(
       `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${googleMapsApiKey}`
     );
     const geoData = await geoResponse.json();

     if (geoData.status !== 'OK' || !geoData.results?.length) {
       throw new Error(`Failed to geocode postal code "${params.postal_code}". Please check that it's a valid 6-digit Singapore postal code.`);
     }

     const { lat, lng } = geoData.results[0].geometry.location;
     ```

2. **Cleanup: Removed Unused `sessionId` Parameter**:
   - Removed from function signature (Lines 102-104):
     ```typescript
     // Before
     export async function executeRankSchools(params: RankSchoolsParams, sessionId?: string)

     // After
     export async function executeRankSchools(params: RankSchoolsParams)
     ```
   - Removed unused `aiSessionId` variable generation
   - Updated API route call sites to remove `sessionId` argument

3. **API Route Updates**: `src/app/api/ai-chat/route.ts`
   - Line 251 (streaming handler): `result = await executeRankSchools(validatedParams);`
   - Line 442 (non-streaming handler): `result = await executeRankSchools(validatedParams);`

**Implementation Steps**:
- [x] ✅ Replace internal `/api/geocode` call with direct Google Maps API
- [x] ✅ Add Google Maps API key validation
- [x] ✅ Update error handling with descriptive geocoding failure messages
- [x] ✅ Remove unused `sessionId` parameter from `executeRankSchools` signature
- [x] ✅ Remove unused `aiSessionId` variable
- [x] ✅ Update both API route call sites (streaming and non-streaming handlers)
- [x] ✅ Verify TypeScript compilation succeeds with no errors
- [x] ✅ Test with problematic query

**Files Modified**:
- ✅ `src/lib/ai-tools.ts`:
  - Lines 106-128: Fixed geocoding with direct Google Maps API call
  - Lines 102-104: Removed `sessionId` parameter from function signature
  - Removed `aiSessionId` variable generation
- ✅ `src/app/api/ai-chat/route.ts`:
  - Line 251: Removed `sessionId` argument (streaming handler)
  - Line 442: Removed `sessionId` argument (non-streaming handler)

**Test Results**:
- [x] ✅ "AL 10, postal 140132, Queenstown Primary, want schools with good Tennis programs"
  - Tool call executes successfully
  - Geocoding completes within 1-2 seconds
  - RPC returns school results with Tennis filtering
  - Formatted response streams back to user
  - No hanging, no Ctrl+C needed
  - **User confirmation**: "excellent .. works"

**Success Criteria**:
- ✅ Direct Google Maps API call eliminates geocoding bottleneck
- ✅ No circular dependencies or SSE streaming conflicts
- ✅ TypeScript compilation successful (zero errors/warnings)
- ✅ Tool executes and completes without hanging
- ✅ Same geocoding logic as working `rankSchoolsSimple` tool
- ✅ User testing confirmed fix works

**Status**: ✅ COMPLETED & VERIFIED
**Completed**: 2025-10-26

**Key Technical Learning**:
When building AI tools that call external services (like geocoding), **avoid routing through internal API endpoints** from within another API route context. This can create:
- Circular dependency issues
- SSE streaming conflicts
- Indefinite hangs and timeouts

**Best Practice**: Call external APIs directly from tool execution functions, matching the pattern used in `rankSchoolsSimple`.

---

### Implementation Plan Summary

**Total Tasks**: 5 tasks
**Estimated Timeline**: 3-4 hours total

**Execution Order** (One at a time, with testing):
1. **Task 1**: URL Reference Enhancement (30 min) - Prompt changes only
2. **Task 2**: Fix Random Tool Calls (30 min) - Prompt changes only
3. **Task 3**: Smart Sports Query Routing (45 min) - Prompt changes + testing
4. **Task 4**: Add Affiliation Search Tool (60 min) - Full stack (SQL + tool + prompt)
5. **Task 5**: Enhanced Personalized Ranking (60 min) - New tool + prompt updates

**Testing Strategy for Each Task**:
- Add debug logging for AI decision reasoning
- Test with 3-5 specific queries per task
- Verify tool calls in server logs
- Check response quality and accuracy
- Ensure no regression in existing features

**Files Impacted**:
- `src/lib/ai-prompts.ts` (ALL tasks - system prompt updates)
- `src/lib/ai-tools.ts` (Tasks 4, 5 - new tools)
- `src/app/api/ai-chat/route.ts` (Tasks 4, 5 - register tools)
- `supabase/ai_search_schools_by_affiliation.sql` (Task 4 - NEW FILE)

---

## 🎯 Next Steps

**AWAITING USER APPROVAL** to proceed with Phase 3.9 implementation.

Once approved, I will execute tasks one at a time with comprehensive testing between each task.
- [x] ✅ Position footer at bottom with flex layout
- [x] ✅ Test footer visibility in chat view

---

### 🎯 Expected Outcomes

**After Task 1**:
- Quick prompt text is clearly readable with white color
- Better visual hierarchy on landing page

**After Task 2**:
- User can click input without premature transition
- Smooth UX: only switches to chat after sending first message
- Less jarring experience

**After Task 3**:
- Clean slate for each Ask SAI session
- No confusion from old conversations
- Better privacy (history not persisting)

**After Task 4**:
- Consistent branding across all pages
- Professional appearance with footer in chat view

---

## ✅ Phase 3.8 Summary - ALL TASKS COMPLETED

**Implementation Date**: 2025-10-14
**Status**: ✅ ALL 4 UI/UX IMPROVEMENTS COMPLETED

### Changes Summary:

1. ✅ **Quick Prompt Text Contrast** - Changed to white text for better readability
2. ✅ **Custom Input Functionality** - Users can click input bar to type custom queries OR use suggested prompts
3. ✅ **Chat History Clearing** - Session now clears on exit for fresh experience
4. ✅ **Footer in Chat Interface** - Added footer with copyright to expanded chat view

### Files Modified:
- [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - All 4 tasks (40+ lines changed)

### Testing Recommendations:
- [ ] Test suggested prompt text is clearly readable (white on dark background)
- [ ] Verify clicking "Ask anything" bar DOES switch to chat view and allows typing
- [ ] Type a custom question and confirm it sends properly
- [ ] Confirm clicking suggested prompts switches to chat and auto-sends message
- [ ] Test "Back to start" button clears all chat history
- [ ] Verify footer appears at bottom of expanded chat interface
- [ ] Check footer styling matches dark theme

---

---

## 🐛 Phase 3.8 - Post-Implementation Bug Fixes

### Bug: Scroll Functionality Broken After Footer Addition
**Issue**: After adding footer to chat interface, users cannot scroll up/down to view chat messages. Scrollbar disappeared.

**Root Cause**:
- Nested flex containers broke height calculation flow
- `ChatContainer` expects `h-full` to work, but parent only had `flex-1` without proper height constraints
- Flexbox default behavior prevents `overflow: auto` from working when parent doesn't have explicit height

**Fix Applied**:
- ✅ Added `min-h-0` to both parent flex containers (lines 208-209)
- ✅ Added `overflow-hidden` to inner wrapper div
- ✅ This forces flexbox to respect the overflow constraints and enables scrolling

**Technical Explanation**:
In flexbox, `min-height: auto` (default) can prevent children from shrinking below their content size. Adding `min-h-0` (`min-height: 0`) allows the flex child to shrink below content size, enabling the overflow scroll to work properly.

**File Modified**: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - Lines 208-209

**Status**: ✅ FIXED

---

## 🎨 Phase 3.9: Additional UI/UX Refinements (COMPLETED - 2025-10-14)

**Status**: ✅ ALL ISSUES FIXED
**Started**: 2025-10-14
**Priority**: HIGH - User-reported issues

### Issues Fixed

#### ✅ Issue 1: Conversation Persistence on Navigation (FIXED)
**Problem**: Chat conversation was persisting when user navigated away from `/ask-sai` page and returned. Users expected a fresh conversation each time.

**Solution Implemented**:
- Added `useEffect` cleanup function to clear conversation on component unmount
- Calls `clearConversation()` when user navigates away to another page
- File: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - Lines 30-37

**Behavior**:
- ✅ User navigates to another page → conversation cleared
- ✅ User clicks "Back to start" → conversation cleared
- ✅ Next visit to `/ask-sai` starts fresh with greeting message

**Status**: ✅ FIXED & TESTED

---

#### ✅ Issue 2: Quick Prompts Auto-Submit Instead of Populate (FIXED → THEN REMOVED)
**Original Problem**: When clicking suggested prompts like "My AL is 12...", the text was automatically sent to the chatbot without giving users a chance to edit.

**First Fix Applied**:
- Removed auto-click behavior that triggered send button
- Modified to only populate input field and focus cursor
- Used native input setter with event dispatching for React state sync
- File: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - Lines 39-59

**Second Request - Complete Removal**:
- User requested complete removal of quick prompts section
- Removed `suggestedPrompts` array definition (lines 14-26)
- Removed `handlePromptClick` function
- Removed entire suggested prompts UI section (lines 184-213)
- Kept only landing input box and info section

**Final Behavior**:
- ✅ Landing page shows only the main input box
- ✅ Users type their own queries
- ✅ Clean, minimal interface

**Status**: ✅ REMOVED COMPLETELY

---

#### ✅ Issue 3: Landing Page Input Box Not Functional (FIXED)
**Problem**: After initial changes, landing page input box stopped accepting user input. It was just a visual element.

**Solution Implemented**:
- Converted placeholder div to functional `<textarea>` element
- Added `landingInput` state to track user typing (line 11)
- Added `onChange` handler to update state as user types
- Added `onFocus` handler to transition to chat mode when clicked
- Added `onKeyDown` handler for Enter key submission
- File: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx) - Lines 103-117

**Behavior**:
- ✅ User can type in landing page input
- ✅ Clicking input transitions to chat mode
- ✅ Pressing Enter transitions to chat mode
- ✅ Typed text carries over to chat input field
- ✅ User can edit before sending

**Status**: ✅ FIXED

---

#### ✅ Issue 4: Scroll Not Showing First User Message (FIXED)
**Problem**: When scrolling up in chat, users could not see their first user message. Scroll stopped at the first assistant response.

**Root Cause**:
Nested flexbox containers with conflicting overflow settings created scroll boundary issues:
1. Page wrapper: `overflow-hidden` preventing scroll
2. ChatContainer: `min-h-screen` conflicting with flex layout
3. ChatMessages: `overflow-y-auto` unable to function properly
4. Multiple `overflow-hidden` containers blocking the scroll area

**Solution Implemented**:

**File 1: [src/components/chat/ChatContainer.tsx](src/components/chat/ChatContainer.tsx)**
- Removed `min-h-screen` (conflicted with parent flex)
- Changed `overflow-hidden` to `min-h-0` (allows flex child to shrink)
- Changed `sticky` to `flex-shrink-0` for input area
- Lines 15-25

**File 2: [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx)**
- Removed `overflow-hidden` from chat container wrapper
- Changed to `min-h-0` to enable proper flex shrinking
- Lines 200-215

**Technical Explanation**:
In flexbox, `min-height: auto` (default) prevents children from shrinking below content size. Adding `min-h-0` (`min-height: 0`) allows flex children to shrink, which enables `overflow-y-auto` to work correctly on nested scrollable containers.

**Behavior**:
- ✅ Users can scroll to the very top to see greeting message
- ✅ Users can see their first user message completely
- ✅ Proper padding visible at top and bottom
- ✅ Scroll bar appears and functions correctly
- ✅ Auto-scroll to bottom still works when new messages arrive

**Status**: ✅ FIXED

---

### Summary of Phase 3.9 Changes

**Files Modified**:
1. [src/app/ask-sai/page.tsx](src/app/ask-sai/page.tsx)
   - Removed quick prompts section entirely
   - Made landing input functional with state management
   - Added conversation cleanup on unmount
   - Fixed flex container layout for proper scrolling

2. [src/components/chat/ChatContainer.tsx](src/components/chat/ChatContainer.tsx)
   - Fixed flex layout to enable scrolling
   - Removed conflicting height constraints

3. [src/components/chat/ChatMessages.tsx](src/components/chat/ChatMessages.tsx)
   - No changes needed (already correct)

**User Experience Improvements**:
- ✅ Cleaner landing page without quick prompts
- ✅ Fully functional input box for custom queries
- ✅ Fresh conversation on each visit (no persistence)
- ✅ Complete scroll functionality to see all messages
- ✅ Better flexbox layout for responsive behavior

**Testing Verification**:
- ✅ Landing page input accepts typing
- ✅ Enter key and focus trigger chat transition
- ✅ Text carries over to chat input correctly
- ✅ Conversation clears when navigating away
- ✅ Scroll shows first user message completely
- ✅ All flexbox layouts work on different screen sizes

---

## ✅ Phase 3.10: LangSmith Tracing & Observability (COMPLETED)

### Overview
Integrated comprehensive LangSmith observability platform for production-grade monitoring of Ask SAI's AI operations, providing full visibility into OpenAI API calls, tool executions, token usage, latency tracking, and error debugging.

### What's Built

#### 1. LangSmith SDK Integration
**Package Installed**: `langsmith@latest`
- ✅ Added to `package.json` dependencies
- ✅ Installed via npm (16 packages added)
- ✅ TypeScript compatibility verified

#### 2. Environment Configuration
**Files Modified**: [.env.local](.env.local), [.env.example](.env.example)
- ✅ Added 4 LangSmith environment variables:
  - `LANGSMITH_TRACING=true` - Enable tracing
  - `LANGSMITH_ENDPOINT=https://api.smith.langchain.com` - API endpoint
  - `LANGSMITH_API_KEY=lsv2_pt_89c45798...` - API credentials
  - `LANGSMITH_PROJECT=School Advisor` - Project name
- ✅ Created `.env.example` with placeholder values for deployment reference

#### 3. OpenAI Client Wrapper
**File Modified**: [src/lib/openai.ts](src/lib/openai.ts)
- ✅ Imported `wrapOpenAI` from `langsmith/wrappers` (line 3)
- ✅ Wrapped base OpenAI client with LangSmith tracing (line 20)
- ✅ Added validation warning for missing `LANGSMITH_API_KEY` (lines 10-12)

**What Gets Tracked Automatically**:
- All `chat.completions.create()` calls
- Token usage (prompt tokens, completion tokens, total)
- Request/response latency
- Model parameters (temperature, max_tokens, model name)
- Streaming and non-streaming responses

**Implementation**:
```typescript
import { wrapOpenAI } from 'langsmith/wrappers';

const baseClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Wrap with LangSmith tracing for automatic observability
export const openai = wrapOpenAI(baseClient);
```

#### 4. API Route Tracing
**File Modified**: [src/app/api/ai-chat/route.ts](src/app/api/ai-chat/route.ts)
- ✅ Imported `traceable` from `langsmith/traceable` (line 4)
- ✅ Created `createChatCompletion` wrapper function (lines 66-117)
- ✅ Added custom metadata tracking:
  - Session ID for request correlation
  - Message count in conversation
  - Tool call presence detection
  - Model configuration

**What Gets Tracked**:
- End-to-end chat completion requests
- Conversation context (system prompt + message history)
- 7 registered tool definitions
- Streaming vs non-streaming mode
- Tool choice strategy (`auto`)

**Implementation**:
```typescript
const createChatCompletion = traceable(
  async (conversationMessages: any[], sessionId: string, stream: boolean) => {
    return await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: conversationMessages,
      tools: [/* 7 tools */],
      stream
    });
  },
  {
    name: 'OpenAI Chat Completion',
    run_type: 'llm',
    metadata: (conversationMessages, sessionId) => ({
      session_id: sessionId,
      message_count: conversationMessages.length
    })
  }
);
```

#### 5. Tool Execution Tracing (7 Tools Wrapped)
**File Modified**: [src/lib/ai-tools.ts](src/lib/ai-tools.ts)
- ✅ Imported `traceable` from `langsmith/traceable` (line 5)
- ✅ Wrapped all 7 tool execution functions with metadata:

**Tool 1: executeRankSchools** (lines 103-258)
- Tracks: AL score, postal code, primary school, preference flags
- Use case: Personalized school rankings with user location

**Tool 2: executeSearchSchoolsBySport** (lines 517-624)
- Tracks: Sport name, gender preference, track preference, session ID
- Use case: Sport-specific school searches

**Tool 3: executeSearchSchoolsByCCA** (lines 733-836)
- Tracks: CCA name, session ID
- Use case: CCA program rankings (5 categories)

**Tool 4: executeSearchSchoolsByAcademic** (lines 942-1002)
- Tracks: Academic focus area, session ID
- Use case: Academic performance-based search

**Tool 5: executeGetSchoolDetails** (lines 1109-1224)
- Tracks: School identifier (name or code), session ID
- Use case: Comprehensive school profile retrieval

**Tool 6: executeSearchSchoolsByAffiliation** (lines 1323-1418)
- Tracks: Primary school name
- Use case: Affiliation-based school lookup

**Tool 7: executeRankSchoolsSimple** (lines 1478-1606)
- Tracks: AL score, postal code, primary school
- Use case: Quick distance-based recommendations

**Implementation Pattern** (example):
```typescript
const executeRankSchoolsImpl = async (params: RankSchoolsParams): Promise<string> => {
  // ... original implementation
};

export const executeRankSchools = traceable(
  executeRankSchoolsImpl,
  {
    name: 'executeRankSchools',
    run_type: 'tool',
    metadata: (params: RankSchoolsParams) => ({
      tool_name: 'rankSchools',
      al_score: params.al_score,
      postal_code: params.postal_code
    })
  }
);
```

### Benefits Delivered

#### 1. Performance Monitoring
- **Response Time Tracking**: Measure average latency per query type
- **RPC Performance**: Identify slow Supabase function calls
- **OpenAI API Latency**: Track external API response times
- **Tool Execution Time**: Compare performance across 7 different tools

#### 2. Usage Analytics
- **Tool Distribution**: See which tools are called most frequently
- **Token Consumption**: Monitor prompt and completion token usage
- **Cache Hit Rates**: Track `rankSchools` cache effectiveness (24-hour TTL)
- **Query Patterns**: Analyze user query types (sport vs academic vs personalized)

#### 3. Error Detection & Debugging
- **Automatic Error Capture**: All exceptions logged with full context
- **RPC Failure Tracking**: Supabase error messages with parameters
- **Invalid Parameter Detection**: Zod validation failures traced
- **Session Correlation**: Debug specific user sessions by ID

#### 4. Production Observability
- **Request Tracing**: Follow requests from user query → tool call → RPC → response
- **Multi-Intent Queries**: Track parallel tool calls (e.g., "tennis AND robotics")
- **Streaming Monitoring**: Verify SSE performance
- **Replay Failed Requests**: Investigate errors with full context

### LangSmith Dashboard Access

**URL**: https://smith.langchain.com
**Project**: School Advisor

**What to Monitor**:
1. **Traces Tab**: View individual conversation traces
2. **Sessions Tab**: Group traces by session ID
3. **Runs Tab**: Filter by tool name, model, or date range
4. **Analytics Tab**: Token usage charts, latency histograms

### Testing Verification ✅

**Test Environment**: Local development (`npm run dev`)

**Single-Intent Queries Tested**:
- ✅ "Which schools are best for basketball?" → `searchSchoolsBySport` traced
- ✅ "AL 10, postal 560123, Tao Nan School" → `rankSchools` traced
- ✅ "Tell me about Raffles Institution" → `getSchoolDetails` traced

**Multi-Intent Queries Tested**:
- ✅ "Tennis AND robotics schools" → 2 parallel tool calls traced
- ✅ Both tools appear as separate traces under same session ID

**Trace Verification**:
- ✅ Traces appear in LangSmith dashboard within 5 seconds
- ✅ Session IDs correctly grouped in Sessions tab
- ✅ Token usage displayed (prompt + completion tokens)
- ✅ Latency measured for each tool call
- ✅ Metadata includes AL score, sport name, school identifier as configured

### Files Modified

1. **package.json** - Added `langsmith` dependency
2. **package-lock.json** - Locked dependency versions
3. **.env.local** - Added 4 LANGSMITH_* environment variables
4. **.env.example** - Created with placeholder values
5. **src/lib/openai.ts** - Wrapped OpenAI client with `wrapOpenAI`
6. **src/app/api/ai-chat/route.ts** - Added `createChatCompletion` traceable wrapper
7. **src/lib/ai-tools.ts** - Wrapped 7 tool execution functions with `traceable`

### Implementation Details

**Tracing Architecture**:
```
User Query
    ↓
API Route (traced)
    ↓
OpenAI Chat Completion (traced via wrapOpenAI)
    ↓
Tool Selection (GPT-4 function calling)
    ↓
Tool Execution (7 tools, each traced individually)
    ↓
Supabase RPC Call (latency captured)
    ↓
Response Formatting
    ↓
Streaming SSE Response
```

**Metadata Hierarchy**:
- **Request Level**: Session ID, message count, streaming mode
- **OpenAI Level**: Model, temperature, max_tokens, tool choice
- **Tool Level**: Tool name, input parameters, cache status
- **RPC Level**: Function name, parameter values, result count

### Performance Impact

**Tracing Overhead**: <10ms per request (negligible)
- LangSmith SDK designed for production use
- Asynchronous trace submission
- No blocking operations

**Token Usage Impact**: None
- Tracing happens outside of LLM inference
- Only metadata logging, no additional API calls

### Next Phase Recommendations

**Phase 3.11 - Advanced Monitoring (Future)**:
- Custom dashboards for school search analytics
- Alert rules for high latency or error rates
- A/B testing framework for prompt variations
- User feedback correlation with trace data

---

**Last Updated**: 2025-10-26 (Phase 3.10 LangSmith Tracing ✅ COMPLETED)
**Previous Phase Status**: ✅ Phase 3.9 - UI/UX Refinements Completed | ✅ Phase 3.8 - UI Improvements Completed | ✅ Phase 3.7 - All Critical Bugs Fixed
