from sqlalchemy import text
from app.database import engine

STATEMENTS = [
    "ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20)",
    "ALTER TABLE rides ADD COLUMN IF NOT EXISTS upi_id VARCHAR(60)",
    "ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMP",
    "ALTER TABLE rides ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP",
    "ALTER TABLE rides ADD COLUMN IF NOT EXISTS stopped_place_id INTEGER REFERENCES places(place_id)",
    "ALTER TABLE rides ADD COLUMN IF NOT EXISTS final_price NUMERIC(10,2)",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_fare NUMERIC(10,2)",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10)",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP",
]

with engine.begin() as conn:
    for s in STATEMENTS:
        conn.execute(text(s))
        print("OK:", s)

print("Done. New columns added.")
