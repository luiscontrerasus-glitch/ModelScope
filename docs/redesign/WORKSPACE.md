# Graph-first workspace and Explore loading review

Reviewed October 5, 2026 on `modelscope-elite-redesign`, continuing from `9e83625`. Local production preview only; no merge, push or deployment.

## Requested workspace report

| # | Area | Result |
|---|---|---|
| 1 | Old problems addressed | Removed the permanent narrow measurement column, dense evidence sidebar, stacked technical panels, oversized configuration area and repeated micro-labels. Compare the [previous workspace](screenshots/07-desktop-workspace.jpg) with the [new default](workspace-screenshots/1440-default.jpg). |
| 2 | Layout | Thin experiment/action header, compact model/reference-scale/assumptions strip, main graph and result, one secondary analysis view, collapsed measurements. Warm white, graphite, restrained blue and amber; typography and spacing replace nested cards. |
| 3 | Graph | At 1440px the graph column is 909px and result column 350px, approximately 72%/28% excluding the gutter. Measurements, original reference, original fitted hinge, sensitivity range and linked selection remain. Explicit variable units and light grids remain readable. Decorative line hover dots no longer intercept measurement clicks. |
| 4 | Result | Compact status, estimate, sensitivity range, improvement, persistence and influence checks. The unchanged spring analysis reports supported transition near 0.080m, 0.075–0.085m sensitivity and 84.02 improvement. Detailed caveats remain in Evidence and Assumptions. No new detection criterion is introduced. |
| 5 | Measurements | Collapsed by default; Open data reveals the full-width editor, experiment and dataset selection, editable fields, add/remove/reset and stable IDs. Opening the editor scrolls its own table to a singly selected observation. Collapse preserves selection. |
| 6 | Evidence | View full evidence opens a native modal with All findings, original statistics, supporting measurements, sensitivity explanation and methodology traceability. Sticky close control, browser focus containment, Escape close and focus restoration verified. |
| 7 | Tabs | Residuals is the default; Model comparison shows existing fit statistics; Evidence shows deterministic supporting checks. Exactly one panel is rendered. Arrow keys, Home and End move between tabs. |
| 8 | AI | Existing optional explanation control appears inside Full evidence. Explanation remains explicit and subordinate; closing the dialog unmounts the explanation context. Existing request, privacy, cancellation and stale-response assertions are retained. No live AI requests were made during this audit. |
| 9 | Desktop/tablet | Reviewed default, data editor and evidence at 1440, 1280, 1024 and 768px. The graph remains dominant on desktop; tablet preserves readable columns. No text overlap or horizontal page overflow observed. |
| 10 | Mobile | At 390px: header → result → graph → tabs → measurements → configuration. No desktop columns. Dense supporting/comparison tables scroll within their own region. The measurement editor retains edit/add/remove controls. |
| 11 | Screenshots | 17 workspace screenshots and two Explore screenshots in [workspace-screenshots](workspace-screenshots/). Complete manifest below. |
| 12 | Tests | `npm test`: **306 passed across 10 files**. Two added workspace tests cover disclosure/selection/edit invalidation and keyboard tabs/full evidence. Existing AI integration tests now open the relevant disclosures; assertions were retained. |
| 13 | Checks | `npm run typecheck`, `npm run lint` and `npm run build` all pass after the final chart interaction fix. Production build generates all existing page/API routes. |
| 14 | Commits | Workspace: `a54ee72c3197ddd822af20057b4e8e59a03a0e15`. Explore loading: `58301b3329866e9bde29b62be27597e89a32ad8e`. This review and its artifacts are recorded in a separate documentation commit. |

## Functionality and scope

Production interactions verified: keyboard and mouse plot selection linked to the table, collapse/reopen, measurement edit followed by rerun, stale Export disabled/re-enabled, add M25/remove/reset, built-in Pendulum switching, custom import entry, synthetic custom example mapping and analysis, secondary tab switching and evidence opening/closing. Mouse selection of M23 produces the original exact values and highlights row M23.

Regression, transition detection, classification, influence safeguard, sensitivity calculations, datasets, export schema, API routes and AI contracts are unchanged. The custom setup component and original scientific evidence component are reused. Home and the four-section Explore architecture are preserved.

The in-app browser did not expose a download event for the existing Blob-based JSON Export action. Its handler and export contracts are unchanged and covered by the passing suite; a saved download was not independently inspected in this browser run.

## Responsive screenshot manifest

All are actual localhost production browser captures. Desktop/tablet viewport height is 1000px; mobile is 1100px. Data and secondary views intentionally show the relevant scrolled portion of the workspace.

| Width | Default | Measurements expanded | Full evidence |
|---|---|---|---|
| 1440 | [Default](workspace-screenshots/1440-default.jpg) | [Data](workspace-screenshots/1440-measurements.jpg) | [Evidence](workspace-screenshots/1440-full-evidence.jpg) |
| 1280 | [Default](workspace-screenshots/1280-default.jpg) | [Data](workspace-screenshots/1280-measurements.jpg) | [Evidence](workspace-screenshots/1280-full-evidence.jpg) |
| 1024 | [Default](workspace-screenshots/1024-default.jpg) | [Data](workspace-screenshots/1024-measurements.jpg) | [Evidence](workspace-screenshots/1024-full-evidence.jpg) |
| 768 | [Default](workspace-screenshots/768-default.jpg) | [Data](workspace-screenshots/768-measurements.jpg) | [Evidence](workspace-screenshots/768-full-evidence.jpg) |
| 390 | [Default](workspace-screenshots/390-default.jpg) | [Data](workspace-screenshots/390-measurements.jpg) | [Evidence](workspace-screenshots/390-full-evidence.jpg) |

[Desktop residuals](workspace-screenshots/1440-residuals.jpg) · [Desktop comparison](workspace-screenshots/1440-comparison.jpg) · [Explore desktop Spring, reduced motion](workspace-screenshots/explore-1440-spring.jpg) · [Explore mobile Sensor](workspace-screenshots/explore-390-sensor.jpg).

## Explore poster and first-frame handoff

Twelve local JPEG posters were captured from the actual existing geometry, camera, materials and lighting: four systems at desktop, tablet and mobile dimensions. Initial poster canvases were 870×618, 419×588 and 327×291 respectively. They occupy the existing scene box and preserve layout dimensions. No generic illustration, SVG approximation, spinner or loading text is used by Explore.

The live canvas stays transparent until three completed render frames have a camera, populated geometry, draw calls and the procedural studio environment. A current rendered PNG snapshot matches the live pose for the 300ms crossfade; the final pose is retained as the poster when a scene unmounts. Ambient scheduling begins after that fade, avoiding a doubled moving pendulum. The first recording exposed that defect; the retained recordings below are from the corrected implementation.

Only the centered scene schedules ambient motion. The next section initializes its module, geometry, materials, studio environment and shaders using demand rendering, then stops. At most the active and next scene have canvases; this does not run all four simulations continuously. Context loss or scene failure conceals the canvas and retains the poster. Reduced motion renders a stationary high-quality scene with manual controls and no automatic motion.

## Screen recordings and visual review

Actual CDP screencast frames were recorded at normal and fast scroll speeds through Spring → Pendulum → Beer–Lambert → Sensor, including return to preserved poses. The animated WebP files retain the recorded frame sequence and timestamp-based durations; manifests contain frame timestamps and scroll positions. Intermediate JPEG frames were removed after assembly.

| View | Recording | Frames | Playback duration | Review contact sheet |
|---|---|---:|---:|---|
| 1440px normal | [Recording](workspace-screenshots/recordings/desktop-normal.webp) | 206 | 8.6s | [Frames](workspace-screenshots/recordings/desktop-normal-review.jpg) |
| 1440px fast | [Recording](workspace-screenshots/recordings/desktop-fast.webp) | 49 | 2.1s | [Frames](workspace-screenshots/recordings/desktop-fast-review.jpg) |
| 390px normal | [Recording](workspace-screenshots/recordings/mobile-normal.webp) | 204 | 8.2s | [Frames](workspace-screenshots/recordings/mobile-normal-review.jpg) |
| 390px fast | [Recording](workspace-screenshots/recordings/mobile-fast.webp) | 45 | 2.1s | [Frames](workspace-screenshots/recordings/mobile-fast-review.jpg) |

Reviewed contact sheets from all four final recordings, including the model boundaries and pose handoffs. No crude fallback, empty canvas flash, late geometry pop, stale model or scene-box shift observed. Pendulum's naturally light section background is intentional; it is not a loading flash. Console error review was empty.

These are local production browser checks with a 390px viewport, not physical-phone GPU or throttled-network testing. Screencast cadence varies; no 60fps performance claim is made. Poster assets should be recaptured if the actual camera, lighting or geometry changes in a future pass.
