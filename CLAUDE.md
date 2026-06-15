# Instagram Ops

AI-powered Instagram content creation workflow built as a Claude Code skill for **Ajinomoto Singapore**.

## Architecture

```
instagram-ops/
├── .claude/skills/instagram-ops/
│   └── SKILL.md              ← Skill entry point (router + full pipeline)
├── config/
│   ├── brand.yml             ← Brand identity, channels, SKU catalog, logo paths
│   └── user-prefs.json       ← User preferences (model choice, generation mode)
├── modes/
│   ├── _shared.md            ← Cross-cutting rules (product refs, logo, guardrails)
│   └── generate.md           ← Prompt-engineering details
├── templates/
│   ├── food.md               ← Food photography template (7-block, 120-250 words)
│   ├── lifestyle.md          ← Lifestyle photography template (7-block)
│   └── product.md            ← Product photography template (7-block)
├── scripts/
│   ├── generate-image.mjs    ← OpenAI image generate / edit (supports reference images + manual mode)
│   ├── add-logo.mjs          ← Logo overlay via sharp (CLI x/y/width overrides)
│   ├── reverse-prompt.mjs    ← Reverse-engineer prompts from generated images
│   ├── init.mjs              ← Interactive initialization wizard
│   └── doctor.mjs            ← Environment health check
├── assets/
│   ├── Ajinomoto_Group_Global_Brand_logo.jpg       ← Used on dryfoods + frozen
│   ├── AV Logo/
│   │   └── AV LOGO.PNG                             ← Navy AV logo
│   ├── Dry Food/<SKU>/                             ← Product reference photos per dryfoods SKU
│   ├── Frozen Food/<SKU>/                          ← Product reference photos per frozen SKU (TBD)
│   ├── AV Product Picture/<SKU>/                   ← Product reference photos per aminovital SKU
│   └── Logo_Position_Size_Reference/               ← Past posts showing per-SKU logo placement
├── output/                   ← Generated images (gitignored)
├── drafts/                   ← Prompt drafts (gitignored)
└── .env                      ← API keys (gitignored)
```

## Workflow (one-shot generation)

1. User describes desired image in any language
2. Skill checks initialization status → runs setup wizard if first time
3. Detects channel (dryfoods / frozen / aminovital) from keywords
4. **Identifies the SKU** from the description (asks if ambiguous)
5. **Verifies the SKU's product reference photos exist** — HALTS and asks the user if missing
6. Plans logo placement:
   - **dryfoods / frozen** → reads the SKU's reference posts in `Logo_Position_Size_Reference/` and derives a plain-English placement description
   - **aminovital** → standard top-left, with auto-recolour rule (white on dark, navy on light)
7. Classifies content type (food / lifestyle / product) and loads matching template
8. Writes a lean, intent-first English prompt (120-250 words) — the product photo is passed as reference #1, so the prompt preserves it rather than re-describing the label
9. **API mode**: Calls OpenAI `images.edit` with references → saves final image
   **Manual mode**: Copies prompt to clipboard → user generates in ChatGPT Plus (free)
10. **Visually verifies** the saved image (packaging → logo → HSA compliance → text → composition); iterates one dimension if a check fails
11. Returns the path

## Refinement Workflow (edit endpoint)

When the user wants a targeted change to an image they already like:

1. `refine <image-path> "<what to change>"`
2. The skill edits the **actual image** via gpt-image-2's edit endpoint with a
   short "change ONLY X / preserve Y exactly" prompt
3. Everything not named (composition, packaging, logo, lighting) stays put

This avoids regeneration drift without an image→prose→image round-trip.
`reverse-prompt.mjs` remains as a fallback for reproducing an image not generated here.

## Key Design Decisions

- **One-shot generation, no post-processing**: the model handles logo compositing natively
- **Reference images are mandatory**: product packaging stays accurate — and the prompt preserves the reference instead of re-describing it
- **Lean, intent-first prompts (120-250 words)**: gpt-image-2 follows tight instructional prompts faithfully; over-long prompts dilute the load-bearing instructions. No magic words.
- **Specificity where it matters**: hex codes for brand/accent colors, numeric logo placement — not every incidental dimension
- **Visual self-verification**: the agent opens the result and checks it before presenting — never "here's an image, hope it's right"
- **Dual generation mode**: API (automated) or Manual (ChatGPT Plus subscription, free)
- **Edit-endpoint refinement**: surgical pixel-level edits for targeted changes
- **English prompts**: image models perform best with English prompts

## Setup

1. `npm install`
2. Copy `.env.example` to `.env`, add your `OPENAI_API_KEY`
3. Run `node scripts/init.mjs` to configure model and mode preferences
4. Confirm `config/brand.yml` channels & SKU catalog reflect your products
5. Run `node scripts/doctor.mjs` to verify setup

## Usage (via Claude Code skill)

```
/instagram-ops 一碗暖意十足的早餐,涂着 Kewpie 风格日式蛋黄酱的吐司
/instagram-ops AminoVITAL Gold sachet on a runner's bench post-workout
/instagram-ops Blendy iced latte in a sunny morning setting
/instagram-ops regenerate
/instagram-ops refine output/2026-05-26-dryfoods-mayo-toast-01.png "make the background warmer"
/instagram-ops add-logo output/2026-05-26-dryfoods-mayo-toast-01.png
/instagram-ops prompt-only 精致的 HONDASHI 高汤摆盘
/instagram-ops init
```
