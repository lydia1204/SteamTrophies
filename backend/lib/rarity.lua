local http = require("http")
local M = {}
local cache = {}
local count = 0

function M.read(appid)
    assert(type(appid) == "number" and appid == math.floor(appid) and appid > 0 and appid <= 4294967295, "Invalid app ID")
    local now = os.time()
    local entry = cache[appid]
    if entry and entry.expires > now then return entry.body end
    local response = http.get("https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=" .. string.format("%.0f", appid), {
        timeout = 10, follow_redirects = false, verify_ssl = true,
    })
    local body = response and response.status == 200 and type(response.body) == "string" and #response.body <= 2097152 and response.body or nil
    if count >= 512 then cache = {}; count = 0 end
    if not cache[appid] then count = count + 1 end
    cache[appid] = { body = body, expires = now + (body and 21600 or 60) }
    return body
end
return M
