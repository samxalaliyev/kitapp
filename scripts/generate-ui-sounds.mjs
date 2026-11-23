// Script to synthesize crisp, polished, high-fidelity UI sound effects in WAV format
// (Zero external dependencies, 44.1kHz 16-bit PCM WAV)
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('assets/sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createWavBuffer(sampleRate, samples) {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16)

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    // clamp sample between -1 and 1
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intVal = s < 0 ? s * 32768 : s * 32767;
    buffer.writeInt16LE(Math.floor(intVal), 44 + i * 2);
  }

  return buffer;
}

const SAMPLE_RATE = 44100;

// 1. TAP CLICK (Duolingo-style bouncy, snappy bubble pop for buttons, word tiles)
function generateTapSound() {
  const duration = 0.065; // 65ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    // Pitch envelope: drops quickly from 850Hz to 280Hz
    const freq = 850 * Math.exp(-progress * 5) + 220;
    const env = Math.sin(Math.PI * Math.pow(1 - progress, 0.7)); // snappy envelope
    const wave = Math.sin(2 * Math.PI * freq * t);
    samples[i] = wave * env * 0.75;
  }
  return createWavBuffer(SAMPLE_RATE, samples);
}

// 2. TILE POP (Selecting/attaching words into the answer box)
function generateTilePopSound() {
  const duration = 0.08; // 80ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    // Ascending upward pop: 400Hz -> 750Hz
    const freq = 380 + (760 - 380) * Math.pow(progress, 0.5);
    const env = Math.exp(-progress * 6);
    const wave = Math.sin(2 * Math.PI * freq * t);
    samples[i] = wave * env * 0.7;
  }
  return createWavBuffer(SAMPLE_RATE, samples);
}

// 3. CORRECT DING (Harmonic major chord chime: C6 + E6 + G6 bright sparkle)
function generateCorrectSound() {
  const duration = 0.55; // 550ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  const notes = [1046.5, 1318.51, 1567.98]; // C6, E6, G6 (bright chime)
  const offsets = [0, 0.035, 0.07]; // slight arpeggio feel like Duolingo

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sampleVal = 0;

    for (let n = 0; n < notes.length; n++) {
      const noteT = t - offsets[n];
      if (noteT > 0) {
        const noteProgress = noteT / (duration - offsets[n]);
        const env = Math.exp(-noteProgress * 4.5);
        // fundamental + gentle 2nd harmonic
        const s1 = Math.sin(2 * Math.PI * notes[n] * noteT);
        const s2 = 0.3 * Math.sin(2 * Math.PI * notes[n] * 2 * noteT);
        sampleVal += (s1 + s2) * env * 0.35;
      }
    }
    samples[i] = Math.max(-1, Math.min(1, sampleVal));
  }
  return createWavBuffer(SAMPLE_RATE, samples);
}

// 4. WRONG BOOP (Gentle low double-thud: 220Hz -> 140Hz downward disappointment)
function generateWrongSound() {
  const duration = 0.38; // 380ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;

    // Two distinct descending pulses
    const pulse1 = t < 0.16 ? Math.exp(-t * 18) * Math.sin(2 * Math.PI * (210 - t * 400) * t) : 0;
    const t2 = t - 0.17;
    const pulse2 = t2 > 0 ? Math.exp(-t2 * 14) * Math.sin(2 * Math.PI * (160 - t2 * 300) * t2) : 0;

    samples[i] = (pulse1 * 0.7 + pulse2 * 0.75);
  }
  return createWavBuffer(SAMPLE_RATE, samples);
}

// 5. LESSON COMPLETED FANFARE (Grand 4-note ascending triumph chord)
function generateCompleteSound() {
  const duration = 0.95; // 950ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // G5, C6, E6, G6
  const freqs = [783.99, 1046.5, 1318.51, 1567.98];
  const times = [0, 0.11, 0.22, 0.35];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sum = 0;

    for (let f = 0; f < freqs.length; f++) {
      const dt = t - times[f];
      if (dt > 0) {
        const decay = f === freqs.length - 1 ? 2.5 : 5.0; // last note rings out longer
        const env = Math.exp(-dt * decay);
        const wave = Math.sin(2 * Math.PI * freqs[f] * dt) + 0.25 * Math.sin(2 * Math.PI * freqs[f] * 2 * dt);
        sum += wave * env * 0.32;
      }
    }
    samples[i] = Math.max(-1, Math.min(1, sum));
  }
  return createWavBuffer(SAMPLE_RATE, samples);
}

// 6. CHEST REWARD (Magical shimmer / sparkle)
function generateChestSound() {
  const duration = 0.75;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const env = Math.exp(-progress * 3.5);

    // Rapid glissando upward chime
    const freq1 = 600 + Math.pow(progress, 0.6) * 1200;
    const freq2 = 1200 + Math.pow(progress, 0.6) * 1600;

    const wave = 0.5 * Math.sin(2 * Math.PI * freq1 * t) + 0.5 * Math.sin(2 * Math.PI * freq2 * t);
    samples[i] = wave * env * 0.6;
  }
  return createWavBuffer(SAMPLE_RATE, samples);
}

fs.writeFileSync(path.join(outDir, 'tap.wav'), generateTapSound());
fs.writeFileSync(path.join(outDir, 'tile_pop.wav'), generateTilePopSound());
fs.writeFileSync(path.join(outDir, 'correct.wav'), generateCorrectSound());
fs.writeFileSync(path.join(outDir, 'wrong.wav'), generateWrongSound());
fs.writeFileSync(path.join(outDir, 'complete.wav'), generateCompleteSound());
fs.writeFileSync(path.join(outDir, 'chest.wav'), generateChestSound());

console.log('UI Sound assets generated successfully in assets/sounds/*.wav');

