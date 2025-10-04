import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = (destination: string, linkText: string) => {
    sendGAEvent('event', 'navigation_click', {
      destination_page: destination,
      link_text: linkText,
      source_page: pathname,
      is_mobile: false
    });
  };

  const handleMobileNavClick = (destination: string, linkText: string) => {
    sendGAEvent('event', 'navigation_click', {
      destination_page: destination,
      link_text: linkText,
      source_page: pathname,
      is_mobile: true
    });
  };

  // Apple-inspired navigation styling using design system variables
  const navLinkBase = "px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-out min-h-[44px] flex items-center";
  const navLinkActive = "text-white shadow-md" + " " + "btn-primary";
  const navLinkInactive = "text-gray-600 hover:text-blue-600 hover:bg-blue-50";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo wrapped in a Link */}
          <Link
            href="/"
            className="flex items-center"
            onClick={() => handleNavClick('/', 'Logo')}
          >
            <Image
              src="/logo.svg"
              alt="School Advisor SG"
              width={160}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>
          <nav className="ml-4 flex items-center gap-1">
            <Link
              href="/"
              className={`${navLinkBase} ${
                isActive('/') ? navLinkActive : navLinkInactive
              }`}
              onClick={() => handleNavClick('/', 'Home')}
            >
              Home
            </Link>
            <Link
              href="/ranking"
              className={`${navLinkBase} ${
                isActive('/ranking') ? navLinkActive : navLinkInactive
              }`}
              onClick={() => handleNavClick('/ranking', 'School Assistant')}
            >
              School Assistant
            </Link>
            <Link
              href="/compare"
              className={`${navLinkBase} ${
                isActive('/compare') ? navLinkActive : navLinkInactive
              }`}
              onClick={() => handleNavClick('/compare', 'Compare')}
            >
              Compare
            </Link>
            <Link
              href="/faq"
              className={`${navLinkBase} ${
                isActive('/faq') ? navLinkActive : navLinkInactive
              }`}
              onClick={() => handleNavClick('/faq', 'FAQ')}
            >
              FAQ
            </Link>
          </nav>
        </div>

        {/* Additional Navigation Items */}
        <div className="flex items-center gap-2">
          {/* Search Icon for mobile */}
          <Link
            href="/"
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Search Schools"
            onClick={() => handleMobileNavClick('/', 'Search Icon')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </Link>

          {/* Comparison Icon for mobile */}
          <Link
            href="/compare"
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Compare Schools"
            onClick={() => handleMobileNavClick('/compare', 'Compare Icon')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </Link>

          {/* FAQ Icon for mobile */}
          <Link
            href="/faq"
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="FAQ"
            onClick={() => handleMobileNavClick('/faq', 'FAQ Icon')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}