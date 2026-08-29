import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// standart json kataloqunuzun yolu
const CATALOG_PATH = path.resolve(__dirname, '../assets/data/standard_ebooks.json');
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME = 'litera' } = process.env;

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function main() {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
    const existingKeys = new Set();

    console.log('🔍 R2-də olan fayllar siyahıya alınır...');
    let continuationToken = undefined;
    do {
        const res = await s3.send(
            new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: 'epubs/', ContinuationToken: continuationToken })
        );
        if (res.Contents) {
            for (const item of res.Contents) existingKeys.add(item.Key);
        }
        continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    // R2-də olmayanları tapırıq
    const missingBooks = catalog.filter((book) => !existingKeys.has(`epubs/${book.id}.epub`));

    console.log(`\n📊 NƏTİJƏ:`);
    console.log(`- Ümumi Kataloq: ${catalog.length} kitab`);
    console.log(`- R2-yə Yüklənənlər: ${existingKeys.size} kitab`);
    console.log(`- Çatışmayan (Qalan): ${missingBooks.length} kitab\n`);

    fs.writeFileSync('qalan_kitablar.json', JSON.stringify(missingBooks, null, 2));
    console.log('✅ Qalan kitabların tam siyahısı "qalan_kitablar.json" faylına yazıldı!');
}

main().catch(console.error);