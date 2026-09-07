local fs = require("fs")
local logger = require("logger")

local M = {}
local MAX_JSON_BYTES = 16 * 1024 * 1024
local MAX_EVENT_APPEND_BYTES = 2 * 1024 * 1024
local MAX_SMALL_STATE_BYTES = 1024 * 1024
local write_seq = 0

local function data_root()
    local os_name = jit and jit.os or "Unknown"
    if os_name == "Windows" then
        local base = os.getenv("LOCALAPPDATA") or os.getenv("APPDATA")
        assert(type(base) == "string" and #base > 0, "LOCALAPPDATA/APPDATA unavailable")
        return fs.join(base, "SteamTrophies")
    end

    local home = os.getenv("HOME")
    assert(type(home) == "string" and #home > 0, "HOME unavailable")

    -- Millennium does not currently advertise production macOS support, but keeping
    -- the storage contract correct makes local development/migration deterministic.
    if os_name == "OSX" then
        return fs.join(home, "Library", "Application Support", "SteamTrophies")
    end

    local xdg = os.getenv("XDG_DATA_HOME")
    if type(xdg) == "string" and #xdg > 0 then
        return fs.join(xdg, "SteamTrophies")
    end
    return fs.join(home, ".local", "share", "SteamTrophies")
end

local ROOT = data_root()
local STATE = fs.join(ROOT, "state")
local GAMES = fs.join(STATE, "games")
local EVENTS = fs.join(STATE, "events")
local QUARANTINE = fs.join(STATE, "quarantine")
local CACHE = fs.join(ROOT, "cache")
local ASSETS = fs.join(CACHE, "assets")
local CUSTOMIZATION = fs.join(ROOT, "customization")
local PACKS = fs.join(CUSTOMIZATION, "packs")

local function ensure_dirs()
    for _, path in ipairs({ ROOT, STATE, GAMES, EVENTS, QUARANTINE, CACHE, ASSETS, CUSTOMIZATION, PACKS }) do
        local ok, err = fs.create_directories(path)
        if not ok and not fs.is_directory(path) then
            error("Failed to create SteamTrophies directory: " .. tostring(err))
        end
    end
end

local function read_text_exact(path, limit)
    if not fs.is_file(path) then return nil end
    local size, size_err = fs.file_size(path)
    if not size then error("Unable to stat file: " .. tostring(size_err)) end
    if size > limit then error("Refusing oversized SteamTrophies file") end
    local handle, err = io.open(path, "rb")
    if not handle then error("Unable to open file: " .. tostring(err)) end
    local text = handle:read("*a")
    handle:close()
    return text
end

local function read_text(path, limit)
    local primary = read_text_exact(path, limit)
    if primary ~= nil then return primary end
    return read_text_exact(path .. ".bak", limit)
end

local function preserve_backup(path)
    if not fs.is_file(path) then return end
    local ok, err = fs.copy(path, path .. ".bak", false)
    if not ok then logger:warn("Unable to preserve SteamTrophies backup: " .. tostring(err)) end
end

local function atomic_write(path, text, limit)
    assert(type(text) == "string", "Expected string payload")
    assert(#text <= limit, "Payload exceeds size limit")
    local parent = fs.parent_path(path)
    local ok, err = fs.create_directories(parent)
    if not ok and not fs.is_directory(parent) then error("mkdir failed: " .. tostring(err)) end

    write_seq = write_seq + 1
    local temp = path .. ".tmp." .. tostring(write_seq)
    local handle, open_err = io.open(temp, "wb")
    if not handle then error("Unable to open temporary file: " .. tostring(open_err)) end
    local write_ok, write_err = handle:write(text)
    handle:flush()
    handle:close()
    if not write_ok then
        pcall(fs.remove, temp)
        error("Write failed: " .. tostring(write_err))
    end

    preserve_backup(path)
    local renamed, rename_err = fs.rename(temp, path, false)
    if not renamed then
        pcall(fs.remove, temp)
        error("Atomic rename failed: " .. tostring(rename_err))
    end
end

local function append_text(path, text, limit)
    assert(type(text) == "string", "Expected string payload")
    assert(#text <= limit, "Append exceeds size limit")
    local parent = fs.parent_path(path)
    local ok, err = fs.create_directories(parent)
    if not ok and not fs.is_directory(parent) then error("mkdir failed: " .. tostring(err)) end
    local handle, open_err = io.open(path, "ab")
    if not handle then error("Unable to open event log: " .. tostring(open_err)) end
    local write_ok, write_err = handle:write(text)
    handle:flush()
    handle:close()
    if not write_ok then error("Append failed: " .. tostring(write_err)) end
end

local function valid_appid(appid)
    return type(appid) == "number" and appid >= 1 and appid <= 4294967295 and appid % 1 == 0
end

local function valid_month(month)
    return type(month) == "string" and month:match("^%d%d%d%d%-%d%d$") ~= nil
end

local function quarantine(path, label)
    if not fs.is_file(path) then return false end
    local stamp = tostring(os.time()) .. "." .. tostring(write_seq)
    local target = fs.join(QUARANTINE, label .. "." .. stamp .. ".corrupt")
    local ok, err = fs.rename(path, target, false)
    if not ok then
        logger:warn("Unable to quarantine corrupt state: " .. tostring(err))
        return false
    end
    logger:warn("Quarantined corrupt SteamTrophies state: " .. target)
    return true
end

function M.initialize()
    ensure_dirs()
    logger:info("SteamTrophies data root: " .. ROOT)
end

function M.root() return ROOT end

function M.read_settings() return read_text(fs.join(STATE, "settings.v1.json"), MAX_SMALL_STATE_BYTES) end
function M.write_settings(text) atomic_write(fs.join(STATE, "settings.v1.json"), text, MAX_SMALL_STATE_BYTES); return true end
function M.read_customization() return read_text(fs.join(STATE, "customization.v1.json"), MAX_SMALL_STATE_BYTES) end
function M.write_customization(text) atomic_write(fs.join(STATE, "customization.v1.json"), text, MAX_SMALL_STATE_BYTES); return true end
function M.read_discovery() return read_text(fs.join(STATE, "discovery.v1.json"), MAX_SMALL_STATE_BYTES) end
function M.write_discovery(text) atomic_write(fs.join(STATE, "discovery.v1.json"), text, MAX_SMALL_STATE_BYTES); return true end
function M.read_index() return read_text(fs.join(STATE, "index.v1.json"), MAX_JSON_BYTES) end
function M.write_index(text) atomic_write(fs.join(STATE, "index.v1.json"), text, MAX_JSON_BYTES); return true end

function M.read_game(appid)
    assert(valid_appid(appid), "Invalid appid")
    return read_text(fs.join(GAMES, tostring(appid) .. ".v1.json"), MAX_JSON_BYTES)
end

function M.write_game(appid, text)
    assert(valid_appid(appid), "Invalid appid")
    atomic_write(fs.join(GAMES, tostring(appid) .. ".v1.json"), text, MAX_JSON_BYTES)
    return true
end

function M.list_game_ids()
    local entries, err = fs.list(GAMES)
    if not entries then error("Unable to list game shards: " .. tostring(err)) end
    local ids = {}
    for _, entry in ipairs(entries) do
        if entry.is_file and not entry.is_symlink then
            local id = entry.name:match("^(%d+)%.v1%.json$")
            local appid = id and tonumber(id) or nil
            if valid_appid(appid) then ids[#ids + 1] = appid end
        end
    end
    table.sort(ids)
    return ids
end

function M.quarantine_index()
    return quarantine(fs.join(STATE, "index.v1.json"), "index.v1.json")
end

function M.quarantine_game(appid)
    assert(valid_appid(appid), "Invalid appid")
    return quarantine(fs.join(GAMES, tostring(appid) .. ".v1.json"), tostring(appid) .. ".v1.json")
end

function M.append_events(month, text)
    assert(valid_month(month), "Invalid event month")
    append_text(fs.join(EVENTS, month .. ".ndjson"), text, MAX_EVENT_APPEND_BYTES)
    return true
end

function M.storage_stats()
    local files = fs.list_recursive(ROOT) or {}
    local total = 0
    local count = 0
    for _, entry in ipairs(files) do
        if entry.is_file then
            count = count + 1
            total = total + (entry.size or 0)
        end
    end
    local space = fs.space_info(ROOT)
    return { root = ROOT, files = count, bytes = total, free_bytes = space and space.available or nil }
end

return M
