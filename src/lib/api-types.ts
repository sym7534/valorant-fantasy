// =============================================================================
// API Request/Response Types — Backend Agent owns this file
// Frontend Agent imports these types for all API interactions.
// =============================================================================

// BLOCKED: Waiting on Lead Agent — these placeholder types will be replaced
// with imports from @/src/lib/game-config once available.
// For now, we define local copies to unblock development.

type Region = 'Americas' | 'Pacific' | 'EMEA' | 'China'
type PlayerRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel'
type SlotType = PlayerRole | 'Wildcard'
type LeagueStatus = 'SETUP' | 'DRAFTING' | 'ACTIVE' | 'COMPLETED'
type DraftStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETE'

// =============================================================================
// Common / Shared Types
// =============================================================================

export type ApiError = {
  error: string
  code?: string
}

export type PaginationParams = {
  page?: number
  limit?: number
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

// =============================================================================
// User Types
// =============================================================================

export type UserSummary = {
  id: string
  name: string | null
  image: string | null
}

// =============================================================================
// Player Types
// =============================================================================

export type PlayerSummary = {
  id: string
  name: string
  team: string
  region: Region
  role: PlayerRole
  imageUrl: string | null
}

export type PlayerDetail = PlayerSummary & {
  matchStats: PlayerMatchStatEntry[]
  averageStats: PlayerAverageStats | null
}

export type PlayerMatchStatEntry = {
  id: string
  externalMatchId: string
  kills: number
  deaths: number
  assists: number
  firstKills: number
  firstDeaths: number
  roundsWon: number
  roundsLost: number
  adr: number
  acs: number
  rating: number
  hsPercent: number
  kast: number
  createdAt: string
}

export type PlayerAverageStats = {
  kills: number
  deaths: number
  assists: number
  firstKills: number
  firstDeaths: number
  adr: number
  acs: number
  rating: number
  avgFantasyPoints: number
}

// =============================================================================
// League Types
// =============================================================================

export type LeagueSummary = {
  id: string
  name: string
  status: LeagueStatus
  memberCount: number
  rosterSize: number
  creatorId: string
  createdAt: string
}

export type LeagueDetail = {
  id: string
  name: string
  inviteCode: string
  status: LeagueStatus
  rosterSize: number
  draftPickTime: number
  creatorId: string
  createdAt: string
  updatedAt: string
  members: LeagueMemberSummary[]
}

export type LeagueMemberSummary = {
  id: string
  userId: string
  user: UserSummary
  joinedAt: string
}

// --- League List (GET /api/leagues) ---

export type LeagueListResponse = {
  leagues: LeagueSummary[]
}

// --- League Create (POST /api/leagues) ---

export type LeagueCreateRequest = {
  name: string
  rosterSize: number
  draftPickTime: number
}

export type LeagueCreateResponse = {
  league: LeagueDetail
}

// --- League Detail (GET /api/leagues/[leagueId]) ---

export type LeagueDetailResponse = {
  league: LeagueDetail
}

// --- League Join (POST /api/leagues/[leagueId]/join) ---

export type LeagueJoinRequest = {
  inviteCode: string
}

export type LeagueJoinResponse = {
  league: LeagueDetail
}

// =============================================================================
// Draft Types
// =============================================================================

export type DraftPickEntry = {
  id: string
  userId: string
  user: UserSummary
  playerId: string
  player: PlayerSummary
  round: number
  pickNumber: number
  isCaptain: boolean
  pickedAt: string
}

export type DraftStateResponse = {
  id: string
  leagueId: string
  status: DraftStatus
  currentRound: number
  currentPickIndex: number
  draftOrder: string[]
  picks: DraftPickEntry[]
  startedAt: string | null
  completedAt: string | null
  timeRemaining: number | null
}

// --- Draft Start (POST /api/leagues/[leagueId]/draft/start) ---

export type DraftStartResponse = {
  draft: DraftStateResponse
}

// --- Draft State (GET /api/leagues/[leagueId]/draft) ---

export type DraftGetResponse = {
  draft: DraftStateResponse
}

// --- Draft Pick (POST /api/leagues/[leagueId]/draft/pick) ---

export type DraftPickRequest = {
  playerId: string
}

export type DraftPickResponse = {
  pick: DraftPickEntry
  draft: DraftStateResponse
}

// =============================================================================
// Roster Types
// =============================================================================

export type RosterPlayerEntry = {
  id: string
  playerId: string
  player: PlayerSummary
  isCaptain: boolean
  slotType: SlotType
}

export type RosterResponse = {
  id: string
  leagueId: string
  players: RosterPlayerEntry[]
  activeLineup: LineupResponse | null
}

// --- Lineup Types ---

export type LineupSlotEntry = {
  id: string
  rosterPlayerId: string
  player: PlayerSummary
  isStarPlayer: boolean
  isCaptain: boolean
}

export type LineupResponse = {
  id: string
  weekNumber: number
  isLocked: boolean
  slots: LineupSlotEntry[]
}

// --- Set Lineup (PUT /api/leagues/[leagueId]/roster/lineup) ---

export type RosterLineupRequest = {
  playerIds: string[]
  weekNumber?: number
}

export type RosterLineupResponse = {
  lineup: LineupResponse
}

// --- Star Player (PUT /api/leagues/[leagueId]/roster/star) ---

export type RosterStarRequest = {
  playerId: string
  weekNumber?: number
}

export type RosterStarResponse = {
  lineup: LineupResponse
}

// =============================================================================
// Standings Types
// =============================================================================

export type StandingEntry = {
  rank: number
  userId: string
  user: UserSummary
  totalPoints: number
  weeklyScores: WeeklyScoreEntry[]
}

export type WeeklyScoreEntry = {
  weekNumber: number
  totalPoints: number
  breakdown: PlayerScoreBreakdown[]
}

export type PlayerScoreBreakdown = {
  playerId: string
  playerName: string
  baseScore: number
  multiplier: number
  finalScore: number
  designation: 'captain' | 'star' | 'normal'
}

export type StandingsResponse = {
  leagueId: string
  standings: StandingEntry[]
}

// =============================================================================
// Players List (GET /api/players) Types
// =============================================================================

export type PlayersListRequest = PaginationParams & {
  region?: Region
  role?: PlayerRole
  search?: string
}

export type PlayersListResponse = {
  players: PlayerSummary[]
  pagination: PaginationMeta
}

// --- Player Detail (GET /api/players/[playerId]) ---

export type PlayerDetailResponse = {
  player: PlayerDetail
}

// =============================================================================
// Stats Import (POST /api/stats/import) Types
// =============================================================================

export type StatsImportRequest = {
  matchId: string
  content: string
}

export type StatsImportResponse = {
  imported: number
  matchId: string
  players: Array<{
    name: string
    playerId: string
  }>
}

// =============================================================================
// Socket.io Event Payload Types
// =============================================================================

export type SocketDraftJoinPayload = {
  leagueId: string
}

export type SocketDraftPickPayload = {
  leagueId: string
  playerId: string
}

export type SocketDraftStatePayload = DraftStateResponse

export type SocketDraftPickedPayload = {
  pick: DraftPickEntry
}

export type SocketDraftTurnPayload = {
  userId: string
  round: number
  pickNumber: number
  timeRemaining: number
}

export type SocketDraftTimerPayload = {
  secondsRemaining: number
}

export type SocketDraftCompletePayload = {
  leagueId: string
}

export type SocketDraftErrorPayload = {
  message: string
}
