"""Generate Hebrew MP3s from reviewed IPA and a local Ava-reference profile.

Requires BlueTTS, NumPy and PyAV during development only. No runtime TTS, cloud
account, child voice, or paid API is involved. See README for the model bundle.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import time
import av
import numpy as np
from blue_onnx import BlueTTS


def fingerprint(paths):
    digest = hashlib.sha256()
    for path in paths:
        digest.update(path.name.encode('utf-8'))
        with path.open('rb') as source:
            while block := source.read(1024 * 1024):
                digest.update(block)
    return digest.hexdigest()


def write_mp3(path, samples, sample_rate):
    with av.open(str(path), mode='w', format='mp3') as output:
        stream = output.add_stream('libmp3lame', rate=24000)
        stream.layout = 'mono'
        stream.bit_rate = 64000
        resampler = av.AudioResampler(format='fltp', layout='mono', rate=24000)
        frame = av.AudioFrame.from_ndarray(samples.reshape(1, -1), format='fltp', layout='mono')
        frame.sample_rate = sample_rate
        for part in resampler.resample(frame) + resampler.resample(None):
            for packet in stream.encode(part):
                output.mux(packet)
        for packet in stream.encode(None):
            output.mux(packet)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='JSON export of CLIPS')
    parser.add_argument('output', type=Path)
    parser.add_argument('--model-dir', type=Path, required=True)
    parser.add_argument('--style', type=Path, required=True)
    parser.add_argument('--takes', type=Path, default=Path(__file__).with_name('hebrew-takes.json'), help='Reviewed deterministic take numbers by clip ID')
    parser.add_argument('--keys', nargs='+')
    parser.add_argument('--speed', type=float, default=0.95)
    parser.add_argument('--steps', type=int, default=16)
    args = parser.parse_args()
    clips = json.loads(args.source.read_text(encoding='utf-8-sig'))
    takes = json.loads(args.takes.read_text(encoding='utf-8'))
    for key, take in takes.items():
        if key not in clips or clips[key]['lang'] != 'he-IL' or type(take) is not int or take < 0:
            parser.error(f'Invalid reviewed take: {key}')
    args.output.mkdir(parents=True, exist_ok=True)
    manifest_path = args.output / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'version': 1, 'clips': {}}
    style_hash = hashlib.sha256(args.style.read_bytes()).hexdigest()
    model_hash = fingerprint([args.model_dir / file for file in ['duration_predictor.onnx', 'text_encoder.onnx', 'vector_estimator.onnx', 'vocoder.onnx', 'tts.json', 'vocab.json']])
    vocab = json.loads((args.model_dir / 'vocab.json').read_text(encoding='utf-8'))['char_to_id']
    selected = {key: clip for key, clip in clips.items() if clip['lang'] == 'he-IL' and (not args.keys or key in args.keys)}
    if args.keys and set(args.keys) - selected.keys():
        parser.error('Unknown Hebrew clip IDs: ' + ', '.join(sorted(set(args.keys) - selected.keys())))
    tts = None
    generated = retained = 0
    for key, clip in selected.items():
        speech = clip.get('speech', '')
        if not speech or any('\u0590' <= char <= '\u05ff' for char in speech):
            raise RuntimeError(f'Reviewed phonemes required: {key}')
        unknown = set(speech) - set(vocab)
        if unknown:
            raise RuntimeError(f'Unknown phonemes for {key}: {unknown}')
        take = takes.get(key, 0)
        # Keep long instructions in short sentences; long synthesis can swallow
        # a word even when the phonemes are explicit. Short clips stay intact.
        segments = re.split(r'(?<=[.!?])\s+', speech) if len(speech) > 140 else [speech]
        desired = {'lang': 'he-IL', 'speech': speech, 'segments': segments, 'voice': 'Ava reference', 'engine': 'BlueTTS phonemes', 'rate': args.speed, 'steps': args.steps, 'take': take, 'style_sha256': style_hash, 'model_sha256': model_hash}
        path = args.output / f'{key}.mp3'
        previous = {'take': 0, 'segments': [speech], **manifest['clips'].get(key, {})}
        if path.exists() and all(previous.get(field) == value for field, value in desired.items()) and previous.get('sha256') == hashlib.sha256(path.read_bytes()).hexdigest():
            retained += 1
            manifest['clips'][key] = previous
            continue
        if tts is None:
            tts = BlueTTS(onnx_dir=str(args.model_dir), style_json=str(args.style))
        start = time.monotonic()
        seed_text = key if take == 0 else f'{key}:take-{take}'
        parts = []
        for index, segment in enumerate(segments):
            segment_seed = seed_text if index == 0 else f'{seed_text}:part-{index}'
            np.random.seed(int(hashlib.sha256(segment_seed.encode('utf-8')).hexdigest()[:8], 16))
            part, sample_rate = tts.synthesize(segment, lang='he', total_step=args.steps, speed=args.speed, silence_duration=0.18, text_is_phonemes=True, normalize_text=False)
            if index:
                parts.append(np.zeros(round(sample_rate * .22), dtype=np.float32))
            parts.append(part)
        samples = np.concatenate(parts)
        if not len(samples) or not np.isfinite(samples).all() or np.max(np.abs(samples)) < .001:
            raise RuntimeError(f'Invalid/silent generated audio: {key}')
        duration = len(samples) / sample_rate
        if duration > 28:
            raise RuntimeError(f'Recording exceeds the playback limit: {key} ({duration:.1f}s)')
        samples = np.concatenate([np.zeros(round(sample_rate * .06), dtype=np.float32), samples, np.zeros(round(sample_rate * .14), dtype=np.float32)])
        temporary = args.output / f'{key}.mp3.part'
        write_mp3(temporary, samples, sample_rate)
        data = temporary.read_bytes()
        if len(data) < 1000:
            raise RuntimeError(f'Empty recording: {key}')
        temporary.replace(path)
        manifest['clips'][key] = {**desired, 'sha256': hashlib.sha256(data).hexdigest()}
        pending = manifest_path.with_suffix('.json.part')
        pending.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        pending.replace(manifest_path)
        generated += 1
        print(f'Generated {key}: {duration:.1f}s audio ({time.monotonic()-start:.1f}s)', flush=True)
    pending = manifest_path.with_suffix('.json.part')
    pending.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    pending.replace(manifest_path)
    print(f'Ready: {generated} regenerated, {retained} already current', flush=True)


if __name__ == '__main__':
    main()
