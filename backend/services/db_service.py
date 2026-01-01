
import sqlite3
import os

# Use absolute path for DB to avoid confusion
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'brain.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def save_game_result(user_id, game_type, score, lower_is_better=False):
    """
    Saves the game result to DB and updates user stats.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # 1. Insert into game_logs
        c.execute('INSERT INTO game_logs (user_id, game_type, score) VALUES (?, ?, ?)',
                  (user_id, game_type, score))
        
        # 2. Check existing stats
        c.execute('SELECT best_score, total_plays FROM user_stats WHERE user_id = ? AND game_type = ?',
                  (user_id, game_type))
        row = c.fetchone()
        
        new_best = score
        total_plays = 1
        
        if row:
            current_best = row['best_score']
            total_plays = row['total_plays'] + 1
            
            if lower_is_better:
                new_best = min(score, current_best)
            else:
                new_best = max(score, current_best)
            
            # Update
            # Tier logic is handled separately or passed in
            tier = determine_tier(game_type, new_best)
            
            c.execute('''
                UPDATE user_stats 
                SET best_score = ?, total_plays = ?, tier = ?, last_played_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND game_type = ?
            ''', (new_best, total_plays, tier, user_id, game_type))
        else:
            # Insert
            tier = determine_tier(game_type, score)
            c.execute('''
                INSERT INTO user_stats (user_id, game_type, best_score, total_plays, tier)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, game_type, score, 1, tier))
            
        conn.commit()
        return {"new_best": new_best, "tier": tier, "plays": total_plays}
        
    except Exception as e:
        print(f"DB Error: {e}")
        return None
    finally:
        conn.close()

def determine_tier(game_type, score):
    # Basic Tier Logic (can be expanded)
    # This should match frontend logic if possible
    if 'chimp' in game_type:
        if score >= 15: return 'Alien'
        if score >= 10: return 'Chimp'
        if score >= 5: return 'Cat'
        return 'Shrimp'
    return 'Normal'
