"""Fail-closed checks for audit rows and explicit execution-prompt coverage."""
from collections import Counter

WEIGHTS = {'P0': 5, 'P1': 3, 'P2': 1}
VALUES = {'PASS': 1, 'PARTIAL': .5, 'FAIL': 0, 'BLOCKED': 0, 'NOT VERIFIED': 0}
LEVELS = {f'E{i}' for i in range(7)}


def validate_rows(rows):
    errors = []
    ids = [row.get('id') for row in rows]
    errors += [f'duplicate audit ID: {key}' for key, count in Counter(ids).items() if count > 1]
    for row in rows:
        ident = row.get('id', '<missing>')
        if not ident or ident == '<missing>':
            errors.append('missing audit ID')
        if row.get('priority') not in WEIGHTS:
            errors.append(f'{ident}: missing/invalid priority')
        status = row.get('status')
        if status not in VALUES and status != 'NOT APPLICABLE':
            errors.append(f'{ident}: invalid status')
        if row.get('level') not in LEVELS:
            errors.append(f'{ident}: invalid evidence level')
        if status == 'NOT APPLICABLE' and not row.get('na_justification'):
            errors.append(f'{ident}: N/A without documented justification')
        if status == 'PASS' and (not row.get('evidence_ref') or row.get('level') in ('E0', 'E1', 'E2')):
            errors.append(f'{ident}: PASS without current verified evidence reference')
        if status == 'PASS' and row.get('freshness') != 'CURRENT':
            errors.append(f'{ident}: PASS without CURRENT evidence')
    return errors


def calculate(rows):
    errors = validate_rows(rows)
    if errors:
        raise ValueError('PERCENTAGE_INTEGRITY_ERROR: ' + '; '.join(errors))
    applicable = [r for r in rows if r['status'] != 'NOT APPLICABLE']
    denominator = sum(WEIGHTS[r['priority']] for r in applicable)
    if not denominator:
        raise ValueError('PERCENTAGE_INTEGRITY_ERROR: zero denominator')
    numerator = sum(WEIGHTS[r['priority']] * VALUES[r['status']] for r in applicable)
    return numerator, denominator, round(numerator / denominator * 100, 2)


def prompt_coverage(rows, prompts):
    ids = {r['id'] for r in rows}
    references = [ident for prompt in prompts for ident in prompt['audit_ids']]
    prompt_ids = [p['id'] for p in prompts]
    duplicates = sorted(k for k, n in Counter(prompt_ids).items() if n > 1)
    unknown = sorted(set(references) - ids)
    return {'explicit': len(set(references) & ids), 'total': len(ids),
            'unlinked': sorted(ids - set(references)), 'unknown': unknown,
            'duplicate_prompt_ids': duplicates}
