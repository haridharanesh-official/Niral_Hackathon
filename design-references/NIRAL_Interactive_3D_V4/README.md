# NIRAL 2026 — Interactive Innovation Core (V4)

A redesigned, **working interactive CSS-3D scene** that replaces the overlapping flat "N." cards in the Authentication V3 design preview. The visual styling preserves the approved NIRAL white/paper/coral/black language.

## Open the interactive design

Open `auth_design_preview_v4.html` in a browser. This is a self-contained 15-screen authentication design prototype; it is **not connected to registration, login, or a database**.

## Interactive controls

- **Drag with mouse / swipe with touch** on the model to rotate it in 3D.
- **Left / Right:** rotate the board.
- **Explode:** spread chip, substrate, and sensor modules apart and return them.
- **Pause / Play:** stop or resume ambient motion.
- **Zoom:** change the model scale.
- **Reset:** return orientation, zoom, selected hotspot and exploded state to defaults.
- **AI ENGINE / IoT SENSORS / CORE:** focus the component and update its explanatory panel.
- **Keyboard:** focus the model and use arrow keys; double-click the stage to reset.
- Respects `prefers-reduced-motion`.

## React/Next.js integration (optional, not applied to the repository)

Copy `NiralInnovationCore.tsx` and `NiralInnovationCore.css` to an appropriate component folder within `apps/web/src/components/auth/`. Render this **client** component in the existing registration/login visual area:

```tsx
import NiralInnovationCore from '@/components/auth/NiralInnovationCore';

// Within the existing authentication art panel:
<NiralInnovationCore />
```

The visual component makes no network calls and requires no Three.js or backend changes. Its CSS is scoped under `.niral-core-v4`, so it should not change the public website's styles. The JSX syntax was validated with TypeScript transpilation; actual in-repository Next.js build and visual integration have **not** been run.

## Scope and verification

The standalone browser prototype was rendered and exercised at 1440px desktop and 390px mobile using Chromium. Verified pointer rotation, controls, selection, zoom, pause, reset, mobile visibility, no horizontal overflow, and no page JS errors.

This is CSS-based 3D presentation (not an imported glTF/Three.js asset or a circuit simulator). **No live NIRAL code, public pages, backend, database, or Figma file was edited.**
