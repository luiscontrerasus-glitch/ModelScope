# Ambient scientific motion review

Implementation commit: **`ea08be7`**, on the existing `modelscope-elite-redesign` branch. Starting revision: `f511f74`. No merge, push or deployment. The existing Home → Explore → Analyze → Methodology structure and visual design remain.

The final typed Home correction takes precedence over the earlier requested parameter sequence: Home is mostly static, with no play/pause, slider, reveal loop or moving scientific parameter. Active instrumentation belongs to Explore.

## Requested motion/performance report

| # | Area | Result |
|---|---|---|
| 1 | Original low-FPS cause | The previous driver used RAF, not interval timers, but routed animation through `setValue` at a nominal 30 Hz. React then reconciled the scene and changed mesh props. The pre-change 1440px spring trace recorded 333 scene callbacks over 14.575 s: **22.78/s**, median 41.95 ms and p95 50.07 ms. The 30 Hz gate and scheduler path caused visible stepping. |
| 2 | Before vs. after architecture | Before: RAF → sampled React state → entire exhibit/scene props → demand render. After: delta-time RAF → mutable instrument controller → frame invalidation → `useFrame` mutates existing transforms/materials. Only the isolated readout subscriber receives sampled updates. Model selection, user control values and pause state remain ordinary React state. |
| 3 | Frame-loop changes | Removed the visual 30 Hz sampling gate. A stable controller advances at the available display cadence. Delta-time phase and exponential interpolation preserve speed across refresh rates. Visibility/reduced-motion cleanup cancels RAF; the first returning frame has zero elapsed delta, and abnormal frame gaps are capped at 50 ms. No debug FPS counters or timing overlays ship. |
| 4 | React rerenders removed | Continuous motion never calls a React setter to move geometry. Scene props are stable and memoized; geometry/material components do not rerender for numeric sampling. A test verifies the scene-owning parent does not rerender while 180 frames advance. Numeric readouts subscribe separately at approximately **12 Hz**; manual input publishes immediately. Pause flushes the current readout once. |
| 5 | Spring | Existing 520-segment TubeGeometry is retained and disposed on unmount. Its scale and free-end transform now change directly; no geometry is rebuilt per frame. A 14 s cycle gradually loads, dwells, unloads and rests, using smooth stage boundaries. The free-end color blends rather than flipping abruptly. Drag starts at the exact live extension; production grip drag verified **0.140 → 0.122 m** with no pointer-down reset. |
| 6 | Pendulum | One pivot group rotates continuously between signed endpoints. Its existing finite-amplitude period controls phase speed. The slider remains stationary and controls amplitude only; amplitude transitions use delta-corrected exponential interpolation without resetting phase. The angle arc reuses its existing buffers and only updates while amplitude changes. At 60° the existing readouts remain 2.006 s, 2.153 s and +7.32%. Bob drag captures the actual signed pose. |
| 7 | Beer–Lambert | A 22 s measurement schedule rests, slowly increases concentration, briefly holds and smoothly flushes. It no longer continuously bounces like a parameter slider. Existing glass/liquid materials and beam geometry are reused; only liquid opacity and outgoing beam opacity mutate. Control position stays unchanged during the sweep. Manual maximum still gives 1.218 predicted and 0.975 illustrative absorbance. |
| 8 | Sensor | A 16 s load-test schedule has approach → load → dwell → release → rest. A parent actuator group moves the upper assembly; the gap mesh scales instead of changing cylinder geometry. Emissive intensity follows load through its material ref. Manual 12 N still gives 3.100 V expected, 2.365 V illustrative and −23.7% deviation. |
| 9 | Home | Scientific points, residuals and candidate plane use fixed values. Only a restrained 18 s CSS depth/illumination effect remains: a maximum 2 px vertical movement and 4% opacity variation. There are **zero hero sliders and zero visualization buttons**. It pauses offscreen/hidden and is disabled under reduced motion. Home communicates the idea immediately. |
| 10 | Scene switching | A 360 ms opacity entrance with 4 px translation softens exhibit/canvas arrival. One selected scene mounts; no crossfade between multiple heavy canvases and no camera flight. Reduced-motion CSS disables the transition. Methodology retains the same cases/results but replaces its recurring React-driven reveal with a brief CSS observation reveal; no repeated scientific sweep or autoplay label remains. |
| 11 | DPR/shadows/render cost | One visible demand-rendered canvas, DPR cap 1.5, low-power context preference, memoized 128px studio environment and 256px single-frame contact shadow retained. No post-processing or external assets. Device DPR 3 emulation produced a 1011px backing width for 674.65 CSS px: effective DPR **1.499**. Models reuse meshes, materials, vectors and geometry; the frame path does not allocate them. |
| 12 | Desktop observations | Final spring at 1440px: **118.75 scene callbacks/s**, p95 interval **9.01 ms**. Pendulum at 1280px: **118.59/s**, p95 **9.01 ms**, and zero layout events during constant-amplitude motion. Readout scheduling stays near 11.9 Hz. Neither sample captured a `FunctionCall` longer than 50 ms. These are Chrome callback measurements on this computer, not a GPU FPS guarantee. |
| 13 | Mobile observations | At 390px, the sensor scene recorded **119.30 callbacks/s**, p95 **9.03 ms**, readout scheduling 11.93 Hz and no captured `FunctionCall` longer than 50 ms. Mobile Explore shows one instrument and retains its selector underneath, with no horizontal page overflow. This is desktop browser viewport emulation; physical-phone GPU and battery performance were not benchmarked. |
| 14 | Validation | **303/303 tests pass**: all original 290 scientific/security tests, the existing methodology checks, updated lifecycle tests for the new driver, and new schedule/takeover/refresh-rate tests. Final `npm run typecheck`, `npm run lint` and `npm run build` pass. Tests verify hidden/offscreen cancellation, reduced motion/manual access, parent render isolation, four-second idle hold, signed bob takeover, bounds, smooth stage boundaries and comparable 60/120 Hz trajectories. |
| 15 | Commit | **`ea08be7` — Use full-rate ambient instrument motion with seamless user takeover.** The subsequent review-artifact commit contains this report, trace summaries and screenshots. Both remain on the existing branch; `main` stays at `dd83b26cfad8e00466ac0257f84098af6904f69d`. |

## User takeover and resumption

Ambient values update readouts and instruments, never the range thumb. Pressing a range captures the live animated value as its drag origin; pointer movement is relative to that origin, preventing an arbitrary jump to the clicked track location. Keyboard controls retain direct native input. Grabbing a spring or bob freezes its current value/pose immediately. Pointer capture keeps ownership through dragging; release/cancel clears it.

Spring, optical and sensor values hold for four active, idle seconds after manual input. The controller finds the matching load phase at the current value and smoothly continues; it does not return to a predefined start. Explicit Pause remains paused until Resume. Pendulum amplitude adjustments keep the oscillator running and smoothly change its envelope; bob dragging temporarily holds the signed pose, then resumes after inactivity. Reduced-motion manual controls update the static scene without starting ambient motion.

Explore responses remain labeled educational/illustrative. Pendulum motion is an idealized undamped cosine visualization using the existing period formula, not a nonlinear ODE simulation. The interpolation used to change amplitude is a presentation transition, not a claim of physical damping.

## Evidence and screenshots

[Saved Chrome profile summaries](motion-profiles.json) include the baseline, final 1440/1280/390 samples and high-DPI observation. The RAF driver and R3F renderer are separate callbacks at the same cadence: **their frequencies must not be added together**. Trace categories and capture lengths differ; these measurements demonstrate the removed cadence bottleneck, not a standardized device benchmark or universal absence of long tasks/GC pauses. One oversized diagnostic trace export exceeded the browser tool window; final bounded traces completed and are the samples saved here.

| View | Actual production capture |
|---|---|
| Spring after grip drag | [01-spring-drag.jpg](motion-screenshots/01-spring-drag.jpg) |
| Pendulum at 60° while oscillating | [02-pendulum-ambient.jpg](motion-screenshots/02-pendulum-ambient.jpg) |
| Optical manual maximum | [03-optical-manual.jpg](motion-screenshots/03-optical-manual.jpg) |
| Sensor manual maximum | [04-sensor-manual.jpg](motion-screenshots/04-sensor-manual.jpg) |
| Complete mobile Explore | [05-mobile-explore.jpg](motion-screenshots/05-mobile-explore.jpg) |
| Reduced-motion manual pendulum | [06-reduced-motion.jpg](motion-screenshots/06-reduced-motion.jpg) |
| Calm Home with no controls | [07-home-calm.jpg](motion-screenshots/07-home-calm.jpg) |
| Mobile Home | [08-mobile-home.jpg](motion-screenshots/08-mobile-home.jpg) |

Browser checks also verified optical/sensor manual values, a live-value slider takeover, motion resuming with its control still stationary, 28° → 60° pendulum amplitude transition, model switching, the full mobile composition, and Home's offscreen pause. CSS reduced-motion and manual 0°/60° controls remain functional. No error-level application console entries were observed in the final review.

This architecture follows the React Three Fiber guidance to [mutate objects in frame loops with delta-time instead of per-frame React state](https://r3f.docs.pmnd.rs/advanced/pitfalls) and to [invalidate demand renders when objects change](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

## Scientific preservation

No diff against verified `dd83b26` in `src/lib`, `src/app/api`, `custom-setup.tsx`, `ai-assistance.tsx` or the six original scientific/security test files. Analysis calculations, transition rules, datasets, evidence, exports and AI safeguards are unchanged. Package dependencies are unchanged. The presentation controller calls the existing finite-amplitude formula; it never invokes or duplicates detector logic.
