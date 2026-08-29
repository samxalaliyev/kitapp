import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_PATH = path.resolve(__dirname, '../assets/data/standard_ebooks.json');
const FAILED_LOG_PATH = path.resolve(__dirname, 'failed_books.json');

// Bloklanmamaq üçün insaflı parametrlər
const DELAY_BETWEEN_REQUESTS_MS = 3500; // 3.5 saniyə pauza
const RATE_LIMIT_COOLDOWN_MS = 60000;   // 429 olarsa 1 dəqiqə gözləmə

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME = 'litera',
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('❌ R2 məlumatları .env faylında tapılmadı!');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const stats = { total: 0, skipped: 0, uploaded: 0, failed: 0, failedList: [] };
const existingKeys = new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStrictEpub(buffer) {
  if (!buffer || buffer.length < 15000) return false;
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  if (!isZip) return false;
  const header = buffer.slice(0, 150).toString('utf-8');
  return header.includes('mimetype') && header.includes('application/epub+zip');
}

async function fetchExistingR2Keys() {
  console.log('🔍 R2 mövcud fayllar RAM-a yüklenir (1 qlobal sorğu)...');
  let continuationToken = undefined;
  try {
    do {
      const res = await s3.send(
        new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: 'epubs/', ContinuationToken: continuationToken })
      );
      if (res.Contents) {
        for (const item of res.Contents) existingKeys.add(item.Key);
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);
    console.log(`✅ ${existingKeys.size} fayl yaddaşda saxlanıldı.\n`);
  } catch (err) {
    console.warn('⚠️ R2 siyahısı çəkilə bilmədi:', err.message);
  }
}

async function fetchEpubBuffer(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/epub+zip,*/*',
      },
    });
    clearTimeout(timeoutId);

    if (res.status === 429) return { status: 429 };

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (isStrictEpub(buffer)) return { status: 200, buffer };
      return { status: 400, error: 'Keçərsiz EPUB strukturu' };
    }
    return { status: res.status };
  } catch (e) {
    return { status: 500, error: e.name === 'AbortError' ? 'Timeout (20s)' : e.message };
  }
}

async function main() {
  console.log(`🚀 Təhlükəsiz Yükləmə Başladı (İnterval: ${DELAY_BETWEEN_REQUESTS_MS / 1000}s)...\n`);

  let catalog = [];
  if (fs.existsSync(FAILED_LOG_PATH)) {
    const failedData = JSON.parse(fs.readFileSync(FAILED_LOG_PATH, 'utf-8'));
    if (failedData.length > 0) {
      console.log(`🎯 Əvvəlki xətalı ${failedData.length} kitab hədəflənir...`);
      catalog = failedData;
    }
  }

  if (catalog.length === 0) {
    catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  }

  stats.total = catalog.length;
  await fetchExistingR2Keys();

  let processedCount = 0;

  for (const book of catalog) {
    processedCount++;
    const epubKey = `epubs/${book.id}.epub`;

    if (existingKeys.has(epubKey)) {
      console.log(`[${processedCount}/${stats.total}] ⏩ Keçildi: ${book.title}`);
      stats.skipped++;
      continue;
    }

    let downloadUrl = book.epubUrl || book.url;
    if (downloadUrl && downloadUrl.includes('standardebooks.org') && !downloadUrl.includes('?source=download')) {
      downloadUrl += (downloadUrl.includes('?') ? '&' : '?') + 'source=download';
    }

    await sleep(DELAY_BETWEEN_REQUESTS_MS);
    const result = await fetchEpubBuffer(downloadUrl);

    if (result.status === 429) {
      console.log(`\n🛑 RATE LIMIT! Server 60s dondurulur, "${book.title}" xətalılara atılır...`);
      stats.failed++;
      stats.failedList.push({ ...book, reason: '429 Rate Limit' });
      await sleep(RATE_LIMIT_COOLDOWN_MS);
      continue;
    }

    if (result.status === 200 && result.buffer) {
      await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: epubKey, Body: result.buffer, ContentType: 'application/epub+zip' }));
      existingKeys.add(epubKey);
      console.log(`[${processedCount}/${stats.total}] ✅ Yükləndi: ${book.title} (${(result.buffer.length / 1024).toFixed(0)} KB)`);
      stats.uploaded++;
    } else {
      console.log(`[${processedCount}/${stats.total}] ❌ Xəta: ${book.title} (${result.error || result.status})`);
      stats.failed++;
      stats.failedList.push({ ...book, reason: result.error || `HTTP ${result.status}` });
    }
  }

  if (stats.failedList.length > 0) {
    fs.writeFileSync(FAILED_LOG_PATH, JSON.stringify(stats.failedList, null, 2));
  } else if (fs.existsSync(FAILED_LOG_PATH)) {
    fs.unlinkSync(FAILED_LOG_PATH);
  }

  console.log(`\n🎉 Bitiş! Yükləndi: ${stats.uploaded}, Mövcuddur: ${stats.skipped}, Xəta: ${stats.failed}`);
}

main().catch(console.error);