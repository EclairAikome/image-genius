# Shared Context — Instagram Ops

## Sources of Truth (precedence order)
1. `config/brand.yml` — brand identity, colors, style, logo config
2. `templates/*.md` — prompt structure templates per content type
3. `drafts/last-prompt.json` — most recent generation state

## Prompt Engineering Rules

### Consistency Enforcement
Every generated prompt MUST follow this master structure, regardless of content type:

```
[Shot Type & Photography Style]. [Main Subject with specific details]. [Setting/Background description]. [Composition & framing]. [Lighting setup]. [Color palette & tones]. [Supporting elements & props]. [Atmosphere & mood]. [Technical specifications].

Do not include: [negative prompt items].
```

### Language Rules
- User input: any language (Chinese, English, etc.)
- Generated prompts: ALWAYS in English
- When translating food/cultural terms, use the most widely recognized English name,
  followed by the specific regional name if it adds clarity
  (e.g., "Japanese tonkotsu ramen" not just "noodle soup")

### Quality Anchors (always included in every prompt)
These phrases are prepended or woven into every prompt to ensure baseline quality:
- "professional commercial photography"
- "high resolution, sharp focus"
- "studio-quality lighting"

### Universal Negative Prompt
Always append these to every prompt's negative section:
- text, typography, letters, words, numbers
- watermarks, logos, brand marks, signatures
- blurry, low quality, pixelated, grainy
- distorted proportions, unnatural colors
- AI artifacts, obvious AI generation tells

### Output Specifications
- File naming: `{YYYY-MM-DD}-{slug}-{index}.{format}`
  - slug: 2-3 word kebab-case derived from description
  - index: auto-incrementing if multiple generations same day
  - format: from `config/brand.yml` output.format
- Always save to the directory specified in `config/brand.yml` output.directory

## Product Reference Pictures (HARD REQUIREMENT)
- Every image generation MUST attach the official product photo(s) as reference via `--reference-image`.
  Otherwise GPT renders product labels / packaging text with severe distortion.
- Product photos live under `<channels.<channel>.product_pictures_dir>/<sku.dir>/`.
  Usable extensions: `.jpg`, `.jpeg`, `.png`, `.webp`. Ignore `Thumbs.db`.
- If the SKU's folder is missing or empty → **HALT** and prompt the user to provide a product photo.
  Do NOT generate without references.
- Prefer 1-3 clean photos: transparent-bg or white-bg product shots beat busy lifestyle shots as references.

## Logo Rules (one-shot generation, no post-processing)
- Every generated image bakes the logo IN during model inference. The logo file is passed as a
  reference image to `openai.images.edit` and the prompt describes placement/colour. We do NOT
  run `add-logo.mjs` in the default pipeline — the model handles compositing, scaling, and
  recolouring better than a deterministic overlay can.
- **dryfoods / frozen** → Ajinomoto logo (single global JPG at `config.assets.ajinomoto_logo`)
  is REQUIRED. Position/size vary per SKU. At draft time, inspect the SKU's
  `logo_references` images in `assets/Logo_Position_Size_Reference/` and translate the past-post
  layout into a plain-English placement description embedded in the prompt
  (e.g., "top-right corner, ~15% of canvas width, tagline 'Eat Well, Live Well.' arranged above
  the Aj mark"). Do NOT pass the position-reference image itself to the API — only the global
  logo file — to avoid the model copying food / recipe-step elements from the reference.
- **aminovital** → AV logo (`config.assets.aminovital_logo.dark`) only. Place top-left, ~15% of
  canvas width. In the prompt, instruct the model to render white on dark backgrounds, navy on
  light backgrounds — model auto-selects based on the generated scene's tone. No Ajinomoto logo
  on AV posts.
- Never put both logos on the same image.
- The reference-image array order matters: product photo(s) first, logo file LAST. The prompt
  refers to "the second/last reference image" for logo placement.

## Manual Logo Overlay (fallback only)
- `add-logo.mjs` + `add-logo <path>` mode still exist for the case where the model output's logo
  is wrong and the user wants a deterministic sharp composite onto an existing image. Not part
  of the default pipeline.

## Guardrails
- NEVER include readable text in image prompts — image models render text poorly
- NEVER reuse a previous prompt for regeneration — always create fresh
- NEVER edit/modify a generated image — always regenerate from scratch if unsatisfied
- NEVER hardcode brand colors in templates — always read from config
- NEVER skip the product-reference step — the generated image will look broken without it
- When in doubt about channel, SKU, or content type, ASK the user rather than guessing
