"""Compare actual Hebrew recordings with reviewed IPA, using a local ASR model.

This is a diagnostic check, not proof of correct pronunciation or a substitute
for listening. No audio leaves the computer. See README for model provenance.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import time

import av
import numpy as np
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from transformers.utils import logging

MODEL = 'notmax123/whisper-heb-ipa@6f7c493615d163a99ed6ea09b2cb7241760d868b'


def normalize(text):
    for old, new in [('t͡s', 'ts'), ('ʦ', 'ts'), ('ʃ', 'sh'), ('ʒ', 'zh'), ('χ', 'x'), ('ʁ', 'r'), ('ɡ', 'g')]:
        text = text.replace(old, new)
    return re.sub(r'[^a-z ]', '', text.lower()).strip()


def distance(left, right):
    previous = list(range(len(right) + 1))
    for row, a in enumerate(left, 1):
        current = [row]
        for column, b in enumerate(right, 1):
            current.append(min(current[-1] + 1, previous[column] + 1, previous[column - 1] + (a != b)))
        previous = current
    return previous[-1]


def samples(path):
    resampler = av.AudioResampler(format='fltp', layout='mono', rate=16000)
    frames = []
    with av.open(str(path)) as container:
        for frame in container.decode(audio=0):
            frames.extend(part.to_ndarray().flatten() for part in resampler.resample(frame))
        frames.extend(part.to_ndarray().flatten() for part in resampler.resample(None))
    return np.concatenate(frames).astype(np.float32)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='JSON export of CLIPS')
    parser.add_argument('audio_dir', type=Path)
    parser.add_argument('--model-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--keys', nargs='+')
    parser.add_argument('--no-quantize', action='store_true')
    args = parser.parse_args()
    clips = json.loads(args.source.read_text(encoding='utf-8-sig'))
    selected = {key: clip for key, clip in clips.items() if clip['lang'] == 'he-IL' and (not args.keys or key in args.keys)}
    if args.keys and set(args.keys) - selected.keys():
        parser.error('Unknown Hebrew clip IDs: ' + ', '.join(sorted(set(args.keys) - selected.keys())))
    report = json.loads(args.output.read_text(encoding='utf-8')) if args.output.exists() else {'clips': {}}
    precision = 'float32' if args.no_quantize else 'dynamic-int8'
    model_hash = hashlib.sha256()
    for name in ['model.safetensors', 'config.json', 'generation_config.json', 'tokenizer.json', 'tokenizer_config.json', 'processor_config.json']:
        with (args.model_dir / name).open('rb') as file:
            while block := file.read(1024 * 1024):
                model_hash.update(block)
    signature = {'model': MODEL, 'model_sha256': model_hash.hexdigest(), 'precision': precision, 'checker_version': 1}
    if any(report.get(key) != value for key, value in signature.items()):
        report = {**signature, 'clips': {}}
    logging.set_verbosity_error()
    torch.set_num_threads(8)
    processor = WhisperProcessor.from_pretrained(args.model_dir, local_files_only=True)
    model = WhisperForConditionalGeneration.from_pretrained(args.model_dir, local_files_only=True, dtype=torch.float32).eval()
    if not args.no_quantize:
        model = torch.ao.quantization.quantize_dynamic(model, {torch.nn.Linear}, dtype=torch.qint8)
    print('Local phonetic checker ready', flush=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    for key, clip in selected.items():
        expected = clip.get('speech', '')
        if not expected or any('\u0590' <= char <= '\u05ff' for char in expected):
            raise RuntimeError(f'Reviewed phonemes required: {key}')
        path = args.audio_dir / f'{key}.mp3'
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        cached = report['clips'].get(key, {})
        if cached.get('sha256') == digest and cached.get('expected_ipa') == expected:
            continue
        start = time.monotonic()
        data = samples(path)
        utterances = []
        for offset in range(0, len(data), 25 * 16000):
            inputs = processor(data[offset:offset + 25 * 16000], sampling_rate=16000, return_tensors='pt', return_attention_mask=True)
            with torch.inference_mode():
                tokens = model.generate(**inputs, language='he', task='transcribe', max_new_tokens=440, do_sample=False, num_beams=1, use_cache=True)
            utterances.append(processor.batch_decode(tokens, skip_special_tokens=True)[0])
        actual = ' '.join(utterances)
        expected_normal, actual_normal = normalize(expected), normalize(actual)
        record = {
            'sha256': digest, 'expected_ipa': expected, 'detected_ipa': actual,
            'phoneme_edit_ratio': round(distance(expected_normal, actual_normal) / max(1, len(expected_normal)), 4),
            'seconds': round(time.monotonic() - start, 2),
        }
        report['clips'][key] = record
        pending = args.output.with_suffix('.json.part')
        pending.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        pending.replace(args.output)
        print(f'{key}: ratio={record["phoneme_edit_ratio"]}\n  expected: {expected}\n  detected: {actual}', flush=True)
    print(f'Ready: {len(selected)} Hebrew recordings checked', flush=True)


if __name__ == '__main__':
    main()
