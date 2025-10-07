# SEO Optimization Action Items

## Phase 1: SEO Enhancements (Complete First)

### 1. Global SEO Foundation
- [ ] **1.1** Update root layout.tsx metadata with target keywords
  - Add "psle score", "al score", "psle al score", "secondary school psle score" to keywords
  - Enhance title and description for broader keyword coverage
  - Update OpenGraph tags for better social sharing

### 2. Homepage SEO Enhancement (/src/app/page.tsx)
- [ ] **2.1** Optimize page metadata for PSLE/AL score keywords
- [ ] **2.2** Add structured data (JSON-LD) for Singapore education tool
- [ ] **2.3** Add educational section about PSLE AL system
- [ ] **2.4** Add internal CTAs linking to ranking tool
- [ ] **2.5** Add breadcrumb navigation component

### 3. Ranking Page SEO Enhancement (/src/app/ranking/page.tsx)
- [ ] **3.1** Update metadata with "Find Secondary Schools by PSLE AL Score"
- [ ] **3.2** Add educational tooltips explaining AL score system
- [ ] **3.3** Add breadcrumb navigation
- [ ] **3.4** Enhance existing CTAs with better copy
- [ ] **3.5** Add structured data for education tool

### 4. FAQ Page Enhancement (/src/app/faq/page.tsx)
- [ ] **4.1** Expand FAQ with 10+ PSLE AL score questions
- [ ] **4.2** Add questions targeting "what is al score", "how AL scores work"
- [ ] **4.3** Include 2025 cut-off information
- [ ] **4.4** Add school affiliation explanations
- [ ] **4.5** Optimize metadata for FAQ-related keywords
- [ ] **4.6** Add internal links to ranking and compare tools

### 5. Compare Page SEO Enhancement (/src/app/compare/page.tsx)
- [ ] **5.1** Optimize metadata for "secondary school comparison" keywords
- [ ] **5.2** Add educational sidebar explaining comparison metrics
- [ ] **5.3** Enhance cut-off score descriptions
- [ ] **5.4** Add CTAs to ranking tool

### 6. Internal Linking Strategy
- [ ] **6.1** Add contextual links between homepage and ranking
- [ ] **6.2** Link FAQ entries to relevant tools
- [ ] **6.3** Add "Learn More" links from compare to FAQ
- [ ] **6.4** Create cross-references between all pages

### 7. Technical SEO
- [ ] **7.1** Add canonical URLs to all pages
- [ ] **7.2** Verify sitemap includes all optimized pages
- [ ] **7.3** Test page speed impact
- [ ] **7.4** Validate structured data markup

## Phase 2: Android Mobile Font Fixes (Complete After SEO)

### 8. Compare Page Font Color Fixes
- [ ] **8.1** Fix ComparisonSelector school names to WHITE on Android mobile
  - File: /src/components/comparison/ComparisonSelector.tsx:54
  - Add CSS class: compare-selected-school-name

- [ ] **8.2** Verify cut-off labels are BLACK on Android mobile
  - File: /src/components/comparison/ComparisonTable.tsx
  - Check lines 110, 126, 142 (IP Cut-off, Affiliated Cut-off, Open PG3)
  - Verify existing CSS classes work: compare-cutoff-*-title

- [ ] **8.3** Update android-mobile.css with new classes
  - Add rule for .compare-selected-school-name { color: #ffffff !important; }
  - Verify existing cut-off title rules are correct

## Target Keywords Priority
1. **Primary:** "psle score", "al score", "psle al score"
2. **Secondary:** "secondary school psle score", "al score psle", "secondary school"
3. **Long-tail:** "what is al score", "psle cut-off 2025", "secondary school comparison"

## Success Metrics
- All pages have optimized meta titles/descriptions with target keywords
- Structured data implemented on key pages
- Internal linking connects all pages strategically
- Educational content added without disrupting existing functionality
- Android mobile font colors fixed per specifications

## Notes
- Preserve existing design and functionality
- Focus on enhancing, not replacing content
- Test each change on local server before proceeding
- Validate SEO changes before moving to mobile fixes