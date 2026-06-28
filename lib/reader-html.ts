export function wrapChapterHtml(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="az">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #faf8f5;
        color: #1a1a1a;
        font-family: Georgia, "Times New Roman", serif;
        line-height: 1.75;
        font-size: 18px;
        -webkit-text-size-adjust: 100%;
      }
      body {
        padding: 24px 20px 40px;
        max-width: 720px;
        margin: 0 auto;
      }
      h1, h2, h3 {
        line-height: 1.3;
        margin-top: 1.5em;
        margin-bottom: 0.75em;
        font-family: system-ui, -apple-system, sans-serif;
      }
      p { margin: 0 0 1em; }
      img { max-width: 100%; height: auto; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
