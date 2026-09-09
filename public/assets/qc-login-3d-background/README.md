# QC Login 3D Background

Visual concept: **The Integrity Core — Membrane Inspection Module**.

## Files
- `qc-login-3d-background.html` — standalone decorative background preview. The GLB is embedded in the HTML and also delivered separately.
- `assets/qc-medical-hero.glb` — real mesh-based hero asset.
- `source/generate_qc_medical_hero.py` — editable procedural source used to create the GLB.

## Run
Double-click `qc-login-3d-background.html` while online. The model itself is embedded, but Three.js r128 and GLTFLoader r128 are loaded from pinned jsDelivr URLs.

For a local HTTP preview:
```bash
python3 -m http.server 8080
```
then open `http://localhost:8080/qc-login-3d-background.html`.

## Offline note
The execution environment could not download and package the Three.js runtime because outbound DNS was unavailable. Therefore this package is **not fully offline**. If you vendor the exact r128 files at integration time, replace the two pinned CDN script URLs with local paths.

No backend, API key, forms, login controls, or application UI are included.
