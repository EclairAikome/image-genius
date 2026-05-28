# Instagram Ops

AI-powered Instagram content creation workflow built as a Claude Code skill for **Ajinomoto Singapore**.

> **MANDATORY — bound to the image-gen script:** Before running, editing, or
> reasoning about `scripts/generate-image.mjs` (any request to generate /
> regenerate / refine an Instagram / AminoVITAL / Ajinomoto image), you MUST first
> read and follow `scripts/SKILL.md` (the `image-gen-rules` skill). It is the
> source of truth for workflow, style, HSA compliance, and the codex/gpt-image
> pitfalls (auto-logo, gravity, picture-in-picture nesting, aspect-ratio/crop/stretch).
> Do not run the script without applying those rules.

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
│   ├── food.md               ← Food photography prompt template (13 sections, 600-1200 words)
│   ├── lifestyle.md          ← Lifestyle photography prompt template
│   └── product.md            ← Product photography prompt template
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
8. Generates a structured English prompt (600-1200 words) with hex codes, grid coordinates, lighting rigs, and material maps
9. **API mode**: Calls OpenAI `images.edit` with references → saves final image
   **Manual mode**: Copies prompt to clipboard → user generates in ChatGPT Plus (free)
10. Returns the path

## Refinement Workflow (reverse-prompt)

When the user wants to make targeted changes to a generated image:

1. `refine <image-path>` → analyzes the image with vision AI
2. Produces an 800-1200 word reproduction prompt describing every detail
3. User specifies what to change → skill makes surgical edits to the prompt
4. Regenerate → result is very close to original except for targeted changes

This solves the "regeneration drift" problem: instead of describing changes on top of a previous generation, we establish a ground-truth prompt from the actual image and make minimal edits.

## Key Design Decisions

- **One-shot generation, no post-processing**: the model handles logo compositing natively
- **Reference images are mandatory**: product packaging stays accurate
- **Ultra-detailed prompts (600-1200 words)**: longer prompts = more stable, reproducible results with gpt-image-2
- **Stability through specificity**: hex codes, clock positions, frame percentages, material maps — leaves nothing to random interpretation
- **Dual generation mode**: API (automated) or Manual (ChatGPT Plus subscription, free)
- **Reverse-prompt refinement**: surgical edits instead of full regeneration for targeted changes
- **Fresh regeneration only**: never edit a generated image; always regenerate
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
/instagram-ops refine output/2026-05-26-dryfoods-mayo-toast-01.png
/instagram-ops add-logo output/2026-05-26-dryfoods-mayo-toast-01.png
/instagram-ops prompt-only 精致的 HONDASHI 高汤摆盘
/instagram-ops init
```
