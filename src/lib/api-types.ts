import type {
  DraftStatus,
  LeagueStatus,
  PlayerDesignation,
  PlayerRole,
  Region,
  SlotType,
} from '@/src/lib/game-config';

export type ApiError = {
  error: string;
  code?: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserSummary = {
  id: string;
  name: string | null;
  image: string | null;
};

export type PlayerSummary = {
  id: string;
  name: string;
  team: string;
  region: Region;
  roles: PlayerRole[];
  imageUrl: string | null;
};

export type LeagueActivityEntry = {
  id: string;
  leagueId: string;
  type: 'league_created' | 'league_joined' | 'draft_started' | 'draft_completed' | 'week_scored';
  message: string;
  timestamp: string;
};

export type LeagueSummary = {
  id: string;
  name: string;
  status: LeagueStatus;
  memberCount: number;
  rosterSize: number;
  draftPickTime: number;
  creatorId: string;
  currentWeek: number;
  createdAt: string;
  archivedAt: string | null;
  myRank: number | null;
  currentWeekPoints: number | null;
  totalPoints: number | null;
};

export type LeagueMemberSummary = {
  id: string;
  userId: string;
  user: UserSummary;
  joinedAt: string;
  isCreator: boolean;
};

export type LeagueWeekSummary = {
  weekNumber: number;
  isCurrent: boolean;
  isLineupLocked: boolean;
  lineupDeadline: string | null;
  totalPoints: number | null;
};

export type DraftQueueEntry = {
  id: string;
  priority: number;
  playerId: string;
  player: PlayerSummary;
};

export type DraftPickEntry = {
  id: string;
  userId: string;
  user: UserSummary;
  playerId: string;
  player: PlayerSummary;
  round: number;
  pickNumber: number;
  isCaptain: boolean;
  slotType: SlotType;
  pickedAt: string;
};

export type DraftStateResponse = {
  id: string;
  leagueId: string;
  status: DraftStatus;
  currentRound: number;
  currentPickIndex: number;
  draftOrder: string[];
  picks: DraftPickEntry[];
  startedAt: string | null;
  completedAt: string | null;
  timeRemaining: number | null;
};

export type LeagueDetail = {
  id: string;
  name: string;
  inviteCode: string;
  status: LeagueStatus;
  rosterSize: number;
  draftPickTime: number;
  creatorId: string;
  currentWeek: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members: LeagueMemberSummary[];
  weeks: LeagueWeekSummary[];
  draft: DraftStateResponse | null;
};

export type LeagueListResponse = {
  leagues: LeagueSummary[];
  activity: LeagueActivityEntry[];
};

export type LeagueCreateRequest = {
  name: string;
  rosterSize: number;
  draftPickTime: number;
  lineupLockDay?: number;
  lineupLockHour?: number;
};

export type LeagueCreateResponse = {
  league: LeagueDetail;
};

export type LeagueDetailResponse = {
  league: LeagueDetail;
};

export type LeagueJoinRequest = {
  inviteCode: string;
};

export type LeagueJoinResponse = {
  league: LeagueDetail;
};

export type DraftGetResponse = {
  league: Pick<LeagueDetail, 'id' | 'name' | 'status' | 'rosterSize' | 'draftPickTime'>;
  draft: DraftStateResponse;
  members: LeagueMemberSummary[];
  players: PlayerSummary[];
  queue: DraftQueueEntry[];
  currentUserId: string;
};

export type DraftStartResponse = {
  draft: DraftStateResponse;
};

export type DraftPickRequest = {
  playerId: string;
};

export type DraftPickResponse = {
  pick: DraftPickEntry;
  draft: DraftStateResponse;
};

export type DraftQueueResponse = {
  queue: DraftQueueEntry[];
};

export type DraftQueueUpdateRequest = {
  playerIds: string[];
};

export type PlayerScoreBreakdown = {
  playerId: string;
  playerName: string;
  baseScore: number;
  multiplier: number;
  finalScore: number;
  designation: PlayerDesignation;
};

export type WeeklyScoreEntry = {
  weekNumber: number;
  totalPoints: number;
  breakdown: PlayerScoreBreakdown[];
};

export type RosterPlayerEntry = {
  id: string;
  playerId: string;
  player: PlayerSummary;
  isCaptain: boolean;
  slotType: SlotType;
  isInActiveLineup: boolean;
  isStarPlayer: boolean;
  starCooldownWeeksLeft: number;
  starBannedUntilWeek: number | null;
  weeklyPoints: number | null;
};

export type LineupSlotEntry = {
  id: string;
  rosterPlayerId: string;
  player: PlayerSummary;
  isStarPlayer: boolean;
  isCaptain: boolean;
  slotType: SlotType;
  weeklyPoints: number | null;
};

export type LineupResponse = {
  id: string;
  weekNumber: number;
  isLocked: boolean;
  slots: LineupSlotEntry[];
};

export type RosterResponse = {
  id: string;
  leagueId: string;
  leagueName: string;
  currentWeek: number;
  selectedWeek: number;
  weekSummaries: LeagueWeekSummary[];
  players: RosterPlayerEntry[];
  activeLineup: LineupResponse | null;
  weeklyScore: WeeklyScoreEntry | null;
};

export type RosterLineupRequest = {
  playerIds: string[];
  weekNumber?: number;
};

export type RosterLineupResponse = {
  lineup: LineupResponse;
  roster: RosterResponse;
};

export type RosterStarRequest = {
  playerId: string;
  weekNumber?: number;
};

export type RosterStarResponse = {
  lineup: LineupResponse;
  roster: RosterResponse;
};

export type StandingEntry = {
  rank: number;
  userId: string;
  user: UserSummary;
  totalPoints: number;
  currentWeekPoints: number;
  trend: 'up' | 'down' | 'same';
  weeklyScores: WeeklyScoreEntry[];
  currentLineup: LineupSlotEntry[];
};

export type StandingsResponse = {
  leagueId: string;
  currentWeek: number;
  standings: StandingEntry[];
};

export type PlayersListRequest = PaginationParams & {
  region?: Region;
  role?: PlayerRole;
  search?: string;
};

export type PlayersListResponse = {
  players: PlayerSummary[];
  pagination: PaginationMeta;
};

export type StatsImportRequest = {
  matchId: string;
  content: string;
  weekNumber?: number;
};

export type StatsImportResponse = {
  imported: number;
  matchId: string;
  weekNumber: number;
  players: Array<{
    name: string;
    playerId: string;
  }>;
};

export type SocketDraftJoinPayload = {
  leagueId: string;
};

export type SocketDraftStatePayload = DraftStateResponse;

export type SocketDraftPickedPayload = {
  pick: DraftPickEntry;
};

export type SocketDraftTurnPayload = {
  userId: string;
  round: number;
  pickNumber: number;
  timeRemaining: number;
};

export type SocketDraftTimerPayload = {
  secondsRemaining: number;
};

export type SocketDraftCompletePayload = {
  leagueId: string;
};

export type SocketDraftErrorPayload = {
  message: string;
};
