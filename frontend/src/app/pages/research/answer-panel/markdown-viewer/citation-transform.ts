/**
 * Rewrites `[n]` citation markers in rendered markdown HTML into clickable chips.
 *
 * Pure string transform so it can be unit-tested without a DOM: the HTML is split
 * on tags and only the text segments that sit outside `<code>`, `<pre>` and `<a>`
 * elements are rewritten. Markers are kept verbatim when they reference a source
 * that does not exist (`n > max`, `n < 1`) or when there are no sources at all.
 *
 * Supported forms: `[1]`, `[1, 3]` (one chip per number) and `[1][2]`.
 */

/** A full tag token produced by the split below, e.g. `<a href="#">`. */
const TAG = /^<[^>]+>$/;

/** Opening/closing tag of an element whose text content must not be touched. */
const OPAQUE_TAG = /^<\s*(\/?)\s*(code|pre|a)\b/i;

/** `[1]`, `[1, 3]`, `[12,3]` — up to two digits per number. */
const CITATION = /\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\]/g;

export function wrapCitations(html: string, max: number): string {
  if (!html || max <= 0) return html;

  let opaqueDepth = 0;

  return html
    .split(/(<[^>]+>)/)
    .map(segment => {
      if (TAG.test(segment)) {
        const match = OPAQUE_TAG.exec(segment);
        if (match) {
          if (match[1]) opaqueDepth = Math.max(0, opaqueDepth - 1);
          else if (!segment.endsWith('/>')) opaqueDepth++;
        }
        return segment;
      }
      return opaqueDepth > 0 ? segment : replaceMarkers(segment, max);
    })
    .join('');
}

function replaceMarkers(text: string, max: number): string {
  return text.replace(CITATION, (marker, group: string) => {
    const numbers = group.split(',').map(part => Number(part.trim()));
    if (numbers.some(n => !Number.isInteger(n) || n < 1 || n > max)) return marker;
    return numbers.map(n => `<a class="citation-chip" data-cite="${n}">${n}</a>`).join('');
  });
}
