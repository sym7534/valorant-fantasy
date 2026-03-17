'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import JoinLeagueForm from '@/src/components/league/JoinLeagueForm';
import Card from '@/src/components/ui/Card';

export default function JoinLeaguePage(): React.ReactElement {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-6">
      <Card className="p-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
          Join A League
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Paste the invite code from your league host to join the lobby and get ready for the draft.
        </p>
        <JoinLeagueForm onSuccess={(leagueId) => router.push(`/league/${leagueId}`)} />
      </Card>

      <Card className="p-8">
        <h2 className="text-xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-4">
          Before You Join
        </h2>
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p>Invite codes are 8 characters and only work while a league is still in setup.</p>
          <p>Once the host starts the draft, new members can’t join that league.</p>
          <p>The app supports private leagues only for the MVP.</p>
        </div>
      </Card>
    </div>
  );
}
