// Local disposable PG18 runner only; no .env loading and no provider credentials.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const phase = process.argv[2] ?? 'before';
const dir = `audit/CA-P-DASHBOARD/${phase}`;
mkdirSync(dir, { recursive: true });
const out = { phase, checks: [], errors: [], node: process.version };
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport:{width:1440,height:1000}, locale:'en-GB', timezoneId:'Asia/Riyadh' });
  const page = await context.newPage();
  page.on('pageerror', e=>out.errors.push(e.message));
  await page.goto('http://127.0.0.1:4331/login');
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL(u=>u.pathname==='/dashboard');
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.goto('http://127.0.0.1:4331/dashboard',{waitUntil:'networkidle'});
    const metrics = await page.evaluate(()=>{
      const main=document.querySelector('#main-content');
      const visible=e=>e.getClientRects().length>0;
      const targets=[...main.querySelectorAll('a,button,summary')].filter(visible).map(e=>({text:e.textContent.trim()||e.getAttribute('aria-label'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
      const text=[...main.querySelectorAll('*')].filter(e=>visible(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>({text:e.textContent.slice(0,60),size:parseFloat(getComputedStyle(e).fontSize)}));
      return {overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,links:[...main.querySelectorAll('a')].map(a=>[a.textContent.trim(),a.getAttribute('href')]),sidebar:[...document.querySelectorAll('.app-sidebar a')].map(a=>[a.textContent,a.getAttribute('href')]),sidebarBackground:getComputedStyle(document.querySelector('.app-sidebar')).backgroundColor,smallTargets:targets.filter(t=>t.height<44||t.width<44),smallText:text.filter(t=>t.size<12),counts:[...main.querySelectorAll('.kpi-value,.zero-strip li')].map(e=>e.textContent),attention:[...main.querySelectorAll('.attention-list li')].map(e=>e.textContent),series:main.querySelector('.chart')?'AVAILABLE':main.querySelector('.series-state')?.textContent};
    });
    await page.screenshot({path:`${dir}/${width}.png`,fullPage:true});
    const axe=await new AxeBuilder({page}).include('#main-content').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    metrics.axe=axe.violations.map(v=>({id:v.id,nodes:v.nodes.length}));
    out.checks.push({width,...metrics});
    assert.equal(metrics.overflow,0);
  }
  await page.locator('.sources summary').focus();
  await page.keyboard.press('Enter');
  out.disclosure=await page.locator('.sources').getAttribute('open')!==null;
  await page.keyboard.press('Tab');
  out.keyboard=await page.evaluate(()=>({text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outline,outlineOffset:getComputedStyle(document.activeElement).outlineOffset}));
  await page.locator('.snapshot a').click();
  await page.waitForLoadState('networkidle');
  out.refresh=await page.locator('.snapshot time').count()===1;
  out.nullCounts=await page.locator('.kpi').evaluateAll(cards=>cards.filter(c=>c.querySelector('.kpi-unavailable')).map(c=>({text:c.querySelector('.kpi-value').textContent,links:c.querySelectorAll('a').length})));
  assert.ok(out.nullCounts.length>0);
  for (const unavailable of out.nullCounts) assert.equal(unavailable.links,0);
  out.contrast=await page.evaluate(()=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
    const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>{const x=luminance(rgb(a)),y=luminance(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const panel=document.querySelector('.priority-panel'),style=getComputedStyle(panel),bg=style.backgroundColor;
    return ['.priority-panel h2','.priority-panel .empty','.priority-panel .eyebrow','.priority-panel a'].map(selector=>{const s=getComputedStyle(document.querySelector(selector));return {selector,color:s.color,background:bg,ratio:ratio(s.color,bg)};});
  });
  for (const media of [{forcedColors:'active'},{forcedColors:'none',reducedMotion:'reduce'}]) {
    await page.emulateMedia(media);
    await page.setViewportSize({width:320,height:1000});
    out.checks.push({media,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
  }
  await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});
  const native=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000}});
  await native.addCookies(await context.cookies());
  const np=await native.newPage();await np.goto('http://127.0.0.1:4331/dashboard');
  out.noJS={title:await np.locator('h1').innerText(),overflow:await np.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)};
  await native.close();
  const negative=await browser.newContext();const denied=await negative.newPage();
  await denied.goto('http://127.0.0.1:4331/login');
  await denied.locator('#loginIdentity').fill('verify-least');
  await denied.locator('#password').fill(process.env.QC_VERIFY_LEAST_PASSWORD);
  await denied.locator('#password').press('Enter');await denied.waitForURL(u=>u.pathname==='/dashboard');
  out.leastDashboard={heading:await denied.locator('h1').innerText(),deniedPage:await denied.locator('.denied').count(),unavailableCounts:await denied.locator('.kpi-unavailable').allTextContents()};
  await denied.goto('http://127.0.0.1:4331/tasks');
  await denied.getByRole('link',{name:'VERIFY-AUTHZ-READONLY',exact:true}).click();
  out.existingRecord={text:await denied.locator('#main-content').innerText(),href:denied.url()};
  assert.match(out.existingRecord.text,/VERIFY-AUTHZ-READONLY/);
  const response=await denied.goto('http://127.0.0.1:4331/system/health');
  out.denied={status:response.status(),message:await denied.locator('body').innerText()};
  await denied.screenshot({path:`${dir}/denied.png`,fullPage:true});
  assert.equal(out.denied.status,404);await negative.close();
  out.status='PASS';
} catch(e) {out.status='FAIL';out.error=e.message;process.exitCode=1;}
finally {writeFileSync(`${dir}/evidence.json`,JSON.stringify(out,null,2));await browser.close();}
console.log(JSON.stringify({phase,status:out.status,error:out.error}));
