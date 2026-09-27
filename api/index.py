import sys
import os

# Ensure backend directory is in Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(parent_dir, "backend")

for path in [parent_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from app.main import app
from app.seed import seed

# Auto-seed database tables if empty
try:
    seed()
except Exception as e:
    print(f"Seed note: {e}")
