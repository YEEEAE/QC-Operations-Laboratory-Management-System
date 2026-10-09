#!/usr/bin/env python3
"""Submit SOP-FRS-014 Stitch proposal screens and save raw responses.

Visual-direction proposals only. Prompts constrain the model to the approved
application vocabulary/state words; the SOP must still mark all output as an
unimplemented visual proposal.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROJECT = "2994222140523388486"
OUT = ROOT / "Documents/QC_System_WI_SOP_Pack/SOPs/review-drafts/SOP-FRS-014-attachments/stitch"
HELPER = ROOT / "scripts/sop/stitch_call.py"

BASE = (
    "Professional QC laboratory operations web application, desktop, calm restrained enterprise "
    "interface, light neutral background, high whitespace, accessible contrast, no charts, no gradients "
    "that hurt readability. Use only these literal state words if states are shown: PASS, FAIL, HOLD, "
    "RELEASED, NOT_RELEASED, DRAFT, ACTIVE, OVERDUE. Do not invent protocols, certificate numbers, "
    "compliance badges, regulator names, or human names. "
)

SCREENS = [
    (
        "01-register-page",
        BASE
        + "Design a register/listing page. Header: small uppercase kicker 'Operations', H1 'Receiving items', "
        "a one-line purpose 'Inspection result and release state are shown separately.', and a primary button "
        "top-right 'Create receiving item'. Below the header, a filter bar with a search input, two primary "
        "selects (Workflow state, Inspection result) and a 'More filters' disclosure. Then a results table with "
        "a visible caption and eight columns: Item code, Lot, Supplier, Received, Workflow state, Inspection "
        "result, Release state, Next action. Show a genuine EMPTY state (distinct from filtered-empty) with a "
        "short message and the create action. Add a small persistent note: 'PASS and RELEASED are separate'.",
    ),
    (
        "02-record-header",
        BASE
        + "Design a record detail page header block for a single controlled record. Show: breadcrumb, record "
        "reference as H1, a facts grid (Item code, Lot, Supplier, Received, Inspection result, Release state), "
        "one clear primary next action button, a secondary 'History' disclosure, and one prominent blocker card "
        "that states the decision reference and owner when an action is not available. Keep scientific result "
        "and release system state as two separate facts. Use only the approved state words.",
    ),
]


def call(method: str, params: dict) -> str:
    proc = subprocess.run(
        [sys.executable, str(HELPER), method, json.dumps(params)],
        capture_output=True,
        text=True,
        timeout=1800,
    )
    return proc.stdout.strip() or proc.stderr.strip()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, prompt in SCREENS:
        params = {
            "name": "generate_screen_from_text",
            "arguments": {"projectId": PROJECT, "prompt": prompt, "deviceType": "DESKTOP"},
        }
        try:
            result = call("tools/call", params)
        except Exception as exc:  # noqa: BLE001
            result = json.dumps({"error": str(exc)})
        (OUT / f"{name}.json").write_text(result, encoding="utf-8")
        print("done", name, len(result))


if __name__ == "__main__":
    main()
