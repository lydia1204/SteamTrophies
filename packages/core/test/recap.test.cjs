const test=require('node:test');
const assert=require('node:assert/strict');
const {completionRarityLimit,buildRecap,recapStart}=require('../../../.test-build/packages/core/src');
const date=(day)=>Math.floor(new Date(2026,8,day,12).getTime()/1000);
const a=(day,tier='bronze')=>({id:String(day),name:'Award',achieved:true,unlockedAtUnix:day == null?null:date(day),globalUnlockPercent:5,tier});
const game=(achievements)=>({appId:1,name:'Fixture',rarityRevision:1,achievements,platinum:{achieved:false,unlockedAtUnix:null}});
test('completion rarity is only an upper bound with complete verified marginals',()=>{
  assert.equal(completionRarityLimit([{globalUnlockPercent:90},{globalUnlockPercent:5}],true),5);
  assert.equal(completionRarityLimit([{globalUnlockPercent:0}],true),0);
  for(const v of [null,NaN,Infinity,-1,101]) assert.equal(completionRarityLimit([{globalUnlockPercent:v}],true),null);
  assert.equal(completionRarityLimit([],true),null);
  assert.equal(completionRarityLimit([{globalUnlockPercent:3}],false),null);
});
test('recap excludes future, locked and undated awards and deduplicates game snapshots',()=>{
  const g=game([a(3),a(4,'silver'),a(5,'gold'),a(7),a(10),a(null),{...a(8),achieved:false}]);
  g.platinum={achieved:true,unlockedAtUnix:date(5)};
  const r=buildRecap([g,g],'week',new Date(2026,8,9,23));
  assert.equal(r.total,5);assert.equal(r.tiers.platinum,1);assert.equal(r.games.length,1);
  assert.equal(r.activeAchievementDays,4);assert.equal(r.longestAchievementStreak,3);assert.equal(r.unknownDates,1);
  assert.equal(r.rarest.percent,5);
});
test('recap uses local calendar boundaries rather than pretending it is a playtime report',()=>{
  const now=new Date(2026,0,2,19);
  assert.equal(recapStart('year',now),Math.floor(new Date(2026,0,1).getTime()/1000));
  assert.equal(recapStart('month',now),recapStart('year',now));
  assert.equal(recapStart('week',now),Math.floor(new Date(2025,11,27).getTime()/1000));
  const r=buildRecap([game([a(3)])],'year',new Date(2026,8,9));
  assert.equal('playHours' in r,false);
});
