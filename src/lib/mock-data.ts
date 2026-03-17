// TEMPORARY — These types will be replaced with imports from @/src/lib/api-types.ts and @/src/lib/game-config.ts when available

// === TEMPORARY TYPE DEFINITIONS ===

export type Region = 'Americas' | 'Pacific' | 'EMEA' | 'China';
export type PlayerRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';
export type SlotType = PlayerRole | 'Wildcard';
export type LeagueStatus = 'SETUP' | 'DRAFTING' | 'ACTIVE' | 'COMPLETED';
export type DraftStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETE';
export type PlayerDesignation = 'captain' | 'star' | 'normal';

export interface Player {
  id: string;
  name: string;
  team: string;
  region: Region;
  role: PlayerRole;
  imageUrl?: string;
}

export interface PlayerWithStats extends Player {
  stats: PlayerMatchStats;
  fantasyPoints: number;
  designation: PlayerDesignation;
  isActive: boolean;
  starCooldownWeeksLeft: number;
}

export interface PlayerMatchStats {
  kills: number;
  deaths: number;
  assists: number;
  firstKills: number;
  firstDeaths: number;
  roundsWon: number;
  roundsLost: number;
  adr: number;
  acs?: number;
  rating?: number;
}

export interface League {
  id: string;
  name: string;
  inviteCode: string;
  status: LeagueStatus;
  creatorId: string;
  rosterSize: number;
  draftPickTime: number;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
}

export interface LeagueMember {
  id: string;
  userId: string;
  name: string;
  image?: string;
  joinedAt: string;
  isCreator: boolean;
  isReady: boolean;
}

export interface DraftPick {
  id: string;
  userId: string;
  userName: string;
  playerId: string;
  playerName: string;
  playerTeam: string;
  playerRole: PlayerRole;
  playerRegion: Region;
  round: number;
  pickNumber: number;
  isCaptain: boolean;
  pickedAt: string;
}

export interface DraftState {
  id: string;
  leagueId: string;
  status: DraftStatus;
  currentRound: number;
  currentPickIndex: number;
  draftOrder: string[];
  picks: DraftPick[];
  startedAt?: string;
  completedAt?: string;
}

export interface RosterPlayer {
  id: string;
  player: Player;
  isCaptain: boolean;
  slotType: SlotType;
  isActive: boolean;
  isStarPlayer: boolean;
  starCooldownWeeksLeft: number;
  weeklyPoints?: number;
}

export interface StandingsEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage?: string;
  totalPoints: number;
  weeklyPoints: number;
  trend: 'up' | 'down' | 'same';
  roster?: RosterPlayer[];
}

export interface WeeklyScore {
  weekNumber: number;
  totalPoints: number;
  playerScores: {
    playerId: string;
    playerName: string;
    baseScore: number;
    multiplier: number;
    finalScore: number;
    designation: PlayerDesignation;
  }[];
}

// === MOCK PLAYERS ===

export const MOCK_PLAYERS: Player[] = [
  // Americas
  { id: 'p1', name: 'aspas', team: 'LOUD', region: 'Americas', role: 'Duelist' },
  { id: 'p2', name: 'Less', team: 'LOUD', region: 'Americas', role: 'Initiator' },
  { id: 'p3', name: 'tuyz', team: 'LOUD', region: 'Americas', role: 'Controller' },
  { id: 'p4', name: 'cauanzin', team: 'LOUD', region: 'Americas', role: 'Sentinel' },
  { id: 'p5', name: 'TenZ', team: 'Sentinels', region: 'Americas', role: 'Duelist' },
  { id: 'p6', name: 'zekken', team: 'Sentinels', region: 'Americas', role: 'Duelist' },
  { id: 'p7', name: 'Sacy', team: 'Sentinels', region: 'Americas', role: 'Initiator' },
  { id: 'p8', name: 'johnqt', team: 'Sentinels', region: 'Americas', role: 'Controller' },
  { id: 'p9', name: 'Demon1', team: 'Evil Geniuses', region: 'Americas', role: 'Duelist' },
  { id: 'p10', name: 'Boostio', team: 'Evil Geniuses', region: 'Americas', role: 'Controller' },
  { id: 'p11', name: 'supamen', team: 'NRG', region: 'Americas', role: 'Sentinel' },
  { id: 'p12', name: 'crashies', team: 'NRG', region: 'Americas', role: 'Initiator' },
  { id: 'p13', name: 'FNS', team: 'NRG', region: 'Americas', role: 'Controller' },
  { id: 'p14', name: 'Victor', team: 'NRG', region: 'Americas', role: 'Duelist' },
  { id: 'p15', name: 'Ethan', team: 'NRG', region: 'Americas', role: 'Initiator' },

  // Pacific
  { id: 'p16', name: 'PRX something', team: 'Paper Rex', region: 'Pacific', role: 'Duelist' },
  { id: 'p17', name: 'f0rsakeN', team: 'Paper Rex', region: 'Pacific', role: 'Duelist' },
  { id: 'p18', name: 'Jinggg', team: 'Paper Rex', region: 'Pacific', role: 'Duelist' },
  { id: 'p19', name: 'd4v41', team: 'Paper Rex', region: 'Pacific', role: 'Initiator' },
  { id: 'p20', name: 'Mindfreak', team: 'Paper Rex', region: 'Pacific', role: 'Controller' },
  { id: 'p21', name: 'MaKo', team: 'DRX', region: 'Pacific', role: 'Controller' },
  { id: 'p22', name: 'Rb', team: 'DRX', region: 'Pacific', role: 'Duelist' },
  { id: 'p23', name: 'stax', team: 'DRX', region: 'Pacific', role: 'Initiator' },
  { id: 'p24', name: 'BuZz', team: 'DRX', region: 'Pacific', role: 'Sentinel' },
  { id: 'p25', name: 'Laz', team: 'ZETA DIVISION', region: 'Pacific', role: 'Duelist' },
  { id: 'p26', name: 'SugarZ3ro', team: 'ZETA DIVISION', region: 'Pacific', role: 'Controller' },

  // EMEA
  { id: 'p27', name: 'Leo', team: 'Fnatic', region: 'EMEA', role: 'Initiator' },
  { id: 'p28', name: 'Derke', team: 'Fnatic', region: 'EMEA', role: 'Duelist' },
  { id: 'p29', name: 'Boaster', team: 'Fnatic', region: 'EMEA', role: 'Controller' },
  { id: 'p30', name: 'Alfajer', team: 'Fnatic', region: 'EMEA', role: 'Duelist' },
  { id: 'p31', name: 'Chronicle', team: 'Fnatic', region: 'EMEA', role: 'Sentinel' },
  { id: 'p32', name: 'cNed', team: 'Natus Vincere', region: 'EMEA', role: 'Duelist' },
  { id: 'p33', name: 'Ange1', team: 'Natus Vincere', region: 'EMEA', role: 'Controller' },
  { id: 'p34', name: 'Shao', team: 'Natus Vincere', region: 'EMEA', role: 'Initiator' },
  { id: 'p35', name: 'ANGE1', team: 'Team Vitality', region: 'EMEA', role: 'Controller' },
  { id: 'p36', name: 'Sayf', team: 'Team Vitality', region: 'EMEA', role: 'Sentinel' },
  { id: 'p37', name: 'nAts', team: 'Team Liquid', region: 'EMEA', role: 'Sentinel' },

  // China
  { id: 'p38', name: 'ZmjjKK', team: 'EDward Gaming', region: 'China', role: 'Duelist' },
  { id: 'p39', name: 'nobody', team: 'EDward Gaming', region: 'China', role: 'Controller' },
  { id: 'p40', name: 'Haodong', team: 'EDward Gaming', region: 'China', role: 'Initiator' },
  { id: 'p41', name: 'CHICHOO', team: 'EDward Gaming', region: 'China', role: 'Sentinel' },
  { id: 'p42', name: 'rin', team: 'FunPlus Phoenix', region: 'China', role: 'Duelist' },
  { id: 'p43', name: 'Lysoar', team: 'FunPlus Phoenix', region: 'China', role: 'Controller' },
  { id: 'p44', name: 'BERSERKER', team: 'FunPlus Phoenix', region: 'China', role: 'Initiator' },
  { id: 'p45', name: 'Nizhaolong', team: 'Bilibili Gaming', region: 'China', role: 'Duelist' },
  { id: 'p46', name: 'whzy', team: 'Bilibili Gaming', region: 'China', role: 'Sentinel' },
  { id: 'p47', name: 'SkRossi', team: 'Global Esports', region: 'Pacific', role: 'Duelist' },
  { id: 'p48', name: 'Monyet', team: 'Team Secret', region: 'Pacific', role: 'Initiator' },
];

// Generate random stats for a player
function randomStats(): PlayerMatchStats {
  return {
    kills: Math.floor(Math.random() * 25) + 5,
    deaths: Math.floor(Math.random() * 18) + 5,
    assists: Math.floor(Math.random() * 12) + 1,
    firstKills: Math.floor(Math.random() * 8),
    firstDeaths: Math.floor(Math.random() * 6),
    roundsWon: 0,
    roundsLost: 0,
    adr: Math.floor(Math.random() * 80) + 110,
    acs: Math.floor(Math.random() * 100) + 150,
    rating: parseFloat((Math.random() * 0.6 + 0.8).toFixed(2)),
  };
}

function calculateFantasyPoints(stats: PlayerMatchStats, designation: PlayerDesignation): number {
  const base =
    stats.kills * 10 +
    stats.deaths * -5 +
    stats.assists * 5 +
    stats.firstKills * 10 +
    stats.firstDeaths * -10 +
    stats.roundsWon * 5 +
    stats.roundsLost * -5 +
    stats.adr / 10;

  const multiplier = designation === 'captain' ? 2 : designation === 'star' ? 3 : 1;
  return Math.round(base * multiplier * 10) / 10;
}

// === MOCK PLAYERS WITH STATS (for roster views) ===

export function getMockPlayersWithStats(playerIds: string[], captainId: string, starId?: string): PlayerWithStats[] {
  return playerIds.map((id) => {
    const player = MOCK_PLAYERS.find((p) => p.id === id);
    if (!player) throw new Error(`Player ${id} not found`);
    const designation: PlayerDesignation = id === starId ? 'star' : id === captainId ? 'captain' : 'normal';
    const stats = randomStats();
    return {
      ...player,
      stats,
      fantasyPoints: calculateFantasyPoints(stats, designation),
      designation,
      isActive: true,
      starCooldownWeeksLeft: 0,
    };
  });
}

// === MOCK CURRENT USER ===

export const MOCK_USER = {
  id: 'user1',
  name: 'AcePlayer',
  email: 'ace@example.com',
  image: undefined,
};

// === MOCK LEAGUES ===

export const MOCK_LEAGUES: League[] = [
  {
    id: 'league1',
    name: 'Radiant Rivals',
    inviteCode: 'RAD1ANTE',
    status: 'ACTIVE',
    creatorId: 'user1',
    rosterSize: 10,
    draftPickTime: 60,
    memberCount: 4,
    maxMembers: 8,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'league2',
    name: 'VCT Champions',
    inviteCode: 'CH4MP10N',
    status: 'SETUP',
    creatorId: 'user2',
    rosterSize: 8,
    draftPickTime: 45,
    memberCount: 3,
    maxMembers: 6,
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'league3',
    name: 'Iron Lobby',
    inviteCode: 'IR0NL0BY',
    status: 'DRAFTING',
    creatorId: 'user1',
    rosterSize: 10,
    draftPickTime: 90,
    memberCount: 6,
    maxMembers: 8,
    createdAt: '2026-03-10T00:00:00Z',
  },
];

// === MOCK LEAGUE MEMBERS ===

export const MOCK_LEAGUE_MEMBERS: LeagueMember[] = [
  { id: 'lm1', userId: 'user1', name: 'AcePlayer', joinedAt: '2026-02-01T00:00:00Z', isCreator: true, isReady: true },
  { id: 'lm2', userId: 'user2', name: 'PhoenixRush', joinedAt: '2026-02-02T00:00:00Z', isCreator: false, isReady: true },
  { id: 'lm3', userId: 'user3', name: 'JettSetGo', joinedAt: '2026-02-03T00:00:00Z', isCreator: false, isReady: false },
  { id: 'lm4', userId: 'user4', name: 'SageAdvice', joinedAt: '2026-02-04T00:00:00Z', isCreator: false, isReady: true },
  { id: 'lm5', userId: 'user5', name: 'ViperStrike', joinedAt: '2026-02-05T00:00:00Z', isCreator: false, isReady: false },
  { id: 'lm6', userId: 'user6', name: 'OmenShadow', joinedAt: '2026-02-06T00:00:00Z', isCreator: false, isReady: true },
];

// === MOCK DRAFT STATE ===

export const MOCK_DRAFT_PICKS: DraftPick[] = [
  { id: 'dp1', userId: 'user1', userName: 'AcePlayer', playerId: 'p5', playerName: 'TenZ', playerTeam: 'Sentinels', playerRole: 'Duelist', playerRegion: 'Americas', round: 1, pickNumber: 1, isCaptain: true, pickedAt: '2026-03-15T12:00:00Z' },
  { id: 'dp2', userId: 'user2', userName: 'PhoenixRush', playerId: 'p1', playerName: 'aspas', playerTeam: 'LOUD', playerRole: 'Duelist', playerRegion: 'Americas', round: 1, pickNumber: 2, isCaptain: true, pickedAt: '2026-03-15T12:01:00Z' },
  { id: 'dp3', userId: 'user3', userName: 'JettSetGo', playerId: 'p28', playerName: 'Derke', playerTeam: 'Fnatic', playerRole: 'Duelist', playerRegion: 'EMEA', round: 1, pickNumber: 3, isCaptain: true, pickedAt: '2026-03-15T12:02:00Z' },
  { id: 'dp4', userId: 'user4', userName: 'SageAdvice', playerId: 'p38', playerName: 'ZmjjKK', playerTeam: 'EDward Gaming', playerRole: 'Duelist', playerRegion: 'China', round: 1, pickNumber: 4, isCaptain: true, pickedAt: '2026-03-15T12:03:00Z' },
  // Round 2 (snake - reverse)
  { id: 'dp5', userId: 'user4', userName: 'SageAdvice', playerId: 'p27', playerName: 'Leo', playerTeam: 'Fnatic', playerRole: 'Initiator', playerRegion: 'EMEA', round: 2, pickNumber: 5, isCaptain: false, pickedAt: '2026-03-15T12:04:00Z' },
  { id: 'dp6', userId: 'user3', userName: 'JettSetGo', playerId: 'p19', playerName: 'd4v41', playerTeam: 'Paper Rex', playerRole: 'Initiator', playerRegion: 'Pacific', round: 2, pickNumber: 6, isCaptain: false, pickedAt: '2026-03-15T12:05:00Z' },
  { id: 'dp7', userId: 'user2', userName: 'PhoenixRush', playerId: 'p7', playerName: 'Sacy', playerTeam: 'Sentinels', playerRole: 'Initiator', playerRegion: 'Americas', round: 2, pickNumber: 7, isCaptain: false, pickedAt: '2026-03-15T12:06:00Z' },
  { id: 'dp8', userId: 'user1', userName: 'AcePlayer', playerId: 'p34', playerName: 'Shao', playerTeam: 'Natus Vincere', playerRole: 'Initiator', playerRegion: 'EMEA', round: 2, pickNumber: 8, isCaptain: false, pickedAt: '2026-03-15T12:07:00Z' },
];

export const MOCK_DRAFT_STATE: DraftState = {
  id: 'draft1',
  leagueId: 'league3',
  status: 'IN_PROGRESS',
  currentRound: 3,
  currentPickIndex: 0,
  draftOrder: ['user1', 'user2', 'user3', 'user4'],
  picks: MOCK_DRAFT_PICKS,
  startedAt: '2026-03-15T12:00:00Z',
};

// === MOCK ROSTER ===

export const MOCK_ROSTER_PLAYERS: RosterPlayer[] = [
  // Active lineup
  { id: 'rp1', player: MOCK_PLAYERS[4], isCaptain: true, slotType: 'Duelist', isActive: true, isStarPlayer: false, starCooldownWeeksLeft: 0, weeklyPoints: 187.5 },
  { id: 'rp2', player: MOCK_PLAYERS[33], isCaptain: false, slotType: 'Initiator', isActive: true, isStarPlayer: true, starCooldownWeeksLeft: 0, weeklyPoints: 234.0 },
  { id: 'rp3', player: MOCK_PLAYERS[28], isCaptain: false, slotType: 'Controller', isActive: true, isStarPlayer: false, starCooldownWeeksLeft: 0, weeklyPoints: 89.2 },
  { id: 'rp4', player: MOCK_PLAYERS[37], isCaptain: false, slotType: 'Duelist', isActive: true, isStarPlayer: false, starCooldownWeeksLeft: 0, weeklyPoints: 145.8 },
  { id: 'rp5', player: MOCK_PLAYERS[23], isCaptain: false, slotType: 'Sentinel', isActive: true, isStarPlayer: false, starCooldownWeeksLeft: 0, weeklyPoints: 112.3 },
  // Bench
  { id: 'rp6', player: MOCK_PLAYERS[10], isCaptain: false, slotType: 'Sentinel', isActive: false, isStarPlayer: false, starCooldownWeeksLeft: 2, weeklyPoints: undefined },
  { id: 'rp7', player: MOCK_PLAYERS[20], isCaptain: false, slotType: 'Controller', isActive: false, isStarPlayer: false, starCooldownWeeksLeft: 0, weeklyPoints: undefined },
  { id: 'rp8', player: MOCK_PLAYERS[39], isCaptain: false, slotType: 'Initiator', isActive: false, isStarPlayer: false, starCooldownWeeksLeft: 1, weeklyPoints: undefined },
  { id: 'rp9', player: MOCK_PLAYERS[17], isCaptain: false, slotType: 'Wildcard', isActive: false, isStarPlayer: false, starCooldownWeeksLeft: 0, weeklyPoints: undefined },
  { id: 'rp10', player: MOCK_PLAYERS[44], isCaptain: false, slotType: 'Wildcard', isActive: false, isStarPlayer: false, starCooldownWeeksLeft: 0, weeklyPoints: undefined },
];

// === MOCK STANDINGS ===

export const MOCK_STANDINGS: StandingsEntry[] = [
  { rank: 1, userId: 'user1', userName: 'AcePlayer', totalPoints: 1247.5, weeklyPoints: 768.8, trend: 'up' },
  { rank: 2, userId: 'user2', userName: 'PhoenixRush', totalPoints: 1189.2, weeklyPoints: 652.1, trend: 'same' },
  { rank: 3, userId: 'user3', userName: 'JettSetGo', totalPoints: 1034.8, weeklyPoints: 701.4, trend: 'up' },
  { rank: 4, userId: 'user4', userName: 'SageAdvice', totalPoints: 998.3, weeklyPoints: 589.7, trend: 'down' },
  { rank: 5, userId: 'user5', userName: 'ViperStrike', totalPoints: 876.1, weeklyPoints: 512.3, trend: 'down' },
  { rank: 6, userId: 'user6', userName: 'OmenShadow', totalPoints: 745.9, weeklyPoints: 478.6, trend: 'same' },
];

// === MOCK WEEKLY SCORES ===

export const MOCK_WEEKLY_SCORES: WeeklyScore[] = [
  {
    weekNumber: 1,
    totalPoints: 478.7,
    playerScores: [
      { playerId: 'p5', playerName: 'TenZ', baseScore: 93.75, multiplier: 2, finalScore: 187.5, designation: 'captain' },
      { playerId: 'p34', playerName: 'Shao', baseScore: 78.0, multiplier: 3, finalScore: 234.0, designation: 'star' },
      { playerId: 'p29', playerName: 'Boaster', baseScore: 89.2, multiplier: 1, finalScore: 89.2, designation: 'normal' },
      { playerId: 'p38', playerName: 'ZmjjKK', baseScore: 145.8, multiplier: 1, finalScore: 145.8, designation: 'normal' },
      { playerId: 'p24', playerName: 'BuZz', baseScore: 112.3, multiplier: 1, finalScore: 112.3, designation: 'normal' },
    ],
  },
  {
    weekNumber: 2,
    totalPoints: 768.8,
    playerScores: [
      { playerId: 'p5', playerName: 'TenZ', baseScore: 110.2, multiplier: 2, finalScore: 220.4, designation: 'captain' },
      { playerId: 'p34', playerName: 'Shao', baseScore: 92.1, multiplier: 1, finalScore: 92.1, designation: 'normal' },
      { playerId: 'p29', playerName: 'Boaster', baseScore: 76.5, multiplier: 3, finalScore: 229.5, designation: 'star' },
      { playerId: 'p38', playerName: 'ZmjjKK', baseScore: 134.6, multiplier: 1, finalScore: 134.6, designation: 'normal' },
      { playerId: 'p24', playerName: 'BuZz', baseScore: 92.2, multiplier: 1, finalScore: 92.2, designation: 'normal' },
    ],
  },
];
