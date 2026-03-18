import { Prisma, type LeagueMember, type PlayerRole, type Roster, type SlotType } from '@prisma/client';
import { prisma } from '@/src/lib/prisma';
import {
  CAPTAIN_ROUND,
  MIN_LEAGUE_SIZE,
  REGION_MIN_PER,
  REGIONS,
  ROLE_SLOTS_BY_ROSTER_SIZE,
} from '@/src/lib/game-config';
import type { Region } from '@/src/lib/game-config';
import type { DraftPickEntry, DraftStateResponse } from '@/src/lib/api-types';
import {
  buildDraftStateResponse,
  toDraftPickEntry,
} from '@/src/server/serializers';

const userSummarySelect = {
  id: true,
  name: true,
  image: true,
} satisfies Prisma.UserSelect;

const playerSummarySelect = {
  id: true,
  name: true,
  team: true,
  region: true,
  roles: true,
  imageUrl: true,
} satisfies Prisma.PlayerSelect;

const draftStateInclude = {
  picks: {
    include: {
      user: {
        select: userSummarySelect,
      },
      player: {
        select: playerSummarySelect,
      },
    },
    orderBy: {
      pickNumber: 'asc',
    },
  },
} satisfies Prisma.DraftStateInclude;

type DbClient = typeof prisma | Prisma.TransactionClient;

type HydratedDraftState = Prisma.DraftStateGetPayload<{
  include: typeof draftStateInclude;
}>;

export type DraftMutationResult = {
  draft: DraftStateResponse;
  pick: DraftPickEntry | null;
  skippedUserId: string | null;
  didComplete: boolean;
};

export function getCurrentPickerUserId(
  draftOrder: string[],
  round: number,
  pickIndex: number
): string {
  const isReverseRound = round % 2 === 0;

  if (isReverseRound) {
    return draftOrder[draftOrder.length - 1 - pickIndex];
  }

  return draftOrder[pickIndex];
}

export function getTurnNumber(round: number, pickIndex: number, memberCount: number): number {
  return (round - 1) * memberCount + pickIndex + 1;
}

function nextTurnExpiresAt(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

function getNextTurn(
  currentRound: number,
  currentPickIndex: number,
  memberCount: number,
  totalRounds: number
): {
  nextRound: number;
  nextPickIndex: number;
  didComplete: boolean;
} {
  let nextRound = currentRound;
  let nextPickIndex = currentPickIndex + 1;

  if (nextPickIndex >= memberCount) {
    nextRound += 1;
    nextPickIndex = 0;
  }

  if (nextRound > totalRounds) {
    return {
      nextRound: currentRound,
      nextPickIndex: currentPickIndex,
      didComplete: true,
    };
  }

  return {
    nextRound,
    nextPickIndex,
    didComplete: false,
  };
}

export function determineSlotType(
  rosterSize: number,
  playerRoles: PlayerRole[],
  existingSlotTypes: SlotType[]
): SlotType | null {
  const slotConfig = ROLE_SLOTS_BY_ROSTER_SIZE[rosterSize];
  const filledCounts = existingSlotTypes.reduce<Record<SlotType, number>>(
    (counts, slotType) => {
      counts[slotType] += 1;
      return counts;
    },
    {
      Duelist: 0,
      Initiator: 0,
      Controller: 0,
      Sentinel: 0,
      Wildcard: 0,
    }
  );

  // Try each of the player's roles for a native slot fit
  for (const role of playerRoles) {
    if (filledCounts[role] < slotConfig[role]) {
      return role;
    }
  }

  // Fall back to a wildcard slot
  if (filledCounts.Wildcard < slotConfig.Wildcard) {
    return 'Wildcard';
  }

  // No valid slot — reject this pick
  return null;
}

/**
 * Validates that a draft pick doesn't violate region minimum constraints.
 * Checks whether, after this pick, it's still possible to reach the minimum
 * 2 players per region with the remaining picks.
 */
export function validateRegionConstraint(
  rosterSize: number,
  candidateRegion: Region,
  existingPicks: Array<{ region: Region }>
): string | null {
  const picksAfterThis = existingPicks.length + 1;
  const remainingAfterThis = rosterSize - picksAfterThis;

  // Count regions already drafted (including the candidate)
  const regionCounts: Record<string, number> = {};
  for (const r of REGIONS) {
    regionCounts[r] = 0;
  }
  for (const pick of existingPicks) {
    regionCounts[pick.region] += 1;
  }
  regionCounts[candidateRegion] += 1;

  // How many more picks are needed to satisfy region minimums?
  let slotsNeededForRegions = 0;
  for (const r of REGIONS) {
    const deficit = REGION_MIN_PER - regionCounts[r];
    if (deficit > 0) {
      slotsNeededForRegions += deficit;
    }
  }

  if (slotsNeededForRegions > remainingAfterThis) {
    return `Picking another ${candidateRegion} player would make it impossible to meet the minimum ${REGION_MIN_PER} players per region requirement`;
  }

  return null;
}

async function fetchHydratedDraftState(
  client: DbClient,
  leagueId: string
): Promise<HydratedDraftState | null> {
  return client.draftState.findUnique({
    where: { leagueId },
    include: draftStateInclude,
  });
}

async function ensureLeagueMember(
  client: DbClient,
  leagueId: string,
  userId: string
): Promise<LeagueMember> {
  const membership = await client.leagueMember.findUnique({
    where: {
      leagueId_userId: {
        leagueId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error('Not a member of this league');
  }

  return membership;
}

async function getOrCreateRoster(
  tx: Prisma.TransactionClient,
  membershipId: string,
  leagueId: string
): Promise<Roster> {
  const existingRoster = await tx.roster.findUnique({
    where: {
      leagueMemberId: membershipId,
    },
  });

  if (existingRoster) {
    return existingRoster;
  }

  return tx.roster.create({
    data: {
      leagueMemberId: membershipId,
      leagueId,
    },
  });
}

export async function getDraftStateResponse(leagueId: string): Promise<DraftStateResponse | null> {
  const draftState = await fetchHydratedDraftState(prisma, leagueId);
  return draftState ? buildDraftStateResponse(draftState) : null;
}

export async function startDraft(
  leagueId: string,
  userId: string
): Promise<DraftStateResponse> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      members: {
        orderBy: { joinedAt: 'asc' },
      },
      draft: true,
    },
  });

  if (!league) {
    throw new Error('League not found');
  }

  if (league.creatorId !== userId) {
    throw new Error('Only the league creator can start the draft');
  }

  if (league.status !== 'SETUP') {
    throw new Error('Draft has already started');
  }

  if (league.members.length < MIN_LEAGUE_SIZE) {
    throw new Error(`At least ${MIN_LEAGUE_SIZE} members are required to start the draft`);
  }

  const draftOrder = league.members.map((member) => member.userId);
  for (let index = draftOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [draftOrder[index], draftOrder[swapIndex]] = [draftOrder[swapIndex], draftOrder[index]];
  }

  await prisma.$transaction(async (tx) => {
    await tx.league.update({
      where: { id: leagueId },
      data: { status: 'DRAFTING' },
    });

    if (league.draft) {
      await tx.draftPick.deleteMany({
        where: {
          draftStateId: league.draft.id,
        },
      });

      await tx.draftState.update({
        where: { id: league.draft.id },
        data: {
          status: 'IN_PROGRESS',
          currentRound: 1,
          currentPickIndex: 0,
          draftOrder,
          startedAt: new Date(),
          completedAt: null,
          turnExpiresAt: nextTurnExpiresAt(league.draftPickTime),
        },
      });
    } else {
      await tx.draftState.create({
        data: {
          leagueId,
          status: 'IN_PROGRESS',
          currentRound: 1,
          currentPickIndex: 0,
          draftOrder,
          startedAt: new Date(),
          turnExpiresAt: nextTurnExpiresAt(league.draftPickTime),
        },
      });
    }
  });

  const draftState = await fetchHydratedDraftState(prisma, leagueId);
  if (!draftState) {
    throw new Error('Failed to start the draft');
  }

  return buildDraftStateResponse(draftState);
}

export async function makeDraftPick(
  leagueId: string,
  userId: string,
  playerId: string
): Promise<DraftMutationResult> {
  await ensureLeagueMember(prisma, leagueId, userId);

  const draftState = await fetchHydratedDraftState(prisma, leagueId);
  if (!draftState || draftState.status !== 'IN_PROGRESS') {
    throw new Error('Draft is not currently active');
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  if (!league) {
    throw new Error('League not found');
  }

  const currentPickerUserId = getCurrentPickerUserId(
    draftState.draftOrder as string[],
    draftState.currentRound,
    draftState.currentPickIndex
  );
  const draftOrder = draftState.draftOrder as string[];

  if (currentPickerUserId !== userId) {
    throw new Error('It is not your turn to pick');
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: playerSummarySelect,
  });

  if (!player) {
    throw new Error('Player not found');
  }

  if (draftState.picks.some((pick) => pick.playerId === playerId)) {
    throw new Error('That player has already been drafted');
  }

  const userPicks = draftState.picks.filter((pick) => pick.userId === userId);
  const existingSlotTypes = userPicks.map((pick) => pick.slotType);
  const playerRoles = player.roles as PlayerRole[];
  const slotType = determineSlotType(league.rosterSize, playerRoles, existingSlotTypes);

  if (slotType === null) {
    throw new Error(`No available roster slot for ${playerRoles.join('/')}. Try picking a different role.`);
  }

  const existingRegionPicks = userPicks.map((pick) => ({ region: pick.player.region as Region }));
  const regionError = validateRegionConstraint(league.rosterSize, player.region as Region, existingRegionPicks);
  if (regionError) {
    throw new Error(regionError);
  }

  const pickNumber = getTurnNumber(
    draftState.currentRound,
    draftState.currentPickIndex,
    draftOrder.length
  );
  const isCaptain = draftState.currentRound === CAPTAIN_ROUND;
  const nextTurn = getNextTurn(
    draftState.currentRound,
    draftState.currentPickIndex,
    draftOrder.length,
    league.rosterSize
  );

  const createdPick = await prisma.$transaction(async (tx) => {
    const membership = await ensureLeagueMember(tx, leagueId, userId);
    const roster = await getOrCreateRoster(tx, membership.id, leagueId);

    const pick = await tx.draftPick.create({
      data: {
        draftStateId: draftState.id,
        userId,
        playerId,
        round: draftState.currentRound,
        pickNumber,
        isCaptain,
        slotType,
      },
      include: {
        user: {
          select: userSummarySelect,
        },
        player: {
          select: playerSummarySelect,
        },
      },
    });

    await tx.draftQueueEntry.deleteMany({
      where: {
        leagueId,
        playerId,
      },
    });

    await tx.rosterPlayer.create({
      data: {
        rosterId: roster.id,
        playerId,
        isCaptain,
        slotType,
      },
    });

    await tx.draftState.update({
      where: { id: draftState.id },
      data: nextTurn.didComplete
        ? {
            status: 'COMPLETE',
            completedAt: new Date(),
            turnExpiresAt: null,
          }
        : {
            currentRound: nextTurn.nextRound,
            currentPickIndex: nextTurn.nextPickIndex,
            turnExpiresAt: nextTurnExpiresAt(league.draftPickTime),
          },
    });

    if (nextTurn.didComplete) {
      await tx.league.update({
        where: { id: leagueId },
        data: {
          status: 'ACTIVE',
        },
      });
    }

    return pick;
  });

  const updatedDraft = await fetchHydratedDraftState(prisma, leagueId);
  if (!updatedDraft) {
    throw new Error('Failed to load updated draft state');
  }

  return {
    draft: buildDraftStateResponse(updatedDraft),
    pick: toDraftPickEntry(createdPick),
    skippedUserId: null,
    didComplete: nextTurn.didComplete,
  };
}

async function findQueuedPlayerId(
  tx: Prisma.TransactionClient,
  leagueId: string,
  userId: string,
  draftedPlayerIds: Set<string>,
  rosterSize: number,
  existingSlotTypes: SlotType[],
  existingRegionPicks: Array<{ region: Region }>
): Promise<string | null> {
  const queueEntries = await tx.draftQueueEntry.findMany({
    where: {
      leagueId,
      userId,
    },
    include: {
      player: {
        select: playerSummarySelect,
      },
    },
    orderBy: {
      priority: 'asc',
    },
  });

  for (const entry of queueEntries) {
    if (draftedPlayerIds.has(entry.playerId)) continue;

    const slotType = determineSlotType(rosterSize, entry.player.roles as PlayerRole[], existingSlotTypes);
    if (slotType === null) continue;

    const regionError = validateRegionConstraint(
      rosterSize,
      entry.player.region as Region,
      existingRegionPicks
    );
    if (regionError) continue;

    return entry.playerId;
  }

  return null;
}

export async function skipCurrentDraftTurn(leagueId: string): Promise<DraftMutationResult> {
  const draftState = await fetchHydratedDraftState(prisma, leagueId);
  if (!draftState || draftState.status !== 'IN_PROGRESS') {
    throw new Error('Draft is not currently active');
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  if (!league) {
    throw new Error('League not found');
  }

  const skippedUserId = getCurrentPickerUserId(
    draftState.draftOrder as string[],
    draftState.currentRound,
    draftState.currentPickIndex
  );
  const draftOrder = draftState.draftOrder as string[];
  const nextTurn = getNextTurn(
    draftState.currentRound,
    draftState.currentPickIndex,
    draftOrder.length,
    league.rosterSize
  );

  await prisma.$transaction(async (tx) => {
    await tx.draftState.update({
      where: { id: draftState.id },
      data: nextTurn.didComplete
        ? {
            status: 'COMPLETE',
            completedAt: new Date(),
            turnExpiresAt: null,
          }
        : {
            currentRound: nextTurn.nextRound,
            currentPickIndex: nextTurn.nextPickIndex,
            turnExpiresAt: nextTurnExpiresAt(league.draftPickTime),
          },
    });

    if (nextTurn.didComplete) {
      await tx.league.update({
        where: { id: leagueId },
        data: {
          status: 'ACTIVE',
        },
      });
    }
  });

  const updatedDraft = await fetchHydratedDraftState(prisma, leagueId);
  if (!updatedDraft) {
    throw new Error('Failed to load updated draft state');
  }

  return {
    draft: buildDraftStateResponse(updatedDraft),
    pick: null,
    skippedUserId,
    didComplete: nextTurn.didComplete,
  };
}

export async function autoResolveDraftTurn(leagueId: string): Promise<DraftMutationResult> {
  const draftState = await fetchHydratedDraftState(prisma, leagueId);
  if (!draftState || draftState.status !== 'IN_PROGRESS') {
    throw new Error('Draft is not currently active');
  }

  const currentPickerUserId = getCurrentPickerUserId(
    draftState.draftOrder as string[],
    draftState.currentRound,
    draftState.currentPickIndex
  );
  const draftedPlayerIds = new Set(draftState.picks.map((pick) => pick.playerId));
  const userPicks = draftState.picks.filter((pick) => pick.userId === currentPickerUserId);
  const existingSlotTypes = userPicks.map((pick) => pick.slotType);
  const existingRegionPicks = userPicks.map((pick) => ({ region: pick.player.region as Region }));

  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) {
    throw new Error('League not found');
  }

  const queuedPlayerId = await prisma.$transaction((tx) =>
    findQueuedPlayerId(
      tx, leagueId, currentPickerUserId, draftedPlayerIds,
      league.rosterSize, existingSlotTypes, existingRegionPicks
    )
  );

  if (queuedPlayerId) {
    return makeDraftPick(leagueId, currentPickerUserId, queuedPlayerId);
  }

  return skipCurrentDraftTurn(leagueId);
}
