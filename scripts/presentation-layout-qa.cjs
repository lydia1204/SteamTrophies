#!/usr/bin/env node
// Isolated DOM fixture: no Steam connection, personal data, navigation or screenshots.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.STT_PLAYWRIGHT_MODULE || 'playwright');
const c = require('../.test-build/packages/customization/src');
const css = fs.readFileSync(require.resolve('../frontend/styles/trophies.css'),'utf8');
const glyph = (size) => `<span class="st-trophy-glyph" style="width:${size}px;height:${size}px;background:#67bdf4"></span>`;
(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.STT_QA_CHROME ? {channel:'chrome'} : {})});
  let cases=0;
  const errors=[];
  try {
    const page = await browser.newPage();
    for (const width of [360,640,800,1280,1920]) for (const textScale of [.8,1,2]) for (const iconScale of [.8,1,2]) for (const artworkStyle of ['capsule','landscape','icon']) {
      const m=c.libraryRowMetrics({textScale,iconScale},{artworkStyle,achievementSize:72},width);
      const band=c.classifyResponsiveMetrics(width,800,'desktop').widthBand;
      const variables=c.compileThemeCssVariables(c.DEFAULT_THEME,'desktop',{textScale,iconScale,reducedMotion:true,highContrast:false});
      const style=Object.entries({...variables,'--stt-game-row-height':m.rowHeight+'px','--st-game-tier-height':m.tierHeight+'px','--st-game-summary-width':m.summaryWidth+'px'}).map(([k,v])=>`${k}:${v}`).join(';');
      await page.setViewportSize({width,height:800});
      await page.setContent(`<style>${css}</style><div class="st-app" data-stt-root data-stt-width-band="${band}" style="${style};padding:0;width:100%"><div class="st-game-row"><span class="st-game-artwork" style="width:${m.artWidth}px;height:${m.artHeight}px"></span><div class="st-game-row-main"><div class="st-game-title">Long example title for a game</div><div class="st-game-progress-line"><div class="st-progress-track"><span style="width:70%"></span></div><span>76.6%</span></div></div><div class="st-game-tier-counts">${[1,613,1922,41714].map(n=>`<span>${glyph(17*iconScale)}${n}</span>`).join('')}</div><div class="st-game-earned"><span>134/200</span></div><div class="st-game-recent"></div></div></div>`);
      const result=await page.evaluate(()=>{const row=document.querySelector('.st-game-row'),tiers=document.querySelector('.st-game-tier-counts'),main=document.querySelector('.st-game-row-main'),earned=document.querySelector('.st-game-earned');const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};return {row:rect(row),tiers:rect(tiers),main:rect(main),earned:rect(earned),items:[...tiers.children].map(rect),overflow:document.documentElement.scrollWidth>innerWidth};});
      const last=Math.max(...result.items.map(i=>i.bottom));
      if(result.overflow || last>result.row.bottom-2 || result.items.some(i=>i.right>result.earned.left-2 && i.bottom>result.earned.top && i.top<result.earned.bottom)) errors.push({width,textScale,iconScale,artworkStyle,result});
      cases++;
    }
    if(errors.length) console.log(JSON.stringify(errors.slice(0,4),null,2));
    assert.equal(errors.length,0,`${errors.length}/${cases} layout fixtures overflow or overlap`);
    console.log(`PASS: ${cases} isolated CSS layout fixtures. This is not live Steam UI validation.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
