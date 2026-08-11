import AsyncStorage from '@react-native-async-storage/async-storage';

// Audio URL-i webview-load edile bilen base64 data-URL formatina cevirir.
// CORS, mixed content, hotlink bloklama kimi problemleri onler.
// MP3 yalniz 1 defe yuklenir, hansi soze aid olsa da.

interface CachedAudio {
  dataUrl: string;
  fetchedAt: number;
}

const AUDIO_CACHE_PREFIX = '@kitab-oxu:audio-data:';
const AUDIO_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gun

const memoryCache = new Map<string, string>();

function audioKey(url: string): string {
  return AUDIO_CACHE_PREFIX + encodeURIComponent(url);
}

export async function getAudioDataUrl(url: string): Promise<string> {
  if (!url) return '';

  // 1) Memory cache
  const mem = memoryCache.get(url);
  if (mem) return mem;

  // 2) AsyncStorage cache
  try {
    const raw = await AsyncStorage.getItem(audioKey(url));
    if (raw) {
      const cached = JSON.parse(raw) as CachedAudio;
      if (Date.now() - cached.fetchedAt < AUDIO_TTL_MS) {
        memoryCache.set(url, cached.dataUrl);
        return cached.dataUrl;
      }
    }
  } catch {
    // ignore
  }

  // 3) Fetch ve base64-encode
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Audio fetch failed: ' + response.status);
  }
  const bytes = await response.arrayBuffer();
  const base64 = bufferToBase64(bytes);
  const dataUrl = 'data:audio/mpeg;base64,' + base64;

  memoryCache.set(url, dataUrl);

  try {
    const entry: CachedAudio = { dataUrl, fetchedAt: Date.now() };
    await AsyncStorage.setItem(audioKey(url), JSON.stringify(entry));
  } catch {
    // ignore
  }

  return dataUrl;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // 0x8000 ~ 32KB chunk emal edirik (call stack partlayisinin qarsisini alir)
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as number[]);
  }
  // global.btoa React Native-de movcud deyil, ona goredir manual kodlama.
  return base64Encode(binary);
}

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Encode(input: string): string {
  let output = '';
  let i = 0;
  while (i < input.length) {
    const c1 = input.charCodeAt(i++) & 0xff;
    const c2 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;
    const c3 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >> 4);
    const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (c3 >> 6);
    const e4 = isNaN(c3) ? 64 : c3 & 63;
    output +=
      BASE64_CHARS.charAt(e1) +
      BASE64_CHARS.charAt(e2) +
      BASE64_CHARS.charAt(e3) +
      BASE64_CHARS.charAt(e4);
  }
  return output;
}
