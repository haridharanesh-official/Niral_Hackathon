'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import styles from './NiralInnovationCore.module.css';

export type CoreHotspot = 'core' | 'ai' | 'iot';
type Interaction = {
  type: 'rotate' | 'zoom' | 'reset' | 'select' | 'explode' | 'pause';
  value?: number | string | boolean;
};
type Props = {
  variant?: 'default' | 'compact';
  initialRotation?: { x: number; y: number };
  motionEnabled?: boolean;
  selectedHotspot?: CoreHotspot;
  reducedMotion?: boolean;
  onHotspotChange?: (hotspot: CoreHotspot) => void;
  onInteraction?: (event: Interaction) => void;
};
const initialView = { x: -18, y: -26 };
const parts = {
  core: [
    '01 / 03',
    'NIRAL CORE',
    'The heart of every new idea. Explore the raised processor and its layered circuit board.',
  ],
  ai: [
    '02 / 03',
    'AI ENGINE',
    'Intelligence meets invention. The floating AI compute module turns sensor data into useful decisions.',
  ],
  iot: [
    '03 / 03',
    'IoT SENSORS',
    'Connect the physical world. The networked sensor interface gathers signals for your next prototype.',
  ],
} as const;
const cx = (names: string) =>
  names
    .split(' ')
    .map((name) => styles[name])
    .join(' ');
const clampX = (x: number) => Math.max(-76, Math.min(76, x));
const clampZoom = (z: number) => Math.max(0.65, Math.min(1.15, z));
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
const motionPreference = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverMotionPreference = () => true;

export default function NiralInnovationCore({
  variant = 'default',
  initialRotation = initialView,
  motionEnabled = true,
  selectedHotspot,
  reducedMotion,
  onHotspotChange,
  onInteraction,
}: Props) {
  const preference = useSyncExternalStore(
    subscribeMotion,
    motionPreference,
    serverMotionPreference,
  );
  const reduced = reducedMotion ?? preference;
  const [selection, setSelection] = useState<CoreHotspot>('core');
  const [exploded, setExploded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(100);
  const selected = selectedHotspot ?? selection;
  const details = parts[selected];
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const config = useRef({ ambient: false, reduced: true, onInteraction });
  const controller = useRef<{
    rotate: (x: number, y: number) => void;
    zoom: (z: number) => void;
    reset: () => void;
    wake: () => void;
  } | null>(null);

  useEffect(() => {
    const root = rootRef.current,
      scene = sceneRef.current,
      model = modelRef.current;
    if (!root || !scene || !model) return;
    const modelElement = model;
    let targetX = clampX(initialRotation.x),
      targetY = initialRotation.y;
    let currentX = targetX,
      currentY = targetY;
    let frame = 0,
      lastFrame = performance.now(),
      lastInput = lastFrame,
      lastCoords = 0;
    let visible = true,
      pointer: number | null = null,
      lastX = 0,
      lastY = 0;
    const active = () => visible && document.visibilityState === 'visible';
    const syncMotion = () => {
      root.dataset.running = String(
        active() && config.current.ambient && pointer === null,
      );
    };
    function wake() {
      syncMotion();
      if (!frame && active()) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(animate);
      }
    }
    function animate(now: number) {
      frame = 0;
      if (!active()) return;
      const dt = Math.min(60, Math.max(0, now - lastFrame));
      lastFrame = now;
      if (config.current.ambient && pointer === null && now - lastInput > 1200)
        targetY += dt * 0.006;
      const smoothing = config.current.reduced ? 1 : 1 - Math.pow(0.83, dt / 16.67);
      currentX += (targetX - currentX) * smoothing;
      currentY += (targetY - currentY) * smoothing;
      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) <= 0.02) {
        currentX = targetX;
        currentY = targetY;
      }
      modelElement.style.setProperty('--rx', `${currentX.toFixed(2)}deg`);
      modelElement.style.setProperty('--ry', `${currentY.toFixed(2)}deg`);
      if (now - lastCoords > 100 && coordsRef.current) {
        coordsRef.current.textContent = `X ${Math.round(currentX)}° · Y ${Math.round((((currentY % 360) + 540) % 360) - 180)}°`;
        lastCoords = now;
      }
      if (
        config.current.ambient ||
        Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.02
      )
        frame = requestAnimationFrame(animate);
    }
    function rotate(x: number, y: number) {
      targetX = clampX(targetX + x);
      targetY += y;
      lastInput = performance.now();
      wake();
    }
    function zoomTo(value: number) {
      modelElement.style.setProperty('--zoom', String(clampZoom(value)));
      lastInput = performance.now();
      wake();
    }
    const down = (e: PointerEvent) => {
      if (
        e.button !== 0 ||
        pointer !== null ||
        (e.target as HTMLElement).closest('button')
      )
        return;
      pointer = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      lastInput = performance.now();
      try {
        scene.setPointerCapture(e.pointerId);
      } catch {
        pointer = null;
        return;
      }
      scene.classList.add(styles.dragging);
      wake();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      rotate(-(e.clientY - lastY) * 0.68, (e.clientX - lastX) * 0.78);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      scene.classList.remove(styles.dragging);
      lastInput = performance.now();
      if (scene.hasPointerCapture(e.pointerId)) scene.releasePointerCapture(e.pointerId);
      config.current.onInteraction?.({ type: 'rotate' });
      wake();
    };
    const keydown = (e: KeyboardEvent) => {
      if (e.target !== scene) return;
      const directions: Record<string, [number, number]> = {
        ArrowUp: [-10, 0],
        ArrowDown: [10, 0],
        ArrowLeft: [0, -15],
        ArrowRight: [0, 15],
      };
      if (directions[e.key]) {
        e.preventDefault();
        rotate(...directions[e.key]);
        config.current.onInteraction?.({ type: 'rotate' });
      }
    };
    const fit = new ResizeObserver((entries) => {
      // Keep the full board and rings visible even at maximum zoom and in exploded view.
      const width = entries[0].contentRect.width;
      const factor = Math.min(
        1,
        Math.max(0.3, (width - 24) / (380 * 1.15)),
        (scene.clientHeight - 65) / (230 * 1.15),
      );
      model.style.setProperty('--fit', factor.toFixed(3));
    });
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        wake();
      },
      { rootMargin: '30px' },
    );
    const visibility = () => {
      if (!active() && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      wake();
    };
    controller.current = {
      rotate,
      zoom: zoomTo,
      wake,
      reset: () => {
        targetX = clampX(initialRotation.x);
        targetY = initialRotation.y;
        zoomTo(1);
      },
    };
    scene.addEventListener('pointerdown', down);
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerup', up);
    scene.addEventListener('pointercancel', up);
    scene.addEventListener('lostpointercapture', up);
    scene.addEventListener('keydown', keydown);
    document.addEventListener('visibilitychange', visibility);
    fit.observe(scene);
    observer.observe(scene);
    wake();
    return () => {
      cancelAnimationFrame(frame);
      fit.disconnect();
      observer.disconnect();
      scene.removeEventListener('pointerdown', down);
      scene.removeEventListener('pointermove', move);
      scene.removeEventListener('pointerup', up);
      scene.removeEventListener('pointercancel', up);
      scene.removeEventListener('lostpointercapture', up);
      scene.removeEventListener('keydown', keydown);
      document.removeEventListener('visibilitychange', visibility);
      if (pointer !== null && scene.hasPointerCapture(pointer))
        scene.releasePointerCapture(pointer);
      controller.current = null;
    };
  }, [initialRotation.x, initialRotation.y]);
  useEffect(() => {
    config.current = {
      ambient: motionEnabled && !paused && !reduced,
      reduced,
      onInteraction,
    };
    controller.current?.wake();
  }, [motionEnabled, paused, reduced, onInteraction]);
  function select(part: CoreHotspot) {
    setSelection(part);
    onHotspotChange?.(part);
    onInteraction?.({ type: 'select', value: part });
  }
  function reset() {
    controller.current?.reset();
    setZoom(100);
    setExploded(false);
    select('core');
    onInteraction?.({ type: 'reset' });
  }
  function changeZoom(value: number) {
    const next = Math.round(clampZoom(value / 100) * 100);
    setZoom(next);
    controller.current?.zoom(next / 100);
    onInteraction?.({ type: 'zoom', value: next });
  }
  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-variant={variant}
      data-selected={selected}
      data-running="false"
      data-reduced={reduced}
    >
      <div className={cx('art-wrap')}>
        <div
          ref={sceneRef}
          className={cx('art-visual nir-orbit-stage')}
          role="group"
          tabIndex={0}
          aria-label="Interactive NIRAL innovation core"
          aria-describedby={`${id}-help`}
          onDoubleClick={(e) => {
            if (!(e.target as HTMLElement).closest('button')) reset();
          }}
        >
          <div className={cx('stage-grid')} aria-hidden="true"></div>
          <div className={cx('stage-glow')} aria-hidden="true"></div>
          <div className={cx('stage-head')}>
            <span className={cx('stage-id')}>
              <span className={cx('stage-led')}></span> NIRAL / INNOVATION LAB
            </span>
            <span className={cx('stage-hint')}>
              3D INTERACTIVE <span aria-hidden="true">↗</span>
            </span>
          </div>
          <div className={cx('stage-ground')} aria-hidden="true"></div>
          <div
            className={`${cx('orbit-model')} ${exploded ? styles['is-exploded'] : ''}`}
            ref={modelRef}
            data-core-model=""
            aria-hidden="true"
          >
            <div className={styles['scene-scale']}>
              <div className={cx('model-float')}>
                <div className={cx('orbit-ring ring-one')}></div>
                <div className={cx('orbit-ring ring-two')}></div>
                <div className={cx('board-thickness')}></div>
                <div className={cx('board-surface')}>
                  <svg
                    className={cx('pcb-traces')}
                    viewBox="0 0 300 190"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 38 H72 L93 62 H137 M12 69 H46 L79 98 H139 M12 145 H62 L99 119 H137 M285 36 H239 L216 63 H170 M288 78 H250 L223 99 H167 M288 151 H234 L210 124 H168"
                      stroke="#DA7E7C"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 28 H72 L94 50 M16 157 H64 L88 139 M282 24 H229 L207 46 M280 166 H227 L203 140"
                      stroke="#111111"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity=".58"
                    />
                    <circle cx="13" cy="38" r="5" fill="#111" />
                    <circle cx="13" cy="69" r="5" fill="#111" />
                    <circle cx="13" cy="145" r="5" fill="#111" />
                    <circle cx="287" cy="36" r="5" fill="#111" />
                    <circle cx="287" cy="78" r="5" fill="#111" />
                    <circle cx="287" cy="151" r="5" fill="#111" />
                    <circle
                      cx="65"
                      cy="98"
                      r="5"
                      fill="#F8A6A2"
                      stroke="#111"
                      strokeWidth="2"
                    />
                    <circle
                      cx="232"
                      cy="98"
                      r="5"
                      fill="#F8A6A2"
                      stroke="#111"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className={cx('board-screw screw-a')}></div>
                  <div className={cx('board-screw screw-b')}></div>
                  <div className={cx('board-screw screw-c')}></div>
                  <div className={cx('board-screw screw-d')}></div>
                  <div className={cx('board-header')}>
                    <span>NR—01</span>
                    <span>ENGINEERED TO CREATE</span>
                  </div>
                  <div className={cx('micro-port port-one')}></div>
                  <div className={cx('micro-port port-two')}></div>
                  <div className={cx('micro-port port-three')}></div>
                  <div className={cx('chip-heatsink')}></div>
                  <div className={cx('chip-body')}>
                    <div className={cx('chip-face')}>
                      <span className={cx('chip-mark')}>
                        N<span>.</span>
                      </span>
                      <span className={cx('chip-sub')}>
                        INNOVATION
                        <br />
                        CORE
                      </span>
                      <span className={cx('chip-led')}></span>
                    </div>
                  </div>
                  <div className={cx('board-annotation left-annotation')}>
                    I/O
                    <br />
                    01
                  </div>
                  <div className={cx('board-annotation right-annotation')}>
                    SYS
                    <br />
                    26
                  </div>
                </div>
                <div className={cx('floating-module module-ai')}>
                  <span>AI</span>
                  <small>ENGINE</small>
                </div>
                <div className={cx('floating-module module-sensor')}>
                  <span>◉</span>
                  <small>SENSOR</small>
                </div>
                <div className={cx('floating-module module-cloud')}>
                  <span>☁</span>
                  <small>SYNC</small>
                </div>
                <div className={cx('module-light light-a')}></div>
                <div className={cx('module-light light-b')}></div>
              </div>
            </div>
          </div>

          <div
            className={cx('hotspot-group')}
            role="group"
            aria-label="Explore innovation core components"
          >
            {(['core', 'ai', 'iot'] as const).map((part) => (
              <button
                type="button"
                key={part}
                className={`${cx(`component-hotspot hot-${part}`)} ${selected === part ? styles['is-active'] : ''}`}
                aria-label={
                  { core: 'Core Processor', ai: 'AI Engine', iot: 'IoT Sensors' }[part]
                }
                aria-pressed={selected === part}
                title={parts[part][2]}
                onClick={() => select(part)}
              >
                <span className={styles['hotspot-dot']} aria-hidden="true" />
                {{ core: 'CORE ↗', ai: 'AI ENGINE', iot: 'IoT SENSORS' }[part]}
              </button>
            ))}
          </div>
          <div className={styles['stage-footer']} aria-hidden="true">
            <span>✧ ROTATE / EXPLORE</span>
            <span ref={coordsRef}>X −18° · Y −26°</span>
          </div>
        </div>
        <div className={styles['scene-caption']} role="status" aria-live="polite">
          <span className={styles['caption-badge']}>{details[0]}</span>
          <div>
            <strong>{details[1]}</strong>
            <p>{details[2]}</p>
          </div>
          <span className={styles['caption-arrow']} aria-hidden="true">
            ↗
          </span>
        </div>
        <div
          className={styles['scene-tools']}
          role="group"
          aria-label="3D model controls"
        >
          <button
            type="button"
            aria-label="Rotate left"
            onClick={() => {
              controller.current?.rotate(0, -30);
              onInteraction?.({ type: 'rotate', value: -30 });
            }}
          >
            ↶ Left
          </button>
          <button
            type="button"
            aria-label="Rotate right"
            onClick={() => {
              controller.current?.rotate(0, 30);
              onInteraction?.({ type: 'rotate', value: 30 });
            }}
          >
            ↷ Right
          </button>
          <button type="button" aria-label="Reset view" onClick={reset}>
            ⟲ Reset
          </button>
          <button
            type="button"
            aria-pressed={exploded}
            onClick={() => {
              setExploded((v) => !v);
              onInteraction?.({ type: 'explode', value: !exploded });
            }}
          >
            ✳ {exploded ? 'Assemble' : 'Explode'}
          </button>
          <button
            type="button"
            aria-pressed={paused}
            disabled={reduced || !motionEnabled}
            onClick={() => {
              setPaused((v) => !v);
              onInteraction?.({ type: 'pause', value: !paused });
            }}
          >
            {paused ? '▶ Resume motion' : 'Ⅱ Pause motion'}
          </button>
          <label className={styles['scene-zoom']}>
            Zoom{' '}
            <input
              className={styles.zoomInput}
              type="range"
              min="65"
              max="115"
              value={zoom}
              aria-label="Artwork zoom"
              onChange={(e) => changeZoom(Number(e.target.value))}
            />
          </label>
        </div>
        <p id={`${id}-help`} className={styles['scene-help']}>
          Drag or swipe to spin · Tap a component · Double-click to reset · Arrow keys to
          rotate{reduced ? ' · Reduced motion: automatic motion is off.' : ''}
        </p>
      </div>
    </div>
  );
}
