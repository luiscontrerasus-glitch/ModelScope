"""Render real production CDP recordings; never synthesize product frames.

Requires existing imageio-ffmpeg, Pillow, and Windows System.Speech.
Raw footage, WAVs and MP4s are intentionally ignored by Git.
"""
from pathlib import Path
import json, subprocess, wave, textwrap
import imageio_ffmpeg
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SHOTS = [
    ('01-home', 10, 'Students learn equations as if they work everywhere. Scientific models are approximations. Understanding where they stop matching reality is part of understanding the science.'),
    ('02-explore-spring', 4, 'ModelScope makes those limits visible across mechanics,'),
    ('03-explore-pendulum', 4, 'physics approximations,'),
    ('04-explore-beer', 4, 'chemistry,'),
    ('05-explore-sensor', 3, 'and instrumentation.'),
    ('06-spring-run', 12, 'Here, ModelScope tests Hooke\u2019s law against synthetic spring measurements. It fits the configured baseline, then compares continuous segmented alternatives on the same observations.'),
    ('07-measurements', 8, 'Each finding links back to its measurements. Students can inspect and edit the source values, then rerun the analysis.'),
    ('08-comparison', 9, 'A better segmented fit alone is not enough. ModelScope penalizes additional complexity and the search across candidate transitions.'),
    ('09-residuals', 9, 'It requires sustained, same-direction residual disagreement. An influence safeguard checks that one unusual point does not automatically create support.'),
    ('10-evidence', 9, 'Here, the supported transition is near zero point zero eight meters. Its sensitivity range is not a confidence interval or proof of a physical mechanism.'),
    ('11-pendulum-analysis', 5, 'The same framework tests the small-angle pendulum approximation,'),
    ('12-beer-analysis', 5, 'Beer\u2013Lambert calibration,'),
    ('13-sensor-analysis', 6, 'and sensor linearity, with model-specific assumptions and units.'),
    ('14-custom-input', 6, 'Students can bring CSV, pasted tables, or manual measurements.'),
    ('15-custom-config', 12, 'They map variables, choose a supported model, declare units, and provide a justified measurement response scale. No uncertainty is silently invented.'),
    ('16-custom-result', 6, 'Their data runs through the same deterministic evidence pipeline.'),
    ('17-ai-setup-request', 7, 'Gemini translates the experiment description into a constrained setup proposal.'),
    ('18-ai-confirm', 6, 'The student reviews and confirms it. The response scale remains their responsibility.'),
    ('19b-ai-explain-retry', 7, 'Gemini explains existing evidence without choosing breakpoints or changing support states.'),
    ('20-ai-reading', 6, 'AI explains. The analysis engine decides.'),
    ('21-architecture', 15, 'Raw measurements stay in the browser for normal analysis. Optional AI receives only description and headers, or a selected finding and summary context. Avoid sensitive context.'),
    ('22-closing', 12, 'ModelScope helps students learn not only how equations work, but when those equations deserve to be trusted. Equations have limits. Find them.'),
]

def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)

def timecode(seconds):
    milliseconds = round(seconds * 1000)
    h, milliseconds = divmod(milliseconds, 3600000)
    m, milliseconds = divmod(milliseconds, 60000)
    s, milliseconds = divmod(milliseconds, 1000)
    return f'{h:02}:{m:02}:{s:02},{milliseconds:03}'

def prepare():
    (ROOT / 'render').mkdir(exist_ok=True)
    cues, timeline, elapsed = [], [], 0
    contact = Image.new('RGB', (960, 135 * len(SHOTS)), '#181c23')
    draw = ImageDraw.Draw(contact)
    for index, (name, duration, narration) in enumerate(SHOTS):
        folder = ROOT / 'capture' / name
        manifest = json.loads((folder / 'frames.json').read_text())
        frames = manifest['frames']
        assert frames, name
        # Preserve real source timing. Static pages legitimately emit fewer frames.
        origin = frames[0]['timestamp']
        selected = [f for f in frames if f['timestamp'] - origin < duration]
        concat = []
        for i, frame in enumerate(selected):
            t = max(0, frame['timestamp'] - origin)
            end = min(duration, selected[i+1]['timestamp']-origin) if i+1 < len(selected) else duration
            if end > t:
                concat += [f"file '{(folder / frame['file']).as_posix()}'", f'duration {end-t:.6f}']
        concat.append(f"file '{(folder / selected[-1]['file']).as_posix()}'")
        (ROOT / 'render' / f'{name}.ffconcat').write_text('\n'.join(concat)+'\n')
        # Local installed Windows narration; no account or third-party TTS request.
        (ROOT / 'render' / f'{name}.txt').write_text(narration, encoding='utf-8')
        for column, frame in enumerate([selected[0], selected[len(selected)//2], selected[-1]]):
            picture = Image.open(folder / frame['file']).convert('RGB')
            picture.thumbnail((240,135))
            contact.paste(picture,(column*240,index*135))
        draw.text((725,index*135+25),f'{name}\n{elapsed:03}s / {duration}s',fill='white')
        timeline.append({'clip':name,'start':elapsed,'duration':duration,'narration':narration})
        elapsed += duration
    contact.save(ROOT / 'render' / 'source-contact-sheet.jpg',quality=93)
    (ROOT / 'timeline.json').write_text(json.dumps(timeline,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    assert elapsed == 165
    return timeline

def render(timeline):
    narration_script = ROOT / 'render' / 'narrate.ps1'
    narration_script.write_text('''$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$narrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
$narrator.SelectVoice('Microsoft Zira Desktop')
$narrator.Rate = 1
$shots = Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\\timeline.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($shot in $shots) {
    $wav = Join-Path $PSScriptRoot ($shot.clip + '.wav')
    $narrator.SetOutputToWaveFile($wav)
    $narrator.Speak($shot.narration)
    $narrator.SetOutputToNull()
}
$narrator.Dispose()
''',encoding='utf-8-sig')
    if not all((ROOT/'render'/f"{s['clip']}.wav").exists() and (ROOT/'render'/f"{s['clip']}.wav").stat().st_size > 1000 for s in timeline):
        run(['powershell','-NoProfile','-File',str(narration_script)])
    srt, cue_count = [], 0
    for shot in timeline:
        name, duration = shot['clip'], shot['duration']
        wav = ROOT / 'render' / f'{name}.wav'
        with wave.open(str(wav)) as stream:
            spoken = stream.getnframes()/stream.getframerate()
        # Small, documented speed adjustment only if local voice overruns its shot.
        speed = max(1, spoken/(duration-0.5))
        if speed > 1.35:
            raise ValueError(f'Voice too rushed: {name}, {spoken}s into {duration}s')
        sentences = shot['narration'].split('. ')
        words = sum(len(s.split()) for s in sentences)
        offset = 0
        for sentence in sentences:
            part = (spoken/speed)*len(sentence.split())/words
            cue_count += 1
            caption = '\n'.join(textwrap.wrap(sentence if sentence.endswith(('.',',','!','?')) else sentence+'.',width=72))
            srt += [str(cue_count),f"{timecode(shot['start']+offset)} --> {timecode(shot['start']+offset+part)}",caption,'']
            offset += part
        # Physical browser surface includes unused area around a 1600x900 CSS
        # viewport. Retained real AI footage uses a close crop without the nav.
        crop = 'crop=1757:990:0:90' if name.startswith(('17-','18-','19b-','20-')) else 'crop=1656:932:0:0'
        vf = crop+',scale=1692:952:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:8:color=0x0B0F16,setsar=1,fps=30'
        run([FFMPEG,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(ROOT/'render'/f'{name}.ffconcat'),'-i',str(wav),'-vf',vf,'-af',f'atempo={speed:.6f},apad','-t',str(duration),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','128k',str(ROOT/'render'/f'{name}.mp4')])
    (ROOT/'modelscope-demo.srt').write_text('\n'.join(srt),encoding='utf-8')
    (ROOT/'render'/'join.ffconcat').write_text('\n'.join(f"file '{(ROOT/'render'/(s['clip']+'.mp4')).as_posix()}'" for s in timeline)+'\n')
    run([FFMPEG,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(ROOT/'render'/'join.ffconcat'),'-c:v','copy','-c:a','aac','-ar','48000','-af','aresample=async=1:first_pts=0','-t','165',str(ROOT/'render'/'uncaptioned.mp4')])
    # Run from ROOT so the subtitle path contains no Windows drive-colon escape.
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i','render/uncaptioned.mp4','-vf',"subtitles=modelscope-demo.srt:force_style='FontName=Arial,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&H000B0F16,BorderStyle=1,Outline=0.6,Shadow=0,Alignment=2,MarginV=8'",'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart','modelscope-demo.mp4'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
    print(json.dumps({'output':'docs/submission/video/modelscope-demo.mp4','duration':165,'resolution':[1920,1080],'fps':30,'voice':'Local installed Microsoft Zira Desktop','music':False,'bytes':(ROOT/'modelscope-demo.mp4').stat().st_size}))

if __name__ == '__main__':
    import sys
    timeline = prepare()
    if '--prepare-only' not in sys.argv:
        render(timeline)
