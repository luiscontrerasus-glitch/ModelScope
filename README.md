# ModelScope

Equations have limits. Find them.

ModelScope is a deterministic scientific workspace for inspecting where a configured model increasingly disagrees with measurements. Four built-in experiments and user-supplied CSV, pasted tables and manual measurements share the same evidence architecture. Milestone 4 adds optional, bounded Gemini setup proposals and evidence explanations; deterministic mathematics remains authoritative. No accounts, database, or deployment is involved.

| Demonstration | Configured baseline | Input → response |
| --- | --- | --- |
| Spring — Hooke's Law | F = kx by default; optional F = kx + c | Extension / m → force / N |
| Pendulum — Small-Angle Approximation | T₀ = 2π√(L/g), fixed L = 1 m, g = 9.80665 m/s² | Initial angle / degrees → period / s |
| Beer–Lambert — Concentration Response | A = mc + b, fitted intercept by default | Concentration / mmol/L → dimensionless absorbance |
| Sensor Calibration — Linear Range | V = mQ + b, fitted intercept by default | Reference force / N → output / V |

Every demonstration and control is labeled **Synthetic educational dataset**. Data provides reproducible, controlled examples; it is not laboratory validation. See [experiment notes](docs/experiments.md) for generation methods, questions, assumptions, and limits.

## Analyze your data

Choose **Analyze your data** in the experiment selector. Upload a local comma-separated CSV with headers, paste CSV/TSV from a spreadsheet, or enter measurements manually. Inspect the raw preview, explicitly map X/Y, confirm names and units, select Y = mX + b, Y = mX, or user-supplied fixed Y = C, and review before running. Custom data enters the same linked scientific workspace. A separate synthetic temperature-response CSV demonstrates the workflow.

Unknown units stay unspecified, distinct from a declared unitless quantity. Unit strings are labels only; no conversions are guessed. A positive response reference scale is required and has no silent default: users must justify it from prior knowledge, measurement resolution or an explicit tolerance. If unknown, pause and investigate. Validation reports malformed records, mapped-cell errors, repeated X, unsupported numerical ranges and insufficient coverage. Blank records require explicit exclusion; meaningful rows are never silently dropped. Original source values/order and stable IDs are preserved.

Full datasets, parsing and calculations stay in browser memory. Optional AI setup sends only a description and headers; explanation sends a selected deterministic finding and summary statistics. No raw measurements are uploaded. These explicit actions share limited context with Google Gemini, whose free-tier inputs may be used to improve its products. Edits pause evidence and hide stale custom plots until a valid rerun. Custom export schema 1.2.0/method 1.3.0 records user provenance, input method, filename basename, mappings, settings, immutable source records and current analyzed observations alongside the shared evidence. Built-in and legacy exports retain their prior versions. See [custom-data guidance](docs/custom-data.md) for formats, limits, uncertainty handling and interpretation.

## Responsible AI design

ModelScope uses AI only where natural-language interpretation is useful. The scientific analysis itself is deterministic and reproducible. Gemini may propose a supported configuration or explain existing evidence, but it cannot create or change ModelScope's mathematical findings.

Custom setup offers **Optional AI · describe your experiment**. Review **AI PROPOSED SETUP**, explicitly confirm into the normal form, enter your own response scale, and separately run analysis. Findings offer **Explain evidence** on demand, with **AI EXPLANATION** separated from **DETECTED BY MODELSCOPE** evidence. Editing, rerunning and switching discard old explanations. AI failure never removes scientific evidence or data.

Default server model: `gemini-3.5-flash-lite` via `@google/genai` 2.27.0, verified against current official [model capabilities](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) and [free-tier pricing](https://ai.google.dev/gemini-api/docs/pricing) on 2026-10-04. Optional setup uses `GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_FREE_TIER_CONFIRMED`; see placeholder `.env.example`. Never enable billing. The server requires explicit confirmation of an unbilled project and permits only documented free-tier models. All manual and deterministic features work without a key. Live provider smoke tests remain pending because no key is configured. See [AI architecture, privacy and exact local setup](docs/ai.md).

## Scientific workflow

Switching experiments loads the correct data, model configuration, units, and assumptions and immediately recomputes evidence. Edit measurements, inspect linked response/residual plots, select findings or candidate-profile rows, and rerun to replace stale evidence. Both linear intercept modes remain available where configured; pendulum theory is fixed rather than fitted to the observed periods.

The concise model comparison expands into numerical evidence, the complete candidate score profile, influence results, and supporting measurements. Transition shading is restrained and never marks later measurements as invalid. Keyboard marker focus survives selection, and mobile controls retain accessible target sizes.

Results distinguish **supported**, **ambiguous**, **none**, and **insufficient** evidence. A high R² or a no-transition result does not establish physical correctness. Only supported results have a transition sensitivity range, which is not a confidence interval.

## Analysis architecture

Pure TypeScript functions under `src/lib/analysis` separate baseline fitting/prediction (`models.ts`) from candidate search, penalized comparison, sustained residuals, and influence diagnostics. This supports empirical lines and one fixed theoretical constant; it is deliberately not an arbitrary-model framework. Typed experiment definitions provide metadata, model identity, defaults, variables, parameters, assumptions and datasets. Generators are separate from detection. Components display and link computed evidence without inventing findings.

The detector compares the configured baseline with a continuous hinge alternative on the same complete observations. It uses a dimensionless criterion with baseline-specific fitted-parameter counts, two extra hinge/search parameters, and a candidate-search penalty. Require improvement ≥10, four consecutive same-sign deviations beyond twice the early residual scale, and support surviving a diagnostic omission of the largest absolute baseline residual with the same deviation direction. Reported analysis retains all observations. Require 14 measurements with six at/below and six above each candidate. [Methodology](docs/methodology.md) gives exact formulas and transferability limits.

The UI exports one common JSON schema **1.1.0**, method **1.2.0**, for all four families: scientific question, variable identities and units, configured baseline and parameter treatments, assumptions, provenance including edits, original observations, complete numerical analysis, comparisons, candidate profile, outcome, sensitivity, influence evidence, findings and caveats. The legacy schema 1.0 spring export API remains available for compatibility; new experiments use the common experiment-aware API.

## Development and verification

Next.js App Router, React, strict TypeScript, authored workspace CSS through Tailwind's pipeline, Recharts, Zod, Papa Parse and Vitest. Use Node 24 LTS and npm (verified Node 24.14.1). The official Google GenAI SDK is server-only. Testing Library and jsdom are development-only DOM test tools.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Checks:

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Stop an existing production server before rebuilding and restart it afterward. The suite preserves all 173 tests from Milestones 1-3 and adds 97 AI contract, provider-boundary and client interaction tests (270 total). Normal tests never call Gemini. Exact pre-generalization Hooke numerical snapshots remain unchanged. Executed results are recorded in [verification notes](docs/verification.md); [file inventory](docs/files.md) lists repository artifacts.

## Limits

Four built-in families and three explicit custom baselines, one hinge, ordinary least squares, fixed theoretical parameters, assumed response scales, no calibrated false-positive rate, no confidence intervals or physical-mechanism inference. A hinge can lag a smooth departure; an influence diagnostic can withhold real support. Measurement-input uncertainty, heteroscedastic weighting and repeated independent-variable values are not supported. Built-in canonical units are explicit; custom labels never trigger automatic conversion.

Edits are in memory; exports provide a record, and reload resets the workspace. Arbitrary equations, XLSX/PDF import, persistence, authentication, collaboration, and deployment remain deferred.

The production dependency audit is recorded in verification notes. The existing development lint chain retains an unpatched braces advisory; no forced breaking upgrade was applied.
