# Authentication Innovation Core V4

## Scope and original component

The old flat-card illustration was `apps/web/src/components/auth/interactive-3d-artwork.tsx`, rendered through the shared authentication layout. It now re-exports `NiralInnovationCore`, so every existing authentication consumer receives the replacement without editing the forms or authentication layout.

Reference files inspected: `design-references/NIRAL_Interactive_3D_V4/NiralInnovationCore.tsx`, its stylesheet, `auth_design_preview_v4.html`, README/changelog, and desktop/mobile screenshots. The supplied visual board, circuit traces, processor, sensor/AI/cloud modules and orbit rings were adapted rather than redrawn.

## Files

| File | Change |
| --- | --- |
| `apps/web/src/components/auth/NiralInnovationCore.tsx` | Reusable client component and interaction controller |
| `apps/web/src/components/auth/NiralInnovationCore.module.css` | Co-located scoped V4 visual styling and responsive fitting |
| `apps/web/src/components/auth/interactive-3d-artwork.tsx` | Existing entry point delegates to V4; old JSX removed |
| `scripts/check-innovation-core.cjs` | V4 browser tests, screenshots and recorded results |
| `scripts/check-auth-v3-browser.cjs` | Existing regression suite updated for the new scene and controls |
| This report | Implementation, checks and limitations |

No public-page source, authentication form, API contract, backend, database, dependency or environment configuration was changed for V4. Existing worktree changes were preserved. Nothing was committed, pushed or deployed.

## Architecture and interactions

The optional props are `variant`, `initialRotation`, `motionEnabled`, `selectedHotspot`, `reducedMotion`, `onHotspotChange` and `onInteraction`. `selectedHotspot` supports controlled selection; otherwise the component manages its selection locally.

- Pointer/touch dragging uses Pointer Events, a tracked pointer ID, capture/release, vertical clamping and cancellation cleanup. Hotspot buttons are excluded from drag initiation.
- Rotation eases through requestAnimationFrame updates to CSS custom properties. Coordinates update at most ten times per second; React does not rerender per animation frame.
- Core Processor, AI Engine and IoT Sensors buttons expose pressed states, highlight the corresponding module, provide native descriptive tooltips and update a live information panel outside the visual scene.
- Explode/Assemble separates the substrate, heatsink, processor and peripheral modules with CSS transitions. A smoothly scaled camera wrapper keeps the scene readable while layers separate.
- Zoom uses a native keyboard-accessible slider, bounded to 65–115%. Reset restores the configured initial rotation, default zoom, assembled layers and core selection.
- Left/right controls, stage arrow keys and double-click reset provide alternatives to dragging. All buttons have at least 44px target height and visible focus indicators.
- Pause/Resume controls floating motion and slow automatic rotation. Automatic motion pauses during dragging and resumes after a short idle interval.
- Reduced-motion preferences use a live media-query subscription, including changes while the page is open. Automatic motion and decorative transitions stop; manual controls continue working. An explicit reduced-motion prop can override the preference.
- Intersection/visibility observers stop offscreen/hidden animation. ResizeObserver fits the model to its viewport. All observers, media subscriptions, pointer listeners and frames are cleaned up on unmount.

No Three.js, React Three Fiber, networked assets or new dependencies were introduced. This is CSS 3D presentation, not a physics or circuit simulation.

## Responsive and reference adjustments

The V4 white, paper, coral, blush and black composition is retained, including traces, board thickness, mint AI module and outlined hotspots. The new CSS is a module; it cannot style public-page elements globally.

At desktop/tablet/mobile widths the full board remains visible. All peripheral modules remain inside the viewport in exploded view at maximum zoom. On small screens the exploded model scales further to preserve this containment. Hotspots and controls are larger than the original reference for touch accessibility. The mobile stage header omits the secondary decorative label; all module information remains available below the scene. The details panel reserves height to limit layout changes between selections.

The reference's 145% maximum zoom is reduced to 115% so zoomed/exploded layers fit the authentication column. Wheel zoom is intentionally omitted so scrolling through registration stays predictable. Slider, rotation buttons and keyboard controls provide the advertised interactions.

## Verification

- **52 V4 browser assertions passed**, covering mouse and touch drag, cancellation, hotspots and visual highlights, exploded/reassembled transforms, zoom, reset, pause/resume, keyboard operation, live reduced-motion changes, all-module containment and 1440/768/390px layouts.
- **41 existing authentication browser assertions passed**, including validation, required student details, review/edit and browser history, consent, password exclusion, refresh safety, recovery and negative server responses.
- **Five registration model tests passed** with `node --test scripts/test-auth-v3.cjs`.
- **TypeScript passed** using `node node_modules/typescript/bin/tsc --noEmit --project apps/web/tsconfig.json`.
- **Scoped ESLint passed** for the new core and integration entry point. The unrelated full-project lint baseline from the preceding phase remains outside this fix.
- Browser runtime and hydration exceptions: **none**. The only failed network responses in the V4 suite were the existing unauthenticated `/api/content` 401 responses; no new scene request or console failure was introduced.
- Evidence: `tmp/core-v4-qa/results.json`, `core-1440.png`, `core-768.png`, `core-390.png`, corresponding `exploded-*.png`, and full authentication screenshots. Regression results: `tmp/auth-v3-qa/results.json`.

Browser tests used the existing Playwright installation because the Browser plugin skill was unavailable. Tests ran at `http://localhost:3000/register`; touch testing used Chromium's touch input emulation. Real Android/iOS hardware and screen-reader testing were not performed. The public homepage rendered with no Innovation Core; a pre-change pixel baseline was unavailable, so this is a source-scope and smoke check rather than pixel-identical public-page regression proof.

The final production build **passed with exit code 0**, including compilation, TypeScript, generation of all 53 static pages and build traces. Command: `node ../../node_modules/next/dist/bin/next build --webpack` from `apps/web`. The build used the previously approved external-sandbox path needed for generated Next.js output. The local development server is restarted afterward at `http://localhost:3000/register`.
