const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../../../.test-build/packages/core/src');
global.backend={};
const {TrophyService}=require('../../../.test-build/frontend/state/service');
test('simultaneous row, Platinum and recap reads share one disk read with no writes or selection',async()=>{
  let reads=0,release;
  const game=core.buildGameSnapshot({appId:10,name:'Preview fixture',nowUnix:200,staleTtlSeconds:600,achievements:[{id:'a',name:'Done',description:'',hidden:false,achieved:true,globalUnlockPercent:5,unlockedAtUnix:100,iconUrl:null,currentProgress:null,minProgress:null,maxProgress:null}]});
  global.backend.readGameJson=async()=>{reads++;await new Promise(r=>release=r);return game;};
  const service=new TrophyService();
  const pending=[service.getCachedPreview(10),service.getCachedCompletion(10),service.getCachedSnapshot(10)];
  assert.equal(reads,1);release();const [preview,completion,snapshot]=await Promise.all(pending);
  assert.equal(preview.length,1);assert.equal(completion.achievement.id,'a');assert.equal(snapshot.appId,10);
  await service.getCachedSnapshot(10);assert.equal(reads,1);assert.equal(service.getSnapshot().selectedAppId,null);
});
test('failed read remains non-mutating and a later attempt can recover',async()=>{
  let reads=0;global.backend.readGameJson=async()=>{reads++;throw Error('not available')};
  const service=new TrophyService();assert.equal(await service.getCachedSnapshot(10),null);assert.deepEqual(await service.getCachedPreview(10),[]);assert.equal(reads,2);
});
