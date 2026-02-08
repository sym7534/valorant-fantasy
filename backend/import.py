import sys
import re
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import sessionmaker
from models import engine, Player, MatchStat, Base

# --- CONFIGURATION ---
# VCT 2026 Americas Kickoff event ID (change this for different tournaments)
EVENT_ID = "2682"
EVENT_NAME = "vct-2026-americas-kickoff"
TOURNAMENT_URL = f"https://www.vlr.gg/event/matches/{EVENT_ID}/{EVENT_NAME}/?series_id=all&group=completed"
HEADERS = {"User-Agent": "ValorantFantasyScraper/1.0"}

# --- AGENT TO ROLE MAPPING ---
AGENT_ROLES = {
    # Duelists
    "Jett": "Duelist", "Phoenix": "Duelist", "Reyna": "Duelist",
    "Raze": "Duelist", "Yoru": "Duelist", "Neon": "Duelist", "Iso": "Duelist",
    # Initiators
    "Sova": "Initiator", "Breach": "Initiator", "Skye": "Initiator",
    "KAY/O": "Initiator", "Fade": "Initiator", "Gekko": "Initiator", "Tejo": "Initiator",
    # Controllers
    "Brimstone": "Controller", "Omen": "Controller", "Viper": "Controller",
    "Astra": "Controller", "Harbor": "Controller", "Clove": "Controller",
    # Sentinels
    "Killjoy": "Sentinel", "Cypher": "Sentinel", "Sage": "Sentinel",
    "Chamber": "Sentinel", "Deadlock": "Sentinel", "Vyse": "Sentinel",
}

# --- 1. SETUP DATABASE ---
Base.metadata.create_all(bind=engine)  # Auto-create tables if they don't exist
Session = sessionmaker(bind=engine)
session = Session()


def get_match_ids_from_tournament(tournament_url):
    """Scrape tournament page to get all completed match IDs."""
    print(f"Fetching tournament matches from: {tournament_url}")
    
    try:
        resp = requests.get(tournament_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching tournament page: {e}")
        return []
    
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Find all match links - they look like /596399/team-vs-team-event-name
    match_links = soup.select("a.wf-module-item.match-item")
    
    match_ids = []
    for link in match_links:
        href = link.get("href", "")
        # Extract match ID from URL like /596399/envy-vs-evil-geniuses-...
        match = re.search(r"/(\d+)/", href)
        if match:
            match_ids.append(match.group(1))
    
    # Remove duplicates while preserving order
    seen = set()
    unique_match_ids = []
    for mid in match_ids:
        if mid not in seen:
            seen.add(mid)
            unique_match_ids.append(mid)
    
    print(f"Found {len(unique_match_ids)} completed matches")
    return unique_match_ids


def import_match(match_id):
    """Import stats for a single match."""
    url = f"https://www.vlr.gg/{match_id}/"
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"  Error fetching match {match_id}: {e}")
        return False
    
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Find the "Overall" stats block
    overall = soup.select_one('div.vm-stats-game.mod-active[data-game-id="all"]')
    if not overall:
        print(f"  Match {match_id}: No overall stats found (match may still be live)")
        return False
    
    # Find ALL stats tables (one per team - there are 2)
    tables = overall.select("table.wf-table-inset.mod-overview")
    if not tables:
        print(f"  Match {match_id}: Stats table not found")
        return False
    
    # Get ALL player rows from BOTH teams
    rows = []
    for table in tables:
        rows.extend(table.select("tbody tr"))
    players_logged = 0
    players_skipped = 0
    
    for row in rows:
        # Extract Player Name & Team
        player_name_div = row.select_one("td.mod-player div.text-of")
        player_team_div = row.select_one("td.mod-player div.ge-text-light")
        
        if not player_name_div:
            continue
        
        player_name = player_name_div.get_text(strip=True)
        team_name = player_team_div.get_text(strip=True) if player_team_div else "Unknown"
        
        # Extract Agent and Determine Role
        agent_img = row.select_one("td.mod-agents img")
        if agent_img:
            agent_name = agent_img.get("title") or agent_img.get("alt", "Unknown")
            role = AGENT_ROLES.get(agent_name, "Flex")
        else:
            role = "Unknown"
        
        # Extract Stats
        stat_values = []
        for cell in row.select("td.mod-stat"):
            value_span = cell.select_one(".side.mod-both") or cell.select_one(".side.mod-side.mod-both")
            raw_value = value_span.get_text(strip=True) if value_span else cell.get_text(" ", strip=True)
            stat_values.append(raw_value)
        
        # Process Stats
        try:
            k = int(stat_values[2])
            d = int(stat_values[3])
            a = int(stat_values[4])
            adr_val = int(stat_values[7])
            fk_val = int(stat_values[9])
            fd_val = int(stat_values[10])
            
            # Fantasy Calculation
            points = (k * 1) - (d * 0.5) + (a * 0.25) + (fk_val * 0.5) - (fd_val * 0.5)
            
        except (IndexError, ValueError) as e:
            continue
        
        # Database Operations
        player = session.query(Player).filter_by(riot_id=player_name).first()
        if not player:
            player = Player(riot_id=player_name, team_name=team_name, role=role)
            session.add(player)
            session.commit()
            session.refresh(player)
        
        # Check for Duplicate Stats
        existing_stat = session.query(MatchStat).filter_by(
            player_id=player.id,
            external_match_id=match_id
        ).first()
        
        if existing_stat:
            players_skipped += 1
        else:
            new_stat = MatchStat(
                player_id=player.id,
                external_match_id=match_id,
                kills=k,
                deaths=d,
                assists=a,
                adr=adr_val,
                first_kills=fk_val,
                first_deaths=fd_val,
                fantasy_points=points
            )
            session.add(new_stat)
            players_logged += 1
    
    session.commit()
    
    if players_logged > 0:
        print(f"  Match {match_id}: Logged {players_logged} players")
    elif players_skipped > 0:
        print(f"  Match {match_id}: Already imported (skipped)")
    
    return True


def main():
    """Main function to import all matches from a tournament."""
    print(f"=== VLR.gg Fantasy Stats Importer ===")
    print(f"Tournament: {EVENT_NAME}")
    print()
    
    # Get all match IDs from tournament
    match_ids = get_match_ids_from_tournament(TOURNAMENT_URL)
    
    if not match_ids:
        print("No matches found!")
        return
    
    # Import each match
    success_count = 0
    for i, match_id in enumerate(match_ids, 1):
        print(f"[{i}/{len(match_ids)}] Importing match {match_id}...")
        if import_match(match_id):
            success_count += 1
    
    print()
    print(f"=== Complete! Imported {success_count}/{len(match_ids)} matches ===")
    
    # Show summary
    player_count = session.query(Player).count()
    stat_count = session.query(MatchStat).count()
    print(f"Database now has: {player_count} players, {stat_count} match records")
    
    session.close()


if __name__ == "__main__":
    main()