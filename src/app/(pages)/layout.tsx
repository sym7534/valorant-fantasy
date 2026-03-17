'use client';

import React from 'react';
import Navbar from '@/src/components/layout/Navbar';
import { useAuth } from '@/src/hooks/useAuth';

interface PagesLayoutProps {
  children: React.ReactNode;
}

export default function PagesLayout({
  children,
}: PagesLayoutProps): React.ReactElement {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userName={user?.name} userImage={user?.image} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
