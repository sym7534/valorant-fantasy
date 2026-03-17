'use client';

import React from 'react';
import Modal from '@/src/components/ui/Modal';
import Button from '@/src/components/ui/Button';
import { STAR_PLAYER_MULTIPLIER, STAR_PLAYER_COOLDOWN_WEEKS } from '@/src/lib/game-config';

interface StarPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function StarPlayerModal({
  isOpen,
  onClose,
  playerName,
  onConfirm,
  isLoading = false,
}: StarPlayerModalProps): React.ReactElement | null {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activate Star Player">
      <div className="space-y-5">
        <div className="flex items-center justify-center py-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-gold-muted)] flex items-center justify-center animate-pulse-glow">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--accent-gold)">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>

        <p className="text-center text-[var(--text-primary)] text-sm">
          Activate{' '}
          <span className="font-bold font-[family-name:var(--font-display)] uppercase text-[var(--accent-gold)]">
            {playerName}
          </span>{' '}
          as your Star Player?
        </p>

        <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--status-success)">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span className="text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--accent-gold)] font-bold">{STAR_PLAYER_MULTIPLIER}x points</span> this week
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--status-warning)">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <span className="text-xs text-[var(--text-secondary)]">
              Cannot be starred again for{' '}
              <span className="text-[var(--status-warning)] font-bold">{STAR_PLAYER_COOLDOWN_WEEKS} weeks</span> after
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button variant="ghost" size="md" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            Confirm Star
          </Button>
        </div>
      </div>
    </Modal>
  );
}
