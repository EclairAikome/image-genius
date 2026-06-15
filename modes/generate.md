# Generate Mode — Full Pipeline

## Pre-flight Checks
Before generating, verify:
1. `config/user-prefs.json` has `initialized: true` — if not, run init flow first
2. `.env` file exists with `OPENAI_API_KEY` (required for API mode, optional for manual mode)
3. `config/brand.yml` is readable
4. `node_modules/` exists (if not, run `npm install` first)

## Content Type Detection

Classify user input using these signals:

| Type | Signals |
|---|---|
| **food** | Dishes, ingredients, cooking, recipes, restaurants, kitchen, dining, meals, cuisines, beverages |
| **lifestyle** | Activities, fitness, travel, home decor, daily life, wellness, outdoor, gym |
| **product** | Specific products, packaging, merchandise, hero shots, product-only frames |

Priority: if the description mentions food items even alongside other themes, classify as **food** (for dryfoods/frozen channels).

## Prompt Generation Process

1. **Parse** the user's description — extract:
   - Main subject (focal point)
   - Desired mood/feeling (if mentioned)
   - Specific elements requested
   - Color preferences (if mentioned, otherwise use brand config)

2. **Load** the appropriate template from `templates/`

3. **Write the prompt** following the template's 7-block order (see `modes/_shared.md`):
   - **Open with intent** — "Create a … photograph of …", never "Professional commercial …".
   - **Preserve, don't re-describe** — the product photo is reference #1; state
     "preserve packaging exactly as in reference #1" instead of cataloguing the label.
   - **Be precise only where it matters** — hex for brand/accent colors and the
     logo; one light direction; subject placement + negative space.
   - **Respect brand** — pull colors and mood from config.
   - **Stay lean** — target 120–250 words, hard cap ~300. Cut any clause that
     doesn't change the output. Do not pad to a word count.

4. **Validate** the completed prompt:
   - Word count in 120–250 (≤ 300)? ✓
   - Opens with intent, not praise/"professional"? ✓
   - No magic words (4K, ultra-detailed, masterpiece, 300 DPI, "no AI tells")? ✓
   - Packaging handled by "preserve reference #1", not re-described? ✓
   - Hex codes for brand/accent colors and logo only? ✓
   - One light direction + one color temperature? ✓
   - Logo placement stated numerically (corner, % width, padding, color rule)? ✓
   - Any on-image text quoted exactly (AminoVITAL: HSA-compliant)? ✓
   - Short, real-only negative clause? ✓
   - English language? ✓

## Image Generation

### API Mode
```bash
node scripts/generate-image.mjs --prompt-file drafts/last-prompt.json
```

### Free-quota Mode
```bash
node scripts/generate-image.mjs --prompt-file drafts/last-prompt.json --mode free-quota
```

### Manual Mode
```bash
node scripts/generate-image.mjs --prompt-file drafts/last-prompt.json --mode manual
```
Displays prompt and copies to clipboard. User generates in ChatGPT Plus.

## Visual Self-Verification — before presenting

Open the saved image and judge it against the brief (packaging intact → logo
placement → HSA compliance → quoted text → composition). If a check fails, change
ONE dimension and regenerate or edit. See `modes/_shared.md`.

## Refinement (refine command) — edit endpoint, change ONLY X / preserve Y

When the user wants a targeted change to an image you already have, edit the
existing image directly instead of regenerating from scratch:

```bash
node scripts/generate-image.mjs --edit-image <image-path> \
  --prompt "Edit the input image: change ONLY <X>. Preserve exactly: composition, the product and its packaging text, logo position/size/color, lighting, background, color grade. Do not alter anything else."
```

`reverse-prompt.mjs` remains available as a fallback for reproducing an image you
did NOT generate here (no original prompt on hand).

## Post-Generation

After successful generation, show:
1. The complete prompt (code block)
2. Prompt stats: word count, character count
3. Path to generated image
4. Your visual-verification result (one line: what you checked, pass/fail)
5. Available next steps:
   - `refine <path>` — targeted edit via the edit endpoint
   - `regenerate` — fresh take from the same description
   - Describe a new image
