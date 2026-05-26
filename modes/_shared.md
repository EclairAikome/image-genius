# Shared Context — Instagram Ops

## Sources of Truth (precedence order)
1. `config/brand.yml` — brand identity, channels, SKU catalog, asset paths
2. `config/user-prefs.json` — user's model and mode preferences
3. `templates/*.md` — prompt structure templates per content type
4. `drafts/last-prompt.json` — most recent generation state

## Initialization

On first invocation, check `config/user-prefs.json`:
- If `initialized` is false → run initialization flow (see SKILL.md)
- If `initialized` is true → proceed with saved preferences

## Prompt Engineering Rules

### Consistency Enforcement
Every generated prompt MUST follow the template's section order exactly. Templates now have 12-13 sections to maximize reproducibility.

### Prompt Length — CRITICAL
- **Minimum**: 600 words
- **Target**: 800-1000 words
- **Maximum**: 1200 words
- gpt-image-2 produces significantly more stable, consistent results with longer, highly specific prompts
- Short prompts (<300 words) leave too many details to the model's random interpretation
- Every ambiguity in the prompt = a dimension of randomness in the output

### Stability Through Specificity
The #1 principle for stable outputs: **leave nothing to chance**. Every aspect of the image must be explicitly described:

1. **Colors** — Always include hex codes: "warm amber (#FFB74D)" not just "warm amber"
2. **Positions** — Use grid coordinates: "at the upper-right third intersection" not just "on the right"
3. **Sizes** — Use frame percentages: "occupying 55% of frame height" not just "large"
4. **Lighting angles** — Use clock positions: "key light from 10 o'clock" not just "from the left"
5. **Distances** — Use relative measures: "background at approximately 2m distance" not just "far background"
6. **Textures** — Name the finish: "satin matte with micro-grain" not just "smooth"
7. **Quantities** — Be exact: "three slices" not "some slices"
8. **Blur** — Specify bokeh: "smooth circular bokeh at f/2.8" not just "blurred"

### Language Rules
- User input: any language (Chinese, English, Malay, etc.)
- Generated prompts: ALWAYS in English
- Translate food/cultural terms to the most specific English name + regional name
  (e.g., "Japanese Hakata-style tonkotsu ramen" not "noodle soup")

### Quality Anchors (always present in every prompt)
These phrases MUST appear in every prompt's technical section:
- "ultra-high resolution"
- "tack-sharp focus on the primary subject"
- "professional color grading"
- "no visual artifacts, no AI generation tells"

### Universal Negative Prompt (always appended)
- text, typography, letters, words, numbers (UNLESS overlay text is specifically requested)
- watermarks, logos, brand marks, signatures (UNLESS the brand logo is explicitly part of the prompt)
- blurry areas on the main subject
- distorted geometry, warped text on packaging
- AI artifacts, melted details, impossible reflections

### Output Specifications
- File naming: `{YYYY-MM-DD}-{channel}-{slug}-{index}.{format}`
- Save to `config/brand.yml → defaults.output.directory`

## Image Generation Modes

### API Mode
- Calls OpenAI API directly for image generation
- Requires `OPENAI_API_KEY` in `.env`
- Automated end-to-end pipeline

### Manual Mode (ChatGPT Plus)
- Generates the full prompt and copies to clipboard
- User pastes into ChatGPT to generate using Plus subscription (free)
- User saves the generated image to `output/` folder
- Pipeline continues from there (logo overlay, etc.)

## Refinement Workflow

When the user wants to refine a generated image:
1. **Do NOT edit the existing image** — always regenerate from scratch
2. **Use reverse-prompt** to extract a detailed reproduction prompt from the satisfactory image
3. User makes targeted edits to the reversed prompt
4. Regenerate with the modified prompt → result will be much closer to the original

## Guardrails
- NEVER generate with prompts shorter than 400 words — add detail until minimum is met
- NEVER reuse a previous prompt verbatim for regeneration — always create fresh
- NEVER edit/modify a generated image — always regenerate from scratch
- NEVER hardcode brand colors in templates — always read from config
- When in doubt about content type or channel, ASK the user
