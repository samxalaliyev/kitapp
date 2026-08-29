import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QALANLAR_PATH = path.resolve(__dirname, '../qalan_kitablar.json');
const DELAY_BETWEEN_REQUESTS_MS = 3500; // 3.5 saniyə

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME = 'litera' } = process.env;

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStrictEpub(buffer) {
    if (!buffer || buffer.length < 15000) return false;
    return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

async function main() {
    if (!fs.existsSync(QALANLAR_PATH)) {
        console.error('❌ "qalan_kitablar.json" faylı tapılmadı!');
        return;
    }

    const missingBooks = JSON.parse(fs.readFileSync(QALANLAR_PATH, 'utf-8'));
    console.log(`🚀 Qalan ${missingBooks.length} kitab üçün yükləmə başladı...\n`);

    let count = 0;
    for (const book of missingBooks) {
        count++;
        let downloadUrl = book.epubUrl || book.url;
        if (downloadUrl && downloadUrl.includes('standardebooks.org') && !downloadUrl.includes('?source=download')) {
            downloadUrl += (downloadUrl.includes('?') ? '&' : '?') + 'source=download';
        }

        console.log(`[${count}/${missingBooks.length}] Yüklənir: ${book.title}...`);
        await sleep(DELAY_BETWEEN_REQUESTS_MS);

        try {
            const res = await fetch(downloadUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            if (res.ok) {
                const buffer = Buffer.from(await res.arrayBuffer());
                if (isStrictEpub(buffer)) {
                    const epubKey = `epubs/${book.id}.epub`;
                    await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: epubKey, Body: buffer, ContentType: 'application/epub+zip' }));
                    console.log(`   ✅ R2-yə vuruldu: ${book.title}`);
                } else {
                    console.log(`   ❌ Xəta: Fayl EPUB deyil`);
                }
            } else {
                console.log(`   ❌ Server Xətası: HTTP ${res.status}`);
            }
        } catch (e) {
            console.log(`   ❌ Şəbəkə Xətası: ${e.message}`);
        }
    }

    console.log('\n🎉 Əskik kitabların yüklənməsi tamamlandı!');
}

main().catch(console.error);