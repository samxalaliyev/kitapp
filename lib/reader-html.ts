const WORD_SELECT_MESSAGE = '__word_selected__';

export function wrapChapterHtml(
  bodyHtml: string,
  title: string,
): string {
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
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #faf8f5;
        color: #1a1a1a;
        font-family: Georgia, "Times New Roman", serif;
        line-height: 1.75;
        font-size: 18px;
        -webkit-text-size-adjust: 100%;
        overflow-x: hidden;
        width: 100%;
        max-width: 100%;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      body {
        padding: 24px 20px 40px;
        max-width: 720px;
        margin: 0 auto;
      }
      h1, h2, h3, h4, h5, h6 {
        line-height: 1.3;
        margin-top: 1.5em;
        margin-bottom: 0.75em;
        font-family: system-ui, -apple-system, sans-serif;
        color: #0f172a;
        word-wrap: break-word;
        overflow-wrap: break-word;
        font-weight: 700;
      }
      h1 { font-size: 1.6em; }
      h2 { font-size: 1.35em; }
      h3 { font-size: 1.15em; }
      h4 { font-size: 1em; }
      p {
        margin: 0 0 1em;
        color: #1a1a1a;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      ul, ol { padding-left: 1.4em; margin: 0 0 1em; }
      li { margin-bottom: 0.35em; }
      blockquote {
        margin: 0 0 1em;
        padding: 0.4em 0 0.4em 1em;
        border-left: 3px solid #cbd5e1;
        color: #334155;
        font-style: italic;
      }
      hr {
        border: 0;
        border-top: 1px solid #e2e8f0;
        margin: 1.5em 0;
      }
      a, a:visited, a:hover, a:active {
        color: #2563eb;
        text-decoration: underline;
        word-break: break-word;
      }
      strong, b { color: #0f172a; font-weight: 700; }
      em, i { color: #1a1a1a; font-style: italic; }
      u { text-decoration: underline; }
      small { font-size: 0.85em; color: #475569; }
      mark { background: #fef08a; color: #1a1a1a; padding: 0 2px; }
      code, pre, kbd, samp {
        font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
        font-size: 0.95em;
        color: #0f172a;
        background: #f1f5f9;
      }
      code { padding: 1px 4px; border-radius: 4px; }
      pre {
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        max-width: 100%;
      }
      img, picture, video, audio, canvas, svg, iframe {
        max-width: 100% !important;
        height: auto !important;
        display: block;
      }
      figure { margin: 0 0 1em; max-width: 100%; }
      figcaption { font-size: 0.85em; color: #64748b; }
      table {
        border-collapse: collapse;
        width: 100% !important;
        max-width: 100%;
        display: block;
        overflow-x: auto;
        margin: 0 0 1em;
      }
      th, td { padding: 6px 8px; border: 1px solid #e2e8f0; }
      th { background: #f1f5f9; }
      section, article, main, aside, nav, header, footer, div {
        max-width: 100%;
      }
      [style*="white-space: nowrap"] { white-space: normal !important; }
      [style*="color: blue"],
      [style*="color:blue"],
      [style*="color: #00f"],
      [style*="color: #0000ff"] {
        color: #1a1a1a !important;
      }
      [style*="color: red"] { color: #b91c1c !important; }
      [style*="color: green"] { color: #166534 !important; }
      ::-webkit-scrollbar { width: 0; background: transparent; }
      ::selection { background: #bfdbfe; color: inherit; }
    </style>
  </head>
  <body onclick="handleBodyClick(event)">
    ${bodyHtml}
    <script>
      (function () {
        function sendToNative(payload) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        }

        function isWordChar(ch) {
          return /[A-Za-z0-9'\u2019\-]/.test(ch);
        }

        function extractWord(node, offset) {
          var text = node.nodeValue || '';
          if (!isWordChar(text[offset] || '')) return null;
          var start = offset;
          var end = offset;
          while (start > 0 && isWordChar(text[start - 1] || '')) start -= 1;
          while (end < text.length && isWordChar(text[end] || '')) end += 1;
          var word = text.slice(start, end).trim();
          if (word.length < 2) return null;
          if (!/[A-Za-z]/.test(word)) return null;
          return word;
        }

        function findWordFromPoint(x, y) {
          if (document.caretPositionFromPoint) {
            var pos = document.caretPositionFromPoint(x, y);
            if (pos && pos.offsetNode) {
              return extractWord(pos.offsetNode, pos.offset);
            }
          }
          if (document.caretRangeFromPoint) {
            var range = document.caretRangeFromPoint(x, y);
            if (range && range.startContainer) {
              return extractWord(range.startContainer, range.startOffset);
            }
          }
          return null;
        }

        // Selection mode aktiv olanda secilmis sozleri range ile highlight et
        // ve native terefə gonder. selectionMode = true|false
        window.__setSelectionMode = function (active) {
          window.__selectionMode = !!active;
          if (!active) {
            // secili highlight-lari temizle
            var marks = document.querySelectorAll('mark.__kitapapp_sel');
            for (var i = 0; i < marks.length; i += 1) {
              var parent = marks[i].parentNode;
              while (marks[i].firstChild) {
                parent.insertBefore(marks[i].firstChild, marks[i]);
              }
              parent.removeChild(marks[i]);
              parent.normalize();
            }
          }
        };

        function highlightWord(node, start, end) {
          if (!node || node.nodeType !== 3) return;
          var range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, end);
          var mark = document.createElement('mark');
          mark.className = '__kitapapp_sel';
          mark.style.background = '#fde68a';
          mark.style.padding = '0 2px';
          mark.style.borderRadius = '3px';
          try {
            range.surroundContents(mark);
          } catch (e) {
            // range birden cox node-a yayilirsa, surroundContents islemir;
            // fallback olaraq secilmish hisseni parcalayib mark ile evez edirik
            var fragment = range.extractContents();
            mark.appendChild(fragment);
            range.insertNode(mark);
          }
        }

        window.handleBodyClick = function (event) {
          var word = findWordFromPoint(event.clientX, event.clientY);
          if (!word) {
            var sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              var range = sel.getRangeAt(0);
              if (range.startContainer && range.startContainer.nodeType === 3) {
                word = extractWord(range.startContainer, range.startOffset);
              }
            }
          }
          if (!word) return;

          if (window.__selectionMode) {
            // highlight + native terefə gonder
            var pos = document.caretPositionFromPoint
              ? document.caretPositionFromPoint(event.clientX, event.clientY)
              : null;
            if (pos && pos.offsetNode && pos.offsetNode.nodeType === 3) {
              var t = pos.offsetNode.nodeValue;
              var s = pos.offset;
              while (s > 0 && isWordChar(t[s - 1] || '')) s -= 1;
              var e = pos.offset;
              while (e < t.length && isWordChar(t[e] || '')) e += 1;
              highlightWord(pos.offsetNode, s, e);
            }
            
            // DOM-dakı bütün seçilmiş (mark) sözləri sırası ilə topla
            var marks = document.querySelectorAll('mark.__kitapapp_sel');
            var selectedWordsArray = [];
            for (var i = 0; i < marks.length; i++) {
              selectedWordsArray.push(marks[i].textContent.trim());
            }
            var fullText = selectedWordsArray.join(' ');
            sendToNative({ type: '${WORD_SELECT_MESSAGE}', word: fullText, mode: 'select_all' });
          } else {
            sendToNative({ type: '${WORD_SELECT_MESSAGE}', word: word, mode: 'lookup' });
          }
        };
      })();
    </script>
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

export const WORD_SELECT_MESSAGE_TYPE = WORD_SELECT_MESSAGE;
