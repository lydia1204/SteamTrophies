const test = require('node:test');
const assert = require('node:assert/strict');
const {validateVisual} = require('../../../.test-build/packages/customization/src/visual');
global.backend = {writeCustomizationJson:async()=>true};
const {CustomizationService} = require('../../../.test-build/frontend/state/customization-service');

test('control preferences migrate, round-trip and reject unsafe settings', () => {
  const defaults=validateVisual({});
  assert.equal(defaults.toggleStyle,'switch');
  assert.equal(defaults.settingsOrganization,'tabs');
  assert.equal(defaults.animationSpeed,1);
  const saved=validateVisual({toggleStyle:'checkbox',helpCursor:false,settingsOrganization:'sidebar',colorBlindMode:'red-green',toastGlow:'bright',animationSpeed:2,trophyColors:{gold:'#123abc'}});
  assert.deepEqual(validateVisual(JSON.parse(JSON.stringify(saved))),saved);
  const invalid=validateVisual({toggleStyle:'html',animationSpeed:Infinity,colorBlindMode:'url(x)',toastGlow:'url(x)',trophyColors:{gold:'url(file://x)',silver:'#ABCDEF'}});
  assert.equal(invalid.animationSpeed,1);
  assert.equal(invalid.colorBlindMode,'off');
  assert.deepEqual(invalid.trophyColors,{silver:'#ABCDEF'});
  assert.equal(validateVisual({animationSpeed:100}).animationSpeed,3);
  assert.equal(validateVisual({animationSpeed:-1}).animationSpeed,.25);
});
test('animation speed, accessible palettes, manual overrides and high contrast compose', async () => {
  const service=new CustomizationService();
  await service.setVisual({animationSpeed:2,colorBlindMode:'red-green',toastGlow:'bright',helpCursor:false});
  let css=service.getCssVariables('desktop');
  assert.equal(css['--stt-speed-shine'],'1.4s');
  assert.equal(css['--stt-help-cursor'],'default');
  assert.equal(css['--stt-tile-gold'],'#f0e442');
  assert.match(css['--stt-toast-glow'],/20px/);
  await service.setVisual({tileColors:{gold:'#123456'},tooltipColors:{gold:'#abcdef'},trophyColors:{gold:'#445566'}});
  css=service.getCssVariables('desktop');
  assert.equal(css['--stt-tile-gold'],'#123456');
  assert.equal(css['--stt-tooltip-gold'],'#abcdef');
  assert.equal(css['--stt-tier-wash-gold'],'#44556638');
  await service.setAccessibility({highContrast:true,reducedMotion:true});
  css=service.getCssVariables('desktop');
  assert.equal(css['--stt-background-animation'],'none');
  assert.equal(css['--stt-toast-glow'],'none');
});
