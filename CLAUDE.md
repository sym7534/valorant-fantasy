# CLAUDE.md — VCT Fantasy League

> **This file is the single source of truth for all agents working on this project.**
> Read it completely before writing any code. Refer back to it constantly.
> DO NOT modify this file unless you are the user.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Agent Assignments and Boundaries](#4-agent-assignments-and-boundaries)
5. [Shared Contracts](#5-shared-contracts)
6. [Sequencing and Dependencies](#6-sequencing-and-dependencies)
7. [Clean Rebuild Instructions](#7-clean-rebuild-instructions)
8. [Game Rules](#8-game-rules)
9. [Scoring System](#9-scoring-system)
10. [Draft Rules](#10-draft-rules)
11. [Data Pipeline](#11-data-pipeline)
12. [API Route Specifications](#12-api-route-specifications)
13. [Database Schema Requirements](#13-database-schema-requirements)
14. [Frontend Design System](#14-frontend-design-system)
15. [Page Specifications](#15-page-specifications)
16. [Coordination Protocol](#16-coordination-protocol)
17. [Code Standards](#17-code-standards)
18. [Definition of Done](#18-definition-of-done)

---

## 1. PROJECT OVERVIEW

**App name**: VCT Fantasy League
**Purpose**: A fantasy esports platform for Valorant Champions Tour (VCT) professional play. Users create or join private leagues, snake-draft pro players onto rosters, set weekly lineups of 5, and earn points based on real VCT match performance.

**Core loop (MVP)**: Auth → Create/Join League → Draft Room → My Roster → Standings

**Repositories**:
- `c:/Users/water/Desktop/site/valorant-fantasy` — **the app (this repo)**
- `c:/Users/water/Desktop/site/vlrScraper` — data scraper (separate repo, NOT touched by any agent)

---

## 2. TECH STACK

**Do not deviate from these choices. Do not add unlisted dependencies.**

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | Next.js | 16.x (installed: 16.1.3) |
| UI Library | React | 19.x (installed: 19.2.3) |
| Language | TypeScript | 5.x (installed) |
| Styling | Tailwind CSS | v4 (installed via @tailwindcss/postcss) |
| ORM | Prisma | latest — `prisma` + `@prisma/client` |
| Database | PostgreSQL | local or Docker, connection via `DATABASE_URL` env var |
| Auth | NextAuth.js (Auth.js v5) | `next-auth@beta` + `@auth/prisma-adapter` |
| OAuth Provider | Google | via `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars |
| Real-time | Socket.io | `socket.io` (server) + `socket.io-client` (client) |
| Custom Server | tsx | `tsx` for running the custom Node.js server in dev |
| Component libraries | **NONE** | Absolutely zero: no shadcn, no radix, no headless-ui, no MUI, no chakra |
| CSS methodology | Tailwind utility classes + CSS custom properties in `src/app/globals.css` | No CSS modules, no styled-components |

**Existing config files — do NOT modify these:**
- `postcss.config.mjs` — uses `@tailwindcss/postcss`
- `eslint.config.mjs` — extends Next.js + TypeScript configs

**tsconfig.json**: Has `@/*` path alias mapping to repo root (`./*`). Imports use `@/src/lib/...`, `@/src/components/...`, etc.

### Socket.io + Next.js App Router

Next.js App Router API routes are serverless and do **not** support persistent WebSocket connections. The Backend Agent must create a **custom server** at the repo root:

**`server.ts`** (Backend Agent owns this file):
- Creates a Node.js `http.Server`
- Attaches the Next.js request handler via `next()`
- Attaches Socket.io to the same HTTP server
- Listens on a single port (default 3000)

**package.json scripts** must be updated:
```json
{
  "scripts": {
    "dev": "tsx watch server.ts",
    "build": "next build",
    "start": "NODE_ENV=production tsx server.ts",
    "lint": "eslint"
  }
}
```

---

## 3. REPOSITORY STRUCTURE

After clean rebuild, the directory tree MUST look like this. Every file has ONE owner agent annotated.

```
valorant-fantasy/
├── CLAUDE.md                    # DO NOT MODIFY
├── server.ts                    # OWNER: Backend Agent (custom server for Socket.io)
├── .env.local                   # User-created, git-ignored
├── .gitignore
├── eslint.config.mjs            # DO NOT MODIFY
├── next.config.ts               # OWNER: Backend Agent (if changes needed)
├── next-env.d.ts
├── package.json                 # OWNER: Backend Agent (dep updates)
├── package-lock.json
├── postcss.config.mjs           # DO NOT MODIFY
├── tsconfig.json                # DO NOT MODIFY
│
├── public/
│   └── vctlogo.png              # KEEP — existing asset
│
├── prisma/
│   ├── schema.prisma            # OWNER: Lead Agent
│   ├── seed.ts                  # OWNER: Lead Agent
│   └── migrations/              # OWNER: Backend Agent (generated via prisma migrate)
│
└── src/
    ├── app/
    │   ├── layout.tsx           # OWNER: Frontend Agent (root layout)
    │   ├── globals.css          # OWNER: Frontend Agent (Tailwind directives + CSS vars)
    │   │
    │   ├── api/                 # OWNER: Backend Agent (ALL files in this directory)
    │   │   ├── auth/[...nextauth]/route.ts
    │   │   ├── leagues/route.ts
    │   │   ├── leagues/[leagueId]/route.ts
    │   │   ├── leagues/[leagueId]/join/route.ts
    │   │   ├── leagues/[leagueId]/draft/route.ts
    │   │   ├── leagues/[leagueId]/draft/start/route.ts
    │   │   ├── leagues/[leagueId]/draft/pick/route.ts
    │   │   ├── leagues/[leagueId]/roster/route.ts
    │   │   ├── leagues/[leagueId]/roster/lineup/route.ts
    │   │   ├── leagues/[leagueId]/roster/star/route.ts
    │   │   ├── leagues/[leagueId]/standings/route.ts
    │   │   ├── players/route.ts
    │   │   ├── players/[playerId]/route.ts
    │   │   └── stats/import/route.ts
    │   │
    │   └── (pages)/             # OWNER: Frontend Agent (ALL files in this directory)
    │       ├── page.tsx                    # Landing page (public)
    │       ├── dashboard/page.tsx          # Dashboard (authed home)
    │       ├── league/
    │       │   ├── create/page.tsx
    │       │   ├── join/page.tsx
    │       │   └── [leagueId]/
    │       │       ├── page.tsx            # League lobby
    │       │       ├── draft/page.tsx      # Draft room
    │       │       ├── roster/page.tsx     # My roster (HERO PAGE)
    │       │       └── standings/page.tsx
    │       └── layout.tsx                  # Pages layout (nav, auth guard)
    │
    ├── components/              # OWNER: Frontend Agent (ALL files)
    │   ├── ui/                  # Button, Card, Modal, Input, Badge, Dropdown, etc.
    │   ├── player/              # PlayerCard variants (Full, Medium, Compact), PlayerList
    │   ├── draft/               # DraftBoard, DraftPick, DraftTimer, PlayerPool
    │   ├── roster/              # HeroView, LineupSlot, BenchRow, StarBadge
    │   ├── league/              # LeagueCard, MemberList, InviteCode, StandingsTable
    │   └── layout/              # Navbar, Sidebar, Footer
    │
    ├── lib/
    │   ├── game-config.ts       # OWNER: Lead Agent — THE source of truth for all game rules
    │   ├── api-types.ts         # OWNER: Backend Agent — all API request/response types
    │   ├── auth.ts              # OWNER: Backend Agent — NextAuth configuration
    │   ├── prisma.ts            # OWNER: Backend Agent — Prisma client singleton
    │   ├── mock-data.ts         # OWNER: Frontend Agent — mock data for building before APIs ready
    │   └── utils.ts             # OWNER: whoever needs it — pure utility functions only
    │
    ├── server/
    │   └── socket.ts            # OWNER: Backend Agent — Socket.io event handlers
    │
    └── hooks/                   # OWNER: Frontend Agent
        ├── useSocket.ts
        ├── useDraft.ts
        └── useAuth.ts
```

**Ownership rule**: No agent creates or modifies files outside their territory. If an agent needs something from another territory, they leave a `// TODO(agent-name)` comment — the user will coordinate.

---

## 4. AGENT ASSIGNMENTS AND BOUNDARIES

### Agent 1: Lead / Game Designer

**Git branch**: `lead/game-design`

**Files you OWN (you create and modify these)**:
- `src/lib/game-config.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`

**Your job (in order)**:
1. **Ask the user clarifying questions** about any ambiguous game mechanics. Sections 8–10 document what is already decided, but edge cases remain (see the questions list below).
2. **Produce `src/lib/game-config.ts`** — a fully-typed TypeScript constants file. Every number, constraint, timing, and rule MUST live here. Other agents import from this file — they NEVER hardcode game values.
3. **Produce `prisma/schema.prisma`** — the complete database schema. See Section 13 for requirements.
4. **Produce `prisma/seed.ts`** — populates the database with 240 VCT pros (realistic names, proper roles/regions/teams), parses the 4 existing match files from vlrScraper, and creates sample league data for testing.

**Questions you MUST ask the user** (do not assume answers):
- For roster sizes 7, 8, 9: exactly which role slots get removed? (10 = 2D/2I/2C/2S/2W is defined)
- If a member's draft timer expires, should they get a random valid pick or skip their turn entirely?
- Can a Star Player who is also the Captain receive 3x (Star overrides) — is this confirmed or should it stack?
- What happens if a player's real VCT team doesn't play that week? Do they score 0?
- Are trades planned for a future version? Should the schema include trade tables now for forward-compatibility?
- Should league deletion be supported, or only archiving?

**You do NOT touch**:
- Any file in `src/app/api/`
- Any file in `src/app/(pages)/`
- Any file in `src/app/globals.css`
- Any file in `src/components/`
- `src/lib/api-types.ts`, `src/lib/auth.ts`, `src/lib/prisma.ts`
- `server.ts`

**Exact exports from `game-config.ts`** (other agents depend on these names):
```typescript
// === TYPES ===
export type Region = 'Americas' | 'Pacific' | 'EMEA' | 'China'
export type PlayerRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel'
export type SlotType = PlayerRole | 'Wildcard'
export type LeagueStatus = 'SETUP' | 'DRAFTING' | 'ACTIVE' | 'COMPLETED'
export type DraftStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETE'
export type PlayerDesignation = 'captain' | 'star' | 'normal'

export interface ScoringWeights {
  kills: number          // 10
  deaths: number         // -5
  assists: number        // 5
  firstKills: number     // 10
  firstDeaths: number    // -10
  roundsWon: number      // 5
  roundsLost: number     // -5
  adrDivisor: number     // 10 (ADR is divided by this)
}

export interface PlayerMatchStats {
  kills: number
  deaths: number
  assists: number
  firstKills: number
  firstDeaths: number
  roundsWon: number
  roundsLost: number
  adr: number
}

// === CONSTANTS ===
export const SCORING_WEIGHTS: ScoringWeights
export const CAPTAIN_MULTIPLIER: number          // 2
export const STAR_PLAYER_MULTIPLIER: number      // 3
export const STAR_PLAYER_COOLDOWN_WEEKS: number  // 2

export const REGIONS: readonly Region[]          // ['Americas', 'Pacific', 'EMEA', 'China']
export const PLAYER_ROLES: readonly PlayerRole[] // ['Duelist', 'Initiator', 'Controller', 'Sentinel']
export const TOTAL_PRO_POOL_SIZE: number         // 240

export const ROLE_SLOTS_BY_ROSTER_SIZE: Record<number, Record<SlotType, number>>
// e.g., { 10: { Duelist: 2, Initiator: 2, Controller: 2, Sentinel: 2, Wildcard: 2 } }

export const REGION_MIN_PER: number              // 2 (min players from each region)
export const ACTIVE_LINEUP_SIZE: number          // 5
export const DEFAULT_ROSTER_SIZE: number         // 10
export const MIN_ROSTER_SIZE: number             // 7
export const MAX_ROSTER_SIZE: number             // 10
export const CAPTAIN_ROUND: number               // 1

export const MIN_LEAGUE_SIZE: number             // 2
export const MAX_LEAGUE_SIZE: number             // 12
export const LEAGUE_NAME_MAX_LENGTH: number      // 50
export const INVITE_CODE_LENGTH: number          // 8

export const DRAFT_TIMER_OPTIONS: readonly number[]  // [30, 45, 60, 90, 120] seconds
export const DEFAULT_DRAFT_TIMER: number             // 60

// === FUNCTIONS ===
export function calculateBaseScore(stats: PlayerMatchStats): number
export function applyMultiplier(baseScore: number, designation: PlayerDesignation): number
```

---

### Agent 2: Backend

**Git branch**: `backend/api`

**Files you OWN (you create and modify these)**:
- `server.ts` (custom Node.js server — see Section 2)
- `src/app/api/**/*` (all API routes)
- `src/lib/api-types.ts`
- `src/lib/auth.ts`
- `src/lib/prisma.ts`
- `src/server/socket.ts`
- `prisma/migrations/` (generated — run `npx prisma migrate dev`)
- `package.json` (dependency updates only)

**Your job (in order)**:
1. **Scaffold the `src/` directory structure** — create all folders so other agents have somewhere to work. Create placeholder `index.ts` or `.gitkeep` files where needed.
2. **Set up `src/lib/prisma.ts`** — standard Prisma client singleton for Next.js (prevents connection exhaustion in dev).
3. **Set up `src/lib/auth.ts`** and `src/app/api/auth/[...nextauth]/route.ts` — NextAuth v5 with Google OAuth provider and Prisma adapter.
4. **Create `server.ts`** — custom Node.js server that combines Next.js + Socket.io on one port.
5. **Define all API types in `src/lib/api-types.ts`** — the Frontend Agent imports these. Define them early so Frontend can build against the types immediately.
6. **Build all API routes** — see Section 12 for every endpoint specification.
7. **Build Socket.io event handlers** in `src/server/socket.ts` — see Section 12 for event specifications.
8. **Build the stats import endpoint** — parses vlrScraper's TSV-format files.

**You do NOT touch**:
- `src/lib/game-config.ts` (read it, import from it, never edit it)
- `prisma/schema.prisma` (read it, run migrations from it, never edit it)
- `prisma/seed.ts`
- Any file in `src/app/(pages)/`
- Any file in `src/app/globals.css`
- Any file in `src/components/`
- `src/hooks/`
- `src/lib/mock-data.ts`

**Import rules**:
- Import ALL game rules from `@/src/lib/game-config` — NEVER hardcode scoring weights, roster sizes, draft timers, or any game constant.
- Import Prisma types from `@prisma/client`.
- Export ALL API request/response types from `@/src/lib/api-types.ts`.

**If `game-config.ts` or `schema.prisma` don't exist yet** (Lead Agent hasn't finished), scaffold your code with temporary placeholder types annotated with `// BLOCKED: Waiting on Lead Agent — replace with import from game-config`. Do not wait idle.

---

### Agent 3: Frontend / Designer

**Git branch**: `frontend/ui`

**Files you OWN (you create and modify these)**:
- `src/app/layout.tsx` (root layout)
- `src/app/globals.css` (Tailwind directives + design tokens)
- `src/app/(pages)/**/*` (all page files)
- `src/components/**/*` (all components)
- `src/hooks/**/*` (custom React hooks)
- `src/lib/mock-data.ts` (mock data for building before APIs are ready)
- `public/` (new assets only — do NOT delete `vctlogo.png`)

**Your job (in order)**:
1. **Create `src/app/globals.css`** with the design system (Section 14): Tailwind directives, CSS custom properties, font imports, base styles.
2. **Create `src/app/layout.tsx`** — root layout with font loading, metadata, global styles.
3. **Build the component library** in `src/components/ui/` — Button, Card, Modal, Input, Badge, Dropdown. All custom Tailwind, zero third-party components.
4. **Build PlayerCard variants** — Full (hero view), Medium (draft/trade), Compact (list/inline). These are the primary UI atom used everywhere.
5. **Build all MVP pages** with mock data — see Section 15. Use `src/lib/mock-data.ts` to centralize fake data that matches the types in `api-types.ts`.
6. **Wire pages to real APIs** once the Backend Agent's routes are ready — swap `mock-data` imports for `fetch('/api/...')` calls.
7. **Build Socket.io integration** for the Draft Room — `src/hooks/useSocket.ts` and `src/hooks/useDraft.ts`.

**You do NOT touch**:
- `src/app/api/**/*` (anything in the API directory)
- `src/lib/game-config.ts`
- `src/lib/api-types.ts`
- `src/lib/auth.ts`
- `src/lib/prisma.ts`
- `src/server/`
- `prisma/`
- `server.ts`

**Import rules**:
- Import display constants (roster sizes, role names, region names, scoring info) from `@/src/lib/game-config`.
- Import API types from `@/src/lib/api-types`.
- NEVER call Prisma directly — always fetch from API routes.
- NEVER use any third-party component library. Build every component from scratch with Tailwind.

**If `api-types.ts` or `game-config.ts` don't exist yet**, define temporary local types annotated with `// TEMPORARY — replace with import from api-types.ts when available`. Do not wait idle.

**Design direction**: See Section 14 for the full design system. Key points:
- Dark mode ONLY for MVP (no light mode toggle)
- Valorant-inspired but original — NOT a clone of the Valorant UI
- The **Hero Roster Display** (My Roster page) is the SIGNATURE UI moment of the entire app
- Player cards are the primary UI atom
- Desktop-first, minimum 1280px viewport. No mobile layouts for MVP.

---

## 5. SHARED CONTRACTS

These files are the coordination points between agents. Treat them as sacred.

### Contract 1: `src/lib/game-config.ts`
- **Written by**: Lead Agent
- **Read by**: Backend Agent, Frontend Agent
- **Rule**: This is the ONLY place game rules exist as code. If you need a number (roster size, scoring weight, draft timer, etc.), it MUST come from this file. Never hardcode game values anywhere else.
- **Change protocol**: Only the Lead Agent modifies this file. If Backend or Frontend needs a change, add a `// TODO(lead)` comment and tell the user.

### Contract 2: `prisma/schema.prisma`
- **Written by**: Lead Agent
- **Read by**: Backend Agent (for migrations and generated Prisma types)
- **Rule**: Backend Agent runs `npx prisma migrate dev` and `npx prisma generate` after Lead provides the schema. Backend NEVER edits the schema file itself.

### Contract 3: `src/lib/api-types.ts`
- **Written by**: Backend Agent
- **Read by**: Frontend Agent
- **Rule**: Every API route must have its request and response types defined here. Frontend never guesses at API shapes — it imports from this file.
- **Naming convention**: `{Resource}{Action}Request` / `{Resource}{Action}Response`
  - Examples: `LeagueCreateRequest`, `LeagueCreateResponse`, `DraftPickRequest`, `DraftStateResponse`

---

## 6. SEQUENCING AND DEPENDENCIES

All three agents start working simultaneously. Here is what blocks what:

```
TIME ──────────────────────────────────────────────────────►

LEAD AGENT:
  [Ask user questions] → [game-config.ts] → [schema.prisma] → [seed.ts] → DONE
                               │                   │
                               ▼                   ▼
BACKEND AGENT:
  [Scaffold dirs] → [prisma.ts] → [auth.ts] → [Run migrations] → [API routes] → [Socket.io] → DONE
  [api-types.ts]    [server.ts]   [auth route]       │
                                                     ▼
FRONTEND AGENT:
  [globals.css] → [design tokens] → [layout.tsx] → [Components] → [Static pages w/ mock data] → [Wire to APIs] → DONE
  [mock-data.ts]                    [Navbar]
```

**Start immediately (no dependencies)**:
- Lead: game-config.ts (rules are defined in Sections 8–10)
- Backend: folder scaffold, prisma.ts, server.ts, api-types.ts (draft types from Section 12), auth setup
- Frontend: globals.css, design tokens, component shells, layout.tsx, landing page, mock-data.ts

**Blocked on Lead Agent**:
- Backend: running `prisma migrate dev` → needs `schema.prisma`
- Backend: API routes that query the DB → need generated Prisma types from schema
- Lead: `seed.ts` → needs `schema.prisma` to be finalized (self-dependency, Lead does both)

**Blocked on Backend Agent**:
- Frontend: wiring real API calls → needs Backend routes to exist
- Frontend: Socket.io draft room → needs `server.ts` and `socket.ts` to exist

**If you are blocked**: Build everything you can with stubs and mocks. Do NOT wait idle. Annotate blocked code with `// BLOCKED: reason`.

---

## 7. CLEAN REBUILD INSTRUCTIONS

> **This section is for the user to execute BEFORE agents start. Agents: do not execute these steps.**

### Keep these files:
- `.git/`, `.gitignore`
- `package.json`, `package-lock.json`, `node_modules/`
- `next.config.ts`, `tsconfig.json`, `next-env.d.ts`
- `postcss.config.mjs`, `eslint.config.mjs`
- `public/vctlogo.png`
- `CLAUDE.md` (this file)

### Delete these directories:
```bash
rm -rf app/
rm -rf backend/
rm -rf .next/
```

### Install new dependencies:
```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter socket.io socket.io-client
npm install -D tsx
```

### Create `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/vct_fantasy"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Disable co-author on commits:
Edit `~/.claude/settings.json` and add:
```json
{
  "attribution": {
    "commit": ""
  }
}
```

### Create the `src/` directory:
```bash
mkdir -p src/app src/components src/lib src/server src/hooks prisma
```

---

## 8. GAME RULES

### League Structure
- A league has 2–12 members (configurable by creator at creation time).
- Each league has one creator who is auto-joined as the first member.
- Other members join via a unique invite code (8 alphanumeric characters, case-insensitive).
- League states: `SETUP` → `DRAFTING` → `ACTIVE` → `COMPLETED`.
- The creator can start the draft when at least 2 members have joined (including themselves).
- A league operates on a weekly cycle tied to real VCT match weeks.

### Roster
- Each member has a roster of 7–10 players (size configured per league at creation).
- Roster is filled entirely during the draft — no free agent pickups for MVP.
- Active lineup: exactly 5 players per week. **No role or region constraints on the active lineup** (those are draft-only constraints).
- Bench: remaining players (roster size minus 5).
- One player on the roster is the **Captain** (permanent, determined by Round 1 draft pick).
- One player can optionally be designated as the **Star Player** each week (see Section 9).

### Weekly Cycle
1. Before a match week begins, each member sets their active lineup of 5 and optionally designates a Star Player.
2. Lineup lock deadline: a configured time before the week's first match.
3. If a member does not set a lineup before the deadline, their previous week's lineup carries over.
4. Points are calculated after match data is imported for that week.
5. Standings update after each week's scoring is complete.

---

## 9. SCORING SYSTEM

### Base Score Formula

For each player, per match:
```
BaseScore = (Kills × 10) + (Deaths × -5) + (Assists × 5) + (FirstKills × 10) + (FirstDeaths × -10) + (RoundsWon × 5) + (RoundsLost × -5) + (ADR / 10)
```

| Stat | Multiplier | Notes |
|------|-----------|-------|
| Kills | +10 | |
| Deaths | -5 | |
| Assists | +5 | |
| First Kills | +10 | First blood kills |
| First Deaths | -10 | Dying first in a round |
| Rounds Won | +5 | **MVP default: 0 (scraper doesn't capture yet)** |
| Rounds Lost | -5 | **MVP default: 0 (scraper doesn't capture yet)** |
| ADR | ÷10 | Average Damage per Round, divided by 10 |

### Multipliers

| Designation | Multiplier | Duration |
|------------|-----------|----------|
| Captain | 2× | Permanent (entire season) |
| Star Player | 3× | 1 week active, then 2-week cooldown |
| Normal | 1× | Default |

### Star Player Rules
- Each week, a member MAY designate one rostered player as their Star Player.
- That player scores at 3× for that week ONLY.
- After being starred, that player enters a **2-week cooldown** — they CANNOT be designated Star Player again during those 2 weeks. They CAN still play in the active lineup at normal 1× (or 2× if they're the Captain).
- **Star + Captain interaction**: If the Captain is designated as Star Player, the multiplier is **3× (Star overrides Captain for that week)**. It does **NOT** stack to 6×. The Lead Agent should confirm this with the user.
- Star Player designation must be made before the weekly lineup lock deadline.
- Only one Star Player per member per week.

### Weekly Member Score
- Sum of the final scored points of all 5 active lineup players for that week.
- Bench players earn **0 points** regardless of real match performance.
- If a player in the active lineup has no match that week, they contribute 0 points.

---

## 10. DRAFT RULES

### Player Pool
- 240 VCT professional players across 4 regions.
- Regions: Americas, Pacific, EMEA, China (roughly 60 per region in seed data).
- Each player has: name, team, region, primary role (Duelist / Initiator / Controller / Sentinel).

### Draft Format: Snake Draft
- Draft order is randomized when the creator clicks "Start Draft".
- **Snake order**: Round 1 goes Player 1→N, Round 2 goes N→1, Round 3 goes 1→N, etc.
- Number of rounds = league's configured roster size (7–10).
- Total picks = roster size × number of league members.

### Captain Round
- **Round 1 is the Captain Round**: whatever player you pick in Round 1 becomes your permanent Captain (2× multiplier for the entire season).
- The Captain CANNOT be moved to bench — they are always in the active lineup.
- A banner/callout should be shown during Round 1 making this clear.

### Draft Constraints
By the END of the draft, each member's roster must satisfy:

**Role constraints (for 10-player roster)**:
| Slot Type | Count | Restriction |
|-----------|-------|-------------|
| Duelist | 2 | Must be Duelist role |
| Initiator | 2 | Must be Initiator role |
| Controller | 2 | Must be Controller role |
| Sentinel | 2 | Must be Sentinel role |
| Wildcard | 2 | Any role |

For smaller roster sizes, reduce Wildcard slots first:
- 9 players: 2D / 2I / 2C / 2S / 1W
- 8 players: 2D / 2I / 2C / 2S / 0W
- 7 players: **Lead Agent must ask user** which role slot to reduce

**Region constraints**:
- Minimum 2 players from EACH of the 4 regions (= 8 region-locked slots minimum).
- Remaining slots (0–2 depending on roster size) can be from any region.

**Constraint enforcement during draft**: The draft UI should show warnings as a member approaches constraint violations, but should NOT block picks mid-draft. Constraints are validated at draft completion — if violated (shouldn't happen with proper UI guidance), the last pick(s) are force-corrected.

### Draft Timer
- Configurable per league: 30s, 45s, 60s (default), 90s, 120s.
- If the timer expires: **Lead Agent must ask user** whether auto-pick (random valid player) or skip.
- Timer is synchronized across all clients via Socket.io.

### Draft State
- The entire draft state (all picks, current turn, timer, draft order) is stored in the database and synchronized in real-time via Socket.io.
- All league members see picks as they happen.
- A draft log shows all picks chronologically.
- After the last pick, the draft state transitions to `COMPLETE` and the league state changes to `ACTIVE`.

---

## 11. DATA PIPELINE

### vlrScraper Output Format

The scraper (separate repo at `c:/Users/water/Desktop/site/vlrScraper/vlrScraper/`) outputs tab-separated text files with `.json` extension. **These are NOT valid JSON — they are TSV text.**

File format:
```
Header row (first line):
Rating		ACS		Kills		Deaths		Assists		+/-		KAST		ADR		HS%		FK		FD		+/-

Then alternating pairs of lines (player name, then stats):
PlayerName
1.20		215		63		43		14		+20		76%		157		27%		12		5		+7
NextPlayerName
0.98		180		39		43		11		-4		71%		131		22%		5		8		-3
```

- 10 players per match file (5 per team).
- Stats are separated by tabs (often double-tabs).
- Percentage values include the `%` symbol.
- `+/-` values include the `+` or `-` sign.

**Existing match files** (use for seed data):
- `c:/Users/water/Desktop/site/vlrScraper/vlrScraper/match596400.json`
- `c:/Users/water/Desktop/site/vlrScraper/vlrScraper/match596401.json`
- `c:/Users/water/Desktop/site/vlrScraper/vlrScraper/match596402.json`
- `c:/Users/water/Desktop/site/valorant-fantasy/backend/match596399.json`

### Stats Import (Backend Agent builds this)
- `POST /api/stats/import` accepts uploaded file content (the TSV text).
- Parser reads the alternating name/stats lines, extracts values.
- For each player: find-or-create the Player record, then create a PlayerMatchStats record.
- Stats stored: kills, deaths, assists, firstKills, firstDeaths, adr, acs, rating, hsPercent, kast.
- **RoundsWon and RoundsLost default to 0** for MVP (scraper doesn't capture them).

### Seed Data (Lead Agent builds this)
`prisma/seed.ts` must:
1. Create 240 Player records with realistic VCT pro names, proper regions, roles, and teams.
2. Parse the 4 existing match files and create PlayerMatchStats records.
3. Create 1–2 sample leagues with members for testing (can use fake users).

---

## 12. API ROUTE SPECIFICATIONS

All routes under `src/app/api/`. All return JSON. Authenticated routes return `401` if no session.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `*` | `/api/auth/[...nextauth]` | No | NextAuth handler (Google OAuth flows) |

### Leagues
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/leagues` | Yes | List all leagues the current user is a member of |
| `POST` | `/api/leagues` | Yes | Create a new league. Body: `{ name, rosterSize, draftPickTime }`. Returns league with invite code. |
| `GET` | `/api/leagues/[leagueId]` | Member | Get league details (members, status, settings) |
| `POST` | `/api/leagues/[leagueId]/join` | Yes | Join via invite code. Body: `{ inviteCode }` |
| `POST` | `/api/leagues/[leagueId]/draft/start` | Creator | Start the draft. Randomizes order, sets status to DRAFTING. |
| `GET` | `/api/leagues/[leagueId]/draft` | Member | Get full draft state (picks, current turn, timer, order) |
| `POST` | `/api/leagues/[leagueId]/draft/pick` | Member | Make a draft pick. Body: `{ playerId }`. Must be current picker's turn. |
| `GET` | `/api/leagues/[leagueId]/roster` | Member | Get the current user's roster in this league |
| `PUT` | `/api/leagues/[leagueId]/roster/lineup` | Member | Set active lineup. Body: `{ playerIds: string[] }` (exactly 5). |
| `PUT` | `/api/leagues/[leagueId]/roster/star` | Member | Designate Star Player. Body: `{ playerId }` |
| `GET` | `/api/leagues/[leagueId]/standings` | Member | Get league standings (all members' total + weekly scores) |

### Players
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/players` | Yes | List players. Query params: `?region=&role=&search=&page=&limit=` |
| `GET` | `/api/players/[playerId]` | Yes | Get player details + match stats history |

### Stats Import
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/stats/import` | Yes | Import match stats from TSV file content. Body: `{ matchId, content }` |

### Socket.io Events (Draft Room)
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `draft:join` | Client→Server | `{ leagueId }` | Join the draft room for a league |
| `draft:pick` | Client→Server | `{ leagueId, playerId }` | Submit a draft pick |
| `draft:state` | Server→Client | `DraftStateResponse` | Full draft state (sent on join and after each pick) |
| `draft:picked` | Server→Client | `{ pick: DraftPickResponse }` | Broadcast a new pick to all members |
| `draft:turn` | Server→Client | `{ userId, round, pickNumber, timeRemaining }` | Turn change notification |
| `draft:timer` | Server→Client | `{ secondsRemaining }` | Timer tick (every second during active turn) |
| `draft:complete` | Server→Client | `{ leagueId }` | Draft finished — all picks made |
| `draft:error` | Server→Client | `{ message }` | Error message (not your turn, invalid pick, etc.) |

---

## 13. DATABASE SCHEMA REQUIREMENTS

The Lead Agent writes `prisma/schema.prisma`. It MUST include at minimum:

### NextAuth Required Models
- **User**: id, name, email, image, emailVerified, accounts[], sessions[]
- **Account**: NextAuth required fields (userId, type, provider, providerAccountId, refresh_token, access_token, etc.)
- **Session**: NextAuth required fields (sessionToken, userId, expires)
- **VerificationToken**: NextAuth required fields (identifier, token, expires)

### Application Models
- **League**: id, name, inviteCode (unique), status (enum: SETUP/DRAFTING/ACTIVE/COMPLETED), creatorId (FK→User), rosterSize (int), draftPickTime (int, seconds), createdAt, updatedAt
- **LeagueMember**: id, leagueId (FK→League), userId (FK→User), joinedAt. Unique constraint on `[leagueId, userId]`.
- **Player**: id, name, team, region (enum: Americas/Pacific/EMEA/China), role (enum: Duelist/Initiator/Controller/Sentinel), imageUrl (optional)
- **PlayerMatchStats**: id, playerId (FK→Player), externalMatchId (string — the vlr.gg match ID), kills, deaths, assists, firstKills, firstDeaths, roundsWon (default 0), roundsLost (default 0), adr (float), acs (float), rating (float), hsPercent (float), kast (float), createdAt. Unique constraint on `[playerId, externalMatchId]`.
- **DraftState**: id, leagueId (FK→League, unique), status (enum: WAITING/IN_PROGRESS/COMPLETE), currentRound (int), currentPickIndex (int), draftOrder (Json — array of userId strings), startedAt, completedAt
- **DraftPick**: id, draftStateId (FK→DraftState), userId (FK→User), playerId (FK→Player), round (int), pickNumber (int), isCaptain (boolean, default false), pickedAt
- **Roster**: id, leagueMemberId (FK→LeagueMember, unique), leagueId (FK→League)
- **RosterPlayer**: id, rosterId (FK→Roster), playerId (FK→Player), isCaptain (boolean), slotType (enum: Duelist/Initiator/Controller/Sentinel/Wildcard)
- **WeeklyLineup**: id, rosterId (FK→Roster), weekNumber (int), isLocked (boolean, default false). Unique constraint on `[rosterId, weekNumber]`.
- **LineupSlot**: id, weeklyLineupId (FK→WeeklyLineup), rosterPlayerId (FK→RosterPlayer), isStarPlayer (boolean, default false)
- **WeeklyScore**: id, leagueMemberId (FK→LeagueMember), weekNumber (int), totalPoints (float), breakdown (Json — per-player score details). Unique constraint on `[leagueMemberId, weekNumber]`.

### Schema Requirements
- Use `@relation` properly with explicit foreign key fields.
- Use Prisma enums for Region, PlayerRole, LeagueStatus, DraftStatus, SlotType.
- Add `@@index` on frequently queried fields: leagueId, playerId, weekNumber, externalMatchId.
- Use `@default(cuid())` for all id fields.
- Use `@default(now())` for createdAt fields.
- Use `@updatedAt` for updatedAt fields.

---

## 14. FRONTEND DESIGN SYSTEM

### Color Palette

Define these as CSS custom properties in `src/app/globals.css`:

```css
:root {
  /* === Backgrounds === */
  --bg-primary: #0f1923;       /* Deep navy-black — main background */
  --bg-secondary: #1a2634;     /* Cards, panels, elevated surfaces */
  --bg-tertiary: #243447;      /* Hover states, active surfaces */
  --bg-accent: #2c3e50;        /* Highlighted sections */
  --bg-overlay: rgba(15, 25, 35, 0.85); /* Modal/overlay backdrop */

  /* === Brand / Accent === */
  --accent-red: #ff4655;       /* Valorant signature red — primary CTA, key highlights */
  --accent-red-hover: #ff6b77; /* Red hover state */
  --accent-red-muted: #8b2631; /* Subtle red backgrounds, glows */
  --accent-gold: #f5c542;      /* Captain badge, Star Player highlights, premium feel */
  --accent-gold-muted: #8b6914;/* Subtle gold backgrounds */
  --accent-teal: #2dd4bf;      /* Secondary accent — links, info, success-adjacent */
  --accent-teal-hover: #5eead4;

  /* === Text === */
  --text-primary: #ece8e1;     /* Warm off-white — primary readable text */
  --text-secondary: #8b978f;   /* Muted gray-green — secondary/supporting text */
  --text-muted: #5a6672;       /* Very muted — tertiary text, placeholders */
  --text-on-accent: #0f1923;   /* Dark text on bright accent backgrounds */

  /* === Borders === */
  --border-default: #2a3a4a;   /* Standard borders */
  --border-subtle: #1e2d3d;    /* Very subtle dividers */
  --border-accent: rgba(255, 70, 85, 0.2); /* Subtle red border glow */

  /* === Status === */
  --status-live: #ef4444;      /* Live match indicator (red pulse) */
  --status-success: #4ade80;   /* Positive/success states */
  --status-warning: #fbbf24;   /* Warning/attention states */
  --status-error: #ef4444;     /* Error states */
}
```

### Typography

- **Display font**: A bold, geometric or angular font for headings, player names, stats, and numbers. Choose one distinctive font from Google Fonts — suggestions: `Rajdhani`, `Teko`, `Big Shoulders Display`, `Orbitron`. Do NOT use Inter, Roboto, Arial, or any system font.
- **Body font**: A clean, readable sans-serif for paragraphs, labels, and form text. Choose something that pairs well with the display font — suggestion: `DM Sans`, `Outfit`, `Manrope`. Again, NOT Inter/Roboto/Arial.
- Import via `next/font/google` in `src/app/layout.tsx`. Set as CSS variables `--font-display` and `--font-body`.
- Use the display font for: page titles, section headings, player names, stat numbers, buttons.
- Use the body font for: body text, labels, descriptions, form inputs, nav links.

### Component Design Principles

1. **Sharp angles over rounded corners**: Use `clip-path` on important cards/buttons for angular/beveled corners. Example: `clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))`. Reserve standard `rounded` for small/subtle elements only.

2. **Subtle glow effects**: Red glow on key interactive elements: `box-shadow: 0 0 20px rgba(255, 70, 85, 0.15)`. Gold glow for Captain/Star badges: `box-shadow: 0 0 15px rgba(245, 197, 66, 0.2)`.

3. **Backgrounds with depth**: Use subtle gradient overlays, noise textures, or geometric patterns to avoid flat solid backgrounds. The landing page especially should feel atmospheric.

4. **Transitions**: All interactive elements use `transition: all 150ms ease`. Staggered list animations using `animation-delay` (increment by 50–75ms per item).

5. **Hover states**: Every clickable element must have a visible hover state — color shift, glow intensify, slight scale, or border color change.

### Player Card Variants

The **PlayerCard** is the most important reusable component. Three variants:

**Full (Hero View)** — used in the My Roster hero display:
- Tall card (~200px wide, ~350px tall)
- Player name (large, display font)
- Team name
- Role icon + region flag
- Captain badge (gold crown) or Star Player badge (gold star with glow)
- This week's stats: Kills (large), Deaths, Assists, Points
- Status indicator: "Playing today" / "Played" / "Upcoming" / "No match"
- Subtle glow border based on performance (green = high, neutral = average, red = negative)

**Medium** — used in draft board, trade offers, standings expansion:
- Horizontal card (~300px wide, ~80px tall)
- Player name, team, role icon, region flag
- Key stat (Fantasy Points avg or this week's score)
- Draft status badge if in draft context

**Compact** — used in player lists, search results, roster bench:
- Single row (~full width, ~48px tall)
- Player name, role icon (small), region flag (small), team abbreviation
- 2–3 key stats inline
- Action button (Draft / Swap / Add)

### The Hero Roster Display (SIGNATURE UI MOMENT)

This is the centerpiece of the **My Roster** page (Section 15, Page 7). It should feel like Valorant's party/agent select screen.

- **5 active players** displayed in a prominent horizontal row, each as a Full PlayerCard.
- The entire row has a subtle atmospheric background — dark gradient with faint geometric shapes or light particles.
- **Captain** has a persistent gold crown icon and faint gold border glow.
- **Star Player** has an animated gold star with pulsing glow effect.
- Cards have a slight overlap or staggered depth effect (not perfectly flat in a row).
- Below the hero row: **Bench section** with Compact cards, visually receded (lower opacity or smaller scale).
- A **lineup lock countdown timer** displayed prominently above or beside the hero row.
- Total weekly score displayed large in the corner.

### What NOT to Do (Design Anti-Patterns)
- No purple gradients on white backgrounds
- No generic card grids with uniform rounded corners and drop shadows
- No cookie-cutter dashboards that look like every SaaS template
- No overuse of icons without purpose
- No walls of text — use numbers, badges, and visual hierarchy
- No light mode (dark only for MVP)

---

## 15. PAGE SPECIFICATIONS

### Page 1: Landing Page — `src/app/(pages)/page.tsx`
- **Public** — no auth required
- Hero section: large headline ("Build Your VCT Dream Team" or similar), subheadline, atmospheric dark background
- VCT Fantasy branding using `vctlogo.png`
- "Sign in with Google" button (primary CTA, Valorant red)
- How It Works: 3–4 step visual flow (Create League → Draft → Set Lineup → Compete)
- Feature highlights: snake draft, captain/star system, real VCT stats
- Dark, immersive, sets the tone for the entire app

### Page 2: Dashboard — `src/app/(pages)/dashboard/page.tsx`
- **Auth required** (redirect to landing if not signed in)
- Welcome: "Welcome back, [Name]"
- League cards: for each league the user is in, show name, member count, status, user's rank
- Quick actions: "Create League" and "Join League" buttons
- If no leagues: empty state with illustration/guidance

### Page 3: Create League — `src/app/(pages)/league/create/page.tsx`
- **Auth required**
- Form: league name (text, max 50 chars), roster size (dropdown: 7–10), draft pick timer (dropdown: 30s/45s/60s/90s/120s)
- "Create League" button → `POST /api/leagues`
- On success: redirect to league lobby, show invite code modal

### Page 4: Join League — `src/app/(pages)/league/join/page.tsx`
- **Auth required**
- Form: invite code input (8 characters)
- "Join League" button → `POST /api/leagues/[id]/join`
- Error handling: invalid code, league full, already member
- On success: redirect to league lobby

### Page 5: League Lobby — `src/app/(pages)/league/[leagueId]/page.tsx`
- **Auth required, member only**
- League name, invite code (with copy button), draft countdown or status
- Member list: avatar, name, ready status
- Creator sees "Start Draft" button (enabled when 2+ members)
- Non-creators see "Waiting for [creator] to start the draft..."
- When draft starts: redirect all members to draft page (poll or Socket.io)

### Page 6: Draft Room — `src/app/(pages)/league/[leagueId]/draft/page.tsx`
- **Auth required, member only. Most complex page.**
- **Top bar**: Round indicator, pick number, current drafter's name, countdown timer (large, red when <10s), draft direction arrow
- **Left panel — Your Roster**: Drafted players grouped by role, slot indicators (e.g., "Duelist 1/2"), region checklist, Captain badge on Round 1 pick
- **Center — Draft Board**: Grid of all picks (rows=rounds, cols=members). Filled cells show player name+role. Current pick cell pulsing. User's column highlighted.
- **Right panel — Player Pool**: Search bar, filters (region, role, team), sortable player list. Each row: name, team, role, region, "Draft" button (active only on user's turn). Drafted players grayed out.
- **Bottom — Draft Log**: Chronological feed of picks with timestamps
- **Round 1 Banner**: "CAPTAIN ROUND — Your first pick becomes your permanent Captain (2× points)"
- **Real-time via Socket.io**: all picks, timer, turn changes broadcast instantly
- **Post-draft modal**: Shows complete roster, Captain highlighted, "Go to My Roster" button

### Page 7: My Roster — `src/app/(pages)/league/[leagueId]/roster/page.tsx`
- **Auth required, member only. THE HERO PAGE.**
- **Hero View** (see Section 14): 5 active players in signature display
- **Week selector**: horizontal tabs for each week (current week highlighted)
- **Lineup lock timer**: countdown displayed prominently
- **Bench section**: remaining players as Compact cards with "Swap" buttons
- **Star Player button**: "Activate Star Player" opens a selection flow. Shows cooldown status for previously starred players.
- **Captain info**: permanent badge, cannot be moved to bench
- **Save Lineup button**: commits active 5 + star designation for the week
- **Weekly score summary**: total points + per-player breakdown if matches are complete

### Page 8: Standings — `src/app/(pages)/league/[leagueId]/standings/page.tsx`
- **Auth required, member only**
- Standings table: rank, member name/avatar, total points, this week's points, trend arrows
- Current user's row highlighted
- Click a member row to expand and see their active lineup + per-player scores
- Weekly breakdown toggle: show score per week as columns

---

## 16. COORDINATION PROTOCOL

### Git Workflow
- Each agent works on its own branch in a git worktree:
  - Lead: `lead/game-design`
  - Backend: `backend/api`
  - Frontend: `frontend/ui`
- Commit frequently with descriptive messages.
- The **user** merges branches. Agents do NOT merge or rebase.
- If you need to see another agent's work, ask the user — do not switch branches.

### Communication via Code Comments
Since agents cannot talk to each other, use these conventions:

```typescript
// TODO(backend): Need this API to return paginated results — see api-types.ts
// TODO(lead): game-config.ts needs a constant for max bench size
// TODO(frontend): This endpoint returns { data, pagination } shape, handle accordingly
// BLOCKED: Waiting on schema.prisma — using placeholder types for now
// ASSUMPTION: Assuming roster size is always 10, will replace with game-config import
// TEMPORARY: Local type definition — replace with import from api-types.ts
```

### Conflict Prevention
- The directory structure in Section 3 defines clear ownership. **Respect it absolutely.**
- If two agents need a shared utility, it goes in `src/lib/utils.ts` — coordinate with the user first.
- If Frontend needs a type that Backend hasn't defined yet, define it locally with a `// TEMPORARY` comment.
- Never create files in another agent's territory, even "helpful" ones.

---

## 17. CODE STANDARDS

### TypeScript
- Strict mode is ON (`tsconfig.json` has `"strict": true`). Do not use `any`. Use `unknown` and narrow.
- Export types/interfaces from the file where they are defined.
- Use `type` for object shapes, `interface` for extendable contracts.
- Use `as const` assertions for literal types and const arrays.
- All exported functions must have explicit return types.

### File Naming
- React components: `PascalCase.tsx` (e.g., `PlayerCard.tsx`, `DraftBoard.tsx`)
- Non-component TypeScript: `camelCase.ts` (e.g., `gameConfig.ts`, `apiTypes.ts`)
- Page files: always `page.tsx` (Next.js convention)
- Layout files: always `layout.tsx`

### React Patterns
- **Server Components by default.** Only add `'use client'` when the component needs interactivity, hooks, or browser APIs.
- Data fetching in Server Components where possible (direct `fetch` to API routes or Prisma calls via server actions).
- Client Components for: forms, event handlers, Socket.io connections, timers, drag-and-drop.
- No prop drilling beyond 2 levels — use composition or React Context.

### API Patterns (Backend Agent)
- Validate all request bodies manually. Use simple type-checking helpers — do NOT add zod, yup, or similar (keep dependencies minimal).
- Return consistent error shapes: `{ error: string, code?: string }`.
- Use HTTP status codes correctly: `200` (ok), `201` (created), `400` (bad request), `401` (unauthorized), `403` (forbidden), `404` (not found), `500` (server error).
- Wrap all database operations in try/catch.
- Always check auth via `getServerSession()` or Auth.js `auth()` before any data operation.
- Use Prisma transactions for multi-step operations (e.g., making a draft pick: update DraftState + create DraftPick + create RosterPlayer).

### Prisma Patterns (Backend Agent)
- Use the singleton in `src/lib/prisma.ts`:
  ```typescript
  import { PrismaClient } from '@prisma/client'
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
  export const prisma = globalForPrisma.prisma || new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```
- Use `include` for relations only when needed — avoid over-fetching.
- Use `select` when you only need a few fields from a large model.
- Use transactions (`prisma.$transaction([...])`) for multi-step operations.

---

## 18. DEFINITION OF DONE

### MVP is complete when ALL of these work end-to-end:
- [ ] A user can sign in with Google OAuth
- [ ] A user can create a league with custom name, roster size (7–10), and draft timer
- [ ] A user can copy an invite code and share it
- [ ] Another user can join a league using the invite code
- [ ] The league creator can start a snake draft when 2+ members are present
- [ ] All members see the draft in real-time (Socket.io): picks, timer, turn changes
- [ ] Round 1 is clearly marked as the Captain Round
- [ ] Draft enforces role and region constraints (with warnings)
- [ ] After drafting, each member sees their full roster in the Hero View
- [ ] Members can swap players between active lineup and bench
- [ ] Members can designate a Star Player (with cooldown tracking)
- [ ] Captain is always in active lineup and cannot be benched
- [ ] Standings page shows correct point totals calculated from imported match data
- [ ] The entire app has a cohesive, dark, Valorant-inspired design that feels polished and distinctive
- [ ] The Hero Roster Display is visually striking and feels like the signature moment of the app

### NOT in MVP (do not build these):
- Trade system / Trade Hub
- Waiver wire / free agent pickups
- Team Builder sandbox
- Player Stats deep-dive page
- Player Detail page
- Schedule / Match Calendar page
- Chat / messaging system
- Push notifications / email notifications
- Notification center
- Mobile-responsive layouts
- Light mode
- Real player images (use colored silhouettes/placeholders)
- Admin dashboard
- Multiple seasons / season history
- League deletion
- Profile/settings page
- Scoring formula customization per league
