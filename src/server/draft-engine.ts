import { Prisma, type LeagueMember, type PlayerRole, type Roster, type SlotType } from '@prisma/client';
import { prisma } from '@/src/lib/prisma';
import {
  CAPTAIN_ROUND,
  MIN_LEAGUE_SIZE,
  ROLE_SLOTS_BY_ROSTER_SIZE,
} from '@/src/lib/game-config';
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
  role: true,
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
  playerRole: PlayerRole,
  existingSlotTypes: SlotType[]
): SlotType {
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

  if (filledCounts[playerRole] < slotConfig[playerRole]) {
    return playerRole;
  }

  if (filledCounts.Wildcard < slotConfig.Wildcard) {
    return 'Wildcard';
  }

  for (const slotType of Object.keys(slotConfig) as SlotType[]) {
    if (filledCounts[slotType] < slotConfig[slotType]) {
      return slotType;
    }
  }

  return 'Wildcard';
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

  const existingSlotTypes = draftState.picks
    .filter((pick) => pick.userId === userId)
    .map((pick) => pick.slotType);
  const slotType = determineSlotType(league.rosterSize, player.role, existingSlotTypes);
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
  draftedPlayerIds: Set<string>
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
    if (!draftedPlayerIds.has(entry.playerId)) {
      return entry.playerId;
    }
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
  const queuedPlayerId = await prisma.$transaction((tx) =>
    findQueuedPlayerId(tx, leagueId, currentPickerUserId, draftedPlayerIds)
  );

  if (queuedPlayerId) {
    return makeDraftPick(leagueId, currentPickerUserId, queuedPlayerId);
  }

  return skipCurrentDraftTurn(leagueId);
}
