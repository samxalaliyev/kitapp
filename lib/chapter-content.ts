const SKIP_TITLE_PATTERNS = [
  /^contents\.?$/i,
  /^table of contents\.?$/i,
  /^etymology\.?$/i,
  /^extracts\.?$/i,
  /^cover$/i,
  /^title\s*page$/i,
  /^copyright$/i,
  /^dedication$/i,
  /^colophon$/i,
  /^imprint$/i,
  /^transcriber[''\u2019]?s?\s+notes?$/i,
  /^producer[''\u2019]?s?\s+notes?$/i,
  /^preface$/i,
  /^foreword$/i,
  /^introduction$/i,
  /^about\s+this\s+(ebook|book)$/i,
  /^about\s+the\s+(author|title|ebook|book)$/i,
  /^the\s+project\s+gutenberg(\s+(ebook|license|alphabetic|philosophy))?$/i,
  /^project\s+gutenberg[''\u2019]?s?/i,
  /^gutenberg$/i,
  /^small\s+print!?$/i,
  /^start\s+(of\s+)?(the\s+)?(full\s+)?(project\s+)?gutenberg/i,
  /^end\s+(of\s+)?(the\s+)?(project\s+)?gutenberg/i,
  /^full\s+title/i,
  /^ebook\s+(title|details|meta|copyright|information|produced|by|updates?|cataloging)/i,
  /^updated?\s+editions?$/i,
  /^donate|donations?/i,
  /^please\s+(read|note|consider|help|support)/i,
  /^most\s+(recently\s+)?updated/i,
  /^new\s+editions?/i,
  /^section\s+1\./i,
  /^section\s+2\./i,
];

const SKIP_HREF_PATTERNS = [
  /toc/i,
  /nav/i,
  /cover/i,
  /titlepage/i,
  /colophon/i,
  /copyright/i,
];

// Project Gutenberg lisenziyasi ve metadata metnlerini temizle.
const SKIP_BODY_PATTERNS = [
  /\*\*\*\s*START\s+OF\s+(THE|THIS)\s+PROJECT\s+GUTENBERG[\s\S]*?LICENSE[\s\S]*?\*\*\*/gi,
  /\*\*\*\s*END\s+OF\s+(THE|THIS)\s+PROJECT\s+GUTENBERG[\s\S]*?\*\*\*/gi,
  /Project\s+Gutenberg[^\n]{0,200}License[\s\S]{0,4000}?\*\*\*\s*END/g,
];

export function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1] : html;

  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<nav[\s\S]*?<\/nav>/gi, '');

  // Project Gutenberg shablonlarinin qalan izlerini de sil.
  for (const pattern of SKIP_BODY_PATTERNS) {
    content = content.replace(pattern, '');
  }

  return content.trim();
}

export function isTableOfContentsPage(html: string): boolean {
  const body = extractBodyContent(html);
  const linkCount = (body.match(/<a\b/gi) ?? []).length;
  const textLength = body.replace(/<[^>]+>/g, '').trim().length;

  if (linkCount >= 8 && textLength < linkCount * 40) {
    return true;
  }

  const chapterLinkCount = (body.match(/CHAPTER\s+\d+/gi) ?? []).length;
  if (chapterLinkCount >= 5 && linkCount >= chapterLinkCount) {
    return true;
  }

  // Bolmeye aid melumati olmayan, coxlu xarici link olan sehife.
  const gutendexLinkCount =
    (body.match(/gutenberg\.org|gutendex\.com/gi) ?? []).length;
  if (gutendexLinkCount >= 2 && linkCount >= gutendexLinkCount) {
    return true;
  }

  return false;
}

export function shouldSkipChapter(
  title: string,
  href: string,
  html: string,
): boolean {
  const normalizedTitle = title.replace(/<[^>]+>/g, '').trim();

  for (const pattern of SKIP_TITLE_PATTERNS) {
    if (pattern.test(normalizedTitle)) {
      return true;
    }
  }

  for (const pattern of SKIP_HREF_PATTERNS) {
    if (pattern.test(href)) {
      return true;
    }
  }

  if (isTableOfContentsPage(html)) {
    return true;
  }

  const body = extractBodyContent(html);
  const text = body.replace(/<[^>]+>/g, '').trim();

  // Cox qisa, icibos ve ya yalniz metadata olan sehifeleri atla.
  if (text.length < 200) {
    return true;
  }

  // Bu sehifede yalniz "PROJECT GUTENBERG" / "LICENSE" sozleri varsa, atla.
  const projectGutenbergMentions =
    (text.match(/PROJECT\s+GUTENBERG/gi) ?? []).length;
  const licenseMentions = (text.match(/LICENSE/gi) ?? []).length;
  if (
    projectGutenbergMentions >= 1 &&
    licenseMentions >= 1 &&
    text.length < 1500
  ) {
    return true;
  }

  return false;
}

export function buildChapterJson(
  title: string,
  html: string,
): { title: string; content: string } {
  const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
  const content = extractBodyContent(html);

  return {
    title: cleanTitle || 'Bolme',
    content,
  };
}
