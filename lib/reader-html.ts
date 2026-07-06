const WORD_SELECT_MESSAGE = '__word_selected__';

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

      ::selection {
        background: #bfdbfe;
        color: inherit;
      }

      .word-token {
        cursor: pointer;
        border-radius: 3px;
        padding: 0 1px;
        transition: background 120ms ease;
      }
      .word-token:active {
        background: #fde68a;
      }
    </style>
  </head>
  <body onclick="handleBodyClick(event)">
    ${bodyHtml}
    <script>
      (function () {
        // WebView <-> React Native elaqesi ucun handler.
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

        window.handleBodyClick = function (event) {
          // Tiklama edilen yerden soz cixar.
          var word = findWordFromPoint(event.clientX, event.clientY);
          if (!word) {
            // Alternativ: range istifade et.
            var sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              var range = sel.getRangeAt(0);
              if (range.startContainer && range.startContainer.nodeType === 3) {
                word = extractWord(range.startContainer, range.startOffset);
              }
            }
          }
          if (!word) return;
          sendToNative({ type: '${WORD_SELECT_MESSAGE}', word: word });
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
