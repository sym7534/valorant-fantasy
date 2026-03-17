'use client';

import React, { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard';
import Input from '@/src/components/ui/Input';
// TEMPORARY types
import type { Player, PlayerRole, Region } from '@/src/lib/mock-data';

interface PlayerListProps {
  players: Player[];
  onPlayerAction?: (playerId: string) => void;
  actionLabel?: string;
  draftedPlayerIds?: string[];
  showFilters?: boolean;
  maxHeight?: string;
  className?: string;
}

const ROLES: PlayerRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
const REGIONS: Region[] = ['Americas', 'Pacific', 'EMEA', 'China'];

export default function PlayerList({
  players,
  onPlayerAction,
  actionLabel,
  draftedPlayerIds = [],
  showFilters = true,
  maxHeight = '600px',
  className = '',
}: PlayerListProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.team.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      if (regionFilter !== 'all' && p.region !== regionFilter) return false;
      return true;
    });
  }, [players, search, roleFilter, regionFilter]);

  return (
    <div className={`flex flex-col ${className}`}>
      {showFilters && (
        <div className="p-3 space-y-2 border-b border-[var(--border-subtle)]">
          <Input
            placeholder="Search players or teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {/* Role filters */}
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all
                ${roleFilter === 'all' ? 'bg-[var(--accent-red)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              All Roles
            </button>
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role === roleFilter ? 'all' : role)}
                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all
                  ${roleFilter === role ? 'bg-[var(--accent-red)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setRegionFilter('all')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all
                ${regionFilter === 'all' ? 'bg-[var(--accent-teal)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              All Regions
            </button>
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setRegionFilter(region === regionFilter ? 'all' : region)}
                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all
                  ${regionFilter === region ? 'bg-[var(--accent-teal)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Player list */}
      <div className="overflow-y-auto stagger-list" style={{ maxHeight }}>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            <p className="text-sm">No players found</p>
          </div>
        ) : (
          filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              variant="compact"
              isDrafted={draftedPlayerIds.includes(player.id)}
              actionLabel={draftedPlayerIds.includes(player.id) ? undefined : actionLabel}
              onAction={onPlayerAction ? () => onPlayerAction(player.id) : undefined}
            />
          ))
        )}
      </div>

      {/* Count */}
      <div className="px-3 py-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
        {filtered.length} player{filtered.length !== 1 ? 's' : ''}
        {draftedPlayerIds.length > 0 && ` ({draftedPlayerIds.length} drafted)`}
      </div>
    </div>
  );
}
