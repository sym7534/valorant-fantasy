'use client';

import React from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function Select({
  options,
  value,
  onChange,
  label,
  placeholder,
  className = '',
}: SelectProps): React.ReactElement {
  const selectId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--text-secondary)] font-[family-name:var(--font-body)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full px-4 py-2.5 appearance-none cursor-pointer
            bg-[var(--bg-primary)] border border-[var(--border-default)]
            text-[var(--text-primary)] font-[family-name:var(--font-body)]
            focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)]
            transition-all duration-150
            clip-angular-sm
            pr-10
          "
        >
          {placeholder && (
            <option value="" disabled className="text-[var(--text-muted)]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[var(--bg-primary)]">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
