// Shared TypeScript types for frontend use.
// Re-exports API types and adds utility types for common data shapes.

export type {
  Region,
  PlayerRole,
  SlotType,
  LeagueStatus,
  DraftStatus,
  PlayerDesignation,
  ScoringWeights,
  PlayerMatchStats,
} from '@/src/lib/game-config'

export type {
  ApiError,
  UserSummary,
  PlayerSummary,
  PlayerDetail,
  PlayerMatchStatEntry,
  PlayerAverageStats,
  LeagueSummary,
  LeagueDetail,
  LeagueMemberSummary,
  LeagueListResponse,
  LeagueCreateRequest,
  LeagueCreateResponse,
  LeagueDetailResponse,
  LeagueJoinRequest,
  LeagueJoinResponse,
  DraftPickEntry,
  DraftStateResponse,
  DraftStartResponse,
  DraftGetResponse,
  DraftPickRequest,
  DraftPickResponse,
  RosterPlayerEntry,
  RosterResponse,
  LineupSlotEntry,
  LineupResponse,
  RosterLineupRequest,
  RosterLineupResponse,
  RosterStarRequest,
  RosterStarResponse,
  StandingEntry,
  WeeklyScoreEntry,
  PlayerScoreBreakdown,
  StandingsResponse,
  PlayersListRequest,
  PlayersListResponse,
  PlayerDetailResponse,
  StatsImportRequest,
  StatsImportResponse,
} from '@/src/lib/api-types'

// ============================================================================
// Utility Types — richer shapes for frontend components
// ============================================================================

export interface PlayerWithStats {
  id: string
  name: string
  team: string
  region: string
  role: string
  imageUrl: string | null
  stats: {
    matches: number
    kills: number
    deaths: number
    assists: number
    firstKills: number
    firstDeaths: number
    adr: number
    avgFantasyPoints: number
  } | null
}

export interface LeagueWithMembers {
  id: string
  name: string
  inviteCode: string
  status: string
  rosterSize: number
  draftPickTime: number
  creatorId: string
  members: {
    id: string
    userId: string
    userName: string | null
    userImage: string | null
    draftOrder: number
    rosterPlayerCount: number
  }[]
}

export interface RosterWithSlots {
  id: string
  leagueId: string
  players: {
    id: string
    playerId: string
    playerName: string
    playerTeam: string
    playerRole: string
    playerRegion: string
    playerImage: string | null
    isCaptain: boolean
    slotType: string
    isActive: boolean
    isStarPlayer: boolean
    starCooldownWeeksLeft: number
    weeklyPoints: number
  }[]
}

export interface DraftState {
  id: string
  leagueId: string
  status: string
  currentRound: number
  currentPickIndex: number
  draftOrder: string[]
  totalRounds: number
  totalPicks: number
  picks: DraftPickDisplay[]
  currentDrafterId: string | null
  timeRemaining: number | null
}

export interface DraftPickDisplay {
  round: number
  pickNumber: number
  userId: string
  userName: string | null
  playerId: string
  playerName: string
  playerTeam: string
  playerRole: string
  playerRegion: string
  isCaptain: boolean
}

export interface TradeOfferWithDetails {
  id: string
  leagueId: string
  fromUser: { id: string; name: string | null; image: string | null }
  toUser: { id: string; name: string | null; image: string | null }
  offeredPlayers: PlayerWithStats[]
  requestedPlayers: PlayerWithStats[]
  scoreOffered: number
  scoreRequested: number
  note: string | null
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  createdAt: string
}

export interface WeeklyLineupWithSlots {
  id: string
  weekNumber: number
  isLocked: boolean
  slots: {
    playerId: string
    playerName: string
    playerTeam: string
    playerRole: string
    isCaptain: boolean
    isStarPlayer: boolean
    pointsEarned: number
    multiplier: number
  }[]
}

export interface NotificationItem {
  id: string
  type: 'DRAFT_TURN' | 'TRADE_RECEIVED' | 'TRADE_RESOLVED' | 'WEEK_RESULTS' | 'LINEUP_REMINDER' | 'GENERAL'
  title: string
  body: string
  read: boolean
  link: string | null
  createdAt: string
}

export interface TeamBuildData {
  id: string
  name: string
  playerIds: string[]
  captainId: string | null
  projectedScore: number | null
  createdAt: string
}
