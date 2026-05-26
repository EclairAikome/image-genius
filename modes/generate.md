# Generate Mode — Full Pipeline

## Pre-flight Checks
Before generating, verify:
1. `.env` file exists with `OPENAI_API_KEY` set
2. `config/brand.yml` is readable
3. `node_modules/` exists (if not, run `npm install` first)

The canonical step-by-step is in `.claude/skills/instagram-ops/SKILL.md`. This file documents
the prompt-engineering side of the pipeline.

## Pipeline Overview (one-shot, no post-processing)

```
user input
  → channel detect
  → SKU identify
  → product references located (HARD GATE — halt if missing)
  → logo file + placement description planned
  → template loaded
  → prompt drafted (with embedded logo instruction)
  → references list = [product photo, ..., logo file]
  → openai.images.edit returns the final image
```

There is no separate logo-overlay step. The model receives product photo(s) + the logo file as
reference images, and the prompt tells it where to put the logo and what colour to use.

## Channel & SKU Identification (precondition)
Done in SKILL.md Steps 1-2. By the time you reach prompt generation you must know:
- which channel
- which SKU (with the SKU's product-picture folder path and logo-references list)

## Product Reference Verification (hard gate)
Done in SKILL.md Step 3. The product picture folder must contain at least one usable image.
If empty, HALT and ask the user. Do not proceed to prompt generation.

## Logo Placement Planning
Done in SKILL.md Step 4. Output is a one-sentence English placement description that will be
embedded in the prompt.

- **dryfoods / frozen:** read the SKU's `logo_references` images (under `assets/Logo_Position_Size_Reference/`)
  with the Read tool, then describe the corner, approximate width-percentage, and any tagline behaviour.
- **aminovital:** standard top-left placement, ~15% canvas width, with the auto-recolour rule
  (white on dark backgrounds, navy on light).

## Content Type Detection

| Type | Signals |
|---|---|
| **food** | Mentions dishes, ingredients, cooking, recipes, restaurants, kitchen, dining, meals, cuisines, beverages |
| **lifestyle** | Mentions people activities, fashion, travel, fitness, home decor, daily life, wellness |
| **product** | Mentions specific products, merchandise, packaging, electronics, tools, equipment |

Priority: if the description mentions food items even alongside other themes, classify as **food**.

## Prompt Generation Process

1. Parse the user's description — extract main subject, mood, specific elements, colour preferences.

2. Load the appropriate template from `templates/`.

3. Fill each template section, following these principles:
   - **Be specific**: "a bowl of steaming tonkotsu ramen with chashu pork, soft-boiled egg, nori, and chopped scallions" NOT "a bowl of ramen"
   - **Be visual**: describe what the camera sees, not what you feel
   - **Be consistent**: use the same photography style anchor across all prompts
   - **Respect brand**: incorporate brand colours and recurring elements from config
   - **Name the SKU**: identify the actual product (e.g., "AJINOMOTO HON-DASHI bottle", "AminoVITAL GOLD sachet") and instruct the model to preserve its packaging exactly as shown in the FIRST reference image

4. **Append the logo section** before the negative prompt:
   > "Render the brand logo from the second reference image at <placement description>.
   > Preserve the logo's exact glyph shapes; <colour rule>; do not distort, skew, or add extra elements."

5. Validate the completed prompt:
   - Length 150-300 words (slightly over OK for designs with overlay text)? ✓
   - All template sections filled? ✓
   - Logo section present and references the correct reference-image index? ✓
   - Negative prompt included? ✓
   - English language? ✓
   - Mentions preserving product appearance from reference? ✓
   - If overlay text is part of the design: text strings included; "text/letters/words/numbers" removed from negative prompt for this run? ✓

## Image Generation

Always one call, with both product photo and logo as references:
```bash
node scripts/generate-image.mjs --prompt-file drafts/last-prompt.json
```

The script reads the prompt + reference list from the JSON file, calls `openai.images.edit`,
and writes the final image to `output/`. No further processing.

## Post-Generation

After successful generation, show the user:
1. Channel + SKU
2. The complete prompt that was used (in a code block)
3. Reference images that were attached, in order (last entry = logo)
4. Logo placement description that was embedded in the prompt
5. Final image path
6. Offer: "Say `regenerate` for a completely fresh take, or describe a new image. If the logo placement looks wrong, say `add-logo <path>` for a manual sharp overlay."
