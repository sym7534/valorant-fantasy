'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StandingsRedirect(): null {
  const params = useParams<{ leagueId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/league/${params.leagueId}`);
  }, [params.leagueId, router]);

  return null;
}
