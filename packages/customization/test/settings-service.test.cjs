const test=require('node:test');
const assert=require('node:assert/strict');
global.backend={};
const {CustomizationService}=require('../../../.test-build/frontend/state/customization-service');
test('rapid preference changes publish immediately and serialize complete snapshots',async()=>{
  const writes=[];let release;
  global.backend.writeCustomizationJson=async raw=>{writes.push(JSON.parse(raw));if(writes.length===1)await new Promise(r=>release=r);return true;};
  const service=new CustomizationService();
  const first=service.setAccessibility({textScale:1.5});
  const second=service.setLibraryAppearance({achievementSize:64});
  assert.equal(service.getSnapshot().config.accessibility.textScale,1.5);
  assert.equal(service.getSnapshot().config.library.achievementSize,64);
  await Promise.resolve();assert.equal(writes.length,1);release();await Promise.all([first,second]);
  assert.equal(writes.length,2);assert.equal(writes[1].accessibility.textScale,1.5);assert.equal(writes[1].library.achievementSize,64);
});
test('failed settings save is reported and the next complete snapshot can recover',async()=>{
  const service=new CustomizationService();
  global.backend.writeCustomizationJson=async()=>false;
  await assert.rejects(service.setVisual({showScrollbar:false}),/could not be saved/);
  assert.match(service.getSnapshot().error,/may not survive/);
  global.backend.writeCustomizationJson=async()=>true;
  await service.setVisual({scrollbarWidth:12});
  assert.equal(service.getSnapshot().error,null);
  assert.equal(service.getSnapshot().config.visual.showScrollbar,false);
});
test('independent border overrides win over themes; safe mode disables custom CSS palette',async()=>{
  global.backend.writeCustomizationJson=async()=>true;
  const service=new CustomizationService();
  await service.setVisual({customThemeEnabled:true,customColors:{background:'#123456'},tileColors:{gold:'#abcdef'},tooltipColors:{gold:'#fedcba'},themeBorderColors:true});
  let css=service.getCssVariables('desktop');
  assert.equal(css['--stt-tile-gold'],'#abcdef');assert.equal(css['--stt-tooltip-gold'],'#fedcba');assert.equal(css['--stt-color-background'],'#123456');
  await service.setSafeMode({themesDisabled:true});css=service.getCssVariables('desktop');assert.notEqual(css['--stt-color-background'],'#123456');
});
