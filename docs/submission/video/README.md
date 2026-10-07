# Final production demo

**Local export complete:** `modelscope-demo.mp4`, 2:45 (165.03 seconds including audio container tail), 1920×1080 H.264/AAC MP4, 30 FPS, approximately 5.04 MB. The MP4 exists beside this README in the working checkout and is deliberately Git-ignored. This relative filename is not a public video URL.

- [Synchronized captions](modelscope-demo.srt), 36 sentence-level cues, also burned into a dedicated bottom band.
- [Narration and shot script](modelscope-demo-script.md).
- [Exact timeline](timeline.json), 22 cuts covering all requested chapters.
- [Capture provenance](capture-manifest.json).
- [Export review](video-quality-audit.json).
- [Reproduction helper](render-demo.py), using existing FFmpeg/Pillow tooling and installed Windows Microsoft Zira Desktop narration. Raw recordings and WAVs remain local and ignored.

All product footage comes from https://modelscope-ten.vercel.app/. No localhost product recording, fake interactions, mocked Gemini, generated product imagery or music. A local player is used only to review the completed exported film. Most footage uses a 1600×900 CSS viewport inside a 1757×1080 recording surface, cropped and scaled into the output. The retained real AI panels use a close crop. The capture bridge did not reliably sustain 60 FPS; the 30 FPS export preserves timestamped real changes and holds frames between updates rather than synthesizing motion.

Provider waiting time is edited. Setup succeeds, is explicitly confirmed, and the explanation is actual successful Gemini prose. A temporary explanation failure was handled gracefully and retried once; the unsuccessful footage is not in the final cut. The demo does not imply offline or instantaneous AI.

**Public video URL pending:** upload the reviewed MP4 using the [YouTube package](../youtube-upload.md), verify playback while logged out, and replace video placeholders in README and both event drafts. Do not final-submit either event before resolving the rule questions and giving explicit authorization. A final human listen on headphones is recommended before publishing because this environment cannot independently assess the narration’s sound quality.
