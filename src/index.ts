import '@logseq/libs'
import { CALLOUTS, nativeKeyword } from './callouts'
import { ADMONITION_CSS } from './styles'
import {
  buildWrapped,
  earliest,
  findLiteralOpeners,
  REF_RE,
  type Opener,
} from './transform'

/**
 * logseq-admonitions
 *
 * Watches blocks for a callout tag and rewrites it, in place, into a native
 * Logseq admonition:
 *
 *     #Caution                 #+BEGIN_CAUTION
 *     Trap line one     ->      Trap line one
 *     \end                      #+END_CAUTION
 *     tail text                 tail text
 *
 * Rules:
 *   - The tag opens the admonition (replaced by `#+BEGIN_<TYPE>`).
 *   - A standalone `\end` line closes it (replaced by `#+END_<TYPE>`).
 *   - With no `\end`, the admonition runs to the end of the block.
 *   - Content ABOVE the tag stays outside the admonition.
 *
 * The native block is then themed by the injected CSS (see styles.ts).
 */

// === debug ===
// Verified 2026-06-03: getBlock() returns raw content; detection + rewrite work
// in DB graphs. Flip to true to log raw block content while diagnosing.
const DEBUG = false
function dbg(...args: unknown[]): void {
  if (DEBUG) console.log('[admonition]', ...args)
}

// === tag-ref resolution ===

/** Lowercased title of a class/page referenced by uuid, cached for the session. */
const titleCache = new Map<string, string | null>()

async function resolveRefTitle(uuid: string): Promise<string | null> {
  const cached = titleCache.get(uuid)
  if (cached !== undefined) return cached

  let title: string | null = null
  try {
    const page = await logseq.Editor.getPage(uuid)
    title = (page?.originalName as string | undefined) ?? (page?.name as string | undefined) ?? null
    if (!title) {
      const block = await logseq.Editor.getBlock(uuid)
      title = (block?.title as string | undefined) ?? null
    }
  } catch {
    /* ignore */
  }
  const norm = title ? title.toLowerCase() : null
  titleCache.set(uuid, norm)
  return norm
}

// === opener detection ===

/**
 * Find the earliest callout opener in the raw block content. Handles both the
 * DB-graph inline ref form `#[[uuid]]` and a literal `#name` (file graphs, or
 * a tag Logseq has not yet converted). The literal form is resolved purely in
 * transform.ts; the ref form needs an async title lookup, so it lives here.
 */
async function findOpener(raw: string): Promise<Opener | null> {
  const candidates: Opener[] = findLiteralOpeners(raw)

  REF_RE.lastIndex = 0
  for (const m of raw.matchAll(REF_RE)) {
    const title = await resolveRefTitle(m[1])
    const keyword = title ? nativeKeyword(title) : undefined
    if (keyword) candidates.push({ index: m.index ?? 0, token: m[0], keyword })
  }

  return earliest(candidates)
}

// === rewrite ===

// In DEBUG, log the raw content of any block that *looks* like it might hold a
// callout — even when detection fails — so we can confirm exactly what shape
// getBlock() returns in this graph (inline `#[[uuid]]` ref vs. rendered text).
const INTERESTING_RE =
  /#\[\[|#(note|tip|pinned|important|warning|caution|center|example|verse)\b/i

async function processBlock(uuid: string): Promise<void> {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return

  const raw = (block.title as string | undefined) ?? block.content ?? ''
  if (!raw) return

  if (DEBUG && INTERESTING_RE.test(raw)) {
    dbg('raw block content for', uuid, '=>', JSON.stringify(raw))
  }

  // Already a native admonition (or mid-conversion) — leave it alone. This is
  // also what makes the rewrite idempotent and prevents re-trigger loops.
  if (raw.includes('#+BEGIN_')) return

  const opener = await findOpener(raw)
  if (!opener) return

  const wrapped = buildWrapped(raw, opener)
  if (wrapped === raw) return

  dbg('rewriting', uuid, '=>', JSON.stringify(wrapped))
  await logseq.Editor.updateBlock(uuid, wrapped)
}

// === scanning ===

interface TreeBlock {
  uuid: string
  children?: unknown[]
}

type EditingState = string | boolean | null | undefined

async function walk(blocks: TreeBlock[], editingUuid: EditingState): Promise<void> {
  for (const b of blocks) {
    // Skip the block currently being edited so we never yank the cursor.
    if (b.uuid && b.uuid !== editingUuid) await processBlock(b.uuid)
    if (Array.isArray(b.children) && b.children.length > 0) {
      await walk(b.children as TreeBlock[], editingUuid)
    }
  }
}

async function scanCurrentPage(): Promise<void> {
  try {
    const editingUuid = (await logseq.Editor.checkEditing()) as EditingState
    const page =
      (await logseq.Editor.getCurrentPage()) ?? (await logseq.Editor.getTodayPage())
    if (!page) return

    const blocks = await logseq.Editor.getPageBlocksTree(
      (page.name as string) ?? (page.uuid as string),
    )
    if (!blocks) return

    await walk(blocks as TreeBlock[], editingUuid)
  } catch (err) {
    console.warn('[admonition] scan error:', err)
  }
}

let scanTimer: ReturnType<typeof setTimeout> | undefined
function debouncedScan(delay = 400): void {
  clearTimeout(scanTimer)
  scanTimer = setTimeout(scanCurrentPage, delay)
}

// === entry ===

async function main(): Promise<void> {
  dbg('plugin loaded')

  // Half 2 of the merge: theme the native admonition blocks we create.
  logseq.provideStyle({ key: 'db-admonitions', style: ADMONITION_CSS })

  setTimeout(scanCurrentPage, 800)

  logseq.App.onRouteChanged(() => debouncedScan(500))
  logseq.DB.onChanged((e) => {
    if (e.blocks && e.blocks.length > 0) debouncedScan(400)
  })

  // Slash command for each callout type: drop the opener tag at the cursor.
  for (const name of Object.keys(CALLOUTS)) {
    logseq.Editor.registerSlashCommand(`Admonition: ${name}`, async () => {
      await logseq.Editor.insertAtEditingCursor(`#${name}\n`)
    })
  }

  logseq.beforeunload(async () => {
    clearTimeout(scanTimer)
  })
}

logseq.ready(main).catch(console.error)
