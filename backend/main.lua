local logger = require("logger")
local millennium = require("millennium")
local storage = require("lib.storage")

require("rpc_functions")

local function on_load()
    -- Millennium expects ready() quickly. Directory creation is cheap and local; no scanning/network here.
    local ok, err = pcall(storage.initialize)
    if not ok then logger:error("Storage initialization failed: " .. tostring(err)) end
    logger:info("SteamTrophies loaded on Millennium " .. millennium.version())
    millennium.ready()
end

local function on_unload()
    logger:info("SteamTrophies unloaded")
end

local function on_frontend_loaded()
    logger:info("SteamTrophies frontend loaded")
end

-- Toolbar injection is intentionally isolated. Steam's compiled header chunks are unstable.
-- Codex should verify the current Steam client chunk before enabling a transform here.
-- The frontend already exports `hookedToolbar.TrophyButton`, so the eventual patch only needs
-- to splice that component beside the normal header controls. Do not guess a regex against a
-- different Steam build; a bad patch can remove native controls.
local function get_patches()
    return {}
end

return {
    on_load = on_load,
    on_unload = on_unload,
    on_frontend_loaded = on_frontend_loaded,
    patches = get_patches(),
}
