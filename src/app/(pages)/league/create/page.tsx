'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Tabs from '@/src/components/ui/Tabs';
import CreateLeagueForm from '@/src/components/league/CreateLeagueForm';
import JoinLeagueForm from '@/src/components/league/JoinLeagueForm';

const tabs = [
  { label: 'Create', value: 'create' },
  { label: 'Join', value: 'join' },
];

export default function CreateLeaguePage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('create');
  const router = useRouter();

  function handleSuccess(leagueId: string): void {
    router.push(`/league/${leagueId}`);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-6">
        {activeTab === 'create' ? 'Create' : 'Join'} a League
      </h1>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8" />

      {activeTab === 'create' ? (
        <CreateLeagueForm onSuccess={handleSuccess} />
      ) : (
        <JoinLeagueForm onSuccess={handleSuccess} />
      )}
    </div>
  );
}
