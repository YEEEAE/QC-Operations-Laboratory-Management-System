"""Read the controlled XLSX locally. Never writes to a database or changes a baseline."""
import argparse
import hashlib
import json
import uuid
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def extract(path):
    with zipfile.ZipFile(path) as book:
        workbook = ET.fromstring(book.read('xl/workbook.xml'))
        sheets = workbook.findall('s:sheets/s:sheet', NS)
        if len(sheets) != 1 or sheets[0].get('name') != 'Rev 14':
            raise ValueError('SOURCE_LIST_REVISION_CONFLICT')
        shared = ET.fromstring(book.read('xl/sharedStrings.xml'))
        strings = [''.join(si.itertext()) for si in shared]
        sheet = ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
        entries, excluded = [], []
        for row in sheet.findall('s:sheetData/s:row', NS):
            row_no = int(row.get('r'))
            if row_no < 7:
                continue
            values = {}
            for cell in row.findall('s:c', NS):
                value = cell.find('s:v', NS)
                if value is not None:
                    values[cell.get('r').rstrip('0123456789')] = strings[int(value.text)] if cell.get('t') == 's' else value.text
            code, title, rev = values.get('C'), values.get('D'), values.get('E')
            if not code:
                continue
            if not title or not title.strip():
                excluded.append({'docCode': code, 'sourceRowNo': row_no, 'reason': 'BLANK_MASTER_TITLE'})
                continue
            if not rev or not rev.isdigit():
                raise ValueError(f'UNREADABLE_MASTER_REVISION: row {row_no}')
            entries.append({'id': str(uuid.uuid5(uuid.NAMESPACE_URL, 'qc:inspection:rev14:' + code)), 'docCode': code, 'officialTitle': title, 'masterRevision': rev, 'sourceListRevision': 14, 'sourceRowNo': row_no, 'sourceOrder': int(values['B']) if values.get('B') else None, 'sourceDate': values.get('G')})
        if len({e['docCode'].strip().upper() for e in entries}) != len(entries):
            raise ValueError('DUPLICATE_MASTER_IDENTITY')
        return {'sourceFile': str(path), 'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'sheet': 'Rev 14', 'entries': entries, 'excluded': excluded}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('workbook', type=Path)
    parser.add_argument('--check', type=Path, required=True)
    args = parser.parse_args()
    actual = extract(args.workbook)
    expected = json.loads(args.check.read_text())
    if actual['sourceSha256'] != expected['sourceSha256'] or actual['entries'] != expected['entries'] or actual['excluded'] != expected['excluded']:
        raise SystemExit('CONTROLLED_CORRECTION_REQUIRED: source changed; baseline was not overwritten')
    print(json.dumps({'status': 'PASS', 'validEntries': len(actual['entries']), 'excluded': actual['excluded'], 'sourceSha256': actual['sourceSha256']}))
