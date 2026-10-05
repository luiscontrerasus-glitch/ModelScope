# ForgeHacks Online 2026 submission draft

**ModelScope — Equations have limits. Find them.**

**Solo participant:** Luis Contreras

**Track:** AI + Education

**Event:** [ForgeHacks Online 2026](https://forgehacks-2026.devpost.com/)

**Deadline safety:** October 10, 2026, 12:00 PM EDT, using the live Devpost deadline. Draft only; nothing submitted.

## Problem statement and target users

Students can memorize an equation without understanding its assumptions or applying it critically to measurements. ModelScope is designed for students working with science lab data and teachers demonstrating model adequacy. It asks where a configured relationship starts disagreeing systematically with observations, and makes the evidence inspectable.

## Connection to AI + Education

The [official track](https://www.forgehacks.dev/) emphasizes conceptual understanding, connections, and application beyond memorization. ModelScope connects equations to measurements and residual patterns. Students apply their knowledge by choosing variables, declaring assumptions, comparing evidence, and interpreting the limits of a model. Optional AI helps them express experimental intent and understand an existing finding.

ModelScope is distinct from a generic AI tutor: the core task is scientific model adequacy, deterministic evidence is authoritative, and students explore limitations rather than receive answers from a chat. **AI interprets and explains. ModelScope's deterministic engine decides.**

## Technical approach

Local TypeScript functions evaluate the baseline, compare continuous segmented alternatives, require sustained disagreement, and check whether support survives diagnostic omission of an influential observation. Linked Recharts plots and tables expose the evidence. Supported, ambiguous, none, and insufficient outcomes prevent every dataset from becoming a positive finding. JSON exports preserve provenance and reproducible numerical results.

![Architecture](assets/architecture.svg)

## AI implementation

The Next.js server uses Google GenAI and `gemini-3.5-flash-lite`. Structured setup output may propose exact columns, source-backed unit labels, and only supported model families. The student confirms into the regular configuration, supplies a reference scale, and runs deterministic analysis. Explanations bind to an existing finding and its analysis revision. Validation rejects unknown authority fields; editing or rerunning clears stale explanations. Requests are bounded, throttled per process, and fail without disrupting manual analysis.

The model's structured output and free-tier availability were checked on October 4 against official Google documentation. **No live Gemini smoke test has passed yet: a free, unbilled key is still required.** Keep this status in the submission unless actual provider verification changes it. Mock screenshots must not be presented as production AI behavior.

## Real-world impact and innovation

The prototype could support discussions about model assumptions, sampling, influential observations, and causal uncertainty in science labs. Its distinctive combination is numerical model comparison, linked source evidence, and bounded explanatory AI. Educational impact is a hypothesis for future classroom evaluation; I do not claim measured improvements.

## What works

Four labeled synthetic demonstrations cover Spring, pendulum, Beer–Lambert, and sensor calibration. Custom CSV, pasted tables, and manual entry use the same engine after explicit configuration. Response and residual plots link to findings and measurements. Users can edit, rerun, inspect diagnostics and candidate profiles, and export evidence. Manual analysis works without provider credentials. The release regression suite contains 290 passing tests.

## Known limitations and privacy

One possible transition, restricted baselines, ordinary least squares, assumed response scales, no confidence intervals, and no inferred physical mechanism. Repeated X values, measurement-input uncertainty, arbitrary equations, persistence, and XLSX/PDF are unsupported. The rule has no calibrated false-positive rate. AI semantic checks reduce errors but cannot guarantee perfect interpretation. Public server throttling is process-local, not distributed.

Raw measurements stay local. Optional setup sends description and headers; explanation sends a selected deterministic finding and minimal model/evidence context including summary statistics and caveats. Gemini free-tier inputs may improve Google products; avoid sensitive context.

## Technologies and provenance

Next.js, React, strict TypeScript, Recharts, Zod, Papa Parse, Vitest, Testing Library, Google GenAI SDK. Codex assisted engineering and documentation. Luis Contreras started ModelScope from scratch during the overlapping event period; the full Git history begins October 4. The supplied Forge build window is October 3 at noon ET through October 10 at noon ET. Live Devpost says EDT; rules use EST, so use the earlier EDT cutoff. Student/age eligibility and cross-hackathon permission remain team checks.

## Links and recording

- Source: [ModelScope on GitHub](https://github.com/luiscontrerasus-glitch/ModelScope) — public source with the complete verified release history.
- Live demo: pending Vercel authentication/deployment.
- Video: **TODO — public 2–4 minute recording** using [the exact shot list](demo-video.md).
- Images: use the six recommended actual product screenshots in [the manifest](screenshots/README.md).
