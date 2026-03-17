'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select...',
  className = '',
}: DropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={ref}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)] font-[family-name:var(--font-body)]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2.5 text-left
            bg-[var(--bg-primary)] border border-[var(--border-default)]
            text-[var(--text-primary)] font-[family-name:var(--font-body)] text-sm
            clip-angular-sm
            hover:border-[var(--accent-red)] transition-all duration-150
            flex items-center justify-between gap-2
          `}
        >
          <span className={selectedOption ? '' : 'text-[var(--text-muted)]'}>
            {selectedOption?.label || placeholder}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular-sm overflow-hidden animate-fade-in-down">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  hover:bg-[var(--bg-tertiary)] transition-colors duration-100
                  ${option.value === value ? 'text-[var(--accent-red)] bg-[var(--bg-tertiary)]' : 'text-[var(--text-primary)]'}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
