from pathlib import Path
import re, struct, sys, base64
import trimesh
root = Path(__file__).resolve().parents[1]
html = root/'qc-login-3d-background.html'
glb = root/'assets/qc-medical-hero.glb'
src = root/'source/generate_qc_medical_hero.py'
readme = root/'README.md'
errors=[]
for p in [html,glb,src,readme]:
    if not p.exists(): errors.append(f'missing: {p.relative_to(root)}')
if html.exists():
    s=html.read_text(errors='ignore')
    checks={
      'embedded GLB parsed with GLTFLoader.parse': 'GLB_BASE64' in s and 'loader.parse(' in s and len(s)>1_000_000,
      'pinned Three.js r128': 'three@0.128.0/build/three.min.js' in s,
      'pinned GLTFLoader r128': 'three@0.128.0/examples/js/loaders/GLTFLoader.js' in s,
      'reduced motion': 'prefers-reduced-motion' in s and 'onReduced' in s,
      'decorative aria hidden': 'aria-hidden="true"' in s,
      'pointer events none': 'pointer-events:none' in s.replace(' ',''),
      'visibility handling': 'visibilitychange' in s,
      'context loss handling': 'webglcontextlost' in s and 'webglcontextrestored' in s,
      'cleanup': 'function destroy()' in s and 'cancelAnimationFrame' in s and '.dispose()' in s,
      'responsive mobile direction': '@media (max-width: 700px)' in s and 'portrait' in s,
      'no form controls': not re.search(r'<\s*(form|input|button|nav|textarea|select)\b',s,re.I),
      'no visible login UI wording': not re.search(r'>\s*(login|sign in|username|password)\s*<',s,re.I),
      'scan duration': 'scanSeconds: 13.5' in s,
      'PBR materials': 'MeshPhysicalMaterial' in s and 'transmission' in s,
      'tone mapping': 'ACESFilmicToneMapping' in s,
      'restart API': 'QCBackground={destroy,restart}' in s,
    }
    for k,v in checks.items():
        if not v: errors.append('html check failed: '+k)

    match=re.search(r"const GLB_BASE64 = '([A-Za-z0-9+/=]+)';", s)
    if not match:
        errors.append('embedded GLB base64 not found')
    elif glb.exists():
        try:
            embedded=base64.b64decode(match.group(1), validate=True)
            if embedded != glb.read_bytes(): errors.append('embedded GLB does not match separate GLB asset')
        except Exception as e: errors.append('embedded GLB decode failed: '+repr(e))
if glb.exists():
    data=glb.read_bytes()
    if len(data)<20: errors.append('GLB too small')
    else:
      magic,ver,total=struct.unpack_from('<4sII',data,0)
      if magic!=b'glTF': errors.append('invalid GLB magic')
      if ver!=2: errors.append(f'GLB version {ver}, expected 2')
      if total!=len(data): errors.append(f'GLB length header {total} != actual {len(data)}')
      if len(data)>5*1024*1024: errors.append('GLB exceeds 5 MiB')
    try:
      sc=trimesh.load(glb,force='scene')
      nodes=set(sc.graph.nodes)
      required={'HeroRoot','OuterHousing','Membrane','RetainingRing','Seal','ConnectorInBody','ConnectorOutBody'}
      missing=sorted(required-nodes)
      if missing: errors.append('missing GLB nodes: '+', '.join(missing))
      tris=sum(len(g.faces) for g in sc.geometry.values())
      if not (40_000 <= tris <= 120_000): errors.append(f'triangle budget unexpected: {tris}')
      if len(sc.geometry)<10: errors.append(f'not enough meaningful submeshes: {len(sc.geometry)}')
    except Exception as e: errors.append('GLB parse failed: '+repr(e))
if errors:
    print('VERIFY FAIL')
    for e in errors: print('-',e)
    sys.exit(1)
print('VERIFY PASS')
print(f'html={html.stat().st_size/1024:.1f} KiB glb={glb.stat().st_size/1024:.1f} KiB')
