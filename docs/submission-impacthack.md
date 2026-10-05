# ImpactHack 2026 submission draft

**Project:** ModelScope

**Tagline:** Equations have limits. Find them.

**Solo participant:** Luis Contreras

**Event:** [ImpactHack 2026](https://impacthack26.devpost.com/)

**Deadline:** October 7, 2026, 11:45 PM PDT. Draft only; nothing submitted.

## Problem

Students often learn equations without learning when their assumptions stop matching observations. A good-looking fit can hide a structured residual pattern. I wanted students to ask a more useful question: over what range does this model adequately describe these measurements?

## Solution

ModelScope compares measurements against a configured scientific model, visualizes the disagreement, and presents traceable evidence for a candidate transition. Students can inspect every finding, select its supporting measurements, and connect the evidence across the table, response plot, and residual plot.

## How it works

The browser fits or evaluates the configured baseline, compares it with continuous segmented alternatives, and requires both sustained residual disagreement and an influential-observation safeguard. Results distinguish supported, ambiguous, no clear transition, and insufficient evidence. A supported transition includes a sensitivity range reflecting candidate location and sampling, not a confidence interval. Model inadequacy does not establish physical failure or its cause.

## Technical implementation

Pure TypeScript analysis functions are separated from experiment definitions and React display components. The Next.js workspace uses Recharts for linked plots, Papa Parse for local CSV interpretation, and Zod for bounded input/output contracts. JSON exports preserve configuration, provenance, original observations, numerical evidence, and methodological caveats. The release regression suite contains 290 tests, including frozen Spring numerical results and adversarial inputs.

![Architecture](assets/architecture.svg)

## Responsible AI

**AI interprets and explains. ModelScope's deterministic engine decides.** Optional Gemini setup proposals interpret a description and actual column headers within three supported custom model families. A proposal requires explicit confirmation into the normal form; the student supplies the response reference scale and separately runs analysis. Optional explanations describe an existing finding and are bound to its ID and current analysis revision. AI cannot change fits, residuals, transition positions, support states, or exports.

The server uses `@google/genai` 2.27.0 with `gemini-3.5-flash-lite`, strict structured responses, validation, request limits, timeouts, and sanitized errors. The model's structured-output capability and free-tier availability were checked against official Google documentation on October 4. **Live provider verification is pending a free, unbilled key.** Automated mocks establish interface behavior, not live inference. Before publication, retain this qualification unless real smoke tests pass.

## Built-in experiments

Four synthetic educational demonstrations explore Spring/Hooke's law, the pendulum small-angle approximation, Beer–Lambert concentration response, and a sensor's linear calibration range. They span mechanics, physics approximation, chemistry, and engineering instrumentation. Each includes its question, assumptions, model, units, and a control dataset. They demonstrate the method; they are not laboratory validation.

## Custom datasets

Students upload CSV locally, paste CSV/TSV, or enter measurements manually. They review source records, explicitly map X/Y, name quantities and units, choose a line with offset, line through the origin, or user-supplied constant, and justify a positive response scale. Unknown units remain unspecified; labels never trigger guessed conversions. Edits invalidate the displayed analysis until rerun.

## Educational impact

ModelScope gives lab groups and teachers a concrete way to discuss assumptions, residual structure, sampling, and the difference between a statistical pattern and a causal explanation. Its potential benefit is better scientific reasoning, rather than faster answer delivery. Learning outcomes have not yet been measured in classrooms.

## Challenges

I had to prevent one unusual observation from becoming a persuasive but unsupported transition, preserve scientific meaning across four different experiments, and keep AI assistance subordinate to reproducible evidence. Custom input needed explicit mappings and uncertainty assumptions rather than convenient hidden defaults.

## Accomplishments

I built four connected demonstrations and a complete custom-data workflow, linked evidence to the source measurements, preserved deterministic results through generalization, and made manual analysis work without an AI key. The release candidate supports desktop and mobile use and includes a reproducible evidence export.

## What I learned

Clear scientific interfaces need careful language as much as mathematical correctness. A sensitivity range, a high R², and a causal explanation are different things. Bounded AI assistance is most useful when its authority and failure behavior are explicit.

## What's next

After the hackathon, I would evaluate the learning experience with students and teachers, assess detection behavior against independently designed datasets, and review whether the existing assumptions suit classroom measurements. These are research directions, not shipped capabilities.

## Privacy

Raw measurements remain in the browser. Optional setup sends only the description and headers; explanation sends a selected finding and minimal model/evidence context, including summary statistics and caveats. Google Gemini free-tier inputs may be used to improve Google products. Avoid sensitive descriptions, labels, and evidence context.

## Technologies and development disclosure

Next.js, React, TypeScript, Recharts, Zod, Papa Parse, Vitest, Testing Library, and the Google GenAI SDK. Codex assisted development, debugging, documentation, and verification. No generated product screenshot substitutes for actual application footage.

ModelScope was started from scratch during the overlapping eligible build period. The retained Git history begins October 4, 2026. Event window: October 1 at 12:00 AM PDT through October 7 at 11:45 PM PDT. Team eligibility and permission to submit the same project to both events must be checked before submission.

## Submission links and images

- Source: [ModelScope on GitHub](https://github.com/luiscontrerasus-glitch/ModelScope) — public source with the complete verified release history.
- Live demo: pending Vercel authentication and deployment; replace with verified URL.
- Video: **TODO — public 2–4 minute recording**, following [the script](demo-video.md).
- Use the six recommended real product images in [the screenshot manifest](screenshots/README.md). Do not include internal AI mocks.

## Suggested award positioning

Best Education Project: learning model limits through evidence. Best Data & Analytics: residuals, model comparisons, and traceability. Best Technical Project: deterministic analysis and bounded AI contracts. Best Use of AI: reviewed configuration and evidence explanation, conditional on live verification. Best Design & UX: coherent scientific workspace. Most Innovative: exploring equation adequacy rather than supplying answers. Overall placement: integrated impact, correctness, and demonstration quality. These are positioning suggestions, not award claims.
