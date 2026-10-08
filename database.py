import sqlite3
import random
from datetime import datetime, date

DB_PATH = "electricity.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Consumers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS consumers (
        consumer_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        meter_number TEXT NOT NULL,
        tariff_rate_per_kwh REAL DEFAULT 0.16,
        sanctioned_load_kw REAL DEFAULT 5.0
    );
    """)

    # Daily consumption table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_consumption (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consumer_id TEXT NOT NULL,
        reading_date TEXT NOT NULL,
        total_kwh REAL NOT NULL,
        max_peak_kw REAL NOT NULL,
        min_base_kw REAL NOT NULL,
        cost REAL NOT NULL,
        FOREIGN KEY (consumer_id) REFERENCES consumers (consumer_id)
    );
    """)

    # Hourly telemetry table (for current day)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hourly_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consumer_id TEXT NOT NULL,
        hour_label TEXT NOT NULL,
        power_kw REAL NOT NULL,
        voltage REAL NOT NULL,
        FOREIGN KEY (consumer_id) REFERENCES consumers (consumer_id)
    );
    """)

    # Bills table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bills (
        bill_id TEXT PRIMARY KEY,
        consumer_id TEXT NOT NULL,
        billing_period TEXT NOT NULL,
        units_kwh REAL NOT NULL,
        base_amount REAL NOT NULL,
        fixed_charges REAL NOT NULL,
        taxes REAL NOT NULL,
        total_amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        generated_at TEXT NOT NULL,
        FOREIGN KEY (consumer_id) REFERENCES consumers (consumer_id)
    );
    """)

    # Transactions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        txn_id TEXT PRIMARY KEY,
        consumer_id TEXT NOT NULL,
        bill_id TEXT NOT NULL,
        txn_date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        reference_no TEXT NOT NULL,
        FOREIGN KEY (consumer_id) REFERENCES consumers (consumer_id)
    );
    """)

    # Linked Accounts table (Manage Multiple Accounts / Meters)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS linked_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        consumer_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (consumer_id) REFERENCES consumers (consumer_id)
    );
    """)

    # Migration: Ensure profile columns exist on consumers
    cursor.execute("PRAGMA table_info(consumers)")
    existing_cols = [r[1] for r in cursor.fetchall()]
    profile_columns = {
        "password": "TEXT DEFAULT 'pass123'",
        "email": "TEXT DEFAULT 'alex.mercer@voltgrid.in'",
        "phone": "TEXT DEFAULT '+91 98765 43210'",
        "billing_address": "TEXT DEFAULT 'Plot No. 42, Sector 18, Energy Park, Vadodara, Gujarat - 390007'",
        "connection_type": "TEXT DEFAULT 'Residential Domestic LT-1'",
        "phase": "TEXT DEFAULT 'Single Phase 230V / 50Hz'",
        "alert_sms": "INTEGER DEFAULT 1",
        "alert_email": "INTEGER DEFAULT 1",
        "alert_peak_spike": "INTEGER DEFAULT 1"
    }
    for col_name, col_def in profile_columns.items():
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE consumers ADD COLUMN {col_name} {col_def};")

    # Seed initial linked accounts if empty
    cursor.execute("SELECT COUNT(*) FROM linked_accounts")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO linked_accounts (user_id, consumer_id, nickname, is_primary)
        VALUES 
            ('CNS-849201', 'CNS-849201', 'Primary Residence (Smart Meter)', 1),
            ('CNS-849201', 'CNS-102948', 'Commercial Workspace / Workshop', 0),
            ('CNS-102948', 'CNS-102948', 'Diya Patel Primary Meter', 1);
        """)

    # Check and seed sample bills and transactions
    cursor.execute("SELECT COUNT(*) FROM bills")
    if cursor.fetchone()[0] == 0:
        # Seed August 2026 paid bill and September 2026 active bill in INR (₹)
        cursor.execute("""
        INSERT INTO bills (bill_id, consumer_id, billing_period, units_kwh, base_amount, fixed_charges, taxes, total_amount, due_date, status, generated_at)
        VALUES 
            ('INV-2026-08-849', 'CNS-849201', 'August 2026', 742.0, 5210.00, 110.00, 319.20, 5639.20, '2026-09-05', 'PAID', '2026-09-01 00:00:00'),
            ('INV-2026-09-849', 'CNS-849201', 'September 2026 (MTD)', 413.0, 2684.70, 110.00, 188.74, 3334.49, '2026-10-05', 'PENDING', '2026-09-15 08:30:00'),
            ('INV-2026-08-102', 'CNS-102948', 'August 2026', 820.5, 5912.00, 110.00, 361.32, 6383.32, '2026-09-05', 'PAID', '2026-09-01 00:00:00'),
            ('INV-2026-09-102', 'CNS-102948', 'September 2026 (MTD)', 474.9, 3235.60, 110.00, 224.96, 3974.22, '2026-10-05', 'PENDING', '2026-09-15 08:30:00');
        """)

        cursor.execute("""
        INSERT INTO transactions (txn_id, consumer_id, bill_id, txn_date, payment_method, amount, status, reference_no)
        VALUES
            ('TXN-9842109', 'CNS-849201', 'INV-2026-08-849', '2026-09-03 14:22:10', 'UPI / SmartPay', 5639.20, 'SUCCESS', 'REF-UPI-88492012'),
            ('TXN-8741002', 'CNS-849201', 'INV-2026-07-849', '2026-08-04 10:15:33', 'Credit Card (Visa)', 5420.00, 'SUCCESS', 'REF-CC-49201884'),
            ('TXN-9842110', 'CNS-102948', 'INV-2026-08-102', '2026-09-04 16:40:12', 'Net Banking (HDFC)', 6383.32, 'SUCCESS', 'REF-NB-99214002');
        """)

    # Seed demo consumers if not present
    cursor.execute("SELECT COUNT(*) FROM consumers")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO consumers (consumer_id, name, meter_number, tariff_rate_per_kwh, sanctioned_load_kw)
        VALUES 
            ('CNS-849201', 'Alex Mercer', 'MTR-2026-991', 6.50, 5.0),
            ('CNS-102948', 'Diya Patel', 'MTR-2026-442', 6.50, 7.0);
        """)

        # Generate realistic daily data for September 1 to 15, 2026 for CNS-849201
        # Realistic profile: weekend vs weekday variation, HVAC spikes, base load
        seed_daily_data = [
            ("2026-09-01", 24.2, 3.8, 0.45),
            ("2026-09-02", 22.8, 3.5, 0.42),
            ("2026-09-03", 12.1, 2.1, 0.38), # Minimum consumption day (away from home)
            ("2026-09-04", 25.4, 3.9, 0.44),
            ("2026-09-05", 34.6, 4.4, 0.52), # Weekend high
            ("2026-09-06", 36.8, 4.6, 0.55), # Weekend high
            ("2026-09-07", 23.5, 3.6, 0.42),
            ("2026-09-08", 41.2, 4.9, 0.62), # Maximum consumption day (heatwave HVAC)
            ("2026-09-09", 28.1, 4.1, 0.48),
            ("2026-09-10", 26.5, 3.8, 0.45),
            ("2026-09-11", 24.9, 3.7, 0.43),
            ("2026-09-12", 32.4, 4.3, 0.50),
            ("2026-09-13", 31.0, 4.2, 0.48),
            ("2026-09-14", 23.9, 3.6, 0.42),
            ("2026-09-15", 25.6, 3.8, 0.44), # Today's consumption
        ]

        for r_date, kwh, peak, base in seed_daily_data:
            cost = round(kwh * 0.16, 2)
            cursor.execute("""
            INSERT INTO daily_consumption (consumer_id, reading_date, total_kwh, max_peak_kw, min_base_kw, cost)
            VALUES (?, ?, ?, ?, ?, ?)
            """, ('CNS-849201', r_date, kwh, peak, base, cost))
            # Also seed Diya Patel with slightly higher capacity
            cursor.execute("""
            INSERT INTO daily_consumption (consumer_id, reading_date, total_kwh, max_peak_kw, min_base_kw, cost)
            VALUES (?, ?, ?, ?, ?, ?)
            """, ('CNS-102948', r_date, round(kwh * 1.15, 1), round(peak * 1.1, 1), round(base * 1.1, 2), round(kwh * 1.15 * 0.18, 2)))

        # Seed 24-hour telemetry for today (00:00 to 23:00)
        hours = [f"{h:02d}:00" for h in range(24)]
        # Diurnal load pattern: night low (0.5kW), morning peak 8am (3.2kW), afternoon lull (1.8kW), evening peak 8pm (3.8kW)
        load_profile = [
            0.55, 0.48, 0.42, 0.45, 0.60, 1.20,
            2.40, 3.20, 2.90, 2.10, 1.85, 1.75,
            1.90, 1.80, 1.85, 2.20, 2.80, 3.50,
            3.80, 3.60, 2.90, 2.10, 1.40, 0.85
        ]

        for h, load in zip(hours, load_profile):
            v = round(230 + random.uniform(-2.5, 2.5), 1)
            cursor.execute("""
            INSERT INTO hourly_telemetry (consumer_id, hour_label, power_kw, voltage)
            VALUES (?, ?, ?, ?)
            """, ('CNS-849201', h, load, v))
            cursor.execute("""
            INSERT INTO hourly_telemetry (consumer_id, hour_label, power_kw, voltage)
            VALUES (?, ?, ?, ?)
            """, ('CNS-102948', h, round(load * 1.15, 2), v))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Electricity database initialized successfully.")
