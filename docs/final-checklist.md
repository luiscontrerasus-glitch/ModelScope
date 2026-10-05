# Final release and submission checklist

Checked items are executed or verified. Open items require real external delivery or team action; this is not a claim of complete submission.

## Status summary

| Status | Items |
| --- | --- |
| DONE | Local engineering and submission assets, including the final post-fix production recheck. |
| PENDING USER ACTION | Vercel login, optional Gemini key, video recording/upload, eligibility review, organizer cross-submission permission, manual Devpost submissions. |
| BLOCKED | Public deployment without Vercel authentication; live AI footage without a verified key. |
| NOT REQUIRED | Billing, paid plans/add-ons, new features, accounts/database, automatic submission, and a release tag. |

## Technical

- [x] 290 tests pass across six files; no tests weakened.
- [x] Typecheck, lint, and final production build pass.
- [x] Production audit: zero vulnerabilities. Development-only advisories documented separately.
- [x] Environment files ignored; only placeholder `.env.example` tracked.
- [x] Server-only SDK/key boundary; bounded AI contracts, sanitized errors, and throttling tests.
- [x] Local production desktop/mobile release verification; see [record](release-verification.md).
- [ ] Confirm public GitHub URL and complete history push (update after delivery).
- [ ] Authenticate Vercel, deploy on personal Hobby without billing, and verify public URL.
- [ ] Set optional server Gemini variables only after checking an unbilled free-tier project.
- [ ] Public browser matrix: homepage, four demos, custom setup, edits/rerun, evidence, export, mobile, console, errors, and AI if configured.

## Scientific

- [x] Built-ins labeled synthetic educational data; no laboratory-validation claim.
- [x] Candidate transition wording and model-inadequacy caveat retained.
- [x] Transition sensitivity range is explicitly not a confidence interval.
- [x] Supported/ambiguous/none/insufficient outcomes and safeguards retained.
- [x] No causal mechanism, measured uncertainty, or calibrated false-positive claim.

## AI

- [x] Official `gemini-3.5-flash-lite` structured output/free-tier documentation checked October 4.
- [x] Explicit confirmation, independent response-scale entry, and on-demand explanation.
- [x] AI has no authority over scientific results or exports.
- [x] UI/docs disclose description+headers or minimal finding context; free-tier data terms disclosed.
- [ ] Tiny live smoke test: one setup and one explanation locally; record actual results.
- [ ] If deployed with AI, one production request per route; preserve quota.
- [ ] Update live status and recording plan only after successful real responses.

## Submission materials

- [x] README and SVG architecture prepared.
- [x] Two event-specific drafts; nothing submitted automatically.
- [x] Actual product screenshots and recommendation manifest; internal mocks excluded from submission.
- [x] 2:45 video script and exact sequential shot list, including honest no-key alternative.
- [ ] Record, upload, and test a public/unlisted video accessible to judges.
- [ ] Replace source/demo/video placeholders with verified working links.
- [ ] Review every submission statement against actual shipped behavior.

## Rule compliance and provenance

- [x] Solo participant: Luis Contreras; list the solo participant on Devpost.
- [x] Started from scratch during overlapping eligible build period; original Git history begins October 4, 2026 and is preserved without altered timestamps.
- [x] ImpactHack window: October 1, 12:00 AM PDT through October 7, 11:45 PM PDT, [official schedule](https://impacthack26.devpost.com/details/dates).
- [x] Forge build window supplied: October 3, noon ET through October 10, noon ET. Use **October 10, noon EDT** live Devpost deadline, not the later interpretation of the rules' EST wording.
- [x] Forge intended track: **AI + Education**; draft connects concepts, connections, and application.
- [x] Disclose Codex development assistance separately from runtime Gemini use.
- [ ] Confirm the solo participant satisfy [ImpactHack high-school eligibility](https://impacthack26.devpost.com/rules).
- [ ] Confirm [Forge student/age eligibility and guardian consent where required](https://forgehacks-2026.devpost.com/rules).
- [ ] Confirm organizer permission for submitting the same project to both events. **Unresolved; overlapping dates are not permission.** No organizer message has been sent.
- [ ] Confirm all subsequent changes remain within each eligible window; freeze relevant submission commit.
- [ ] Check final video duration, screenshot readability, source visibility, and required links.
- [ ] Human team review and manual submission before each deadline; retain confirmation receipts.

## Credential handoff

### Free Gemini key

1. Open [Google AI Studio API keys](https://aistudio.google.com/api-keys), sign in, and create a key in a project with **no billing enabled**. Do not add a card or enable billing. Follow the [official key guide](https://ai.google.dev/gemini-api/docs/api-key).
2. From the repository in PowerShell: `Copy-Item .env.example .env.local`. Edit ignored `.env.local` privately:

```dotenv
GEMINI_API_KEY=your_private_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FREE_TIER_CONFIRMED=true
```

The third variable is the existing operator attestation; set it true only after verifying the key's unbilled project. Never paste the key into chat, commit it, or prefix it with `NEXT_PUBLIC_`. Restart the server, then continue the two-request smoke test in [AI guidance](ai.md).

### Vercel Hobby

From the repository run `npx vercel login` and complete the browser authentication yourself. No Vercel credentials were detected. After authentication, deployment can continue with `npx vercel --prod`; select the personal Hobby scope, accept the detected Next.js framework, and leave environment variables unset for a deterministic-only deployment. Stop if any payment, credit-card, paid-plan, or add-on step appears. [Hobby documentation](https://vercel.com/docs/plans/hobby) describes free personal noncommercial use; [login documentation](https://vercel.com/docs/cli/login) describes authentication.

Only configure the three Gemini server variables if an unbilled key is available, then redeploy and run the tiny production smoke test. Check deployment protection so judges can open the production URL without a Vercel login. Public delivery is not verified until the real URL passes the browser matrix.
