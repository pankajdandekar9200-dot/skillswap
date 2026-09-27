import os

# --- JWT ---
SECRET_KEY = os.getenv("SECRET_KEY", "skillswap-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# --- Database ---
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
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
