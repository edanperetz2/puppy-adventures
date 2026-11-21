// Shared by the classic service worker, local server and static release build.
// The reviewed masters use 24 kHz mono MPEG-2 Layer III (576 samples per frame).
globalThis.prepareNarrationMp3 = function prepareNarrationMp3(source) {
  let start = 0;
  const tagged = source[0] === 0x49 && source[1] === 0x44 && source[2] === 0x33;
  if (tagged) {
    if (source[3] !== 4 || source[5] !== 0) throw new Error('Unexpected narration ID3 format');
    start = 10;
    let tagBytes = 0;
    for (const byte of source.subarray(6, 10)) {
      if (byte > 127) throw new Error('Invalid ID3 length');
      tagBytes = tagBytes * 128 + byte;
    }
    start += tagBytes;
  }
  const rate = source[start + 2];
  const frameBytes = rate === 0x64 ? 144 : rate === 0x84 ? 192 : 0;
  const validHeader = offset => source[offset] === 0xff && source[offset + 1] === 0xf3 &&
    source[offset + 2] === rate && (source[offset + 3] & 0xc0) === 0xc0;
  if (!frameBytes || !validHeader(start) || (source.length - start) % frameBytes) {
    throw new Error('Expected a complete constant-bitrate narration master');
  }
  // The Hebrew encoder writes a separate Info seek/duration frame. Its offsets
  // describe the master. Deliver raw CBR, as in the English masters, so players
  // derive the new duration from length. Every encoded sound frame is retained.
  if (tagged) {
    const view = new DataView(source.buffer, source.byteOffset + start, source.length - start);
    if (view.getUint32(13) !== 0x496e666f || view.getUint32(17) !== 15 ||
        view.getUint32(21) !== view.byteLength / frameBytes - 1 || view.getUint32(25) !== view.byteLength) {
      throw new Error('Unexpected narration seek header');
    }
    start += frameBytes;
  }
  if (start >= source.length || source[start + 4] !== 0) throw new Error('Missing first independent narration frame');
  for (let offset = start; offset < source.length; offset += frameBytes) {
    if (!validHeader(offset)) throw new Error('Unexpected frame in narration master');
  }
  // Eight independent frames of digital silence give output time to open
  // before even a quiet consonant. Never trim, fade or re-encode the voice.
  const leadBytes = 8 * frameBytes;
  const result = new Uint8Array(leadBytes + source.length - start);
  const header = source.subarray(start, start + 4);
  for (let offset = 0; offset < leadBytes; offset += frameBytes) result.set(header, offset);
  result.set(source.subarray(start), leadBytes);
  return result;
};
