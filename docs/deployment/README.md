# Public production deployment verification

Verified October 6, 2026. Public URL: **https://modelscope-ten.vercel.app**. Project: `luis-0239/modelscope`, on the verified **Hobby** plan. No paid plan, billing activation, paid add-on, or scientific change was introduced.

## Source and deployment

The approved main release is `abe17cf590c81cade41b9afa3dab95b4fed52599`. Deployment preparation commit `c8275f81766e88e8e3ef8affdc5aaaa7aa986406` adds only `.vercel/` to the ignore file. No application code, API, dependency, dataset, export, AI contract, or methodology changes were needed. The final documentation commit records this review and is deployed separately without changing runtime behavior.

Vercel detected Next.js automatically, used Node 24.x, ran the existing `npm run build` / `next build --webpack`, and completed TypeScript, static generation, API bundling, and deployment successfully. The ordinary Hobby build machine was selected by the plan default. Builds did not run on a paid upgraded machine.

The first deployment established the public alias without a Gemini key. After the user privately added the key, production was redeployed as [`dpl_3YQW2kH6yr4WCYEDfw3Eu2XHu3Vc`](https://vercel.com/luis-0239/modelscope/3YQW2kH6yr4WCYEDfw3Eu2XHu3Vc), READY, and the checks below were performed on the public alias. The final documentation deployment retains the same application and Production variables; the two live requests are not repeated.

GitHub auto-deployment linking is not configured: Vercel reported a missing GitHub login connection. CLI deployment works, the existing repository/history remains intact, and the public production alias requires no Vercel login. GitHub linking is optional for future push-triggered deployments.

## Gemini configuration and live verification

| Production variable | Status |
|---|---|
| `GEMINI_API_KEY` | User added privately; Vercel reports Hidden, Secret, Production only. No value was printed, committed, or retrieved from Vercel. |
| `GEMINI_MODEL` | Config: `gemini-3.5-flash-lite` |
| `GEMINI_FREE_TIER_CONFIRMED` | Config: `true`, as requested by the operator |

Automatic approval review blocked the proposed CLI transfer of the local secret. No secret was transmitted by that command; the user completed the private dashboard step instead. No credentials were requested in chat. Local `.env.local` and `.vercel/project.json` are ignored and untracked.

Exactly **one live Setup request and one live Explain request** were made after the secret-backed deployment was READY. No retry or additional live AI request was made during this verification.

| Request | Actual production result | Boundary verification |
|---|---|---|
| Setup | HTTP 200; valid Gemini linear-offset proposal with explicit Temperature/Response columns and °C/V units | Network body contained only `description` and `headers`. Before confirmation, both mapped-column controls and the reference-scale control were blank. Confirm proposal into form was required; reference scale remained a manual choice. |
| Explain | HTTP 200; valid Gemini explanation and inspection suggestions | Network body contained `findingId`, `analysisVersion`, and a 1,206-character context payload with finding/model/status/summary/statistics/caveats; no raw observations. Returned finding/version bindings matched exactly. Optional prose did not change the deterministic result. |

The unchanged Spring engine still reports a supported transition near **0.080m**, sensitivity **0.075–0.085m**, and improvement **84.02** after explanation. Gemini neither chooses the outcome nor changes scientific findings. The custom synthetic example, after confirming labels and explicitly supplying a 0.05V response scale, reports the unchanged result near **35°C**, sensitivity **32–38°C**, improvement **76.83**.

## Public browser verification

| Area | Result |
|---|---|
| Home | Actual public hero, compact Explore teaser, calm conceptual visuals; no development indicator or 3D simulation controls. |
| Explore | Spring, Pendulum, Beer–Lambert, and Sensor completed their actual 3D render-readiness signals. Posters handed off to the rendered scenes without an observed blank or 2D flash. Model index and direct Spring analysis link work. Ambient Spring readout changes while its slider stays stationary; pendulum amplitude remains fixed at the selected setting. |
| Analyze | Main graph, unchanged compact result, Residuals, Model comparison, Evidence, and Full Evidence work. Expanded measurement selection is linked: plot M23 selects table M23. Data can be closed again. |
| Export | Public Export saved valid JSON schema 1.1.0 with all 24 original observations. File was parsed independently after download. |
| Custom data | Public Import, synthetic example loading, mapping review, confirmed AI proposal, manual response-scale entry, and deterministic analysis work. |
| Methodology | Full page, six steps, diagrams, limitations, and interactive examples work. Outlier/noisy-linear outcomes are none; sustained deviation is supported. |
| Mobile | Representative 390×844 Home, Explore Spring/Sensor, Analyze, Full Evidence, and Methodology checks passed. No overlap or horizontal page overflow observed. |
| Console | No console errors observed. Existing upstream Three.js Clock deprecation warnings remain non-blocking. |

These are browser-viewport checks, not physical-device GPU or throttled-network certification. No specific frame-rate claim is made.

## Security and validation

[Anonymous HTTP and client-bundle verification](public-security-verification.json) records HTTP 200 for Home, Explore, built-in workspace, custom workspace, and Methodology, without cookies or authentication. Eighteen public JavaScript bundles totaling 2,222,543 bytes were downloaded and checked: zero credential-pattern matches, zero `GEMINI_API_KEY` identifiers, and zero local user filesystem paths. Tracked source/documentation also contains no credential patterns.

Production dependency audit: `npm audit --omit=dev` → **zero vulnerabilities**. Existing server-only provider boundaries and generic sanitized provider-error handling are unchanged. No forced provider-failure request was added beyond the specified two live requests. Valid production responses contain no stack trace, key, or local path.

The verified release's **306 tests**, typecheck, lint, and build remain the application baseline. There were no application code changes requiring a new regression test or full local rerun. Vercel production builds completed the existing build and TypeScript checks successfully. Documentation and ignore metadata are the only repository changes in this deployment pass.

## Actual public captures

- [Live setup proposal before confirmation](01-public-setup-proposal.jpg).
- [Full Evidence with optional live explanation](02-public-live-explanation.jpg); the lower prose continues within the dialog.
- [Public Home at 390px](03-public-mobile-home.jpg).
- [Public Home at desktop width](04-public-desktop-home.jpg).

No user action remains necessary for this public deployment. GitHub login connection/linking is optional for future automatic deployments. No further feature or redesign work was begun.
