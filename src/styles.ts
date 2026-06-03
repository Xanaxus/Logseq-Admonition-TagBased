/**
 * Native-admonition CSS, injected by the plugin via logseq.provideStyle().
 *
 * This is the second half of the merge: the plugin rewrites a #tag into a
 * native `#+BEGIN_<TYPE>` block (see index.ts), and Logseq renders that as
 * `.admonitionblock.<type>`. This stylesheet themes those native blocks, so
 * the user does not have to install it as a separate custom.css / theme.
 *
 * Source: `logseq-db-admonitions.css`. The colors use Logseq DB graph Radix
 * tokens (--rx-*), so they adapt to light/dark.
 */
export const ADMONITION_CSS = `
/* Admonitions (injected by logseq-admonitions plugin) */
.admonitionblock {
  --admonition-bg: var(--rx-gray-04);
  --admonition-color: inherit;
  --admonition-accent-color: var(--rx-gray-07);
  --admonition-element-bg: var(--rx-gray-05);
  --admonition-font-size: .9em;

  padding: .8em 1.2em;
  border-radius: var(--ls-border-radius-low);
  background-color: var(--admonition-bg);
  color: var(--admonition-color);
}

.admonitionblock > .admonition-icon {
  color: var(--admonition-accent-color);
  border-right: .15em solid currentColor;
}

.admonitionblock > .admonition-icon > svg {
  color: inherit !important;
}

.admonitionblock > .admonition-icon > svg :where(path, circle, rect, polygon) {
  fill: currentColor !important;
}

.admonitionblock > .admonition-icon + div {
  font-size: var(--admonition-font-size);
  line-height: 1.45;
}

.admonitionblock > .admonition-icon + div :where(.is-paragraph, p, li) {
  color: inherit;
}

.admonitionblock > .admonition-icon + div :where(ul) {
  list-style-type: disc;
}

.admonitionblock > .admonition-icon + div > :where(ul, ol) {
  margin-block: 1em;
}

.admonitionblock > .admonition-icon + div :where(li > p) {
  margin-block: 0;
}

.admonitionblock > .admonition-icon + div :where(:not(pre) > code) {
  background-color: var(--admonition-element-bg);
  color: inherit;
}

.admonitionblock.note {
  --admonition-bg: var(--rx-amber-03);
  --admonition-color: var(--rx-amber-12);
  --admonition-accent-color: var(--rx-amber-08);
  --admonition-element-bg: var(--rx-amber-05);
}

.admonitionblock.tip {
  --admonition-bg: var(--rx-cyan-03);
  --admonition-color: var(--rx-cyan-12);
  --admonition-accent-color: var(--rx-cyan-08);
  --admonition-element-bg: var(--rx-cyan-05);
}

.admonitionblock.pinned {
  --admonition-bg: var(--rx-teal-03);
  --admonition-color: var(--rx-teal-12);
  --admonition-accent-color: var(--rx-teal-08);
  --admonition-element-bg: var(--rx-teal-05);
}

.admonitionblock.important {
  --admonition-bg: var(--rx-red-03);
  --admonition-color: var(--rx-red-12);
  --admonition-accent-color: var(--rx-red-08);
  --admonition-element-bg: var(--rx-red-05);
}

.admonitionblock.warning {
  --admonition-bg: var(--rx-orange-05);
  --admonition-color: var(--rx-orange-12);
  --admonition-accent-color: var(--rx-orange-09);
  --admonition-element-bg: var(--rx-orange-07);
}

.admonitionblock.caution {
  --admonition-bg: var(--rx-tomato-05);
  --admonition-color: var(--rx-tomato-12);
  --admonition-accent-color: var(--rx-tomato-09);
  --admonition-element-bg: var(--rx-tomato-07);
}
`
