import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncBooks() {
  const jsonPath = path.resolve('assets', 'data', 'standard_ebooks.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('standard_ebooks.json not found!');
    process.exit(1);
  }

  const books = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Starting sync of ${books.length} Standard Ebooks to Supabase...`);

  const batchSize = 100;
  let totalUploaded = 0;

  for (let i = 0; i < books.length; i += batchSize) {
    const chunk = books.slice(i, i + batchSize).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover_url: b.coverUrl,
      epub_url: b.epubUrl,
      languages: b.languages ?? ['en'],
      download_count: b.downloadCount ?? 0,
    }));

    const { error } = await supabase.from('books').upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`Error uploading batch ${i}..${i + chunk.length}:`, error.message);
    } else {
      totalUploaded += chunk.length;
      console.log(`Synced ${totalUploaded} / ${books.length} books...`);
    }
  }

  console.log('Sync to Supabase completed successfully!');
}

syncBooks();
