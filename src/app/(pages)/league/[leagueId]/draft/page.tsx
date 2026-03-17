'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DraftHeader from '@/src/components/draft/DraftHeader';
import DraftMyRoster from '@/src/components/draft/DraftMyRoster';
import DraftBoard from '@/src/components/draft/DraftBoard';
import PlayerPool from '@/src/components/draft/PlayerPool';
import DraftLog from '@/src/components/draft/DraftLog';
import Badge from '@/src/components/ui/Badge';
import Spinner from '@/src/components/ui/Spinner';
import { useDraft } from '@/src/hooks/useDraft';
import { useAuth } from '@/src/hooks/useAuth';
import {
  MOCK_PLAYERS,
  MOCK_LEAGUE_MEMBERS,
  MOCK_USER,
} from '@/src/lib/mock-data';

export default function DraftPage(): React.ReactElement {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { user } = useAuth();
  const userId = user?.id ?? MOCK_USER.id;

  const {
    draftState,
    isMyTurn,
    secondsRemaining,
    makePick,
    isConnected,
    draftedPlayerIds,
  } = useDraft(leagueId, userId);

  if (!draftState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  const totalRounds = 10; // TEMPORARY: Replace with league.rosterSize
  const totalPicks = totalRounds * draftState.draftOrder.length;
  const currentPickNumber = draftState.picks.length + 1;

  // Determine current drafter
  const currentDrafterUserId =
    draftState.currentRound % 2 === 1
      ? draftState.draftOrder[draftState.currentPickIndex]
      : draftState.draftOrder[draftState.draftOrder.length - 1 - draftState.currentPickIndex];
  const currentDrafter = MOCK_LEAGUE_MEMBERS.find((m) => m.userId === currentDrafterUserId);
  const isSnakeForward = draftState.currentRound % 2 === 1;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Captain round banner */}
      {draftState.currentRound === 1 && (
        <div className="bg-[var(--accent-gold-muted)] border-b border-[rgba(245,197,66,0.3)] px-6 py-2 text-center">
          <span className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent-gold)]">
            Captain Round — Your first pick becomes your permanent Captain (2x points all season)
          </span>
        </div>
      )}

      {/* Draft header */}
      <DraftHeader
        currentRound={draftState.currentRound}
        totalRounds={totalRounds}
        currentPickNumber={currentPickNumber}
        totalPicks={totalPicks}
        currentDrafterName={currentDrafter?.name ?? 'Unknown'}
        currentDrafterImage={currentDrafter?.image}
        secondsRemaining={secondsRemaining}
        totalSeconds={60}
        isMyTurn={isMyTurn}
        isSnakeForward={isSnakeForward}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: My Roster */}
        <DraftMyRoster
          picks={draftState.picks}
          userId={userId}
          rosterSize={totalRounds}
          className="w-64 shrink-0 overflow-y-auto border-r border-[var(--border-subtle)]"
        />

        {/* Center: Draft Board */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DraftBoard
            picks={draftState.picks}
            members={MOCK_LEAGUE_MEMBERS}
            draftOrder={draftState.draftOrder}
            totalRounds={totalRounds}
            currentRound={draftState.currentRound}
            currentPickIndex={draftState.currentPickIndex}
            currentUserId={userId}
            className="flex-1 overflow-auto p-4"
          />

          {/* Bottom: Draft Log */}
          <DraftLog
            picks={draftState.picks}
            className="h-40 shrink-0 border-t border-[var(--border-subtle)]"
          />
        </div>

        {/* Right: Player Pool */}
        <PlayerPool
          players={MOCK_PLAYERS}
          draftedPlayerIds={draftedPlayerIds}
          isMyTurn={isMyTurn}
          onDraftPlayer={makePick}
          className="w-80 shrink-0 border-l border-[var(--border-subtle)]"
        />
      </div>

      {/* Connection status */}
      <div className="absolute bottom-2 left-2 z-50">
        <Badge variant={isConnected ? 'success' : 'error'} size="sm">
          <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${isConnected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-error)]'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
    </div>
  );
}
