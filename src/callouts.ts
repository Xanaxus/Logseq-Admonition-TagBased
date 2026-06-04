import { isNonNative, NON_NATIVE } from './overlays'

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
 * The remaining ~19 common callout names (question, faq, success, danger,
 * abstract, tldr, latex, ...) have no native block — v2 wraps them in a NOTE
 * host and recolors per-block (see overlays.ts + HOST_KEYWORD below).
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

/**
 * Semantic mapping: non-native tags wrap into a native host that's
 * semantically close (so the overlay is a small color/icon delta).
 */
const HOST_KEYWORD_MAP: Record<string, string> = {
  // IMPORTANT: only NOTE/TIP/IMPORTANT/WARNING/CAUTION/PINNED render as a real
  // `.admonitionblock`. CENTER/EXAMPLE/VERSE do NOT (plain blocks, no box), so
  // non-native tags must only ever wrap into one of the admonition hosts.
  faq: 'NOTE',
  danger: 'WARNING',
  attention: 'IMPORTANT',
  // everything else defaults to NOTE; the per-block overlay fully recolors and
  // re-icons it, so the host is just a structural base.
}

export function hostKeywordFor(nonNativeTag: string): string {
  return HOST_KEYWORD_MAP[nonNativeTag.toLowerCase()] ?? 'NOTE'
}

export interface TagClass {
  /** Normalized (lowercased) tag name. */
  tag: string
  /** `#+BEGIN_<keyword>` to wrap with — the native keyword, or a host semantic match. */
  keyword: string
  /** True for non-native tags (replace the tag with a `**Label**` marker + overlay). */
  nonNative: boolean
  /** Display label for non-native tags, e.g. "FAQ" — becomes the `**Label**` marker. */
  label?: string
}

/** Classify a tag name as a native callout, a non-native callout, or neither. */
export function classifyTag(name: string): TagClass | null {
  const tag = name.trim().toLowerCase()
  const native = CALLOUTS[tag]
  if (native) return { tag, keyword: native, nonNative: false }
  if (isNonNative(tag)) {
    return { tag, keyword: hostKeywordFor(tag), nonNative: true, label: NON_NATIVE[tag].label }
  }
  return null
}
