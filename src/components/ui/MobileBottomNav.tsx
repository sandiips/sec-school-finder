'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Layers, HelpCircle, BarChart3 } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: <Home size={24} /> },
  { href: '/ask-sai', label: 'Ask SAI', icon: <MessageCircle size={24} /> },
  { href: '/compare', label: 'Compare', icon: <Layers size={24} /> },
  { href: '/ranking', label: 'Assistant', icon: <BarChart3 size={24} /> },
  { href: '/faq', label: 'FAQ', icon: <HelpCircle size={24} /> },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-sm:block hidden bg-white/95 backdrop-blur-md rounded-t-2xl border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex justify-around items-center h-24 px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors duration-300 ease-out ${
                active
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <div className="flex items-center justify-center">{item.icon}</div>
              <span className="text-xs font-medium mt-1 text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
