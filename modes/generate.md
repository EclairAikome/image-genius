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

3. **Fill EVERY section** following these principles:
   - **Be hyper-specific**: measurable, countable, hex-coded
   - **Leave nothing to interpretation**: if you don't specify it, the model randomizes it
   - **Respect brand**: incorporate channel colors and mood from config
   - **Hit word count**: minimum 600 words, target 800-1000

4. **Validate** the completed prompt:
   - Word count ≥ 600? ✓
   - All template sections filled? ✓
   - Hex codes for all mentioned colors? ✓
   - Camera specs complete (lens, aperture, DOF)? ✓
   - Lighting rig fully described? ✓
   - Spatial layout with grid coordinates? ✓
   - Negative prompt included? ✓
   - English language? ✓

## Image Generation

### API Mode
```bash
node scripts/generate-image.mjs --prompt-file drafts/last-prompt.json
```

### Manual Mode
```bash
node scripts/generate-image.mjs --prompt-file drafts/last-prompt.json --mode manual
```
Displays prompt and copies to clipboard. User generates in ChatGPT Plus.

## Refinement (refine command)

When the user wants to make targeted changes to a generated image:

```bash
node scripts/reverse-prompt.mjs --input <image-path>
```

This produces a detailed reversed prompt. The user edits it, then:

```bash
node scripts/generate-image.mjs --prompt-file drafts/reverse-<timestamp>.json
```

## Post-Generation

After successful generation, show:
1. The complete prompt (code block)
2. Prompt stats: word count, character count
3. Path to generated image
4. Available next steps:
   - `regenerate` — fresh generation from same description
   - `refine <path>` — reverse-prompt for targeted edits
   - Describe a new image
