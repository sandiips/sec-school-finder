# School Advisor SG 🏫

An AI-powered platform to help students and parents find the perfect secondary school in Singapore. Make informed decisions based on PSLE scores, school proximity, sports achievements, CCA offerings, and school culture.

## 🌟 Features

### 🎯 Quick Distance Search
Find schools near your home using Singapore postal codes:
- **PSLE Score Matching**: Enter your PSLE score (4-30) to see eligible schools
- **Primary School Affiliations**: Automatic affiliation detection for bonus points
- **Distance-Based Results**: Schools sorted by proximity to your home
- **Cut-off Analysis**: See historical cut-off points for different tracks

### 🤖 AI School Assistant (Premium Feature)
Advanced school matching with personalized insights:
- **Multi-Criteria Matching**: Rank importance of distance, sports, CCAs, and school culture
- **Sports Performance Analysis**: Based on National School Games results (2022-2024)
- **CCA Achievement Insights**: Competition results and academic olympiad performance
- **School Culture Matching**: AI-generated culture summaries from school values and mission statements
- **Top 6 Recommendations**: Detailed explanations for each school match

## 🎓 What Makes This Different

### Comprehensive Data Sources
- **Sports Data**: National School Games performance across 19+ sports
- **CCA Information**: Academic competitions, olympiads, and specialized programs
- **School Culture**: AI-analyzed summaries of school values and character development
- **Affiliation Logic**: Smart detection of primary-secondary school connections

### Intelligent Matching
- **Weighted Preferences**: Customize what matters most to your family
- **Real Performance Data**: 3-year historical analysis of school achievements
- **Personalized Explanations**: AI-generated insights for why each school fits your criteria
- **Distance Optimization**: Haversine formula for accurate distance calculations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sandiips/sec-school-finder.git
   cd sec-school-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

### Frontend
- **Next.js 15.4.2** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **SWR** - Data fetching with caching

### Backend
- **Supabase** - PostgreSQL database with real-time capabilities
- **Custom RPC Functions** - Advanced ranking algorithms
- **Google Maps API** - Geocoding for postal codes

### Key Technologies
- **AI Analysis**: Custom algorithms for sports/CCA performance analysis
- **Responsive Design**: Mobile-first approach with horizontal scrolling
- **Real-time Data**: Live updates with SWR caching

## 📊 Data Sources

### Sports Performance
- National School Games results (2022-2024)
- Track performance across Finals, Semifinals, and Quarterfinals
- 19+ sports including Badminton, Basketball, Swimming, etc.

### CCA Achievements
- Academic olympiads (Math, Chemistry, Physics)
- Robotics and STEM competitions
- Arts and cultural programs
- Leadership and service learning

### School Information
- Official MOE school data
- Cut-off point analysis (COP)
- Primary school affiliations
- School culture and values analysis

## 🎯 How It Works

### Distance Search (Home Page)
1. Enter your PSLE score, primary school, and postal code
2. System calculates distances to all secondary schools
3. Filters schools based on eligibility and affiliation
4. Returns schools sorted by proximity with cut-off information

### AI Assistant (Ranking Page)
1. Complete detailed preferences form
2. AI analyzes your priorities (sports, CCAs, culture, distance)
3. Matches schools based on actual performance data
4. Generates personalized explanations for top recommendations
5. Provides additional schools for consideration

## 📱 User Experience

### Responsive Design
- **Mobile-optimized**: Horizontal scrolling for detailed school information
- **Progressive Enhancement**: Works on all device sizes
- **Accessibility**: Keyboard navigation and screen reader support

### Interactive Features
- **Multi-select Components**: Easy selection of sports and CCAs
- **Importance Ratings**: Simple Low/Medium/High preference system
- **Real-time Validation**: Instant feedback on form inputs
- **Smart Autocomplete**: Searchable dropdowns for school selection

## 🔒 Privacy & Security

- **No User Accounts Required**: Completely stateless application
- **Optional Feedback**: Contact information only if you want updates
- **Secure API Access**: Environment variables for sensitive data
- **GDPR Compliant**: Minimal data collection with clear purposes

## 🛠️ Development

### Project Structure
```
src/
├── app/
│   ├── api/           # API endpoints
│   ├── ranking/       # AI Assistant page
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/        # Reusable components
└── lib/              # Utility functions
```

### Key Commands
```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Production server
npm run lint          # Code linting
```

### API Endpoints
- `GET /api/search` - Distance-based school search
- `POST /api/rank` - AI-powered school ranking
- `POST /api/explain` - Sports/CCA performance analysis
- `GET /api/geocode` - Postal code to coordinates
- `POST /api/feedback` - User feedback collection

## 📈 Performance

### Optimization Features
- **Automatic Caching**: SWR handles data caching and background updates
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Route-based automatic code splitting
- **Database Optimization**: Custom RPC functions for complex queries

### Scalability
- **Supabase Backend**: Managed PostgreSQL with automatic scaling
- **Vercel Deployment**: Edge network for global performance
- **Efficient Queries**: Optimized database indexes and query patterns

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and conventions
- Pull request process
- Issue reporting
- Feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♀️ Support

### Getting Help
- **Technical Issues**: Check the [technical specification](./baseline_spec.md)
- **Data Questions**: Review our data sources documentation
- **Feature Requests**: Use the in-app feedback widget

### Contact
- **Email**: Contact through the feedback widget
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

---

**School Advisor SG** - Making secondary school selection in Singapore more informed, data-driven, and personalized.

Built with ❤️ for Singapore students and families.
