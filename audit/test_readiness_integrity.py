import unittest
from readiness_integrity import calculate, prompt_coverage
from requirement_links import LINKS


class IntegrityTests(unittest.TestCase):
    def setUp(self):
        self.row = dict(id='AUD-P0-001', priority='P0', status='BLOCKED', level='E2', evidence='source')

    def test_denominator_keeps_blocked(self):
        self.assertEqual(calculate([self.row]), (0, 5, 0))

    def test_partial_is_half(self):
        self.assertEqual(calculate([{**self.row, 'status': 'PARTIAL'}]), (2.5, 5, 50))

    def test_duplicate_id_rejected(self):
        with self.assertRaisesRegex(ValueError, 'duplicate audit ID'):
            calculate([self.row, self.row])

    def test_invalid_priority_rejected(self):
        with self.assertRaisesRegex(ValueError, 'invalid priority'):
            calculate([{**self.row, 'priority': 'P3'}])

    def test_na_requires_reason(self):
        with self.assertRaisesRegex(ValueError, 'N/A without'):
            calculate([{**self.row, 'status': 'NOT APPLICABLE'}])

    def test_pass_requires_current_reference(self):
        with self.assertRaisesRegex(ValueError, 'PASS without'):
            calculate([{**self.row, 'status': 'PASS', 'level': 'E3'}])
        self.assertEqual(calculate([{**self.row, 'status': 'PASS', 'level': 'E3', 'evidence_ref': 'run-1', 'freshness': 'CURRENT'}]), (5, 5, 100))

    def test_coverage_is_not_acceptance(self):
        outcome = prompt_coverage([self.row], [dict(id='FIX-01', audit_ids=['AUD-P0-002'])])
        self.assertEqual(outcome['unlinked'], ['AUD-P0-001'])
        self.assertEqual(outcome['unknown'], ['AUD-P0-002'])

    def test_candidate_links_are_unique_and_nonempty(self):
        self.assertEqual(len(LINKS), len(set(LINKS)))
        self.assertTrue(all(refs and all(ref.startswith('REQ-') for ref in refs) for refs in LINKS.values()))


if __name__ == '__main__':
    unittest.main()
