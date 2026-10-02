"""Validate the frozen-source mapping and final authoritative HTML; no application tests."""
from pathlib import Path
import json, re, hashlib, collections
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
pack=ROOT/'audit/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html'
s=BeautifulSoup(pack.read_text(),'html.parser');inline=json.loads(s.find(id='pack-data').string)
prompts=inline['prompts'];rows=inline['rows'];byid={p['id']:p for p in prompts};ledger=json.loads((OUT/'master-coverage-ledger.json').read_text());source=json.loads((ROOT/'audit/2026-10-02/post-implementation/verification-data.json').read_text());base=json.loads((ROOT/'audit/2026-10-02/coverage-register.json').read_text());spec=json.loads((OUT/'prompt-specifications.json').read_text());freeze=json.loads((OUT/'freeze.json').read_text());checks=[]
def check(name,condition):
 assert condition,name
 checks.append(name)
check('36 unique prompts; independent FINAL last',len(byid)==len(prompts)==36 and prompts[-1]['id']=='QC-POST-100-FINAL')
check('all 37 required fields, nonempty and equal to rendered labels',all(set(p['fields'])==set(spec['fields']) and all(str(v).strip() for v in p['fields'].values()) for p in prompts) and len(s.select('article.card dt'))==36*37)
check('cards/copy controls exact same prompt IDs',set(x['data-prompt'] for x in s.select('[data-prompt]'))==set(byid)==set(x['data-copy'] for x in s.select('[data-copy]')))
check('eleven filter types present',set(x['data-filter'] for x in s.select('[data-filter]'))=={'priority','severity','domain','routes','gates','status','dependencies','owner','policy','human','production'})
check('no duplicate objectives/row IDs',len({p['title'] for p in prompts})==36 and len({r['id'] for r in rows})==len(rows))
position={p['id']:i for i,p in enumerate(prompts)}
check('acyclic topological ordering; all references valid',all(d in position and position[d]<position[p['id']] for p in prompts for d in p['dependencies']))
check('reciprocal dependency/blocks edges',all(set(p['blocks'])=={q['id'] for q in prompts if p['id'] in q['dependencies']} for p in prompts))
check('all findings exactly preserved',{r['id'] for r in rows if r['type'] in ['original-finding','new-finding']}=={r['id'] for r in source['findings']+source['newFindings']})
check('all88 below100 pages exactly preserved',{r['id'] for r in rows if r['type']=='page'}=={p['id'] for p in source['pages'] if p['score']<100})
check('all671 individual page checks exactly preserved',{r['id'] for r in rows if r['type']=='page-criterion'}=={p['id']+':'+c['id'] for p in source['pages'] for c in p['checks']})
check('all88 page-copy inventories assigned',len([r for r in rows if r['type']=='page-copy'])==88 and all('QC-POST-100-018' in r['prompts'] for r in rows if r['type']=='page-copy'))
check('all1508 baseline register rows preserved',{r['id'][5:] for r in rows if r['id'].startswith('BASE:')}=={r['id'] for r in base['rows']} and len(base['rows'])==1508)
check('25 indicator names and22 gate identities preserved',len([r for r in rows if r['type']=='indicator'])==25 and {r['title'] for r in rows if r['type']=='audit-gate'}=={g[0] for g in source['gates']})
check('19 unresolved gates assigned to registry intake and independent final',len([r for r in rows if r['type']=='register-release-gate'])==19 and all(set(r['prompts'])=={'QC-POST-100-014','QC-POST-100-FINAL'} for r in rows if r['type']=='register-release-gate'))
check('every source observation preserved',{r['id'] for r in rows if r['type']=='observation'}=={r['id'] for r in source['observations']})
report=BeautifulSoup((ROOT/'audit/2026-09-30-POST-IMPLEMENTATION-FULL-SYSTEM-VERIFICATION.html').read_text(),'html.parser')
check('every report heading represented',{r['title'] for r in rows if r['type']=='report-section'}=={h.get_text(' ',strip=True) for h in report.find_all('h2')})
check('all gap-to-prompt-to-acceptance-to-required-artifact links nonempty',all(r['prompts'] and r['criterion'] and len(r['prompts'])==len(r['acceptance'])==len(r['requiredEvidence']) and all(p in byid for p in r['prompts']) for r in rows))
check('each explicit owned acceptance component retained in full ledger',all(set(r['acceptanceComponents'])==set(r['prompts']) and all(r['acceptanceComponents'][p]['componentCriteria']==byid[p]['acceptance'] and r['id'] in r['acceptanceComponents'][p]['artifact'] for p in r['prompts']) for r in ledger['rows']))
check('zero assigned criteria falsely accepted',all(not r['evidenceAccepted'] for r in rows))
check('all prompts have binary criteria, no empty task and guards',all(p['rowIds'] and len(p['acceptance'])>=3 and p['fields']['Hard fail conditions'].startswith('FAIL if') and 'Do NOT do' in p['fields'] for p in prompts))
check('closed implementation work is verification-only',all('PARTIAL'==byid[p]['status'] and any(w in byid[p]['work'].lower() for w in ['inspect','verify','reproduce','inventory','measure','reconcile']) for p in ['QC-POST-100-001','QC-POST-100-003','QC-POST-100-004','QC-POST-100-005','QC-POST-100-007','QC-POST-100-009','QC-POST-100-012','QC-POST-100-013','QC-POST-100-017']))
check('immutable report/data/baseline inputs unchanged',all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h for p,h in freeze['inputs'].items() if 'REMAINING-TO-100-PROMPTS.' not in p))
check('prior pack snapshots match frozen hashes',hashlib.sha256((OUT/'before-html.txt').read_bytes()).hexdigest()==freeze['inputs']['audit/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html'] and hashlib.sha256((OUT/'before-md.txt').read_bytes()).hexdigest()==freeze['inputs']['audit/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.md'])
check('no external executable/assets dependencies',not s.find_all('script',src=True) and not s.find_all('link',href=True) and not s.find_all('iframe'))
check('derived individual files are navigation-only',all('Copy Prompt' not in (ROOT/'audit/QC-POST-100-PROMPTS'/f'{p}.html').read_text() and '#'+p in (ROOT/'audit/QC-POST-100-PROMPTS'/f'{p}.html').read_text() for p in byid))
Path('/private/tmp/qc-pack-ui.js').write_text(s.find_all('script')[-1].get_text());Path('/private/tmp/qc-pack-inline.json').write_text(json.dumps(inline))
result={'status':'PASS','checksPassed':len(checks),'checks':checks,'prompts':len(prompts),'atomicLedgerRows':len(rows),'htmlSha256':hashlib.sha256(pack.read_bytes()).hexdigest(),'scope':'Structural/source coverage and contracts only. Browser rendering/manual accessibility NOT VERIFIED; IAB file protocol denied, Chromium launch blocked. No application test/build/PG/live/UAT run.'}
(OUT/'structural-validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
