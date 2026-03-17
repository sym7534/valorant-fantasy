'use client';

import React, { useState } from 'react';
import Input from '@/src/components/ui/Input';
import Button from '@/src/components/ui/Button';
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

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    if (inviteCode.length !== INVITE_CODE_LENGTH) {
      setError(`Invite code must be ${INVITE_CODE_LENGTH} characters`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      });
      const data = (await response.json()) as { league?: { id: string }; error?: string };

      if (!response.ok || !data.league) {
        setError(data.error ?? 'Failed to join league');
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
        label="Invite Code"
        value={inviteCode}
        onChange={(event) => setInviteCode(event.target.value.toUpperCase().slice(0, INVITE_CODE_LENGTH))}
        placeholder={`${INVITE_CODE_LENGTH}-character code`}
        maxLength={INVITE_CODE_LENGTH}
      />

      {error && <p className="text-sm text-[var(--status-error)]">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={inviteCode.length !== INVITE_CODE_LENGTH}
        className="w-full"
      >
        Join League
      </Button>
    </form>
  );
}
