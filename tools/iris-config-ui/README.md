IRIS Config Editor (minimal)

This is a small Vite + React app that uses react-jsonschema-form (rjsf) to render
an editable form driven by the `irisconfig.json` schema.

Quick start

1. cd tools/iris-config-ui
2. npm install
3. npm run dev

4. Start the persistence server (runs on port 5174 by default): npm run start:server


Open http://localhost:5173 and you should see the form preview on the right and
editable JSON schema + uiSchema editors on the left.

Notes

- `public/irisconfig.json` was copied from the repository's top-level `irisconfig.json`.
- The left column lets you edit the raw JSON Schema and apply changes interactively.
- The uiSchema textarea accepts a JSON object to customize widgets/layout.
