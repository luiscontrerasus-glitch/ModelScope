# ForgeHacks Online 2026 — final written draft

**ModelScope — Equations have limits. Find them.**

**Luis Contreras · Solo · AI + Education**

Deadline: **October 10, 2026, 12:00 PM EDT**. Draft only; not final-submitted. [Current rules and unresolved checks](submission/rules-review.md).

## Problem statement and target users

Students often memorize equations without learning their assumptions or valid regimes. A high fit score can hide systematic residual disagreement. ModelScope makes model adequacy an evidence-based learning task: when should we stop trusting this approximation for these measurements?

The intended users are students investigating science lab measurements and educators demonstrating scientific model assumptions.

## Answer to the AI + Education prompt

The [official prompt](https://www.forgehacks.dev/) asks learners to move beyond memorization toward conceptual understanding, connections and application. ModelScope turns a memorized equation into a testable assumption. Students compare it with observations, inspect residual structure, see where an approximation becomes inadequate, and apply the same reasoning to their own data. Linking one evidence framework across mechanics, physics, chemistry and instrumentation helps connect concepts across domains. Separating evidence from causal explanation teaches caution as well as calculation.

The core experience is model investigation rather than chat tutoring. Gemini supports two specific learning barriers: expressing experimental intent as a supported setup, and understanding an already-calculated finding.

## What it does

ModelScope compares measurements with a configured scientific baseline, searches continuous segmented alternatives, and exposes the supporting evidence. Students explore four 3D scientific systems, inspect linked plots and measurements, or bring CSV, pasted tables, and manual data. Outcomes distinguish supported, ambiguous, no clear transition, and insufficient evidence.

## Technical implementation and AI use

Pure TypeScript performs baseline fitting or fixed-theory prediction, residual analysis, penalized segmented comparison, sustained same-direction disagreement checks, and an influential-observation safeguard. The same complete observations remain in the reported fits. The transition sensitivity range describes sampling and candidate sensitivity; it is not a confidence interval. Reproducible JSON preserves provenance and numerical evidence.

Gemini proposes only a supported configuration from an experiment description and exact column headers. The student reviews and confirms it, supplies a justified response scale, and separately runs analysis. Gemini can also explain an existing deterministic finding using minimal summary context. It cannot fit the model, select the breakpoint, invent uncertainty, or change support. AI explains. The analysis engine decides.

Structured outputs, schema/semantic validation, explicit confirmation, response bounds, sanitized failures, and finding/revision binding limit AI authority. Production Setup and Explain are live-verified; the recording also demonstrates that a temporary AI failure cannot change deterministic evidence.

![Browser-local deterministic engine and separate optional Gemini paths](assets/architecture.svg)

The React/Next.js interface links Recharts plots to measurements and exposes findings, comparisons and provenance. Three.js via React Three Fiber/Drei creates four instrument scenes. CSV parsing, calculations and JSON export run locally; Next.js server routes alone mediate Gemini requests.

## Real-world relevance and innovation

The intended benefit is scientific model literacy: making assumptions visible, reasoning from residuals, checking influential observations, and refusing to equate a mathematical transition with its physical cause. The distinctive combination is a general deterministic adequacy pipeline, a polished instrument experience, and constrained AI interpretation. No measured educational improvement or classroom adoption is claimed.

## Execution and completeness

The public application includes Home, cinematic Explore with all four instruments, the graph-first workspace, source editing, Residuals/Model comparison/Evidence, Full Evidence, custom CSV/paste/manual input, JSON export, and live optional Gemini. Desktop and 390px mobile paths were verified. The frozen release has **306 passing tests**, passing typecheck/lint/build and a clean production dependency audit. Actual production footage forms the full 2:45 video; source and a clear README are public.

## Limitations and privacy

Built-in datasets are explicitly synthetic educational demonstrations, not laboratory validation. The prototype supports restricted baselines and one possible hinge with ordinary least squares and assumed response scales. It has no calibrated false-positive rate, confidence interval, causal mechanism inference, arbitrary equation support, or classroom outcome study. Repeated X values and measurement-input uncertainty are unsupported. Optional AI can fail or misinterpret; manual analysis remains usable.

Normal analysis and raw measurements stay in browser memory. Optional Setup sends description and headers; Explain sends one selected finding and limited evidence context, including summary statistics and caveats. Free-tier Gemini context may improve Google products; avoid sensitive context. The provider key remains a production server secret.

## Learning and next steps

Scientific trust comes from inspectable assumptions and reproducible evidence. Future work would evaluate classroom use with teachers and students and validate assumptions against independently collected datasets. These are research directions rather than current features.

## Technologies and development disclosure

Next.js, React, TypeScript, Three.js, React Three Fiber, Drei, Recharts, Zod, Papa Parse, Google Gemini API, Google GenAI SDK, Tailwind CSS, Geist, Vercel. Development/verification: Vitest, Testing Library, jsdom, ESLint, Codex. Submission production: Chrome DevTools Protocol browser frame capture, Python, Pillow, FFmpeg, and installed Windows speech synthesis.

Luis Contreras built ModelScope from scratch during the overlapping eligible event period. Retained Git history begins October 4, 2026 and has not been squashed, backdated or rewritten. Codex assisted engineering, debugging, research, documentation and verification. Runtime Gemini is separate from coding assistance. Open-source dependencies and pre-trained Gemini are disclosed. Personal eligibility and cross-submission permission remain unresolved pending confirmation.

## Links and supporting assets

- Live demo: https://modelscope-ten.vercel.app/
- Public source: https://github.com/luiscontrerasus-glitch/ModelScope
- Video: **PUBLIC VIDEO URL PENDING UPLOAD** — local 2:45 MP4 is complete; do not paste a local path into Devpost.
- Final production images: [selected assets](submission/assets/README.md).
- Architecture: [SVG](assets/architecture.svg).
- Copy-ready fields: [Devpost package](submission/devpost-fields.md).

The copy emphasizes relevance, thoughtful AI integration, originality, delivered functionality and clear communication, corresponding to the verified official judging criteria without claiming scores or awards.
