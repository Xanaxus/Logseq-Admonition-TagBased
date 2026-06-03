/**
 * Callout tag -> native Logseq admonition keyword.
 *
 * The plugin watches blocks for one of these tags (as an inline `#[[uuid]]`
 * ref, or literal `#name` text) and rewrites it into the matching native
 * `#+BEGIN_<KEYWORD> ... #+END_<KEYWORD>` admonition block.
 *
 * v1 scope: only tags that have a real native admonition block.
 *   - Colored by styles.ts: note, tip, pinned, important, warning, caution
 *   - Native but uncolored:  center, example, verse
 *
 * The remaining ~20 common callout names (question, faq, success, danger,
 * abstract, tldr, latex, ...) have no native equivalent — the "later hurdle".
 */
export const CALLOUTS: Record<string, string> = {
  note: 'NOTE',
  tip: 'TIP',
  pinned: 'PINNED',
  important: 'IMPORTANT',
  warning: 'WARNING',
  caution: 'CAUTION',
  center: 'CENTER',
  example: 'EXAMPLE',
  verse: 'VERSE',
}

/** Native `#+BEGIN_<X>` keyword for a tag name, or undefined if not a callout. */
export function nativeKeyword(name: string): string | undefined {
  return CALLOUTS[name.trim().toLowerCase()]
}
