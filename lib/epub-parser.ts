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

function resolvePath(baseDir: string, href: string): string {
  if (href.startsWith('/')) return href.slice(1);
  if (!baseDir) return href;
  return `${baseDir}${href}`;
}

function extractTitleFromHtml(html: string): string | null {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, '').trim();
  }

  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) {
    return h2Match[1].replace(/<[^>]+>/g, '').trim();
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

export async function parseEpub(data: ArrayBuffer): Promise<ParsedEpub> {
  const zip = await JSZip.loadAsync(data);

  const containerXml = await readZipText(zip, 'META-INF/container.xml');
  if (!containerXml) {
    throw new Error('EPUB formatı düzgün deyil: container.xml tapılmadı');
  }

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/i);
  if (!opfPathMatch) {
    throw new Error('EPUB formatı düzgün deyil: OPF yolu tapılmadı');
  }

  const opfPath = opfPathMatch[1];
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  const opfContent = await readZipText(zip, opfPath);
  if (!opfContent) {
    throw new Error('EPUB formatı düzgün deyil: OPF faylı oxunmadı');
  }

  const manifest = parseManifest(opfContent);
  const spineIds = parseSpine(opfContent);
  const titleMatch = opfContent.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
  const bookTitle = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim();

  const chapters: ParsedChapter[] = [];
  let chapterIndex = 0;

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

    const extractedTitle = extractTitleFromHtml(html) || `Bölmə ${chapterIndex + 1}`;

    if (shouldSkipChapter(extractedTitle, item.href, html)) {
      continue;
    }

    const json = buildChapterJson(extractedTitle, html);

    chapters.push({
      index: chapterIndex,
      title: json.title,
      json,
    });
    chapterIndex += 1;
  }

  if (chapters.length === 0) {
    throw new Error('EPUB-də oxunabilən bölmə tapılmadı');
  }

  return { title: bookTitle, chapters };
}
