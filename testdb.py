from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:tanvee26@localhost:5432/fullstack"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("✅ Connected successfully!")
except Exception as e:
    print("❌ Connection failed:")
    print(e)