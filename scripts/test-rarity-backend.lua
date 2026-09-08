-- Pure module test: no live network, Steam, or persisted state writes.
local calls = 0
local fail = false
package.preload["http"] = function() return { get = function(url, options)
    calls = calls + 1
    assert(url:match("^https://api%.steampowered%.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/%?gameid=%d+$"))
    assert(options.verify_ssl == true and options.follow_redirects == false and options.timeout == 10)
    if fail then return nil, "offline" end
    return { status = 200, body = '{"achievementpercentages":{"achievements":[]}}' }
end } end
local rarity = dofile("backend/lib/rarity.lua")
assert(rarity.read(105600))
assert(rarity.read(105600))
assert(calls == 1, "successful responses should be cached")
fail = true
assert(rarity.read(10) == nil)
assert(rarity.read(10) == nil)
assert(calls == 2, "failed requests should have cooldown")
assert(not pcall(rarity.read, "105600&key=bad"))
assert(not pcall(rarity.read, -1))
assert(not pcall(rarity.read, 0.5))
assert(calls == 2, "invalid IDs must not reach the network")
print("PASS: fixed Steam endpoint, TLS/redirect policy, success cache, failure cooldown and ID validation")
