import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'assets', 'soundeffects');

const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const sampleRates = [44100, 48000, 32000, 0];

function parseMp3Frames(buf) {
  let offset = 0;
  if (buf.slice(0, 3).toString('ascii') === 'ID3') {
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f);
    offset = 10 + size;
  }

  const frames = [];
  while (offset + 4 <= buf.length) {
    if (buf[offset] === 0xff && (buf[offset + 1] & 0xe0) === 0xe0) {
      const b1 = buf[offset + 1];
      const b2 = buf[offset + 2];
      const b3 = buf[offset + 3];
      const version = (b1 >> 3) & 0x03;
      const layer = (b1 >> 1) & 0x03;
      const crc = b1 & 0x01;
      const brIdx = (b2 >> 4) & 0x0f;
      const srIdx = (b2 >> 2) & 0x03;
      const padding = (b2 >> 1) & 0x01;
      const mode = (b3 >> 6) & 0x03;

      if (version === 3 && layer === 1 && brIdx > 0 && brIdx < 15 && srIdx < 3) {
        const br = bitrates[brIdx] * 1000;
        const sr = sampleRates[srIdx];
        const frameLen = Math.floor((144 * br) / sr) + padding;
        if (offset + frameLen > buf.length) break;

        const frameBuf = Buffer.from(buf.slice(offset, offset + frameLen));
        const sideOffset = 4 + (crc === 0 ? 2 : 0);
        const mainDataBegin = (frameBuf[sideOffset] << 1) | (frameBuf[sideOffset + 1] >> 7);

        const isXing =
          frames.length === 0 &&
          (frameBuf.includes(Buffer.from('Xing')) ||
            frameBuf.includes(Buffer.from('Info')));

        frames.push({
          raw: frameBuf,
          sr,
          br,
          mode,
          crc,
          mainDataBegin,
          isXing,
        });

        offset += frameLen;
        continue;
      }
    }
    offset++;
  }
  return frames;
}

/**
 * Zero out main_data_begin (first 9 bits of side information) on the first kept frame
 * if needed, OR we keep the anchor silent frame that already has main_data_begin === 0
 * and carries the bit reservoir for the following frame.
 */
function clearMainDataBeginIfFirst(frameBuf, crc) {
  const copy = Buffer.from(frameBuf);
  const sideOffset = 4 + (crc === 0 ? 2 : 0);
  const mdb = (copy[sideOffset] << 1) | (copy[sideOffset + 1] >> 7);
  if (mdb !== 0) {
    copy[sideOffset] = 0;
    copy[sideOffset + 1] = copy[sideOffset + 1] & 0x7f;
  }
  return copy;
}

// Frame ranges [startFrameInclusive, endFrameInclusive] among non-Xing audio frames:
// Carefully chosen from bit-level gain & main_data_begin inspection so:
// 1) Leading dead silence frames are removed (while preserving the 1 anchor frame with mdb=0 that holds the bit reservoir for the attack frame)
// 2) Trailing dead silence / noise floor frames are removed without cutting the natural decay of the sound
const TRIM_CONFIG = {
  '47313572-ui-pop-sound-316482.mp3': { start: 0, end: 6 },           // 1.36s -> 0.18s (instant crisp button pop)
  '47313572-pop-1-269287.mp3': { start: 3, end: 15 },                 // 1.20s -> 0.34s (removes 80ms leading silence + 780ms tail)
  '47313572-pop-on-269286.mp3': { start: 0, end: 12 },                // 1.75s -> 0.34s (removes 1.41s trailing silence)
  '47313572-pop-off-269284.mp3': { start: 0, end: 12 },               // 1.75s -> 0.34s (removes 1.41s trailing silence)
  '47313572-ui-sounds-pack-2-sound-1-358893.mp3': { start: 5, end: 28 }, // 2.06s -> 0.62s (removes 130ms leading silence + 1.3s tail)
  'universfield-notification-beep-229154.mp3': { start: 6, end: 40 }, // 2.09s -> 0.84s (removes 144ms leading silence + 1.1s tail)
  'universfield-game-bonus-03-487857.mp3': { start: 0, end: 36 },     // 1.20s -> 0.96s (clean bonus chime)
  'soundshelfstudio-deep-ui-chime-585839.mp3': { start: 0, end: 42 }, // 2.14s -> 1.03s (removes 1.1s trailing silence)
  '47313572-intro-sound-2-269294.mp3': { start: 0, end: 45 },         // 2.61s -> 1.20s (removes 1.4s trailing silence)
  '47313572-intro-sound-bell-269297.mp3': { start: 0, end: 64 },      // 3.81s -> 1.69s (removes 2.1s trailing silence)
};

for (const [filename, range] of Object.entries(TRIM_CONFIG)) {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file: ${filename}`);
    continue;
  }

  const rawBuf = fs.readFileSync(filePath);
  const allFrames = parseMp3Frames(rawBuf);
  const audioFrames = allFrames.filter((f) => !f.isXing);

  // If already trimmed in a previous run, skip re-trimming
  if (audioFrames.length <= range.end - range.start + 2) {
    console.log(`[SKIP - already trimmed] ${filename}: ${audioFrames.length} frames`);
    continue;
  }

  const sliced = audioFrames.slice(range.start, range.end + 1);
  if (sliced.length === 0) {
    console.warn(`Empty slice for ${filename}`);
    continue;
  }

  // Ensure the very first frame has main_data_begin = 0 so any decoder starts cleanly with 0 warnings
  sliced[0].raw = clearMainDataBeginIfFirst(sliced[0].raw, sliced[0].crc);

  const outBuf = Buffer.concat(sliced.map((f) => f.raw));
  fs.writeFileSync(filePath, outBuf);

  const oldDur = ((audioFrames.length * 1152) / audioFrames[0].sr).toFixed(2);
  const newDur = ((sliced.length * 1152) / sliced[0].sr).toFixed(2);
  console.log(
    `[TRIMMED] ${filename}: ${audioFrames.length}f (${oldDur}s, ${rawBuf.length}B) -> ${sliced.length}f (${newDur}s, ${outBuf.length}B), firstFrameMDB=${sliced[0].mainDataBegin}`
  );
}
