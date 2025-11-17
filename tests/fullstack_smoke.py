from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_SRC = ROOT / "packages" / "backend" / "src"
BACKEND_TESTS = ROOT / "packages" / "backend" / "tests"

for path in (BACKEND_SRC, BACKEND_TESTS):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from fullstack_smoke import run_smoke  # type: ignore  # noqa: E402

if __name__ == "__main__":
    asyncio.run(run_smoke())
