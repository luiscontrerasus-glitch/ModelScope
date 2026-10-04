# ModelScope

Equations have limits. Find them.

ModelScope is a scientific workspace for exploring where a configured model increasingly disagrees with observations. Milestone 1 is a Hooke's law vertical slice, built from scratch in this repository. All scientific calculations run in deterministic TypeScript; no AI service is required.

The engine, editable table, linked plots, and inspectable evidence are developed together. See [the methodology](docs/methodology.md) for the selected method and its limitations.

## Development

Requires Node.js 20.9 or later and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Validation commands: `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
