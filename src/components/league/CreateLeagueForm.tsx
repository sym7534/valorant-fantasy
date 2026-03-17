'use client';

import React, { useState } from 'react';
import Input from '@/src/components/ui/Input';
import Select from '@/src/components/ui/Select';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import {
  DEFAULT_DRAFT_TIMER,
  DEFAULT_ROSTER_SIZE,
  DRAFT_TIMER_OPTIONS,
  LEAGUE_NAME_MAX_LENGTH,
  MAX_ROSTER_SIZE,
  MIN_ROSTER_SIZE,
  SCORING_WEIGHTS,
} from '@/src/lib/game-config';

interface CreateLeagueFormProps {
  onSuccess?: (leagueId: string) => void;
  className?: string;
}

export default function CreateLeagueForm({
  onSuccess,
  className = '',
}: CreateLeagueFormProps): React.ReactElement {
  const [name, setName] = useState('');
  const [draftPickTime, setDraftPickTime] = useState(String(DEFAULT_DRAFT_TIMER));
  const [rosterSize, setRosterSize] = useState(String(DEFAULT_ROSTER_SIZE));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerOptions = DRAFT_TIMER_OPTIONS.map((seconds) => ({
    label: seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`,
    value: String(seconds),
  }));

  const rosterOptions = Array.from(
    { length: MAX_ROSTER_SIZE - MIN_ROSTER_SIZE + 1 },
    (_, index) => {
      const value = MIN_ROSTER_SIZE + index;
      return { label: `${value} players`, value: String(value) };
    }
  );

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    if (!name.trim()) {
      setError('League name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          rosterSize: Number(rosterSize),
          draftPickTime: Number(draftPickTime),
        }),
      });
      const data = (await response.json()) as { league?: { id: string }; error?: string };

      if (!response.ok || !data.league) {
        setError(data.error ?? 'Failed to create league');
        return;
      }

      onSuccess?.(data.league.id);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <Input
        label="League Name"
        value={name}
        onChange={(event) => setName(event.target.value.slice(0, LEAGUE_NAME_MAX_LENGTH))}
        placeholder="Enter league name"
        maxLength={LEAGUE_NAME_MAX_LENGTH}
        helperText={`${name.length}/${LEAGUE_NAME_MAX_LENGTH} characters`}
      />

      <Select
        label="Roster Size"
        options={rosterOptions}
        value={rosterSize}
        onChange={setRosterSize}
      />

      <Select
        label="Timer Per Pick"
        options={timerOptions}
        value={draftPickTime}
        onChange={setDraftPickTime}
      />

      <Card className="p-4">
        <h4 className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Scoring Formula
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <span className="text-[var(--text-muted)]">Kills</span>
          <span className="text-[var(--status-success)] font-bold text-right">+{SCORING_WEIGHTS.kills}</span>
          <span className="text-[var(--text-muted)]">Deaths</span>
          <span className="text-[var(--accent-red)] font-bold text-right">{SCORING_WEIGHTS.deaths}</span>
          <span className="text-[var(--text-muted)]">Assists</span>
          <span className="text-[var(--status-success)] font-bold text-right">+{SCORING_WEIGHTS.assists}</span>
          <span className="text-[var(--text-muted)]">First Kills</span>
          <span className="text-[var(--status-success)] font-bold text-right">+{SCORING_WEIGHTS.firstKills}</span>
          <span className="text-[var(--text-muted)]">First Deaths</span>
          <span className="text-[var(--accent-red)] font-bold text-right">{SCORING_WEIGHTS.firstDeaths}</span>
          <span className="text-[var(--text-muted)]">Rounds Won</span>
          <span className="text-[var(--status-success)] font-bold text-right">+{SCORING_WEIGHTS.roundsWon}</span>
          <span className="text-[var(--text-muted)]">Rounds Lost</span>
          <span className="text-[var(--accent-red)] font-bold text-right">{SCORING_WEIGHTS.roundsLost}</span>
          <span className="text-[var(--text-muted)]">ADR</span>
          <span className="text-[var(--accent-teal)] font-bold text-right">/ {SCORING_WEIGHTS.adrDivisor}</span>
        </div>
      </Card>

      {error && <p className="text-sm text-[var(--status-error)]">{error}</p>}

      <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
        Create League
      </Button>
    </form>
  );
}
