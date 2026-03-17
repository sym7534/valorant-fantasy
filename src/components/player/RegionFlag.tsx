import React from 'react';
// TEMPORARY — replace with import from @/src/lib/game-config when available
type Region = 'Americas' | 'Pacific' | 'EMEA' | 'China';

interface RegionFlagProps {
  region: Region;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const regionAbbrev: Record<Region, string> = {
  Americas: 'AM',
  Pacific: 'PAC',
  EMEA: 'EU',
  China: 'CN',
};

const regionColors: Record<Region, string> = {
  Americas: '#ff4655',
  Pacific: '#2dd4bf',
  EMEA: '#a78bfa',
  China: '#fbbf24',
};

export default function RegionFlag({
  region,
  size = 'md',
  showLabel = false,
  className = '',
}: RegionFlagProps): React.ReactElement {
  const s = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`${s} rounded-sm flex items-center justify-center font-bold font-[family-name:var(--font-display)]`}
        style={{ backgroundColor: `${regionColors[region]}20`, color: regionColors[region] }}
        title={region}
      >
        {regionAbbrev[region].charAt(0)}
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)]">{region}</span>
      )}
    </div>
  );
}
