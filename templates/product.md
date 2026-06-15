# Product Content — Prompt Template (gpt-image-2)

Build ONE flowing English prompt of **120–250 words** following the block order
below. The blocks are your reasoning scaffold — do NOT print headings or labels
into the prompt. Open with intent, not praise. The real product photo is passed
to the API as reference #1, so **preserve it — don't re-describe it**.

> Read `modes/_shared.md` first. Hex codes only for brand/accent colors and the
> logo. No magic words. One light direction. One style anchor.

---

### 1 · Intent (opening clause)
Open by naming what the image is FOR, e.g.:
- `Create a premium product hero photograph for an Instagram post of …`
- `Create a clean e-commerce product shot of …`

Name the product with its full proper SKU name.

### 2 · Scene & background (1–2 sentences)
Where the product sits and what's behind it. Pick a clean, non-competing setting:
- Surface: one material + one color (with hex if brand-relevant), e.g.
  `on a clean matte dark surface` / `on pale travertine #E8E2D5`.
- Background: `smooth gradient from <brand color hex> to <near-black/white>`, or
  a softly blurred contextual backdrop. Keep it simple.

### 3 · Subject = preserve the reference (1 line, do NOT describe the label)
> "Place the <SKU name> from reference image #1 standing upright, centered,
> tilted ~5° to show dimension, occupying ~55% of frame height. Preserve the
> packaging exactly as in reference #1 — every character, glyph, color and
> layout; do not alter, add, or remove any label content."

### 4 · Key details (composition + lighting + 1–3 props)
- **Composition:** subject placement + where the negative space goes
  (e.g. `centered with generous negative space top and bottom`).
- **Lighting:** ONE key direction + ONE color temperature + optional thin rim,
  e.g. `soft key light from upper-left at 5200K; thin rim light separating the
  product from the background; soft contact shadow beneath`.
- **Props (optional, max 1–3):** name, position, brief look. Keep them smaller
  than the hero. Skip if a clean hero shot is wanted.

### 5 · Text
Usually `none` for a pure product shot. If overlay text is requested, quote it
exactly and give position + relative size. (AminoVITAL: text must be HSA-compliant.)

### 6 · Style anchor (1 short clause)
One reference or medium + 2-3 adjectives, e.g.
`clean modern commercial still-life, confident and premium`. Add brand accents:
`color accents in <brand hex> and <brand hex>`.

### 7 · Constraints (one sentence)
Only real exclusions, e.g.:
> "No text other than what is on the packaging; no extra logos or watermarks;
> no human hands or faces; no busy background."

---

### Logo (when the channel uses one — insert before constraints)
> "Place the brand logo from reference image #2 in the <corner>, ~<N>% of canvas
> width, ~<N>% padding from the edges; <color rule>; preserve its glyph shapes,
> do not distort or skew."

Take the corner / size / padding from the channel's logo plan (see SKILL.md
Step 4). State it numerically — don't say only "top-right".

---

### Worked example (~160 words)
> *Create a premium product hero photograph for an Instagram post of AminoVITAL
> GOLD. Place the GOLD sachet from reference image #1 standing upright, centered,
> tilted ~5° to the right, occupying ~55% of frame height, on a clean matte dark
> surface. Preserve the packaging exactly as in reference #1 — every character,
> glyph, color and layout; do not alter, add, or remove any label content.
> Background: smooth gradient from navy #071D49 at the bottom to near-black at the
> top, with generous negative space above and below the product. A single torn
> gold sachet rests at lower-right, spilling a little fine white powder. Lighting:
> soft key from the upper-left at 5200K, a thin rim light separating the product
> from the background, and a soft contact shadow beneath. Place the brand logo
> from reference image #2 in the top-left, ~15% of canvas width, ~3% padding,
> rendered white on this dark background; preserve its glyph shapes, do not
> distort. Style: clean premium sports-nutrition still-life; color accents in navy
> #071D49 and metallic gold #D4A84E. No text other than what is on the packaging
> and logo; no hands or faces; no extra logos.*
