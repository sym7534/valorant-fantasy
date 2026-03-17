'use client';

import React, { useState } from 'react';
import Input from '@/src/components/ui/Input';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import { INVITE_CODE_LENGTH } from '@/src/lib/game-config';

interface JoinLeagueFormProps {
  onSuccess?: (leagueId: string) => void;
  className?: string;
}

export default function JoinLeagueForm({
  onSuccess,
  className = '',
}: JoinLeagueFormProps): React.ReactElement {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    id: string;
    name: string;
    creatorName: string;
    memberCount: number;
    rosterSize: number;
  } | null>(null);

  async function handleLookup(): Promise<void> {
    if (inviteCode.length !== INVITE_CODE_LENGTH) {
      setError(`Invite code must be ${INVITE_CODE_LENGTH} characters`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      // TEMPORARY: In the real version, we'd look up the league by invite code
      // For now, simulate a preview
      await new Promise((r) => setTimeout(r, 500));
      setPreview({
        id: 'league-preview',
        name: 'Preview League',
        creatorName: 'Unknown',
        memberCount: 3,
        rosterSize: 10,
      });
    } catch {
      setError('Failed to look up invite code');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin(): Promise<void> {
    if (!preview) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leagues/${preview.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to join league');
        return;
      }

      const data = await res.json();
      onSuccess?.(data.league.id);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Invite Code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, INVITE_CODE_LENGTH))}
            placeholder={`${INVITE_CODE_LENGTH}-character code`}
            maxLength={INVITE_CODE_LENGTH}
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="secondary"
            size="md"
            onClick={handleLookup}
            isLoading={isLoading && !preview}
            disabled={inviteCode.length !== INVITE_CODE_LENGTH}
          >
            Look Up
          </Button>
        </div>
      </div>

      {preview && (
        <Card className="p-5 animate-fade-in-up">
          <h4 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wide text-[var(--text-primary)] mb-3">
            {preview.name}
          </h4>
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-4">
            <span>
              Created by <span className="text-[var(--text-primary)] font-semibold">{preview.creatorName}</span>
            </span>
            <span>
              <span className="text-[var(--text-primary)] font-semibold">{preview.memberCount}</span> members
            </span>
            <span>
              Roster: <span className="text-[var(--text-primary)] font-semibold">{preview.rosterSize}</span>
            </span>
          </div>
          <Button variant="primary" size="md" onClick={handleJoin} isLoading={isLoading} className="w-full">
            Join League
          </Button>
        </Card>
      )}

      {error && (
        <p className="text-sm text-[var(--status-error)]">{error}</p>
      )}
    </div>
  );
}
