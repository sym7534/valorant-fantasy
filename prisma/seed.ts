import { PrismaClient, Region, PlayerRole, SlotType } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { ROLE_SLOTS_BY_ROSTER_SIZE } from '../src/lib/game-config';
import { saveLeagueWeekScores } from '../src/server/scoring-engine';

const prisma = new PrismaClient();
const MATCH_FILE_DIRECTORY = path.resolve(process.cwd(), '..', 'vlrScraper', 'vlrScraper');
const MATCH_FILES = ['match596400.json', 'match596401.json', 'match596402.json'] as const;
const ACTIVE_LEAGUE_MEMBER_COUNT = 2;
const ACTIVE_LEAGUE_ROSTER_SIZE = 7;
const ACTIVE_LEAGUE_WEEK = 1;

interface ParsedPlayerStats {
  name: string;
  rating: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  kast: number;
  adr: number;
  hsPercent: number;
  firstKills: number;
  firstDeaths: number;
}

const TEAMS_BY_REGION: Record<Region, string[]> = {
  Americas: [
    'Sentinels',
    'Cloud9',
    'NRG Esports',
    '100 Thieves',
    'Evil Geniuses',
    'LOUD',
    'FURIA',
    'MIBR',
    'Leviatan',
    'KRU Esports',
    'G2 Esports',
    '2Game Esports',
  ],
  Pacific: [
    'Paper Rex',
    'DRX',
    'T1',
    'Gen.G',
    'ZETA DIVISION',
    'DetonatioN FocusMe',
    'Team Secret',
    'Talon Esports',
    'Global Esports',
    'RRQ',
    'Nongshim RedForce',
    'Rex Regum Qeon',
  ],
  EMEA: [
    'Fnatic',
    'Team Vitality',
    'Team Heretics',
    'Karmine Corp',
    'NAVI',
    'FUT Esports',
    'BBL Esports',
    'Giants Gaming',
    'KOI',
    'Team Liquid',
    'Gentle Mates',
    'Apeks',
  ],
  China: [
    'EDward Gaming',
    'Bilibili Gaming',
    'FunPlus Phoenix',
    'Trace Esports',
    'Nova Esports',
    'Dragon Ranger Gaming',
    'All Gamers',
    'Wolves Esports',
    'JD Gaming',
    'Titan Esports',
    'Attacking Soul Esports',
    'Tyloo',
  ],
};

const PLAYER_NAMES_BY_REGION: Record<Region, string[]> = {
  Americas: [
    'TenZ', 'ShahZaM', 'SicK', 'dapr', 'zombs',
    'Asuna', 'bang', 'Cryocells', 'Ethan', 'Boostio',
    'FNS', 's0m', 'crashies', 'Victor', 'Marved',
    'aspas', 'Less', 'tuyz', 'cauanzin', 'pANcada',
    'Sacy', 'dgzin', 'mazin', 'frz', 'havoc',
    'artzin', 'koalanoob', 'alym', 'eeiu', 'nerve',
    'mta', 'infiltrator', 'NagZ', 'benG', 'Governor',
    'kiNgg', 'spike', 'blowz', 'PxS', 'Sato',
    'Tacolilla', 'Timotino', 'Melser', 'Shyy', 'Klaus',
    'Reduxx', 'Derrek', 'Zekken', 'Supamen', 'Xeppaa',
    'penny', 'Leaf', 'v1c', 'Trent', 'Zellsis',
    'Jawgemo', 'C0M', 'OXY', 'valyn', 'vora',
  ],
  Pacific: [
    'f0rsakeN', 'Jinggg', 'mindfreak', 'd4v41', 'Benkai',
    'Rb', 'Buzz', 'MaKo', 'Zest', 'Foxy9',
    'Laz', 'Dep', 'SugarZ3ro', 'crow', 'Tennn',
    'stax', 'k1Ng', 'Meteor', 'BuZz', 'MuZe',
    'glow', 'JessieVash', 'DubsteP', 'KoldamENTA', 'Tehbotol',
    'PRX Monyet', 'sushiboys', 'Jemkin', 'Yuran', 'BeYoond',
    'Bazzi', 'Sylvan', 'TS', 'x10Patt', 'foxz',
    'sScary', 'Surf', 'Tviruzkii', 'Crws', 'blaize',
    'Lmemore', 'ZmjjKK', 'Shiba', 'Deryeon', 'iZu',
    'Xnfri', 'Meow', 'Ragnarok', 'CGR', 'nAts',
    'something', 'nobody', 'haodong', 'retora', 'popogachi',
    'Anthem', 'AYAM', 'AfteR', 'Jonn', 'RiFFy',
  ],
  EMEA: [
    'Derke', 'Boaster', 'Alfajer', 'Chronicle', 'Leo',
    'ANGE1', 'Shao', 'SUYGETSU', 'cNed', 'nAts',
    'ScreaM', 'Nivera', 'Jamppi', 'dimasick', 'soulcas',
    'Sayf', 'BONECOLD', 'Enzo', 'Mistic', 'H1ber',
    'keiko', 'brawk', 'mada', 'skuba', 'Trexx',
    'koldamenta', 'Fit1nho', 'Cloud', 'nukkye', 'Redgar',
    'miniboo', 'Zyppan', 'russ', 'Boo', 'Kicks',
    'zmjjkk', 'Wo0t', 'adverso', 'sheydos', 'starxo',
    'Jady', 'daveeys', 'tuohai', 'Mazino', 'Cender',
    'lowel', 'Monstark', 'nataN', 'Mistic2', 'd3ffo',
    'ShadoW', 'elllement', 'HyP', 'zeek', 'vakk',
    'Entropy', 'PetitSkel', 'NooRi', 'MakoEMEA', 'Twisten',
  ],
  China: [
    'ZmjjKKCN', 'CHICHOO', 'nobodyCN', 'Haodong', 'abo',
    'Kai', 'Flex1N', 'DavidMon', 'Lunai', 'SmilE',
    'Yuicaw', 'Spring', 'Biank', 'whzy', 'Kivi',
    'XinQ', 'Tian', 'FengF', 'Monk', 'KAi',
    'Zhan', 'Light', 'rin', 'Eve', 'Seo',
    'Wubridge', 'Tangerine', 'Zen1', 'Knight', 'KnightOW',
    'Eagle', 'okaJJ', 'Herolf', 'MeowT', 'Snow',
    'AcG', 'Forest', 'River', 'JzY', 'FireH',
    'Viper', 'Wuhu', 'Tian2', 'Liang', 'Ayumi',
    'Nantian', 'xiaoer', 'Capy', 'Bingo', 'Starlord',
    'Phantom', 'Ace', 'Bullet', 'Storm', 'Frost',
    'Shadow', 'Phoenix', 'Ghost', 'Raptor', 'Blaze',
  ],
};

const MATCH_NAME_ALIASES: Record<string, string> = {
  zmjjkk: 'ZmjjKKCN',
  nobody: 'nobodyCN',
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '');
}

function assignRole(index: number): PlayerRole {
  const roles: PlayerRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
  return roles[index % roles.length];
}

function parseMatchFile(filePath: string): ParsedPlayerStats[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim() !== '');
  const dataLines = lines.slice(1);
  const players: ParsedPlayerStats[] = [];

  for (let index = 0; index < dataLines.length; index += 2) {
    const nameLine = dataLines[index];
    const statsLine = dataLines[index + 1];

    if (!nameLine || !statsLine) {
      break;
    }

    const values = statsLine.split(/\t+/).map((value) => value.trim()).filter(Boolean);
    if (values.length < 12) {
      continue;
    }

    players.push({
      name: nameLine.trim(),
      rating: Number.parseFloat(values[0]),
      acs: Number.parseFloat(values[1]),
      kills: Number.parseInt(values[2], 10),
      deaths: Number.parseInt(values[3], 10),
      assists: Number.parseInt(values[4], 10),
      kast: Number.parseFloat(values[6].replace('%', '')),
      adr: Number.parseFloat(values[7]),
      hsPercent: Number.parseFloat(values[8].replace('%', '')),
      firstKills: Number.parseInt(values[9], 10),
      firstDeaths: Number.parseInt(values[10], 10),
    });
  }

  return players;
}

async function resetData(): Promise<void> {
  await prisma.tradeItem.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.draftQueueEntry.deleteMany();
  await prisma.weeklyScore.deleteMany();
  await prisma.lineupSlot.deleteMany();
  await prisma.weeklyLineup.deleteMany();
  await prisma.rosterPlayer.deleteMany();
  await prisma.roster.deleteMany();
  await prisma.draftPick.deleteMany();
  await prisma.draftState.deleteMany();
  await prisma.leagueWeek.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  await prisma.playerMatchStats.deleteMany();
  await prisma.player.deleteMany();
}

async function seedPlayers(): Promise<Map<string, string>> {
  console.log('Seeding 240 VCT pro players...');

  const playerRecords: Array<{
    name: string;
    team: string;
    region: Region;
    role: PlayerRole;
  }> = [];

  (Object.keys(PLAYER_NAMES_BY_REGION) as Region[]).forEach((region) => {
    const teams = TEAMS_BY_REGION[region];
    const names = PLAYER_NAMES_BY_REGION[region];

    names.forEach((name, index) => {
      playerRecords.push({
        name,
        team: teams[index % teams.length],
        region,
        role: assignRole(index),
      });
    });
  });

  await prisma.player.createMany({ data: playerRecords });

  const players = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const playerNameToId = new Map<string, string>();

  players.forEach((player) => {
    playerNameToId.set(normalizeName(player.name), player.id);
  });

  console.log(`  Created ${playerRecords.length} players.`);
  return playerNameToId;
}

async function seedMatchStats(playerNameToId: Map<string, string>): Promise<string[]> {
  console.log('Parsing match files and seeding stats...');

  const matchedPlayerIds = new Set<string>();
  let importedCount = 0;
  let skippedCount = 0;

  for (const fileName of MATCH_FILES) {
    const filePath = path.join(MATCH_FILE_DIRECTORY, fileName);
    const matchId = fileName.replace(/\D/g, '');

    if (!fs.existsSync(filePath)) {
      console.warn(`  Missing match file: ${filePath}`);
      continue;
    }

    const parsedPlayers = parseMatchFile(filePath);
    console.log(`  ${fileName}: parsed ${parsedPlayers.length} players`);

    for (const stats of parsedPlayers) {
      const normalizedName = normalizeName(stats.name);
      const alias = MATCH_NAME_ALIASES[normalizedName];
      const playerId =
        playerNameToId.get(normalizedName) ??
        (alias ? playerNameToId.get(normalizeName(alias)) : undefined);

      if (!playerId) {
        console.warn(`    Player "${stats.name}" not found in player pool; skipping.`);
        skippedCount += 1;
        continue;
      }

      matchedPlayerIds.add(playerId);

      await prisma.playerMatchStats.upsert({
        where: {
          playerId_externalMatchId: {
            playerId,
            externalMatchId: matchId,
          },
        },
        update: {
          weekNumber: ACTIVE_LEAGUE_WEEK,
          kills: stats.kills,
          deaths: stats.deaths,
          assists: stats.assists,
          firstKills: stats.firstKills,
          firstDeaths: stats.firstDeaths,
          roundsWon: 0,
          roundsLost: 0,
          adr: stats.adr,
          acs: stats.acs,
          rating: stats.rating,
          hsPercent: stats.hsPercent,
          kast: stats.kast,
        },
        create: {
          playerId,
          externalMatchId: matchId,
          weekNumber: ACTIVE_LEAGUE_WEEK,
          kills: stats.kills,
          deaths: stats.deaths,
          assists: stats.assists,
          firstKills: stats.firstKills,
          firstDeaths: stats.firstDeaths,
          roundsWon: 0,
          roundsLost: 0,
          adr: stats.adr,
          acs: stats.acs,
          rating: stats.rating,
          hsPercent: stats.hsPercent,
          kast: stats.kast,
        },
      });

      importedCount += 1;
    }
  }

  console.log(`  Stats seeded: ${importedCount} rows imported, ${skippedCount} rows skipped.`);
  return [...matchedPlayerIds];
}

async function upsertTestUsers(): Promise<Array<{ id: string; name: string | null; email: string | null }>> {
  const testUsers = [
    { name: 'Alice TestUser', email: 'alice@test.com' },
    { name: 'Bob TestUser', email: 'bob@test.com' },
    { name: 'Charlie TestUser', email: 'charlie@test.com' },
    { name: 'Diana TestUser', email: 'diana@test.com' },
  ];

  const users: Array<{ id: string; name: string | null; email: string | null }> = [];

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name },
      create: userData,
    });
    users.push(user);
  }

  return users;
}

function determineSlotType(rosterSize: number, role: PlayerRole, existingSlotTypes: SlotType[]): SlotType {
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

  if (filledCounts[role] < slotConfig[role]) {
    return role;
  }

  if (filledCounts.Wildcard < slotConfig.Wildcard) {
    return 'Wildcard';
  }

  return 'Wildcard';
}

async function createSetupLeague(users: Array<{ id: string }>): Promise<void> {
  console.log('Creating setup league...');

  const league = await prisma.league.create({
    data: {
      name: 'VCT Fantasy Draft Lobby',
      inviteCode: 'TESTCODE',
      status: 'SETUP',
      creatorId: users[0].id,
      rosterSize: 10,
      draftPickTime: 60,
      currentWeek: 1,
    },
  });

  await prisma.leagueWeek.create({
    data: {
      leagueId: league.id,
      weekNumber: 1,
    },
  });

  for (const user of users) {
    await prisma.leagueMember.create({
      data: {
        leagueId: league.id,
        userId: user.id,
      },
    });
  }

  await prisma.draftState.create({
    data: {
      leagueId: league.id,
      status: 'WAITING',
      currentRound: 1,
      currentPickIndex: 0,
      draftOrder: users.map((user) => user.id),
    },
  });

  console.log('  Setup league created with 4 members and waiting draft state.');
}

async function createActiveLeague(
  users: Array<{ id: string }>,
  statPlayerIds: string[]
): Promise<void> {
  console.log('Creating active sample league...');

  const requiredPlayers = ACTIVE_LEAGUE_MEMBER_COUNT * ACTIVE_LEAGUE_ROSTER_SIZE;
  if (statPlayerIds.length < requiredPlayers) {
    throw new Error(`Need at least ${requiredPlayers} players with imported stats to seed the active league.`);
  }

  const selectedPlayers = await prisma.player.findMany({
    where: {
      id: {
        in: statPlayerIds.slice(0, requiredPlayers),
      },
    },
    select: {
      id: true,
      role: true,
    },
  });
  const playerById = new Map(selectedPlayers.map((player) => [player.id, player]));

  const league = await prisma.league.create({
    data: {
      name: 'VCT Fantasy Active League',
      inviteCode: 'ACTIVE01',
      status: 'ACTIVE',
      creatorId: users[0].id,
      rosterSize: ACTIVE_LEAGUE_ROSTER_SIZE,
      draftPickTime: 60,
      currentWeek: ACTIVE_LEAGUE_WEEK,
    },
  });

  await prisma.leagueWeek.createMany({
    data: [
      {
        leagueId: league.id,
        weekNumber: ACTIVE_LEAGUE_WEEK,
      },
      {
        leagueId: league.id,
        weekNumber: ACTIVE_LEAGUE_WEEK + 1,
      },
    ],
  });

  const activeLeagueUsers = users.slice(0, ACTIVE_LEAGUE_MEMBER_COUNT);
  const memberships = [];

  for (const user of activeLeagueUsers) {
    memberships.push(
      await prisma.leagueMember.create({
        data: {
          leagueId: league.id,
          userId: user.id,
        },
      })
    );
  }

  const draftOrder = activeLeagueUsers.map((user) => user.id);
  const draftState = await prisma.draftState.create({
    data: {
      leagueId: league.id,
      status: 'COMPLETE',
      currentRound: ACTIVE_LEAGUE_ROSTER_SIZE,
      currentPickIndex: 0,
      draftOrder,
      startedAt: new Date(Date.now() - 1000 * 60 * 60),
      completedAt: new Date(Date.now() - 1000 * 60 * 45),
    },
  });

  const rosters = new Map<string, { id: string; slotTypes: SlotType[]; rosterPlayerIds: string[] }>();
  for (const membership of memberships) {
    const roster = await prisma.roster.create({
      data: {
        leagueId: league.id,
        leagueMemberId: membership.id,
      },
    });

    rosters.set(membership.userId, {
      id: roster.id,
      slotTypes: [],
      rosterPlayerIds: [],
    });
  }

  let pickNumber = 1;
  const snakePlayerIds = statPlayerIds.slice(0, requiredPlayers);

  for (let round = 1; round <= ACTIVE_LEAGUE_ROSTER_SIZE; round += 1) {
    const roundOrder = round % 2 === 0 ? [...draftOrder].reverse() : draftOrder;

    for (const userId of roundOrder) {
      const playerId = snakePlayerIds[pickNumber - 1];
      const player = playerById.get(playerId);
      const roster = rosters.get(userId);

      if (!player || !roster) {
        throw new Error('Failed to build active league draft state.');
      }

      const slotType = determineSlotType(ACTIVE_LEAGUE_ROSTER_SIZE, player.role, roster.slotTypes);
      const isCaptain = round === 1;

      await prisma.draftPick.create({
        data: {
          draftStateId: draftState.id,
          userId,
          playerId,
          round,
          pickNumber,
          isCaptain,
          slotType,
        },
      });

      const rosterPlayer = await prisma.rosterPlayer.create({
        data: {
          rosterId: roster.id,
          playerId,
          isCaptain,
          slotType,
        },
      });

      roster.slotTypes.push(slotType);
      roster.rosterPlayerIds.push(rosterPlayer.id);
      pickNumber += 1;
    }
  }

  for (const roster of rosters.values()) {
    const weeklyLineup = await prisma.weeklyLineup.create({
      data: {
        rosterId: roster.id,
        weekNumber: ACTIVE_LEAGUE_WEEK,
      },
    });

    const activeRosterPlayerIds = roster.rosterPlayerIds.slice(0, 5);
    const starRosterPlayerId = activeRosterPlayerIds[1] ?? activeRosterPlayerIds[0];

    for (const rosterPlayerId of activeRosterPlayerIds) {
      await prisma.lineupSlot.create({
        data: {
          weeklyLineupId: weeklyLineup.id,
          rosterPlayerId,
          isStarPlayer: rosterPlayerId === starRosterPlayerId,
        },
      });
    }
  }

  await saveLeagueWeekScores(league.id, ACTIVE_LEAGUE_WEEK);
  console.log('  Active league created with completed draft, rosters, lineups, and scores.');
}

async function main(): Promise<void> {
  console.log('=== VCT Fantasy League Database Seed ===\n');

  await resetData();
  const playerNameToId = await seedPlayers();
  const statPlayerIds = await seedMatchStats(playerNameToId);
  const users = await upsertTestUsers();
  await createSetupLeague(users);
  await createActiveLeague(users, statPlayerIds);

  console.log('\n=== Seed complete! ===');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
