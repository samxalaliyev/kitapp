import { readAsStringAsync } from 'expo-file-system/legacy';
import JSZip from 'jszip';

export interface ReaderWord {
  id: string;
  raw: string;
  clean: string;
}

export interface ReaderParagraph {
  id: string;
  text: string;
  words: ReaderWord[];
}

export interface ReaderPage {
  id: string;
  chapterTitle: string;
  pageIndex: number;
  totalPages: number;
  paragraphs: ReaderParagraph[];
}

export interface ParsedBookData {
  title: string;
  author: string;
  totalPages: number;
  pages: ReaderPage[];
}

function cleanHtmlText(html: string): string {
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

export function tokenizeParagraphWords(paragraphText: string, pId: string): ReaderWord[] {
  const parts = paragraphText.split(/\s+/);
  return parts.filter(Boolean).map((word, wIdx) => {
    const clean = word.replace(/^[^a-zA-Z0-9\u00C0-\u024F]+|[^a-zA-Z0-9\u00C0-\u024F]+$/g, '').toLowerCase();
    return {
      id: `${pId}-w${wIdx}`,
      raw: word,
      clean,
    };
  });
}

// In-memory cache for parsed books
const parsedBookCache = new Map<string, ParsedBookData>();

export async function parseEpubFile(filePath: string): Promise<ParsedBookData> {
  if (parsedBookCache.has(filePath)) {
    return parsedBookCache.get(filePath)!;
  }

  // Read local file as Base64
  const base64Data = await readAsStringAsync(filePath, {
    encoding: 'base64',
  });

  const zip = await JSZip.loadAsync(base64Data, { base64: true });

  // 1. Locate OPF file
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  const opfPathMatch = containerXml?.match(/full-path=["']([^"']+)["']/i);
  const opfPath = opfPathMatch ? opfPathMatch[1] : 'epub/content.opf';
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfContent = await zip.file(opfPath)?.async('string');

  if (!opfContent) {
    throw new Error('EPUB arxivi zədələnib və ya açıla bilmir');
  }

  // 2. Extract Metadata (Title, Creator)
  const titleMatch = opfContent.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
  const authorMatch = opfContent.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
  const bookTitle = titleMatch ? cleanHtmlText(titleMatch[1]) : 'Kitab';
  const bookAuthor = authorMatch ? cleanHtmlText(authorMatch[1]) : '';

  // 3. Extract Manifest & Spine
  const manifestMap = new Map<string, string>();
  const manifestRegex = /<item\s+[^>]*?id=["']([^"']+)["'][^>]*?href=["']([^"']+)["'][^>]*?>/gi;
  let m: RegExpExecArray | null;
  while ((m = manifestRegex.exec(opfContent)) !== null) {
    manifestMap.set(m[1], m[2]);
  }
  const manifestRegex2 = /<item\s+[^>]*?href=["']([^"']+)["'][^>]*?id=["']([^"']+)["'][^>]*?>/gi;
  while ((m = manifestRegex2.exec(opfContent)) !== null) {
    manifestMap.set(m[2], m[1]);
  }

  const spineRegex = /<itemref\s+[^>]*?idref=["']([^"']+)["'][^>]*?>/gi;
  const spineIds: string[] = [];
  while ((m = spineRegex.exec(opfContent)) !== null) {
    spineIds.push(m[1]);
  }

  // 4. Extract Natural Paragraphs
  const rawChapters: Array<{ title: string; paragraphs: string[] }> = [];

  for (const id of spineIds) {
    const href = manifestMap.get(id);
    if (!href) continue;

    // Skip non-reading utility sections
    if (/cover\.xhtml|titlepage\.xhtml|imprint\.xhtml|colophon\.xhtml|uncopyright\.xhtml|toc\.xhtml/i.test(href)) {
      continue;
    }

    const file = zip.file(opfDir + href);
    if (!file) continue;
    const content = await file.async('string');

    // Extract Title
    let title = '';
    const hMatch = content.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
    if (hMatch) {
      title = cleanHtmlText(hMatch[1]);
    } else {
      const tMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (tMatch) title = cleanHtmlText(tMatch[1]);
    }

    // Extract Paragraphs
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const chapterParagraphs: string[] = [];
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pRegex.exec(content)) !== null) {
      const pText = cleanHtmlText(pMatch[1]);
      if (pText && pText.length > 1) {
        chapterParagraphs.push(pText);
      }
    }

    if (chapterParagraphs.length > 0) {
      rawChapters.push({
        title: title || `Fəsil ${rawChapters.length + 1}`,
        paragraphs: chapterParagraphs,
      });
    }
  }

  // 5. Rich Page Packing (~850-1100 characters per page)
  // Ensures pages are beautifully filled without leaving single orphan sentences.
  const tempPages: Array<{ chapterTitle: string; paragraphs: ReaderParagraph[] }> = [];
  const TARGET_PAGE_CHARS = 950;

  let globalPIdx = 0;
  for (let cIdx = 0; cIdx < rawChapters.length; cIdx++) {
    const chapter = rawChapters[cIdx];
    let curParas: ReaderParagraph[] = [];
    let curLen = 0;

    for (let pIdx = 0; pIdx < chapter.paragraphs.length; pIdx++) {
      const pText = chapter.paragraphs[pIdx];

      // If a single paragraph is gigantic (> 1100 chars), break it naturally at sentence boundaries
      if (pText.length > 1100) {
        const sentences = pText.match(/[^.!?]+(?:[.!?]+["'”’]?|$)/g) || [pText];
        let subText = '';

        for (const s of sentences) {
          if (curLen + subText.length + s.length > TARGET_PAGE_CHARS && (curParas.length > 0 || subText.length > 0)) {
            if (subText.trim()) {
              const subId = `c${cIdx}-p${globalPIdx++}`;
              curParas.push({
                id: subId,
                text: subText.trim(),
                words: tokenizeParagraphWords(subText.trim(), subId),
              });
            }
            tempPages.push({
              chapterTitle: chapter.title,
              paragraphs: curParas,
            });
            curParas = [];
            curLen = 0;
            subText = s;
          } else {
            subText += (subText ? ' ' : '') + s;
          }
        }

        if (subText.trim()) {
          const subId = `c${cIdx}-p${globalPIdx++}`;
          curParas.push({
            id: subId,
            text: subText.trim(),
            words: tokenizeParagraphWords(subText.trim(), subId),
          });
          curLen += subText.length;
        }
      } else {
        // Normal paragraph
        const pId = `c${cIdx}-p${globalPIdx++}`;
        const pObj: ReaderParagraph = {
          id: pId,
          text: pText,
          words: tokenizeParagraphWords(pText, pId),
        };

        if (curParas.length > 0 && curLen + pText.length > TARGET_PAGE_CHARS) {
          tempPages.push({
            chapterTitle: chapter.title,
            paragraphs: curParas,
          });
          curParas = [pObj];
          curLen = pText.length;
        } else {
          curParas.push(pObj);
          curLen += pText.length;
        }
      }
    }

    if (curParas.length > 0) {
      tempPages.push({
        chapterTitle: chapter.title,
        paragraphs: curParas,
      });
    }
  }

  const totalPages = Math.max(1, tempPages.length);
  const finalPages: ReaderPage[] = tempPages.map((p, idx) => ({
    id: `page-${idx}`,
    chapterTitle: p.chapterTitle,
    pageIndex: idx,
    totalPages,
    paragraphs: p.paragraphs,
  }));

  const result: ParsedBookData = {
    title: bookTitle,
    author: bookAuthor,
    totalPages,
    pages: finalPages,
  };

  parsedBookCache.set(filePath, result);
  return result;
}
