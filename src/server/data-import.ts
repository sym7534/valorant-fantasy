import { prisma } from '@/src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Parse a vlrScraper match file (TSV-like format).
 * Format: header line, then alternating player name / stats lines.
 *
 * Header: Rating\tACS\tKills\tDeaths\tAssists\t+/-\tKAST\tADR\tHS%\tFK\tFD\t+/-
 * Player name line: just the name
 * Stats line: rating\tacs\tkills\tdeaths\tassists\t+/-\tkast\tadr\ths%\tfk\tfd\t+/-
 */
export interface ParsedPlayerStats {
  name: string
  rating: number
  acs: number
  kills: number
  deaths: number
  assists: number
  kast: number
  adr: number
  hsPercent: number
  firstKills: number
  firstDeaths: number
}

export function parseMatchFile(content: string): ParsedPlayerStats[] {
  const lines = content.trim().split('\n')
  const players: ParsedPlayerStats[] = []

  // Skip header line
  let i = 1
  while (i < lines.length) {
    const nameLine = lines[i]?.trim()
    const statsLine = lines[i + 1]?.trim()

    if (!nameLine || !statsLine) break

    const parts = statsLine.split('\t')
    if (parts.length < 11) {
      i += 2
      continue
    }

    const parseNum = (s: string): number => {
      const cleaned = s.replace('%', '').replace('+', '')
      return parseFloat(cleaned) || 0
    }

    players.push({
      name: nameLine,
      rating: parseNum(parts[0]),
      acs: parseNum(parts[1]),
      kills: parseInt(parts[2]) || 0,
      deaths: parseInt(parts[3]) || 0,
      assists: parseInt(parts[4]) || 0,
      // parts[5] is +/- (derived)
      kast: parseNum(parts[6]),
      adr: parseNum(parts[7]),
      hsPercent: parseNum(parts[8]),
      firstKills: parseInt(parts[9]) || 0,
      firstDeaths: parseInt(parts[10]) || 0,
    })

    i += 2
  }

  return players
}

/**
 * Import match data from parsed stats into the database.
 * Creates Player records if they don't exist, then creates PlayerMatchStats.
 */
export async function importMatchData(
  matchId: string,
  parsedStats: ParsedPlayerStats[]
): Promise<{ imported: number; players: { name: string; playerId: string }[] }> {
  const results: { name: string; playerId: string }[] = []

  for (const stat of parsedStats) {
    // Upsert player (we don't know team/role/region from match data alone,
    // so set defaults that can be updated later)
    let player = await prisma.player.findFirst({ where: { name: stat.name } })

    if (!player) {
      player = await prisma.player.create({
        data: {
          name: stat.name,
          team: 'Unknown',
          region: 'Americas',
          role: 'Duelist',
        },
      })
    }

    // Upsert match stats
    await prisma.playerMatchStats.upsert({
      where: {
        playerId_externalMatchId: {
          playerId: player.id,
          externalMatchId: matchId,
        },
      },
      create: {
        playerId: player.id,
        externalMatchId: matchId,
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        firstKills: stat.firstKills,
        firstDeaths: stat.firstDeaths,
        roundsWon: 0,
        roundsLost: 0,
        adr: stat.adr,
        acs: stat.acs,
        rating: stat.rating,
        hsPercent: stat.hsPercent,
        kast: stat.kast,
      },
      update: {
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        firstKills: stat.firstKills,
        firstDeaths: stat.firstDeaths,
        adr: stat.adr,
        acs: stat.acs,
        rating: stat.rating,
        hsPercent: stat.hsPercent,
        kast: stat.kast,
      },
    })

    results.push({ name: stat.name, playerId: player.id })
  }

  return { imported: results.length, players: results }
}

/**
 * Import all match JSON files from a directory.
 */
export async function importAllMatches(directory: string): Promise<{
  totalImported: number
  matches: { matchId: string; playerCount: number }[]
}> {
  const files = fs.readdirSync(directory).filter((f) => f.startsWith('match') && f.endsWith('.json'))
  const results: { matchId: string; playerCount: number }[] = []
  let totalImported = 0

  for (const file of files) {
    const matchId = file.replace('match', '').replace('.json', '')
    const content = fs.readFileSync(path.join(directory, file), 'utf-8')
    const parsed = parseMatchFile(content)
    const result = await importMatchData(matchId, parsed)
    results.push({ matchId, playerCount: result.imported })
    totalImported += result.imported
  }

  return { totalImported, matches: results }
}
