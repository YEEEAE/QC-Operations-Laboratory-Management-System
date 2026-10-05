#!/usr/bin/env python3
"""Read-only audit generator/validator. Emits apply_patch text; never writes files/DB.

python3 audit/2026-10-05/evidence-based-readiness/generate_readiness.py --check
python3 audit/2026-10-05/evidence-based-readiness/generate_readiness.py --selftest
python3 audit/2026-10-05/evidence-based-readiness/generate_readiness.py --patch
Apply emitted patch with the agent's apply_patch tool, not a file-writing shell.
HTMLs contain self-contained renderers; patch mode freezes a source inventory and
embeds normalized records. No pnpm product tests, integrations or DB are invoked.
"""
import argparse
import copy
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SHA = 'b3874da019300f6f81f75fe50904456bc251de2b'
GROUPS = {'P0':12, 'P1':10, 'UX':34, 'ENG':8, 'OBS':2, 'OPS':12, 'P2':10}
EXPECTED = tuple(f'AUD-{g}-{n:03}' for g, count in GROUPS.items() for n in range(1, count+1))
WEIGHTS = {'P0':5,'P1':3,'UX':3,'ENG':3,'OBS':3,'OPS':3,'P2':1}
STATUSES = {'PASS','FAIL','BLOCKED','NOT VERIFIED','PARTIAL','NOT APPLICABLE'}
LEVELS = {f'E{i}' for i in range(7)}
PRODUCT_SCOPE = ('src','Documents','db','tests','scripts','public','.github','package.json','pnpm-lock.yaml','.nvmrc','astro.config.mjs','tsconfig.json','render.yaml','vitest.config.ts','playwright.config.ts')
FILES = ('QC-ULTIMATE-EVIDENCE-BASED-READINESS-REPORT.html', 'QC-PRODUCTION-READINESS-EXECUTION-PROMPTS.html')

def load():
    return json.loads((HERE/'ledger.json').read_text())

def normalize(data):
    records = []
    for identity, title in data['items']:
        item = copy.deepcopy(data['default_item'])
        item.update(id=identity, exact_user_definition=title, weight=WEIGHTS.get(identity.split('-')[1],0))
        if identity in data['write_required_ids']:
            item.update(status='BLOCKED', runtime='BLOCKED', root_cause='Acceptance requires prohibited DB writes or approved mutation execution; not performed.')
        item.update(copy.deepcopy(data['overrides'].get(identity, {})))
        if item['status'] == 'FAIL':
            item['runtime'] = 'BLOCKED' if identity in data['write_required_ids'] or identity in {'AUD-P1-002','AUD-P1-003'} else 'NOT VERIFIED'
        records.append(item)
    return records

def validate(data, records=None):
    rows = normalize(data) if records is None else records
    assert tuple(r['id'] for r in rows) == EXPECTED, 'Immutable 88-item membership/order'
    assert data['weights'] == WEIGHTS and data['denominator'] == 268, 'Fixed weights/denominator'
    assert sum(r['weight'] for r in rows) == 268
    assert data['sha'] == SHA
    for r in rows:
        assert r['weight'] == WEIGHTS[r['id'].split('-')[1]]
        assert r['status'] in STATUSES, 'Invalid status'
        assert r['implementation_footprint'] in {'NOT VERIFIED','PRESENT_LIMITED','ABSENT_CONFIRMED'}
        assert r['evidence_level'] in LEVELS
        required=r.get('required_evidence_levels',[])
        flags=r.get('required_evidence_flags',{})
        assert required and set(required)<=LEVELS and set(flags)<= {'automated','runtime','human'}
        assert all(isinstance(value,bool) for value in flags.values())
        if r['status'] == 'PASS':
            assert r['evidence_level'] not in {'E0','E1','E2'}, 'Source inspection cannot PASS full item'
            assert r['evidence'] and r.get('full_scope_validated'), 'Full scope not accepted'
            assert set(required)<=set(r.get('accepted_evidence_levels',[])), 'Required evidence levels missing'
            assert all(r[field]=='PASS' for field, needed in flags.items() if needed), 'Required applicable evidence flags missing'
            assert r.get('current_execution_binding') == SHA, 'PASS stale/missing binding'
            assert r['credit'] == 1
        elif r['status'] == 'PARTIAL':
            subset = r['validated_subset']
            assert subset and subset.get('sha') == SHA and subset.get('evidence'), 'Partial lacks explicit current validated subset'
            assert r['evidence_level'] not in {'E0','E1','E2'} and 0 < r['credit'] < 1
            assert subset.get('scope') and subset.get('missing') and subset.get('credit')==r['credit']
            for ref in subset['evidence']:
                assert ref.startswith('parent:') and data['parent_results'][ref[7:]]['outcome']=='PASS'
        elif r['status'] == 'NOT APPLICABLE':
            assert r.get('applicability_justification') and r.get('approved_applicability_source'), 'Unjustified NOT APPLICABLE'
            assert r['credit'] == 0, 'NOT APPLICABLE is not pass/denominator removal'
        else:
            assert r['credit'] == 0
        if r['status'] == 'FAIL':
            assert r['evidence_level'] in {'E2','E3'} and r['evidence'], 'FAIL needs source or observed execution evidence'
            if r['evidence_level']=='E3':
                assert r.get('failing_execution_evidence'), 'E3 FAIL missing measured failure'
                for ref in r['failing_execution_evidence']:
                    record=data['parent_results'][ref.removeprefix('parent:')]
                    assert ref.startswith('parent:') and record['outcome']=='FAIL' and record['sha']==SHA and record['level']=='E3'
    return rows

def parent_envelope(data):
    """Hashes parent-transcribed excerpts, not absent original full logs."""
    manifest=subprocess.run(['git','ls-tree','-r','HEAD','--',*PRODUCT_SCOPE],cwd=ROOT,capture_output=True,check=True).stdout
    equal=subprocess.run(['git','diff','--quiet','HEAD','--',*PRODUCT_SCOPE],cwd=ROOT).returncode==0
    status=subprocess.run(['git','status','--short'],cwd=ROOT,text=True,capture_output=True,check=True).stdout
    sha=subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,text=True,capture_output=True,check=True).stdout.strip()
    assert sha==SHA and equal
    # Parent Playwright may leave untracked diagnostics; preserve them, never treat them as product changes.
    assert all(line.startswith(('?? audit/','?? .playwright-mcp/')) for line in status.splitlines()), 'Unexpected working tree changes'
    return {'sha':sha,'product_scope':list(PRODUCT_SCOPE),'fingerprint_method':'SHA-256 of exact git ls-tree -r HEAD -- PRODUCT_SCOPE stdout; tracked working tree verified equal to HEAD for scope',
        'product_source_fingerprint':hashlib.sha256(manifest).hexdigest(),'tracked_product_tree_equals_HEAD':equal,
        'audit_outputs_excluded':True,'working_tree_status':status.strip(),'release_candidate_clean':False,
        'excerpt_sha256':{key:hashlib.sha256(record['raw_excerpt'].encode()).hexdigest() for key,record in data['parent_results'].items()},
        'digest_limit':'Digests bind parent-transcribed excerpts only; original full raw-log/probe-script/envelope digests NOT VERIFIED.'}

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.resources=[]; self.scripts=[]; self.current=None; self.links=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag=='a' and a.get('href'): self.links.append(a['href'])
        if tag in {'script','img','iframe','link','audio','video','source'}:
            for key in ('src','href'): 
                if a.get(key): self.resources.append(a[key])
        if tag=='script': self.current={'id':a.get('id'), 'type':a.get('type'), 'text':''}
    def handle_data(self, data):
        if self.current is not None: self.current['text']+=data
    def handle_endtag(self, tag):
        if tag=='script' and self.current is not None:
            self.scripts.append(self.current); self.current=None

class TableWrapperParser(HTMLParser):
    """Static containment check only, not a browser/viewport measurement."""
    VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self):
        super().__init__(); self.stack=[]; self.tables=0
    def handle_starttag(self, tag, attrs):
        attributes=dict(attrs)
        if tag=='table':
            assert any('scroll' in a.get('class','').split() for _,a in self.stack), 'Table lacks local scroll wrapper'
            self.tables+=1
        if tag not in self.VOID: self.stack.append((tag,attributes))
    def handle_endtag(self, tag):
        for index in range(len(self.stack)-1,-1,-1):
            if self.stack[index][0]==tag:
                del self.stack[index:]; break

def source_inventory():
    paths=sorted(p.relative_to(ROOT).as_posix() for p in (ROOT/'src/pages').rglob('*.astro'))
    migrations=sorted((ROOT/'db/migrations').glob('*.sql'))
    assert len(paths)==88, 'Page inventory changed: re-audit membership'
    assert len(migrations)==45 and migrations[-1].stem=='0045_provider_attestation_nonce_replay_guard'
    package=json.loads((ROOT/'package.json').read_text())
    assert package['version']=='0.1.0'
    route_source=(ROOT/'src/shared/routing/routes.ts').read_text()
    registry=re.findall(r"\[\s*'(RT-[^']+)'\s*,\s*'([^']+)'\s*,\s*'(src/pages/[^']+)'",route_source)
    assert len(registry)==86 and len(set(r[0] for r in registry))==86
    assert set(paths)=={r[2] for r in registry}|{'src/pages/404.astro','src/pages/500.astro'}
    skills=list((ROOT/'.agents/skills').rglob('SKILL.md'))
    # Local discovery/read without importing or executing skill code.
    skill_hashes={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in skills}
    evidence=[]
    for row in normalize(load()):
        for ref in row['evidence']:
            if ref.startswith('parent:'):
                record=load()['parent_results'][ref[7:]]
                assert record['sha']==SHA
                evidence.append({'reference':ref,'excerpt_sha256':hashlib.sha256(record['raw_excerpt'].encode()).hexdigest()})
                continue
            path=ref.split(':')[0]
            p=ROOT/path
            assert p.is_file(), f'Missing evidence {ref}'
            text=p.read_text()
            evidence.append({'reference':ref,'sha256':hashlib.sha256(text.encode()).hexdigest()})
    return {'pages':paths,'registry':[{'id':r[0],'route':r[1],'page':r[2]} for r in registry],
            'source_migrations':len(migrations),'evidence_files':evidence,
            'skills_discovered_and_read_locally':len(skill_hashes),'skill_file_sha256':skill_hashes}

def render_model(scripts, payload, parent_payload):
    """Exercise offline renderer in a minimal DOM model, NOT browser proof."""
    harness=r'''
const vm=require('node:vm');let input='';process.stdin.on('data',d=>input+=d);
process.stdin.on('end',()=>{const p=JSON.parse(input),nodes={};
function node(id){return nodes[id]||(nodes[id]={innerHTML:'',textContent:'',value:'',addEventListener(){}});}
const context=vm.createContext({document:{getElementById(id){if(id==='frozen-source')return null;return node(id);},querySelectorAll(){return[];}},navigator:{}});
node('audit-data').textContent=p.payload;
node('parent-evidence').textContent=p.parent_payload;
for(const code of p.scripts)vm.runInContext(code,context,{timeout:5000});
const failures=[];const variants=[['ID',r=>r[0].id='AUD-P0-999'],['weight',r=>r[0].weight=6],['status',r=>r[0].status='READY'],['sourcePASS',r=>r[0].status='PASS'],['partial',r=>r[0].status='PARTIAL'],['notApplicable',r=>r[0].status='NOT APPLICABLE'],['legacyNA',r=>r[0].status='N/A'],['E7',r=>r[0].level='E7'],['E3FailureNoProof',r=>{r[0].status='FAIL';r[0].level='E3';r[0].failing_execution_evidence=[];}],['partialCredit',r=>r.find(x=>x.id==='AUD-ENG-006').credit=1]];
const original=JSON.parse(vm.runInContext('JSON.stringify(rows)',context));
for(const [name,mutate]of variants){let bad=JSON.parse(JSON.stringify(original));mutate(bad);context.bad=bad;try{vm.runInContext('validate(bad)',context);failures.push(name);}catch{}}
if(failures.length)throw Error('JS accepted malformed: '+failures);
const details=vm.runInContext('JSON.stringify({rows,domainMembers,expected:EXPECTED,textSamples:typeof textSamples==="undefined"?[]:textSamples,footprint:rows.filter(r=>r.footprint==="PRESENT_LIMITED").length})',context);
process.stdout.write(JSON.stringify({nodes,details:JSON.parse(details),jsNegativeChecks:variants.length}));});
'''
    result=subprocess.run(['node','-e',harness],input=json.dumps({'scripts':scripts,'payload':payload,'parent_payload':parent_payload}),text=True,capture_output=True,check=True)
    return json.loads(result.stdout)

def check_html():
    models=[]; rendered_packets={}; responsive_styles=[]
    for name in FILES:
        text=(HERE/name).read_text(); parser=Parser(); parser.feed(text)
        assert '<html lang="ar" dir="rtl">' in text
        assert not parser.resources, 'HTML must contain no external resources'
        assert len(parser.ids)==len(set(parser.ids)), 'Duplicate DOM IDs'
        assert not re.search(r'\b(fetch|XMLHttpRequest|importScripts)\s*\(',text), 'Network renderer'
        assert 'EXPECTED' in text and '268' in text and 'FINAL-PRODUCTION-READINESS-RECONCILIATION' in text
        responsive=re.search(r'<style id="audit-responsive-css">(.*?)</style>',text,re.S)
        assert responsive, 'Missing shared responsive candidate'
        css=responsive.group(1); responsive_styles.append(css)
        for token in ('min-width:0','overflow-wrap:anywhere','white-space:pre-wrap','flex-wrap:wrap','minmax(min(100%,260px),1fr)','overflow-x:auto','max-width:100%'):
            assert token in css, f'Missing responsive containment rule {token}'
        assert not re.search(r'(?:html|body)\s*\{[^}]*(?:overflow(?:-x)?\s*:\s*(?:hidden|clip))',text), 'Do not hide body overflow to claim a fix'
        table_containment=TableWrapperParser(); table_containment.feed(text)
        assert table_containment.tables>0
        assert '2026-10-05T07:39Z' in text and '533' in text and '658' in text
        assert 'artifact-browser-evidence' in parser.ids and 'NOT VERIFIED' in text
        browser_payload=next(s for s in parser.scripts if s['id']=='artifact-browser-data')
        assert json.loads(browser_payload['text'])==load()['parent_browser_evidence'], 'Browser evidence drift'
        assert load()['parent_browser_evidence']['after_css_patch_status']=='NOT VERIFIED'
        assert load()['parent_browser_evidence']['score_effect']==0
        payload=next(s for s in parser.scripts if s['id']=='audit-data')
        embedded=json.loads(payload['text'])
        parent_payload=next(s for s in parser.scripts if s['id']=='parent-evidence')
        parent_embedded=json.loads(parent_payload['text'])
        assert parent_embedded['sha']==SHA and parent_embedded['at']==load()['reconciliation_at']
        for identity, record in load()['parent_results'].items():
            embedded_record=parent_embedded['records'][identity]
            for field in ('command','outcome','raw_excerpt'): assert embedded_record[field]==record[field]
            assert embedded_record['digest']==load()['parent_envelope']['excerpt_sha256'][identity]
        assert embedded['groups']==GROUPS
        for group, count in GROUPS.items():
            expected=[title for ident,title in load()['items'] if ident.startswith('AUD-'+group+'-')]
            assert embedded['definitions'][group]==expected and len(expected)==count
        for script in parser.scripts:
            if script['type'] != 'application/json':
                # --check only parses JS: no browser, product module or DB execution.
                subprocess.run(['node','--check','--input-type=commonjs'],input=script['text'],text=True,check=True,capture_output=True)
        scripts=[s['text'] for s in parser.scripts if s['type']!='application/json']
        model=render_model(scripts,payload['text'],parent_payload['text']); models.append(model)
        assert model['details']['expected']==list(EXPECTED)
        for r, expected in zip(model['details']['rows'],normalize(load())):
            assert r['id']==expected['id'] and r['status']==expected['status'] and r['weight']==expected['weight']
            assert r['footprint']==expected['implementation_footprint'] and r['credit']==expected['credit']
            for field in ('automated','runtime','human'): assert r[field]==expected[field]
            assert r['level']==expected['evidence_level']
        nodes=model['nodes']
        expected_rows=normalize(load())
        assert sum(r['weight']*r['credit'] for r in model['details']['rows'])==sum(r['weight']*r['credit'] for r in expected_rows)
        assert sum(r['status']=='PASS' for r in model['details']['rows'])==sum(r['status']=='PASS' for r in expected_rows)
        if name==FILES[0]:
            assert nodes['score-cards']['innerHTML'].count('class="score"')==27
            assert nodes['item-list']['innerHTML'].count('<article ')==88
            assert nodes['page-rows']['innerHTML'].count('<tr>')==88
            assert nodes['workflow-rows']['innerHTML'].count('<tr>')==13
            assert nodes['role-rows']['innerHTML'].count('<tr>')==7
            assert nodes['blocker-list']['innerHTML'].count('<li>')==20
            for path in source_inventory()['pages']: assert path in nodes['page-rows']['innerHTML']
            for reference, literal in model['details']['textSamples']:
                path, lineno=reference.rsplit(':',1)
                assert literal in (ROOT/path).read_text().splitlines()[int(lineno)-1], 'Literal/source mismatch'
        else:
            assert nodes['prompt-list']['innerHTML'].count('<article ')==88
            assert nodes['batch-order']['innerHTML'].count('<li>')==12
            assert nodes['domain-rows']['innerHTML'].count('<tr>')==18
            for identity in EXPECTED:
                assert f'id="PROMPT-{identity}"' in nodes['prompt-list']['innerHTML']
                assert f'#{identity}' in nodes['prompt-list']['innerHTML']
            for identity in load()['future_remediation_plan_ids']:
                plan=nodes['prompt-list']['innerHTML'].split(f'id="PROMPT-{identity}"',1)[1].split('</article>',1)[0]
                assert 'IMPLEMENTATION_PROPOSAL' in plan and 'SEPARATE_CODING_AUTHORIZATION' in plan, f'Proposal classification missing for {identity}'
                assert 'خطة التطبيق المستقبلية' in plan and 'DB' in plan
        rendered=Parser(); rendered.feed(text+'\n'+'\n'.join(n.get('innerHTML','') for n in nodes.values()))
        assert len(rendered.ids)==len(set(rendered.ids))
        assert not rendered.resources
        rendered_packets[name]=rendered
    assert models[0]['details']['domainMembers']==models[1]['details']['domainMembers']
    assert responsive_styles[0]==responsive_styles[1], 'Standalone responsive CSS drift'
    assert '1.5 / 268 = 0.56%' in models[0]['nodes']['score-cards']['innerHTML']
    assert '1.5 / 198 = 0.76%' in models[0]['nodes']['score-cards']['innerHTML']
    assert '0 / 88 = 0.00%' in models[0]['nodes']['score-cards']['innerHTML']
    assert 'unit13/13PASS' in models[0]['nodes']['score-cards']['innerHTML']
    for name, rendered in rendered_packets.items():
        for href in rendered.links:
            if href.startswith('#'): assert href[1:] in rendered.ids, f'Broken anchor {href}'
            elif '#' in href:
                target, fragment=href.split('#',1)
                assert target in rendered_packets and fragment in rendered_packets[target].ids
            else:
                allowed_urls={r['url'] for r in load()['parent_results']['CI-EXACT-SHA']['runs']}
                assert href in FILES or href in allowed_urls, f'Unexpected link {href}'
    return 2

def selftest(data):
    tests=0
    validate(data); tests+=1
    for name, mutate in [
        ('malformed ID',lambda d: d['items'][0].__setitem__(0,'AUD-P0-999')),
        ('duplicate ID',lambda d: d['items'][1].__setitem__(0,'AUD-P0-001')),
        ('denominator',lambda d:d.__setitem__('denominator',269)),
        ('weight',lambda d:d['weights'].__setitem__('UX',1)),
        ('status',lambda d:d['overrides'].__setitem__('AUD-P0-001',{'status':'READY'})),
        ('source PASS',lambda d:d['overrides'].__setitem__('AUD-P0-001',{'status':'PASS','credit':1})),
        ('NOT APPLICABLE',lambda d:d['overrides'].__setitem__('AUD-P0-001',{'status':'NOT APPLICABLE'})),
        ('implementation-only partial',lambda d:d['overrides'].__setitem__('AUD-P0-001',{'status':'PARTIAL','credit':0.5,'implementation_footprint':'PRESENT_LIMITED'})),
    ]:
        bad=copy.deepcopy(data); mutate(bad)
        try: validate(bad)
        except (AssertionError,ValueError,KeyError): tests+=1
        else: raise AssertionError(f'Negative selftest accepted: {name}')
    for level in sorted(LEVELS):
        candidate=copy.deepcopy(data); candidate['overrides']['AUD-UX-033']={'evidence_level':level}
        validate(candidate); tests+=1
    hypothetical_pass={'status':'PASS','evidence_level':'E3','credit':1,'evidence':['parent:ARCHITECTURE'],
        'full_scope_validated':True,'required_evidence_levels':['E3'],'accepted_evidence_levels':['E3'],
        'required_evidence_flags':{'automated':True,'runtime':False,'human':False},
        'automated':'PASS','runtime':'NOT VERIFIED','human':'NOT VERIFIED','current_execution_binding':SHA}
    candidate=copy.deepcopy(data); candidate['overrides']['AUD-UX-033']=hypothetical_pass
    validate(candidate); tests+=1  # Validator fixture only, never persisted as item acceptance.
    candidate=copy.deepcopy(data); candidate['overrides']['AUD-UX-033']={'status':'NOT APPLICABLE','applicability_justification':'validator fixture only','approved_applicability_source':'fixture-applicability-source'}
    validate(candidate); tests+=1
    for name, override in [
        ('unsupported level',{'evidence_level':'E7'}),
        ('legacy N/A',{'status':'N/A'}),
        ('missing required PASS flag',{**hypothetical_pass,'automated':'NOT VERIFIED'}),
        ('E3 FAIL without failure',{'status':'FAIL','evidence_level':'E3','evidence':['parent:ARCHITECTURE'],'failing_execution_evidence':['parent:ARCHITECTURE']}),
        ('source-only subset',{'status':'PARTIAL','evidence_level':'E2','credit':0.5,'validated_subset':copy.deepcopy(data['overrides']['AUD-ENG-006']['validated_subset'])}),
        ('stale subset',{'status':'PARTIAL','evidence_level':'E3','credit':0.5,'validated_subset':{**data['overrides']['AUD-ENG-006']['validated_subset'],'sha':'stale'}}),
    ]:
        candidate=copy.deepcopy(data); candidate['overrides']['AUD-UX-033']=override
        try: validate(candidate)
        except (AssertionError,ValueError,KeyError): tests+=1
        else: raise AssertionError(f'Negative selftest accepted: {name}')
    return tests

def patch(data):
    rows=validate(data); inventory=source_inventory()
    inventory.pop('skill_file_sha256',None)  # Unrelated skill hashes need not bloat audit outputs.
    frozen={'rows':rows,'inventory':inventory,'parent_browser_evidence':data.get('parent_browser_evidence'),
            'future_remediation_plan_ids':data.get('future_remediation_plan_ids'),'captured_at':datetime.now(timezone.utc).isoformat()}
    print('*** Begin Patch')
    for name in FILES:
        text=(HERE/name).read_text()
        start='<!-- FROZEN-SOURCE-START -->'; end='<!-- FROZEN-SOURCE-END -->'
        old=text.split(start)[1].split(end)[0]
        new='\n<script type="application/json" id="frozen-source">'+json.dumps(frozen,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>\n'
        if old != new:
            print(f'*** Update File: {HERE.relative_to(ROOT).as_posix()}/{name}\n@@')
            print(' '+start)
            for line in old.strip('\n').splitlines(): print('-'+line)
            for line in new.strip('\n').splitlines(): print('+'+line)
            print(' '+end)
    print('*** End Patch')

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--check',action='store_true'); parser.add_argument('--selftest',action='store_true'); parser.add_argument('--patch',action='store_true'); parser.add_argument('--normalized-json',action='store_true'); parser.add_argument('--parent-envelope',action='store_true')
    args=parser.parse_args(); data=load(); rows=validate(data)
    if args.parent_envelope:
        print(json.dumps(parent_envelope(data),ensure_ascii=False,indent=2)); return
    if args.normalized_json:
        print(json.dumps({'schema_version':data['schema_version'],'sha':data['sha'],'source_scan_at':data['source_scan_at'],'denominator':268,'items':rows},ensure_ascii=False,indent=2)); return
    if args.patch: patch(data); return
    inventory=source_inventory(); html_count=check_html()
    envelope=parent_envelope(data)
    assert envelope['product_source_fingerprint']==data['parent_envelope']['product_source_fingerprint']
    assert envelope['excerpt_sha256']==data['parent_envelope']['excerpt_sha256']
    tests=selftest(data) if args.selftest else None
    counts={s:sum(r['status']==s for r in rows) for s in sorted(STATUSES)}
    print(json.dumps({'artifact_validation':'PASS','selftests':tests,'items':len(rows),'weight':268,
        'weighted_closure':sum(r['credit']*r['weight'] for r in rows),'weighted_percent':100*sum(r['credit']*r['weight'] for r in rows)/268,'fully_accepted_items':sum(r['status']=='PASS' for r in rows),'statuses':counts,
        'footprint_present_limited':sum(r['implementation_footprint']=='PRESENT_LIMITED' for r in rows),
        'pages':len(inventory['pages']),'htmls_parsed_and_js_syntax_checked':html_count,
        'registry_members_reconciled':len(inventory['registry']),
        'offline_DOM_model':{'scorecards':27,'report_items':88,'prompt_cards':88,'batches':12,'domains':18,'workflows':13,'roles':7,'top_blockers':20,'JS_negative_checks':20},
        'literal_source_samples_verified':7,'internal_links':'PASS',
        'skills_read_locally':inventory['skills_discovered_and_read_locally'],
        'parent_product_tests':'13/13 PASS; four files; pure Vitest; not canonical envelope','updater_product_tests':'NOT RUN',
        'automated_full_item_coverage':sum(r['automated']=='PASS' for r in rows),
        'executed_subchecks':{'unit_cases_passed':13,'unit_cases_total':13,'source_guards_passed':2,'source_guards_total':2,'probes_executed':2,'probes_behavior_FAIL':2,'CI_failed_runs':2},
        'DB_writes':0,'parent_browser_baseline':data['parent_browser_evidence'],
        'responsive_css_candidate':'STATIC CONTAINMENT CHECKS PASS; viewport fix NOT VERIFIED pending real parent rerun',
        'current_HTML_candidate_sha256':{name:hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in FILES},
        'candidate_hash_limit':'These hashes identify patched local HTML bytes for parent rerun; not hashes of the failing 07:39 baseline.',
        'remediation_proposals':len(data['future_remediation_plan_ids']),
        'browser_proof':'Parent real baseline: desktop PASS/mobile FAIL; patched HTMLs NOT VERIFIED'},ensure_ascii=False,indent=2))

if __name__=='__main__': main()
