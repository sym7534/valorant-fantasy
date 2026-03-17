import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import type { StatsImportRequest, StatsImportResponse } from '@/src/lib/api-types'

/**
 * Parse vlrScraper's TSV-format match data.
 *
 * Format:
 *   Header row (first line): Rating  ACS  Kills  Deaths  Assists  +/-  KAST  ADR  HS%  FK  FD  +/-
 *   Then alternating pairs: player name, then stats row.
 *
 * Stats are tab-separated (often double-tabs). Percentages have "%" suffix.
 * +/- values have sign prefix.
 */
function parseTsvMatchData(
  content: string
): Array<{
  name: string
  kills: number
  deaths: number
  assists: number
  firstKills: number
  firstDeaths: number
  adr: number
  acs: number
  rating: number
  hsPercent: number
  kast: number
}> {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 3) {
    throw new Error('Invalid TSV data: too few lines')
  }

  // Skip header row (first line)
  const dataLines = lines.slice(1)

  const players: Array<{
    name: string
    kills: number
    deaths: number
    assists: number
    firstKills: number
    firstDeaths: number
    adr: number
    acs: number
    rating: number
    hsPercent: number
    kast: number
  }> = []

  // Process alternating pairs: name line, then stats line
  for (let i = 0; i < dataLines.length - 1; i += 2) {
    const nameLine = dataLines[i]
    const statsLine = dataLines[i + 1]

    // Parse stats: split by tabs, filter empty values
    const statValues = statsLine.split('\t').filter((v) => v.trim().length > 0)

    if (statValues.length < 10) {
      // Not enough stat values, skip this pair
      console.warn(`Skipping player "${nameLine}" — only ${statValues.length} stat values found`)
      continue
    }

    // Stat order: Rating, ACS, Kills, Deaths, Assists, +/-, KAST, ADR, HS%, FK, FD, +/-
    const parseNum = (val: string): number => {
      const cleaned = val.replace('%', '').replace('+', '').trim()
      return parseFloat(cleaned) || 0
    }

    players.push({
      name: nameLine.trim(),
      rating: parseNum(statValues[0]),
      acs: parseNum(statValues[1]),
      kills: Math.round(parseNum(statValues[2])),
      deaths: Math.round(parseNum(statValues[3])),
      assists: Math.round(parseNum(statValues[4])),
      // statValues[5] is +/- (kills-deaths), skip
      kast: parseNum(statValues[6]),
      adr: parseNum(statValues[7]),
      hsPercent: parseNum(statValues[8]),
      firstKills: Math.round(parseNum(statValues[9])),
      firstDeaths: Math.round(parseNum(statValues[10])),
      // statValues[11] is FK-FD +/-, skip
    })
  }

  return players
}

// POST /api/stats/import — import match stats from TSV file content
export async function POST(
  request: NextRequest
): Promise<NextResponse<StatsImportResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Partial<StatsImportRequest>

    if (!body.matchId || typeof body.matchId !== 'string') {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    let parsedPlayers: ReturnType<typeof parseTsvMatchData>
    try {
      parsedPlayers = parseTsvMatchData(body.content)
    } catch (parseErr) {
      return NextResponse.json(
        { error: `Failed to parse TSV data: ${parseErr instanceof Error ? parseErr.message : 'unknown error'}` },
        { status: 400 }
      )
    }

    if (parsedPlayers.length === 0) {
      return NextResponse.json({ error: 'No player data found in content' }, { status: 400 })
    }

    // Import stats in a transaction
    const importedPlayers = await prisma.$transaction(async (tx) => {
      const results: Array<{ name: string; playerId: string }> = []

      for (const parsed of parsedPlayers) {
        // Find existing player by name (case-insensitive)
        let player = await tx.player.findFirst({
          where: {
            name: { equals: parsed.name, mode: 'insensitive' },
          },
        })

        if (!player) {
          // Player not found in database — skip with warning
          console.warn(`Player "${parsed.name}" not found in database, skipping`)
          continue
        }

        // Create or update match stats (upsert on playerId + externalMatchId)
        await tx.playerMatchStats.upsert({
          where: {
            playerId_externalMatchId: {
              playerId: player.id,
              externalMatchId: body.matchId!,
            },
          },
          create: {
            playerId: player.id,
            externalMatchId: body.matchId!,
            kills: parsed.kills,
            deaths: parsed.deaths,
            assists: parsed.assists,
            firstKills: parsed.firstKills,
            firstDeaths: parsed.firstDeaths,
            roundsWon: 0, // MVP default: scraper doesn't capture
            roundsLost: 0, // MVP default: scraper doesn't capture
            adr: parsed.adr,
            acs: parsed.acs,
            rating: parsed.rating,
            hsPercent: parsed.hsPercent,
            kast: parsed.kast,
          },
          update: {
            kills: parsed.kills,
            deaths: parsed.deaths,
            assists: parsed.assists,
            firstKills: parsed.firstKills,
            firstDeaths: parsed.firstDeaths,
            adr: parsed.adr,
            acs: parsed.acs,
            rating: parsed.rating,
            hsPercent: parsed.hsPercent,
            kast: parsed.kast,
          },
        })

        results.push({ name: parsed.name, playerId: player.id })
      }

      return results
    })

    const response: StatsImportResponse = {
      imported: importedPlayers.length,
      matchId: body.matchId,
      players: importedPlayers,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('POST /api/stats/import error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
