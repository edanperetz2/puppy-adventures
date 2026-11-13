// 8 kHz, 40 Mel cepstra and three adjacent frames: the Uni2005 model's inputs.
const rate = 8000;
const windowSize = 200;
const hop = 80;
const fftSize = 256;
const bands = 40;

const window = Float64Array.from({ length: windowSize }, (_, i) => (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (windowSize - 1))) ** 0.85);
const basis = Array.from({ length: bands }, (_, i) => Float64Array.from({ length: bands }, (_, j) =>
  Math.cos(Math.PI / bands * i * (j + 0.5)) * Math.sqrt((i === 0 ? 1 : 2) / bands)));
const mel = hz => 2595 * Math.log10(1 + hz / 700);
const bandWidth = (mel(3800) - mel(40)) / (bands + 1);
const filterbank = Array.from({ length: bands }, (_, band) =>
  Float64Array.from({ length: fftSize / 2 + 1 }, (_, bin) =>
    Math.max(0, 1 - Math.abs(mel(bin * rate / fftSize) - (mel(40) + bandWidth * (band + 1))) / bandWidth)));

function speechRange(samples) {
  const levels = [];
  for (let offset = 0; offset + hop <= samples.length; offset += hop) {
    let sum = 0;
    for (let i = offset; i < offset + hop; i++) sum += samples[i] ** 2;
    levels.push(Math.sqrt(sum / hop));
  }
  const peak = Math.max(0, ...levels);
  if (peak < 0.006) throw new Error('name_silence');
  const threshold = Math.max(0.002, peak * 0.07);
  const first = levels.findIndex(level => level >= threshold);
  let last = levels.length - 1;
  while (last > first && levels[last] < threshold) last--;
  if (last - first < 12) throw new Error('name_silence');
  return samples.subarray(Math.max(0, first - 5) * hop, Math.min(samples.length, (last + 7) * hop));
}

function powerSpectrum(frame) {
  const real = new Float64Array(fftSize);
  const imaginary = new Float64Array(fftSize);
  for (let i = 0, reversed = 0; i < fftSize; i++) {
    real[reversed] = frame[i] ?? 0;
    let bit = fftSize >> 1;
    while (reversed & bit) { reversed ^= bit; bit >>= 1; }
    reversed ^= bit;
  }
  for (let width = 2; width <= fftSize; width *= 2) {
    const half = width / 2;
    for (let i = 0; i < half; i++) {
      const angle = -2 * Math.PI * i / width;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      for (let left = i; left < fftSize; left += width) {
        const right = left + half;
        const re = real[right] * cos - imaginary[right] * sin;
        const im = real[right] * sin + imaginary[right] * cos;
        real[right] = real[left] - re;
        imaginary[right] = imaginary[left] - im;
        real[left] += re;
        imaginary[left] += im;
      }
    }
  }
  return Float64Array.from({ length: fftSize / 2 + 1 }, (_, i) => real[i] ** 2 + imaginary[i] ** 2);
}

function cepstra(samples, offset) {
  const original = samples.subarray(offset, offset + windowSize);
  const dc = original.reduce((sum, sample) => sum + sample, 0) / windowSize;
  const frame = Float64Array.from(original, (sample, i) => {
    const prior = i === 0 ? sample : original[i - 1];
    return (sample - dc - 0.97 * (prior - dc)) * window[i];
  });
  const spectrum = powerSpectrum(frame);
  const logMel = Float64Array.from(filterbank, filter => {
    const energy = filter.reduce((sum, weight, bin) => sum + weight * spectrum[bin], 0);
    return Math.log(Math.max(1e-12, energy));
  });
  return Float64Array.from(basis, (row, n) =>
    (1 + 11 * Math.sin(Math.PI * n / 22)) * row.reduce((sum, coefficient, i) => sum + coefficient * logMel[i], 0));
}

export function phoneFeatures(recording) {
  const samples = speechRange(recording);
  const frames = Array.from({ length: 1 + Math.floor((samples.length - windowSize) / hop) }, (_, i) => cepstra(samples, i * hop));
  for (let column = 0; column < bands; column++) {
    const mean = frames.reduce((sum, values) => sum + values[column], 0) / frames.length;
    const variance = frames.reduce((sum, values) => sum + (values[column] - mean) ** 2, 0) / frames.length;
    const deviation = Math.sqrt(Math.max(variance, 1e-8));
    for (const values of frames) values[column] = (values[column] - mean) / deviation;
  }
  const length = Math.ceil(frames.length / 3);
  const input = new Float32Array(length * bands * 3);
  for (let i = 0; i < length; i++) {
    for (let part = 0; part < 3; part++) {
      const frame = (i * 3 + part - 1 + frames.length) % frames.length;
      input.set(frames[frame], (i * 3 + part) * bands);
    }
  }
  return { input, length };
}
