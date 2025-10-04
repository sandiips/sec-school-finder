# SEC School Finder - Technical Specification

## Project Overview

**Project Name**: SEC School Finder
**Repository**: sec-school-finder
**Branch**: schoolcards
**Type**: Next.js Web Application
**Purpose**: AI-powered platform for finding and ranking secondary schools in Singapore

## Technology Stack

### Frontend
- **Framework**: Next.js 15.4.2 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Data Fetching**: SWR 2.3.4
- **Analytics**: Google Analytics (via @next/third-parties)

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js API Routes
- **External APIs**: Google Maps Geocoding API
- **Client Library**: @supabase/supabase-js 2.52.0

### Development Tools
- **Package Manager**: npm
- **CSS**: PostCSS with Tailwind CSS
- **Build**: Next.js built-in build system

## Project Structure

```
sec-school-finder/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── explain/            # Sports/CCA analysis endpoint
│   │   │   ├── feedback/           # User feedback collection
│   │   │   ├── geocode/            # Postal code to coordinates
│   │   │   ├── options/            # Configuration options
│   │   │   ├── primaries/          # Primary school data
│   │   │   ├── rank/               # AI-powered school ranking
│   │   │   └── search/             # Distance-based school search
│   │   ├── ranking/                # Advanced school matching page
│   │   ├── layout.tsx              # Root layout component
│   │   └── page.tsx                # Home page (distance search)
│   ├── components/
│   │   └── FeedbackWidget.tsx     # User feedback modal
│   └── lib/
│       ├── supabaseClient.ts       # Client-side Supabase instance
│       └── supabaseAdmin.ts        # Server-side Supabase instance
├── backend/                        # Python ETL scripts
├── supabase/                       # Database schemas and RPC functions
├── public/                         # Static assets
└── [config files]
```

## Core Components

### 1. Home Page (`src/app/page.tsx`)

**Purpose**: Distance-based school search interface

**Key Features**:
- PSLE score input (4-30 range)
- Primary school selection (dropdown with 189+ schools)
- Postal code input for distance calculation
- Results display with school cards showing:
  - School name and address
  - Distance from home
  - Affiliation status (affiliated/non-affiliated)
  - Posting group or IP track
  - Cut-off scores

**API Calls**:
- `/api/primaries` - Fetch primary school list
- `/api/geocode` - Convert postal code to coordinates
- `/api/search` - Get distance-sorted school results

**Data Flow**:
1. User submits form (PSLE, primary school, postal code)
2. Geocode postal code to lat/lng coordinates
3. Call search API with parameters
4. Display results sorted by distance
5. Auto-scroll to results section

### 2. Ranking Page (`src/app/ranking/page.tsx`)

**Purpose**: Advanced AI-powered school matching with multi-criteria preferences

**Key Features**:
- Basic information form (PSLE, gender preference, postal, primary school)
- Importance rating system (Low/Medium/High) for:
  - Distance
  - Sports performance
  - CCA achievements
  - School culture
- Multi-select dropdowns for:
  - Sports interests (19+ options)
  - CCA interests (5+ academic categories)
  - Culture traits (15+ values)
- AI-generated explanations for each school match
- Top 6 school recommendations with detailed analysis
- Additional schools (7-10) for consideration

**UI Components**:
- Custom `MultiSelect` component with search functionality
- `SingleSelect` component for primary school selection
- `Importance` rating component (3-button selector)
- Responsive layout: centered form → 2-column grid after results
- Mobile-optimized horizontal scrolling for school details

**API Calls**:
- `/api/geocode` - Postal code conversion
- `/api/rank` - Weighted school ranking
- `/api/explain` - Sports/CCA performance analysis

**Data Processing**:
- Sports performance highlighting with regex matching
- Culture trait extraction and display
- CCA achievement summaries
- Distance-based filtering (10km max radius)

### 3. Feedback Widget (`src/components/FeedbackWidget.tsx`)

**Purpose**: User feedback collection system

**Features**:
- Floating feedback button (bottom-right)
- Modal with rating system (1-5 scale)
- Category selection (Bug/Confusing/Idea/Other)
- Text feedback with optional email
- Context capture (viewport, timezone, user agent, current page)
- Toast notifications for success/failure

**API Integration**: `/api/feedback` endpoint

## API Routes

### 1. Search API (`src/app/api/search/route.ts`)

**Endpoint**: `GET /api/search`

**Parameters**:
- `score`: PSLE score (number)
- `primary`: Primary school slug (string)
- `lat`: Latitude (number)
- `lng`: Longitude (number)
- `maxDistanceKm`: Maximum distance in km (default: 5)

**Database Function**: `rank_schools` RPC

**Logic**:
- Distance-first ranking (weight_dist: 1, others: 0)
- Gender-agnostic filtering
- Affiliation consideration based on primary school
- Returns schools within distance limit sorted by proximity

### 2. Rank API (`src/app/api/rank/route.ts`)

**Endpoint**: `POST /api/rank`

**Request Body**:
```typescript
{
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
```

**Database Function**: `rank_schools1` RPC

**Weight Mapping**:
- High: 0.4
- Medium: 0.2
- Low: 0.0

**Logic**:
- Multi-criteria ranking with weighted preferences
- Primary school slug generation and matching
- Affiliation-aware cut-off score analysis
- Composite scoring algorithm

### 3. Explain API (`src/app/api/explain/route.ts`)

**Endpoint**: `POST /api/explain`

**Purpose**: Generate detailed explanations for school sports/CCA performance

**Request Body**:
```typescript
{
  schools: Array<{code: string; name?: string}>;
  sports_selected?: string[];
  ccas_selected?: string[];
  inYear?: number;
  debug?: boolean;
}
```

**Data Sources**:
- `school_sport_results` table (3-year window: 2022-2024)
- `school_cca_details` table
- `school_cca_scores` table
- `school_culture_summaries` table

**Processing Logic**:
- Sports performance aggregation by stage (Finals/Semifinals/3rd-4th/Quarterfinals)
- Strength calculation (very strong/strong/fair strength)
- Natural language generation with explicit sport naming
- CCA achievement analysis from competition results
- Culture summary integration (120-word limit)

**Output Format**:
```typescript
{
  overall: string;
  per_school: Array<{
    code: string;
    explanation: string;
    culture_short: string;
    cca_explanation: string;
  }>;
}
```

### 4. Geocode API (`src/app/api/geocode/route.ts`)

**Endpoint**: `GET /api/geocode`

**Parameters**:
- `pincode`: Singapore postal code (6 digits)

**External API**: Google Maps Geocoding API

**Logic**:
- Validates postal code format
- Calls Google Maps API for coordinate conversion
- Returns latitude and longitude for distance calculations

### 5. Other APIs

**Primaries API** (`/api/primaries`): Returns list of primary schools for dropdown selection

**Feedback API** (`/api/feedback`): Stores user feedback with context information

**Options API** (`/api/options`): Configuration options for sports/CCA/culture lists

## Database Schema and RPC Functions

### Key Tables
- `secondary_with_affiliations`: School master data with affiliation information
- `school_sport_results`: Sports performance data from National School Games
- `school_cca_details`: CCA competition results and achievements
- `school_cca_scores`: Aggregated CCA performance scores
- `school_culture_summaries`: AI-generated school culture analysis

### RPC Functions

#### `rank_schools` (Distance-focused)
**Purpose**: Distance-first school ranking for home page

**Parameters**:
- `user_score`: PSLE score
- `user_lat`/`user_lng`: User coordinates
- `gender_pref`: Gender preference
- `max_distance_km`: Distance filter
- `user_primary`: Primary school for affiliation

**Logic**:
- Haversine distance calculation
- Gender filtering
- Affiliation detection
- COP (Cut-off Point) analysis with track-specific logic

#### `rank_schools1` (Multi-criteria)
**Purpose**: Advanced ranking with weighted preferences

**Additional Parameters**:
- `sports_selected`/`ccas_selected`/`culture_selected`: User preferences
- `weight_dist`/`weight_sport`/`weight_cca`/`weight_culture`: Importance weights
- `primary_slug`: Slugified primary school name

**Logic**:
- Composite scoring algorithm
- Sports/CCA/culture matching against user selections
- Weighted ranking based on user preferences
- Track and posting group analysis

## Data Flow Architecture

### User Journey 1: Quick Distance Search
1. **Input**: PSLE score, primary school, postal code
2. **Geocoding**: Postal code → lat/lng coordinates
3. **Database Query**: Distance-based ranking via `rank_schools` RPC
4. **Output**: Schools sorted by distance with basic information

### User Journey 2: Advanced AI Matching
1. **Input**: Basic info + importance ratings + preference selections
2. **Geocoding**: Postal code conversion
3. **Ranking**: Multi-criteria scoring via `rank_schools1` RPC
4. **Analysis**: Sports/CCA performance analysis via explain API
5. **Output**: Top 6 schools with detailed AI explanations

### Data Processing Pipeline
1. **ETL Scripts** (backend/): Python scripts for data ingestion
2. **Supabase Storage**: PostgreSQL with custom RPC functions
3. **API Layer**: Next.js API routes for data access
4. **Frontend**: React components with SWR for caching

## State Management

### Client-Side State
- **React Hooks**: useState for form inputs and UI state
- **SWR**: Data fetching with automatic caching and revalidation
- **Local State**: Form validation, modal visibility, loading states

### Data Persistence
- **Supabase**: Primary data storage
- **Session Storage**: User preferences (not implemented)
- **Analytics**: Google Analytics for user behavior tracking

## Environment Variables

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-side)
GOOGLE_MAPS_API_KEY=              # Google Maps API key for geocoding
```

## Performance Considerations

### Optimization Strategies
- **SWR Caching**: Automatic data caching and background updates
- **Image Optimization**: Next.js Image component with priority loading
- **Code Splitting**: Automatic route-based code splitting
- **Database Indexing**: Optimized queries via RPC functions

### Responsive Design
- **Mobile-First**: Tailwind CSS with responsive breakpoints
- **Horizontal Scrolling**: Mobile-optimized school detail cards
- **Sticky Navigation**: Fixed header for easy navigation

## Security Considerations

### Data Protection
- **Environment Variables**: Sensitive keys stored securely
- **API Validation**: Input validation on all endpoints
- **Supabase RLS**: Row-level security (if implemented)
- **CORS**: Proper cross-origin resource sharing configuration

### User Privacy
- **Optional Email**: Feedback collection with optional contact info
- **Analytics**: Google Analytics for usage tracking
- **No User Accounts**: Stateless application design

## Deployment Architecture

### Frontend Deployment
- **Platform**: Likely Vercel (Next.js optimized)
- **Build**: `npm run build`
- **Environment**: Production environment variables

### Database Hosting
- **Platform**: Supabase (managed PostgreSQL)
- **Scaling**: Automatic scaling with Supabase
- **Backups**: Managed by Supabase

## Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint validation
```

### Code Organization
- **TypeScript**: Strict type checking enabled
- **Component Structure**: Functional components with hooks
- **API Design**: RESTful endpoints with proper HTTP methods
- **Error Handling**: Comprehensive error handling and user feedback

This technical specification provides a comprehensive overview of the SEC School Finder application architecture, data flow, and implementation details for technical teams working on the project.