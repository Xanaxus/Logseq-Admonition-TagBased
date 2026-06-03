/**
 * Unit tests for the pure rewrite logic. Run with: `deno task test`
 *
 * These import the real src/transform.ts + src/callouts.ts (neither pulls in
 * the Logseq runtime), so they exercise exactly the code that ships.
 */
import {
  buildWrapped,
  earliest,
  findLiteralOpeners,
} from '../src/transform.ts'

let passed = 0
let failed = 0

function eq(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    passed++
    console.log(`  ok   ${label}`)
  } else {
    failed++
    console.error(`  FAIL ${label}\n       expected: ${e}\n       actual:   ${a}`)
  }
}

/** Convenience: detect the earliest literal opener and wrap. */
function wrap(raw: string): string {
  const op = earliest(findLiteralOpeners(raw))
  if (!op) throw new Error('no opener found')
  return buildWrapped(raw, op)
}

// --- Example 1: no \end → content above stays out, everything below wraps ---
eq(
  'no-\\end wraps to end of block, preserves lines above the tag',
  wrap('list a\nlist b\n#Caution\nTrap line one\nCN III palsy tail'),
  'list a\nlist b\n#+BEGIN_CAUTION\nTrap line one\nCN III palsy tail\n#+END_CAUTION',
)

// --- Example 2: \end closes early, tail text stays normal ---
eq(
  '\\end closes the admonition; trailing text stays outside',
  wrap("#Note\nCholinergic drugs are the mainstay\n\\end\nwhen you make a mistake don't panic"),
  "#+BEGIN_NOTE\nCholinergic drugs are the mainstay\n#+END_NOTE\nwhen you make a mistake don't panic",
)

// --- Example 3: inline trailing text after the tag on the same line ---
eq(
  'inline body after the tag is pushed onto its own line',
  wrap('#Tip use spaced repetition\nand active recall'),
  '#+BEGIN_TIP\nuse spaced repetition\nand active recall\n#+END_TIP',
)

// --- Detection edges ---
eq('non-callout tag yields no opener', earliest(findLiteralOpeners('just #random text')), null)
eq(
  'already-wrapped content yields no literal opener (idempotent)',
  findLiteralOpeners('#+BEGIN_CAUTION\nbody\n#+END_CAUTION'),
  [],
)
eq(
  'earliest opener wins when two callouts are present',
  earliest(findLiteralOpeners('#note alpha\n#tip beta'))?.keyword,
  'NOTE',
)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) Deno.exit(1)
