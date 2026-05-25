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

## Guardrails
- NEVER include readable text in image prompts — image models render text poorly
- NEVER reuse a previous prompt for regeneration — always create fresh
- NEVER edit/modify a generated image — always regenerate from scratch if unsatisfied
- NEVER hardcode brand colors in templates — always read from config
- When in doubt about content type, ASK the user rather than guessing
