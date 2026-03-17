/**
 * @file seed.ts
 * @description Database seed script for VCT Fantasy League.
 *
 * Creates:
 * 1. 240 VCT pro players with realistic names across 4 regions, proper roles, and real team names.
 * 2. Match stats from the existing vlrScraper TSV files (3 match files).
 * 3. Sample test data: 1 league with 4 fake users.
 *
 * Run with: npx prisma db seed
 * (Ensure "prisma.seed" in package.json points to "tsx prisma/seed.ts")
 *
 * Owner: Lead / Game Designer Agent
 */

import { PrismaClient, Region, PlayerRole, LeagueStatus, DraftStatus, SlotType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================================
// MATCH FILE PARSER
// ============================================================================

/**
 * Parsed stats for a single player from a vlrScraper TSV match file.
 */
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

/**
 * Parses a vlrScraper TSV match file.
 *
 * File format:
 * - Line 1: Header row (Rating, ACS, Kills, Deaths, Assists, +/-, KAST, ADR, HS%, FK, FD, +/-)
 * - Subsequent lines alternate: player name line, then stats line (tab-separated)
 * - 10 players per file (5 per team)
 * - Stats may be separated by double-tabs
 * - Percentage values include "%" symbol
 * - +/- values include the sign
 *
 * @param filePath - Absolute path to the TSV match file.
 * @returns Array of parsed player stats (10 per match).
 */
function parseMatchFile(filePath: string): ParsedPlayerStats[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim() !== '');

  // Skip header line (index 0)
  const dataLines = lines.slice(1);
  const players: ParsedPlayerStats[] = [];

  for (let i = 0; i < dataLines.length; i += 2) {
    const nameLine = dataLines[i];
    const statsLine = dataLines[i + 1];

    if (!nameLine || !statsLine) break;

    const playerName = nameLine.trim();
    // Split on one or more tabs
    const parts = statsLine.split(/\t+/).map((s) => s.trim()).filter((s) => s !== '');

    // Expected order: Rating, ACS, Kills, Deaths, Assists, +/-, KAST, ADR, HS%, FK, FD, +/-
    // Index:           0       1     2      3       4        5     6     7    8    9   10   11
    if (parts.length < 12) {
      console.warn(`Skipping ${playerName}: expected 12 stats columns, got ${parts.length}`);
      continue;
    }

    players.push({
      name: playerName,
      rating: parseFloat(parts[0]),
      acs: parseFloat(parts[1]),
      kills: parseInt(parts[2], 10),
      deaths: parseInt(parts[3], 10),
      assists: parseInt(parts[4], 10),
      // parts[5] is +/- (kills - deaths), we don't store this separately
      kast: parseFloat(parts[6].replace('%', '')),
      adr: parseFloat(parts[7]),
      hsPercent: parseFloat(parts[8].replace('%', '')),
      firstKills: parseInt(parts[9], 10),
      firstDeaths: parseInt(parts[10], 10),
      // parts[11] is +/- (FK - FD), we don't store this separately
    });
  }

  return players;
}

// ============================================================================
// VCT PRO PLAYER DATA
// ============================================================================

/**
 * Real VCT team names per region. Used to distribute players across teams.
 */
const TEAMS_BY_REGION: Record<string, string[]> = {
  Americas: [
    'Sentinels', 'Cloud9', 'NRG Esports', '100 Thieves', 'Evil Geniuses',
    'LOUD', 'FURIA', 'MIBR', 'Leviatán', 'KRÜ Esports',
    'G2 Esports', '2Game Esports',
  ],
  Pacific: [
    'Paper Rex', 'DRX', 'T1', 'Gen.G', 'ZETA DIVISION',
    'DetonatioN FocusMe', 'Team Secret', 'Talon Esports', 'Global Esports', 'RRQ',
    'Nongshim RedForce', 'Rex Regum Qeon',
  ],
  EMEA: [
    'Fnatic', 'Team Vitality', 'Team Heretics', 'Karmine Corp', 'Navi',
    'FUT Esports', 'BBL Esports', 'Giants Gaming', 'KOI', 'Team Liquid',
    'Gentle Mates', 'Apeks',
  ],
  China: [
    'EDward Gaming', 'Bilibili Gaming', 'FunPlus Phoenix', 'Trace Esports', 'Nova Esports',
    'Dragon Ranger Gaming', 'All Gamers', 'Wolves Esports', 'JD Gaming', 'Titan Esports',
    'Attacking Soul Esports', 'Tyloo',
  ],
};

/**
 * Realistic player names per region.
 * 60 players per region = 240 total.
 * Names are inspired by real VCT pros or common esports naming conventions.
 */
const PLAYER_NAMES_BY_REGION: Record<string, string[]> = {
  Americas: [
    'TenZ', 'ShahZaM', 'SicK', 'dapr', 'zombs',
    'Asuna', 'bang', 'Cryocells', 'Ethan', 'Boostio',
    'FNS', 's0m', 'crashies', 'Victor', 'Marved',
    'aspas', 'Less', 'tuyz', 'cauanzin', 'pANcada',
    'Sacy', 'dgzin', 'mazin', 'frz', 'havoc',
    'artzin', 'koalanoob', 'alym', 'eeiu', 'nerve',
    'mta', 'infiltrator', 'NagZ', 'benG', 'Governor',
    'kiNgg', 'spike', 'blowz', 'PxS', 'Sato',
    'Tacolilla', 'NagZet', 'Melser', 'Shyy', 'Klaus',
    'Reduxx', 'Derrek', 'Zekken', 'Supamen', 'BabyJ',
    'Wardell', 'Leaf', 'xand', 'Trent', 'mitch',
    'Jawgemo', 'C0M', 'Sayaplayer', 'valyn', 'stellar',
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
    'lowel', 'Monstark', 'nataN', 'Mistic', 'd3ffo',
    'ShadoW', 'elllement', 'HyP', 'zeek', 'vakk',
    'Entropy', 'PetitSkel', 'NooRi', 'Mako', 'Twisten',
  ],
  China: [
    'ZmjjKK', 'CHICHOO', 'nobody', 'Haodong', 'abo',
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

/**
 * Assigns roles to players, distributing roughly evenly:
 * 15 per role per region (60 / 4 = 15).
 */
function assignRole(index: number): PlayerRole {
  const roles: PlayerRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
  return roles[index % 4];
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Creates all 240 VCT pro players and returns a map from player name to player ID.
 */
async function seedPlayers(): Promise<Map<string, string>> {
  console.log('Seeding 240 VCT pro players...');
  const playerNameToId = new Map<string, string>();

  for (const regionStr of Object.keys(PLAYER_NAMES_BY_REGION)) {
    const region = regionStr as Region;
    const names = PLAYER_NAMES_BY_REGION[regionStr];
    const teams = TEAMS_BY_REGION[regionStr];

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const team = teams[i % teams.length];
      const role = assignRole(i);

      const player = await prisma.player.upsert({
        where: {
          // Use a composite-like lookup by name+team since we don't have a unique on name alone
          id: 'lookup', // This won't match, we'll use create path
        },
        update: {},
        create: {
          name,
          team,
          region,
          role,
        },
      });

      playerNameToId.set(name.toLowerCase(), player.id);
    }
  }

  console.log(`  Created ${playerNameToId.size} players.`);
  return playerNameToId;
}

/**
 * Alternative seeder that uses createMany for better performance.
 * Returns a map from lowercase player name to player ID.
 */
async function seedPlayersEfficient(): Promise<Map<string, string>> {
  console.log('Seeding 240 VCT pro players...');

  // First, delete existing players to avoid conflicts on re-seed
  await prisma.playerMatchStats.deleteMany();
  await prisma.player.deleteMany();

  const playerRecords: Array<{
    name: string;
    team: string;
    region: Region;
    role: PlayerRole;
  }> = [];

  for (const regionStr of Object.keys(PLAYER_NAMES_BY_REGION)) {
    const region = regionStr as Region;
    const names = PLAYER_NAMES_BY_REGION[regionStr];
    const teams = TEAMS_BY_REGION[regionStr];

    for (let i = 0; i < names.length; i++) {
      playerRecords.push({
        name: names[i],
        team: teams[i % teams.length],
        region,
        role: assignRole(i),
      });
    }
  }

  await prisma.player.createMany({ data: playerRecords });

  // Fetch all players to build the name→id map
  const allPlayers = await prisma.player.findMany({ select: { id: true, name: true } });
  const playerNameToId = new Map<string, string>();
  for (const p of allPlayers) {
    playerNameToId.set(p.name.toLowerCase(), p.id);
  }

  console.log(`  Created ${playerNameToId.size} players.`);
  return playerNameToId;
}

/**
 * Parses the existing vlrScraper match files and creates PlayerMatchStats records.
 * Only creates stats for players that exist in the database (by name match).
 *
 * @param playerNameToId - Map from lowercase player name to database player ID.
 */
async function seedMatchStats(playerNameToId: Map<string, string>): Promise<void> {
  console.log('Parsing match files and seeding stats...');

  const matchFiles: Array<{ path: string; matchId: string }> = [
    {
      path: 'c:/Users/water/Desktop/site/vlrScraper/vlrScraper/match596400.json',
      matchId: '596400',
    },
    {
      path: 'c:/Users/water/Desktop/site/vlrScraper/vlrScraper/match596401.json',
      matchId: '596401',
    },
    {
      path: 'c:/Users/water/Desktop/site/vlrScraper/vlrScraper/match596402.json',
      matchId: '596402',
    },
  ];

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const { path: filePath, matchId } of matchFiles) {
    if (!fs.existsSync(filePath)) {
      console.warn(`  Match file not found: ${filePath} — skipping.`);
      continue;
    }

    const parsedPlayers = parseMatchFile(filePath);
    console.log(`  Match ${matchId}: parsed ${parsedPlayers.length} players`);

    for (const stats of parsedPlayers) {
      const playerId = playerNameToId.get(stats.name.toLowerCase());

      if (!playerId) {
        console.warn(`    Player "${stats.name}" not found in database — skipping.`);
        totalSkipped++;
        continue;
      }

      await prisma.playerMatchStats.upsert({
        where: {
          playerId_externalMatchId: {
            playerId,
            externalMatchId: matchId,
          },
        },
        update: {
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

      totalCreated++;
    }
  }

  console.log(`  Stats seeded: ${totalCreated} created, ${totalSkipped} skipped (player not found).`);
}

/**
 * Creates sample test data: 4 fake users and 1 test league in SETUP status.
 */
async function seedTestData(): Promise<void> {
  console.log('Creating sample test data...');

  // Create 4 fake test users
  const testUsers = [
    { name: 'Alice TestUser', email: 'alice@test.com' },
    { name: 'Bob TestUser', email: 'bob@test.com' },
    { name: 'Charlie TestUser', email: 'charlie@test.com' },
    { name: 'Diana TestUser', email: 'diana@test.com' },
  ];

  const createdUsers: Array<{ id: string; name: string | null; email: string | null }> = [];

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name },
      create: {
        name: userData.name,
        email: userData.email,
      },
    });
    createdUsers.push(user);
  }

  console.log(`  Created ${createdUsers.length} test users.`);

  // Create 1 test league
  const league = await prisma.league.create({
    data: {
      name: 'VCT Fantasy Test League',
      inviteCode: 'TESTCODE',
      status: 'SETUP',
      creatorId: createdUsers[0].id,
      rosterSize: 10,
      draftPickTime: 60,
    },
  });

  console.log(`  Created test league: "${league.name}" (code: ${league.inviteCode})`);

  // Add all 4 users as league members
  for (const user of createdUsers) {
    await prisma.leagueMember.upsert({
      where: {
        leagueId_userId: {
          leagueId: league.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        leagueId: league.id,
        userId: user.id,
      },
    });
  }

  console.log(`  Added ${createdUsers.length} members to test league.`);

  // Create a draft state in WAITING status
  await prisma.draftState.create({
    data: {
      leagueId: league.id,
      status: 'WAITING',
      currentRound: 1,
      currentPickIndex: 0,
      draftOrder: createdUsers.map((u) => u.id),
    },
  });

  console.log('  Created draft state (WAITING).');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('=== VCT Fantasy League Database Seed ===\n');

  const playerNameToId = await seedPlayersEfficient();
  await seedMatchStats(playerNameToId);
  await seedTestData();

  console.log('\n=== Seed complete! ===');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
