const test = require('node:test');
const assert = require('node:assert/strict');
const friends = require('../../../.test-build/packages/friends/src/index.js');

const apiKey = '0123456789ABCDEF0123456789ABCDEF';

test('Web API fallback keeps the key in an auth header rather than the URL', async () => {
  let request;
  const transport = {
    async getJson(url, headers) {
      request = { url, headers };
      return { playerstats: { success: true, achievements: [{ apiname: 'A', achieved: 1, unlocktime: 123 }] } };
    },
  };
  const client = new friends.SteamWebApiClient({ apiKey, transport });
  const result = await client.getPlayerAchievements('76561198000000000', 570);
  assert.equal(result.earnedCount, 1);
  assert.equal(request.headers['x-webapi-key'], apiKey);
  assert.equal(request.url.includes(apiKey), false);
});

test('Web API fallback rejects malformed SteamID64 before transport', async () => {
  let called = false;
  const transport = { async getJson() { called = true; return {}; } };
  const client = new friends.SteamWebApiClient({ apiKey, transport });
  await assert.rejects(() => client.getOwnedGames('not-a-steamid'));
  assert.equal(called, false);
});
