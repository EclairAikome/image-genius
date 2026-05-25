# Generate Mode — Full Pipeline

## Pre-flight Checks
Before generating, verify:
1. `.env` file exists with `OPENAI_API_KEY` set
2. `config/brand.yml` is readable
3. `node_modules/` exists (if not, run `npm install` first)

## Content Type Detection

Classify user input using these signals:

| Type | Signals |
|---|---|
| **food** | Mentions dishes, ingredients, cooking, recipes, restaurants, kitchen, dining, meals, cuisines, beverages |
| **lifestyle** | Mentions people activities, fashion, travel, fitness, home decor, daily life, wellness |
| **product** | Mentions specific products, merchandise, packaging, electronics, tools, equipment |

Priority: if the description mentions food items even alongside other themes, classify as **food**.

## Prompt Generation Process

1. Parse the user's description — extract:
   - Main subject (what is the focal point?)
   - Desired mood/feeling (if mentioned)
   - Specific elements (if mentioned)
   - Color preferences (if mentioned, otherwise use brand defaults)

2. Load the appropriate template from `templates/`

3. Fill each template section, following these principles:
   - **Be specific**: "a bowl of steaming tonkotsu ramen with chashu pork, soft-boiled egg, nori, and chopped scallions" NOT "a bowl of ramen"
   - **Be visual**: describe what the camera sees, not what you feel
   - **Be consistent**: use the same photography style anchor across all prompts
   - **Respect brand**: incorporate brand colors and recurring elements from config

4. Validate the completed prompt:
   - Length between 150-300 words? ✓
   - All template sections filled? ✓
   - No text/logo/watermark in positive prompt? ✓
   - Negative prompt included? ✓
   - English language? ✓

## Image Generation

Execute:
```bash
node scripts/generate-image.mjs --prompt-file drafts/last-prompt.json
```

The script will:
1. Read the prompt from the JSON file
2. Read model settings from `config/brand.yml`
3. Call OpenAI Images API
4. Save the result to `output/` with proper naming
5. Print the output path to stdout

## Logo Overlay

If `assets/logo.png` exists, execute:
```bash
node scripts/add-logo.mjs --input <image-path>
```

The script reads logo position/size from `config/brand.yml` and composites the logo onto the image.

## Post-Generation

After successful generation, show the user:
1. The complete prompt that was used (in a code block)
2. Path to the generated image (without logo)
3. Path to the final image (with logo, if applicable)
4. Offer: "Say `regenerate` for a completely fresh take, or describe a new image."
