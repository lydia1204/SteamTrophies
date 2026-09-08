local logger = require("logger")
local millennium = require("millennium")
local storage = require("lib.storage")
local packs = require("lib.packs")
local json = require("json")
local rarity = require("lib.rarity")

---@ffi
---@return boolean
function notifyOutsidePointerDown()
    -- Relay only a click signal, never webpage content, coordinates, or URLs.
    local ok = pcall(millennium.call_frontend_method, "outsideSteamPointerDown", {})
    return ok
end

---@ffi
---@param appid number
---@return string|nil
function readGlobalRarityJson(appid) return rarity.read(appid) end

---@ffi
---@return string|nil
function readSettingsJson() return storage.read_settings() end
---@ffi
---@param json string
---@return boolean
function writeSettingsJson(json) return storage.write_settings(json) end
---@ffi
---@return string|nil
function readCustomizationJson() return storage.read_customization() end
---@ffi
---@param payload string
---@return boolean
function writeCustomizationJson(payload) return storage.write_customization(payload) end
---@ffi
---@return string|nil
function readDiscoveryJson() return storage.read_discovery() end
---@ffi
---@param json string
---@return boolean
function writeDiscoveryJson(json) return storage.write_discovery(json) end
---@ffi
---@return string|nil
function readIndexJson() return storage.read_index() end
---@ffi
---@param appid number
---@return string|nil
function readGameJson(appid) return storage.read_game(appid) end
---@ffi
---@return table
function listGameAppIds() return storage.list_game_ids() end
---@ffi
---@return boolean
function quarantineIndex() return storage.quarantine_index() end
---@ffi
---@param appid number
---@return boolean
function quarantineGame(appid) return storage.quarantine_game(appid) end
---@ffi
---@param json string
---@return boolean
function writeIndexJson(json) return storage.write_index(json) end
---@ffi
---@param appid number
---@param json string
---@return boolean
function writeGameJson(appid, json) return storage.write_game(appid, json) end
---@ffi
---@param month string
---@param lines string
---@return boolean
function appendEvents(month, lines) return storage.append_events(month, lines) end
---@ffi
---@return table
function getStorageStats() return storage.storage_stats() end
---@ffi
---@return string
function getTrophyIconResource() return millennium.assets.read("resources/trophy.svg") end

---@ffi
---@return string
function listInstalledTrophyPacksJson()
    return assert(json.safe.encode(packs.list_installed()))
end

---@ffi
---@param sourcePath string
---@param replaceExisting boolean
---@return string
function importTrophyPackDirectoryJson(sourcePath, replaceExisting)
    return assert(json.safe.encode(packs.import_directory(sourcePath, replaceExisting == true)))
end

---@ffi
---@param packId string
---@param relativePath string
---@return string
function readTrophyPackAssetDataUrl(packId, relativePath)
    return packs.asset_data_url(packId, relativePath)
end

---@ffi
---@param relativePath string
---@return string
function readBundledTrophyAssetDataUrl(relativePath)
    return packs.bundled_asset_data_url(relativePath)
end

---@ffi
---@param packId string
---@return string
function getInstalledTrophyPackDirectory(packId)
    return packs.get_pack_directory(packId)
end

---@ffi
---@param packId string
---@return boolean
function removeInstalledTrophyPack(packId)
    return packs.remove(packId)
end

logger:info("SteamTrophies RPC functions registered")
