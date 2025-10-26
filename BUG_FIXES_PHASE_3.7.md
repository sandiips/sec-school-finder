# Phase 3.7: Bug Fixes & Testing Issues Action Plan

**Status**: 🐛 Critical bugs identified during user testing - action plan created
**Last Updated**: 2025-10-12
**Priority**: HIGH - Blocking production deployment

---

## 📊 Testing Results Summary

### Test 1: Sport Search (Basketball) ❌ FAILED
- **Query**: "Which schools are best for basketball?"
- **Expected**: Detailed explanations like "In Basketball, very strong in Boys with 5 Finals participations..."
- **Actual**: Generic achievements shown ("Bronze and Gold medals", "Very Strong in Basketball (Boys, C Division)")
- **Root Cause**: `/api/explain` endpoint not being called or enrichment not working
- **Impact**: Sport search results lack actionable detail
- **Screenshot**: Screenshot 8.43.46

---

### Test 2: School Details Lookup ❌ FAILED
- **Query**: "Tell me about Raffles Institution"
- **Expected**: Comprehensive profile for "Raffles Institution"
- **Actual**: "I couldn't find a school matching 'Raffles Institution'"
- **Root Cause**: `ai_get_school_details` RPC uses fuzzy search (`ILIKE %name%`) which may not match exact names, OR the tool is passing the wrong identifier format
- **Impact**: Users cannot get information about specific schools

---

### Test 3: Girls Schools Query ❌ PARTIALLY FAILED
- **Query**: "Top 5 girls schools"
- **Expected**: Top 5 girls schools
- **Actual**: Only 2 results (Raffles Girls' School, Methodist Girls' School)
- **Root Cause**: Database may only have 2 girls schools with complete data, OR RPC filtering is too restrictive
- **Impact**: Limited results for gender-specific queries

---

### Test 4: Personalized Recommendations ✅ PASSED
- **Query**: "AL 10, postal 560123, Rosyth School"
- **Result**: Working correctly
- **Status**: No issues

---

### Test 5: MOE Information ✅ PASSED
- **Query**: "What is the DSA process?"
- **Result**: Correct response with MOE links
- **Status**: No issues

---

### Test 6: Multi-Intent Query (Tennis + Robotics) ❌ FAILED (CRITICAL)
- **Query**: "Which schools are best for tennis AND robotics?"
- **Expected**: Schools good at both tennis and robotics
- **Actual**: Response stops abruptly
- **Error Logs**:
  ```
  Tool execution error: SyntaxError: Unexpected non-whitespace character after JSON at position 24
  ai_rank_schools error: column reference "result_count" is ambiguous
  Tool execution error: Error: School ranking failed
  ```
- **Root Cause #1**: JSON parsing error in streaming tool response
- **Root Cause #2**: Database error in `ai_rank_schools` RPC (ambiguous column name)
- **Impact**: Multi-intent queries completely broken, personalized recommendations may also fail

---

## 🔧 Action Plan - Bug Fixes by Priority

### **Priority 1: CRITICAL ERRORS** 🚨 (Blocking all functionality)

#### Bug 1.1: Fix `ai_rank_schools` RPC - Ambiguous Column Error
**Severity**: CRITICAL
**File**: `supabase/ai_rank_schools.sql`
**Error**: `column reference "result_count" is ambiguous`
**Root Cause**: Multiple CTEs or subqueries have columns named `result_count`, causing PostgreSQL to be unable to determine which one to use.

**Action Steps**:
1. Read the `ai_rank_schools.sql` file
2. Search for all instances of `result_count` column
3. Alias CTEs properly to avoid ambiguity (e.g., `cte1.result_count`, `cte2.result_count`)
4. Test the RPC with a sample query:
   ```sql
   SELECT * FROM ai_rank_schools(
     10,                    -- user_score
     1.3521,               -- user_lat
     103.8198,             -- user_lng
     'Any',                -- gender_pref
     ARRAY['Basketball']::text[],  -- sports_selected
     ARRAY[]::text[],      -- ccas_selected
     ARRAY[]::text[],      -- culture_selected
     30,                   -- max_distance_km
     0.4, 0.2, 0.1, 0.1,   -- weights
     6,                    -- limit_count
     'rosyth-school',      -- primary_slug
     'test-session-123'    -- ai_session_id
   );
   ```
5. Deploy fixed version to Supabase

**Expected Fix**: Personalized recommendations and multi-intent queries should work after this fix.

---

#### Bug 1.2: Fix JSON Parsing Error in Streaming Tool Response
**Severity**: CRITICAL
**File**: `src/app/api/ai-chat/route.ts` (Line 157)
**Error**: `SyntaxError: Unexpected non-whitespace character after JSON at position 24`
**Root Cause**: Tool arguments are being streamed in chunks, and JSON.parse() is being called on incomplete JSON strings.

**Action Steps**:
1. Review the streaming logic in `src/app/api/ai-chat/route.ts` around line 157
2. Ensure `toolCallBuffer` accumulates complete JSON before parsing
3. Add validation to check if JSON is complete before calling `JSON.parse()`
4. Add try-catch with better error logging to debug incomplete JSON issues
5. Consider using a streaming JSON parser or buffer accumulation strategy

**Example Fix**:
```typescript
// Before
const toolArgs = JSON.parse(toolCallBuffer);

// After
const toolArgs = (() => {
  try {
    // Trim whitespace and validate
    const trimmed = toolCallBuffer.trim();
    if (!trimmed || trimmed[0] !== '{' || trimmed[trimmed.length - 1] !== '}') {
      throw new Error('Incomplete JSON buffer');
    }
    return JSON.parse(trimmed);
  } catch (error) {
    console.error('JSON Parse Error:', {
      error: error.message,
      buffer: toolCallBuffer,
      bufferLength: toolCallBuffer.length
    });
    throw error;
  }
})();
```

---

### **Priority 2: FUNCTIONALITY BUGS** ⚠️ (Major features not working)

#### Bug 2.1: Fix Sport Search - No Detailed Explanations
**Severity**: HIGH
**Files**: `src/lib/ai-tools.ts` (Lines 445-516)
**Issue**: Basketball search shows generic achievements instead of detailed explanations from `/api/explain`

**Root Cause Analysis Needed**:
1. Check if `fetchSportExplanations()` is being called
2. Check if `/api/explain` response is returning data
3. Check if `sport_explanation` and `sport_one_liner` fields are being populated
4. Check if the dynamic import of `/api/explain` route is working correctly

**Action Steps**:
1. Add console.log() statements in `executeSearchSchoolsBySport` to trace execution:
   ```typescript
   console.log('[DEBUG] Schools for explain:', schoolsForExplain);
   const explanations = await fetchSportExplanations({ ... });
   console.log('[DEBUG] Explanations received:', explanations);
   console.log('[DEBUG] Enriched schools:', schools);
   ```
2. Log the response from `fetchSportExplanations()`
3. Verify the `/api/explain` endpoint is accessible via dynamic import
4. Check if the enrichment step is actually updating the school objects
5. Test with basketball query and check server logs

**Debug Test**:
- Query: "Which schools are best for basketball?"
- Expected in logs: `Sport explanations: Map { '1234' => { explanation: '...', one_liner: '...' } }`
- If Map is empty, the issue is in `fetchSportExplanations()`
- If Map has data but school objects don't, the issue is in the merge step

---

#### Bug 2.2: Fix School Details Lookup - "School Not Found"
**Severity**: HIGH
**Files**:
- `src/lib/ai-tools.ts` (Lines 775-867) - `executeGetSchoolDetails`
- `supabase/ai_get_school_details_FIXED.sql` - RPC function

**Issue**: Searching for "Raffles Institution" returns "school not found"

**Root Cause Hypotheses**:
1. **Hypothesis A**: `ai_get_school_details` RPC uses `ILIKE %name%` but school name mismatch (e.g., "Raffles Institution (Secondary)" vs "Raffles Institution")
2. **Hypothesis B**: The RPC expects `school_identifier` as text but GPT-4 is passing it incorrectly
3. **Hypothesis C**: Database has different naming conventions

**Action Steps**:
1. Test RPC directly in Supabase:
   ```sql
   SELECT * FROM ai_get_school_details('Raffles Institution');
   SELECT * FROM ai_get_school_details('Raffles');
   SELECT * FROM ai_get_school_details('%Raffles%');
   ```
2. Check what GPT-4 is passing to the tool (log `params.school_identifier`)
3. Query `secondary_with_affiliations` table to see exact school names:
   ```sql
   SELECT code, name FROM secondary_with_affiliations
   WHERE name ILIKE '%Raffles%';
   ```
4. If name mismatch, update RPC to be more flexible or update system prompt to guide GPT-4

**Potential Fixes**:
- **Option A**: Update RPC to use better fuzzy matching (Levenshtein distance, full-text search)
- **Option B**: Update system prompt to tell GPT-4 to use partial names (e.g., "Raffles" instead of "Raffles Institution")
- **Option C**: Add a name normalization function to strip common suffixes like "(Secondary)", "School", etc.

---

#### Bug 2.3: Fix Girls Schools Query - Only 2 Results
**Severity**: MEDIUM
**Files**:
- `src/lib/ai-tools.ts` (Lines 499-545) - `executeSearchSchoolsByAcademic`
- `supabase/ai_search_schools_by_academic_FIXED.sql` - RPC function

**Issue**: Query "top 5 girls schools" only returns 2 schools

**Root Cause Hypotheses**:
1. **Hypothesis A**: Database only has 2 all-girls secondary schools in Singapore (this may be accurate!)
2. **Hypothesis B**: RPC filtering logic is too restrictive (e.g., filtering out schools with incomplete COP data)
3. **Hypothesis C**: Gender field in database uses inconsistent values ('Girls' vs 'All-Girls' vs 'Female')

**Action Steps**:
1. Query database directly to check how many girls schools exist:
   ```sql
   SELECT code, name, gender, cop_ranges
   FROM secondary_with_affiliations
   WHERE gender = 'Girls' OR gender ILIKE '%girls%';
   ```
2. Check if RPC has any additional filters that might be excluding schools
3. Test RPC directly:
   ```sql
   SELECT * FROM ai_search_schools_by_academic('Overall', 'Girls', 'Any', 10, 'asc');
   ```
4. If database truly only has 2 all-girls schools, update system prompt to inform GPT-4 about this limitation

**Potential Fixes**:
- **Option A**: If database is accurate, have GPT-4 clarify to users that Singapore only has 2-3 all-girls secondary schools
- **Option B**: If filtering is too restrictive, relax RPC constraints (e.g., allow schools with null COP data)
- **Option C**: If gender field is inconsistent, normalize in RPC query

---

## 🧪 Testing Checklist (After Fixes)

**Must Pass All Tests Before Deployment**:

- [ ] **Test 1**: Sport query "Which schools are best for basketball?"
  - [ ] Verify detailed explanations appear (not generic "Gold medal")
  - [ ] Verify strength ratings are shown ("Very Strong", "Strong")
  - [ ] Verify division details appear ("Boys, A Division")

- [ ] **Test 2**: School lookup "Tell me about Raffles Institution"
  - [ ] Verify school profile is retrieved
  - [ ] Verify comprehensive summary appears (academic, sports, CCAs, culture)
  - [ ] Verify no "school not found" errors

- [ ] **Test 3**: Academic query "Top 5 girls schools"
  - [ ] Verify results are returned (even if only 2 schools)
  - [ ] Verify GPT-4 explains if fewer than 5 results available
  - [ ] Verify sorted by competitiveness (COP scores)

- [ ] **Test 4**: Personalized query "AL 10, postal 560123, Rosyth School"
  - [ ] Verify rankSchools tool is called
  - [ ] Verify no RPC errors ("ambiguous column" fixed)
  - [ ] Verify results include affiliation bonuses

- [ ] **Test 5**: MOE information "What is the DSA process?"
  - [ ] Verify no tool is called
  - [ ] Verify MOE links appear in response
  - [ ] Re-test to ensure still working

- [ ] **Test 6**: Multi-intent "Which schools are best for tennis AND robotics?"
  - [ ] Verify no JSON parsing errors
  - [ ] Verify no abrupt stops
  - [ ] Verify GPT-4 combines results intelligently

---

## 📋 Implementation Order

### Week 1 - Critical Fixes
1. **Day 1**: Fix `ai_rank_schools` RPC ambiguous column error (Bug 1.1)
2. **Day 2**: Fix JSON parsing error in streaming (Bug 1.2)
3. **Day 3**: Test personalized queries and multi-intent queries

### Week 2 - Functionality Fixes
4. **Day 4**: Fix sport search detailed explanations (Bug 2.1)
5. **Day 5**: Fix school details lookup (Bug 2.2)
6. **Day 6**: Investigate girls schools query (Bug 2.3)

### Week 3 - Final Testing
7. **Day 7**: Run full test suite (all 6 tests)
8. **Day 8**: Performance testing and optimization
9. **Day 9**: Documentation and deployment preparation

---

## 🔍 Debugging Tools & Commands

### Supabase SQL Testing
```sql
-- Test ai_rank_schools directly
SELECT * FROM ai_rank_schools(
  10,                    -- user_score
  1.3521,               -- user_lat
  103.8198,             -- user_lng
  'Any',                -- gender_pref
  ARRAY['Basketball']::text[],  -- sports_selected
  ARRAY[]::text[],      -- ccas_selected
  ARRAY[]::text[],      -- culture_selected
  30,                   -- max_distance_km
  0.4, 0.2, 0.1, 0.1,   -- weights
  6,                    -- limit_count
  'rosyth-school',      -- primary_slug
  'test-session-123'    -- ai_session_id
);

-- Test ai_get_school_details
SELECT * FROM ai_get_school_details('Raffles Institution');
SELECT * FROM ai_get_school_details('Raffles');

-- Test ai_search_schools_by_academic
SELECT * FROM ai_search_schools_by_academic('Overall', 'Girls', 'Any', 10, 'asc');

-- Check database for girls schools
SELECT code, name, gender, cop_ranges
FROM secondary_with_affiliations
WHERE gender ILIKE '%girls%' OR gender = 'Girls';

-- Check exact school names in database
SELECT code, name FROM secondary_with_affiliations
WHERE name ILIKE '%Raffles%';
```

### Frontend Debugging
```typescript
// Add to executeSearchSchoolsBySport
console.log('[DEBUG] Calling fetchSportExplanations with:', schoolsForExplain);
const explanations = await fetchSportExplanations({ ... });
console.log('[DEBUG] Explanations received:', explanations);
console.log('[DEBUG] Enriched schools:', schools);

// Add to executeGetSchoolDetails
console.log('[DEBUG] School identifier:', params.school_identifier);
console.log('[DEBUG] RPC returned:', school);
console.log('[DEBUG] Sports explanations:', sportsExplanations);

// Add to streaming parser
console.log('[DEBUG] toolCallBuffer:', toolCallBuffer);
console.log('[DEBUG] toolCallBuffer length:', toolCallBuffer.length);
console.log('[DEBUG] First char:', toolCallBuffer[0], 'Last char:', toolCallBuffer[toolCallBuffer.length - 1]);
```

---

## 🚀 Next Steps

### IMMEDIATE ACTION REQUIRED 🚨

1. **Start with Bug 1.1** (ai_rank_schools RPC error) - This is blocking everything
2. **Then fix Bug 1.2** (JSON parsing error) - This is causing abrupt stops
3. **Then move to Priority 2 bugs** - Sport search and school details

### User Testing Protocol

- After each bug fix, re-run the specific test to verify it's resolved
- Do NOT move to next bug until current one is confirmed fixed
- Document any new issues discovered during testing
- Update this document with test results

---

**End of Bug Fixes Action Plan**
