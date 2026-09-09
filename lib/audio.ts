import * as FileSystem from 'expo-file-system/legacy';

// Audio URL-i yukleyir ve expo-file-system cacheDirectory-de saxlayir.
// AsyncStorage-e yazilmir, belelikle Android-de CursorWindow olcusunu asmir ve memory bloat yaratmir.

const memoryCache = new Map<string, string>();
const MAX_MEM_ENTRIES = 50;

function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `cached_audio_${Math.abs(hash)}.mp3`;
}

export async function getAudioDataUrl(url: string): Promise<string> {
  if (!url) return '';

  // 1) Memory cache
  const mem = memoryCache.get(url);
  if (mem) return mem;

  const filename = hashUrl(url);
  const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const localFilePath = `${cacheDir}${filename}`;

  // 2) File cache check
  try {
    const fileInfo = await FileSystem.getInfoAsync(localFilePath);
    if (fileInfo.exists && (fileInfo.size ?? 0) > 100) {
      const base64 = await FileSystem.readAsStringAsync(localFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = 'data:audio/mpeg;base64,' + base64;
      addToMemoryCache(url, dataUrl);
      return dataUrl;
    }
  } catch {}

  // 3) Download to file cache
  try {
    const downloadRes = await FileSystem.downloadAsync(url, localFilePath);
    if (downloadRes.status === 200) {
      const base64 = await FileSystem.readAsStringAsync(localFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = 'data:audio/mpeg;base64,' + base64;
      addToMemoryCache(url, dataUrl);
      return dataUrl;
    }
  } catch {}

  // 4) Fallback fetch
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Audio fetch failed: ' + response.status);
    }
    const bytes = await response.arrayBuffer();
    const base64 = bufferToBase64(bytes);
    const dataUrl = 'data:audio/mpeg;base64,' + base64;
    addToMemoryCache(url, dataUrl);
    return dataUrl;
  } catch {
    return '';
  }
}

function addToMemoryCache(url: string, dataUrl: string) {
  if (memoryCache.size >= MAX_MEM_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(url, dataUrl);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as number[]);
  }
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
