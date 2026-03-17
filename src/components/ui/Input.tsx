'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps): React.ReactElement {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-secondary)] font-[family-name:var(--font-body)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5
          bg-[var(--bg-primary)] border
          ${error ? 'border-[var(--status-error)]' : 'border-[var(--border-default)]'}
          text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
          font-[family-name:var(--font-body)]
          focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)]
          transition-all duration-150
          clip-angular-sm
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--status-error)]">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
      )}
    </div>
  );
}
