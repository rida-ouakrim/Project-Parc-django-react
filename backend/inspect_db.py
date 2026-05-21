import sqlite3

db_path = r'c:\Users\lenovo\OneDrive\Bureau\Project-Parc-django-react\parking (3).db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Lister les tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("TABLES:", tables)

for t in tables:
    cols = [d[1] for d in cursor.execute(f"PRAGMA table_info({t})").fetchall()]
    count = cursor.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    examples = cursor.execute(f"SELECT * FROM {t} LIMIT 3").fetchall()
    print(f"\n--- {t} ---")
    print(f"  Colonnes: {cols}")
    print(f"  Nb lignes: {count}")
    for ex in examples:
        print(f"  Exemple: {ex}")

# Compter les occupés par table
for t in ['places', 'places_TISSIR', 'places_SEFAMAR', 'places_V_VLOG']:
    try:
        occ = cursor.execute(f"SELECT COUNT(*) FROM {t} WHERE status='occupé'").fetchone()[0]
        total = cursor.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"\n{t}: {occ} occupées / {total} total")
    except:
        pass

conn.close()
