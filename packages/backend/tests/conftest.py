import os
import sys
import tempfile
from pathlib import Path

if os.name == "posix":
    fallback_tmp = "/tmp"
    windows_tmp = os.environ.get("TMP", "")
    if windows_tmp.startswith("/mnt/") and os.path.isdir(fallback_tmp):
        # pytest relies on TemporaryFile; DrvFS deletes handles eagerly, so pin tmpdir to ext4
        os.environ["TMP"] = os.environ["TEMP"] = os.environ["TMPDIR"] = fallback_tmp
        tempfile.tempdir = fallback_tmp

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.append(str(SRC))
