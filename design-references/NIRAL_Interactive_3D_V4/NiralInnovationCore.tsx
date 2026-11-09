"use client";

import { useEffect, useRef } from "react";
import "./NiralInnovationCore.css";

/** Accessible, CSS 3D interactive artwork for the NIRAL authentication experience.
 *  Works offline and needs no Three.js, network calls, or API configuration.
 *  Mount one instance per page; IDs are scoped by the component's root ref.
 */
export default function NiralInnovationCore() {

  const rootRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=rootRef.current;
    if(!root)return;
    const $=(s:string)=>root.querySelector<HTMLElement>(s);
    const scene=$('#artScene')!;
    const orbit=$('#orbitModel')!;
    const coords=$('#orbitCoords')!;
    const info=$('#partInfo')!;
    const zoomInput=root.querySelector<HTMLInputElement>('#zoom')!;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let targetX=-18,targetY=-26,currentX=-18,currentY=-26,zoom=1,drag=false,paused=false,exploded=false;
    let lastX=0,lastY=0,lastInput=performance.now(),lastFrame=performance.now(),frame=0;
    const descriptions:Record<string,[string,string,string]>={
      core:['01 / 03','NIRAL CORE','The heart of every new idea. Grab the model and explore its layers.'],
      ai:['02 / 03','AI ENGINE','Intelligence meets invention. Explore the floating AI compute module.'],
      iot:['03 / 03','IoT SENSORS','Connect the physical world. Discover the networked sensor interface.']
    };
    function selectPart(part:string){
      const d=descriptions[part];if(!d)return;
      root!.querySelectorAll<HTMLButtonElement>('.component-hotspot').forEach(b=>{
        const active=b.dataset.part===part;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));
      });
      info.querySelector<HTMLElement>('.caption-badge')!.textContent=d[0];
      info.querySelector<HTMLElement>('strong')!.textContent=d[1];
      info.querySelector<HTMLElement>('p')!.textContent=d[2];
    }
    function zoomTo(n:number){zoom=Math.max(.65,Math.min(1.45,n));zoomInput.value=String(Math.round(zoom*100));orbit.style.setProperty('--zoom',String(zoom));}
    function animate(now:number){
      const dt=Math.min(60,Math.max(0,now-lastFrame));lastFrame=now;
      if(!drag&&!paused&&!reduced.matches&&document.visibilityState==='visible'&&now-lastInput>1200)targetY+=(dt/1000)*6;
      const spring=reduced.matches?1:1-Math.pow(.83,dt/16.67);
      currentX+=(targetX-currentX)*spring;currentY+=(targetY-currentY)*spring;
      orbit.style.setProperty('--rx',currentX.toFixed(2)+'deg');orbit.style.setProperty('--ry',currentY.toFixed(2)+'deg');
      coords.textContent='X '+Math.round(currentX)+'° · Y '+(Math.round(((currentY%360)+540)%360-180))+'°';
      frame=requestAnimationFrame(animate);
    }
    const onDown=(e:PointerEvent)=>{if(e.button!==0 || (e.target as HTMLElement).closest('button'))return;drag=true;lastX=e.clientX;lastY=e.clientY;lastInput=performance.now();scene.setPointerCapture(e.pointerId);scene.classList.add('dragging')};
    const onMove=(e:PointerEvent)=>{if(!drag)return;targetY+=(e.clientX-lastX)*.78;targetX=Math.max(-76,Math.min(76,targetX-(e.clientY-lastY)*.68));lastX=e.clientX;lastY=e.clientY;lastInput=performance.now()};
    const onUp=()=>{drag=false;scene.classList.remove('dragging');lastInput=performance.now()};
    const reset=()=>{targetX=-18;targetY=-26;lastInput=performance.now();zoomTo(1);selectPart('core');exploded=false;orbit.classList.remove('is-exploded');$('#orbitExplode')!.setAttribute('aria-pressed','false')};
    const onDbl=(e:MouseEvent)=>{if(!(e.target as HTMLElement).closest('button'))reset()};
    const onKey=(e:KeyboardEvent)=>{if(e.target!==scene)return;const dirs:Record<string,[number,number]>={ArrowUp:[-10,0],ArrowDown:[10,0],ArrowLeft:[0,-15],ArrowRight:[0,15]};if(dirs[e.key]){e.preventDefault();targetX=Math.max(-76,Math.min(76,targetX+dirs[e.key][0]));targetY+=dirs[e.key][1];lastInput=performance.now()}};
    const onWheel=(e:WheelEvent)=>{if(!e.ctrlKey)return;e.preventDefault();zoomTo(zoom-e.deltaY*.00075);lastInput=performance.now()};
    scene.addEventListener('pointerdown',onDown);scene.addEventListener('pointermove',onMove);
    scene.addEventListener('pointerup',onUp);scene.addEventListener('pointercancel',onUp);scene.addEventListener('lostpointercapture',onUp);
    scene.addEventListener('dblclick',onDbl);scene.addEventListener('keydown',onKey);scene.addEventListener('wheel',onWheel,{passive:false});
    root.querySelectorAll<HTMLButtonElement>('.component-hotspot').forEach(b=>b.onclick=()=>selectPart(b.dataset.part||'core'));
    $('#rotLeft')!.onclick=()=>{targetY-=30;lastInput=performance.now()};
    $('#rotRight')!.onclick=()=>{targetY+=30;lastInput=performance.now()};
    $('#rotReset')!.onclick=reset;
    zoomInput.oninput=e=>{zoomTo(Number((e.target as HTMLInputElement).value)/100);lastInput=performance.now()};
    $('#orbitPause')!.onclick=()=>{paused=!paused;$('#orbitPause')!.setAttribute('aria-pressed',String(paused));$('#orbitPause')!.innerHTML=paused?'▶ <span>Play</span>':'Ⅱ <span>Pause</span>';scene.classList.toggle('is-paused',paused);lastInput=performance.now()};
    $('#orbitExplode')!.onclick=()=>{exploded=!exploded;orbit.classList.toggle('is-exploded',exploded);$('#orbitExplode')!.setAttribute('aria-pressed',String(exploded));lastInput=performance.now()};
    zoomTo(1);frame=requestAnimationFrame(animate);
    return ()=>{cancelAnimationFrame(frame);scene.removeEventListener('pointerdown',onDown);scene.removeEventListener('pointermove',onMove);scene.removeEventListener('pointerup',onUp);scene.removeEventListener('pointercancel',onUp);scene.removeEventListener('lostpointercapture',onUp);scene.removeEventListener('dblclick',onDbl);scene.removeEventListener('keydown',onKey);scene.removeEventListener('wheel',onWheel)};
  },[]);
  return (
    <div className="niral-core-v4" ref={rootRef}>
<div className="art-wrap">
  <div className="art-visual nir-orbit-stage" tabIndex="0" role="group" aria-label="Interactive NIRAL innovation core. Drag or swipe to rotate. Use arrow keys to rotate, or use the controls below." id="artScene">
    <div className="stage-grid" aria-hidden="true"></div>
    <div className="stage-glow" aria-hidden="true"></div>
    <div className="stage-head"><span className="stage-id"><span className="stage-led"></span> NIRAL / INNOVATION LAB</span><span className="stage-hint">3D INTERACTIVE <span aria-hidden="true">↗</span></span></div>
    <div className="stage-ground" aria-hidden="true"></div>
    <div className="orbit-model" id="orbitModel" aria-hidden="true">
      <div className="model-float">
        <div className="orbit-ring ring-one"></div>
        <div className="orbit-ring ring-two"></div>
        <div className="board-thickness"></div>
        <div className="board-surface">
          <svg className="pcb-traces" viewBox="0 0 300 190" fill="none" aria-hidden="true">
            <path d="M12 38 H72 L93 62 H137 M12 69 H46 L79 98 H139 M12 145 H62 L99 119 H137 M285 36 H239 L216 63 H170 M288 78 H250 L223 99 H167 M288 151 H234 L210 124 H168" stroke="#DA7E7C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 28 H72 L94 50 M16 157 H64 L88 139 M282 24 H229 L207 46 M280 166 H227 L203 140" stroke="#111111" strokeWidth="2" strokeLinecap="round" opacity=".58"/>
            <circle cx="13" cy="38" r="5" fill="#111"/><circle cx="13" cy="69" r="5" fill="#111"/><circle cx="13" cy="145" r="5" fill="#111"/><circle cx="287" cy="36" r="5" fill="#111"/><circle cx="287" cy="78" r="5" fill="#111"/><circle cx="287" cy="151" r="5" fill="#111"/>
            <circle cx="65" cy="98" r="5" fill="#F8A6A2" stroke="#111" strokeWidth="2"/><circle cx="232" cy="98" r="5" fill="#F8A6A2" stroke="#111" strokeWidth="2"/>
          </svg>
          <div className="board-screw screw-a"></div><div className="board-screw screw-b"></div><div className="board-screw screw-c"></div><div className="board-screw screw-d"></div>
          <div className="board-header"><span>NR—01</span><span>ENGINEERED TO CREATE</span></div>
          <div className="micro-port port-one"></div><div className="micro-port port-two"></div><div className="micro-port port-three"></div>
          <div className="chip-heatsink"></div>
          <div className="chip-body"><div className="chip-face"><span className="chip-mark">N<span>.</span></span><span className="chip-sub">INNOVATION<br />CORE</span><span className="chip-led"></span></div></div>
          <div className="board-annotation left-annotation">I/O<br />01</div><div className="board-annotation right-annotation">SYS<br />26</div>
        </div>
        <div className="floating-module module-ai"><span>AI</span><small>ENGINE</small></div>
        <div className="floating-module module-sensor"><span>◉</span><small>SENSOR</small></div>
        <div className="floating-module module-cloud"><span>☁</span><small>SYNC</small></div>
        <div className="module-light light-a"></div><div className="module-light light-b"></div>
      </div>
    </div>
    <div className="hotspot-group" role="group" aria-label="Explore innovation core components">
      <button type="button" className="component-hotspot hot-core is-active" data-part="core" aria-pressed="true"><span className="hotspot-dot"></span> CORE <span aria-hidden="true">↗</span></button>
      <button type="button" className="component-hotspot hot-ai" data-part="ai" aria-pressed="false"><span className="hotspot-dot"></span> AI ENGINE</button>
      <button type="button" className="component-hotspot hot-iot" data-part="iot" aria-pressed="false"><span className="hotspot-dot"></span> IoT SENSORS</button>
    </div>
    <div className="stage-footer"><span className="stage-axis" aria-hidden="true">✧ &nbsp; ROTATE / EXPLORE</span><span className="stage-coords" id="orbitCoords">X −18° · Y −26°</span></div>
  </div>
  <div className="scene-caption" aria-live="polite" id="partInfo"><span className="caption-badge">01 / 03</span><div><strong>NIRAL CORE</strong><p>The heart of every new idea. Grab the model or tap a component to explore.</p></div><span className="caption-arrow">↗</span></div>
  <div className="scene-tools" role="group" aria-label="3D model controls">
    <button id="rotLeft" type="button" aria-label="Rotate left" title="Rotate left">↶ <span>Left</span></button>
    <button id="rotRight" type="button" aria-label="Rotate right" title="Rotate right">↷ <span>Right</span></button>
    <button id="rotReset" type="button" title="Reset rotation and zoom">⟲ <span>Reset</span></button>
    <button id="orbitExplode" type="button" aria-pressed="false" title="Toggle exploded model view">✳ <span>Explode</span></button>
    <button id="orbitPause" type="button" aria-pressed="false" title="Pause ambient motion">Ⅱ <span>Pause</span></button>
    <label className="scene-zoom">Zoom <input type="range" id="zoom" min="65" max="145" defaultValue="100" aria-label="Artwork zoom" /></label>
  </div>
  <p className="scene-help">✦ Drag to spin · Tap a component · Double-click to reset · Arrow keys to rotate</p>
</div>
    </div>
  );
}
