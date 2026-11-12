import psycopg2
import os

def run_migrations():
    print("Connecting to waterwatch database...")
    conn = psycopg2.connect(
        dbname="waterwatch",
        user="openpg",
        password="openpgpwd",
        host="127.0.0.1",
        port=5432
    )
    conn.autocommit = True
    cur = conn.cursor()

    migration_files = [
        "backend/migrations/0001_initial_schema.sql",
        "backend/migrations/0002_seed_data.sql"
    ]

    for mig in migration_files:
        print(f"Applying migration: {mig}...")
        with open(mig, "r", encoding="utf-8") as f:
            sql = f.read()
        cur.execute(sql)
        print(f"Applied successfully: {mig}")

    # Verify counts
    tables = ["users", "cameras", "detection_events", "incidents", "incident_updates", "audit_logs"]
    print("\n--- Migration Verification ---")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cur.fetchone()[0]
        print(f"Table '{t}': {cnt} rows")

    cur.close()
    conn.close()
    print("\nAll database migrations and seed data applied successfully!")

if __name__ == "__main__":
    run_migrations()

