# ModelScope

Equations have limits. Find them.

ModelScope is a deterministic scientific workspace for inspecting where a configured model increasingly disagrees with measurements. Milestone 2 extends the verified Hooke's-law implementation to four built-in experiment families, using the same evidence architecture. No AI, accounts, database, or deployment is involved.

| Demonstration | Configured baseline | Input → response |
| --- | --- | --- |
| Spring — Hooke's Law | F = kx by default; optional F = kx + c | Extension / m → force / N |
| Pendulum — Small-Angle Approximation | T₀ = 2π√(L/g), fixed L = 1 m, g = 9.80665 m/s² | Initial angle / degrees → period / s |
| Beer–Lambert — Concentration Response | A = mc + b, fitted intercept by default | Concentration / mmol/L → dimensionless absorbance |
| Sensor Calibration — Linear Range | V = mQ + b, fitted intercept by default | Reference force / N → output / V |

Every demonstration and control is labeled **Synthetic educational dataset**. Data provides reproducible, controlled examples; it is not laboratory validation. See [experiment notes](docs/experiments.md) for generation methods, questions, assumptions, and limits.

## Scientific workflow

Switching experiments loads the correct data, model configuration, units, and assumptions and immediately recomputes evidence. Edit measurements, inspect linked response/residual plots, select findings or candidate-profile rows, and rerun to replace stale evidence. Both linear intercept modes remain available where configured; pendulum theory is fixed rather than fitted to the observed periods.

The concise model comparison expands into numerical evidence, the complete candidate score profile, influence results, and supporting measurements. Transition shading is restrained and never marks later measurements as invalid. Keyboard marker focus survives selection, and mobile controls retain accessible target sizes.

Results distinguish **supported**, **ambiguous**, **none**, and **insufficient** evidence. A high R² or a no-transition result does not establish physical correctness. Only supported results have a transition sensitivity range, which is not a confidence interval.

## Analysis architecture

Pure TypeScript functions under `src/lib/analysis` separate baseline fitting/prediction (`models.ts`) from candidate search, penalized comparison, sustained residuals, and influence diagnostics. This supports empirical lines and one fixed theoretical constant; it is deliberately not an arbitrary-model framework. Typed experiment definitions provide metadata, model identity, defaults, variables, parameters, assumptions and datasets. Generators are separate from detection. Components display and link computed evidence without inventing findings.

The detector compares the configured baseline with a continuous hinge alternative on the same complete observations. It uses a dimensionless criterion with baseline-specific fitted-parameter counts, two extra hinge/search parameters, and a candidate-search penalty. Require improvement ≥10, four consecutive same-sign deviations beyond twice the early residual scale, and support surviving a diagnostic omission of the largest absolute baseline residual with the same deviation direction. Reported analysis retains all observations. Require 14 measurements with six at/below and six above each candidate. [Methodology](docs/methodology.md) gives exact formulas and transferability limits.

The UI exports one common JSON schema **1.1.0**, method **1.2.0**, for all four families: scientific question, variable identities and units, configured baseline and parameter treatments, assumptions, provenance including edits, original observations, complete numerical analysis, comparisons, candidate profile, outcome, sensitivity, influence evidence, findings and caveats. The legacy schema 1.0 spring export API remains available for compatibility; new experiments use the common experiment-aware API.

## Development and verification

Next.js App Router, React, strict TypeScript, authored workspace CSS through Tailwind's pipeline, Recharts, Zod, and Vitest. Use Node 24 LTS and npm (verified Node 24.14.1). No new dependency was needed for this milestone.

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

Stop an existing production server before rebuilding and restart it afterward. The suite retains all original 49 tests and adds cross-family controls, departures, contamination, ambiguous states, predictions, metadata, exports, switching, and exact pre-generalization Hooke numerical snapshots. Executed results are recorded in [verification notes](docs/verification.md); [file inventory](docs/files.md) lists repository artifacts.

## Limits

Four built-in families, one hinge, ordinary least squares, fixed theoretical pendulum parameters, assumed response noise scales, no calibrated false-positive rate, no confidence intervals or physical-mechanism inference. A hinge can lag a smooth departure; an influence diagnostic can withhold real support. Measurement-input uncertainty, heteroscedastic weighting and repeated independent-variable values are not supported. Canonical units are explicit; automatic unit conversion is not implemented.

Edits are in memory; exports provide a record, and reload resets the workspace. AI, CSV import, arbitrary custom experiments, persistence, authentication, collaboration, and deployment remain deferred.

The production dependency audit is recorded in verification notes. The existing development lint chain retains an unpatched braces advisory; no forced breaking upgrade was applied.
