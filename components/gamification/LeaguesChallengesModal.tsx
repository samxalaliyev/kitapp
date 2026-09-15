import React from 'react';
import { LeaderboardModal, type LeaderboardModalProps } from './LeaderboardModal';
import { ReadingChallengesModal, type ReadingChallengesModalProps } from './ReadingChallengesModal';

export { LeaderboardModal, type LeaderboardModalProps } from './LeaderboardModal';
export { ReadingChallengesModal, type ReadingChallengesModalProps } from './ReadingChallengesModal';

export interface LeaguesChallengesModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'league' | 'challenges';
  onOpenPaywall?: () => void;
}

/**
 * Backward compatibility wrapper. Renders either the dedicated LeaderboardModal
 * or ReadingChallengesModal depending on initialTab.
 */
export function LeaguesChallengesModal({
  visible,
  onClose,
  initialTab = 'league',
  onOpenPaywall,
}: LeaguesChallengesModalProps) {
  if (initialTab === 'challenges') {
    return (
      <ReadingChallengesModal
        visible={visible}
        onClose={onClose}
        onOpenPaywall={onOpenPaywall}
      />
    );
  }

  return (
    <LeaderboardModal
      visible={visible}
      onClose={onClose}
      onOpenPaywall={onOpenPaywall}
    />
  );
}
