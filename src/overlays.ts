/**
 * Non-native callout tags (v2, — rich overlay).
 * These names have no native Logseq admonition. We wrap them into a semantically-close native host (see callouts.ts HOST_KEYWORD_MAP) with a visible `**Label**` marker, then override — per block — the CSS variables that styles.ts exposes on `.admonitionblock`, giving each tag its own color + icon.
 * Pure module — no Logseq runtime, so it stays unit-testable. 
 * Glyphs are Tabler icon code points (the icon font Logseq bundles); the choices mirror the conventional callout icons.
 */

export interface NonNativeDef {
  /** Badge text shown at the top of the box, e.g. "FAQ". Also the re-detect marker. */
  label: string
  color: ColorGroup
  glyph: string
}

export type ColorGroup =
  | 'blue'
  | 'green'
  | 'teal'
  | 'orange'

/**
 * Color groups mapped to Logseq's Radix color tokens.
 * Each group defines CSS values using the --rx-* scale (01–12).
 */
export interface ColorTokens {
  bg: string
  border: string
  text: string
  textDark: string
  badge: string
}

export const COLOR_GROUPS: Record<ColorGroup, ColorTokens> = {
  blue: {
    bg: 'var(--rx-blue-04-alpha, rgba(96, 165, 250, 0.15))',
    border: 'var(--rx-blue-06, #2563eb)',
    text: 'var(--rx-blue-11, #1d4ed8)',
    textDark: 'var(--rx-blue-09, #60a5fa)',
    badge: 'var(--rx-blue-05-alpha, rgba(96, 165, 250, 0.25))',
  },
  green: {
    bg: 'var(--rx-green-04-alpha, rgba(74, 222, 128, 0.15))',
    border: 'var(--rx-green-06, #16a34a)',
    text: 'var(--rx-green-11, #15803d)',
    textDark: 'var(--rx-green-09, #4ade80)',
    badge: 'var(--rx-green-05-alpha, rgba(74, 222, 128, 0.25))',
  },
  teal: {
    bg: 'var(--rx-teal-04-alpha, rgba(45, 212, 191, 0.15))',
    border: 'var(--rx-teal-06, #0d9488)',
    text: 'var(--rx-teal-11, #0f766e)',
    textDark: 'var(--rx-teal-09, #2dd4bf)',
    badge: 'var(--rx-teal-05-alpha, rgba(45, 212, 191, 0.25))',
  },
  orange: {
    bg: 'var(--rx-orange-04-alpha, rgba(251, 146, 60, 0.15))',
    border: 'var(--rx-orange-06, #ea580c)',
    text: 'var(--rx-orange-11, #c2410c)',
    textDark: 'var(--rx-orange-09, #fb923c)',
    badge: 'var(--rx-orange-05-alpha, rgba(251, 146, 60, 0.25))',
  },
}

export const NON_NATIVE: Record<string, NonNativeDef> = {
  faq:       { label: 'FAQ',       color: 'blue', glyph: 'f89c' }, // bolt 
  danger:    { label: 'Danger',    color: 'orange', glyph: 'ecc6' }, // alert-octagon
  attention: { label: 'Attention', color: 'green', glyph: 'ed07' }, // bell-ringing
  src:       { label: 'Src',       color: 'teal', glyph: 'ebb2' }, // terminal
}

export function isNonNative(name: string): boolean {
  return name.trim().toLowerCase() in NON_NATIVE
}

/**
 * Reverse-detect a non-native tag from its `**Label**` marker in raw content.
 * Used to rebuild overlays after a reload (the tag itself is gone post-wrap).
 */
export function detectLabelTag(raw: string): string | null {
  for (const [tag, def] of Object.entries(NON_NATIVE)) {
    if (raw.includes(`**${def.label}**`)) return tag
  }
  return null
}

/**
 * Per-block CSS overriding the native admonition's variables + icon for every
 * decorated (uuid -> non-native tag) block. Regenerated on each scan. Colors
 * come from the tag's COLOR_GROUPS tokens (Radix --rx-* scale, light/dark aware).
 */
export function generateOverlayCSS(decorated: Map<string, string>): string {
  const rules: string[] = []

  for (const [uuid, tag] of decorated) {
    const def = NON_NATIVE[tag]
    if (!def) continue
    const c = COLOR_GROUPS[def.color]

    const adm = `.ls-block[blockid="${uuid}"] .admonitionblock`

    rules.push(`
${adm} {
  --admonition-bg: ${c.bg};
  --admonition-color: ${c.text};
  --admonition-accent-color: ${c.border};
  --admonition-element-bg: ${c.badge};
}
html.dark ${adm} {
  --admonition-color: ${c.textDark};
}
/* swap the native host icon for this tag's Tabler glyph */
${adm} > .admonition-icon > svg { display: none !important; }
${adm} > .admonition-icon::after {
  content: "\\${def.glyph}";
  font-family: "tabler-icons";
  font-size: 1.15em;
  color: var(--admonition-accent-color);
}
/* hide the host's native type label — this block's label is its **${def.label}** marker */
${adm} > .admonition-icon + div::before { content: none; }
/* style the **${def.label}** marker line as an accent mini-heading */
${adm} > .admonition-icon + div :where(strong):first-child {
  display: block;
  color: var(--admonition-accent-color);
  text-transform: uppercase;
  font-size: .72em;
  font-weight: 700;
  letter-spacing: .05em;
  margin-bottom: .25em;
}
`)
  }

  return rules.join('\n')
}
