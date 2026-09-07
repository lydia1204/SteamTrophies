"""Future Decky backend shell. Shared trophy semantics live in packages/core.

This file intentionally avoids privileged operations. The Decky implementation should mirror
Millennium's shard layout under ~/.local/share/SteamTrophies and expose narrow RPC methods only.
"""
from pathlib import Path
import json
import os
import tempfile

ROOT = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share")) / "SteamTrophies"

class Plugin:
    async def _main(self):
        (ROOT / "state" / "games").mkdir(parents=True, exist_ok=True)

    async def read_index_json(self):
        path = ROOT / "state" / "index.v1.json"
        return path.read_text("utf-8") if path.is_file() else None

    async def read_game_json(self, appid: int):
        appid = _appid(appid)
        path = ROOT / "state" / "games" / f"{appid}.v1.json"
        return path.read_text("utf-8") if path.is_file() else None

    async def write_game_json(self, appid: int, payload: str):
        appid = _appid(appid)
        _atomic_write(ROOT / "state" / "games" / f"{appid}.v1.json", payload)
        return True

def _appid(value):
    value = int(value)
    if value <= 0 or value > 0xFFFFFFFF:
        raise ValueError("invalid appid")
    return value

def _atomic_write(path: Path, payload: str):
    if len(payload.encode("utf-8")) > 16 * 1024 * 1024:
        raise ValueError("payload too large")
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=path.name, dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(payload)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        try: os.unlink(tmp)
        except FileNotFoundError: pass
