'use client';

import React from 'react';
import Badge from '@/src/components/ui/Badge';
import RoleIcon, { RoleDisplay } from './RoleIcon';
import RegionFlag, { regionBgTint } from './RegionFlag';
import type {
  PlayerDesignation,
  PlayerMatchStats,
  PlayerRole,
  Region,
} from '@/src/lib/game-config';

type CardVariant = 'full' | 'medium' | 'compact';

type PlayerCardPlayer = {
  id: string;
  name: string;
  team: string;
  region: Region;
  roles: PlayerRole[];
  imageUrl?: string | null;
};

interface PlayerCardProps {
  player: PlayerCardPlayer;
  variant?: CardVariant;
  designation?: PlayerDesignation;
  stats?: PlayerMatchStats;
  fantasyPoints?: number;
  isActive?: boolean;
  starCooldownWeeksLeft?: number;
  actionLabel?: string;
  onAction?: () => void;
  isDrafted?: boolean;
  className?: string;
}

export function CrownIcon({ size = 14 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent-gold)]">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}

export function StarIcon({ size = 14 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent-gold)]">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function DesignationBadge({ designation }: { designation: PlayerDesignation }): React.ReactElement | null {
  if (designation === 'captain') {
    return (
      <span title="Captain (2x points)" className="inline-flex items-center">
        <CrownIcon size={16} />
      </span>
    );
  }

  if (designation === 'star') {
    return (
      <span title="Star Player (3x points)" className="inline-flex items-center animate-pulse-glow">
        <StarIcon size={16} />
      </span>
    );
  }

  return null;
}

function FullCard({
  player,
  designation = 'normal',
  stats,
  fantasyPoints,
}: {
  player: PlayerCardPlayer;
  designation: PlayerDesignation;
  stats?: PlayerMatchStats;
  fantasyPoints?: number;
}): React.ReactElement {
  const borderGlow =
    designation === 'captain' || designation === 'star'
      ? 'border-[rgba(245,197,66,0.3)]'
      : 'border-[var(--border-default)]';

  const glowClass =
    designation === 'captain'
      ? 'glow-gold'
      : designation === 'star'
        ? 'animate-pulse-glow'
        : fantasyPoints && fantasyPoints > 150
          ? 'glow-red'
          : '';

  return (
    <div
      className={`
        relative w-[200px] h-[350px] bg-[var(--bg-secondary)] border ${borderGlow}
        clip-angular-lg overflow-hidden flex flex-col
        transition-all duration-300 hover:scale-[1.02] hover:glow-red-strong
        ${glowClass}
      `}
    >
      <div
        className="relative flex-1 bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-secondary)] flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${regionBgTint[player.region]}, var(--bg-secondary))` }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="w-24 h-32 bg-[var(--bg-accent)] clip-angular opacity-40" />
        <div className="absolute top-3 right-3">
          <DesignationBadge designation={designation} />
        </div>
        <div className="absolute top-3 left-3">
          <RegionFlag region={player.region} size="sm" />
        </div>
      </div>

      <div className="p-4 space-y-2">
        <RoleDisplay roles={player.roles} size="sm" />
        <h3 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wide text-[var(--text-primary)] leading-tight truncate">
          {player.name}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] truncate">{player.team}</p>

        {stats && (
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--border-subtle)]">
            <div className="text-center">
              <p className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-red)]">
                {stats.kills}
              </p>
              <p className="text-[9px] text-[var(--text-muted)] uppercase">K</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--text-secondary)]">
                {stats.deaths}
              </p>
              <p className="text-[9px] text-[var(--text-muted)] uppercase">D</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-teal)]">
                {stats.assists}
              </p>
              <p className="text-[9px] text-[var(--text-muted)] uppercase">A</p>
            </div>
          </div>
        )}

        {fantasyPoints !== undefined && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">PTS</span>
            <span className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
              {fantasyPoints.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MediumCard({
  player,
  designation = 'normal',
  fantasyPoints,
  actionLabel,
  onAction,
  isDrafted,
}: {
  player: PlayerCardPlayer;
  designation: PlayerDesignation;
  fantasyPoints?: number;
  actionLabel?: string;
  onAction?: () => void;
  isDrafted?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 border border-[var(--border-default)]
        clip-angular-sm w-full max-w-[340px] h-[80px]
        transition-all duration-150 hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-red)]
        ${isDrafted ? 'opacity-40 pointer-events-none' : ''}
      `}
      style={{ backgroundColor: regionBgTint[player.region] }}
    >
      <div className="w-12 h-12 bg-[var(--bg-tertiary)] clip-angular-sm flex items-center justify-center shrink-0">
        <RoleIcon role={player.roles[0]} size="md" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold font-[family-name:var(--font-display)] text-sm uppercase tracking-wide text-[var(--text-primary)] truncate">
            {player.name}
          </h4>
          <DesignationBadge designation={designation} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--text-secondary)] truncate">{player.team}</span>
          <RegionFlag region={player.region} size="sm" />
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {fantasyPoints !== undefined && (
          <span className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
            {fantasyPoints.toFixed(1)}
          </span>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-3 py-1.5 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
              bg-[var(--accent-red)] text-[var(--text-on-accent)] clip-angular-sm
              hover:bg-[var(--accent-red-hover)] transition-all duration-150"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function CompactCard({
  player,
  designation = 'normal',
  fantasyPoints,
  actionLabel,
  onAction,
  isDrafted,
  starCooldownWeeksLeft,
}: {
  player: PlayerCardPlayer;
  designation: PlayerDesignation;
  fantasyPoints?: number;
  actionLabel?: string;
  onAction?: () => void;
  isDrafted?: boolean;
  starCooldownWeeksLeft?: number;
}): React.ReactElement {
  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 border-b border-[var(--border-subtle)]
        w-full h-12
        transition-all duration-150 hover:bg-[var(--bg-tertiary)]
        ${isDrafted ? 'opacity-40 pointer-events-none' : ''}
      `}
      style={{ backgroundColor: regionBgTint[player.region] }}
    >
      <RoleIcon role={player.roles[0]} size="sm" />
      <RegionFlag region={player.region} size="sm" />

      <span className="font-semibold font-[family-name:var(--font-display)] text-sm uppercase tracking-wide text-[var(--text-primary)] truncate flex-1">
        {player.name}
      </span>

      <span className="text-xs text-[var(--text-muted)] truncate w-16">{player.team}</span>

      <DesignationBadge designation={designation} />

      {starCooldownWeeksLeft !== undefined && starCooldownWeeksLeft > 0 && (
        <Badge variant="muted" size="sm">CD {starCooldownWeeksLeft}w</Badge>
      )}

      {fantasyPoints !== undefined && (
        <span className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)] w-14 text-right">
          {fantasyPoints.toFixed(1)}
        </span>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-2.5 py-1 text-[10px] font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
            bg-[var(--accent-red)] text-[var(--text-on-accent)] clip-angular-sm
            hover:bg-[var(--accent-red-hover)] transition-all duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function PlayerCard({
  player,
  variant = 'compact',
  designation = 'normal',
  stats,
  fantasyPoints,
  isActive,
  starCooldownWeeksLeft,
  actionLabel,
  onAction,
  isDrafted = false,
  className = '',
}: PlayerCardProps): React.ReactElement {
  void isActive;

  return (
    <div className={className}>
      {variant === 'full' && (
        <FullCard
          player={player}
          designation={designation}
          stats={stats}
          fantasyPoints={fantasyPoints}
        />
      )}
      {variant === 'medium' && (
        <MediumCard
          player={player}
          designation={designation}
          fantasyPoints={fantasyPoints}
          actionLabel={actionLabel}
          onAction={onAction}
          isDrafted={isDrafted}
        />
      )}
      {variant === 'compact' && (
        <CompactCard
          player={player}
          designation={designation}
          fantasyPoints={fantasyPoints}
          actionLabel={actionLabel}
          onAction={onAction}
          isDrafted={isDrafted}
          starCooldownWeeksLeft={starCooldownWeeksLeft}
        />
      )}
    </div>
  );
}
