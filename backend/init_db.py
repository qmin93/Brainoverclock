
import sqlite3
import os

DB_NAME = 'brain.db'

def init_db():
    # Remove existing db if needed? No, IF NOT EXISTS handles it.
    
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print(f"Initializing database: {DB_NAME}")

    # 1. Game Logs Table
    # Stores every single game played
    c.execute('''
        CREATE TABLE IF NOT EXISTS game_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            game_type TEXT,
            score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("- Verified table: game_logs")

    # 2. User Stats Table
    # Stores aggregated stats for quick leaderboard lookup
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_stats (
            user_id TEXT,
            game_type TEXT,
            best_score REAL,
            total_plays INTEGER DEFAULT 0,
            tier TEXT,
            last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, game_type)
        )
    ''')
    print("- Verified table: user_stats")

    # 3. Create Indexes for Performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_logs_game_score ON game_logs(game_type, score)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_stats_game_best ON user_stats(game_type, best_score DESC)')
    print("- Created indexes")

    conn.commit()
    conn.close()
    print("Database initialization completed successfully.")

if __name__ == '__main__':
    init_db()
