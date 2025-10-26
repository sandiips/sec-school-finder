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

I'm a project manager with limited coding experience who is looking to become more technical. When you're coding and doing your work ensure that you ask enough clarifying questions or guide me as necessary so that we are building a robust, scalable, technically strong app.

## Project Overview

**School Advisor SG** is an AI-powered Singapore secondary school finder with three main features:
1. Distance-based search (home page)
2. Advanced multi-criteria ranking (`/ranking`)
3. **Ask SAI** - AI conversational assistant powered by OpenAI GPT-4 (`/ask-sai`)

### Tech Stack
- **Next.js 15.4.2** with App Router and TypeScript
- **Supabase** PostgreSQL with custom RPC functions
- **OpenAI GPT-4** with function calling and streaming responses
- **LangSmith** for AI observability and tracing
- **SWR** for data fetching and caching
- **Tailwind CSS 4** for styling
- **Zod** for schema validation
- **Python ETL** scripts for data processing

## Current Development Phase

**Phase 3.10**: ✅ LangSmith Tracing & Observability - COMPLETED (2025-10-26)

Progress tracked in [AIModetodo.md](AIModetodo.md)
- ✅ Core AI infrastructure complete (7 tools, 6 intent types)
- ✅ Critical bugs fixed & deployed to Supabase
- ✅ UI/UX improvements completed (scrolling, clean input)
- ✅ LangSmith integration with full observability (OpenAI + 7 tools traced)
- ✅ Production-ready monitoring for token usage, latency, and errors

## Core Architecture

### Three Main User Journeys

#### 1. Distance Search (`/` home page)
Quick postal code-based school search using `rank_schools` RPC

#### 2. Advanced Ranking (`/ranking` page)
Multi-criteria matching with sports, CCA, and culture preferences using `rank_schools1` RPC

#### 3. Ask SAI (`/ask-sai` page) 🆕
AI conversational assistant with sophisticated query routing:

**Key Files:**
- **API Route**: `src/app/api/ai-chat/route.ts` - Streaming SSE handler, tool orchestration
- **AI Tools**: `src/lib/ai-tools.ts` - 5 tool definitions with Zod schemas and execution functions
- **AI Prompts**: `src/lib/ai-prompts.ts` - System prompts, query routing logic, intent classification
- **OpenAI Client**: `src/lib/openai.ts` - OpenAI SDK configuration
- **Caching**: `src/lib/cache.ts` - In-memory caching with node-cache (24-hour TTL)
- **Chat Hook**: `src/hooks/useChat.ts` - React hook for chat state management and SSE parsing
- **UI Components**: `src/components/chat/` - ChatContainer, ChatMessages, ChatInput, MessageBubble, etc.

**5 Query Intent Types:**
1. **Personalized Rankings** - Requires AL score, postal code, primary school → `rankSchools` tool
2. **Sport Search** - General sport program rankings → `searchSchoolsBySport` tool
3. **Academic Rankings** - Schools ranked by PSLE cut-off scores → `searchSchoolsByAcademic` tool
4. **CCA Search** - CCA program rankings → `searchSchoolsByCCA` tool (5 CCAs: Robotics, Math Olympiad, Astronomy, Chemistry Olympiad, National STEM)
5. **School Details** - Information about specific schools → `getSchoolDetails` tool

**6th Intent (No Tool):**
- **MOE Information** - General education system questions → GPT-4 answers directly with MOE website links

**Multi-Intent Support:**
- GPT-4 can call multiple tools in parallel (e.g., "tennis AND robotics")
- System prompt guides intelligent combination of results

### Data Architecture

The application relies heavily on **Supabase RPC functions** rather than simple table queries:

**Core RPCs:**
- `rank_schools` - Distance-first ranking for home page
- `rank_schools1` - Multi-criteria ranking with weighted preferences
- `ai_rank_schools` - Personalized recommendations for Ask SAI (session tracking)
- `ai_search_schools_by_sport` - Sport-specific rankings
- `ai_search_schools_by_academic` - Academic performance rankings
- `ai_search_schools_by_cca` - CCA-specific rankings
- `ai_get_school_details` - Comprehensive school profiles with slug matching

**Key Database Tables:**
- `secondary_with_affiliations` - Main school table (code is INTEGER)
- `school_sports_scores` - Aggregated sports performance (has both `code` INTEGER and `school_slug` TEXT)
- `school_sport_results` - Individual sport results (code is TEXT - requires casting)
- `school_cca_scores` - CCA scores (code is TEXT)
- `school_cca_details` - CCA achievements (code is INTEGER)
- `school_culture_summaries` - AI-generated culture descriptions
- `ai_request_logs` - Session tracking for AI queries

### API Route Patterns

All API routes in `src/app/api/` follow this pattern:
- Supabase client creation with service role key
- Input validation for Singapore-specific data (PSLE scores 4-30, 6-digit postal codes)
- RPC function calls with complex parameter mapping
- Data transformation for UI consumption

**AI Chat Route Special Patterns:**
- Streaming SSE responses for real-time chat experience
- OpenAI function calling with tool orchestration
- Tool result caching for `rankSchools` (24-hour TTL)
- Error handling with graceful degradation
- Session management with nanoid for request tracking

## Singapore Education System Context

This application requires understanding of Singapore's education system:

- **PSLE AL Scores**: 4-30 scale (lower is better, opposite of sports/CCA scoring)
- **Sports/CCA Scoring**: 0-100 scale (higher is better, opposite of PSLE)
- **Primary School Affiliations**: Secondary schools give admission priority to affiliated primary schools
- **Posting Groups**: PG3 (top tier) to PG1, plus Integrated Program (IP) for 6-year pathway
- **Cut-off Scores**: 2024 data only (no historical trends)
- **National School Games**: Sports performance data source (2022-2024)
- **DSA (Direct School Admission)**: Talent-based admission before PSLE results

## Key Implementation Patterns

### Supabase RPC Integration
```typescript
const { data, error } = await supabase.rpc('rank_schools1', {
  user_score: psle_score,
  user_lat: lat,
  user_lng: lng,
  // ... many parameters for ranking algorithm
});
```

### OpenAI Function Calling Pattern
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [...conversationHistory],
  tools: [
    { type: 'function', function: rankSchoolsTool },
    { type: 'function', function: searchSchoolsBySportTool },
    // ... more tools
  ],
  tool_choice: 'auto',
  stream: true
});
```

### Zod Schema Validation
```typescript
export const rankSchoolsSchema = z.object({
  al_score: z.number().min(4).max(30),
  postal_code: z.string().regex(/^\d{6}$/),
  primary_school: z.string().min(1),
  // ... more fields
});

const validatedParams = rankSchoolsSchema.parse(toolArgs);
```

### Primary School Slug Generation
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

### Weight Mapping for Preferences
```typescript
const toWeight = (v: string) => (v === 'High' ? 0.4 : v === 'Medium' ? 0.2 : 0.0);
```

## Data Processing Pipeline

1. **ETL Scripts** (`backend/`): Python scripts ingest raw data from MOE, National School Games
2. **Supabase Functions**: Complex SQL for school ranking, sports/CCA analysis, matching algorithms
3. **API Layer**: Next.js routes transform and validate data, handle OpenAI streaming
4. **Caching Layer**: node-cache for tool results (24-hour TTL for rankings)
5. **Frontend**: React components with SWR caching for standard queries, custom hooks for AI chat

## Design Principles

**Apple-Inspired UI**: Clean metric cards, subtle shadows, generous whitespace
- Consistent 8px grid spacing
- Pink accent color (#ec4899) for primary actions
- Badge system for school attributes (gender, IP status, affiliations)

**Ask SAI Dark Theme**: Google AI Mode-inspired interface
- Dark background (#1a1a1a)
- White text for high contrast
- Pill-shaped input with rounded corners
- Asymmetric message layout (user right, assistant left)
- Slide-up animations on message appear

## Notable Complexity Areas

### Sports Performance Analysis
The `explain` API (`src/app/api/explain/route.ts`) performs sophisticated analysis:
- Uses `school_sports_scores` table for aggregated performance data
- Scoring system: Higher scores = better performance (opposite of PSLE)
- Calculates strength ratings (Very Strong ≥80, Strong ≥60, Fair ≥40, Developing <40)
- Generates natural language explanations with sport-specific achievements
- 26 available sports defined in `/api/options` route
- Handles missing data with "Sports data not available" messaging

### CCA Achievement Analysis
Limited to 5 specific categories from `/api/options`:
- Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, National STEM
- Uses `school_cca_details` table for competition results and achievements
- Displays "CCA data not available" when no performance data exists
- Achievement tracking based on competition placements and awards

### AI Query Routing System
System prompt in `src/lib/ai-prompts.ts` implements 5-step decision tree:
1. Is this about MOE policies? → Answer directly with MOE website links
2. Does user provide AL score AND location? → Use `rankSchools`
3. Asking about specific sport/CCA? → Use sport/CCA search tools
4. Asking about academic rankings? → Use academic search tool
5. Asking about specific named school? → Use school details tool

**Multi-Intent Handling:**
- GPT-4 can combine multiple tools (e.g., "tennis AND robotics")
- System prompt provides explicit examples of tool combination strategies
- Results are intelligently merged and filtered

### Cut-off Score Logic
Complex affiliation-aware scoring:
- IP (Integrated Program) tracks
- Affiliated vs non-affiliated admission paths
- Multiple posting group options per school
- 2024 cut-off data only (no trends)

### Culture Matching
AI-generated school culture summaries with:
- Core values extraction from `school_culture_summaries` table
- 15 culture traits available from `/api/options` route
- Character development focus analysis
- Learning environment categorization

## Critical Implementation Notes

### Database Schema Quirks
- `school_sports_scores`: Has BOTH `code` (INTEGER) and `school_slug` (TEXT) - use `code` for joins
- `school_sport_results`: Uses `code` as TEXT - requires `::integer` casting
- `school_cca_scores`: Uses `code` as TEXT - requires casting
- `school_cca_details`: Uses `code` as INTEGER
- `secondary_with_affiliations`: Uses `code` as INTEGER (main school table)
- PostgreSQL constraint: Cannot use `ARRAY_AGG(DISTINCT x ORDER BY y)` when x ≠ y

### Scoring Systems
- **PSLE AL scores**: 4-30 scale (lower is better)
- **Sports/CCA scores**: 0-100 scale (higher is better)
- **Distance**: Haversine formula for km calculation

### Data Availability
- Sports data: 26 options from `/api/options` route
- CCA data: 5 options only (Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, National STEM)
- Culture traits: 15 options from `/api/options` route
- Display "Sports or CCA data not available" for missing performance data

### Error Handling
- Always validate PSLE scores within 4-30 range
- Use `school_sports_scores` table for performance data (not `school_sport_results`)
- Handle both `code` and `school_code` column variants in database queries
- Implement proper error handling for RPC function failures
- Graceful degradation when OpenAI API fails
- Fallback responses when tools return empty results

### Performance Considerations
- Use caching for `rankSchools` results (24-hour TTL)
- Batch `/api/explain` calls when enriching multiple schools
- Stream OpenAI responses for better UX
- SSE parsing for real-time chat updates

## Required Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External APIs
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_BASE_URL=       # For internal API calls (e.g., localhost:3000)

# LangSmith Tracing (Production Monitoring)
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=           # Get from https://smith.langchain.com
LANGSMITH_PROJECT=School Advisor
```

## Key File Locations

### Ask SAI (AI Chat) Files 🆕
- `src/app/ask-sai/page.tsx` - Main Ask SAI page with Google AI Mode-inspired design
- `src/app/api/ai-chat/route.ts` - Streaming SSE handler, tool orchestration
- `src/lib/ai-tools.ts` - 5 tool definitions with Zod schemas (730+ lines)
- `src/lib/ai-prompts.ts` - System prompts and query routing logic (180+ lines)
- `src/lib/openai.ts` - OpenAI SDK configuration
- `src/lib/cache.ts` - In-memory caching with node-cache
- `src/hooks/useChat.ts` - React hook for chat state management
- `src/components/chat/` - ChatContainer, ChatMessages, ChatInput, MessageBubble, TypingIndicator, SchoolRecommendationCard

### Database & ETL
- `supabase/ai_rank_schools.sql` - Personalized recommendations RPC with session tracking
- `supabase/ai_search_schools_by_sport_FIXED_V2.sql` - Sport-specific rankings (working version)
- `supabase/ai_search_schools_by_academic_FIXED.sql` - Academic performance rankings
- `supabase/ai_search_schools_by_cca.sql` - CCA-specific rankings
- `supabase/ai_get_school_details_FIXED.sql` - School profiles with slug matching
- `supabase/rank_schools1.sql` - Main ranking algorithm for `/ranking` page (200+ lines)
- `supabase/tables_schema.sql` - Database structure
- `backend/` - Python scripts for data ingestion and processing

### Documentation
- `AIModetodo.md` - **PRIMARY REFERENCE** for Ask SAI implementation status, testing results, and bug fixes
- `baseline_spec.md` - Complete technical specification
- `Phase2spec.md` - School profiles and comparison tool requirements
- `todo.md` - General development tasks

### Core Components
- `src/app/page.tsx` - Distance-based search (400+ lines)
- `src/app/ranking/page.tsx` - AI-powered matching (1000+ lines with complex UI)
- `src/app/api/explain/route.ts` - Sports/CCA analysis (800+ lines)
- `src/components/ui/Navigation.tsx` - Navigation with "Ask SAI" links

## Testing & Debugging

### Common Test Queries for Ask SAI
**Single-Intent:**
- "Which school is best for basketball?" → Sport search tool
- "Best boys schools academically" → Academic search tool
- "AL 10, postal 560123, Rosyth School" → Personalized rankings tool
- "Tell me about Raffles Institution" → School details tool
- "What is the DSA process?" → MOE information (no tool)

**Multi-Intent:**
- "Which schools are best for tennis AND robotics?" → 2 tools in parallel
- "AL 12, postal 560123, Tao Nan - good football programs" → Personalized with sport filter
- "Best IP schools for swimming" → Academic + sport combination
- "Tell me about DSA and which schools offer it for basketball" → MOE info + sport search

### Known Issues & Resolution Status

**✅ Resolved Issues (Phase 3.7 - Deployed 2025-10-14)**:
1. **ai_rank_schools ambiguous column error** - Fixed JOIN with aliased CTEs in RPC function
2. **JSON parsing in streaming responses** - Fixed tool result serialization in API route
3. **School details slug matching** - Updated `ai_get_school_details` RPC to use ILIKE pattern matching
4. **Message container scrolling** - Added `min-h-0` to flex container in Ask SAI page

**✅ Resolved Issues (Phase 3.9 - Fixed 2025-10-26)**:
5. **Personalized ranking tool hang** - Fixed by replacing internal `/api/geocode` call with direct Google Maps Geocoding API
   - **Root cause**: Calling internal API endpoints from within another API route (`/api/ai-chat`) created circular dependency/SSE streaming conflicts
   - **Solution**: Direct external API calls in tool execution functions
   - **Files modified**: `src/lib/ai-tools.ts` (lines 106-128), `src/app/api/ai-chat/route.ts` (lines 251, 442)
   - **Key learning**: When building AI tools that call external services, avoid routing through internal API endpoints - call external APIs directly

**⏳ Under Investigation (Non-Blocking)**:
See [AIModetodo.md](AIModetodo.md) Phase 3.7 section for current bug tracking:
- Generic sport achievements appearing in some queries - Review basketball data source mapping
- Girls schools query returns only 2 results - Verify database contains additional girls schools or update system prompt

### Debugging Tips
- Check server logs for OpenAI tool calls and responses
- Verify RPC functions return expected data structure
- Test RPCs directly in Supabase SQL editor before integrating
- Use `console.log` in API routes to inspect streaming chunks
- Monitor cache hit/miss rates for performance optimization
- **🆕 Use LangSmith dashboard for comprehensive AI debugging** (see section below)

## LangSmith Observability & Monitoring

**Implementation Status**: ✅ COMPLETED (Phase 3.10 - 2025-10-26)

### Overview
Ask SAI is fully instrumented with LangSmith for production-grade observability. Every OpenAI API call, tool execution, and error is automatically traced with detailed metadata.

### What Gets Traced

#### 1. OpenAI Chat Completions (Automatic)
**File**: [src/lib/openai.ts:20](src/lib/openai.ts#L20)
- Wrapped with `wrapOpenAI()` from `langsmith/wrappers`
- **Captures**: Token usage, latency, model parameters, streaming status
- **Metadata**: Model name (gpt-4o-2024-08-06), temperature (0.1), max_tokens (4000)

#### 2. API Route Handler
**File**: [src/app/api/ai-chat/route.ts:66-117](src/app/api/ai-chat/route.ts#L66-L117)
- Wrapped with `traceable()` decorator
- **Captures**: Session ID, message count, tool call presence
- **Name**: "OpenAI Chat Completion"
- **Type**: `llm`

#### 3. Tool Execution Functions (7 Tools)
**File**: [src/lib/ai-tools.ts](src/lib/ai-tools.ts)

All 7 tools wrapped with `traceable()`:
1. **executeRankSchools** - Tracks: AL score, postal code, primary school, preferences
2. **executeSearchSchoolsBySport** - Tracks: Sport name, gender, track, session ID
3. **executeSearchSchoolsByCCA** - Tracks: CCA name, session ID
4. **executeSearchSchoolsByAcademic** - Tracks: Academic focus, session ID
5. **executeGetSchoolDetails** - Tracks: School identifier, session ID
6. **executeSearchSchoolsByAffiliation** - Tracks: Primary school name
7. **executeRankSchoolsSimple** - Tracks: AL score, postal code, primary school

**Type**: `tool` (for all functions)
**Metadata**: Tool-specific parameters + session correlation

### LangSmith Dashboard Access

**URL**: https://smith.langchain.com
**Project**: School Advisor

**Key Tabs**:
1. **Traces** - Individual conversation traces with full request/response
2. **Sessions** - Grouped by session ID for multi-turn conversations
3. **Runs** - Filter by tool name, model, date range
4. **Analytics** - Token usage charts, latency histograms

### Debugging with LangSmith

#### Finding Slow Requests
1. Go to **Runs** tab
2. Sort by **Latency** (descending)
3. Click on slow trace to see breakdown:
   - OpenAI API time
   - Tool execution time
   - RPC call duration

#### Debugging Tool Failures
1. Go to **Runs** tab
2. Filter by **Status**: Error
3. Click on failed run to see:
   - Tool name that failed
   - Input parameters (AL score, postal code, etc.)
   - Error message and stack trace
   - Session ID for user correlation

#### Tracking Token Usage
1. Go to **Analytics** tab
2. View **Token Usage** chart
3. Filter by:
   - Date range
   - Tool name
   - Model version
4. Identify high-token queries for optimization

#### Investigating Multi-Intent Queries
1. Search by **Session ID** in Runs tab
2. See all tools called in parallel
3. Example: "Tennis AND robotics"
   - Shows 2 separate tool calls
   - Both with same session ID
   - Timing for each tool displayed

#### Monitoring Cache Performance
1. Filter **Runs** by tool name: `executeRankSchools`
2. Check metadata for `cache_hit` field
3. Calculate hit rate: (hits / total calls) * 100
4. Expected: >30% hit rate for common queries (24-hour TTL)

### Trace Metadata Structure

**Request Level**:
```typescript
{
  session_id: string,        // nanoid() - correlates multi-turn conversations
  message_count: number,     // Number of messages in conversation
  has_tool_calls: boolean    // Whether any tool was invoked
}
```

**Tool Level** (example: `executeRankSchools`):
```typescript
{
  tool_name: 'rankSchools',
  al_score: number,          // 4-30
  postal_code: string,       // 6-digit Singapore postal code
  primary_school: string,    // Slugified primary school name
  has_preferences: boolean   // Sports/CCA/culture selected
}
```

**OpenAI Level** (automatic):
```typescript
{
  model: 'gpt-4o-2024-08-06',
  temperature: 0.1,
  max_tokens: 4000,
  prompt_tokens: number,     // Input tokens
  completion_tokens: number, // Output tokens
  total_tokens: number,      // Sum
  latency_ms: number        // Response time
}
```

### Common Debugging Scenarios

#### Scenario 1: User Reports "No Schools Found"
1. Search for session ID in LangSmith
2. Check which tool was called
3. Verify tool parameters (correct AL score range 4-30?)
4. Check RPC response in metadata (empty array?)
5. Test RPC directly in Supabase with same parameters

#### Scenario 2: Slow Response Times
1. Filter Runs by latency >5000ms
2. Identify bottleneck:
   - OpenAI API slow? → Check OpenAI status page
   - Tool execution slow? → Check which RPC function
   - RPC slow? → Optimize database query
3. Compare similar queries for baseline

#### Scenario 3: Tool Selection Errors
1. Find trace in LangSmith
2. Check conversation messages (system prompt + user query)
3. Verify GPT-4 selected correct tool
4. If wrong tool:
   - Review system prompt in [src/lib/ai-prompts.ts](src/lib/ai-prompts.ts)
   - Check if user query pattern needs clarification
   - Add example to system prompt

#### Scenario 4: Token Usage Spike
1. Go to Analytics → Token Usage
2. Identify spike date/time
3. Filter Runs to that period
4. Check:
   - Are system prompts too long?
   - Are tool responses verbose?
   - Is conversation history growing too large?
5. Optimize: Truncate history or compress responses

### Performance Benchmarks

**Expected Latency** (95th percentile):
- Simple queries (sport/CCA search): <2 seconds
- Personalized rankings: <3 seconds (includes geocoding)
- School details: <2.5 seconds (includes enrichment API calls)
- Multi-intent queries: <4 seconds (parallel tool calls)

**Expected Token Usage** (per query):
- System prompt: ~800 tokens
- User query: 10-50 tokens
- Tool response: 500-2000 tokens (varies by result count)
- GPT-4 completion: 200-800 tokens

**Alert Thresholds** (recommended):
- Latency >10 seconds → Investigate bottleneck
- Token usage >5000 per query → Review prompt length
- Error rate >5% → Check RPC health
- Cache hit rate <20% → Review caching strategy

### Production Monitoring Checklist

**Daily**:
- [ ] Check error rate in Analytics tab
- [ ] Review slowest 10 queries in Runs tab
- [ ] Verify token usage within budget

**Weekly**:
- [ ] Analyze tool distribution (which tools most used?)
- [ ] Review failed queries and patterns
- [ ] Check cache performance metrics

**Monthly**:
- [ ] Generate token cost report
- [ ] Identify optimization opportunities
- [ ] Review user query patterns for prompt improvements

### Disabling Tracing (Development)

To disable LangSmith tracing temporarily:

```env
# In .env.local
LANGSMITH_TRACING=false  # Change from true to false
```

Or remove the environment variable entirely. The application will still function without tracing.

## Mobile-First Responsive Design
- Consider mobile-first responsive design for all new components
- Test on iOS and Android devices
- Ensure text is readable on small screens
- Optimize touch targets for mobile (min 44x44px)
