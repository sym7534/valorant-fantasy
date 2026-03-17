-- CreateEnum
CREATE TYPE "Region" AS ENUM ('Americas', 'Pacific', 'EMEA', 'China');

-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('Duelist', 'Initiator', 'Controller', 'Sentinel');

-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('SETUP', 'DRAFTING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('Duelist', 'Initiator', 'Controller', 'Sentinel', 'Wildcard');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TradeItemSide" AS ENUM ('OFFERED', 'REQUESTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "inviteCode" VARCHAR(8) NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'SETUP',
    "creatorId" TEXT NOT NULL,
    "rosterSize" INTEGER NOT NULL DEFAULT 10,
    "draftPickTime" INTEGER NOT NULL DEFAULT 60,
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_members" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "role" "PlayerRole" NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_match_stats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "externalMatchId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL DEFAULT 1,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "firstKills" INTEGER NOT NULL,
    "firstDeaths" INTEGER NOT NULL,
    "roundsWon" INTEGER NOT NULL DEFAULT 0,
    "roundsLost" INTEGER NOT NULL DEFAULT 0,
    "adr" DOUBLE PRECISION NOT NULL,
    "acs" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "hsPercent" DOUBLE PRECISION NOT NULL,
    "kast" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_match_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_states" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "status" "DraftStatus" NOT NULL DEFAULT 'WAITING',
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "currentPickIndex" INTEGER NOT NULL DEFAULT 0,
    "draftOrder" JSONB NOT NULL,
    "turnExpiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "draft_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_picks" (
    "id" TEXT NOT NULL,
    "draftStateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "pickNumber" INTEGER NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "slotType" "SlotType" NOT NULL,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rosters" (
    "id" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "rosters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_players" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "slotType" "SlotType" NOT NULL,

    CONSTRAINT "roster_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_weeks" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "isLineupLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_lineups" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "weekly_lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineup_slots" (
    "id" TEXT NOT NULL,
    "weeklyLineupId" TEXT NOT NULL,
    "rosterPlayerId" TEXT NOT NULL,
    "isStarPlayer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lineup_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_scores" (
    "id" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "totalPoints" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,

    CONSTRAINT "weekly_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_queue_entries" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_items" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "rosterPlayerId" TEXT NOT NULL,
    "side" "TradeItemSide" NOT NULL,

    CONSTRAINT "trade_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_inviteCode_key" ON "leagues"("inviteCode");

-- CreateIndex
CREATE INDEX "leagues_creatorId_idx" ON "leagues"("creatorId");

-- CreateIndex
CREATE INDEX "leagues_status_idx" ON "leagues"("status");

-- CreateIndex
CREATE INDEX "leagues_archivedAt_idx" ON "leagues"("archivedAt");

-- CreateIndex
CREATE INDEX "league_members_leagueId_idx" ON "league_members"("leagueId");

-- CreateIndex
CREATE INDEX "league_members_userId_idx" ON "league_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "league_members_leagueId_userId_key" ON "league_members"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "players_region_idx" ON "players"("region");

-- CreateIndex
CREATE INDEX "players_role_idx" ON "players"("role");

-- CreateIndex
CREATE INDEX "players_team_idx" ON "players"("team");

-- CreateIndex
CREATE INDEX "player_match_stats_playerId_idx" ON "player_match_stats"("playerId");

-- CreateIndex
CREATE INDEX "player_match_stats_externalMatchId_idx" ON "player_match_stats"("externalMatchId");

-- CreateIndex
CREATE INDEX "player_match_stats_weekNumber_idx" ON "player_match_stats"("weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "player_match_stats_playerId_externalMatchId_key" ON "player_match_stats"("playerId", "externalMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_states_leagueId_key" ON "draft_states"("leagueId");

-- CreateIndex
CREATE INDEX "draft_states_status_idx" ON "draft_states"("status");

-- CreateIndex
CREATE INDEX "draft_states_turnExpiresAt_idx" ON "draft_states"("turnExpiresAt");

-- CreateIndex
CREATE INDEX "draft_picks_draftStateId_idx" ON "draft_picks"("draftStateId");

-- CreateIndex
CREATE INDEX "draft_picks_userId_idx" ON "draft_picks"("userId");

-- CreateIndex
CREATE INDEX "draft_picks_playerId_idx" ON "draft_picks"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_picks_draftStateId_pickNumber_key" ON "draft_picks"("draftStateId", "pickNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rosters_leagueMemberId_key" ON "rosters"("leagueMemberId");

-- CreateIndex
CREATE INDEX "rosters_leagueId_idx" ON "rosters"("leagueId");

-- CreateIndex
CREATE INDEX "roster_players_rosterId_idx" ON "roster_players"("rosterId");

-- CreateIndex
CREATE INDEX "roster_players_playerId_idx" ON "roster_players"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "roster_players_rosterId_playerId_key" ON "roster_players"("rosterId", "playerId");

-- CreateIndex
CREATE INDEX "league_weeks_leagueId_idx" ON "league_weeks"("leagueId");

-- CreateIndex
CREATE INDEX "league_weeks_weekNumber_idx" ON "league_weeks"("weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "league_weeks_leagueId_weekNumber_key" ON "league_weeks"("leagueId", "weekNumber");

-- CreateIndex
CREATE INDEX "weekly_lineups_rosterId_idx" ON "weekly_lineups"("rosterId");

-- CreateIndex
CREATE INDEX "weekly_lineups_weekNumber_idx" ON "weekly_lineups"("weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_lineups_rosterId_weekNumber_key" ON "weekly_lineups"("rosterId", "weekNumber");

-- CreateIndex
CREATE INDEX "lineup_slots_weeklyLineupId_idx" ON "lineup_slots"("weeklyLineupId");

-- CreateIndex
CREATE INDEX "lineup_slots_rosterPlayerId_idx" ON "lineup_slots"("rosterPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "lineup_slots_weeklyLineupId_rosterPlayerId_key" ON "lineup_slots"("weeklyLineupId", "rosterPlayerId");

-- CreateIndex
CREATE INDEX "weekly_scores_leagueMemberId_idx" ON "weekly_scores"("leagueMemberId");

-- CreateIndex
CREATE INDEX "weekly_scores_weekNumber_idx" ON "weekly_scores"("weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_scores_leagueMemberId_weekNumber_key" ON "weekly_scores"("leagueMemberId", "weekNumber");

-- CreateIndex
CREATE INDEX "draft_queue_entries_leagueId_userId_idx" ON "draft_queue_entries"("leagueId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_queue_entries_leagueId_userId_playerId_key" ON "draft_queue_entries"("leagueId", "userId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_queue_entries_leagueId_userId_priority_key" ON "draft_queue_entries"("leagueId", "userId", "priority");

-- CreateIndex
CREATE INDEX "trades_leagueId_idx" ON "trades"("leagueId");

-- CreateIndex
CREATE INDEX "trades_fromMemberId_idx" ON "trades"("fromMemberId");

-- CreateIndex
CREATE INDEX "trades_toMemberId_idx" ON "trades"("toMemberId");

-- CreateIndex
CREATE INDEX "trade_items_tradeId_idx" ON "trade_items"("tradeId");

-- CreateIndex
CREATE INDEX "trade_items_rosterPlayerId_idx" ON "trade_items"("rosterPlayerId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_states" ADD CONSTRAINT "draft_states_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_draftStateId_fkey" FOREIGN KEY ("draftStateId") REFERENCES "draft_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "league_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_players" ADD CONSTRAINT "roster_players_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "rosters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_players" ADD CONSTRAINT "roster_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_weeks" ADD CONSTRAINT "league_weeks_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_lineups" ADD CONSTRAINT "weekly_lineups_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "rosters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_slots" ADD CONSTRAINT "lineup_slots_weeklyLineupId_fkey" FOREIGN KEY ("weeklyLineupId") REFERENCES "weekly_lineups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_slots" ADD CONSTRAINT "lineup_slots_rosterPlayerId_fkey" FOREIGN KEY ("rosterPlayerId") REFERENCES "roster_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_scores" ADD CONSTRAINT "weekly_scores_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "league_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_queue_entries" ADD CONSTRAINT "draft_queue_entries_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_queue_entries" ADD CONSTRAINT "draft_queue_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_queue_entries" ADD CONSTRAINT "draft_queue_entries_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "league_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "league_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_rosterPlayerId_fkey" FOREIGN KEY ("rosterPlayerId") REFERENCES "roster_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
