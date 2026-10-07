# ImpactHack 2026 — final written draft

**ModelScope — Equations have limits. Find them.**

**Luis Contreras · Solo**

Deadline: **October 7, 2026, 11:45 PM PDT**. Draft only; not final-submitted. [Current rule/eligibility review](submission/rules-review.md).

## Inspiration and problem

Students often memorize equations without learning their assumptions or valid regimes. A high fit score can hide systematic residual disagreement. ModelScope makes model adequacy an evidence-based learning task: when should we stop trusting this approximation for these measurements?

## What it does

ModelScope compares measurements with a configured scientific baseline, searches continuous segmented alternatives, and exposes the supporting evidence. Students explore four 3D scientific systems, inspect linked plots and measurements, or bring CSV, pasted tables, and manual data. Outcomes distinguish supported, ambiguous, no clear transition, and insufficient evidence.

Spring tests Hooke's law, pendulum tests the fixed small-angle period approximation, Beer–Lambert tests concentration calibration, and Sensor Calibration tests linear response. Each makes a different scientific assumption inspectable. Custom data connects the same reasoning to the student's own lab measurements.

## How we built it

Pure TypeScript performs baseline fitting or fixed-theory prediction, residual analysis, penalized segmented comparison, sustained same-direction disagreement checks, and an influential-observation safeguard. The same complete observations remain in the reported fits. The transition sensitivity range describes sampling and candidate sensitivity; it is not a confidence interval. Reproducible JSON preserves provenance and numerical evidence.

The graph-first workspace keeps the main model fit and compact result together. Residuals, Model comparison and Evidence offer successive checks; Full Evidence opens deeper findings and diagnostics. The collapsible editor links source rows to plotted points. Explore uses cinematic 3D scenes with system-specific motion and pauses offscreen work.

## Responsible AI and technology

Gemini proposes only a supported configuration from an experiment description and exact column headers. The student reviews and confirms it, supplies a justified response scale, and separately runs analysis. Gemini can also explain an existing deterministic finding using minimal summary context. It cannot fit the model, select the breakpoint, invent uncertainty, or change support. AI explains. The analysis engine decides.

Both runtime AI routes have been verified against real Gemini on the public deployment. Recording captured a successful Setup and a successful Explain retry after a sanitized temporary failure; the numerical result remained unchanged. No mock response is presented as production.

## Impact

ModelScope is intended for science students and educators developing model literacy: assumptions, residual reasoning, approximation limits, cautious uncertainty language, and the distinction between mathematical evidence and physical explanation. It provides a working basis for classroom investigation; improvements in learning outcomes have not been measured.

## Challenges, accomplishments and learning

The hardest design problem was avoiding confident-looking but unsupported transitions. Penalized comparisons, persistence and influence checks keep a better fit from automatically becoming a strong finding. Another challenge was making polished 3D interaction coexist with inspectable scientific evidence while avoiding stale AI output. The finished public product combines all four scientific demonstrations, custom input, evidence export, and bounded live Gemini. The verified release has **306 passing tests**, typecheck/lint/build pass, and zero production dependency vulnerabilities.

The main lesson is that model inadequacy is a claim about observations and assumptions, not proof of a hidden physical cause. A useful educational tool must show its evidence and its limitations together.

## Limitations and privacy

Built-in datasets are explicitly synthetic educational demonstrations, not laboratory validation. The prototype supports restricted baselines and one possible hinge with ordinary least squares and assumed response scales. It has no calibrated false-positive rate, confidence interval, causal mechanism inference, arbitrary equation support, or classroom outcome study. Repeated X values and measurement-input uncertainty are unsupported. Optional AI can fail or misinterpret; manual analysis remains usable.

Normal analysis and raw measurements stay in browser memory. Optional Setup sends description and headers; Explain sends one selected finding and limited evidence context, including summary statistics and caveats. Free-tier Gemini context may improve Google products; avoid sensitive context. The provider key remains a production server secret.

## What's next

Evaluate the learning experience with teachers and students, test independently collected classroom datasets, and review whether existing assumptions fit those measurements. These are proposed future work, not shipped capabilities.

## Technologies and development disclosure

Next.js, React, TypeScript, Three.js, React Three Fiber, Drei, Recharts, Zod, Papa Parse, Google Gemini API, Google GenAI SDK, Tailwind CSS, Geist, Vercel. Development/verification: Vitest, Testing Library, jsdom, ESLint, Codex. Submission production: Chrome DevTools Protocol browser frame capture, Python, Pillow, FFmpeg, and installed Windows speech synthesis.

Luis Contreras built ModelScope from scratch during the overlapping eligible event period. Retained Git history begins October 4, 2026 and has not been squashed, backdated or rewritten. Codex assisted engineering, debugging, research, documentation and verification. Runtime Gemini is separate from coding assistance. Open-source dependencies and pre-trained Gemini are disclosed. Personal eligibility and cross-submission permission remain unresolved pending confirmation.

## Submission assets

- Live demo: https://modelscope-ten.vercel.app/
- Public source: https://github.com/luiscontrerasus-glitch/ModelScope
- Video: **PUBLIC VIDEO URL PENDING UPLOAD** — local 2:45 MP4 is complete; do not paste a local path into Devpost.
- Final production images: [selected assets](submission/assets/README.md).
- Architecture: [SVG](assets/architecture.svg).
- Copy-ready fields: [Devpost package](submission/devpost-fields.md).

## Award positioning for review only

Education: evidence-based model literacy. Technical: deterministic analysis with robust gates. AI: reviewed setup and bounded explanation. Design/UX: cinematic exploration and precise analysis. Data/Analytics: linked residual evidence and reproducible exports. Innovation: evaluating equation adequacy across scientific domains. Demo/Presentation: actual production footage and an explicit AI/science boundary. These are relevant award areas, not awards won or guaranteed eligibility.
