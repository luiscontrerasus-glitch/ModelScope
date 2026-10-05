# Actual product screenshot manifest

Captured from the local production application on October 4, 2026. Desktop viewport: 1440 × 1000; mobile: approximately 390 × 844. Full-page images preserve the actual workspace. Images contain no keys, devtools, or fabricated scientific results. These show the release candidate locally, not proof of a public deployment.

## Recommended six submission images

| Image | Caption |
| --- | --- |
| [Spring analysis](02-spring-analysis.jpg) | Measurements, model response, residuals, and traceable candidate transition. |
| [Transition and residuals](03-transition-residuals.jpg) | Sustained model disagreement and a sensitivity range, not a confidence interval. |
| [Pendulum](05-pendulum.jpg) | Testing a fixed small-angle theoretical model against synthetic measurements. |
| [Beer–Lambert](06-beer-lambert.jpg) | Exploring model adequacy in a chemistry example. |
| [Custom setup](07-custom-setup.jpg) | Explicit data mappings, units, baseline, and assumed response scale before analysis. |
| [Mobile Spring](09b-mobile-spring.jpg) | The same scientific workflow in a responsive mobile layout. |

Additional actual captures: [landing](01-landing.jpg), [expanded evidence](04-expanded-evidence.jpg), [sensor calibration](06b-sensor.jpg), [mobile custom analysis](09-mobile-custom.jpg), and [mobile landing](09c-mobile-landing.jpg).

## Internal mock — excluded from submission

[AI proposal interface test](internal/08-ai-proposal-MOCK.jpg) is a browser-intercepted test response. Its visible rationale says **INTERNAL MOCK**, and its warning explicitly excludes it from submissions. It establishes proposal presentation and confirmation behavior only. No live Gemini request occurred. Do not use it in Devpost, README marketing, or demo footage. Replace it only with actual provider footage after successful live verification.

The final origin-guard changes affect server request validation, not scientific results or the recorded UI. Final mobile touch-target sizing is rechecked separately in the [release record](../release-verification.md).
