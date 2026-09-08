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

-- Verified against macOS Steam build 1788652215, chunk~2dcc5aaf7.js.
-- Fail closed on upstream drift: only the verified titlebar and notification call match.
-- Preserve every native control; append a sibling immediately after the notification bell.
local function get_patches()
    return {{
        file = [[chunk~2dcc5aaf7\.js]],
        find = [=[className:\(0,g\.A\)\(Xt\(\)\.TitleBarControls,t\),\.\.\.r,children:\(0,i\.jsxs\)\(ze\.wC,\{children:\[[^\]]+]=],
        transforms = {{
            match = [[\(0,i\.jsx\)\(dr,\{\}\)]],
            replace = [[(0,i.jsx)(dr,{}),(0,i.jsx)(#{{self}}?.hookedToolbar?.TrophyButton||(()=>null),{className:Xt().Button})]],
        }},
    }}
end

return {
    on_load = on_load,
    on_unload = on_unload,
    on_frontend_loaded = on_frontend_loaded,
    patches = get_patches(),
}
