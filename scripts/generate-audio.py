"""Generate bundled English audio from CLIPS; never runs in the game.

Pronunciation, voice and pace are tracked with a file checksum. A changed script
regenerates its recording automatically instead of retaining an outdated MP3.
Hebrew uses generate-hebrew-audio.py with explicit phonemes and a voice profile.
"""
import argparse
import asyncio
import hashlib
import json
from pathlib import Path
import edge_tts


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='JSON export of CLIPS')
    parser.add_argument('output', type=Path, help='Recording directory')
    parser.add_argument('--language', choices=['en-US'], default='en-US')
    parser.add_argument('--voice-en', help='Override the selected English voice')
    parser.add_argument('--rate-en', help='Override the selected speaking rate')
    parser.add_argument('--keys', nargs='+', help='Only regenerate these clip IDs')
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    source, output = args.source, args.output
    output.mkdir(parents=True, exist_ok=True)
    clips = json.loads(source.read_text(encoding="utf-8-sig"))
    if args.keys and set(args.keys) - clips.keys():
        parser.error('Unknown clip IDs: ' + ', '.join(sorted(set(args.keys) - clips.keys())))
    manifest_path = output / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'version': 1, 'clips': {}}
    english_settings = json.loads(Path(__file__).with_name('english-voice-settings.json').read_text(encoding='utf-8'))
    reviewed_words = set(english_settings['words'])
    semaphore = asyncio.Semaphore(3)
    generated = 0
    retained = 0

    async def generate(key, clip):
        nonlocal generated, retained
        path = output / f"{key}.mp3"
        speech = clip.get('speech', clip['text'])
        reviewed_word = speech.strip().lower().rstrip('.!?') in reviewed_words
        previous = manifest['clips'].get(key, {})
        # Keep approved recordings of unchanged scripts. New or edited English uses
        # English-only Ava so a short word cannot switch languages during synthesis.
        keep_voice = not reviewed_word and previous.get('speech') == speech and previous.get('lang') == clip['lang']
        voice = previous.get('voice') if keep_voice else None
        desired = {
            'lang': clip['lang'], 'speech': speech,
            'voice': args.voice_en or voice or english_settings['voice'],
            'rate': args.rate_en or (english_settings['rate'] if reviewed_word else '+0%'),
        }
        if not args.force and path.exists() and path.stat().st_size > 1000:
            if all(previous.get(field) == value for field, value in desired.items()) and previous.get('sha256') == hashlib.sha256(path.read_bytes()).hexdigest():
                retained += 1
                return
        temporary = output / f'{key}.mp3.part'
        async with semaphore:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(desired['speech'], desired['voice'], rate=desired['rate']).save(str(temporary))
                    data = temporary.read_bytes()
                    if len(data) < 1000 or not (data.startswith(b'ID3') or data[0] == 0xff and data[1] & 0xe0 == 0xe0):
                        raise RuntimeError("Empty audio")
                    temporary.replace(path)
                    manifest['clips'][key] = {**desired, 'sha256': hashlib.sha256(data).hexdigest()}
                    generated += 1
                    print(f"Generated {key}", flush=True)
                    return
                except Exception as error:
                    temporary.unlink(missing_ok=True)
                    if attempt == 2:
                        raise RuntimeError(f"Audio failed for {key}: {type(error).__name__}") from error
                    await asyncio.sleep(2 + attempt)

    selected = {key: clip for key, clip in clips.items() if (not args.language or clip['lang'] == args.language) and (not args.keys or key in args.keys)}
    if args.keys and set(args.keys) - selected.keys():
        parser.error('Hebrew clips require generate-hebrew-audio.py')
    results = await asyncio.gather(*(generate(key, clip) for key, clip in selected.items()), return_exceptions=True)
    manifest['clips'] = dict(sorted(manifest['clips'].items()))
    pending = manifest_path.with_suffix('.json.part')
    pending.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    pending.replace(manifest_path)
    failures = [result for result in results if isinstance(result, BaseException)]
    if failures:
        raise RuntimeError('; '.join(str(failure) for failure in failures))
    print(f"Ready: {generated} regenerated, {retained} already current", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
