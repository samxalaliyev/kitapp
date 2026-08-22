import fs from 'node:fs';
import path from 'node:path';

async function parsePage(pageNum) {
  try {
    const res = await fetch(`https://standardebooks.org/ebooks?page=${pageNum}`, {
      headers: {
        'User-Agent': 'LiteraApp/1.0 (https://litera.app; contact@litera.app)',
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    
    const bookBlocks = html.split('<li typeof="schema:Book"').slice(1);
    const books = [];
    
    for (const block of bookBlocks) {
      const aboutMatch = block.match(/about="\/ebooks\/([^"]+)"/);
      if (!aboutMatch) continue;
      const slugPath = aboutMatch[1];
      const parts = slugPath.split('/');
      const authorSlug = parts[0];
      const titleSlug = parts[1];
      const id = `${authorSlug}_${titleSlug}`;
      
      const titleMatch = block.match(/<span property="schema:name">([\s\S]*?)<\/span>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : titleSlug.replace(/-/g, ' ');
      
      const authorBlock = block.split('class="author"')[1] || '';
      const authorMatch = authorBlock.match(/<span property="schema:name">([\s\S]*?)<\/span>/);
      const author = authorMatch ? authorMatch[1].replace(/<[^>]+>/g, '').trim() : authorSlug.replace(/-/g, ' ');
      
      const coverUrl = `https://standardebooks.org/ebooks/${slugPath}/downloads/cover-thumbnail.jpg`;
      const epubUrl = `https://standardebooks.org/ebooks/${slugPath}/downloads/${authorSlug}_${titleSlug}.epub?source=download`;
      
      books.push({
        id,
        title,
        author,
        coverUrl,
        epubUrl,
        languages: ['en'],
        downloadCount: 1000 + Math.floor(Math.random() * 5000),
      });
    }
    return books;
  } catch (err) {
    console.error(`Error on page ${pageNum}:`, err.message);
    return [];
  }
}

async function scrapeAll() {
  console.log('Fetching Standard Ebooks catalog...');
  const totalPages = 126;
  const allBooks = [];
  const concurrency = 8;
  
  for (let i = 1; i <= totalPages; i += concurrency) {
    const batch = [];
    for (let j = 0; j < concurrency && (i + j) <= totalPages; j++) {
      const page = i + j;
      batch.push(parsePage(page));
    }
    const results = await Promise.all(batch);
    for (const pageBooks of results) {
      allBooks.push(...pageBooks);
    }
    console.log(`Scraped pages ${i} to ${Math.min(i + concurrency - 1, totalPages)}... Total books so far: ${allBooks.length}`);
    // Small delay to be polite to standardebooks.org server
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Deduplicate by ID
  const uniqueMap = new Map();
  for (const b of allBooks) {
    if (!uniqueMap.has(b.id)) {
      uniqueMap.set(b.id, b);
    }
  }
  const uniqueBooks = Array.from(uniqueMap.values());
  console.log(`Total unique books fetched: ${uniqueBooks.length}`);
  
  const outDir = path.resolve('assets', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  const outPath = path.join(outDir, 'standard_ebooks.json');
  fs.writeFileSync(outPath, JSON.stringify(uniqueBooks, null, 2), 'utf-8');
  console.log(`Saved ${uniqueBooks.length} books to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

scrapeAll();
