import sys
from sqlalchemy.orm import sessionmaker
from models import engine, Player, MatchStat

# 1. Setup
Session = sessionmaker(bind=engine)
session = Session()

filename = "match596399.json" # Your file
match_id = "596399"

try:
    with open(filename, "r") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
except FileNotFoundError:
    print(f"Error: {filename} not found.")
    sys.exit(1)

# 2. Skip Header if present
start_index = 0
if "Rating" in lines[0]:
    start_index = 1

print(f"Processing match {match_id}...")

# 3. Loop through pairs (Name -> Stats)
for i in range(start_index, len(lines), 2):
    if i + 1 >= len(lines): break

    player_name = lines[i]
    stats_line = lines[i+1]
    stats = stats_line.split() # Splits by spaces/tabs

    try:
        # --- EXTRACT ONLY WHAT YOU ASKED FOR ---
        k  = int(stats[2])   # Kills
        d  = int(stats[3])   # Deaths
        a  = int(stats[4])   # Assists
        adr_val = int(stats[7]) # ADR
        fk_val = int(stats[9])  # FK
        fd_val = int(stats[10]) # FD
        
    except (IndexError, ValueError) as e:
        print(f"Skipping {player_name}: Data error ({e})")
        continue

    # 4. Find/Create Player
    player = session.query(Player).filter_by(riot_id=player_name).first()
    if not player:
        player = Player(riot_id=player_name, team_name="Unknown")
        session.add(player)
        session.commit()
        session.refresh(player)

    # 5. Save Stats
    existing = session.query(MatchStat).filter_by(player_id=player.id, external_match_id=match_id).first()
    if existing:
        print(f"Skipping {player_name} (Already exists)")
    else:
        # Update Fantasy Formula to reward First Kills?
        # Example: K(1) - D(0.5) + A(0.25) + FK(0.5) - FD(0.5)
        points = (k * 1) - (d * 0.5) + (a * 0.25) + (fk_val * 0.5) - (fd_val * 0.5)

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
        print(f"Logged: {player_name} | FK: {fk_val} FD: {fd_val} | Pts: {points}")

session.commit()
session.close()
print("Done.")