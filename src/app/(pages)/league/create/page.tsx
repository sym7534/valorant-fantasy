'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateLeagueForm from '@/src/components/league/CreateLeagueForm';
import Card from '@/src/components/ui/Card';

export default function CreateLeaguePage(): React.ReactElement {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
      <Card className="p-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
          Create A League
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Set the roster size, tune the draft timer, then invite your lobby with a single shareable code.
        </p>
        <CreateLeagueForm onSuccess={(leagueId) => router.push(`/league/${leagueId}`)} />
      </Card>

      <Card className="p-8 bg-[var(--bg-secondary)]">
        <h2 className="text-xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-4">
          MVP Rules
        </h2>
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p>Round 1 is the Captain Round. Your first pick becomes your permanent 2x scorer.</p>
          <p>Star Players are selected weekly for a 3x bonus, but captains can never be starred.</p>
          <p>Weeks are controlled manually through hidden admin routes for this MVP.</p>
          <p>Roster sizes 7, 8, and 9 reduce slots from wildcards first.</p>
        </div>
      </Card>
    </div>
  );
}
