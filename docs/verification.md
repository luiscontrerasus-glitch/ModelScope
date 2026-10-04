# Milestone 1.5 verification

Executed on 2026-10-04 in the existing repository. These checks verify software behavior and illustrative fixtures, not laboratory validity or calibrated statistical error rates.

## Final checks

| Command | Result after final code changes |
| --- | --- |
| `npm test` | Passed: 2 files, 49 tests |
| `npm run typecheck` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0, no reported warnings/errors |
| `npm run build` | Passed, exit 0; production Webpack compilation, TypeScript, static pages, and traces |

Node 24.14.1; production served locally on 127.0.0.1:3000. Approved process permissions were needed for worker spawning. No deployment or AI integration was performed.

## Scientific audit

Retained the existing 22 tests and added 27 adversarial/export tests. Sweeps exercise 100 fixed-seed Gaussian-noisy lines (50 seeds in each intercept mode), 288 isolated disturbances (24 positions × six signed magnitudes × two modes), and 184 adjacent disturbances (23 positions × four sign combinations × two modes). None of the disturbance fixtures supported a transition. This does not estimate a population false-positive rate.

Additional checks cover perfect lines, sustained progressive departure, positive/negative sharp hinges, samples below 14, influence-sensitive ambiguity, strict same-sign residual persistence, independently recomputed errors/penalties, exact near-best candidate lists and sampling neighbors, input preservation, and export round trips. Compatible extension/force unit scaling and force-noise-floor scaling preserve decisions and adjusted improvements within numerical tolerance in both intercept modes. The app itself still accepts SI input only.

The built-in fixed-zero UI example selects 0.080 m with a 0.075–0.085 m sensitivity range, improvement 84.020585, and a passing diagnostic omission of M24. Comparison SSE is 6.1803 versus 0.1155 N²; RMSE is 0.5075 versus 0.0694 N. These are computed fixture outputs, not hard-coded decisions. The raw profile has 13 candidates and only 0.080 m within 2 criterion units.

## Actual production-browser verification

Used the in-app browser at desktop 1440 × 1000 and mobile 390 × 844, inspecting full-page screenshots of both force and residual charts, typography, hierarchy, numerical formatting, and restrained sensitivity shading. Mobile stacks charts, data, then evidence. Neither viewport had document horizontal overflow. Mobile select/remove row targets measured at least 44 × 44 px; evidence summaries are at least 44 px high. Temporary viewport overrides were reset.

Executed interactions:

- Selected M08 from the table: one corresponding observation highlighted in each plot.
- Selected M20 in the force plot: selected row and both plotted observations updated.
- Selected sustained disagreement: all eight supporting rows and sixteen plotted observations highlighted.
- Expanded the 13-row candidate profile; selecting 0.080 selected M16. Supporting-measurement M17 selected its exact values.
- Direct visible point and diagnostic clicks left window scrollY unchanged at 186.857 px. Only the data pane scrolled. Locator automation itself centers targets before clicking; direct clicks separated that behavior from app behavior.
- Space and Enter activated plot markers. After the focus fix, the active marker retained its accessible label and visible keyboard focus through rerendering.
- Edited selected M17 force from 3.156 to 2.720 N: selections cleared, old detail disappeared, export disabled, and rerun replaced evidence. Its residual changed from +0.3469 to −0.0747 N and the candidate moved from 0.080 to 0.085 m.
- Raised assumed noise floor to 10 N: ambiguous evidence, complete-data reference, no transition shading, no sensitivity range.
- Entered a 14-row sharp-departure fixture through actual controls: initial comparison passed (19.2262), but diagnostic omission of M14 reduced improvement to 8.6977. UI and downloaded export reported ambiguous, with null transition range and failed influence check. All 14 original observations remained.
- Fitted-offset linear control reported none; fitted-offset progressive example reported supported with an explicitly fitted reference offset.
- Repeated row, point, diagnostic, candidate-profile and download interactions at mobile size. No overflow appeared when evidence expanded.
- Final browser warning/error log query returned an empty list.

Saved ignored proof files under `browser-artifacts/milestone-1-5-desktop.jpg` and `browser-artifacts/milestone-1-5-mobile.jpg`; screenshots are not committed.

## Downloaded JSON verification

Clicked the actual export control and independently parsed the downloaded files in Downloads. Schema 1.0.0 and method 1.1.0 included experiment identities, units, configured intercept, original observations, full fits/points, candidate profile, comparisons, findings, sensitivity, and influence result.

Verified baseline supported export, edited-and-rerun export (M17 = 2.720 N and revised knee), high-noise ambiguous export (null estimate/range/sensitivity), influence-sensitive ambiguous export (14 original rows and failed M14 omission), fitted-offset supported export, and final mobile export. Unit/schema/method metadata and computed values survived JSON parsing. No unavailable uncertainty statistics were added.

## Dependency advisory inspection

Network-backed `npm audit --json` reported five high-severity entries in one development chain: eslint-config-next 16.3.8 → @next/eslint-plugin-next 16.3.8 → fast-glob 3.3.1 → micromatch 4.0.8 → braces 3.0.3. `npm explain braces` confirms the dev dependency. `npm audit --omit=dev --json` reported zero production vulnerabilities.

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists stack exhaustion from malicious deeply nested glob patterns and had no patched braces release when checked. No safe compatible update resolving this chain was available; a forced lint/framework downgrade was not applied. This is not a clean full audit.

Final production trace files (`.next/**/*.nft.json`) and shipped browser JavaScript (`.next/static/**/*.js`) had zero matches for braces, micromatch, fast-glob, or eslint-config-next. Repository source does not route measurement input into glob parsing. The reported issue therefore concerns local development lint tooling, with no identified experiment-data path into the vulnerable parser or inclusion in the shipped production code. These checks are not a general security certification. Avoid untrusted glob patterns in tooling.

Automatic Next.js agent-file generation is disabled in next.config.ts so local dev does not add generated instruction files to the working tree. No generated instruction files, screenshots, credentials, or debug files are committed.

---

# Historical Milestone 1 verification

The following section records the earlier milestone and its 22-test implementation, before the 1.5 algorithm and UI changes above.


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
