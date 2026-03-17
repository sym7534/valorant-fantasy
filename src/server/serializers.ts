import type {
  DraftPick,
  DraftState,
  League,
  LeagueMember,
  LeagueWeek,
  LineupSlot,
  Player,
  RosterPlayer,
  User,
} from '@prisma/client';
import type {
  DraftPickEntry,
  DraftStateResponse,
  LeagueDetail,
  LeagueMemberSummary,
  LeagueWeekSummary,
  LineupSlotEntry,
  PlayerScoreBreakdown,
  PlayerSummary,
  UserSummary,
  WeeklyScoreEntry,
} from '@/src/lib/api-types';

type UserSummarySource = Pick<User, 'id' | 'name' | 'image'>;
type PlayerSummarySource = Pick<Player, 'id' | 'name' | 'team' | 'region' | 'role' | 'imageUrl'>;

export type DraftPickWithRelations = DraftPick & {
  user: UserSummarySource;
  player: PlayerSummarySource;
};

export type DraftStateWithRelations = DraftState & {
  picks: DraftPickWithRelations[];
};

export type LeagueMemberWithUser = LeagueMember & {
  user: UserSummarySource;
};

export type LeagueDetailSource = League & {
  members: LeagueMemberWithUser[];
  weeks: LeagueWeek[];
  draft: DraftStateWithRelations | null;
};

export type RosterPlayerWithPlayer = RosterPlayer & {
  player: PlayerSummarySource;
};

export type LineupSlotWithRosterPlayer = LineupSlot & {
  rosterPlayer: RosterPlayerWithPlayer;
};

export function toUserSummary(user: UserSummarySource): UserSummary {
  return {
    id: user.id,
    name: user.name,
    image: user.image,
  };
}

export function toPlayerSummary(player: PlayerSummarySource): PlayerSummary {
  return {
    id: player.id,
    name: player.name,
    team: player.team,
    region: player.region,
    role: player.role,
    imageUrl: player.imageUrl,
  };
}

export function calculateTimeRemaining(turnExpiresAt: Date | null): number | null {
  if (!turnExpiresAt) {
    return null;
  }

  return Math.max(0, Math.ceil((turnExpiresAt.getTime() - Date.now()) / 1000));
}

export function toDraftPickEntry(pick: DraftPickWithRelations): DraftPickEntry {
  return {
    id: pick.id,
    userId: pick.userId,
    user: toUserSummary(pick.user),
    playerId: pick.playerId,
    player: toPlayerSummary(pick.player),
    round: pick.round,
    pickNumber: pick.pickNumber,
    isCaptain: pick.isCaptain,
    slotType: pick.slotType,
    pickedAt: pick.pickedAt.toISOString(),
  };
}

export function buildDraftStateResponse(draftState: DraftStateWithRelations): DraftStateResponse {
  return {
    id: draftState.id,
    leagueId: draftState.leagueId,
    status: draftState.status,
    currentRound: draftState.currentRound,
    currentPickIndex: draftState.currentPickIndex,
    draftOrder: draftState.draftOrder as string[],
    picks: draftState.picks
      .slice()
      .sort((left, right) => left.pickNumber - right.pickNumber)
      .map(toDraftPickEntry),
    startedAt: draftState.startedAt?.toISOString() ?? null,
    completedAt: draftState.completedAt?.toISOString() ?? null,
    timeRemaining: calculateTimeRemaining(draftState.turnExpiresAt),
  };
}

export function toLeagueMemberSummary(
  member: LeagueMemberWithUser,
  creatorId: string
): LeagueMemberSummary {
  return {
    id: member.id,
    userId: member.userId,
    user: toUserSummary(member.user),
    joinedAt: member.joinedAt.toISOString(),
    isCreator: member.userId === creatorId,
  };
}

export function buildLeagueWeekSummaries(
  weeks: LeagueWeek[],
  currentWeek: number,
  totalPointsByWeek?: Map<number, number | null>
): LeagueWeekSummary[] {
  return weeks
    .slice()
    .sort((left, right) => left.weekNumber - right.weekNumber)
    .map((week) => ({
      weekNumber: week.weekNumber,
      isCurrent: week.weekNumber === currentWeek,
      isLineupLocked: week.isLineupLocked,
      totalPoints: totalPointsByWeek?.get(week.weekNumber) ?? null,
    }));
}

export function buildLeagueDetail(
  league: LeagueDetailSource,
  totalPointsByWeek?: Map<number, number | null>
): LeagueDetail {
  return {
    id: league.id,
    name: league.name,
    inviteCode: league.inviteCode,
    status: league.status,
    rosterSize: league.rosterSize,
    draftPickTime: league.draftPickTime,
    creatorId: league.creatorId,
    currentWeek: league.currentWeek,
    archivedAt: league.archivedAt?.toISOString() ?? null,
    createdAt: league.createdAt.toISOString(),
    updatedAt: league.updatedAt.toISOString(),
    members: league.members
      .slice()
      .sort((left, right) => left.joinedAt.getTime() - right.joinedAt.getTime())
      .map((member) => toLeagueMemberSummary(member, league.creatorId)),
    weeks: buildLeagueWeekSummaries(league.weeks, league.currentWeek, totalPointsByWeek),
    draft: league.draft ? buildDraftStateResponse(league.draft) : null,
  };
}

export function buildWeeklyScoreEntry(
  weekNumber: number,
  totalPoints: number,
  breakdown: PlayerScoreBreakdown[]
): WeeklyScoreEntry {
  return {
    weekNumber,
    totalPoints,
    breakdown,
  };
}

export function buildLineupSlotEntry(
  slot: LineupSlotWithRosterPlayer,
  scoreByPlayerId?: Map<string, number>
): LineupSlotEntry {
  return {
    id: slot.id,
    rosterPlayerId: slot.rosterPlayerId,
    player: toPlayerSummary(slot.rosterPlayer.player),
    isStarPlayer: slot.isStarPlayer,
    isCaptain: slot.rosterPlayer.isCaptain,
    slotType: slot.rosterPlayer.slotType,
    weeklyPoints: scoreByPlayerId?.get(slot.rosterPlayer.playerId) ?? null,
  };
}
