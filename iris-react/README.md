# IRIS React Front-End

This package hosts a React reimplementation of the IRIS image segmentation UI.

The repository currently includes only the initial project scaffold. As we port features from the Flask/Jinja
implementation we will extend the `src/` tree with the segmentation workspace, toolbar, dialogs, and canvas rendering
logic.

## Getting started

```bash
cd iris-react
npm install
npm run dev
```

By default the client sends API requests to the same origin that serves the React bundle (during development this means
requests go through Vite's proxy to the Flask server). Set `VITE_BACKEND_URL` in a local `.env` only when the backend
lives on a different host/port that is directly reachable from the browser.

## Current status

- 🟢 Routing shell, authentication dialog, status/toolbar chrome, and read-only view grid are in place.
- 🟢 Mask files load when present; the “Mask preview” panel renders colour-encoded masks.
- 🟢 Metadata, user, and help dialogs now render live data from the backend (hotkeys, metadata tables, user stats).
- 🔴 Canvas editing tools (draw/erase/undo/redo), AI predictions, and filter controls are not yet ported.
- 🔴 Saving masks, updating action metadata, and polling for server-side updates remain to be implemented.

## Suggested dev workflow

1. **Run the upstream backend** (`uv run iris demo` or your preferred launch command).
2. Start the React dev server with `npm run dev` and log in via the modal dialog.
3. Use the browser dev tools console for real-time diagnostics—the app logs bootstrap and fetch errors there.
4. When adding features, keep parity with the legacy Flask UI (tool availability, keyboard shortcuts, view behaviour).

## Next milestones

1. Port the legacy canvas ViewManager (zoom/pan, group switching) into React components.
2. Recreate mask editing tools with undo/redo history and persistence via `/segmentation/save_mask`.
3. Wire AI-assist (`/segmentation/predict_mask`) and update the status bar to reflect scores in real time.
4. Flesh out modal dialogues (classes, help, config) with full data + server round-trips.
5. Add automated tests (React Testing Library for components, Playwright/Cypress for e2e smoke paths).
