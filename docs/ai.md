# Optional AI in ModelScope (Milestone 4)

AI interprets and explains. ModelScope's deterministic engine decides.

## Features and authority

The custom-data setup assistant interprets a description and actual column headers. It returns one proposal, not a conversation. It can suggest names, literal source units, exact mappings and only the existing linear free-intercept, through-origin or fixed-constant families. Unsupported requests receive an explanation. The proposal is labeled **AI PROPOSED SETUP** and cannot change the form until the user confirms. The user then edits the normal configuration and separately runs analysis. Rejecting changes nothing. New sources and descriptions discard old proposals.

An explicit **Explain evidence** action explains a selected computed finding. **DETECTED BY MODELSCOPE** evidence remains above separate **AI EXPLANATION** prose. Dismiss and retry are available. Neither feature runs automatically; no provider status polling or background generation occurs.

AI does **not** determine transition positions, model fits, residuals, support state, sensitivity ranges, fitted parameters or measurement uncertainty. The analysis modules, thresholds and exports remain unchanged. AI prose is not included in the reproducible evidence export.

## Provider and free-tier configuration

Official JavaScript SDK: `@google/genai` 2.27.0. Default: `gemini-3.5-flash-lite`, configurable through `GEMINI_MODEL`. On 2026-10-04, the official [model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) lists it as stable with structured outputs. Google's [pricing](https://ai.google.dev/gemini-api/docs/pricing) lists standard text input/output as free of charge on the free tier. It is suitable for short extraction and educational explanations. [SDK documentation](https://ai.google.dev/gemini-api/docs/libraries) recommends Google GenAI; [structured output documentation](https://ai.google.dev/gemini-api/docs/structured-output) documents JSON schema and JavaScript Zod validation.

The allowlist also permits `gemini-3.1-flash-lite`, listed with free-tier text input/output on the same pricing page. Other overrides fail closed until their pricing/capabilities are reviewed and the allowlist is deliberately updated. There is no paid-model fallback, Search grounding, tool use, file API, billing setup, caching or automatic retry.

Local setup:

1. Use Google AI Studio to obtain a Gemini Developer API key for a project **without billing enabled**. Do not enable billing or add a credit card for this project.
2. Copy `.env.example` to ignored `.env.local` locally, or set the variables in the server process environment.
3. Set `GEMINI_API_KEY` privately. Keep `GEMINI_MODEL=gemini-3.5-flash-lite` unless using the verified alternative.
4. Set `GEMINI_FREE_TIER_CONFIRMED=true` only after checking that the key's project has no billing enabled. This is an operator attestation, not an API billing-status check. A model's free-tier availability cannot establish a particular project's billing status.
5. Restart the local server (stop before rebuilding production, build, start). Make one setup request and one explanation request using synthetic/non-sensitive context.

All environment variables are server-only, never `NEXT_PUBLIC_`. The checked-in example contains placeholders and disables provider calls by default. No valid key was available during this milestone; real Gemini smoke tests remain pending. Browser mocks and automated provider mocks do not establish live model availability or account quota.

## Server and schemas

Next.js Node routes `/api/ai/setup` and `/api/ai/explain` accept small same-origin JSON requests. Strict Zod input schemas reject unknown fields. Streamed body size is bounded to 16 KB; descriptions to 2,000 characters and headers to 32. Process-local limits allow two concurrent requests and six attempts per minute. These limits suit a local prototype, not a publicly deployed multi-instance service.

The provider receives a fixed system instruction and JSON-wrapped untrusted data, with no arbitrary prompt proxy. Descriptions, headers and evidence text cannot authorize secrets, code, additional models or findings. Output uses JSON schema, then strict Zod validation and semantic checks. Provider output is bounded, timeouts abort after 15 seconds, and output is capped at 1,600 tokens. No raw provider response, key, stack trace or debug log is returned or persisted.

Setup schema contains status, nullable exact columns/labels/units, source quotations for units and C, an enumerated family, nullable bounded C, rationale, assumptions and warnings. No uncertainty, fitted values or transition fields exist. Nonexistent/case-mismatched columns and identical mappings are rejected without fuzzy matching. Units lacking an exact containing source quotation and literal token match are removed and marked for review; words are not converted to SI symbols. A fixed C requires literal description evidence such as `C = -3`, matching the proposed number. Missing/invented C is rejected. Numeric setup advice in prose is rejected. Confirmation preserves the user's existing response scale and never fills it.

Explanation schema contains finding ID, analysis version, concise explanation, up to three inspection suggestions and a caveat. Known deterministic IDs and category/outcome consistency are validated; envelope and context bindings must agree. The output must echo both bindings. Unknown fields such as severity, support state and parameters are rejected. AI prose containing digits, number words, outcome restatements or common causal/certainty claims is rejected. This intentionally stricter policy avoids matching potentially reformatted numerical claims: numbers remain in deterministic evidence above the explanation.

## Finding binding and staleness

The browser constructs context only from a finding in its current computed result. Every run, edit, configuration change, reset or experiment switch advances an analysis revision, clearing/unmounting the old explanation. Requests are abortable. The response must match the current revision and finding ID before display; pending results are ignored after a source/description change or dismiss. A source snapshot also protects against altered context.

The server is stateless and receives no raw dataset: it validates binding consistency, not the mathematical truth or existence of an arbitrary caller's claimed client analysis. The application browser enforces actual membership and current-state checks. This is not authenticated evidence attestation. Free-text semantic filters and source quotations reduce errors; they do not guarantee perfect interpretation or prompt-injection immunity. Users must review setup assumptions and treat prose as optional assistance.

## Exact data sharing and failures

Setup sends **only description and headers**. Explanation sends **only finding ID, analysis revision, experiment name, configured model label, outcome/category, title, deterministic summary, selected summary statistics and caveats**. No source filename, local path, raw records, measurement arrays, evidence-point arrays, row IDs, candidate profile or complete analysis is transmitted. Summary statistics can reveal information about measurements; descriptions/headers may also contain private text. The UI discloses these fields before each action. Google states free-tier inputs may be used to improve its products; do not use sensitive context. Parsing, fitting, plotting and exporting the full dataset continue locally.

No key, unconfirmed billing status, unverified model, quota exhaustion, provider refusal, network errors, timeout, malformed JSON or validation failures produce concise non-blocking unavailable messages. Manual configuration and deterministic analysis continue; data and evidence are retained. Stale results are discarded. The UI deliberately permits a click to show unavailable state without a broken empty panel or an automatic provider request.

## Verification and limits

Normal tests mock the provider and never use live Gemini. Server tests exercise schemas, literal units, mappings, constants, injection-style input, malformed responses, timeout, quota/network/model/refusal failures, no-key behavior and evidence binding. DOM tests exercise confirmation/rejection, manual fallback, minimal payloads, labeling and edit/rerun/switch invalidation. See `docs/verification.md` for actual production desktop/mobile browser checks.

The three existing custom families and explicit user response-scale policy remain the boundary. No arbitrary equations, AI detector, uncertainty estimator, causal diagnosis, paid tools, accounts, persistence, collaboration or deployment are added. Quotas, models and free-tier terms may change; recheck official documentation before changing configuration. Live inference requires a verified unbilled project; local attestation cannot technically prevent an operator from falsely confirming a billed key.
