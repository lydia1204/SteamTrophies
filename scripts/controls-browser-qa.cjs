#!/usr/bin/env node
// Isolated React + real stylesheet tests. Never connects to Steam or reads user data.
// STT_QA_NODE_MODULES supplies optional react, react-dom and esbuild test dependencies.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const deps=process.env.STT_QA_NODE_MODULES || path.join(root,'node_modules');
const esbuild=require(require.resolve('esbuild',{paths:[deps]}));
const {chromium}=require(process.env.STT_PLAYWRIGHT_MODULE || 'playwright');
const c=require('../.test-build/packages/customization/src');
const config=structuredClone(c.DEFAULT_CUSTOMIZATION_STATE);
const css=fs.readFileSync(path.join(root,'frontend/styles/trophies.css'),'utf8');
(async()=>{
  const bundle=await esbuild.build({stdin:{contents:`
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {SettingHelp,SettingSwitch} from './frontend/components/customization/SettingControls';
    import {TrophyGlyph} from './frontend/components/TrophyGlyph';
    const root=createRoot(document.getElementById('root'));
    function App(){return <div data-stt-root data-stt-width-band={window.band} className="st-app" style={window.css}>
      <section className="stt-settings-section"><div className="stt-settings-grid">
        <SettingSwitch label="Example toggle" help="A useful gamer-facing explanation." checked={window.checked} onChange={v=>{window.checked=v;window.render()}}/>
        <label className="stt-field"><span id="color-label">Trophy color</span><SettingHelp text="Change the trophy tint."/><input aria-label="Trophy color" type="color" defaultValue="#abcdef"/></label>
      </div></section>
      <div className="stt-global-pack"><SettingSwitch label="Pack switch" help="Pack help." checked={true} onChange={()=>{}}/></div>
      <div id="glyph"><TrophyGlyph tier="gold" size={34}/></div>
      <button className="st-icon-button st-refresh-button"><span>R</span><span className="st-sync-dot"/></button>
      <button className="st-icon-button is-pinned"><span className="st-pin-remove">−</span></button>
    </div>}
    window.render=()=>root.render(<App/>);window.unmount=()=>root.unmount();window.render();`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',nodePaths:[deps],plugins:[{
    name:'isolated-state',setup(build){
      build.onResolve({filter:/^react(?:-dom)?(?:\/.*)?$/},args=>({path:require.resolve(args.path,{paths:[deps]})}));
      build.onResolve({filter:/state\/customization-(hooks|service)$/},args=>({path:args.path,namespace:'mock'}));
      build.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path.endsWith('hooks') ? 'export function useCustomizationState(){return {config:window.config,packs:[]}}' : `export const customizationService={getCssVariables:()=>window.css,resolve:()=>({packId:'builtin.classic'}),resolveTrophyIconDataUrl:async()=>null};`}));
      build.onResolve({filter:/runtime\/backend$/},()=>({path:'backend',namespace:'backend'}));
      build.onLoad({filter:/.*/,namespace:'backend'},()=>({contents:'export const trophyBackend={readBundledTrophyAssetDataUrl:async()=>null};'}));
    }
  }]});
  const browser=await chromium.launch({headless:true,...(process.env.STT_QA_CHROME ? {channel:'chrome'} : {})});
  let cases=0;
  try {
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
    for(const width of [360,800,1280])for(const scale of [.8,1,2]){
      await page.setViewportSize({width,height:900});
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      const preferences=structuredClone(config);preferences.accessibility.textScale=scale;preferences.accessibility.iconScale=scale;
      await page.evaluate(({config,css,band})=>{window.config=config;window.css=css;window.band=band;window.checked=true},{config:preferences,css:c.compileThemeCssVariables(c.DEFAULT_THEME,'desktop',preferences.accessibility),band:c.classifyResponsiveMetrics(width,900,'desktop').widthBand});
      await page.addScriptTag({content:bundle.outputFiles[0].text});
      await page.waitForSelector('.stt-switch');
      const boxes=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        return {switches:[...document.querySelectorAll('.stt-switch')].map(e=>({box:rect(e),thumb:rect(e.firstChild)})),color:rect(document.querySelector('input[type=color]')),help:rect(document.querySelector('.stt-field .stt-setting-help')),label:rect(document.querySelector('#color-label')),glyph:rect(document.querySelector('#glyph .st-trophy-glyph')),dot:rect(document.querySelector('.st-sync-dot')),refresh:rect(document.querySelector('.st-refresh-button'))};
      });
      for(const s of boxes.switches){assert.equal(s.box.width,38);assert.equal(s.box.height,22);assert.ok(s.thumb.right<=s.box.right-1);assert.ok(s.thumb.bottom<=s.box.bottom-1);}
      assert.equal(boxes.color.width,44);assert.equal(boxes.color.height,34);
      assert.ok(boxes.help.top<boxes.label.bottom,'help stays inline with its label');
      assert.ok(Math.abs(boxes.glyph.width-34*scale)<.1);
      assert.ok(boxes.dot.right<=boxes.refresh.right&&boxes.dot.top>=boxes.refresh.top,'refresh dot stays in its button');
      const help=page.locator('.stt-setting-help').first();
      await help.hover();await page.getByRole('tooltip').waitFor();
      assert.equal(await page.getByRole('tooltip').textContent(),'A useful gamer-facing explanation.');
      await page.getByRole('tooltip').hover();await page.waitForTimeout(200);assert.equal(await page.getByRole('tooltip').count(),1);
      await page.keyboard.press('Escape');assert.equal(await page.getByRole('tooltip').count(),0);
      await help.focus();await page.getByRole('tooltip').waitFor();
      await page.locator('.stt-switch').first().focus();assert.equal(await page.getByRole('tooltip').count(),0);
      await page.locator('.stt-switch').first().click();assert.equal(await page.locator('.stt-switch').first().getAttribute('aria-checked'),'false');
      await page.evaluate(()=>{window.config.visual.toggleStyle='checkbox';window.config.visual.helpCursor=false;window.config.visual.colorBlindMode='red-green';window.config.visual.trophyColors.gold='#123456';window.render()});
      await page.getByRole('checkbox').first().waitFor();
      assert.equal(await page.locator('.stt-switch').count(),0);
      assert.equal(await help.evaluate(e=>getComputedStyle(e).cursor),'default');
      assert.equal(await page.locator('.stt-tier-letter').textContent(),'G');
      assert.equal(await page.locator('feColorMatrix').count(),1);
      await help.hover();await page.getByRole('tooltip').waitFor();await page.evaluate(()=>window.unmount());assert.equal(await page.getByRole('tooltip').count(),0);
      cases++;
    }
    assert.deepEqual(errors,[]);console.log(`PASS: ${cases} isolated React control scenarios, including tooltips, switches, color boxes, tint filters and scaled glyphs. Not live Steam validation.`);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
