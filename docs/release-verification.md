# Milestone 5 release verification

## Baseline and scope

Started from clean `main` at `cb6ed33b3c244c8b19820404ad57099d19447316`. Before changes: 270 tests across six files, typecheck, lint, production build, and production dependency audit passed. No remote existed. The actual production app was inspected before refinement. Existing scientific methodology, models, and numerical snapshots remain unchanged.

Release changes refine the opening pitch, selector domain grouping, supporting-text contrast, CSV control styling, mobile touch targets, and validation associations. They add submission assets and correct an actual AI route origin-normalization bug. No new product feature or scientific model was added.

## Origin-guard correction

Next's Node adapter represented local request URLs using `localhost`, while browsers used `127.0.0.1`. The previous comparison incorrectly returned 403 for a legitimate application action. The guard now canonicalizes the server-received Host authority and explicitly replaces both hostname and port. Malformed authorities fail closed. A conflicting Host on a non-local request URL is rejected. Forwarded-host headers are ignored. Only the Vercel runtime flag enables its TLS-termination scheme header; other deployments use the request URL scheme and must preserve the original authority/scheme at their proxy.

Origin must exactly equal the expected canonical origin when present. Missing Origin remains intentional for bounded non-browser requests: this is an origin guard, not authentication. Cross-site fetch metadata is rejected even without Origin. Schemas, throttling, body/output bounds, no-key behavior, and provider error sanitization remain active.

Regression coverage includes localhost, 127.0.0.1, a production hostname, Vercel TLS termination, internal-port removal, mismatched/opaque/empty/path-bearing Origin, malformed/conflicting Host, untrusted forwarded headers, missing-Origin behavior, and cross-site metadata. An added Vercel test caught the retained internal-port issue before release; it was fixed rather than weakening the test.

## Final command results

- `npm test`: **290 passed**, six files.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; corrected production build completed with static homepage and two dynamic AI routes.
- `npm audit --omit=dev --json`: **zero vulnerabilities**, 101 production dependencies, 619 total dependency entries.

Development lint-chain advisories remain separate from production: five high advisories, including the existing braces chain. No forced breaking dependency upgrade was applied. Historical milestone records remain in [verification.md](verification.md).

## Production browser coverage

Before the final origin correction, actual production desktop verification covered the landing screen, all four demonstrations, linked plots/findings, expanded evidence/candidate profile, custom temperature-response configuration and analysis, JSON export, and graceful no-key UI states. At 390px, Spring and pendulum, custom analysis/export, edit/validation/rerun, and no-key setup behavior were exercised. There was no document-wide horizontal overflow. Representative console inspection returned no warnings/errors.

Final post-fix production recheck passed: homepage, Spring, pendulum, custom temperature-response analysis, desktop/mobile JSON export, and both no-key AI actions. Browser network inspection confirmed `/api/ai/setup` and `/api/ai/explain` return 503 for legitimate 127.0.0.1 origins, not origin rejection. Direct cross-origin checks returned 403; six same-origin no-key attempts returned 503 and the seventh returned 429. At 390px the selector measured 44px, measurement validation association was present, and document width stayed within the viewport. Final browser console inspection returned no warnings/errors. No public deployment has been tested.

## Accessibility and performance

Supporting muted text contrast is approximately 5.97:1 on the surface and 5.54:1 on the background. Focus outlines, named measurement/chart controls, non-color plot legends, explicit chart descriptions, and reduced-motion handling remain. Noise and measurement inputs link to their validation message. Mobile selects and row controls retain 44px targets. This is a practical inspection, not a complete screen-reader conformance certification.

The earlier release build linked seven JavaScript resources in its document, approximately 1134 KiB raw / 340 KiB gzip estimate. All emitted chunks totaled approximately 1398 KiB raw / 422 KiB compressed estimate; that total is not the initial load. The largest chunk was approximately 502 KiB raw. Local document responses measured 53.8ms cold and 5.7ms warm in two samples. These are local server timings, not browser rendering, Lighthouse, or public network scores. Plots do not animate; detection runs on explicit analysis actions. No risky bundle architecture rewrite was made.

## Security and privacy

The full retained text history scan found no secret-pattern matches and no unexpected environment-file entries. Only placeholder `.env.example` is tracked; no node_modules, build output, or browser-debug artifact directory is tracked. Public-facing documentation uses relative repository links and no local absolute paths. A Windows path in a custom-data test is an intentional synthetic path-stripping fixture.

Client chunks contain no `GEMINI_API_KEY`, billing-confirmation variable, `GoogleGenAI`, or provider endpoint. Raw CSV parsing and measurement analysis stay local. Inspected desktop/mobile exports were valid JSON with the expected built-in/custom schema and no absolute file path. AI context sharing and free-tier product-improvement terms are disclosed in UI and README. The internal proposal screenshot is visibly mocked and excluded from submission.

## External delivery and honest limitations

Public repository creation was confirmed: [ModelScope](https://github.com/luiscontrerasus-glitch/ModelScope). The complete 18-commit release history was pushed to `main`; GitHub confirmed public visibility and commit `b8d1328aa4ceaba1557677955eb678062b87ebab` matched the local release-package commit, and the original root was retrievable. Subsequent delivery-status edits are documentation only. No history has been rewritten or force-pushed. Vercel credentials are absent; deployment and public browser verification are **PENDING USER ACTION**. Run `npx vercel login`, using the personal account that will own the free Hobby project.

Gemini live smoke: **PENDING — no live key configured**. Default model remains `gemini-3.5-flash-lite`; official model capability and free-tier documentation were checked October 4. No live inference is claimed. No release tag is created while external verification remains pending.

Solo participant: **Luis Contreras**. Event-specific drafts, architecture, actual screenshots, and the 2:45 recording plan are prepared. Video recording/upload and manual Devpost submission remain user actions. Cross-hackathon permission and participant eligibility are not assumed.

## Release commits

- `b711539`: production origin validation and regression tests.
- `ef94a84`: visual and accessibility refinements.
- `b8d1328`: solo-participant judging package, diagram, and actual screenshots.
- Delivery-status documentation follows these commits; inspect public `main` for its latest hash.
