# Logseq Admonitions

Tag-driven **native** admonitions for Logseq DB graphs.

You write a `#tag`; the plugin rewrites it, in place, into Logseq's native
`#+BEGIN_<TYPE> … #+END_<TYPE>` admonition block — and ships the CSS that themes
those blocks. One plugin, both halves.

> Tag-driven trigger, rendered through Logseq's **built-in** admonitions
> (styled by `logseq-db-admonitions.css`) rather than custom callout markup.

## How it works

```
#Caution                 #+BEGIN_CAUTION
Trap line one     ──▶     Trap line one
\end                      #+END_CAUTION
tail text                 tail text
```

Rules, scanning **downward** from the tag:

| You type | Becomes | Notes |
|---|---|---|
| `#caution` (opener tag) | `#+BEGIN_CAUTION` | the tag opens the admonition |
| `\end` (standalone line) | `#+END_CAUTION` | optional explicit closer |
| *(no `\end`)* | `#+END_CAUTION` appended | runs to the end of the block |

- Content **above** the tag stays outside the admonition.
- Content **after `\end`** stays outside, as normal text.
- The rewrite is **idempotent**: once a block contains `#+BEGIN_`, it is left alone.

### Worked examples

No closer — everything below the tag falls in:

```md
+ Pain = paroxysmal discharge … exam is clean
#Caution
Trap: CN III palsy → ptosis … no facial pain
```

Explicit `\end` — only the line(s) above the closer fall in:

```md
#Note
Cholinergic drugs (cholinesterase inhibitors) are the mainstay
\end
when you make a mistake don't panic
```

## Supported tags (v1)

Only tags with a real native admonition block are handled:

| Colored (themed by the CSS) | Native but uncolored |
|---|---|
| `note` `tip` `pinned` `important` `warning` `caution` | `center` `example` `verse` |

Other common callout names (`question`, `faq`, `success`, `danger`, `abstract`,
`tldr`, `latex`, …) have no native equivalent yet — that's the next milestone.

## Build

Builds with **Deno** (≥ 2.4) — a single binary, no Node toolchain:

```sh
deno install        # fetch @logseq/libs into node_modules
deno task build     # bundle -> dist/index.js
deno task test      # run the transform unit tests
deno check src/index.ts   # typecheck
```

## Install in Logseq

1. `deno task build` (produces `dist/index.js`; `dist/index.html` is committed).
2. Logseq → **⋯ → Plugins → Load unpacked plugin** → select this repo's folder.
3. The plugin injects its CSS automatically; no theme/`custom.css` step needed.

## Notes

- DB graphs only (`supportsDBOnly`).
- The block currently being edited is skipped, so your cursor is never yanked;
  the rewrite fires once you move off the block.
