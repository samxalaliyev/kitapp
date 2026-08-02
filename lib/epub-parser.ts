import JSZip from 'jszip';

import { buildChapterJson, shouldSkipChapter } from '@/lib/chapter-content';
import type { ChapterJson } from '@/types/book';

export interface ParsedChapter {
  index: number;
  title: string;
  json: ChapterJson;
}

export interface ParsedEpub {
  title?: string;
  chapters: ParsedChapter[];
}

// ---------------------------------------------------------------------------
// Roma reqemini tam edede cevir (I -> 1, IV -> 4, XLVII -> 47)
// ---------------------------------------------------------------------------
const ROMAN_VALUES: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

export function romanToInt(roman: string): number | null {
  const cleaned = roman.trim().toUpperCase();
  if (!cleaned) return null;
  if (!/^[IVXLCDM]+$/.test(cleaned)) return null;
  let total = 0;
  let prev = 0;
  for (let i = cleaned.length - 1; i >= 0; i -= 1) {
    const value = ROMAN_VALUES[cleaned[i]] ?? 0;
    if (value < prev) {
      total -= value;
    } else {
      total += value;
      prev = value;
    }
  }
  return total > 0 ? total : null;
}

// ---------------------------------------------------------------------------
// Basliq normalizasiyasi: "Chapter IV", "CHAPTER 4", "Part Three" -> eyni formata
// ---------------------------------------------------------------------------
export interface NormalizedTitle {
  original: string;
  cleaned: string;
  number?: number;
  prefix?: string;
  sortKey: string;
}

const PREFIX_TERMS = [
  'chapter', 'chapters', 'ch', 'c',
  'part', 'parts',
  'book', 'books',
  'section', 'sections',
  'episode', 'episodes',
  'act', 'acts',
  'scene', 'scenes',
  'canto', 'cantos',
  'vol', 'volume', 'volumes',
  'bölüm', 'bölümler', 'bolum', 'bolumler',
  'kitab', 'kitablar',
  'bab',
];

const ORDINAL_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  bir: 1, iki: 2, üç: 3, uc: 3, dört: 4, dort: 4, beş: 5, bes: 5,
  altı: 6, alti: 6, yeddi: 7, səkkiz: 8, sekkiz: 8, doqquz: 9, on: 10,
  yirmi: 20, otuz: 30, qırx: 40, qirx: 40, əlli: 50, elli: 50, altmış: 60, altmis: 60,
  yetmiş: 70, yetmis: 70, səksən: 80, seksen: 80, doxsan: 90,
};

export function normalizeTitle(rawTitle: string): NormalizedTitle {
  const original = rawTitle.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const tokens = original.split(/\s+/);
  const firstToken = (tokens[0] ?? '').toLowerCase().replace(/[.,:;]/g, '');

  let prefix: string | undefined;
  let rest = original;
  if (PREFIX_TERMS.includes(firstToken) && tokens.length > 1) {
    prefix = tokens[0];
    rest = tokens.slice(1).join(' ');
  }

  let number: number | undefined;
  const restTrim = rest.trim();

  const romanMatch = restTrim.match(/^([IVXLCDM]+)\b/i);
  if (romanMatch) {
    const parsed = romanToInt(romanMatch[1]);
    if (parsed != null) number = parsed;
  }

  if (number == null) {
    const arabicMatch = restTrim.match(/^(\d+)\b/);
    if (arabicMatch) number = Number.parseInt(arabicMatch[1], 10);
  }

  if (number == null) {
    const wordMatch = restTrim.match(/^([A-Za-zÇçĞğİıÖöŞşÜü]+)\b/);
    if (wordMatch) {
      const lower = wordMatch[1].toLowerCase();
      if (lower in ORDINAL_WORDS) number = ORDINAL_WORDS[lower];
    }
  }

  const cleaned = original || 'Bolme';
  const numStr = number != null ? String(number).padStart(5, '0') : '99999';
  const sortKey = numStr + '_' + (prefix ?? '').toLowerCase() + '_' + cleaned.toLowerCase();

  return { original, cleaned, number, prefix, sortKey };
}

// ---------------------------------------------------------------------------
// Path / utility
// ---------------------------------------------------------------------------
function resolvePath(baseDir: string, href: string): string {
  if (href.startsWith('/')) return href.slice(1);
  if (!baseDir) return href;
  return `${baseDir}${href}`;
}

function extractTitleFromHtml(html: string): string | null {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const cleaned = h1Match[1].replace(/<[^>]+>/g, '').trim();
    if (cleaned.length >= 2) return cleaned;
  }
  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) {
    const cleaned = h2Match[1].replace(/<[^>]+>/g, '').trim();
    if (cleaned.length >= 2) return cleaned;
  }
  const h3Match = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  if (h3Match) {
    const cleaned = h3Match[1].replace(/<[^>]+>/g, '').trim();
    if (cleaned.length >= 2) return cleaned;
  }
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].replace(/<[^>]+>/g, '').trim();
  }
  return null;
}

function parseManifest(opfContent: string): Record<string, { href: string; mediaType: string }> {
  const manifest: Record<string, { href: string; mediaType: string }> = {};
  const itemRegex = /<item\b([^>]*)\/?>/gi;
  let match;
  while ((match = itemRegex.exec(opfContent)) !== null) {
    const attrs = match[1];
    const id = attrs.match(/\bid="([^"]+)"/i)?.[1];
    const href = attrs.match(/\bhref="([^"]+)"/i)?.[1];
    const mediaType = attrs.match(/\bmedia-type="([^"]+)"/i)?.[1];
    if (id && href && mediaType) {
      manifest[id] = { href, mediaType };
    }
  }
  return manifest;
}

function parseSpine(opfContent: string): string[] {
  const spineIds: string[] = [];
  const spineRegex = /<itemref\b([^>]*)\/?>/gi;
  let match;
  while ((match = spineRegex.exec(opfContent)) !== null) {
    const idref = match[1].match(/\bidref="([^"]+)"/i)?.[1];
    if (idref) spineIds.push(idref);
  }
  return spineIds;
}

async function readZipText(zip: JSZip, path: string): Promise<string | null> {
  const normalized = path.replace(/^\//, '');
  const file =
    zip.file(normalized) ??
    zip.file(path) ??
    zip.file(decodeURIComponent(normalized));
  if (!file) return null;
  return file.async('string');
}

// ---------------------------------------------------------------------------
// TOC reader (nav.xhtml / toc.ncx)
// ---------------------------------------------------------------------------
interface TocEntry {
  title: string;
  href: string;
  order: number;
}

async function readNavXhtml(zip: JSZip, opfDir: string): Promise<TocEntry[] | null> {
  const candidates = ['nav.xhtml', 'nav.html', 'toc.xhtml', 'toc.html'];
  let navContent: string | null = null;
  for (const candidate of candidates) {
    const found = await readZipText(zip, candidate);
    if (found) {
      navContent = found;
      break;
    }
  }
  if (!navContent) return null;

  const entries: TocEntry[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)(?=<li|<\/ol>)/gi;
  let m: RegExpExecArray | null;
  let order = 0;
  while ((m = liRegex.exec(navContent)) !== null) {
    const block = m[1];
    const aMatch = block.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (aMatch) {
      const href = aMatch[1].split('#')[0];
      const title = aMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (title && href) {
        entries.push({
          title,
          href: resolvePath(opfDir, href),
          order: (order += 1),
        });
      }
    }
  }
  return entries.length > 0 ? entries : null;
}

async function readTocNcx(zip: JSZip, opfDir: string): Promise<TocEntry[] | null> {
  const candidates = ['toc.ncx', 'OEBPS/toc.ncx'];
  let ncxContent: string | null = null;
  for (const c of candidates) {
    const found = await readZipText(zip, c);
    if (found) {
      ncxContent = found;
      break;
    }
  }
  if (!ncxContent) return null;

  const entries: TocEntry[] = [];
  const navPointRegex = /<navPoint\b[^>]*>([\s\S]*?)<\/navPoint>/gi;
  let m: RegExpExecArray | null;
  while ((m = navPointRegex.exec(ncxContent)) !== null) {
    const block = m[1];
    const playOrder = block.match(/\bplayOrder="(\d+)"/i)?.[1];
    const title = block.match(/<text[^>]*>([\s\S]*?)<\/text>/i)?.[1];
    const src = block.match(/<content\b[^>]*\bsrc="([^"]+)"/i)?.[1];
    if (title && src) {
      entries.push({
        title: title.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        href: resolvePath(opfDir, src.split('#')[0]),
        order: playOrder ? Number.parseInt(playOrder, 10) : entries.length + 1,
      });
    }
  }
  return entries.length > 0 ? entries : null;
}

// ---------------------------------------------------------------------------
// Single-file EPUB splitter
// <h1>, <h2>, <h3> başlıqları tap, hər birini chapter kimi qaytar.
// minimum 1 chapter da olsa split et — əvvəlki kod 2 chapter şərti qoyurdu
// və single-file kitabların çoxunu 1 chapter kimi saxlayırdı.
// ---------------------------------------------------------------------------
interface SplitSegment {
  title: string;
  html: string;
  level: number;
}

const SPLIT_HEADING_PATTERN = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;

function shouldSplitOnHeading(title: string): boolean {
  if (!title) return false;
  const norm = normalizeTitle(title);
  // prefix və ya number movcud olmalı
  if (norm.prefix && norm.number != null) return true;
  // bəzi başlıqlar: "Part I", "Chapter 1", "CHAPTER I."
  if (norm.number != null) return true;
  // uzun başlıqlar ola bilər, lakin əmin olmaq üçün prefix yoxlamaq olmaz
  // ona görə yalnız rəqəm+prefix kombinasiyasını qəbul edirik
  return false;
}

// Əgər heç bir başlıq tapılmasa, düz mətn kimi axtar
// "CHAPTER I", "Chapter 1", "PART ONE" tipli mətni bölmək üçün
const TEXT_SPLIT_PATTERN = /(?:^|\n)\s*(CHAPTER|Chapter|CHAPTER|Chapter|PART|Part|BOOK|Book|ACT|Act|SCENE|Scene|CANTO|Canto|SECTION|Section|BÖLÜM|Bölüm|BOLUM|Bolum)\s+([IVXLCDM]+|\d+|[A-Za-z]+)\b[^\n]{0,200}/g;

function splitHtmlByHeadings(html: string, fallbackTitle: string): SplitSegment[] {
  const headings: { index: number; level: number; title: string }[] = [];

  SPLIT_HEADING_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPLIT_HEADING_PATTERN.exec(html)) !== null) {
    const title = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (shouldSplitOnHeading(title)) {
      headings.push({
        index: m.index,
        level: Number.parseInt(m[1], 10),
        title,
      });
    }
  }

  // Əgər <h1>/<h2>/<h3> tapılmasa, düz mətn kimi axtar
  if (headings.length === 0) {
    TEXT_SPLIT_PATTERN.lastIndex = 0;
    while ((m = TEXT_SPLIT_PATTERN.exec(html)) !== null) {
      const title = (m[1] + ' ' + m[2]).trim();
      headings.push({
        index: m.index,
        level: 2,
        title,
      });
    }
  }

  if (headings.length === 0) {
    return [{ title: fallbackTitle, html, level: 2 }];
  }

  const segments: SplitSegment[] = [];
  for (let i = 0; i < headings.length; i += 1) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : html.length;
    const segmentHtml = html.slice(start, end);
    segments.push({ title: headings[i].title, html: segmentHtml, level: headings[i].level });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Əsas parse funksiyasi
// ---------------------------------------------------------------------------
export async function parseEpub(data: ArrayBuffer): Promise<ParsedEpub> {
  const zip = await JSZip.loadAsync(data);

  const containerXml = await readZipText(zip, 'META-INF/container.xml');
  if (!containerXml) {
    throw new Error('EPUB formati duzgun deyil: container.xml tapilmadi');
  }

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/i);
  if (!opfPathMatch) {
    throw new Error('EPUB formati duzgun deyil: OPF yolu tapilmadi');
  }

  const opfPath = opfPathMatch[1];
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  const opfContent = await readZipText(zip, opfPath);
  if (!opfContent) {
    throw new Error('EPUB formati duzgun deyil: OPF fayli oxunmadi');
  }

  const manifest = parseManifest(opfContent);
  const spineIds = parseSpine(opfContent);
  const titleMatch = opfContent.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
  const bookTitle = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim();

  const tocEntries =
    (await readTocNcx(zip, opfDir)) ?? (await readNavXhtml(zip, opfDir));

  const chapters: ParsedChapter[] = [];
  let chapterIndex = 0;

  interface RawChapter {
    title: string;
    href: string;
    html: string;
    level: number;
  }
  const rawChapters: RawChapter[] = [];

  for (const spineId of spineIds) {
    const item = manifest[spineId];
    if (!item) continue;

    const isHtml =
      item.mediaType.includes('xhtml') ||
      item.mediaType.includes('html') ||
      item.href.endsWith('.html') ||
      item.href.endsWith('.xhtml');

    if (!isHtml) continue;

    const chapterPath = resolvePath(opfDir, item.href);
    const html = await readZipText(zip, chapterPath);
    if (!html) continue;

    const extractedTitle = extractTitleFromHtml(html) || `Bolme ${chapterIndex + 1}`;

    if (shouldSkipChapter(extractedTitle, item.href, html)) {
      continue;
    }

    // Single-file EPUB ola bilər: daxildə bir neçə chapter var
    const segments = splitHtmlByHeadings(html, extractedTitle);
    for (const seg of segments) {
      rawChapters.push({
        title: seg.title,
        href: chapterPath,
        html: seg.html,
        level: seg.level,
      });
    }
  }

  if (rawChapters.length === 0) {
    throw new Error('EPUB-de oxunabilen bolme tapilmadi');
  }

  // TOC varsa, onun sırasından istifadə et
  if (tocEntries && tocEntries.length > 0) {
    const orderedRaw: RawChapter[] = [];
    const usedKeys = new Set<string>();

    for (const toc of tocEntries) {
      const matchIndex = rawChapters.findIndex((r) => {
        const key = r.href + '|' + r.title;
        if (usedKeys.has(key)) return false;
        if (r.href === toc.href) return true;
        const base = r.href.split('/').pop();
        return base === toc.href.split('/').pop();
      });

      if (matchIndex >= 0) {
        const matched = rawChapters[matchIndex];
        orderedRaw.push({
          title: toc.title || matched.title,
          href: matched.href,
          html: matched.html,
          level: matched.level,
        });
        usedKeys.add(matched.href + '|' + matched.title);
      }
    }

    for (const r of rawChapters) {
      if (!usedKeys.has(r.href + '|' + r.title)) {
        orderedRaw.push(r);
      }
    }

    rawChapters.length = 0;
    rawChapters.push(...orderedRaw);
  } else {
    // Normalize edilmiş sortKey ilə sırala
    rawChapters.sort((a, b) => {
      const na = normalizeTitle(a.title);
      const nb = normalizeTitle(b.title);
      return na.sortKey.localeCompare(nb.sortKey);
    });
  }

  for (const raw of rawChapters) {
    const json = buildChapterJson(raw.title, raw.html);
    chapters.push({
      index: chapterIndex,
      title: json.title,
      json,
    });
    chapterIndex += 1;
  }

  if (chapters.length === 0) {
    throw new Error('EPUB-de oxunabilen bolme tapilmadi');
  }

  return { title: bookTitle, chapters };
}
