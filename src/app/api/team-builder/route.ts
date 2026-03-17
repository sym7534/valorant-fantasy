import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'

type TeamBuild = {
  id: string
  name: string
  playerIds: string[]
  captainId: string | null
  projectedScore: number | null
  createdAt: string
}

// In-memory store for MVP (will be replaced with DB when TeamBuild model is added)
const builds = new Map<string, TeamBuild[]>()

// GET /api/team-builder — get user's saved builds
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userBuilds = builds.get(session.user.id) ?? []
    return NextResponse.json({ builds: userBuilds })
  } catch (err) {
    console.error('GET team-builder error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/team-builder — save a new build
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, playerIds, captainId, projectedScore } = body as {
      name: string
      playerIds: string[]
      captainId?: string
      projectedScore?: number
    }

    if (!name || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'Name and playerIds required' }, { status: 400 })
    }

    const build: TeamBuild = {
      id: crypto.randomUUID(),
      name: name.trim(),
      playerIds,
      captainId: captainId ?? null,
      projectedScore: projectedScore ?? null,
      createdAt: new Date().toISOString(),
    }

    const userBuilds = builds.get(session.user.id) ?? []
    userBuilds.push(build)
    builds.set(session.user.id, userBuilds)

    return NextResponse.json({ build }, { status: 201 })
  } catch (err) {
    console.error('POST team-builder error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/team-builder — delete a build
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const buildId = searchParams.get('id')

    if (!buildId) {
      return NextResponse.json({ error: 'Build id required' }, { status: 400 })
    }

    const userBuilds = builds.get(session.user.id) ?? []
    const filtered = userBuilds.filter((b) => b.id !== buildId)
    builds.set(session.user.id, filtered)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE team-builder error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
