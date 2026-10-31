"""Optional development tool. pip install edge-tts; never runs in the game.

Reads a JSON export of CLIPS (see README). Generates static MP3 assets using
edge-tts. No account, key or paid subscription is used. Existing files are kept.
"""
import asyncio
import json
from pathlib import Path
import sys
import edge_tts


async def main():
    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    output.mkdir(parents=True, exist_ok=True)
    clips = json.loads(source.read_text(encoding="utf-8-sig"))
    semaphore = asyncio.Semaphore(3)

    async def generate(key, clip):
        path = output / f"{key}.mp3"
        if path.exists() and path.stat().st_size > 1000:
            return
        voice = "he-IL-HilaNeural" if clip["lang"] == "he-IL" else "en-US-JennyNeural"
        async with semaphore:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(clip["text"], voice, rate="-12%").save(str(path))
                    if path.stat().st_size < 1000:
                        raise RuntimeError("Empty audio")
                    print(f"Generated {key}", flush=True)
                    return
                except Exception as error:
                    if attempt == 2:
                        raise RuntimeError(f"Audio failed for {key}: {type(error).__name__}") from error
                    await asyncio.sleep(2 + attempt)

    await asyncio.gather(*(generate(key, clip) for key, clip in clips.items()))
    print(f"Ready: {len(clips)} clips", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
