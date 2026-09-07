"""Narrow Decky backend for the shared SteamTrophies data store."""
from pathlib import Path
import json
import os
import tempfile

import decky

MAX_JSON_BYTES = 16 * 1024 * 1024


def _data_root() -> Path:
    """Resolve the real Deck user home even though Decky may run as root."""
    return Path(decky.DECKY_USER_HOME) / ".local" / "share" / "SteamTrophies"


ROOT = _data_root()

class Plugin:
    async def _main(self):
        (ROOT / "state" / "games").mkdir(parents=True, exist_ok=True)
        decky.logger.info("SteamTrophies Decky backend ready")

    async def _unload(self):
        decky.logger.info("SteamTrophies Decky backend stopped")

    async def read_index_json(self):
        path = ROOT / "state" / "index.v1.json"
        return _read_text(path)

    async def read_game_json(self, appid: int):
        appid = _appid(appid)
        path = ROOT / "state" / "games" / f"{appid}.v1.json"
        return _read_text(path)

    async def write_game_json(self, appid: int, payload: str):
        appid = _appid(appid)
        _atomic_write(ROOT / "state" / "games" / f"{appid}.v1.json", payload)
        return True

    async def get_storage_health(self):
        state = ROOT / "state"
        game_root = state / "games"
        game_files = list(game_root.glob("*.v1.json")) if game_root.is_dir() else []
        total_bytes = sum(path.stat().st_size for path in game_files if path.is_file())
        index = state / "index.v1.json"
        return {
            "indexPresent": index.is_file(),
            "indexBytes": index.stat().st_size if index.is_file() else 0,
            "gameShards": len(game_files),
            "gameShardBytes": total_bytes,
        }

def _appid(value):
    value = int(value)
    if value <= 0 or value > 0xFFFFFFFF:
        raise ValueError("invalid appid")
    return value


def _read_text(path: Path):
    if not path.is_file():
        return None
    if path.stat().st_size > MAX_JSON_BYTES:
        raise ValueError("state file exceeds size limit")
    return path.read_text("utf-8")

def _atomic_write(path: Path, payload: str):
    json.loads(payload)
    if len(payload.encode("utf-8")) > MAX_JSON_BYTES:
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
