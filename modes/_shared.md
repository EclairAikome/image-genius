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

These rules target **gpt-image-2** (the April 2026 model). It follows long,
*instructional* prompts faithfully, renders text correctly, and edits existing
images precisely. It does NOT reward the old "magic word" style. Write prompts
like a tight art-direction brief, not an incantation.

### Structure — the canonical order

Every generated prompt follows this block order. The blocks are for *your*
reasoning — the final prompt is one flowing paragraph, not a labelled list:

```
Intent / use case  →  Scene / background  →  Subject  →
  Key details  →  Text (exact, quoted)  →  Style anchor  →  Constraints
```

Open with **intent** (what the image is FOR), not a subject and not praise.
The opening words select the model's mode:

- ✅ `Create a premium product hero photograph of …`
- ✅ `Create a warm editorial food shot of …`
- ❌ `Professional commercial product photography, ultra-detailed, …`

### Prompt length — CRITICAL (signal density beats word count)

- **Target: 120–250 words.** Hard cap ~300.
- gpt-image-2 follows instructions reliably inside this band. Past ~300 words
  the load-bearing instructions (packaging fidelity, logo placement, compliant
  text) get diluted by filler and the model starts to "forget" them.
- The goal is **high signal density**, not length. Every clause must do concrete
  instructional work. If a clause doesn't change the output, delete it.
- Do NOT pad to hit a word count. A clean product shot may only need ~140 words.

### Stability through *specificity where it matters* — not through volume

Be precise on the few dimensions that are brand-critical or that you genuinely
care about. Do NOT specify every conceivable dimension — over-specification is
noise that crowds out the instructions that matter.

Spend precision on:
1. **Brand colors** — hex codes for the brand palette and any required accent
   colors (e.g. navy `#071D49`, gold `#D4A84E`). Skip hex for incidental props.
2. **Logo placement** — corner, size as % of canvas width, padding, color rule.
3. **On-image text** — quote the exact string; for any non-English text, name
   the script/font flavor and add "no extra characters".
4. **Composition** — subject placement and how much negative space, where.
5. **One light direction + one color temperature.** Two sources max. Don't
   describe a five-light studio rig — it reads as noise.

Use plain photographic / spec language ("soft key light from upper-left, 5200K",
"50mm, f/2.8") instead of praise language ("beautiful", "premium", "professional").

### Reference images carry the detail — don't re-describe them

The pipeline passes the real product photo (and logo) to the image API. The
model SEES them. **Do not re-describe the packaging in prose** — that fights the
reference and causes drift. Instead, in one line:

> "Preserve the product packaging exactly as in reference image #1 — every
> character, glyph, color and layout. Do not alter, add, or remove label content."

### Style anchor — one, not five

Name a single reference (an editorial style, a film, a photographer, a movement)
or give medium + era + 2-3 concrete adjectives. Do NOT stack styles.

### Language Rules
- User input: any language (Chinese, English, Malay, etc.)
- Generated prompts: ALWAYS in English
- Translate food/cultural terms to the most specific English name + regional name
  (e.g., "Japanese Hakata-style tonkotsu ramen" not "noodle soup")

### Negative prompt — only real, wanted exclusions

State only what you actually need kept out. Keep it short (one sentence):

- `no text other than what is on the packaging / logo` (or `no text` if none wanted)
- `no human hands, fingers, or faces`
- `no extra logos or watermarks`
- `no busy or cluttered background`

Do NOT add pre-gpt-image-2 noise. These are ignored or harmful and waste budget:
- ~~no AI artifacts, no AI generation tells, no melted details~~
- ~~no impossible reflections, no warped geometry, lowres, bad anatomy~~

### Drop these entirely (magic words — useless or harmful on gpt-image-2)
`4K`, `8K`, `ultra detailed`, `ultra-high resolution`, `masterpiece`,
`trending on artstation`, `award-winning`, `professional color grading`,
`300 DPI`, `commercial advertising quality`, `no AI generation tells`.
Use the `quality` API parameter for fidelity, not adjectives in the prompt.

### Output Specifications
- File naming: `{YYYY-MM-DD}-{channel}-{slug}-{index}.{format}`
- Save to `config/brand.yml → defaults.output.directory`

## Image Generation Modes

### API Mode
- Calls OpenAI API directly for image generation
- Requires `OPENAI_API_KEY` in `.env`
- Automated end-to-end pipeline

### Free-quota Mode (Codex / ChatGPT subscription)
- Delegates image generation to the Codex CLI's built-in `image_gen` tool
- Uses your ChatGPT Plus/Pro subscription — $0 per image

### Manual Mode (ChatGPT Plus)
- Generates the full prompt and copies to clipboard
- User pastes into ChatGPT to generate using Plus subscription (free)
- User saves the generated image to `output/` folder
- Pipeline continues from there

## Visual Self-Verification — MANDATORY before showing the user

After every generation, **open the saved image and judge it against the brief**
before reporting success. Check, in order:

1. **Packaging** — is every character/color on the label intact and undistorted?
2. **Logo** — right corner, right size, right color, not skewed?
3. **Compliance** (AminoVITAL only) — is any on-image text an HSA-prohibited claim?
4. **Text** — does each quoted string render exactly, with no extra characters?
5. **Composition** — subject placement and negative space as specified?

If any check fails, **change ONE dimension** and regenerate (or edit). Never ship
an unseen result and ask the user "does this look right?".

## Refinement Workflow — use the edit endpoint (change ONLY X / preserve Y)

gpt-image-2's edit endpoint does precise local changes. To tweak one thing on an
image you already like:

1. **Edit the existing image directly** — pass it to the edit endpoint with a
   short prompt:
   > "Edit the input image: change ONLY <X>. Preserve exactly: composition,
   > the product and all its packaging text, logo position/size/color, lighting,
   > background, and color grade. Do not alter anything else."
2. This operates on the actual pixels, so everything you didn't name stays put.
3. Keep the change description to one or two clauses — don't re-describe the image.

Use `reverse-prompt` ONLY as a fallback for reproducing an image you did NOT
generate here (no original prompt on hand).

## Guardrails
- KEEP prompts in the 120–250 word band — add detail only where it changes the
  output; cut filler aggressively.
- Prefer the **edit endpoint** for "change one thing"; regenerate from scratch
  only when the user wants a genuinely different take.
- NEVER hardcode brand colors in templates — always read from config.
- ALWAYS visually verify the result before presenting it.
- When in doubt about content type or channel, ASK the user.
