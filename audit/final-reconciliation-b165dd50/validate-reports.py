"""Read-only structural cross-report check for this immutable audit run."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys

out = Path(__file__).resolve().parent
summary = json.loads((out/'reconciliation-summary.json').read_text())
files = sorted(out.glob('*.html'))
assert len(files) == summary['reports'] == 9

class Inspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=set(); self.href=[]; self.duplicate=[]; self.lang=False; self.rtl=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='html': self.lang=a.get('lang')=='ar'; self.rtl=a.get('dir')=='rtl'
        if 'id' in a:
            if a['id'] in self.ids: self.duplicate.append(a['id'])
            self.ids.add(a['id'])
        if tag=='a' and 'href' in a: self.href.append(a['href'])

issues=[]
for file in files:
    text=file.read_text(encoding='utf-8')
    p=Inspector(); p.feed(text)
    if not p.lang or not p.rtl or p.duplicate: issues.append((file.name,'language/direction/duplicate ID',p.duplicate))
    for expected in (summary['sha'],summary['migration'],'NO-GO',summary['run']):
        if expected not in text: issues.append((file.name,'missing common identity',expected))
    for href in p.href:
        if href.startswith(('http:','https:','mailto:')): issues.append((file.name,'external link',href))
        target,_,fragment=href.partition('#')
        dest=(file.parent/target).resolve() if target else file
        if not dest.exists(): issues.append((file.name,'broken link',href))
        elif fragment and dest.suffix=='.html':
            q=Inspector(); q.feed(dest.read_text(encoding='utf-8'))
            if fragment not in q.ids: issues.append((file.name,'broken anchor',href))

master=(out/'QC-100-PERCENT-MASTER-EXECUTION-PROMPT-PACK.html').read_text()
ids=re.findall(r'<details id="(QC-[^\"]+)" data-filter>',master)
if len(ids)!=summary['prompts'] or len(ids)!=len(set(ids)): issues.append(('master','prompt count/unique IDs',ids))
for text in ('QC-TRF26-01','QC-INSP26-03','QC-LAB26-02','QC-RCV26-01','QC-REL26-01'):
    if text not in master: issues.append(('master','missing critical prompt',text))
matrix=(out/'QC-REQUIREMENT-EVIDENCE-TRACEABILITY-MATRIX.html').read_text()
for text in ('REQ-AUTHZ-001','REQ-SCOPE-','OP-TRF','G-020','G-RECON-020'):
    if text not in matrix: issues.append(('matrix','missing critical trace',text))
for file in files:
    if '100% System Verification' in file.read_text(): issues.append((file.name,'misleading claim','100% System Verification'))
print(json.dumps({'reports':len(files),'prompts':len(ids),'sha':summary['sha'],'checks':'PASS' if not issues else 'FAIL','issues':issues},ensure_ascii=False))
sys.exit(bool(issues))
