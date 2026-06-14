'use client';

import { usePathname } from 'next/navigation';

const TABS = [
  {
    id: 'payments',
    label: 'Payments',
    href: '/',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'summary',
    label: 'Summary',
    href: '/summary',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 5-6" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-2xl mx-auto">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <a
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
