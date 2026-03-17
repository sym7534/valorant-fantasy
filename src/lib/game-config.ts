/**
 * @file game-config.ts
 * @description THE single source of truth for all VCT Fantasy League game rules.
 *
 * Every scoring weight, roster constraint, draft parameter, and game constant
 * lives in this file. Other agents (Backend, Frontend) MUST import from here
 * and NEVER hardcode game values elsewhere.
 *
 * Owner: Lead / Game Designer Agent
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * The four VCT competitive regions.
 * Each region has roughly 60 players in the pro pool.
 */
export type Region = 'Americas' | 'Pacific' | 'EMEA' | 'China';

/**
 * The four Valorant agent roles that map to roster slot types.
 */
export type PlayerRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';

/**
 * Roster slot types — the four roles plus a flexible Wildcard slot.
 * During the draft, role-specific slots must be filled with matching roles,
 * while Wildcard slots accept any role.
 */
export type SlotType = PlayerRole | 'Wildcard';

/**
 * Lifecycle states of a league.
 * - SETUP: League created, waiting for members / draft start.
 * - DRAFTING: Snake draft is in progress.
 * - ACTIVE: Draft complete, weekly play is underway.
 * - COMPLETED: Season has ended.
 */
export type LeagueStatus = 'SETUP' | 'DRAFTING' | 'ACTIVE' | 'COMPLETED';

/**
 * Lifecycle states of a draft within a league.
 * - WAITING: Draft has not started yet.
 * - IN_PROGRESS: Draft is actively accepting picks.
 * - COMPLETE: All picks have been made.
 */
export type DraftStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETE';

/**
 * A player's designation on a roster, which determines their scoring multiplier.
 * - captain: Permanent 2x multiplier (determined by Round 1 draft pick).
 * - star: Temporary 3x multiplier for one week, with a 2-week cooldown after.
 * - normal: Default 1x multiplier.
 */
export type PlayerDesignation = 'captain' | 'star' | 'normal';

/**
 * Weights used to compute the base fantasy score from raw match stats.
 * The formula:
 *   BaseScore = (kills * kills_w) + (deaths * deaths_w) + (assists * assists_w)
 *            + (firstKills * firstKills_w) + (firstDeaths * firstDeaths_w)
 *            + (roundsWon * roundsWon_w) + (roundsLost * roundsLost_w)
 *            + (adr / adrDivisor)
 */
export interface ScoringWeights {
  /** Points per kill (+10) */
  kills: number;
  /** Points per death (-5, stored as negative) */
  deaths: number;
  /** Points per assist (+5) */
  assists: number;
  /** Points per first kill (+10) */
  firstKills: number;
  /** Points per first death (-10, stored as negative) */
  firstDeaths: number;
  /** Points per round won (+5) */
  roundsWon: number;
  /** Points per round lost (-5, stored as negative) */
  roundsLost: number;
  /** ADR is divided by this value (10) */
  adrDivisor: number;
}

/**
 * Raw match statistics for a single player in a single match.
 * Used as input to the scoring function.
 * RoundsWon and RoundsLost default to 0 for MVP since the scraper
 * does not capture them yet.
 */
export interface PlayerMatchStats {
  /** Total kills in the match */
  kills: number;
  /** Total deaths in the match */
  deaths: number;
  /** Total assists in the match */
  assists: number;
  /** First kills (opening kills / first bloods) */
  firstKills: number;
  /** First deaths (dying first in a round) */
  firstDeaths: number;
  /** Rounds won by the player's team (default 0 for MVP) */
  roundsWon: number;
  /** Rounds lost by the player's team (default 0 for MVP) */
  roundsLost: number;
  /** Average Damage per Round */
  adr: number;
}

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

/**
 * Official scoring weights for fantasy point calculation.
 *
 * Formula: (Kills x 10) - (Deaths x 5) + (Assists x 5)
 *        + (FK x 10) - (FD x 10) + (RW x 5) - (RL x 5) + (ADR / 10)
 */
export const SCORING_WEIGHTS: ScoringWeights = {
  kills: 10,
  deaths: -5,
  assists: 5,
  firstKills: 10,
  firstDeaths: -10,
  roundsWon: 5,
  roundsLost: -5,
  adrDivisor: 10,
} as const;

/**
 * Captain multiplier — permanent 2x for the entire season.
 * Determined by the Round 1 draft pick.
 */
export const CAPTAIN_MULTIPLIER: number = 2;

/**
 * Star Player multiplier — 3x for one week only.
 * Star overrides Captain (3x, NOT 6x) when a Captain is also starred.
 */
export const STAR_PLAYER_MULTIPLIER: number = 3;

/**
 * Number of weeks a player must wait after being starred before
 * they can be starred again. During cooldown they can still play
 * in the active lineup at their normal multiplier (1x or 2x for Captain).
 */
export const STAR_PLAYER_COOLDOWN_WEEKS: number = 2;

// ============================================================================
// PLAYER POOL CONSTANTS
// ============================================================================

/**
 * The four VCT competitive regions, in display order.
 */
export const REGIONS: readonly Region[] = [
  'Americas',
  'Pacific',
  'EMEA',
  'China',
] as const;

/**
 * The four Valorant agent roles, in display order.
 */
export const PLAYER_ROLES: readonly PlayerRole[] = [
  'Duelist',
  'Initiator',
  'Controller',
  'Sentinel',
] as const;

/**
 * Total number of VCT pro players in the fantasy pool.
 * Distributed roughly 60 per region.
 */
export const TOTAL_PRO_POOL_SIZE: number = 240;

// ============================================================================
// ROSTER & DRAFT CONSTANTS
// ============================================================================

/**
 * Role slot distribution for each supported roster size.
 *
 * - 10: 2D / 2I / 2C / 2S / 2W
 * - 9:  2D / 2I / 2C / 2S / 1W
 * - 8:  2D / 2I / 2C / 2S / 0W
 * - 7:  2D / 2I / 2C / 1S / 0W (Sentinel reduced by 1)
 */
export const ROLE_SLOTS_BY_ROSTER_SIZE: Record<number, Record<SlotType, number>> = {
  10: { Duelist: 2, Initiator: 2, Controller: 2, Sentinel: 2, Wildcard: 2 },
  9:  { Duelist: 2, Initiator: 2, Controller: 2, Sentinel: 2, Wildcard: 1 },
  8:  { Duelist: 2, Initiator: 2, Controller: 2, Sentinel: 2, Wildcard: 0 },
  7:  { Duelist: 2, Initiator: 2, Controller: 2, Sentinel: 1, Wildcard: 0 },
} as const;

/**
 * Minimum number of players required from each of the 4 regions.
 * For a 10-player roster this uses 8 of 10 slots; the remaining 2 are flexible.
 */
export const REGION_MIN_PER: number = 2;

/**
 * Number of players in the active lineup each week.
 * No role or region constraints apply to the active lineup
 * (constraints are draft-only).
 */
export const ACTIVE_LINEUP_SIZE: number = 5;

/** Default roster size when creating a league. */
export const DEFAULT_ROSTER_SIZE: number = 10;

/** Minimum configurable roster size. */
export const MIN_ROSTER_SIZE: number = 7;

/** Maximum configurable roster size. */
export const MAX_ROSTER_SIZE: number = 10;

/**
 * The draft round in which the Captain is selected.
 * Round 1 pick automatically becomes the permanent Captain (2x multiplier).
 */
export const CAPTAIN_ROUND: number = 1;

// ============================================================================
// LEAGUE CONSTANTS
// ============================================================================

/** Minimum number of members required in a league (creator + at least 1 other). */
export const MIN_LEAGUE_SIZE: number = 2;

/** Maximum number of members allowed in a league. */
export const MAX_LEAGUE_SIZE: number = 12;

/** Maximum character length for a league name. */
export const LEAGUE_NAME_MAX_LENGTH: number = 50;

/** Length of the auto-generated league invite code (alphanumeric, case-insensitive). */
export const INVITE_CODE_LENGTH: number = 8;

// ============================================================================
// DRAFT TIMER CONSTANTS
// ============================================================================

/**
 * Available draft pick timer durations in seconds.
 * Configurable per league at creation time.
 */
export const DRAFT_TIMER_OPTIONS: readonly number[] = [30, 45, 60, 90, 120] as const;

/**
 * Default draft pick timer in seconds.
 * Used when the league creator does not specify a custom timer.
 */
export const DEFAULT_DRAFT_TIMER: number = 60;

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculates the base (unmultiplied) fantasy score for a player's match performance.
 *
 * Formula: (Kills x 10) + (Deaths x -5) + (Assists x 5)
 *        + (FirstKills x 10) + (FirstDeaths x -10)
 *        + (RoundsWon x 5) + (RoundsLost x -5)
 *        + (ADR / 10)
 *
 * @param stats - Raw match statistics for one player in one match.
 * @returns The base fantasy score (before any captain/star multiplier).
 *
 * @example
 * ```ts
 * const score = calculateBaseScore({
 *   kills: 20, deaths: 15, assists: 5,
 *   firstKills: 3, firstDeaths: 2,
 *   roundsWon: 0, roundsLost: 0, adr: 160
 * });
 * // = (20*10) + (15*-5) + (5*5) + (3*10) + (2*-10) + (0*5) + (0*-5) + (160/10)
 * // = 200 - 75 + 25 + 30 - 20 + 0 + 0 + 16
 * // = 176
 * ```
 */
export function calculateBaseScore(stats: PlayerMatchStats): number {
  const w = SCORING_WEIGHTS;
  return (
    stats.kills * w.kills +
    stats.deaths * w.deaths +
    stats.assists * w.assists +
    stats.firstKills * w.firstKills +
    stats.firstDeaths * w.firstDeaths +
    stats.roundsWon * w.roundsWon +
    stats.roundsLost * w.roundsLost +
    stats.adr / w.adrDivisor
  );
}

/**
 * Applies the appropriate scoring multiplier based on the player's designation.
 *
 * - captain: 2x (permanent for the entire season)
 * - star: 3x (one week only; star OVERRIDES captain, does NOT stack to 6x)
 * - normal: 1x
 *
 * @param baseScore - The unmultiplied fantasy score from {@link calculateBaseScore}.
 * @param designation - The player's current designation for the scoring period.
 * @returns The final multiplied fantasy score.
 *
 * @example
 * ```ts
 * applyMultiplier(100, 'captain') // => 200
 * applyMultiplier(100, 'star')    // => 300
 * applyMultiplier(100, 'normal')  // => 100
 * ```
 */
export function applyMultiplier(baseScore: number, designation: PlayerDesignation): number {
  switch (designation) {
    case 'star':
      return baseScore * STAR_PLAYER_MULTIPLIER;
    case 'captain':
      return baseScore * CAPTAIN_MULTIPLIER;
    case 'normal':
      return baseScore;
  }
}
