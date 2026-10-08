# Laboratory technical policy — QC360 residual implementation

Date: 2026-10-08. Version: 1. Status: user-authorized technical source authorship; scientific approval/effectivity NOT ESTABLISHED.

Scope: REQ-LAB-007 and REQ-LAB-020. This document authorizes the software contract only. It supplies no method thresholds, conversion factors, sample acceptance policy, QC signatures or effective laboratory method. Those inputs must enter the existing approved controlled-template process with its existing authority checks.

## Traceable conversion contract

An approved parameter acceptance payload may contain `conversionRules`. Each rule declares `ruleType: EXACT_AFFINE`, exact `fromUnit`, `toUnit`, decimal-string `factor`, decimal-string `offset`, `sourceReference` matching the parameter source, and nonempty `version`. Arithmetic is `input * factor + offset`, computed with scaled integers without rounding. No conversion exists by default. Missing, ambiguous, malformed or foreign-source rules deny alternate units. The saved observation retains the original input and unit; calculated value/unit, rule reference/version and calculation inputs retain the conversion trace. Existing Action save transport supports this; native bulk entry requires the displayed unit and does not offer alternate-unit conversion.

## Official evaluation contract

Every approved parameter payload must declare the same `evaluationPolicy`. The supported explicit policy declares `ruleType: ALL_PARAMETERS_ALL_SAMPLES`, `onAnyFail: FAIL`, `onIncomplete: HOLD`, `onAllPass: PASS`, plus `sourceReference` and `version` matching the frozen controlled context. This is a supported vocabulary, not an assigned method policy. Absent or unsupported declarations deny official evaluation. Every parameter for every recorded sample is evaluated from its controlled acceptance payload; missing/indeterminate observations use the declared incomplete branch. Calculated observations require the controlled target unit. The PostgreSQL provider re-resolves approved definitions and compares the frozen context before evaluation; changed or withdrawn source denies.

Existing approval, signatures, separation of duties and effectivity remain authoritative. Synthetic tests demonstrate technical behavior only. Scientific source approval, real populated PostgreSQL/runtime acceptance and human UAT are not established by this document.
