import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const file='src/pages/dashboard/index.astro';
const head=execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'});
const current=readFileSync(file,'utf8');
const strip=s=>s.replace(/<style>[\s\S]*?<\/style>/g,'').trim();
assert.equal(strip(current),strip(head),'non-style dashboard source changed');
const sidebar='src/ui/shell/Sidebar.astro';
assert.equal(readFileSync(sidebar,'utf8'),execFileSync('git',['show',`HEAD:${sidebar}`],{encoding:'utf8'}));
const before=JSON.parse(readFileSync('audit/CA-P-DASHBOARD/before/evidence.json'));
const after=JSON.parse(readFileSync('audit/CA-P-DASHBOARD/after/evidence.json'));
const result={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),nonStyleSource:'IDENTICAL',sidebarSource:'IDENTICAL',sidebarSHA256:createHash('sha256').update(readFileSync(sidebar)).digest('hex'),nodeBefore:before.node,nodeAfter:after.node,checks:[]};
for (const b of before.checks.filter(x=>x.width)) {
  const a=after.checks.find(x=>x.width===b.width);
  for (const key of ['sidebar','sidebarBackground','links','counts','attention']) assert.deepEqual(a[key],b[key],`${key}@${b.width}`);
  assert.equal(a.overflow,0);assert.equal(a.smallTargets.length,0);assert.equal(a.smallText.length,0);assert.equal(a.axe.length,0);
  result.checks.push({width:b.width,sidebarLinksCountsAttention:'IDENTICAL',targetsBefore:b.smallTargets.length,targetsAfter:a.smallTargets.length,textUnder12:a.smallText.length,overflow:a.overflow,axe:a.axe.length});
}
assert.equal(after.errors.length,0);
for (const pair of after.contrast) assert.ok(pair.ratio>=4.5);
result.contrast=after.contrast;
result.beforeRunnerNote='Five baseline viewport captures succeeded; later assertion incorrectly expected least to be denied dashboard. That assertion timed out; baseline not claimed as a complete PASS.';
writeFileSync('audit/CA-P-DASHBOARD/comparison.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
