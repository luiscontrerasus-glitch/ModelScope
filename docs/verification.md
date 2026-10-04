# Milestone 1 verification

Verification performed on 2026-10-04. This records software checks and illustrative fixtures, not scientific validation.

## Final command results

| Command | Executed result |
| --- | --- |
| `npm test` | Passed: 1 file, 22 tests |
| `npm run typecheck` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0; no reported warnings or errors |
| `npm run build` | Passed, exit 0; compiled and prerendered `/` and `/_not-found` |

The final build used Webpack and performed its own TypeScript check. On this host, sandbox restrictions initially blocked Node worker spawning; the tests and build were rerun with approved process permissions. Production was served only on `127.0.0.1:3000` for inspection. No deployment was attempted.

## Scientific fixtures

22 tests cover regression, residuals, independently known metric values, input errors, insufficient samples, clean and noisy controls, sustained departure, an exact hinge, single-outlier resistance, an offset/softening case, edits, immutable inputs, and linked evidence IDs. A single test additionally exercises 40 fixed-seed noisy linear fixtures; none supported a transition. This small fixture suite does not establish a population false-positive rate.

The progressive example produced a candidate knee of 0.080 m, sensitivity region 0.075–0.085 m, criterion improvement 84.0206, and eight measurements in a sustained residual run. The reference stiffness was 33.0480 N m⁻¹, with reference RMSE 0.0610 N and centered R² 0.9940. Complete-data RMSE was 0.5075 N. These values are outputs computed from the fixture; they are not hard-coded app results.

## Production-browser checks

Using the Codex in-app browser against the local production server:

- Ran analysis and inspected the actual force and residual charts.
- Selected the sustained finding: eight table rows and sixteen plot points (eight per plot) highlighted.
- Clicked a graph point: one table row and one point per graph highlighted.
- Used Space to activate a graph point via keyboard.
- Edited the final force to 3.840 N: stale results were clearly marked, export disabled, and rerun recalculated the result to no clear transition with a changed residual.
- Cleared a required force field: analysis reported a validation error.
- Switched to the noisy linear control: no clear transition and no candidate-region overlay.
- Inspected the 390 × 844 mobile viewport: charts stacked before data and findings; no document horizontal overflow; scrollable table and inspectable evidence retained.
- Read browser warning/error logs: no captured warnings or errors during those interactions.
- Verified the final production build's human-readable statistic labels and persistent selected-point readout.
- Clicked JSON export. The browser automation download-event observer timed out, but the actual `Downloads/modelscope-analysis.json` file was created. Parsed that file independently: 24 observations, three findings, supported transition, knee 0.080 m and region 0.075–0.085 m.

## Dependency notes

Network-backed npm auditing reported five high-severity entries in one **development-only** dependency chain: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) had no patched braces release listed when checked. Its issue is stack exhaustion from malicious deeply nested glob patterns. The linter uses repository-owned patterns and does not process uploaded experiment data. No forceful framework downgrade or fabricated clean audit is claimed.

TypeScript 7 was incompatible with the installed lint parser; TypeScript 6 was selected. ESLint 10 had unmet peer ranges in bundled lint plugins, so ESLint 9 was retained for reproducible installs. Node.js 24.14.1 was used.
