'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import LeagueLobby from '@/src/components/league/LeagueLobby';
import Spinner from '@/src/components/ui/Spinner';
import { useAuth } from '@/src/hooks/useAuth';
import { MOCK_LEAGUES, MOCK_LEAGUE_MEMBERS, MOCK_USER } from '@/src/lib/mock-data';

export default function LeaguePage(): React.ReactElement {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { user, isLoading } = useAuth();

  // TEMPORARY: Use mock data — replace with useLeague hook when APIs are ready
  const league = MOCK_LEAGUES.find((l) => l.id === leagueId) ?? MOCK_LEAGUES[0];
  const members = MOCK_LEAGUE_MEMBERS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <LeagueLobby
        leagueId={league.id}
        leagueName={league.name}
        inviteCode={league.inviteCode}
        status={league.status}
        members={members}
        maxMembers={league.maxMembers}
        draftOrder={members.map((m) => m.userId)}
        currentUserId={user?.id ?? MOCK_USER.id}
        creatorId={league.creatorId}
        onStartDraft={() => {
          // BLOCKED: Replace with API call
          console.log('Start draft');
        }}
        onRandomizeOrder={() => {
          // BLOCKED: Replace with API call
          console.log('Randomize order');
        }}
      />
    </div>
  );
}
