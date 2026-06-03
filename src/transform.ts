/**
 * Pure block-content transform — no Logseq runtime, fully unit-testable.
 *
 * Given a raw block's multiline content and the location of a callout opener,
 * produce the rewritten content with native `#+BEGIN_<TYPE>` / `#+END_<TYPE>`
 * markers. See test/transform_test.ts for the contract.
 */
import { nativeKeyword } from './callouts'

export interface Opener {
  index: number
  token: string
  keyword: string
}

/** DB-graph inline tag ref: `#[[<uuid>]]`. */
export const REF_RE = /#\[\[([0-9a-fA-F-]{36})\]\]/g
/** Literal tag text: `#name`. */
export const LITERAL_RE = /#([A-Za-z][A-Za-z0-9_-]*)/g
/** A standalone `\end` line that closes an admonition. */
export const CLOSE_RE = /\n[ \t]*\\end[ \t]*(?=\n|$)/

/**
 * Literal-form openers found in raw content (the part that needs no async tag
 * resolution). The DB-graph `#[[uuid]]` form is resolved in index.ts and merged
 * with these by lowest index.
 */
export function findLiteralOpeners(raw: string): Opener[] {
  const out: Opener[] = []
  for (const m of raw.matchAll(LITERAL_RE)) {
    const keyword = nativeKeyword(m[1])
    if (keyword) out.push({ index: m.index ?? 0, token: m[0], keyword })
  }
  return out
}

/** Pick the earliest opener from a set, or null. */
export function earliest(openers: Opener[]): Opener | null {
  if (openers.length === 0) return null
  return openers.reduce((a, b) => (b.index < a.index ? b : a))
}

/**
 * Rewrite raw content: the opener token becomes `#+BEGIN_<KEYWORD>`, and the
 * admonition closes at the first standalone `\end` line (replaced by
 * `#+END_<KEYWORD>`) or, absent that, at the end of the block. Content before
 * the opener is preserved verbatim.
 */
export function buildWrapped(raw: string, opener: Opener): string {
  const { index, token, keyword } = opener
  const before = raw.slice(0, index)

  // Everything after the opener token; trim inline spaces so BEGIN sits alone
  // on its line, and push any same-line trailing text down into the body.
  let rest = raw.slice(index + token.length).replace(/^[ \t]+/, '')
  if (rest.length > 0 && !rest.startsWith('\n')) rest = '\n' + rest

  const head = before + `#+BEGIN_${keyword}`
  let tail = rest

  CLOSE_RE.lastIndex = 0
  if (CLOSE_RE.test(tail)) {
    CLOSE_RE.lastIndex = 0
    tail = tail.replace(CLOSE_RE, `\n#+END_${keyword}`)
  } else {
    tail = tail.replace(/[ \t]*$/, '') + `\n#+END_${keyword}`
  }

  return head + tail
}
