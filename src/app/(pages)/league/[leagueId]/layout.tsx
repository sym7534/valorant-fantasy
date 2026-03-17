import React from 'react';
import { notFound } from 'next/navigation';
import Sidebar from '@/src/components/layout/Sidebar';
import { auth } from '@/src/lib/auth';
import { loadLeagueDetailForUser } from '@/src/server/league-service';

interface LeagueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ leagueId: string }>;
}

export default async function LeagueLayout({
  children,
  params,
}: LeagueLayoutProps): Promise<React.ReactElement> {
  const session = await auth();
  const userId = session?.user?.id;
  const { leagueId } = await params;

  if (!userId) {
    return <>{children}</>;
  }

  const league = await loadLeagueDetailForUser(leagueId, userId);
  if (!league) {
    notFound();
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      <Sidebar leagueId={leagueId} leagueName={league.name} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
