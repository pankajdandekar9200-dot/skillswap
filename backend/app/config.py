import os
import shutil

# --- JWT ---
SECRET_KEY = os.getenv("SECRET_KEY", "skillswap-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# --- Database ---
if os.getenv("VERCEL"):
    tmp_db = "/tmp/skillswap.db"
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    seed_db = os.path.join(base_dir, "skillswap.db")
    if not os.path.exists(tmp_db) and os.path.exists(seed_db):
        try:
            shutil.copyfile(seed_db, tmp_db)
        except Exception:
            pass
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{tmp_db}")
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skillswap.db")

# --- Matching weights (Section 11) ---
MATCH_WEIGHT_SKILL = 0.5
MATCH_WEIGHT_AVAILABILITY = 0.2
MATCH_WEIGHT_TEACHING_LEVEL = 0.2
MATCH_WEIGHT_MODE = 0.1

# --- Credits ---
CREDITS_PER_SESSION_TAUGHT = 10
INITIAL_CREDITS = 20

# --- Rate limiting ---
MAX_AUTH_ATTEMPTS_PER_MINUTE = 10

# --- CORS ---
ALLOWED_ORIGINS = ["*"] if os.getenv("VERCEL") else os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://localhost:8000").split(",")

