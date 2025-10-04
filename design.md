# School Advisor SG Design System
**Brand & Style Guide**

*Version 1.0 - Apple-Inspired Design System for Singapore's Premier School Finder*

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Brand Identity](#brand-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Library](#component-library)
7. [Interaction Patterns](#interaction-patterns)
8. [Accessibility Guidelines](#accessibility-guidelines)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Migration Strategy](#migration-strategy)

---

## Design Philosophy

### Apple-Inspired Principles

School Advisor SG follows Apple's design philosophy, emphasizing:

**Clarity**: Every element serves a purpose, with clear hierarchy and minimal visual noise
**Deference**: Design defers to content, letting school data and insights shine
**Depth**: Subtle layers and transitions create intuitive navigation without overwhelming users

### Core Design Values

- **Neutral-First Approach**: Grays and whites dominate, with color used sparingly for meaning
- **Content Priority**: School information takes precedence over decorative elements
- **Professional Trust**: Clean, polished aesthetic builds confidence for Singapore parents
- **Accessibility**: WCAG 2.1 AA compliance ensures inclusivity for all users

### Singapore Education Context

Design considerations specific to Singapore's education system:
- **Data-Dense**: Handle complex school metrics (PSLE scores, cut-offs, sports, CCAs)
- **Mobile-First**: Parents research schools on mobile devices during commutes
- **Trust-Building**: Professional appearance for high-stakes education decisions
- **Culturally Appropriate**: Clean design that appeals to Singapore's multicultural audience

---

## Brand Identity

### School Advisor SG Brand

**Mission**: Empowering Singapore parents with AI-powered school selection insights

**Visual Identity**:
- Clean, professional aesthetic
- Trustworthy and authoritative
- Modern yet approachable
- Technology-forward without being intimidating

### Logo Usage

**Primary Logo**: School Advisor SG wordmark
- Use on light backgrounds
- Maintain clear space equal to the height of "S" in "SG"
- Never distort, rotate, or modify colors

**Favicon Package**:
- Custom School Advisor SG favicon (replacing Vercel default)
- Multiple sizes: 16x16, 32x32, 48x48, 96x96, 192x192
- Apple touch icons: 57x57, 76x76, 120x120, 152x152, 180x180
- Consistent with overall brand identity

### Brand Colors

**Not Brand Colors**: Avoid these outdated elements
- ❌ Pink accents (#ec4899) - being phased out
- ❌ Gradient overlays - replaced with subtle shadows
- ❌ Bright, saturated colors - replaced with neutral palette

---

## Color System

### Primary Palette (Neutral-First)

```css
/* === Core Neutrals === */
--gray-50: #f9fafb;   /* Backgrounds, subtle fills */
--gray-100: #f3f4f6;  /* Card backgrounds, secondary surfaces */
--gray-200: #e5e7eb;  /* Borders, dividers */
--gray-300: #d1d5db;  /* Inactive states, subtle borders */
--gray-400: #9ca3af;  /* Placeholder text, disabled states */
--gray-500: #6b7280;  /* Secondary text */
--gray-600: #4b5563;  /* Primary text on light backgrounds */
--gray-700: #374151;  /* Headings, emphasized text */
--gray-800: #1f2937;  /* High contrast text */
--gray-900: #111827;  /* Maximum contrast text */

/* === Surface Colors === */
--background: #ffffff;      /* Page backgrounds */
--foreground: #1d1d1f;     /* Primary text (Apple-inspired) */
--surface-primary: #ffffff;  /* Card backgrounds */
--surface-secondary: #f9fafb; /* Secondary sections */
--surface-elevated: #ffffff;  /* Elevated cards, modals */
--border-color: #e5e7eb;    /* Default borders */
```

### Semantic Colors (Minimal Usage)

```css
/* === Accent Colors === */
--accent-blue: #007aff;     /* Primary actions, links */
--accent-green: #34c759;    /* Success states, positive metrics */
--accent-orange: #ff9500;   /* Warning states, moderate performance */
--accent-red: #ff3b30;      /* Error states, competitive metrics */

/* === Focus & Interactive === */
--border-focus: #007aff;    /* Focus states */
--selection: rgba(0, 122, 255, 0.2); /* Text selection */
```

### School Performance Colors

```css
/* === Data Visualization === */
--school-excellent: #34c759;  /* Top-tier schools (PSLE 4-8) */
--school-good: #007aff;       /* Good schools (PSLE 9-15) */
--school-average: #ff9500;    /* Average schools (PSLE 16-25) */
--school-competitive: #ff3b30; /* Competitive schools (PSLE 26-30) */

/* === School Type Indicators === */
--school-ip: #8b5cf6;         /* Integrated Program */
--school-affiliated: #06b6d4; /* Primary school affiliations */
--school-boys: #007aff;       /* Boys schools */
--school-girls: #af52de;      /* Girls schools (muted purple, not pink) */
--school-coed: #34c759;       /* Co-educational schools */
```

### Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #000000;
    --foreground: #f5f5f7;
    --surface-primary: #1c1c1e;
    --surface-secondary: #2c2c2e;
    --surface-elevated: #3a3a3c;
    --border-color: #38383a;

    /* Adjust gray scale for dark mode */
    --gray-50: #1c1c1e;
    --gray-100: #2c2c2e;
    --gray-900: #f2f2f7;
  }
}
```

### Color Usage Guidelines

**Do ✅**:
- Use gray as the primary color palette
- Apply color sparingly for meaning (success, warning, error)
- Maintain sufficient contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Use semantic colors consistently across similar contexts
- **CRITICAL**: Ensure text contrast meets WCAG AA standards for readability

**Don't ❌**:
- Use pink accents anywhere in the application
- Apply multiple bright colors in the same interface
- Use color as the only indicator of meaning
- Override semantic color meanings in different contexts
- **NEVER use light gray text on white backgrounds** (fails accessibility)

### ACCESSIBILITY FIX: Text Contrast Standards

**Required Text Colors for White Backgrounds**:
```css
/* === WCAG AA Compliant Text Colors === */
--text-primary: #1d1d1f;     /* Primary headings, important text */
--text-secondary: #374151;   /* Secondary text, descriptions */
--text-muted: #4b5563;       /* Subtle text that must remain readable */
--text-placeholder: #6b7280; /* Form placeholders, minimal text */

/* === FORBIDDEN: These fail WCAG AA === */
/* DO NOT USE: #9ca3af, #d1d5db - too light for body text */
```

**Form Input Requirements**:
```css
/* === Form Text Colors === */
--input-text: #1d1d1f;       /* Input field text */
--input-placeholder: #6b7280; /* Placeholder text */
--select-text: #1d1d1f;       /* Dropdown text */
--table-text: #374151;        /* Table content text */
```

**Search Interface Specific Requirements**:
```css
/* === Search Interface Colors === */
--search-input-bg: #ffffff;     /* White background for input fields */
--search-results-text: #1d1d1f; /* Black text for search results */
--button-text-dark: #1d1d1f;    /* Black text for button labels */
--search-counter-text: #1d1d1f; /* Black text for result counters */
```

**Home Page Search Form Requirements**:
- PSLE score input: White background with dark text
- Primary school dropdown: White background with dark text
- Postal code input: White background with dark text
- Search results text: Must be black (#1d1d1f), not gray
- Compare button text: Must be black (#1d1d1f), not gray
- Result counter text: Must be black for maximum visibility

**Feature Cards Section Requirements (Apple-Inspired)**:
- Main heading: "School Advisor SG" in black (#1d1d1f)
- Secondary text: "Difference" in dark gray (#374151)
- Card titles: All feature card headers in black (#1d1d1f)
- Card descriptions: All feature card body text in black (#1d1d1f)
- Card backgrounds: Pure white (#ffffff) for optimal text contrast
- Card borders: Black outline (#1d1d1f) for clear definition
- Apple-style contrast: High contrast text for maximum readability
- Consistent hierarchy: Clear visual distinction between heading levels

**School Result Cards (Search Results)**:
- Background: Pure white (#ffffff) for consistent readability across all themes
- Border: Black outline (2px solid #1d1d1f) for clear definition and Apple-style contrast
- Text content: All text elements should use high-contrast colors against white background
- School names: Black text (#1d1d1f) for maximum readability
- Badges and labels: Maintain existing color coding but ensure visibility against white
- Hover effects: Maintain subtle lift animation while preserving black border
- Accessibility: WCAG AA compliant contrast ratios for all text elements

**School Profile Pages Design Updates**:
- Hero section: Clean white background (#ffffff) with black school name text (#000000)
- Metric cards: Black text for titles and values (#000000) for maximum contrast
- Sports Excellence section:
  - "Top Performing Sports" heading in black (#000000)
  - Sport descriptions and strength summaries in black (#000000)
  - Competition results in subdued grey (#6b7280) without bold formatting
  - "Show more sports" button: White text on blue background (#007aff)
  - Data coverage and performance summary sections: Grey background (#6b7280) matching cutoff scores section
  - Sport name tags: Green color scheme (#34c759) consistent with "Very Strong" indicators
  - Understanding sports performance: Simple section divider with dark grey text (#374151), no background box
- CCA Excellence section:
  - Achievement category boxes: White background (#ffffff) with black text (#000000) for consistency with Sports section
  - Data coverage and achievement overview: Grey background (#6b7280) sections with white text (#ffffff)
  - Section headings: Bold white text for "Data Coverage" and "Achievement Overview"
  - Achievement statistics: Normal weight white text for content items
  - Achievement name tags: Color scheme matching corresponding number badge colors (green, orange, red)
  - About CCA Categories: Black text (#000000) with border top divider, matching Understanding Sports Performance styling
- School Culture section:
  - Core Culture Themes box: White background (#ffffff) with black text (#000000) and rounded-xl corners
  - School Culture description box: White background (#ffffff) with black text (#000000) and rounded-xl corners
  - Both boxes include hover effects: subtle shadow and border color changes for interactivity
  - About School Culture Information: Black text (#000000) with border top divider, consistent with other "About" sections
- Cut-Off Scores section:
  - Integrated Programme (IP) box: White background (#ffffff) with black text (#000000) and rounded-xl corners
  - Affiliated Students box: White background (#ffffff) with black text (#000000) and rounded-xl corners
  - Open Admission by Posting Group box: White background (#ffffff) with black text (#000000) and rounded-xl corners
  - All content boxes include hover effects: subtle shadow and border color changes for consistency
  - Understanding PSLE Scores: Black text (#000000) with border top divider, matching other "About" sections

**Comparison Page Theme Requirements**:
- Header section: White background (#ffffff) with black text for "School Comparison" and description
- Postal code form: White background with black labels and text for better contrast
- School search section: White background with black text for search labels
- School selector: Black text (#000000) for all text elements against gray backgrounds
  - "School Selection" heading in black for contrast
  - School names in selection cards in black for visibility
  - "Use search bar..." message in black for readability
  - "Schools selected..." status text in black
- Comparison table: Black text (#000000) for headers and content against gray backgrounds
  - "School Comparison" title and description in black
  - "Dimension" column header in black
  - School names (1, 2, 3, 4) in numbered columns in black
  - All row titles/labels (Address, Distance, IP Cut-off, etc.) in black
  - Section headers ("Cut-off Scores", "Sports Performance", "CCA Achievements", "School Culture") in black
  - All data values and content in black for maximum contrast
- Table row hover: Remove hover effects for cleaner appearance
- Badge visibility: "Strong" tags use green shade (#34c759) for visibility on white backgrounds
- Comparison notes: Black text (#000000) for all content in bottom section
  - Section title "Comparison Notes" in black
  - All subsection headings in black
  - All explanatory text in black for optimal readability
- Mixed theme approach: Light header section with dark comparison interface

**Ranking Page (AI Assistant) Theme Requirements**:
- Hero section: White background (#ffffff) with black text for "School Assistant" header and description
- Form sections: Dark theme with proper contrast hierarchy
  - Main form background: Dark gray (#1f2937) for overall container
  - Form cards: Medium dark gray (#374151) with dark gray borders (#4b5563)
  - Main section headings: White text (#ffffff) for "1. Basic Information" and "2. Tell Us What's Important"
  - Form labels: White text (#ffffff) for input labels (PSLE Score, Gender Preference, etc.)
  - Subsection containers: Dark gray (#374151) backgrounds with dark borders (#4b5563)
  - Subsection labels: Black text (#000000) for "Sports Interests", "CCA Interests", "School Culture"
  - Error messages: Red text (#f87171) for validation errors
  - Selected chips/tags: White text (#ffffff) on dark gray background (#4b5563)
  - Input fields: White background (#ffffff) with dark text (#1d1d1f) for optimal readability
- Results section: Dark theme with enhanced readability
  - Main results background: Dark gray (#1f2937) for consistency with form sections
  - AI Summary: Dark gray (#374151) background with white headings and light gray content
  - Recommendations Summary: Blended background (#1f2937) with bold black heading and normal black text
  - Section break: Gray border (#4b5563) for visual separation
  - Section headings: Black text (#000000) for "Your Top 6 School Matches" and "Other Schools to Consider"
  - School cards (1-6): White background with black text for optimal content readability
  - School cards (7-10): Gray background with white text and white circle numbers with black text
- Typography hierarchy: Bold headings with normal content text for optimal readability
- Mixed theme approach: Consistent dark theme with strategic white areas for content consumption

---

## Typography

### Font Stack

**Primary Font**: Geist Sans (SF Pro-inspired)
```css
font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

**Monospace Font**: Geist Mono (for code, data display)
```css
font-family: var(--font-geist-mono), 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
```

### Typography Scale

```css
/* === Font Sizes === */
--font-size-xs: 0.75rem;     /* 12px - Captions, secondary info */
--font-size-sm: 0.875rem;    /* 14px - Body text, labels */
--font-size-base: 1rem;      /* 16px - Primary body text */
--font-size-lg: 1.125rem;    /* 18px - Emphasized body text */
--font-size-xl: 1.25rem;     /* 20px - Small headings */
--font-size-2xl: 1.5rem;     /* 24px - Section headings */
--font-size-3xl: 1.875rem;   /* 30px - Page headings */
--font-size-4xl: 2.25rem;    /* 36px - Hero headings */

/* === Font Weights === */
--font-weight-normal: 400;    /* Body text */
--font-weight-medium: 500;    /* Emphasized text, labels */
--font-weight-semibold: 600;  /* Headings, buttons */
--font-weight-bold: 700;      /* Major headings, emphasis */

/* === Line Heights === */
--line-height-tight: 1.25;   /* Headings, compact text */
--line-height-normal: 1.5;   /* Body text, comfortable reading */
--line-height-relaxed: 1.75; /* Long-form content */
```

### Typography Classes

```css
/* === Heading Hierarchy === */
.text-display {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.025em;
}

.text-headline {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.015em;
}

.text-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
}

.text-body {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
}

.text-caption {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--gray-600);
}
```

### Typography Usage Guidelines

**Do ✅**:
- Use established hierarchy consistently
- Maintain comfortable line heights for readability
- Apply negative letter spacing to large headings
- Ensure sufficient color contrast for text

**Don't ❌**:
- Mix multiple font families in the same interface
- Use more than 3-4 font sizes on a single page
- Apply decorative or script fonts
- Use all caps for extended text

---

## Spacing & Layout

### 8px Grid System

All spacing follows an 8px grid for consistency and harmony:

```css
/* === Spacing Scale === */
--space-1: 0.25rem;   /* 4px - Micro spacing */
--space-2: 0.5rem;    /* 8px - Small gaps */
--space-3: 0.75rem;   /* 12px - Text spacing */
--space-4: 1rem;      /* 16px - Standard spacing */
--space-5: 1.25rem;   /* 20px - Medium gaps */
--space-6: 1.5rem;    /* 24px - Section spacing */
--space-8: 2rem;      /* 32px - Large gaps */
--space-10: 2.5rem;   /* 40px - Major sections */
--space-12: 3rem;     /* 48px - Page sections */
--space-16: 4rem;     /* 64px - Hero sections */
```

### Layout Patterns

**Container Widths**:
```css
.container-sm { max-width: 640px; }   /* Mobile content */
.container-md { max-width: 768px; }   /* Tablet content */
.container-lg { max-width: 1024px; }  /* Desktop content */
.container-xl { max-width: 1280px; }  /* Large desktop */
.container-2xl { max-width: 1536px; } /* Extra large screens */
```

**Grid Systems**:
```css
.grid-1 { grid-template-columns: 1fr; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

/* Responsive variations */
.grid-responsive-2 {
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .grid-responsive-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Border Radius System

```css
/* === Radius Scale === */
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.375rem;  /* 6px - Buttons, inputs */
--radius-lg: 0.5rem;    /* 8px - Cards, panels */
--radius-xl: 0.75rem;   /* 12px - Large cards */
--radius-2xl: 1rem;     /* 16px - Hero sections */
```

### Shadow System

```css
/* === Shadow Hierarchy === */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

### Layout Guidelines

**Do ✅**:
- Use 8px increments for all spacing
- Maintain consistent vertical rhythm
- Create clear visual hierarchy with spacing
- Use generous whitespace for clarity

**Don't ❌**:
- Use arbitrary spacing values
- Crowd interface elements
- Ignore responsive behavior
- Mix different spacing systems

---

## Component Library

### Button Components

#### Primary Button
```css
.btn-primary {
  background: var(--accent-blue);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  min-height: 44px; /* Touch-friendly */
  transition: all var(--transition-normal);
}

.btn-primary:hover {
  background: #0056cc;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: var(--surface-secondary);
  color: var(--foreground);
  border: 1px solid var(--border-color);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  min-height: 44px;
  transition: all var(--transition-normal);
}

.btn-secondary:hover {
  background: var(--gray-100);
  border-color: var(--gray-300);
}
```

#### Tertiary Button
```css
.btn-tertiary {
  background: transparent;
  color: var(--accent-blue);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  min-height: 44px;
  transition: all var(--transition-normal);
}

.btn-tertiary:hover {
  background: rgba(0, 122, 255, 0.1);
}
```

### Card Components

#### Base Card
```css
.card-base {
  background: var(--surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}
```

#### Interactive Card
```css
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--gray-300);
  cursor: pointer;
}
```

#### School Card (Specialized)
```css
.school-card {
  @apply card-base card-interactive;
  display: grid;
  gap: var(--space-4);
  grid-template-rows: auto 1fr auto;
}

.school-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.school-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.school-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-color);
}
```

### Badge Components

#### Base Badge
```css
.badge-base {
  display: inline-flex;
  align-items: center;
  font-weight: var(--font-weight-medium);
  border-radius: 9999px;
  border: 1px solid transparent;
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-3);
}
```

#### Badge Variants
```css
.badge-school-type {
  background: var(--gray-100);
  color: var(--gray-700);
  border-color: var(--gray-200);
}

.badge-performance-excellent {
  background: var(--school-excellent);
  color: white;
}

.badge-performance-good {
  background: var(--school-good);
  color: white;
}

.badge-performance-average {
  background: var(--school-average);
  color: white;
}

.badge-performance-competitive {
  background: var(--school-competitive);
  color: white;
}
```

### Navigation Components

#### Header Navigation
```css
.nav-header {
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-4) 0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-list {
  display: flex;
  gap: var(--space-6);
  align-items: center;
}

.nav-link {
  font-weight: var(--font-weight-medium);
  color: var(--gray-600);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.nav-link:hover {
  color: var(--accent-blue);
  background: rgba(0, 122, 255, 0.1);
}

.nav-link.active {
  color: var(--accent-blue);
  background: rgba(0, 122, 255, 0.1);
}
```

### Form Components

#### Input Fields
```css
.input-base {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--surface-primary);
  color: var(--foreground);
  font-size: var(--font-size-base);
  transition: all var(--transition-normal);
  min-height: 44px; /* Touch-friendly */
}

.input-base:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

.input-base::placeholder {
  color: var(--gray-400);
}
```

#### Select Dropdowns
```css
.select-base {
  @apply input-base;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right var(--space-3) center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: var(--space-10);
  appearance: none;
}
```

### Loading States

#### Skeleton Loading
```css
.loading-skeleton {
  background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-text { height: 1rem; }
.loading-title { height: 1.5rem; }
.loading-button { height: 2.75rem; }
.loading-card { height: 12rem; }
```

---

## Interaction Patterns

### Hover States

**Subtle Elevation**:
```css
.hover-lift {
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**Background Color Change**:
```css
.hover-bg {
  transition: background-color var(--transition-normal);
}

.hover-bg:hover {
  background-color: var(--gray-50);
}
```

### Focus States

**Consistent Focus Ring**:
```css
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  border-color: var(--border-focus);
}
```

### Transition System

```css
/* === Transition Timing === */
--transition-fast: 0.15s ease-out;     /* Quick feedback */
--transition-normal: 0.2s ease-out;    /* Standard interactions */
--transition-slow: 0.3s ease-out;      /* Page transitions */

/* === Apple-Inspired Easing === */
--ease-apple: cubic-bezier(0.25, 0.1, 0.25, 1); /* Smooth, natural feeling */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounce */
```

### Active States

**Button Press Feedback**:
```css
.btn-active:active {
  transform: translateY(1px);
  box-shadow: var(--shadow-sm);
}
```

### Microinteractions

**Checkbox Animation**:
```css
.checkbox {
  position: relative;
  cursor: pointer;
}

.checkbox input {
  opacity: 0;
  position: absolute;
}

.checkbox-visual {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal);
}

.checkbox input:checked + .checkbox-visual {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
}

.checkbox input:checked + .checkbox-visual::after {
  content: '✓';
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
}
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

**Color Contrast Requirements**:
- Normal text: 4.5:1 minimum contrast ratio
- Large text (18pt+): 3:1 minimum contrast ratio
- Interactive elements: 3:1 minimum contrast ratio

**Tested Color Combinations**:
```css
/* ✅ WCAG AA Compliant */
color: var(--gray-900); background: var(--gray-50);   /* 15.3:1 */
color: var(--gray-800); background: var(--gray-100);  /* 12.6:1 */
color: var(--gray-700); background: var(--gray-100);  /* 8.9:1 */
color: var(--gray-600); background: var(--surface-primary); /* 7.2:1 */

/* ❌ Fails WCAG AA */
color: var(--gray-400); background: var(--surface-primary); /* 2.8:1 */
```

### Keyboard Navigation

**Focus Management**:
```css
.focusable {
  &:focus-visible {
    outline: 2px solid var(--accent-blue);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
}
```

**Tab Order**:
- Logical progression through content
- Skip links for navigation
- Modal focus trapping

### Screen Reader Support

**Semantic HTML**:
```html
<!-- ✅ Good: Proper heading hierarchy -->
<h1>School Profile</h1>
<h2>Academic Performance</h2>
<h3>PSLE Cut-off Scores</h3>

<!-- ✅ Good: Descriptive labels -->
<label for="psle-score">PSLE Score (4-30, lower is better)</label>
<input id="psle-score" type="number" min="4" max="30" />

<!-- ✅ Good: ARIA labels for complex UI -->
<button aria-label="Add Raffles Institution to comparison">
  <span aria-hidden="true">+</span>
</button>
```

### Touch Targets

**Minimum Size**: 44px × 44px for all interactive elements
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-3);
}
```

### Motion & Animation

**Respect Reduced Motion**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Guidelines

### File Organization

```
src/
├── styles/
│   ├── globals.css           # Design system variables & base styles
│   └── design-system.css     # Legacy styles (being phased out)
├── components/
│   ├── ui/                   # Base design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Input.tsx
│   ├── school/               # School-specific components
│   ├── comparison/           # Comparison-specific components
│   └── search/               # Search-specific components
```

### Component Development

**New Component Checklist**:
- [ ] Uses design system CSS variables
- [ ] Follows naming conventions
- [ ] Implements proper TypeScript interfaces
- [ ] Includes accessibility attributes
- [ ] Supports keyboard navigation
- [ ] Has focus states defined
- [ ] Responsive across all screen sizes
- [ ] Uses semantic HTML elements
- [ ] Includes loading states if async
- [ ] Has error states defined

**Example Component Structure**:
```tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles using design system
  'btn-base focus-ring',
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        tertiary: 'btn-tertiary',
      },
      size: {
        sm: 'text-sm px-3 py-2',
        md: 'text-base px-4 py-3',
        lg: 'text-lg px-6 py-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
}

export const Button = ({
  children,
  variant,
  size,
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="loading-spinner" aria-hidden="true" />
          <span className="sr-only">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
```

### CSS Variable Usage

**Correct Implementation**:
```css
/* ✅ Use design system variables */
.custom-component {
  background: var(--surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  color: var(--foreground);
  box-shadow: var(--shadow-sm);
}

/* ❌ Avoid hardcoded values */
.bad-component {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  color: #1d1d1f;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
```

### Responsive Design

**Mobile-First Approach**:
```css
/* ✅ Mobile-first, progressive enhancement */
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Performance Considerations

**Optimize CSS Loading**:
```tsx
// Critical CSS in globals.css
// Component-specific styles in modules
// Design system variables loaded first

// ✅ Good: Minimal critical CSS
import '@/styles/globals.css';

// ✅ Good: Component-specific imports
import styles from './Component.module.css';
```

---

## Migration Strategy

### Phase Out Legacy Styles

**Priority 1: Remove Pink Accents**
```css
/* ❌ Replace these immediately */
.legacy-pink {
  color: #ec4899;
  background: #ec4899;
  border-color: #ec4899;
}

/* ✅ Replace with neutral equivalents */
.modern-neutral {
  color: var(--accent-blue);
  background: var(--accent-blue);
  border-color: var(--accent-blue);
}
```

**Priority 2: Consolidate Design Systems**
- Replace `design-system.css` classes with `globals.css` equivalents
- Update component imports to use new class names
- Remove duplicate CSS variable definitions

**Priority 3: Update Component Library**
```tsx
// ❌ Old approach with hardcoded styles
<button className="bg-pink-600 text-white hover:bg-pink-700">
  Click me
</button>

// ✅ New approach with design system
<Button variant="primary">
  Click me
</Button>
```

### Migration Checklist

**Global Changes**:
- [ ] Remove all pink color references (#ec4899, bg-pink-*, text-pink-*)
- [ ] Replace with neutral gray equivalents
- [ ] Update hover states to use design system colors
- [ ] Consolidate CSS variable definitions
- [ ] Remove redundant style files

**Component Updates**:
- [ ] Button components: Remove pink variants, add neutral variants
- [ ] Card components: Standardize shadows and border radius
- [ ] Badge components: Update color scheme for school types
- [ ] Navigation: Remove pink hover states, add blue accents
- [ ] Form inputs: Standardize focus states with blue accent

**Page-Level Updates**:
- [ ] Home page: Remove pink accents from search interface
- [ ] Ranking page: Update AI assistant styling
- [ ] School profiles: Standardize card layouts and colors
- [ ] Comparison page: Reduce color overload, focus on data
- [ ] FAQ page: Apply consistent typography and spacing

### Testing Strategy

**Visual Regression Testing**:
- Compare before/after screenshots
- Test across different screen sizes
- Validate color contrast ratios
- Ensure accessibility compliance

**Browser Compatibility**:
- Test CSS variable support (IE11+ required)
- Validate custom properties in all target browsers
- Check focus states across different browsers
- Test responsive behavior on actual devices

---

## Brand Guidelines Summary

### ✅ Do's
- Use neutral grays as the primary color palette
- Apply the 8px spacing grid consistently
- Implement subtle shadows and transitions
- Maintain WCAG 2.1 AA contrast compliance
- Use semantic HTML and proper ARIA labels
- Follow mobile-first responsive design
- Apply consistent typography hierarchy
- Use color sparingly for meaning
- Implement smooth, Apple-inspired interactions
- Maintain 44px minimum touch targets

### ❌ Don'ts
- Use pink accents anywhere in the interface
- Apply multiple bright colors in the same view
- Ignore the spacing system with arbitrary values
- Override semantic color meanings
- Use color as the only indicator of information
- Create inaccessible color combinations
- Mix different font families
- Use decorative or script fonts
- Implement jarring animations or transitions
- Ignore mobile responsiveness

---

## Version History

**Version 1.0** - Initial Apple-inspired design system
- Established neutral-first color palette
- Defined typography and spacing systems
- Created comprehensive component library
- Documented accessibility guidelines
- Provided migration strategy from legacy pink-based system

---

*This design system serves as the definitive guide for all School Advisor SG interface development. For questions or clarifications, refer to the Apple Human Interface Guidelines and Material Design principles for additional context.*