# Approved redesign release candidate

Verified October 5, 2026 (America/New_York) from `modelscope-elite-redesign`, starting at `667366616ac29beae00190afd00ca5c4eecdb4e0`. This integration adds no features or further visual changes. Deployment remains deferred.

## Pre-merge verification

| Check | Result |
|---|---|
| `npm test` | 306 tests pass across 10 files |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass; production page and API routes generated |
| `npm audit --omit=dev` | Pass; zero vulnerabilities |

Fetched `origin/main` and confirmed local `main` matches it at `dd83b26`. The redesign has 24 incremental milestone commits above that base before this release documentation/artifact cleanup. It will be integrated with a regular merge commit, preserving both parents and all milestone history.

The comparison against that base contains no changes to `src/lib`, `src/app/api`, `public/datasets`, `public/examples`, or `docs/methodology.md`. Regression, detection, datasets, export schemas, AI contracts, and scientific methodology remain unchanged. Dependency additions support Three.js scenes and typography.

## Production browser smoke

Tested the production server, not the development server, at desktop 1440px and mobile 390px.

| Area | Verified behavior |
|---|---|
| Home | Hero, compact Explore teaser, dark thesis, calm conceptual visualization; no simulation canvas or simulation controls. No overlap or horizontal page overflow. |
| Explore | All four 3D systems render. Sticky model index selects the correct section. Each direct analysis link opens the matching experiment, without stale model state. Fast scrolling preserves an instrument poster while scenes initialize; actual completed frames crossfade into the scene. Only centered motion runs; at most two canvases initialize/render. |
| Motion/loading | Spring loading, pendulum oscillation, optical sweep, and sensor load behavior remain distinct. Reviewed the four committed normal/fast desktop/mobile recordings and their boundary frames. No 2D placeholder flash, empty scene flash, doubled moving instrument, or scene-box shift observed. |
| Spring analysis | Main graph and compact result report the unchanged supported transition near 0.080m, sensitivity 0.075–0.085m, improvement 84.02. Residuals, Model comparison, and Evidence tabs work. |
| Measurements | Collapsed initially; Open data expands the editor. Selecting graph point M23 highlights table M23; selecting table M01 updates the graph readout to x=0.0050m, F=0.1700N, prediction=0.1652N, residual=0.0048N. Closing the editor preserves the selection. |
| Full Evidence | Detailed original statistics, findings, supporting measurements, and optional explanation remain available. Desktop and mobile modal layouts fit the viewport; closing returns to analysis. |
| JSON export | Clicked production Export and inspected the file saved by the browser. It parses as schema 1.1.0 with experiment, units, configured model, methodology, assumptions, caveats, provenance, original observations, and analysis. No credential pattern present. The in-app download-event API times out, but the actual saved file was verified. |
| Custom data | Import opens configuration. The supplied synthetic temperature example loads 24 records; explicit Temperature/Response mapping and 0.05 reference scale enable analysis. Result is supported near 35, sensitivity 32–38, improvement 76.83 with unspecified units until the user declares them. |
| No-key AI | No Gemini key was configured. Explain evidence shows its unavailable status and retry/dismiss controls. Deterministic analysis remains usable; no provider request or key exposure is required. |
| Methodology | Complete page, six steps, limitations, full-methodology link, and all three interactive detector challenges. One outlier and ordinary noise return none; sustained deviation returns supported with improvement 84.02. |
| Mobile | Home, four Explore systems, analysis, and Full Evidence checked at 390px. Explore order is title → instrument → readouts → analysis. Analysis puts the result before the graph, tabs, and data disclosure. No text overlap or horizontal page overflow observed. |

No console errors observed. The existing upstream Three.js `Clock` deprecation warning remains; it does not affect scene rendering. These are browser-viewport checks, not physical-device GPU or network-throttling certification.

[Final production Spring analysis capture](release-spring-analysis.jpg).

## Retained release artifacts

- Twelve Home/Explore desktop/mobile captures in [exhibition-screenshots](exhibition-screenshots/), covering Home, Explore intro, and all four systems at 1440px and 390px.
- Ten final workspace/Explore captures in [workspace-screenshots](workspace-screenshots/), including desktop/mobile default, measurements, Full Evidence, desktop Residuals/Model comparison, and actual Spring/Sensor renders.
- Two unchanged Methodology captures in [polish-screenshots](polish-screenshots/07-methodology.jpg) and [detector challenge](polish-screenshots/13-methodology-challenge.jpg).
- One fresh release smoke screenshot, four actual animated [scroll recordings](workspace-screenshots/recordings/), their timestamp manifests, and all six milestone reports/audit data.
- All twelve production instrument posters remain in `public/instruments`; these are runtime assets.

Removed 71 redundant or superseded review JPEGs from the current checkout: 39 old-layout captures, 27 intermediate responsive captures, one duplicate Spring capture, and four recording contact sheets. This removes 5.44 MiB from the current public checkout. Git history is preserved, so existing repository history/download size is not rewritten. Historical report links now target the exact preserved revision `667366616ac29beae00190afd00ca5c4eecdb4e0`; no documentation reference is discarded. The current redesign artifact set has 25 JPEGs and four animated recordings.

The milestone reports describe their original review dates and layouts. Use this report and the retained final captures for the integrated release candidate.

## Integration

Post-merge checks and the merge revision are recorded below once the history-preserving integration is complete. No deployment is authorized in this pass.
