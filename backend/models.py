from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship
import enum
from sqlalchemy import Enum as SQLAlchemyEnum

#Set up the database connection
DATABASE_URL = "sqlite:///./fantasy.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Base = declarative_base()

#Define tables 

class Player(Base): 
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    riot_id = Column(String, unique=True)
    team_name = Column(String)
    role = Column(String)
    matches = relationship("MatchStat", back_populates="player")
    
class MatchStat(Base):
    __tablename__ = "match_stats"
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    external_match_id = Column(String)
    
    kills = Column(Integer)
    deaths = Column(Integer)
    assists = Column(Integer)
    first_kills = Column(Integer)
    first_deaths = Column(Integer)
    rouns_won = Column(Integer)
    rounds_lost = Column(Integer)
    adr = Column(Float)
    
    fantasy_points = Column(Float)
    player = relationship("Player", back_populates="matches")

class FantasyTeam(Base):
    __tablename__ = "fantasy_teams"
    id = Column(Integer, primary_key=True, index=True)
    owner_name = Column(String)
    team_name = Column(String)
    total_points = Column(Float, default=0.0)

class RosterSlot(enum.Enum): 
    CAPTAIN = "captain"
    STAR = "star"
    STARTER = "star"
    BENCH = "bench"

class RosterItem(Base):
    __tablename__ = "roster_items"
    id = Column(Integer, primary_key=True, index=True)
    fantasy_team_id = Column(String, ForeignKey("fantasy_teams.id"))
    player_id = Column(String, ForeignKey("players.id"))
    slot_type = Column(SQLAlchemyEnum(RosterSlot), default=RosterSlot.BENCH)


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Database 'fantasy.db' created successfully with all tables!")
    

    
    