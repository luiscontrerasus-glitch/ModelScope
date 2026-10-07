# Final ModelScope demo script

Runtime: **2:45 (165 seconds)**. Export: **1920×1080, H.264 MP4, 30 FPS**, AAC narration. Actual production footage only: https://modelscope-ten.vercel.app/. Local installed Microsoft Zira Desktop narrates the text below. No music. Captions use a dedicated bottom band and never cover product graphs/readouts. No fabricated interactions or provider output. Synthetic educational labels stay visible.

The capture bridge could not sustain 60 FPS; instrument motion yielded roughly 17–21 changing frames/second, while static pages emitted fewer frames. The exporter holds the actual last frame between timestamped updates; it does not interpolate invented scientific motion. Short navigation/wait transitions are edited. Most footage uses a 1600×900 CSS viewport on a 1757×1080 physical capture surface, cropped to 1656×932 and fitted inside the 1920×1080 export. Real AI footage retains its earlier capture and uses a panel crop. Output resolution is not a claim of native 1920-pixel source detail.

## 0:00–0:10 · 01-home

Students learn equations as if they work everywhere. Scientific models are approximations. Understanding where they stop matching reality is part of understanding the science.

## 0:10–0:14 · 02-explore-spring

ModelScope makes those limits visible across mechanics,

## 0:14–0:18 · 03-explore-pendulum

physics approximations,

## 0:18–0:22 · 04-explore-beer

chemistry,

## 0:22–0:25 · 05-explore-sensor

and instrumentation.

## 0:25–0:37 · 06-spring-run

Here, ModelScope tests Hookeâ€™s law against synthetic spring measurements. It fits the configured baseline, then compares continuous segmented alternatives on the same observations.

## 0:37–0:45 · 07-measurements

Each finding links back to its measurements. Students can inspect and edit the source values, then rerun the analysis.

## 0:45–0:54 · 08-comparison

A better segmented fit alone is not enough. ModelScope penalizes additional complexity and the search across candidate transitions.

## 0:54–1:03 · 09-residuals

It requires sustained, same-direction residual disagreement. An influence safeguard checks that one unusual point does not automatically create support.

## 1:03–1:12 · 10-evidence

Here, the supported transition is near zero point zero eight meters. Its sensitivity range is not a confidence interval or proof of a physical mechanism.

## 1:12–1:17 · 11-pendulum-analysis

The same framework tests the small-angle pendulum approximation,

## 1:17–1:22 · 12-beer-analysis

Beerâ€“Lambert calibration,

## 1:22–1:28 · 13-sensor-analysis

and sensor linearity, with model-specific assumptions and units.

## 1:28–1:34 · 14-custom-input

Students can bring CSV, pasted tables, or manual measurements.

## 1:34–1:46 · 15-custom-config

They map variables, choose a supported model, declare units, and provide a justified measurement response scale. No uncertainty is silently invented.

## 1:46–1:52 · 16-custom-result

Their data runs through the same deterministic evidence pipeline.

## 1:52–1:59 · 17-ai-setup-request

Gemini translates the experiment description into a constrained setup proposal.

## 1:59–2:05 · 18-ai-confirm

The student reviews and confirms it. The response scale remains their responsibility.

## 2:05–2:12 · 19b-ai-explain-retry

Gemini explains existing evidence without choosing breakpoints or changing support states.

## 2:12–2:18 · 20-ai-reading

AI explains. The analysis engine decides.

## 2:18–2:33 · 21-architecture

Raw measurements stay in the browser for normal analysis. Optional AI receives only description and headers, or a selected finding and summary context. Avoid sensitive context.

## 2:33–2:45 · 22-closing

ModelScope helps students learn not only how equations work, but when those equations deserve to be trusted. Equations have limits. Find them.

## Provenance and live AI

Footage uses ordinary UI actions on the public deployment. Setup received one real request, HTTP 200, with the requested force/extension description and headers. Explain first returned a sanitized HTTP 503; one retry returned HTTP 200. The successful retry and actual optional prose are used in the cut. No failure has been relabeled as success. The original failure recording remains local for review. The setup confirmation is shown; the measurement scale remains a user decision. Spring stays ~0.080 m, improvement 84.02.

## Reproduction

Run `python docs/submission/video/render-demo.py` with the local ignored raw captures, installed Windows speech voices, Pillow and imageio-ffmpeg. Rendering is artifact-only and never changes the product. The script emits captions and `timeline.json`; render intermediates, WAVs, raw frames and MP4 are ignored. Check `capture-manifest.json` for source/rates and the video README for audit status.
