from pathlib import Path
import base64
root=Path('/mnt/data/qc-login-3d-background')
glb=(root/'assets/qc-medical-hero.glb').read_bytes()
b64=base64.b64encode(glb).decode('ascii')
html=r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>QC 3D Background</title>
<style>
  :root { color-scheme: dark; }
  html, body { width:100%; height:100%; margin:0; overflow:hidden; background:#03090e; }
  body { min-height:100dvh; }
  #qc-bg {
    position:fixed; inset:0; width:100vw; height:100dvh; overflow:hidden;
    pointer-events:none; isolation:isolate;
    background:
      radial-gradient(58% 68% at 31% 49%, rgba(46,93,101,.22) 0%, rgba(12,31,39,.14) 34%, rgba(4,14,20,0) 69%),
      radial-gradient(42% 58% at 18% 67%, rgba(54,79,88,.12), rgba(2,8,12,0) 68%),
      linear-gradient(106deg, #071218 0%, #061017 31%, #040c12 61%, #02070b 100%);
  }
  #qc-bg::before {
    content:""; position:absolute; inset:-6%; z-index:-2;
    background:
      radial-gradient(36% 43% at 29% 45%, rgba(112,179,182,.08), transparent 70%),
      linear-gradient(90deg, rgba(255,255,255,.015), transparent 24%, transparent 100%);
    filter: blur(18px);
  }
  #qc-bg::after {
    content:""; position:absolute; inset:0; z-index:5;
    background:
      radial-gradient(ellipse at 34% 51%, transparent 22%, rgba(2,8,12,.08) 51%, rgba(2,7,10,.40) 100%),
      linear-gradient(90deg, transparent 0 52%, rgba(2,7,10,.08) 65%, rgba(2,7,10,.33) 100%);
    pointer-events:none;
  }
  #qc-bg canvas { position:absolute; inset:0; width:100%; height:100%; display:block; opacity:1; transition:opacity .35s ease; }
  #qc-bg.fallback-only canvas { opacity:0; }
  @media (max-width: 700px) and (orientation: portrait) {
    #qc-bg {
      background:
        radial-gradient(70% 40% at 50% 24%, rgba(47,96,102,.19), rgba(5,17,23,.06) 50%, transparent 78%),
        linear-gradient(180deg, #07131a 0%, #050f15 42%, #02080d 100%);
    }
    #qc-bg::after {
      background:linear-gradient(180deg, transparent 0 36%, rgba(2,8,12,.15) 54%, rgba(2,7,10,.62) 100%);
    }
  }
  @media (prefers-reduced-motion: reduce) { #qc-bg canvas { transition:none; } }
</style>
</head>
<body>
<div id="qc-bg" aria-hidden="true"></div>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js" crossorigin="anonymous"></script>
<script>
(() => {
  'use strict';
  const root = document.getElementById('qc-bg');
  const CONFIG = Object.freeze({
    bg: 0x03090e,
    teal: 0x78bfc2,
    steel: 0x8ca2a8,
    offWhite: 0xdce5e5,
    dprDesktop: 1.65,
    dprMobile: 1.15,
    scanSeconds: 13.5,
    heroDesktopX: -1.68,
    heroDesktopY: -0.05,
    baseScale: 1.0
  });
  const GLB_BASE64 = '__GLB_BASE64__';

  let scene, camera, renderer, heroPivot, heroModel, inspectionGroup, scanStrip, scanLight, analysisTrace;
  let envTexture = null, envTarget = null, raf = 0, destroyed = false, initialized = false, hidden = document.hidden, contextLost = false;
  let startTime = performance.now(), lastFrame = startTime;
  let pointer = {x:0,y:0, tx:0,ty:0};
  let reducedMotionQuery = null, reducedMotion = false;
  const listeners = [];

  function on(target, type, fn, options) { target.addEventListener(type, fn, options); listeners.push(() => target.removeEventListener(type, fn, options)); }
  function setFallback(onOff) { root.classList.toggle('fallback-only', !!onOff); }

  function buildEnvironment() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0,0,c.width,0);
    grad.addColorStop(0,'#02070b'); grad.addColorStop(.19,'#162a31'); grad.addColorStop(.36,'#d1d9d8');
    grad.addColorStop(.43,'#1d343b'); grad.addColorStop(.67,'#071116'); grad.addColorStop(.84,'#7baeb0'); grad.addColorStop(1,'#02070b');
    g.fillStyle=grad; g.fillRect(0,0,c.width,c.height);
    const vg=g.createRadialGradient(360,205,12,360,205,215); vg.addColorStop(0,'rgba(255,255,255,.65)'); vg.addColorStop(.38,'rgba(145,196,198,.12)'); vg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=vg; g.fillRect(0,0,c.width,c.height);
    const tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping; tex.encoding = THREE.sRGBEncoding;
    const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
    envTarget = pmrem.fromEquirectangular(tex); tex.dispose(); pmrem.dispose();
    envTexture = envTarget.texture; scene.environment = envTexture;
  }

  function materialSet() {
    const housing = new THREE.MeshPhysicalMaterial({
      color:0xa8c6c8, roughness:.28, metalness:0, transparent:true, opacity:.28, depthWrite:false,
      transmission:.56, thickness:.24, ior:1.44, clearcoat:.22, clearcoatRoughness:.38, envMapIntensity:1.15
    });
    const housingRim = housing.clone(); housingRim.opacity=.46; housingRim.roughness=.24; housingRim.transmission=.32; housingRim.depthWrite=true;
    const insert = new THREE.MeshPhysicalMaterial({ color:CONFIG.offWhite, roughness:.47, metalness:.02, clearcoat:.08, envMapIntensity:.74 });
    const membrane = new THREE.MeshPhysicalMaterial({ color:0xd4dede, roughness:.76, metalness:0, side:THREE.DoubleSide, envMapIntensity:.42 });
    const steel = new THREE.MeshStandardMaterial({ color:0x87989d, roughness:.31, metalness:.83, envMapIntensity:1.28 });
    const seal = new THREE.MeshStandardMaterial({ color:0x315b5c, roughness:.72, metalness:0, envMapIntensity:.45 });
    const connector = new THREE.MeshPhysicalMaterial({ color:0xc6d2d2, roughness:.38, metalness:.02, clearcoat:.12, envMapIntensity:.76 });
    const darkMetal = new THREE.MeshStandardMaterial({ color:0x324149, roughness:.36, metalness:.72, envMapIntensity:1.0 });
    return {housing,housingRim,insert,membrane,steel,seal,connector,darkMetal};
  }

  function refineMaterials(model) {
    const m = materialSet();
    model.traverse(o => {
      if (!o.isMesh) return;
      const n=o.name;
      if (n === 'OuterHousing') o.material=m.housing;
      else if (n.indexOf('OuterHousing')===0) o.material=m.housingRim;
      else if (n.indexOf('StructuralInsert')===0) o.material=m.insert;
      else if (n === 'Membrane') o.material=m.membrane;
      else if (n === 'RetainingRing') o.material=m.steel;
      else if (n === 'Seal') o.material=m.seal;
      else if (n.indexOf('Connector')===0) o.material=m.connector;
      else if (n === 'AlignmentKey') o.material=m.darkMetal;
      o.castShadow=false; o.receiveShadow=false;
      if (o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    });
  }

  function lineMaterial(opacity=.24) { return new THREE.LineBasicMaterial({color:CONFIG.teal, transparent:true, opacity, depthWrite:false}); }
  function arc(radius,a0,a1,z,opacity=.24) {
    const pts=[]; const seg=96;
    for(let i=0;i<=seg;i++){ const a=a0+(a1-a0)*(i/seg); pts.push(new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,z)); }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMaterial(opacity));
  }
  function guideLine(a,b,opacity=.18) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]), lineMaterial(opacity)); }

  function makeScanStrip() {
    const geo=new THREE.PlaneGeometry(.38,3.25,1,1);
    const mat=new THREE.ShaderMaterial({
      uniforms:{uColor:{value:new THREE.Color(CONFIG.teal)},uOpacity:{value:.23}}, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec2 vUv; uniform vec3 uColor; uniform float uOpacity; void main(){float x=1.0-smoothstep(0.0,.5,abs(vUv.x-.5)*2.0); float y=smoothstep(0.0,.16,vUv.y)*smoothstep(0.0,.16,1.0-vUv.y); float a=x*x*y*uOpacity; gl_FragColor=vec4(uColor,a);}'
    });
    const mesh=new THREE.Mesh(geo,mat); mesh.position.z=.54; mesh.renderOrder=3; return mesh;
  }

  function buildInspection() {
    inspectionGroup=new THREE.Group(); inspectionGroup.name='InspectionOverlay';
    inspectionGroup.add(arc(1.74,-.12,1.66,.46,.20));
    inspectionGroup.add(arc(1.62,3.42,5.38,.47,.14));
    inspectionGroup.add(guideLine(new THREE.Vector3(-2.18,-.34,.44),new THREE.Vector3(-1.54,-.34,.44),.16));
    inspectionGroup.add(guideLine(new THREE.Vector3(-2.18,-.34,.44),new THREE.Vector3(-2.18,.14,.44),.10));
    inspectionGroup.add(guideLine(new THREE.Vector3(1.48,.74,.44),new THREE.Vector3(2.02,.74,.44),.13));
    const anchorMat=new THREE.MeshBasicMaterial({color:CONFIG.teal,transparent:true,opacity:.38,depthWrite:false});
    const anchorGeo=new THREE.SphereGeometry(.027,12,8);
    [[-1.2,.76,.48],[.98,1.0,.48],[1.2,-.7,.48],[-.86,-1.1,.48]].forEach((p,i)=>{ const s=new THREE.Mesh(anchorGeo,anchorMat.clone()); s.position.set(...p); s.userData.phase=i*.9; inspectionGroup.add(s); });
    scanStrip=makeScanStrip(); scanStrip.position.x=-1.45; inspectionGroup.add(scanStrip);
    heroPivot.add(inspectionGroup);
  }

  function buildBackgroundTrace() {
    const group=new THREE.Group(); group.position.set(-1.45,-1.45,-1.35); analysisTrace=group;
    const pts=[]; const vals=[.06,.12,.09,.16,.11,.14,.20,.15,.18,.17,.23,.19];
    for(let i=0;i<vals.length;i++) pts.push(new THREE.Vector3(-1.65+i*.29, vals[i], 0));
    const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMaterial(.075)); group.add(l);
    [-.03,.28].forEach(y=>group.add(guideLine(new THREE.Vector3(-1.7,y,0),new THREE.Vector3(1.7,y,0),.035)));
    scene.add(group);
  }

  function setupLights() {
    scene.add(new THREE.HemisphereLight(0xb8d0d1,0x081016,.34));
    const key=new THREE.DirectionalLight(0xe8eeee,2.1); key.position.set(-4.2,4.5,5.6); scene.add(key);
    const fill=new THREE.PointLight(0x91b8bc,.72,8,2); fill.position.set(-2.4,-2.0,3.4); scene.add(fill);
    const rim=new THREE.SpotLight(0x5aa9ad,1.55,10,.55,.58,1.5); rim.position.set(2.6,2.0,4.2); rim.target.position.set(-.8,0,0); scene.add(rim,rim.target);
    scanLight=new THREE.PointLight(CONFIG.teal,.58,3.2,2.0); scanLight.position.set(-2.0,0.6,2.2); scene.add(scanLight);
  }

  function decodeGLB() {
    const bin=atob(GLB_BASE64), len=bin.length, bytes=new Uint8Array(len);
    for(let i=0;i<len;i++) bytes[i]=bin.charCodeAt(i);
    return bytes.buffer;
  }

  function loadHero() {
    return new Promise((resolve,reject)=>{
      const loader=new THREE.GLTFLoader();
      loader.parse(decodeGLB(),'',gltf=>{
        heroModel=gltf.scene; heroModel.name='QCMedicalHero'; refineMaterials(heroModel);
        heroPivot=new THREE.Group(); heroPivot.name='HeroPivot'; heroPivot.add(heroModel);
        heroPivot.rotation.set(-.12,.42,-.09); scene.add(heroPivot); buildInspection(); applyResponsive(); resolve();
      },reject);
    });
  }

  function applyResponsive() {
    if(!heroPivot || !camera) return;
    const w=innerWidth,h=innerHeight, portrait=w<700 && h>w;
    const tablet=!portrait && w<1100;
    if(portrait){
      heroPivot.position.set(0,1.45,0); heroPivot.scale.setScalar(.58);
      inspectionGroup.visible=false; if(analysisTrace) analysisTrace.visible=false; camera.fov=38; camera.position.set(0,.30,8.6); camera.lookAt(0,.72,0);
      renderer && renderer.setPixelRatio(Math.min(devicePixelRatio||1,CONFIG.dprMobile));
    } else if(tablet){
      heroPivot.position.set(-.95,.06,0); heroPivot.scale.setScalar(.80); inspectionGroup.visible=true; if(analysisTrace) analysisTrace.visible=true;
      camera.fov=34; camera.position.set(0,.15,7.5); camera.lookAt(-.25,0,0);
      renderer && renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));
    } else {
      heroPivot.position.set(CONFIG.heroDesktopX,CONFIG.heroDesktopY,0); heroPivot.scale.setScalar(CONFIG.baseScale); inspectionGroup.visible=true; if(analysisTrace) analysisTrace.visible=true;
      camera.fov=32; camera.position.set(0,.15,7.45); camera.lookAt(-.56,0,0);
      renderer && renderer.setPixelRatio(Math.min(devicePixelRatio||1,CONFIG.dprDesktop));
    }
    camera.aspect=w/h; camera.updateProjectionMatrix();
    renderer && renderer.setSize(w,h,false);
  }

  function scanProgress(t) {
    const cycle=CONFIG.scanSeconds+3.8, p=(t%cycle)/cycle;
    if(p<.10) return 0;
    if(p>.84) return 1;
    let q=(p-.10)/.74; return q*q*(3-2*q);
  }

  function updateMotion(now) {
    const t=(now-startTime)/1000, dt=Math.min((now-lastFrame)/1000,.05); lastFrame=now;
    pointer.x += (pointer.tx-pointer.x)*(1-Math.exp(-5*dt)); pointer.y += (pointer.ty-pointer.y)*(1-Math.exp(-5*dt));
    if(heroPivot){
      const portrait=innerWidth<700 && innerHeight>innerWidth;
      const baseX=portrait?0:(innerWidth<1100?-.95:CONFIG.heroDesktopX), baseY=portrait?1.45:(innerWidth<1100?.06:CONFIG.heroDesktopY);
      heroPivot.position.x=baseX + pointer.x*.055;
      heroPivot.position.y=baseY + Math.sin(t*.34)*.016 + pointer.y*.035;
      heroPivot.rotation.x=-.12 + Math.sin(t*.22)*.012 - pointer.y*.008;
      heroPivot.rotation.y=.42 + Math.sin(t*.18)*.018 + pointer.x*.012;
      heroPivot.rotation.z=-.09 + Math.sin(t*.27)*.008;
      if(inspectionGroup && inspectionGroup.visible){
        const p=scanProgress(t), x=-1.56 + p*3.12; scanStrip.position.x=x;
        scanStrip.material.uniforms.uOpacity.value=(p===0||p===1)?.08:.22;
        scanLight.position.x=heroPivot.position.x + x*.56; scanLight.position.y=heroPivot.position.y+.25; scanLight.intensity=(p===0||p===1)?.18:.56;
        inspectionGroup.children.forEach(o=>{ if(o.isMesh && o.geometry && o.geometry.type==='SphereGeometry'){ o.material.opacity=.24 + .16*(.5+.5*Math.sin(t*.7+o.userData.phase)); } });
      }
    }
  }

  function renderOnce(){ if(renderer && scene && camera && !contextLost) renderer.render(scene,camera); }
  function frame(now){ if(destroyed||hidden||reducedMotion||contextLost) return; updateMotion(now); renderOnce(); raf=requestAnimationFrame(frame); }
  function startLoop(){ if(!raf && !destroyed && !hidden && !reducedMotion && !contextLost){ lastFrame=performance.now(); raf=requestAnimationFrame(frame); } }
  function stopLoop(){ if(raf){ cancelAnimationFrame(raf); raf=0; } }

  function onPointer(e){
    if(reducedMotion || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    pointer.tx=(e.clientX/innerWidth-.5)*2; pointer.ty=(.5-e.clientY/innerHeight)*2;
  }
  function neutralPointer(){ pointer.tx=0; pointer.ty=0; }
  function onVisibility(){ hidden=document.hidden; if(hidden) stopLoop(); else { startTime += Math.max(0,performance.now()-lastFrame); startLoop(); renderOnce(); } }
  function onReduced(e){ reducedMotion=e.matches; pointer.tx=pointer.ty=0; if(reducedMotion){ stopLoop(); if(heroPivot){ heroPivot.rotation.set(-.12,.42,-.09); applyResponsive(); if(scanStrip)scanStrip.position.x=-.22; } renderOnce(); } else startLoop(); }

  function disposeObject(o){
    if(o.geometry) o.geometry.dispose();
    const mats=Array.isArray(o.material)?o.material:[o.material]; mats.filter(Boolean).forEach(m=>{ for(const k in m){ const v=m[k]; if(v && v.isTexture) v.dispose(); } m.dispose && m.dispose(); });
  }
  function destroy(){
    if(destroyed) return; destroyed=true; stopLoop(); listeners.splice(0).forEach(fn=>fn());
    if(scene) scene.traverse(disposeObject); if(envTarget) envTarget.dispose(); else if(envTexture) envTexture.dispose();
    if(renderer){ renderer.dispose(); const c=renderer.domElement; c && c.parentNode && c.parentNode.removeChild(c); }
    scene=camera=renderer=heroPivot=heroModel=inspectionGroup=scanStrip=scanLight=analysisTrace=null; envTexture=envTarget=null; initialized=false;
  }

  async function init(){
    if(initialized) return; initialized=true; destroyed=false; hidden=document.hidden; contextLost=false; startTime=lastFrame=performance.now();
    if(!window.THREE || !THREE.GLTFLoader){ initialized=false; setFallback(true); return; }
    try{
      scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.1,100);
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',premultipliedAlpha:true});
      renderer.setClearColor(CONFIG.bg,0); renderer.setSize(innerWidth,innerHeight,false);
      renderer.setPixelRatio(Math.min(devicePixelRatio||1, innerWidth<700?CONFIG.dprMobile:CONFIG.dprDesktop));
      renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.92;
      renderer.domElement.setAttribute('aria-hidden','true'); renderer.domElement.setAttribute('role','presentation'); root.appendChild(renderer.domElement);
      on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();contextLost=true;stopLoop();setFallback(true);},{passive:false});
      on(renderer.domElement,'webglcontextrestored',()=>{contextLost=false;setFallback(false);renderOnce();startLoop();});
      buildEnvironment(); setupLights(); buildBackgroundTrace();
      reducedMotionQuery=matchMedia('(prefers-reduced-motion: reduce)'); reducedMotion=reducedMotionQuery.matches;
      on(window,'resize',()=>{applyResponsive();renderOnce();},{passive:true});
      on(window,'pointermove',onPointer,{passive:true}); on(window,'pointerleave',neutralPointer,{passive:true});
      on(document,'visibilitychange',onVisibility,{passive:true});
      if(reducedMotionQuery.addEventListener) on(reducedMotionQuery,'change',onReduced); else reducedMotionQuery.addListener(onReduced);
      await loadHero(); setFallback(false);
      if(reducedMotion){ if(scanStrip)scanStrip.position.x=-.22; renderOnce(); } else startLoop();
    } catch(err){ stopLoop(); setFallback(true); initialized=false; if(renderer){renderer.dispose();} }
  }

  function restart(){ if(initialized) return; destroyed=false; init(); }
  window.QCBackground={destroy,restart};
  init();
  on(window,'pagehide',destroy,{once:true});
})();
</script>
</body>
</html>
'''.replace('__GLB_BASE64__',b64)
(root/'qc-login-3d-background.html').write_text(html,encoding='utf-8')
print('html bytes', (root/'qc-login-3d-background.html').stat().st_size)
