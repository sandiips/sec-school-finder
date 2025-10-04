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

  const handleNavClick = (destination: string, linkText: string, isMobile: boolean = false) => {
    sendGAEvent('event', 'navigation_click', {
      destination_page: destination,
      link_text: linkText,
      source_page: pathname,
      is_mobile: isMobile
    });
  };

  // Desktop navigation styling
  const navLinkBase = "px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-out min-h-[44px] flex items-center";
  const navLinkActive = "text-white shadow-md" + " " + "btn-primary";
  const navLinkInactive = "text-gray-600 hover:text-blue-600 hover:bg-blue-50";

  // Mobile navigation styling - smaller and more compact
  const mobileNavLinkBase = "px-2 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center";
  const mobileNavLinkActive = "bg-pink-500 text-white";
  const mobileNavLinkInactive = "text-gray-700 hover:bg-gray-100";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center flex-shrink-0"
          onClick={() => handleNavClick('/', 'Logo')}
        >
          <Image
            src="/logo.svg"
            alt="School Advisor SG"
            width={160}
            height={40}
            priority
            className="h-8 sm:h-10 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1 ml-4">
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

        {/* Mobile Navigation - Direct Links */}
        <nav className="flex sm:hidden items-center gap-1 ml-2">
          <Link
            href="/"
            className={`${mobileNavLinkBase} ${
              isActive('/') ? mobileNavLinkActive : mobileNavLinkInactive
            }`}
            onClick={() => handleNavClick('/', 'Home', true)}
          >
            Home
          </Link>
          <Link
            href="/ranking"
            className={`${mobileNavLinkBase} ${
              isActive('/ranking') ? mobileNavLinkActive : mobileNavLinkInactive
            }`}
            onClick={() => handleNavClick('/ranking', 'School Assistant', true)}
          >
            Assistant
          </Link>
          <Link
            href="/compare"
            className={`${mobileNavLinkBase} ${
              isActive('/compare') ? mobileNavLinkActive : mobileNavLinkInactive
            }`}
            onClick={() => handleNavClick('/compare', 'Compare', true)}
          >
            Compare
          </Link>
          <Link
            href="/faq"
            className={`${mobileNavLinkBase} ${
              isActive('/faq') ? mobileNavLinkActive : mobileNavLinkInactive
            }`}
            onClick={() => handleNavClick('/faq', 'FAQ', true)}
          >
            FAQ
          </Link>
        </nav>

      </div>
    </header>
  );
}