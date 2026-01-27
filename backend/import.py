import sys
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import sessionmaker
from models import engine, Player, MatchStat

# --- CONFIGURATION ---
MATCH_ID = "596402"
URL = f"https://www.vlr.gg/{MATCH_ID}/"
HEADERS = {"User-Agent": "TEST"}

# --- 1. SETUP DATABASE ---
Session = sessionmaker(bind=engine)
session = Session()

print(f"Starting job for Match: {MATCH_ID}")

# --- 2. SCRAPE DATA ---
try:
    print(f"Requesting {URL}...")
    resp = requests.get(URL, headers=HEADERS, timeout=20)
    resp.raise_for_status() # Stop if website is down/404
except requests.exceptions.RequestException as e:
    print(f"Network Error: {e}")
    sys.exit(1)

soup = BeautifulSoup(resp.text, "html.parser")

# --- 3. PARSE HTML ---
# Find the "Overall" stats block
overall = soup.select_one('div.vm-stats-game.mod-active[data-game-id="all"]')
if not overall:
    print("Error: Overall stats block not found on page.")
    sys.exit(1)

# Find the main table inside that block
table = overall.select_one("table.wf-table-inset.mod-overview")
if not table:
    print("Error: Stats table not found.")
    sys.exit(1)

rows = table.select("tbody tr")
print(f"Found {len(rows)} players. Processing...")

# --- 4. LOOP & SAVE TO DB ---
for row in rows:
    # A. Extract Player Name & Team
    player_name_div = row.select_one("td.mod-player div.text-of")
    player_team_div = row.select_one("td.mod-player div.ge-text-light")

    if not player_name_div: 
        continue

    player_name = player_name_div.get_text(strip=True)
    team_name = player_team_div.get_text(strip=True) if player_team_div else "Unknown"

    # B. Extract Stats (Loop through columns)
    stat_values = []
    for cell in row.select("td.mod-stat"):
        # Get value from 'both' (attack + defense combined)
        value_span = cell.select_one(".side.mod-both") or cell.select_one(".side.mod-side.mod-both")
        
        # Clean the text (remove tags, whitespace)
        raw_value = value_span.get_text(strip=True) if value_span else cell.get_text(" ", strip=True)
        stat_values.append(raw_value)

    # C. Process Stats (Convert to Int & Calculate)
    try:
        # VLR columns are: [0]Rating [1]ACS [2]K [3]D [4]A [5]+/- [6]KAST [7]ADR [8]HS% [9]FK [10]FD ...
        # Note: We strip empty strings or non-numeric chars if necessary, but int() usually handles clean strings
        k  = int(stat_values[2])
        d  = int(stat_values[3])
        a  = int(stat_values[4])
        adr_val = int(stat_values[7])
        fk_val = int(stat_values[9])
        fd_val = int(stat_values[10])

        # Fantasy Calculation
        points = (k * 1) - (d * 0.5) + (a * 0.25) + (fk_val * 0.5) - (fd_val * 0.5)

    except (IndexError, ValueError) as e:
        print(f"Skipping {player_name}: Data parsing error ({e})")
        continue

    # D. Database Operations
    
    # 1. Ensure Player Exists
    player = session.query(Player).filter_by(riot_id=player_name).first()
    if not player:
        player = Player(riot_id=player_name, team_name=team_name)
        session.add(player)
        session.commit()
        session.refresh(player)

    # 2. Check for Duplicate Stats
    existing_stat = session.query(MatchStat).filter_by(
        player_id=player.id, 
        external_match_id=MATCH_ID
    ).first()

    if existing_stat:
        print(f"Skipping {player_name} (Stats already logged)")
    else:
        # 3. Save New Stat
        new_stat = MatchStat(
            player_id=player.id,
            external_match_id=MATCH_ID,
            kills=k,
            deaths=d,
            assists=a,
            adr=adr_val,
            first_kills=fk_val,
            first_deaths=fd_val,
            fantasy_points=points
        )
        session.add(new_stat)
        print(f"Logged: {player_name} | K/D/A: {k}/{d}/{a} | Pts: {points}")

# --- 5. CLEANUP ---
session.commit()
session.close()
print("Done.")