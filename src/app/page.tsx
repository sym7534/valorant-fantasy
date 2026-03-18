'use client';

import React from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

const steps = [
  {
    number: '01',
    title: 'Create a League',
    description: 'Start a private league with friends. Set your roster size and draft timer.',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  },
  {
    number: '02',
    title: 'Snake Draft',
    description: 'Draft real VCT pros in a live snake draft. Your Round 1 pick becomes your Captain (2x points).',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    number: '03',
    title: 'Set Your Lineup',
    description: 'Choose 5 active players each week. Activate a Star Player for 3x points with a 2-week cooldown.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    number: '04',
    title: 'Compete',
    description: 'Earn fantasy points from real VCT match stats. Climb the standings and prove your GM skills.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
];

const features = [
  { title: 'Real-Time Snake Draft', description: 'Live drafting with countdown timers and instant updates via WebSocket.' },
  { title: 'Captain & Star System', description: 'Your first pick is your 2x Captain. Activate Star Players for a 3x boost.' },
  { title: 'Authentic VCT Stats', description: 'Points calculated from kills, deaths, assists, first bloods, ADR, and more.' },
  { title: 'Private Leagues', description: 'Create invite-only leagues for 2-12 friends with customizable settings.' },
];

export default function LandingPage(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-atmospheric" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-glow" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="flex justify-center mb-8">
            <Image src="/vctlogo.png" alt="VCT Fantasy" width={64} height={64} className="animate-float" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] leading-tight mb-6">
            Build Your VCT{' '}
            <span className="text-[var(--accent-red)]">Dream Team</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            Draft real Valorant Champions Tour professionals, set weekly lineups, and compete with friends in the ultimate fantasy esports experience.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="text-lg px-10 py-4"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              Sign In with Google
            </Button>
            <button
              type="button"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
              onClick={() => signIn('dev-login', { email: 'ryan.muxiwang@gmail.com', callbackUrl: '/dashboard' })}
            >
              Dev: Sign in as Ryan
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-center text-[var(--text-primary)] mb-16">
            How It <span className="text-[var(--accent-red)]">Works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Card className="p-6 h-full" hover>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold font-[family-name:var(--font-display)] text-[var(--accent-red)] opacity-40">
                      {step.number}
                    </span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={step.icon} />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-center text-[var(--text-primary)] mb-16">
            <span className="text-[var(--accent-red)]">Features</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-6 bg-[var(--bg-primary)] border border-[var(--border-default)] clip-angular-sm animate-fade-in-up"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <div className="w-2 h-2 rounded-full bg-[var(--accent-red)] shrink-0 mt-1.5" />
                <div>
                  <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/vctlogo.png" alt="VCT Fantasy" width={20} height={20} />
            <span className="text-xs text-[var(--text-muted)]">
              VCT Fantasy League
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Not affiliated with Riot Games or VALORANT
          </span>
        </div>
      </footer>
    </div>
  );
}
