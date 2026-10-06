# Home simplification and cinematic Explore

Historical capture inventory: redundant or superseded review images are linked to their preserved Git revision. Current release captures and recordings remain in this checkout; see [release verification](RELEASE.md).

Ready for local review on `modelscope-elite-redesign`. Starting revision: `dfce11e`. No merge or deployment.

| # | Requested area | Result |
|---|---|---|
| 1 | Home gallery removal | Removed the Home 2×2 gallery invocation. Reusable 3D models and preview components remain available. Home mounts no canvases. |
| 2 | Home teaser | Compact “Explore / Four systems. One question.” section, one supporting sentence, restrained system names and Explore Models link. Conceptual hero remains unchanged. |
| 3 | Explore architecture | One `/explore` exhibition with a quiet introductory viewport and four substantial anchored sections. One central instrument renders at a time. No intermediate explanation routes. |
| 4 | Spring | Large metal spring in a dark environment; existing mechanical loading, dwell and unloading preserved. Direct Open Spring Analysis link. |
| 5 | Pendulum | Light scene with reflective bob and complete pivot. Continuous oscillation; stationary starting-angle control changes amplitude smoothly. Direct Open Pendulum Analysis link. |
| 6 | Beer–Lambert | Dark optical laboratory scene, large cuvette, blue solution, source, transmitted beam and existing measurement sweep. Direct Open Beer–Lambert Analysis link. |
| 7 | Sensor | Precision dark composition with machined transducer, blue illumination and existing approach/load/dwell/release/rest cycle. Direct Open Sensor Analysis link. |
| 8 | Fast navigation | Thin sticky system index with native smooth anchors and current-section indicator. Existing `?model=` links jump to the chosen section. Reduced motion uses immediate navigation. |
| 9 | Mobile | Each model keeps a substantial section: title, full-width instrument, readouts, analysis link. Horizontal index remains compact. No horizontal page overflow in the requested widths. |
| 10 | Screenshots | All six requested views at 1440, 1280, 1024, 768 and 390 pixels: 30 captures, plus one normal-motion Spring capture. Matrix below. |
| 11 | Validation | `npm test`: 304/304 across 9 files (all 303 previous tests preserved, one lifecycle regression added). `npm run typecheck`, `npm run lint` and `npm run build` passed. |
| 12 | Commit | Focused Home/Explore change, review artifacts and lifecycle test. Retrieve its hash with `git log -1 --format=%H -- docs/redesign/EXHIBITION.md`; the final response records the hash. |

## Visual review

The 1440 and 1280 compositions reserve approximately 68% of the content width for the instrument. At 1024 the instrument occupies about 65%; tablet retains a two-column composition, and mobile stacks the instrument above readouts. Desktop sections use approximately one primary model per viewport. The narrow layout retains readable type and full instrument geometry instead of shrinking four models into a gallery.

The Home teaser is about 267px tall on desktop and 354px on mobile, replacing the former large gallery. Explore's calm intro deliberately uses negative space; its following instrument sections carry the active scientific experience. Pendulum provides a light visual pause between the darker systems.

The 30-view matrix uses reduced-motion mode for repeatable poses and immediate anchor navigation. Captures wait for the actual first rendered instrument frame, rather than merely a mounted canvas. Normal motion was then restored and checked separately; `1440-spring-live.jpg` shows the default subordinate pause control without a reduced-motion label. Temporary browser size and media overrides were reset after review.

| Viewport | Home teaser | Explore intro | Spring | Pendulum | Beer–Lambert | Sensor |
|---|---|---|---|---|---|---|
| 1440 × 1000 | [Home](exhibition-screenshots/1440-home.jpg) | [Intro](exhibition-screenshots/1440-intro.jpg) | [Spring](exhibition-screenshots/1440-spring.jpg) | [Pendulum](exhibition-screenshots/1440-pendulum.jpg) | [Optical](exhibition-screenshots/1440-beer-lambert.jpg) | [Sensor](exhibition-screenshots/1440-sensor.jpg) |
| 1280 × 900 | [Home](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1280-home.jpg) | [Intro](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1280-intro.jpg) | [Spring](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1280-spring.jpg) | [Pendulum](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1280-pendulum.jpg) | [Optical](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1280-beer-lambert.jpg) | [Sensor](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1280-sensor.jpg) |
| 1024 × 900 | [Home](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1024-home.jpg) | [Intro](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1024-intro.jpg) | [Spring](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1024-spring.jpg) | [Pendulum](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1024-pendulum.jpg) | [Optical](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1024-beer-lambert.jpg) | [Sensor](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1024-sensor.jpg) |
| 768 × 1000 | [Home](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/768-home.jpg) | [Intro](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/768-intro.jpg) | [Spring](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/768-spring.jpg) | [Pendulum](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/768-pendulum.jpg) | [Optical](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/768-beer-lambert.jpg) | [Sensor](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/768-sensor.jpg) |
| 390 × 1100 | [Home](exhibition-screenshots/390-home.jpg) | [Intro](exhibition-screenshots/390-intro.jpg) | [Spring](exhibition-screenshots/390-spring.jpg) | [Pendulum](exhibition-screenshots/390-pendulum.jpg) | [Optical](exhibition-screenshots/390-beer-lambert.jpg) | [Sensor](exhibition-screenshots/390-sensor.jpg) |

[Normal-motion Spring](https://github.com/luiscontrerasus-glitch/ModelScope/blob/667366616ac29beae00190afd00ca5c4eecdb4e0/docs/redesign/exhibition-screenshots/1440-spring-live.jpg) · [Detailed 1440px browser observations](exhibition-screenshots/exhibition-audit.json)

## Functional verification and preservation

- Home teaser → `/explore` intro → model section → shared analysis workspace verified in the production browser.
- All four analysis links verified against both the URL and actual workspace heading: `spring-hooke`, `pendulum`, `beer-lambert`, `sensor-calibration`.
- All four system anchors exercised at each requested width; optical `?model=beer-lambert` deep link directly selected the optical section at the sticky-index offset.
- Live Spring pose advanced while its range stayed at the user's value. Pause retained 0.1138m; dragging its actual free-end handle changed it to 0.1048m, then resume kept that starting pose.
- Live pendulum pose varied while amplitude stayed at 28°. Keyboard End changed amplitude smoothly to 60°, which remained stationary as the bob continued swinging.
- Live optical pose changed from 0.5625 to 0 while its concentration range remained at 0.45. Sensor load changed from 9.3221 to 1.3979 while its input range remained at 6.204. Only one scene and one running exhibit were observed.
- Added a regression test for suspending secondary exhibits without losing pose or pause preference, and resuming without a hidden-time jump. Existing controller cycles and inactivity takeover behavior are unchanged.
- Scientific calculation modules, APIs, datasets, exports, AI behavior and workspace components were not edited. Existing procedural instrument geometry and material definitions remain unchanged; the cinematic camera framing is opt-in for Explore.

The responsive review used browser viewports rather than physical devices. Existing fallback behavior remains intact; this pass did not force WebGL context loss or call external AI providers.
