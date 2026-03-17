'use client';

import React, { useState } from 'react';
import Tabs from '@/src/components/ui/Tabs';
import Button from '@/src/components/ui/Button';
import Badge from '@/src/components/ui/Badge';
import Card from '@/src/components/ui/Card';
import EmptyState from '@/src/components/ui/EmptyState';

// TEMPORARY trade types — will be replaced when backend supports trades
interface TradePlayer {
  id: string;
  name: string;
  team: string;
  role: string;
  fantasyPoints: number;
}

interface Trade {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
  offeredPlayers: TradePlayer[];
  requestedPlayers: TradePlayer[];
  createdAt: string;
}

interface TradeHubProps {
  currentUserId: string;
  trades?: Trade[];
  className?: string;
}

const tabs = [
  { label: 'Create', value: 'create' },
  { label: 'Incoming', value: 'incoming' },
  { label: 'Outgoing', value: 'outgoing' },
];

export default function TradeHub({
  currentUserId,
  trades = [],
  className = '',
}: TradeHubProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState('create');

  const incomingTrades = trades.filter(
    (t) => t.toUser.id === currentUserId && t.status === 'pending'
  );
  const outgoingTrades = trades.filter(
    (t) => t.fromUser.id === currentUserId && t.status === 'pending'
  );

  const statusVariant: Record<string, 'success' | 'error' | 'warning' | 'muted'> = {
    pending: 'warning',
    accepted: 'success',
    declined: 'error',
    cancelled: 'muted',
  };

  function renderTradeCard(trade: Trade, actions?: React.ReactNode): React.ReactElement {
    return (
      <Card key={trade.id} className="p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
              {trade.fromUser.name}
            </span>
            <span className="text-xs text-[var(--text-muted)]">&harr;</span>
            <span className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
              {trade.toUser.name}
            </span>
          </div>
          <Badge variant={statusVariant[trade.status]} size="sm">
            {trade.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Offering</p>
            {trade.offeredPlayers.map((p) => (
              <div key={p.id} className="text-xs text-[var(--text-secondary)] py-0.5">
                <span className="font-semibold text-[var(--text-primary)]">{p.name}</span> ({p.team})
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Requesting</p>
            {trade.requestedPlayers.map((p) => (
              <div key={p.id} className="text-xs text-[var(--text-secondary)] py-0.5">
                <span className="font-semibold text-[var(--text-primary)]">{p.name}</span> ({p.team})
              </div>
            ))}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">{actions}</div>}
      </Card>
    );
  }

  return (
    <div className={className}>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'create' && (
        <div className="space-y-4">
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            }
            title="Create a Trade"
            description="Select players from your roster to offer and choose which players you want in return. Trades require approval from the other manager."
          />
        </div>
      )}

      {activeTab === 'incoming' && (
        <div>
          {incomingTrades.length === 0 ? (
            <EmptyState
              title="No Incoming Trades"
              description="You have no pending trade offers to review."
            />
          ) : (
            incomingTrades.map((trade) =>
              renderTradeCard(trade, (
                <>
                  <Button variant="primary" size="sm">Accept</Button>
                  <Button variant="danger" size="sm">Decline</Button>
                  <Button variant="ghost" size="sm">Counter</Button>
                </>
              ))
            )
          )}
        </div>
      )}

      {activeTab === 'outgoing' && (
        <div>
          {outgoingTrades.length === 0 ? (
            <EmptyState
              title="No Outgoing Trades"
              description="You haven't sent any trade offers."
            />
          ) : (
            outgoingTrades.map((trade) =>
              renderTradeCard(trade, (
                <Button variant="danger" size="sm">Cancel Trade</Button>
              ))
            )
          )}
        </div>
      )}

      {/* Trade history log */}
      {trades.filter((t) => t.status !== 'pending').length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Trade History
          </h3>
          {trades
            .filter((t) => t.status !== 'pending')
            .map((trade) => renderTradeCard(trade))}
        </div>
      )}
    </div>
  );
}
