'use client';

import { useState } from 'react';
import Navigation from '@/components/ui/Navigation';
import { sendGAEvent } from '@next/third-parties/google';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // PSLE & Scoring
  {
    id: 'psle-scoring',
    question: 'How does the PSLE scoring system work?',
    answer: 'The PSLE uses Achievement Levels (AL) from 1 to 8, where AL 1 is the highest and AL 8 is the lowest. Your PSLE Score is the sum of your ALs for English, Mathematics, Science, and Mother Tongue, ranging from 4 (best) to 32 (lowest). Lower scores are better - a score of 4 means you got AL 1 in all subjects. For detailed information about PSLE scoring, visit <a href="https://www.moe.gov.sg/microsites/psle-fsbb/psle/main.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">MOE\'s official PSLE information page</a>.',
    category: 'PSLE'
  },
  {
    id: 'cut-off-scores',
    question: 'What are cut-off scores and how do they work?',
    answer: 'Cut-off scores are the lowest PSLE scores accepted by each secondary school. They vary by admission type: IP (Integrated Program), Affiliated (for students from affiliated primary schools), and Open (general admission). Cut-off scores change yearly based on demand and available places.',
    category: 'PSLE'
  },
  {
    id: 'posting-groups',
    question: 'What are Posting Groups (PG1, PG2, PG3)?',
    answer: 'Posting Groups (PG1, PG2, PG3) are administrative categories used for secondary school admissions. PG3 schools typically have the lowest cut-off scores, while PG1 schools have higher cut-off scores. These groupings reflect historical demand patterns, but every school in Singapore offers quality education according to MOE standards.',
    category: 'PSLE'
  },

  // School Types & Programs
  {
    id: 'integrated-program',
    question: 'What is the Integrated Program (IP)?',
    answer: 'The Integrated Program allows students to skip O-Levels and proceed directly to A-Levels or IB. IP students follow a 6-year curriculum (4 years secondary + 2 years pre-university). It\'s designed for academically strong students who want a more flexible, research-oriented education.',
    category: 'School Types'
  },
  {
    id: 'school-affiliations',
    question: 'How do primary school affiliations work?',
    answer: 'Some secondary schools have affiliated primary schools. Students from these primary schools get priority admission with slightly higher cut-off scores than general admission. For example, if a school\'s open cut-off is 8, affiliated students might gain entry with a score of 10.',
    category: 'School Types'
  },
  {
    id: 'school-categories',
    question: 'What are the different types of secondary schools?',
    answer: 'Singapore has Government schools (fully funded by MOE), Government-Aided schools (partially funded, often mission schools), and Independent schools (private funding, higher fees). All provide quality education following the national curriculum, with some variations in culture and additional programs.',
    category: 'School Types'
  },

  // Using School Advisor SG
  {
    id: 'how-to-search',
    question: 'How do I search for schools using School Advisor SG?',
    answer: 'You can search in two ways: 1) Distance-based search on the Home page - enter your postal code and PSLE score to find nearby schools, or 2) School Assistant on the Ranking page - input your preferences for sports, CCAs, and school culture for personalized recommendations.',
    category: 'Using the Platform'
  },
  {
    id: 'comparison-tool',
    question: 'How does the school comparison tool work?',
    answer: 'Select up to 4 schools from search results by clicking the "Add to Compare" button. Then visit the Compare page to see side-by-side comparisons of cut-off scores, sports performance, CCA achievements, and school culture. You can also enter your postal code to see distances from your location.',
    category: 'Using the Platform'
  },
  {
    id: 'sports-data',
    question: 'How is sports performance measured?',
    answer: 'We track schools\' National School Games results from 2022-2024. Schools are rated as "Very Strong," "Strong," or "Fair" based on their Finals and Semifinals appearances across different sports. The data shows actual competition achievements, not subjective ratings.',
    category: 'Using the Platform'
  },
  {
    id: 'cca-tracking',
    question: 'What CCA achievements are tracked?',
    answer: 'We focus on 5 specific academic CCA categories: Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, and National STEM competitions. These represent measurable, competition-based achievements that indicate a school\'s strength in academic CCAs and STEM education.',
    category: 'Using the Platform'
  },

  // School Selection Advice
  {
    id: 'choosing-factors',
    question: 'What factors should I consider when choosing a secondary school?',
    answer: 'Consider: 1) Academic fit (can your child meet the cut-off?), 2) Distance from home, 3) School culture and values alignment, 4) Specific programs (IP, sports, arts), 5) CCA offerings that match your child\'s interests, 6) Peer environment and school community. Academic ranking isn\'t everything - fit matters more. For comprehensive guidance, refer to <a href="https://www.moe.gov.sg/microsites/psle-fsbb/posting-to-secondary-school/choosing-sec-schools.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">MOE\'s official school selection guide</a>.',
    category: 'School Selection'
  },
 
  {
    id: 'school-culture',
    question: 'Why does school culture matter?',
    answer: 'School culture affects your child\'s daily experience, values development, and social environment. Some schools emphasize academic excellence, others focus on holistic development, sports, arts, or religious values. A good cultural fit helps students thrive socially and academically.',
    category: 'School Selection'
  },

  // Technical & Data
  {
    id: 'data-sources',
    question: 'Where does School Advisor SG get its data?',
    answer: 'Our data comes from official MOE sources: school information from MOE website, PSLE cut-off scores from annual postings, sports results from National School Games records (2022-2024), and CCA achievements from competition results. All data is publicly available and regularly updated.',
    category: 'Technical'
  },
  {
    id: 'missing-data',
    question: 'Why do some schools show "data not available"?',
    answer: 'Some schools may not have participated in certain sports or CCA competitions, or their results weren\'t recorded in our tracking period (2022-2024). This doesn\'t mean the school is weak in those areas - they might excel in other activities not measured by our system.',
    category: 'Technical'
  },

  // Additional PSLE AL Score Questions for SEO
  {
    id: 'what-is-al-score',
    question: 'What is an AL Score and how is it different from T-score?',
    answer: 'AL (Achievement Level) Score is the current PSLE scoring system that replaced T-scores in 2021. AL Scores range from 4 to 30, where lower scores are better. Unlike T-scores which compared students against each other, AL Scores measure absolute achievement. AL 1 = 90+ marks, AL 2 = 85-89 marks, etc. Your total AL Score is the sum of your 4 subject ALs.',
    category: 'PSLE'
  },
  {
    id: 'al-score-meaning',
    question: 'What does my AL Score mean for secondary school admission?',
    answer: 'Your AL Score determines which secondary schools you can qualify for. Schools with lower cut-off scores are more academically competitive. For example, top schools may have cut-offs of 4-8, while others may accept scores up to 20-30. Having a lower AL Score gives you more school options.',
    category: 'PSLE'
  },
  {
    id: 'al-score-psle-2025',
    question: 'How do AL Scores work for 2025 secondary school posting?',
    answer: 'For 2025 secondary school admission, your AL Score will be compared against each school\'s cut-off. Cut-offs vary by admission type: IP programs (lowest cut-offs), Affiliated admission (slightly higher), and Open admission (highest). Check our school finder tool to see which schools match your AL Score.',
    category: 'PSLE'
  },
  {
    id: 'secondary-school-psle-score',
    question: 'Which secondary schools can I get into with my PSLE Score?',
    answer: 'The secondary schools you can access depend on your total PSLE AL Score and the school\'s cut-off scores. Use our distance-based search tool by entering your AL Score and location to see nearby schools you qualify for. Consider factors beyond just cut-offs like sports programs, CCAs, and school culture.',
    category: 'School Selection'
  },
  {
    id: 'psle-cutoff-2025',
    question: 'What are the 2025 PSLE cut-off scores for secondary schools?',
    answer: 'Cut-off scores for 2025 are based on 2024 admission data and may vary slightly. Top schools typically have cut-offs of 4-10, while others range from 11-30. Use our comparison tool to see cut-offs for IP, Affiliated, and Open admission across all posting groups (PG1-PG3).',
    category: 'PSLE'
  },
  {
    id: 'secondary-school-comparison',
    question: 'How should I compare secondary schools beyond PSLE cut-offs?',
    answer: 'While PSLE cut-offs indicate academic selectivity, also consider: sports and CCA programs your child enjoys, school culture and values, distance from home, special programs like IP or specialized subjects, and peer environment. Our School Assistant tool helps you evaluate all these factors together.',
    category: 'School Selection'
  },
  {
    id: 'school-affiliation-advantage',
    question: 'How much advantage do primary school affiliations give for AL Scores?',
    answer: 'Primary school affiliations typically provide a 2-4 point advantage in AL Score cut-offs. For example, if a school\'s open cut-off is 8, affiliated students might gain entry with scores up to 10-12. This advantage applies during Phase 2A1 of the posting process, giving affiliated students priority before open admission.',
    category: 'School Types'
  }
];

const categories = ['All', 'PSLE', 'School Types', 'Using the Platform', 'School Selection', 'Technical'];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter FAQs based on search and category
  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Track FAQ expansion for analytics
      sendGAEvent('event', 'faq_expand', {
        question_id: id,
        category: faqData.find(faq => faq.id === id)?.category || 'unknown'
      });
    }
    setExpandedItems(newExpanded);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length > 2) {
      sendGAEvent('event', 'faq_search', {
        search_term: value,
        results_count: filteredFAQs.length
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-display text-gray-900 mb-4">
            PSLE AL Score & Secondary School FAQ
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about PSLE AL Scores, secondary school cut-offs, and finding the right school
            using your child's AL Score. Updated for 2025 admissions.
          </p>
        </div>

        {/* MOE Authority Notice */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Official Information Source
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  For the most up-to-date and official information about Singapore's education system, always refer to the{' '}
                  <a
                    href="https://www.moe.gov.sg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:text-blue-900"
                  >
                    Ministry of Education (MOE) website
                  </a>
                  . This FAQ provides general guidance based on publicly available information, but MOE remains the authoritative source for all education policies and procedures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search FAQs..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-gray-900"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-gray-600 mb-6">
            {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or selecting a different category.
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div key={faq.id} className="card-base">
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full text-left flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-blue text-white">
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-blue transition-colors">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <svg
                      className={`h-5 w-5 text-gray-500 transform transition-transform ${
                        expandedItems.has(faq.id) ? 'rotate-180' : ''
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {expandedItems.has(faq.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <div className="card-base max-w-2xl mx-auto">
            <h3 className="text-title text-gray-900 mb-4">
              Ready to Find Schools with Your AL Score?
            </h3>
            <p className="text-gray-600 mb-6">
              Use our tools to find secondary schools that match your PSLE AL Score. Compare cut-offs, sports programs,
              and school culture to make the best choice for your child's future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="btn-base btn-primary"
              >
                Find Schools by AL Score →
              </a>
              <a
                href="/ranking"
                className="btn-base btn-secondary"
              >
                Advanced School Matching →
              </a>
              <a
                href="/compare"
                className="btn-base btn-outline"
              >
                Compare Schools →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}