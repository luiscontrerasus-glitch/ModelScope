# ModelScope

Equations have limits. Find them.

ModelScope is a scientific workspace for exploring where a configured model increasingly disagrees with observations. Milestone 1 is a Hooke's law vertical slice, built from scratch in this repository. All scientific calculations run in deterministic TypeScript; no AI service is required.

The engine, editable table, linked plots, and inspectable evidence form a complete Hooke's law workflow. See [the methodology](docs/methodology.md) for alternatives considered, calculations, the selected method, and its limitations.

## Why validity matters

A high R² can hide a systematic pattern. Students can inspect the actual force measurements, compare a configured line, examine residuals, and locate a candidate transition region without treating an equation as universal. A statistical diagnostic does not establish a physical mechanism.

## What works

- Editable 24-row synthetic spring example and a noisy linear control; add, remove, and reset observations.
- Through-origin Hooke's law or a line with fitted force offset; configurable assumed noise floor.
- Deterministic fits, predictions, residuals, RMSE, centered R², and penalized transition comparison.
- Aligned force and residual plots, sampled sensitivity region, exact point values, and linked selection from findings, graph points, evidence rows, and the input table.
- Stale snapshot labels after edits, blocked stale export, runtime validation, and explicit rerun.
- Inspectable methodology, caveats, raw evidence, normalized residuals, and full JSON export.
- Desktop analysis workspace and a mobile stack with charts first, then editable table and diagnostics.

## Architecture and deterministic philosophy

Next.js App Router, React, strict TypeScript, Tailwind's CSS pipeline with deliberately authored workspace styling, Recharts, Zod, and Vitest. All authoritative science lives in pure functions under `src/lib/analysis`. The experiment definition and synthetic measurements live under `src/lib/experiments`. Components format and link structured findings; they do not create scientific findings from prose. There is no database, authentication, backend science service, AI call, external font, or required API key.

`ExplanationProvider` reserves an interface for a future optional explanation service consuming computed evidence. Natural-language configuration parsing is not implemented; any future proposed configuration needs user confirmation before use.

## Transition method

Compare a single configured line against continuous hinge candidates using the same complete data. Penalize additional coefficients, the searched knee, and candidate search. Require at least 10 criterion units of improvement plus four consecutive same-sign post-knee reference residuals beyond twice the early noise scale. Require at least 14 observations and six on each side. The candidate region combines near-best knees and measurement spacing; it is a sensitivity range, not a confidence interval. These are transparent prototype heuristics, not statistically calibrated probabilities. If evidence is weak or sample size insufficient, the engine says no clear transition is supported.

## Development

Use Node.js 24 LTS and npm (the verified environment used Node 24.14.1). Runtime and tool versions are recorded in the lockfile.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Validation commands: `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.

Production locally:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

If a production server is already running, stop it before rebuilding, then restart to load the new build.

## Tests and verification

The scientific suite covers analytical regression results, predictions, residual signs and scale, independently calculated RMSE/R², perfect linear data, sustained curved departure, an exact known hinge, fixed noisy controls, 40 deterministic noisy-line fixtures, an isolated outlier, softening with an offset, malformed input, small samples, input immutability, and edited measurements. See [verification notes](docs/verification.md) for executed checks and browser observations. See [the exact file inventory](docs/files.md).

## Remaining limitations

Synthetic educational data, one transition, ordinary least squares, no causal inference, no calibrated false-positive rate, no confidence intervals, no x uncertainty, no weighted fit, and no repeated-extension support. A gradual curve's fitted hinge can lag the actual generating onset. Outliers can suppress real-transition detection. “No clear transition” does not mean adequate. Editing is in-memory; reload resets it, and JSON export is the persistence option. CSV import, additional experiments, and AI are intentionally deferred. No deployment has been performed.

The compatible Next.js lint stack currently requires ESLint 9 because bundled plugins do not declare ESLint 10 support. Its glob-parser dependency has an unpatched advisory; see the verification notes. Do not feed untrusted path patterns into the development linter.
