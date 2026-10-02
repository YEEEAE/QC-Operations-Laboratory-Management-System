"""Generate a new, immutable-by-convention reconciliation run from local sources.

Run only in this previously empty run directory. Refuses to replace any report.
This script is an analytical artifact; it never calls production services.
"""
from __future__ import annotations

import datetime as dt
import html
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
SHA = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
BRANCH = subprocess.check_output(["git", "branch", "--show-current"], cwd=ROOT, text=True).strip()
assert SHA.startswith("b165dd50"), "Candidate changed; create a new run instead"
assert not subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=no"], cwd=ROOT, text=True).strip(), "Tracked source changed"
NOW = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
RUN = f"2026-10-02-{SHA[:8]}"
BASE = "audit/2026-10-02/"
HIST = "audit/100-percent/"
MIGRATIONS = sorted((ROOT / "db/migrations").glob("[0-9][0-9][0-9][0-9]_*.sql"))
MIGRATION = MIGRATIONS[-1].stem
assert len(MIGRATIONS) == 45 and MIGRATION == "0045_provider_attestation_nonce_replay_guard"

def source(path):
    return (ROOT / path).read_text(encoding="utf-8")

def load(path):
    return json.loads(source(path))

def esc(value):
    return html.escape(str(value), quote=True)

def link(path, label=None):
    return f'<a href="{esc(path)}">{esc(label or path)}</a>'

def cell(value):
    return f"<td>{value}</td>"

def table(headers, rows):
    return '<div class="scroll"><table><thead><tr>' + ''.join(f'<th scope="col">{esc(h)}</th>' for h in headers) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(cell(v) for v in row) + '</tr>' for row in rows) + '</tbody></table></div>'

coverage = load(BASE + "coverage-register.json")
post = load(BASE + "post-implementation/verification-data.json")
spec = load(BASE + "prompt-pack-optimization/prompt-specifications.json")
old_domain = source(HIST + "01-100-DOMAIN-SCORECARD.md")
req_text = source("Documents/REQUIREMENTS-RECONCILIATION.md")
gap_text = source(HIST + "02-GAP-REGISTER.md")
routes = source("src/shared/routing/routes.ts")
legacy = source(BASE + "QC-100-PERCENT-ADAPTIVE-EXECUTION-PROMPTS-2026-09-30.html")
legacy_ids = set(re.findall(r'QC-(?:ADP26|ENV26|COPY26)-\d{2}', legacy))
baseline = {
    "repository": "YEEEAE/QC-Operations-Laboratory-Management-System", "sha": SHA, "branch": BRANCH,
    "migration": MIGRATION, "migrationCount": len(MIGRATIONS), "generated": NOW, "run": RUN,
    "nodeObserved": subprocess.check_output(["node", "--version"], text=True).strip(),
    "pnpmObserved": subprocess.check_output(["pnpm", "--version"], text=True).strip(),
    "nodeContract": ">=24.20.0 <25", "pageRoutes": len(re.findall(r'\bid:\s*[\'\"]RT-', routes)),
    "historicCoverageSha": coverage["candidate"]["head"], "historicVerificationSha": post["head"],
}

reqs = []
for line in req_text.splitlines():
    if re.match(r'^\| REQ-(?:AUTHZ|WFLOW|DINT|AUDF|RCOV|AIGV|READY|OPS|SCOPE)-\d{3} \|', line):
        bits = [x.strip() for x in line.strip().strip('|').split('|')]
        assert len(bits) == 9, bits
        reqs.append(dict(zip(('id','rc','text','source','objective','scope','class','owner','reference'),bits)))
assert len(reqs) == 100

gaps = []
for line in gap_text.splitlines():
    if re.match(r'^\| G-\d{3} \|', line):
        b = [x.strip() for x in line.strip().strip('|').split('|')]
        assert len(b) == 6
        gaps.append(dict(zip(('id','priority','title','evidence','domains','closure'),b), category='EVIDENCE_GAP', status='OPEN'))
assert len(gaps) == 20

domains = []
for line in old_domain.splitlines():
    if re.match(r'^\| \d{1,3} \|', line):
        b = [x.strip() for x in line.strip().strip('|').split('|')]
        assert len(b) == 12, (len(b), b[:2])
        domains.append({'id': f'D{int(b[0]):03d}', 'number': int(b[0]), 'name': b[1], 'historical': b[3], 'implementation': b[5], 'test': b[6], 'runtime': b[7], 'source': b[8], 'security': b[9], 'gap': re.findall(r'G-\d{3}',b[11])})
assert len(domains) == 100

findings = []
def ingest_findings(items):
    for f in items:
        if not isinstance(f, dict):
            continue
        fid = f.get('id') or f.get('findingId')
        if fid and fid not in {x['id'] for x in findings}:
            findings.append({'id': fid, 'title': str(f.get('title') or f.get('summary') or f.get('description') or fid), 'priority': str(f.get('priority') or f.get('severity') or 'P1').upper()[:2], 'source': BASE+'post-implementation/verification-data.json', 'status': 'UNVERIFIED'})
for key in ('findings','newFindings'):
    ingest_findings(post.get(key, []))
for row in coverage.get('rows', []):
    if row.get('kind') == 'finding' or str(row.get('id','')).startswith('FINDING:'):
        fid = str(row.get('id','')).removeprefix('FINDING:')
        if fid and fid not in {f['id'] for f in findings}:
            findings.append({'id':fid,'title':str(row.get('criterion') or fid),'priority':'P1','source':BASE+'coverage-register.json','status':'UNVERIFIED'})

operational = [
 ('OP-RCV','Receiving Slip from Supplier','F-7-5-7-1','5','CONTROLLED_FORM','Receiving','supplier, PO, multiple lines, unit, quantity, lot, expiry, partial receipt','Receiving source and separate line-level QC handoff; split/duplicate decision authority pending'),
 ('OP-INSP','Inspection & Test Reports (nine named families)','NOT READABLE','NOT READABLE','CONTROLLED_EXECUTION_RECORD','Inspection','oral medication syringe; syringes; feeding tube; Nelaton; nasal cannula; brushes; clamp; goggles; endotracheal tube; dimensions, AQL, Ac/Re, HOLD','WI/specifications and official sampling tables pending; one observation is not lot disposition'),
 ('OP-PDEC','Pressure Decay Test Report','F-3-2-6-05','04','CONTROLLED_FORM','Laboratory','setup, environment, set/applied pressure, volume, delta, hold time, leakage, tested/reviewed/approved','method/limits/sample count and approval authority pending'),
 ('OP-SUBA','Subatmospheric Pressure Air Leakage reports','NOT READABLE','NOT READABLE','CONTROLLED_EXECUTION_RECORD','Laboratory','sample identification, setup, runs, measurements and result','controlled method version and criteria pending'),
 ('OP-RAW','Attached machine printouts','NOT READABLE','NOT READABLE','RAW_INSTRUMENT_EVIDENCE','Laboratory','instrument serial/run/time, pressure, volume, leakage and units','original immutable file/hash and transcription linkage; no automatic final PASS'),
 ('OP-LHIST','Laboratory history spreadsheet','NOT READABLE','NOT READABLE','OPERATIONAL_DATA','Laboratory','item, lot, inspection/test dates, test type, sample count','historical reconciliation only, not authoritative method'),
 ('OP-REJ','Rejection Slip','F-7-5-7-8','4','CONTROLLED_FORM','Rejection','department, item/lot/unit/quantity, reason, split action plan, conditional approvals','approval/disposition policy and physical execution distinct'),
 ('OP-DAILY','Daily Production & Rejection Record','NOT READABLE','NOT READABLE','CONTROLLED_EXECUTION_RECORD','Production','FG/Semi-FG, machine/process, good/reject quantity, percentage, limit, defect remarks','formula, limit and escalation policy pending'),
 ('OP-TRF','Internal Transfer Request','F-7-5-11-1-01','1','CONTROLLED_FORM','Transfer','serial/date, class, lines, item/lot/quantity/cartons, destination, signatures','approval, QC eligibility, unit conversion and physical confirmation policy pending'),
 ('OP-SAMPLE','Bagged physical samples','NOT READABLE','NOT READABLE','PHYSICAL_SAMPLE_CONTEXT','Sample custody','visible sample context only','retention, custody and disposal policy pending'),
 ('OP-NOTE','Informal notes and sketches','NOT READABLE','NOT READABLE','INFORMAL_CONTEXT','Cross-domain','operational context only','never a scientific rule or approval source'),
]
operational = [dict(zip(('id','title','document','revision','classification','domain','observed','limitation'),o)) for o in operational]

# The supplied text describes the photos. No original image files were provided in this run.
for o in operational:
    o['provenance'] = 'USER_SUPPLIED_OPERATIONAL_EVIDENCE (description in user request; original image/hash not available locally)'
    o['authority'] = 'B/E subject to authentic source/revision verification' if o['classification'].startswith('CONTROLLED') else 'E/F/G contextual, not approved policy'

new_specs = [
 ('QC-EVID26-01','Acquire and govern controlled sources','P0','Authority', 'WI/SOP/specifications/sampling standard/limits/formula/retention/retest/signatures and transfer routing', 'OP-INSP,OP-PDEC,OP-TRF', 'G-020'),
 ('QC-RCV26-01','Multi-line supplier receipt and purchase reconciliation','P0','Receiving','Supplier→PO→delivery→lines/lots/expiry/decimal units, cumulative authorized quantity and split-versus-duplicate exception', 'OP-RCV','G-004'),
 ('QC-RCV26-02','Receiving quantity ledger and independent QC handoff','P0','Receiving','ordered/received/sampled/accepted/held/rejected/reworked/transferred/remaining with transactional versioned reservation and independent line QC', 'OP-RCV','G-001'),
 ('QC-INSP26-01','Versioned generic inspection templates and product applicability','P0','Inspection','controlled source revision, effective date, product/family/size/sterility and immutable execution snapshot; no per-product hardcode', 'OP-INSP','G-020'),
 ('QC-INSP26-02','Sample observations, N/A, HOLD and disposition separation','P0','Inspection','sample→criterion→observation/measurement/defect; N/A≠PASS; HOLD blocks release; count≠lot reject', 'OP-INSP','G-004'),
 ('QC-INSP26-03','Authoritative AQL determination and expanded sampling','P0','Inspection','lot size→level→AQL→official standard→code→size→Ac/Re snapshot; expanded/reinspection reason and authorization', 'OP-INSP','G-020'),
 ('QC-LAB26-01','Versioned methods and sample/part/run executions','P0','Laboratory','method-specific pressure decay and subatmospheric setup, variable sample count, sample→part→immutable attempt and retest provenance', 'OP-PDEC,OP-SUBA','G-020'),
 ('QC-LAB26-02','Raw instrument artifact and transcription integrity','P0','Laboratory','immutable original SHA-256 with equipment, run, uploader and timestamp; raw-versus-transcribed values and no replacement', 'OP-RAW','G-018'),
 ('QC-LAB26-03','Evaluation, equipment snapshot and staged approval','P0','Laboratory','technical evaluation distinct from reviewed/approved result and release; calibration eligibility/setup snapshot, role/SoD/e-sign', 'OP-PDEC','G-020'),
 ('QC-REJ26-01','Rejection slip and partial disposition accounting','P0','Rejection','F-7-5-7-8; source link, multi-action quantity allocation, conditional approval snapshot, execution and reconciliation', 'OP-REJ','G-004'),
 ('QC-REJ26-02','Daily production reject genealogy and taxonomy','P1','Production','FG/Semi-FG, machine/component lot, structured defects, original percentage, controlled limit and escalation into formal slip', 'OP-DAILY','G-020'),
 ('QC-TRF26-01','Controlled internal transfer request and ledger','P0','Transfer','multi-line FG/component/RM/plastic bag, PCS/KG, lot and locations, approval/execution/confirmation; distinguish disposition movement', 'OP-TRF','G-004'),
 ('QC-TRF26-02','Transfer eligibility, replay and reversal','P0','Transfer','HOLD/QC pending policy deny, balance lock, idempotency, no double execution, reversal as compensating transaction', 'OP-TRF','G-020'),
 ('QC-EVID26-02','Historical transcription and physical custody gates','P1','Evidence','paper import mapping/dedup/dry-run/original files; sample custody and retention blocked until policy', 'OP-LHIST,OP-SAMPLE,OP-NOTE','G-010'),
 ('QC-REL26-01','Exact release artifact, migration and provider parity','P0','Release','build once/promote same artifact or byte-identical parity, applied checksum ledger, provider SHA/hash/runtime and 19-gate signed policy', 'OP-RAW','G-002,G-009'),
 ('QC-REL26-02','CI, governance and read-only provider reconciliation','P0','Release','exact-SHA CI/status checks, branch rules, Pages state, Render config drift, role privileges and runtime identity', 'OP-TRF','G-007,G-009'),
 ('QC-REL26-03','Backup/object evidence recovery and operational monitoring','P0','Recovery','isolated populated DB+evidence restore, hashes, provider storage, scheduling, alarms and approved RPO/RTO', 'OP-RAW','G-013,G-018'),
 ('QC-UX26-01','Authenticated route/role/a11y/print acceptance','P1','UX','desktop/mobile/no-JS/keyboard/axe/AT/zoom/error, screen/export/print same authorized dataset', 'OP-INSP','G-006,G-011'),
 ('QC-UAT26-01','Risk-tiered human UAT and authority signoff','P1','UAT','representative roles across receiving, inspection, lab, rejection, transfer, NCR/CAPA, approvals, reports and recovery', 'OP-RCV,OP-TRF','G-013'),
 ('QC-TRACE26-01','Regenerate exact-candidate traceability and final NO-GO gate','P0','Traceability','100 historical disciplines versus 80 approved D-domains versus 100 reconciled requirements; no orphan/unsupported N/A', 'OP-INSP','G-005,G-010'),
]

new_findings = []
for idx, (pid,title,priority,domain,work,evidence,gapids) in enumerate(new_specs,1):
    fid = f'QC-RECON-F-{idx:03d}'
    new_findings.append({'id':fid,'title':title,'priority':priority,'source':'USER_SUPPLIED_OPERATIONAL_EVIDENCE + current source reconciliation','status':'UNVERIFIED','prompt':pid,'gap':gapids})
    gaps.append({'id':f'G-RECON-{idx:03d}','priority':priority,'title':title,'evidence':evidence,'domains':domain,'closure':work,'category':'AUTHORITY_GAP' if idx in (1,6,11,13) else 'IMPLEMENTATION_GAP' if idx in (2,3,4,5,7,8,9,10,12) else 'EVIDENCE_GAP','status':'OPEN','prompt':pid})
findings += new_findings

old_prompts = []
for p in spec['prompts']:
    if p['id'] not in spec['order']:
        continue
    old_prompts.append({'id':p['id'],'title':p['title'],'priority':p.get('priority','P1'),'domain':p.get('domain','Cross-domain'), 'work':p.get('work','Inspect residual gap and prove acceptance.'), 'routes':p.get('routes',[]), 'modules':p.get('modules',''), 'dependencies':p.get('dependencies',[]), 'acceptance':p.get('acceptance',[]), 'source':BASE+'prompt-pack-optimization/prompt-specifications.json', 'type':'ADAPTIVE_RESIDUAL', 'status':'PARTIAL / EVIDENCE_PENDING'})
assert len(old_prompts) == 36
prompts = old_prompts + [{'id':p[0],'title':p[1],'priority':p[2],'domain':p[3],'work':p[4],'routes':[],'modules':p[3],'dependencies':[],'acceptance':[p[4]],'source':'USER_SUPPLIED_OPERATIONAL_EVIDENCE + current source','type':'NEW_REQUIREMENT','status':'NOT_STARTED / AUTHORITY_OR_RUNTIME_PENDING','sourceEvidence':p[5],'gapIds':p[6].split(',')} for p in new_specs]
by_id = {p['id']:p for p in prompts}
assert len(by_id) == len(prompts) == 56

family = {'AUTHZ':'QC-POST-100-028','WFLOW':'QC-INSP26-01','DINT':'QC-RCV26-02','AUDF':'QC-POST-100-009','RCOV':'QC-REL26-03','AIGV':'QC-POST-100-029','READY':'QC-REL26-01','OPS':'QC-POST-100-025','SCOPE':'QC-TRACE26-01'}
def choose(text):
    s = text.lower()
    for words,pid in [(['transfer','نقل داخلي'],'QC-TRF26-01'),(['receiv','استلام'],'QC-RCV26-01'),(['aql','sampling','sample size'],'QC-INSP26-03'),(['inspection','تفتيش'],'QC-INSP26-01'),(['lab','pressure','leakage'],'QC-LAB26-01'),(['reject','disposition','رفض'],'QC-REJ26-01'),(['restor','backup'],'QC-REL26-03'),(['render','release','deployment','ci'],'QC-REL26-01'),(['browser','accessibility','ux'],'QC-UX26-01'),(['postgres','migration'],'QC-POST-100-010'),(['security','authorization'],'QC-POST-100-028')]:
        if any(w in s for w in words): return pid
    return 'QC-TRACE26-01'
for r in reqs:
    key = r['id'].split('-')[1]
    r['prompt'] = choose(r['text']+' '+r['scope']) if any(k in (r['text']+' '+r['scope']).lower() for k in ('receiv','inspection','lab','reject','transfer','aql')) else family[key]
    r['status']='UNVERIFIED' if r['class']=='MANDATORY' else 'NOT_APPLICABLE_WITH_APPROVED_RATIONALE_PENDING'
    r['gap']='G-020' if 'DEPENDENT' in r['reference'] else 'G-010'

for f in findings:
    f.setdefault('prompt',choose(f['title']))
    f.setdefault('gap','G-010')
for g in gaps:
    g.setdefault('prompt',choose(g['title']+' '+g['closure']))
for d in domains:
    d['prompt']=choose(d['name']+' '+d['implementation'])
    d['status']='UNVERIFIED' # Historical grade is not current-candidate proof.
    if not d['gap']: d['gap']=['G-010']

# Preserve historical associations without treating the old supplied snapshot as current PASS.
trace = [{'id':r['id'],'kind':'REQUIREMENT','prompt':r['prompt'],'finding':choose(r['text']) and next((f['id'] for f in new_findings if f['prompt']==r['prompt']), 'QC-POST-F-001'),'gap':r['gap'],'status':r['status']} for r in reqs]
trace += [{'id':f['id'],'kind':'FINDING','prompt':f['prompt'],'finding':f['id'],'gap':f['gap'],'status':f['status']} for f in findings]
trace += [{'id':g['id'],'kind':'GAP','prompt':g['prompt'],'finding':next((f['id'] for f in findings if f['prompt']==g['prompt']),new_findings[-1]['id']),'gap':g['id'],'status':g['status']} for g in gaps]
trace += [{'id':d['id'],'kind':'DOMAIN_100_HISTORICAL','prompt':d['prompt'],'finding':next((f['id'] for f in findings if f['prompt']==d['prompt']),new_findings[-1]['id']),'gap':d['gap'][0],'status':d['status']} for d in domains]
trace += [{'id':o['id'],'kind':'OPERATIONAL_EVIDENCE','prompt':next((p['id'] for p in prompts if o['id'] in p.get('sourceEvidence','').split(',')), 'QC-EVID26-01'),'finding':next((f['id'] for f in new_findings if o['id'] in by_id[f['prompt']].get('sourceEvidence','').split(',')),new_findings[0]['id']),'gap':'G-020','status':'AUTHORITY_REFERENCE_PENDING'} for o in operational]
trace += [{'id':'TASK:'+p['id'],'kind':'HISTORICAL_RESIDUAL_TASK','prompt':p['id'],'finding':next((f['id'] for f in findings if f['prompt']==p['id']), 'QC-POST-F-001'),'gap':'G-010','status':'UNVERIFIED'} for p in old_prompts]
assert all(t['prompt'] in by_id for t in trace)
assert all(any(t['prompt']==p['id'] for t in trace) for p in prompts), 'orphan prompt'

P = Counter(g['priority'] for g in gaps)
AUTH = sum(g['category']=='AUTHORITY_GAP' for g in gaps)
ENV = sum(g['category']=='EVIDENCE_GAP' for g in gaps)
KNOWN = len(trace)
MAPPED = sum(bool(t['prompt']) for t in trace)
system_verified = 0 # 0 current-candidate accepted cross-dimensional domain proofs in this run.
nav_names = [
 ('QC-100-PERCENT-MASTER-EXECUTION-PROMPT-PACK.html','حزمة التنفيذ الرئيسية'),
 ('QC-FULL-SYSTEM-RECONCILIATION-AUDIT.html','تدقيق المصالحة الكامل'),
 ('QC-100-DOMAIN-VERIFICATION-SCORECARD.html','بطاقة تحقق 100 اختصاص'),
 ('QC-CONTROLLED-OPERATIONAL-EVIDENCE-REGISTER.html','سجل الأدلة التشغيلية'),
 ('QC-GAP-BLOCKER-CLOSURE-REGISTER.html','سجل الفجوات والحواجز'),
 ('QC-REQUIREMENT-EVIDENCE-TRACEABILITY-MATRIX.html','مصفوفة التتبع'),
 ('QC-RELEASE-READINESS-AND-PRODUCTION-EVIDENCE.html','جاهزية الإصدار'),
 ('QC-100-PERCENT-EXECUTIVE-CLOSURE-DASHBOARD.html','لوحة الإغلاق التنفيذية'),
]

CSS = """
:root{color-scheme:dark light;--bg:#101721;--surface:#192536;--ink:#eaf2fa;--muted:#b6c7d8;--line:#455c74;--link:#8ed5ff;--bad:#ffb9ad;--accent:#b5e4cb}
@media(prefers-color-scheme:light){:root{--bg:#f5f8fb;--surface:#fff;--ink:#142235;--muted:#40536a;--line:#9eafbf;--link:#075b90;--bad:#a12f20;--accent:#185d3b}}
body[data-theme=light]{color-scheme:light;--bg:#f5f8fb;--surface:#fff;--ink:#142235;--muted:#40536a;--line:#9eafbf;--link:#075b90;--bad:#a12f20;--accent:#185d3b}
body[data-theme=dark]{color-scheme:dark;--bg:#101721;--surface:#192536;--ink:#eaf2fa;--muted:#b6c7d8;--line:#455c74;--link:#8ed5ff;--bad:#ffb9ad;--accent:#b5e4cb}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:1rem/1.7 system-ui,sans-serif}header,main,footer{max-width:1450px;margin:auto;padding:1.1rem}nav{display:flex;flex-wrap:wrap;gap:.55rem}a{color:var(--link)}a:focus-visible,button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid var(--link);outline-offset:3px}nav a,.chip{border:1px solid var(--line);padding:.25rem .65rem;border-radius:.5rem}h1{font-size:clamp(1.7rem,4vw,2.8rem)}h2{margin-top:2rem}section,article,details,.box{background:var(--surface);border:1px solid var(--line);border-radius:.7rem;padding:1rem;margin:1rem 0}small,.muted{color:var(--muted)}.bad{color:var(--bad);font-weight:700}.good{color:var(--accent)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:.7rem}.metric{background:var(--surface);border:1px solid var(--line);padding:1rem;border-radius:.6rem}.metric strong{display:block;font-size:1.35rem}table{border-collapse:collapse;width:100%;min-width:900px}th,td{border:1px solid var(--line);padding:.55rem;text-align:start;vertical-align:top}th{background:var(--surface);position:sticky;top:0}.scroll{max-width:100%;overflow:auto}button,input{font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--line);padding:.55rem;border-radius:.4rem}button{cursor:pointer}input[type=search]{width:min(100%,32rem)}pre{white-space:pre-wrap;overflow-wrap:anywhere;direction:ltr;text-align:left;background:var(--bg);border:1px solid var(--line);padding:1rem}code,bdi{direction:ltr;unicode-bidi:isolate}details summary{cursor:pointer;font-weight:700}#search-status{margin:.5rem 0}@media print{body{background:white;color:black}nav,button,input,.no-print{display:none!important}section,article,details{break-inside:avoid;background:white;color:black}details:not([open])>*:not(summary){display:block}table{min-width:0;font-size:9pt}a{color:black}}
"""
JS = """
const theme=document.querySelector('#theme');theme?.addEventListener('click',()=>{const next=document.body.dataset.theme==='dark'?'light':'dark';document.body.dataset.theme=next;theme.setAttribute('aria-label','تبديل المظهر؛ الحالي '+next)});
const search=document.querySelector('#search'),status=document.querySelector('#search-status');search?.addEventListener('input',()=>{let n=0;const q=search.value.trim().toLocaleLowerCase();document.querySelectorAll('[data-filter]').forEach(x=>{x.hidden=!x.textContent.toLocaleLowerCase().includes(q);if(!x.hidden)n++});status.textContent=n+' عنصر ظاهر'});
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{const text=document.querySelector('#'+CSS.escape(button.dataset.copy))?.textContent||'';await navigator.clipboard.writeText(text);button.textContent='نُسخ البرومبت'}catch{button.textContent='تعذر النسخ؛ حدّد النص يدويًا'}}));
document.querySelectorAll('[data-expand]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('details').forEach(d=>d.open=button.dataset.expand==='open')}));
"""

def report(filename,title,kind,body,searchable=False):
    path=OUT/filename
    if path.exists(): raise FileExistsError(path)
    nav='<nav aria-label="تقارير التشغيل">'+link('index.html','الفهرس')+''.join(link(f,n) for f,n in nav_names)+'</nav>'
    metrics=f'<div class="grid"><div class="metric">الحالة<strong class="bad">NO-GO</strong></div><div class="metric">التحقق الفعلي<strong>{system_verified}% (0/100 اختصاص مثبت حاليًا)</strong></div><div class="metric">ربط المتطلبات المعروفة<strong>{MAPPED}/{KNOWN} ({MAPPED/KNOWN:.0%})</strong></div><div class="metric">P0 / P1<strong>{P["P0"]} / {P["P1"]}</strong></div><div class="metric">Authority blockers<strong>{AUTH}</strong></div><div class="metric">Environment/Evidence gaps<strong>{ENV}</strong></div><div class="metric">Production<strong>UNVERIFIED</strong></div><div class="metric">SHA<strong><code>{SHA[:12]}</code></strong></div></div>'
    controls='<div class="no-print"><label for="search">بحث داخل هذا التقرير</label> <input id="search" type="search" autocomplete="off"><p id="search-status" role="status" aria-live="polite"></p></div>' if searchable else ''
    doc=f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><style>{CSS}</style></head><body><header><p class="bad">{esc(kind)} · NO-GO · ليس دليل امتثال أو إفراج</p><h1>{esc(title)}</h1><p>Run ID: <bdi>{RUN}</bdi> · Generated At: <bdi>{NOW}</bdi> · Repository: <bdi>{baseline['repository']}</bdi> · Branch: <bdi>{BRANCH}</bdi> · Git SHA: <bdi>{SHA}</bdi> · Migration source head: <bdi>{MIGRATION}</bdi></p><p>Evidence cutoff: {NOW}. Source audit baseline: {link('../QC-100-PERCENT-ADAPTIVE-EXECUTION-PROMPTS-2026-09-30.html','حزمة 30 سبتمبر')}؛ أدلة Runtime/Production/UAT للـSHA الحالي لم تُقبل في هذا التشغيل. <strong>Verified % ≠ Coverage %.</strong></p><button id="theme" type="button" aria-label="تبديل المظهر">تبديل المظهر</button> <button type="button" onclick="window.print()">طباعة</button>{nav}</header><main><section aria-label="حقيقة التنفيذ الحالية"><h2>الحقيقة التنفيذية</h2>{metrics}</section>{controls}{body}</main><footer><p>NO EVIDENCE = NOT VERIFIED · PASS ≠ RELEASED · لا مصدر صورة أصلي أو hash داخل التشغيل الحالي.</p>{nav}</footer><script>{JS}</script></body></html>'''
    path.write_text(doc,encoding='utf-8')

def source_refs(items):
    return ', '.join(link('../../../'+s,s) for s in items)

def prompt_body(p):
    pid=p['id']; matches=[t for t in trace if t['prompt']==pid]
    fs=sorted({t['finding'] for t in matches}); gs=sorted({t['gap'] for t in matches}); ds=sorted({t['id'] for t in matches if t['kind']=='DOMAIN_100_HISTORICAL'}); rs=sorted({t['id'] for t in matches if t['kind']=='REQUIREMENT'});
    work=p['work']; ac=p.get('acceptance') or [work]
    text=f'''{pid} — {p['title']}\nPriority/Severity: {p['priority']} / {p['priority']}\nCurrent state: {p['status']} — reconcile this exact HEAD and working tree first.\nWhy: {work}\nFindings: {', '.join(fs)}\nGaps: {', '.join(gs)}\nRequirements: {', '.join(rs)}\n100-domain disciplines: {', '.join(ds)}\nSource evidence: {p['source']}; {p.get('sourceEvidence','historical audit and candidate-bound handoffs')}\nAffected routes: {', '.join(p.get('routes',[])) or 'Determine from route registry, not guessed'}\nAffected modules/files: {p.get('modules') or 'Determine through application/data call path'}\nDependencies: {', '.join(p.get('dependencies',[])) or 'Source/authority, isolated PostgreSQL and exact-release evidence as applicable'}\nAuthority dependencies: obtain approved WI/SOP/specification/policy/revision/owner before scientific automation or disposition; missing source = BLOCKED_BY_AUTHORITY_SOURCE.\nCURRENT-STATE RECONCILIATION: inspect HEAD, current implementation, matching handoffs and evidence; classify DONE_WITH_CURRENT_EVIDENCE / PARTIAL / NOT_STARTED / STALE / REGRESSED / BLOCKED / SUPERSEDED. Preserve valid work. Implement only residual gap; rerun exact relevant tests and bind evidence to release candidate.\nImplementation: {work}\nData model & migration: inspect canonical schema and migration manifest; version controlled sources and snapshots; add forward-only migration only if residual schema requires it; do not apply to production.\nAuthorization & audit: enforce role+permission+scope+state+version+SoD server-side; append actor/time/reason/version and correlate mutation+audit in one transaction.\nSecurity/negative: direct unauthorized route/action, wrong scope/state, stale version, duplicate/replay, invalid unit/quantity and failed side effect must deny without unauthorized writes, leaked secrets or false success.\nPostgreSQL: execute against supported disposable PostgreSQL 18 with migration/checksum, rollback, concurrent race and constraint proofs as applicable; SQLite or unit-only is insufficient.\nBrowser/E2E: authenticated real-record positive and denial controls, no-JS, error/empty/HOLD, keyboard/zoom/mobile/print where applicable; record screenshot/trace, role, state and build identity.\nAcceptance: {'; '.join(str(x) for x in ac)}\nRequired artifacts: current SHA+dirty fingerprint, source/authority identifiers, migration ledger, command exit/counts/skips, PG transaction proof, negative HTTP/browser traces, human acceptance/provider identity where applicable; evidence IDs registered in matrix.\nHard fail: missing authority, skipped tests treated PASS, old-SHA evidence, uncontrolled automatic PASS/AQL, HOLD release, overdraw, raw evidence overwrite, missing exact artifact/provider identity or UAT.\nDo not: invent science/policy, rewrite history, rework proven repairs without regression, commit/push/deploy/migrate production under this task.\nCompletion state: OPEN until every applicable acceptance artifact is current and reviewed; otherwise PARTIAL/BLOCKED.\n'''
    return text, fs,gs,ds,rs

cards=[]
for p in prompts:
    text,fs,gs,ds,rs=prompt_body(p)
    cards.append(f'<details id="{esc(p["id"])}" data-filter><summary><bdi>{esc(p["id"])}</bdi> — {esc(p["title"])} <span class="chip">{esc(p["priority"])}</span></summary><p>الحالة: {esc(p["status"])} · {len(rs)} متطلبات، {len(fs)} Findings، {len(gs)} Gaps، {len(ds)} اختصاصات.</p><button type="button" data-copy="text-{esc(p["id"])}">نسخ البرومبت</button><pre id="text-{esc(p["id"])}" lang="en">{esc(text)}</pre></details>')
body='<section><h2>قاعدة التنفيذ والاعتمادات</h2><p>المصدر المعتمد → النموذج والهوية → PostgreSQL → تفويض الخادم → E2E → الأثر الحتمي → المزود → UAT → إغلاق مستقل. الإغلاق الصوري ممنوع؛ كل بطاقة قابلة للنسخ وحدها.</p><p>36 بطاقة متبقية من مواصفة التحسين القديمة تمت إعادة صياغتها تكيفيًا + 20 بطاقة مشتقة من المصالحة التشغيلية. الحزمة التاريخية القديمة تحتوي 42 بطاقة، والحزمة المقلمة اللاحقة 17 بطاقة مرئية؛ لا يستعمل أي منهما كدليل نجاح.</p><button type="button" data-expand="open">فتح الكل</button> <button type="button" data-expand="close">طي الكل</button></section><section><h2>سجل الربط</h2>'+table(['نوع','عدد','قاعدة'],[(k,n,'mapped ≠ verified') for k,n in Counter(t['kind'] for t in trace).items()])+'</section><section><h2>البرومبتات التنفيذية ('+str(len(cards))+')</h2>'+''.join(cards)+'</section><section><h2>معيار الإغلاق القطعي</h2><p>لا TRUE VERIFIED 100% حتى تقبل المصادر العلمية، ويصبح كل متطلب إلزامي وكل مجال منطبق PASS بدليل مترابط مع نفس SHA والأثر والمخطط المطبق، دون P0/P1 أو بوابة إنتاج/UAT/استعادة مفتوحة. أي N/A تتطلب اعتمادًا مستقلاً.</p></section>'
report(nav_names[0][0],nav_names[0][1],'PRIMARY EXECUTION PROMPT PACK',body,True)

reality = [('Repository/branch/SHA',baseline['repository']+' / '+BRANCH+' / '+SHA),('Framework/package','Astro 4.16.19 / pnpm 11.25.0 (package.json)'),('Node observed/contract',baseline['nodeObserved']+' / '+baseline['nodeContract']+' — OUTSIDE CONTRACT'),('Source migrations',f'{len(MIGRATIONS)} / {MIGRATION}'),('Applied migrations','UNVERIFIED for current candidate; historical read-only Render snapshot 18/45 on ff608a0c, not carried forward'),('Route/page/nav',str(baseline['pageRoutes'])+' registry ID matches (source regex only); historical 86 canonical + 2 error pages, route-matrix text 85; current count requires parser validation'),('Build/type/lint/format/architecture/security/integration/concurrency/E2E','NOT EXECUTED on this SHA in this run; no PASS inferred'),('Remote CI/provider/runtime/UAT/recovery','NOT VERIFIED on this SHA'),('Release identity','source SHA known; artifactSha256/serviceVersion/applicationVersion/applied checksum/environment identity UNVERIFIED')]
report(nav_names[1][0],nav_names[1][1],'CURRENT ANALYTICAL AUDIT','<section><h2>Reality Freeze</h2>'+table(['عنصر','حقيقة/حد الدليل'],reality)+'</section><section><h2>مصالحة الادعاءات التاريخية</h2>'+table(['لقطة','SHA','التصنيف الحالي','السبب'],[('100-domain baseline','eadc263…','HISTORICAL','18 migration، 88 unit؛ ليس مرشح اليوم'),('Adaptive page audit','0b1bb21…','HISTORICAL','258/671؛ فحص صفحات قديم'),('Post implementation','6059e177…','STALE','311/671 و43 migration على مرشح مختلف'),('Coverage register',baseline['historicCoverageSha'],'STALE','0/1502 دليل قبول مقيد بمرشح آخر و0043'),('Render handoff','ff608a0c…','UNVERIFIED','18/45 snapshot؛ لا تطابق الهوية الإنتاجية الحالية'),('Current source',SHA,'CURRENT_SOURCE_ONLY','45 migration؛ التشغيل والمخطط المطبق غير مثبتين')])+'</section><section><h2>تحليل الفجوات</h2><p>Implementation: Receiving متعدد الأسطر والنقل الداخلي وسلسلة sample/part/run/disposition المقترحة غير مثبتة في source. Evidence: PostgreSQL/E2E/UAT/provider/recovery مفقودة على المرشح. Authority: WI/AQL/limits/retest/retention/transfer/signature. Environment: Node المحلي خارج العقد. Governance: 19 release gates وحماية الفرع/Pages. Documentation drift: 100 اختصاص تاريخي ≠ 80 مجالًا معتمدًا ≠ 100 متطلبًا مشتقًا؛ 85/86/88 مسار/صفحة لا تقاس بالمقام نفسه.</p><p class="bad">Release posture: NO_GO. لا شهادة ISO/FDA/SFDA/GMP/21 CFR مستنتجة.</p></section>')

domain_rows=[]
for d in domains:
    domain_rows.append((d['id'],esc(d['name']),esc('Historical '+d['source']),esc('HISTORICAL: '+d['implementation']),esc('HISTORICAL: '+d['test']),'UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED',esc(', '.join(d['gap'])),link(nav_names[0][0]+'#'+d['prompt'],d['prompt']),'<strong class="bad">UNVERIFIED</strong>','No current-candidate multidimensional acceptance; historical '+esc(d['historical'])))
report(nav_names[2][0],nav_names[2][1],'100 HISTORICAL DISCIPLINES / CURRENT RECHECK','<section><h2>مقامات منفصلة</h2><p>Requirement mapping: '+str(MAPPED)+'/'+str(KNOWN)+' = 100% known-row linkage؛ implementation verified: NOT VERIFIED؛ runtime verified: 0/100 proven؛ system verified: 0/100 proven in this run. هذه الـ100 اختصاص من خط أساس تاريخي، وD01–D80 سجل تقييم آخر معتمد؛ ليست ترقية تلقائية للحالة.</p></section><section><h2>كل الاختصاصات التاريخية 100/100</h2>'+table(['ID','الاختصاص','المصدر المحكوم','Implementation','Automated test','PostgreSQL','Runtime','Browser/E2E','Security negative','UAT/Production','Gap','Prompt','الحالة','السبب'],domain_rows)+'</section>',True)

report(nav_names[3][0],nav_names[3][1],'CONTROLLED QC OPERATIONAL EVIDENCE','<section><h2>حد السلطة</h2><p>المدخل هو وصف المستخدم لسجلات وصور؛ الأصل/بصمة SHA-256 وتحقق المراجعة غير متاح محليًا. وثيقة WI المشار إليها في form تعني SOURCE_REFERENCE_IDENTIFIED / AUTHORITY_DOCUMENT_PENDING، وليس معيارًا علميًا معتمدًا. G/H لا يصنعان قاعدة.</p>'+table(['ID','العائلة','رقم','مراجعة','النوع','المجال','المشاهد','السلطة','المحدودية','المنشأ'],[(o['id'],esc(o['title']),esc(o['document']),esc(o['revision']),esc(o['classification']),esc(o['domain']),esc(o['observed']),esc(o['authority']),esc(o['limitation']),esc(o['provenance'])) for o in operational])+'</section>',True)

report(nav_names[4][0],nav_names[4][1],'GAP AND BLOCKER CLOSURE REGISTER','<section><h2>إغلاق بدليل لا باختفاء الصف</h2><p>G-001..020 محفوظة؛ G-RECON-* إضافات لا تحذف القديم. P0 '+str(P['P0'])+' / P1 '+str(P['P1'])+' / P2 '+str(P['P2'])+'. Authority '+str(AUTH)+'، Evidence/Environment '+str(ENV)+' حسب تصنيف الفجوة الأولي؛ لا تعني عدد سياسات مستقلة.</p>'+table(['Gap ID','العنوان/سبب الجذر','الفئة','الأولوية','المجال/المسارات','الحالة','تنفيذ/دليل/سلطة','Prompt','الاعتماديات','دليل الإغلاق','Hard fail'],[(g['id'],esc(g['title']),g['category'],g['priority'],esc(g['domains']),g['status'],'UNVERIFIED / UNVERIFIED / PENDING',link(nav_names[0][0]+'#'+g['prompt'],g['prompt']),'source→PG→runtime→UAT',esc(g['closure']),'YES' if g['priority']=='P0' else 'release gate dependent') for g in gaps])+'</section><section><h2>جميع Findings</h2>'+table(['ID','العنوان','الأولوية','الحالة','Prompt','Gap','المصدر'],[(f['id'],esc(f['title']),f['priority'],f['status'],link(nav_names[0][0]+'#'+f['prompt'],f['prompt']),esc(f['gap']),esc(f['source'])) for f in findings])+'</section>',True)

report(nav_names[5][0],nav_names[5][1],'CANONICAL RECONCILIATION TRACE MATRIX','<section><h2>آلية عدّ التغطية</h2><p>'+str(KNOWN)+' صفًا معروفًا من 100 متطلب مشتق و100 اختصاص تاريخي وFindings وGaps وأدلة تشغيلية؛ '+str(MAPPED)+' لها مسار Prompt = 100% mapping. هذه ليست نسبة متطلبات مقبولة. المتطلبات التشغيلية الإضافية معرّفة بمصادر OP-* وG-RECON-*، وليست متطلبات تنظيمية معتمدة.</p><p>ORPHAN_REQUIREMENT=0، ORPHAN_GAP=0، ORPHAN_FINDING=0، ORPHAN_PROMPT=0، MISSING_EVIDENCE_PATH=0 بمعنى وجود وصف للأثر المطلوب فقط؛ actual evidence pending.</p></section><section><h2>Requirement → Evidence</h2>'+table(['ID','الوصف','المجال','المصدر','Implementation','Test','PostgreSQL','Runtime','Browser','Security','UAT','Production','Gap','Finding','Prompt','Status'],[(r['id'],esc(r['text']),esc(r['scope']),esc(r['source']),'SOURCE_ONLY / REVIEW','NOT EXECUTED','NOT VERIFIED','NOT VERIFIED','NOT VERIFIED','NOT VERIFIED','NOT EXECUTED','NOT VERIFIED',r['gap'],esc(next(t['finding'] for t in trace if t['kind']=='REQUIREMENT' and t['id']==r['id'])),link(nav_names[0][0]+'#'+r['prompt'],r['prompt']),r['status']) for r in reqs])+'</section><section><h2>الروابط الأخرى</h2>'+table(['نوع','ID','Finding','Gap','Prompt','Status'],[(t['kind'],esc(t['id']),esc(t['finding']),esc(t['gap']),link(nav_names[0][0]+'#'+t['prompt'],t['prompt']),esc(t['status'])) for t in trace if t['kind']!='REQUIREMENT'])+'</section>',True)

release_rows=[('CI','NOT VERIFIED','No current GitHub Actions result bound to '+SHA),('Branch protection / Pages','UNVERIFIED','Read-only repository settings/checks required; no mutation authorized'),('Source migration',MIGRATION,'45 source files; applied ledger and checksum UNVERIFIED'),('Artifact SHA-256','UNVERIFIED','No current dist artifact built under supported Node'),('Render/provider identity','UNVERIFIED','render.yaml desired config is not read-back of service; historical deployment differed'),('PostgreSQL privilege','UNVERIFIED / HISTORICAL FAIL','Prior role could alter protected history tables on ff608a0c; current binding not proven'),('Build once / promote same artifact','UNVERIFIED','Render source rebuild cannot be equated to CI artifact without identical bytes or direct promotion'),('Health/readiness & monitoring','UNVERIFIED','No current live dependency check or alert proof'),('Storage/object evidence','UNVERIFIED','No provider roundtrip and restore hash'),('Security/E2E/UAT','NOT EXECUTED','Exact release negative cases and human acceptance absent'),('Backup/restore','UNVERIFIED','Prior isolated exercises cannot close current provider recovery')]
report(nav_names[6][0],nav_names[6][1],'RELEASE READINESS AND PRODUCTION EVIDENCE','<section><h2>الهوية الدقيقة</h2>'+table(['جزء','قيمة'],[('gitSha',SHA),('serviceVersion','UNVERIFIED runtime (package source 0.1.0)'),('applicationVersion','UNVERIFIED runtime (package source 0.1.0)'),('migrationHead',MIGRATION+' SOURCE ONLY'),('migrationHeadChecksum','UNVERIFIED applied ledger'),('artifactSha256','UNVERIFIED'),('environment identity','UNVERIFIED')])+'</section><section><h2>بوابات مستقلة</h2>'+table(['الجزء','الحالة','الدليل المطلوب'],release_rows)+'</section><section><h2>قرار</h2><p class="bad">NO_GO: unverified applied schema, artifact/provider identity, CI/E2E/UAT/recovery and controlled scientific source. No deployment or migration performed.</p></section>')

dashboard='<section><h2>قرار مختصر</h2><p class="bad">SYSTEM STATUS: NO-GO. لا يصح الإفراج أو إعلان امتثال.</p>'+table(['مقياس','قيمة'],[('Prompt Pack known-row coverage',f'{MAPPED}/{KNOWN} = 100% mapped'),('System Verified',f'{system_verified}% current-candidate full-domain proof (0/100)'),('Requirements','100 reconciled historical + operational additions recorded separately'),('Verified requirements','0 current-candidate accepted end-to-end in this run'),('Prompts',str(len(prompts))),('Findings',str(len(findings))),('Open P0/P1/P2',f'{P["P0"]}/{P["P1"]}/{P["P2"]} gaps'),('Implementation/Evidence/Authority/Environment/Governance gaps',str(dict(Counter(g['category'] for g in gaps)))),('PostgreSQL / E2E / Security / UAT / Production / Recovery / Release Identity','UNVERIFIED / NOT EXECUTED / UNVERIFIED / NOT EXECUTED / UNVERIFIED / UNVERIFIED / UNVERIFIED'),('Current SHA',SHA),('Source migration head',MIGRATION),('Artifact identity','UNVERIFIED')])+'</section><section><h2>التقارير</h2><ul>'+''.join('<li>'+link(f,n)+'</li>' for f,n in nav_names)+'</ul></section>'
report(nav_names[7][0],nav_names[7][1],'EXECUTIVE CLOSURE DASHBOARD',dashboard)

manifest='<section><h2>محتويات التشغيل</h2>'+table(['الملف','الغرض','حالة التوليد','عدد Findings حرجة'],[(link(f,f),esc(n),'GENERATED — not product verified',str(sum(x['priority']=='P0' for x in findings))) for f,n in nav_names])+'</section><section><h2>حد النطاق</h2><p>Started At: '+NOW+' · Generated At: '+NOW+' · Run ID: '+RUN+' · مصدر المقارنة 30 سبتمبر و2 أكتوبر؛ الصور الأصلية غير متاحة في الملفات المحلية، والوصف فقط مصنف USER_SUPPLIED_OPERATIONAL_EVIDENCE. كل HTML تاريخي باقٍ بلا تعديل.</p></section>'
report('index.html','فهرس تشغيل المصالحة النهائي','RUN MANIFEST',manifest)

summary={'run':RUN,'sha':SHA,'migration':MIGRATION,'generated':NOW,'reports':9,'prompts':len(prompts),'historicalAdaptiveIdentifiers':len(legacy_ids),'previousOptimizationPrompts':36,'newPrompts':len(new_specs),'findings':len(findings),'gaps':len(gaps),'gapPriorities':dict(P),'authorityGaps':AUTH,'evidenceGaps':ENV,'knownRows':KNOWN,'mappedRows':MAPPED,'systemVerifiedPercent':system_verified,'releasePosture':'NO_GO','sourceRoutesRegex':baseline['pageRoutes']}
path=OUT/'reconciliation-summary.json'
if path.exists(): raise FileExistsError(path)
path.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
