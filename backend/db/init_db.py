# backend/db/init_db.py
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'email_accounts.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Crear tabla de cuentas vinculadas con restricción UNIQUE para evitar duplicados
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS linked_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            email TEXT NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            token_expiry TEXT,
            UNIQUE(user_id, email)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Base de datos inicializada correctamente.")

if __name__ == '__main__':
    init_db()
