# ModelScope visual redesign review

**Latest refinement:** [Graph-first workspace and Explore loading review](WORKSPACE.md), with optional data/evidence, responsive screenshots and normal/fast Explore recordings. [Home simplification and cinematic Explore](EXHIBITION.md) covers the preserved four-section architecture and its 30-view screenshot matrix. [Home instrument preview gallery](GALLERY.md) is retained as history. [Ambient motion and performance report](MOTION.md) covers the earlier control-free Home correction and measured frame cadence. [Previous structural polish report](POLISH.md) and the original visual-pass report below are also historical.

Branch: `modelscope-elite-redesign`. Starting verified revision: `dd83b26`. This is a local review build; it has not been pushed, deployed, or merged into main.

## Requested report

| # | Area | Result |
|---|---|---|
| 1 | Homepage | Warm-white exhibition, generous spacing, oversized Geist typography, direct analysis links, alternating light and dark scenes. |
| 2 | Hero interaction | Drag the spring's free end or use the keyboard-accessible extension slider. Geometry, ideal prediction, qualitative regime and illustrative comparison update. Production drag verified: 0.072 to 0.096 m, 3.60 to 4.80 N. |
| 3 | Dark explorer | One central instrument switches among four scientific models; a compact range adjusts the selected model and the spring/pendulum can be dragged. The selected button has a blue outline. Every exhibit opens its actual analysis session. |
| 4 | Spring | Procedural ten-turn metal helix, machined mounting plate, draggable handle, studio reflections, soft contact shadow. |
| 5 | Pendulum | Draggable metal bob, angle arc and accessible slider. Existing ideal pendulum formulas supply both periods; 60 degrees gives a 7.32% finite-amplitude increase. |
| 6 | Beer-Lambert | Procedural glass cuvette, blue solution, minimal optical hardware and visible beam. Concentration changes illustrative response and attenuation. Units follow the existing mmol/L experiment. |
| 7 | Sensor | Generic machined transducer with a visible gap that compresses as input increases. Synthetic voltage response; no physical mechanism or commercial specification claimed. |
| 8 | Thesis | Spacious dark conceptual model/measurement/residual graphic, explicitly labeled as an illustration rather than detector output. |
| 9 | Workspace | Bright three-column measurements/plots/evidence layout, compact controls, blue linked markers, existing fitted hinge comparison, amber sensitivity shading and a prominent actual transition summary. All original findings remain available in All findings. |
| 10 | Custom data | Quiet source-entry tabs, readable mapping fields and review; CSV, pasted tables, manual rows, explicit units/reference scale, setup proposals and evidence explanation retained. |
| 11 | Mobile | 390px layout: headline then spring then compact readout; one explorer scene and horizontal selector; workspace plots/residuals then evidence then measurements, with direct jump links. No horizontal page overflow. |
| 12 | Accessibility | Skip links, semantic sections/headings, labeled native ranges, keyboard equivalents for dragging, selected-state buttons, visible focus, preserved accessible linked plot points, mobile touch targets and reduced-motion styling. |
| 13 | Performance | Scene chunk loads lazily; an intersection coordinator mounts one canvas at a time. Demand rendering, hidden-tab pause, DPR capped at 1.5, 128px procedural environment, 256px contact shadows and explicit spring geometry disposal. No perpetual animation. |
| 14 | WebGL | Three.js, React Three Fiber and Drei; procedural geometry and local lighting only. No external models, textures, image assets or HDR downloads. Error/context-loss fallback keeps controls and readouts usable. |
| 15 | Screenshots | 13 actual production browser captures in screenshots/: eight desktop views at 1440 x 1000 and five mobile views at 390px, including all requested scenes plus custom data and mobile evidence. Mobile hero is 390 x 1041 to show the complete composition; other mobile captures are 390 x 1000. |
| 16 | Validation | All 290 existing tests pass. Typecheck, lint and production build pass. Production browser verifies both drags, range controls, model switching, linked selection, stale evidence/export disabling, built-in and custom analysis/export. |
| 17 | Commits | Stage commits listed below; all remain on the redesign branch. Original Git history is preserved. |
| 18 | Limits | Procedural studio illustrations simplify real instruments; the selector uses minimal schematic symbols rather than four extra WebGL thumbnails. Mobile was tested in a 390px browser viewport, not on physical phone hardware. WebGL recovery fallback is implemented but a forced context-loss scenario was not exercised. An upstream Three.js Clock deprecation warning does not affect rendering. |

## Preservation evidence

No changes to `src/lib`, API routes, scientific tests, custom-data parsing/configuration logic, or AI request/proposal/explanation logic. Workspace initial links call the existing experiment session factory; the plotted hinge uses the existing fitted candidate parameters. No refitting, new thresholds or export fields were introduced.

Browser downloads confirmed built-in schema `1.1.0` and custom schema `1.2.0`. The default spring retains its actual 0.080 m candidate and 0.075-0.085 m sensitivity range. These values are computed by the existing engine, not copied from the art references. The illustrative hero uses a separate 50 N/m toy spring, with a clear disclosure.

The mobile pasted-data workflow also analyzed 14 explicitly mapped linear observations with a user-entered 0.05 reference scale and correctly displayed No clear transition. Live AI provider calls were not retested during this visual-only audit; their implementation and security tests remain unchanged.

## Stage commits

- `eaf70aa` - Visual tokens, self-hosted Geist and 3D dependencies.
- `cb81e1a` - Light hero and procedural draggable spring.
- `1d74fe3` - Dark scientific model explorer.
- `27e23b3` - Pendulum, optical and sensor exhibits.
- `905afe4` - Conceptual thesis and quiet architecture.
- `1c4a14e` - Scientific workspace presentation.
- `a5f6f82` - Custom data presentation.
- `ef82847` - Mobile, accessibility and rendering refinements.
- `6510f33` - Production audit composition, sensor gap and optical contrast corrections.
- `dd2d6d2` - Adjustable controls for every explorer model and a clearer optical beam.

Final visual audit refinements and screenshots are committed after these stages; use `git log` for their final hashes.

## Visual audit

The references informed composition and material treatment. The first production pass showed the dark spring too close to its selector and the sensor gap obscured by the upper housing. Both were corrected; the cuvette's solution/beam contrast and thesis CTA were also refined. Workspace chrome was reduced so plot labels and legends have more room. The final views keep one dominant idea per exhibition screen, use small subordinate controls, avoid nested evidence cards, and keep all scientific detail accessible.

## Review images

| Desktop, 1440 x 1000 | Mobile, 390px |
|---|---|
| [Hero](screenshots/01-desktop-hero.jpg) | [Hero](screenshots/09-mobile-hero.jpg) |
| [Model explorer / Spring](screenshots/02-desktop-explorer.jpg) | [Model explorer](screenshots/10-mobile-explorer.jpg) |
| [Pendulum](screenshots/03-desktop-pendulum.jpg) | [Workspace plots](screenshots/11-mobile-workspace.jpg) |
| [Beer-Lambert](screenshots/04-desktop-beer-lambert.jpg) | [Evidence](screenshots/12-mobile-evidence.jpg) |
| [Sensor](screenshots/05-desktop-sensor.jpg) | [Custom data](screenshots/13-mobile-custom-data.jpg) |
| [Thesis](screenshots/06-desktop-thesis.jpg) | |
| [Scientific workspace](screenshots/07-desktop-workspace.jpg) | |
| [Custom data](screenshots/08-desktop-custom-data.jpg) | |

Run `npm run build` then `npm start`. Open `/` for the exhibition and `/workspace?experiment=spring-hooke` for an analyzed built-in session. `/workspace?experiment=custom` opens custom data; `/workspace` preserves the original ready-to-run spring state.

