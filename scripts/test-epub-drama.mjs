import JSZip from 'jszip';

function cleanHtmlText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBlocksFromHtml(content) {
  const normalized = content
    // Convert Drama / Theatrical Table Rows (Speaker + Line) into readable paragraph format
    .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (match, inner) => {
      const tds = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tm;
      while ((tm = tdRegex.exec(inner)) !== null) {
        const text = cleanHtmlText(tm[1]);
        if (text) tds.push(text);
      }
      if (tds.length === 2) {
        return '<p>' + tds[0] + ': ' + tds[1] + '</p>';
      } else if (tds.length > 0) {
        return '<p>' + tds.join(' — ') + '</p>';
      }
      return '';
    })
    // Convert definition lists, list items, blockquotes, poetry verses into paragraphs
    .replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, (m, inner) => '<p>' + inner + '</p>')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, inner) => '<p>' + inner + '</p>')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, inner) => {
      // if already has <p>, leave inner, otherwise wrap
      return inner.includes('<p') ? inner : '<p>' + inner + '</p>';
    });

  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const blocks = [];
  let pMatch;
  while ((pMatch = pRegex.exec(normalized)) !== null) {
    const text = cleanHtmlText(pMatch[1]);
    if (text && text.length > 1) {
      blocks.push(text);
    }
  }

  // Fallback: If no paragraphs found (e.g. raw text or simple div structures), split by double linebreaks or div
  if (blocks.length === 0) {
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const rawBody = bodyMatch ? bodyMatch[1] : content;
    const cleaned = cleanHtmlText(rawBody);
    if (cleaned.length > 20) {
      blocks.push(cleaned);
    }
  }

  return blocks;
}

async function check(url, name) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  
  let totalParagraphs = 0;
  let totalChars = 0;
  
  for (const filename of Object.keys(zip.files)) {
    if (filename.endsWith('.xhtml') && !/cover|titlepage|imprint|colophon|uncopyright|toc/i.test(filename)) {
      const content = await zip.file(filename).async('string');
      const paras = extractBlocksFromHtml(content);
      totalParagraphs += paras.length;
      totalChars += paras.reduce((sum, p) => sum + p.length, 0);
    }
  }
  console.log(`📖 ${name}:`);
  console.log(`   - Paragraphs/Dialogue lines: ${totalParagraphs}`);
  console.log(`   - Total characters: ${totalChars.toLocaleString()}`);
  console.log(`   - Total Pages (~950 chars/page): ${Math.ceil(totalChars / 950)} pages\n`);
}

async function run() {
  console.log('Testing Enhanced Parser on Plays and Novels...\n');
  await check('https://pub-09392b74223c430486bb0bde1d6cddbb.r2.dev/epubs/oscar-wilde_a-woman-of-no-importance.epub', 'Oscar Wilde - A Woman of No Importance (Drama)');
  await check('https://pub-09392b74223c430486bb0bde1d6cddbb.r2.dev/epubs/oscar-wilde_lady-windermeres-fan.epub', 'Oscar Wilde - Lady Windermere\'s Fan (Drama)');
  await check('https://pub-09392b74223c430486bb0bde1d6cddbb.r2.dev/epubs/anna-katharine-green_hand-and-ring.epub', 'Anna Katharine Green - Hand and Ring (Classic Novel)');
}
run();
