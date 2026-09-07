const test = require('node:test');
const assert = require('node:assert/strict');
const steam = require('../../../.test-build/packages/steam-adapter/src/index.js');

test('decodes CMsgAchievementChange appid protobuf field', () => {
  // field 1 (wire 0), appid=570 => 0x08 0xBA 0x04
  const bytes = Uint8Array.from([0x08, 0xBA, 0x04]);
  assert.equal(steam.decodeAchievementChangeAppId(bytes.buffer), 570);
});

test('achievement adapter maps SteamClient achievement fields', async () => {
  const fake = {
    Apps: {
      async GetMyAchievementsForApp() {
        return { data: { rgAchievements: [{
          bAchieved: true, bHidden: false, flMinProgress: 0, flCurrentProgress: 1, flMaxProgress: 1,
          flAchieved: 4.5, rtUnlocked: 1234, strDescription: 'Desc', strID: 'ACH', strImage: 'https://x.test/a.png', strName: 'Name'
        }] } };
      },
      GetFriendAchievementsForApp: async () => ({data:{rgAchievements:[]}}),
      GetFriendsWhoPlay: async () => [],
      RegisterForAchievementChanges() { return { unregister() {} }; }
    }
  };
  const adapter = new steam.SteamAchievementAdapter(fake);
  const [a] = await adapter.getMyAchievements(10);
  assert.equal(a.id, 'ACH');
  assert.equal(a.globalUnlockPercent, 4.5);
  assert.equal(a.achieved, true);
});


test('recognized empty achievement array is valid', async () => {
  const fake = {
    Apps: {
      async GetMyAchievementsForApp() { return { result: 1, data: { rgAchievements: [] } }; },
      GetFriendAchievementsForApp: async () => ({ data: { rgAchievements: [] } }),
      GetFriendsWhoPlay: async () => [],
      RegisterForAchievementChanges: () => ({ unregister() {} }),
    },
  };
  const adapter = new steam.SteamAchievementAdapter(fake);
  assert.deepEqual(await adapter.getMyAchievements(10), []);
});

test('unknown Steam response shape throws instead of pretending the game has zero achievements', async () => {
  const fake = {
    Apps: {
      async GetMyAchievementsForApp() { return { result: 1, data: { somethingElse: [] } }; },
      GetFriendAchievementsForApp: async () => ({ data: { rgAchievements: [] } }),
      GetFriendsWhoPlay: async () => [],
      RegisterForAchievementChanges: () => ({ unregister() {} }),
    },
  };
  const adapter = new steam.SteamAchievementAdapter(fake);
  await assert.rejects(() => adapter.getMyAchievements(10), /response shape changed/);
});
