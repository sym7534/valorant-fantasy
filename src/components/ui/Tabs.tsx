'use client';

import React from 'react';

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabsProps): React.ReactElement {
  return (
    <div className={`flex border-b border-[var(--border-subtle)] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`
              px-5 py-3 text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
              transition-all duration-150 relative
              ${isActive
                ? 'text-[var(--accent-red)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }
            `}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
