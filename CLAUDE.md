# Instagram Ops

AI-powered Instagram content creation workflow built as a Claude Code skill.

## Architecture

```
instagram-ops/
├── .claude/skills/instagram-ops/
│   └── SKILL.md              ← Skill entry point (router)
├── config/
│   └── brand.yml             ← Brand identity, colors, logo config
├── modes/
│   ├── _shared.md            ← Shared rules for all modes
│   └── generate.md           ← Full generation pipeline
├── templates/
│   ├── food.md               ← Food photography prompt template
│   ├── lifestyle.md          ← Lifestyle photography prompt template
│   └── product.md            ← Product photography prompt template
├── scripts/
│   ├── generate-image.mjs    ← OpenAI API image generation
│   ├── add-logo.mjs          ← Logo overlay via sharp
│   └── doctor.mjs            ← Environment health check
├── assets/
│   └── logo.png              ← Company logo (user-provided)
├── output/                   ← Generated images (gitignored)
├── drafts/                   ← Prompt drafts (gitignored)
└── .env                      ← API keys (gitignored)
```

## Workflow

1. User describes desired image in any language
2. Skill classifies content type (food / lifestyle / product)
3. Loads matching template → generates structured English prompt
4. Calls OpenAI image generation API via `scripts/generate-image.mjs`
5. Overlays logo via `scripts/add-logo.mjs` (if logo exists)
6. Returns final image path

## Key Design Decisions

- **Templates enforce consistency**: every prompt follows the same 10-section structure regardless of content type
- **Fresh regeneration only**: never edit a generated image; always regenerate from scratch to avoid quality degradation
- **English prompts**: image models perform best with English prompts; user input is translated automatically
- **Prompt length**: always 150-300 words for optimal results
- **Logo overlay is programmatic**: uses sharp for pixel-perfect, repeatable logo placement

## Setup

1. `npm install`
2. Copy `.env.example` to `.env`, add your `OPENAI_API_KEY`
3. Edit `config/brand.yml` with your brand settings
4. Place company logo at `assets/logo.png`
5. Run `node scripts/doctor.mjs` to verify setup

## Usage (via Claude Code skill)

```
/instagram-ops 一碗热腾腾的日式拉面
/instagram-ops A refreshing summer salad
/instagram-ops regenerate
/instagram-ops add-logo output/2025-01-01-ramen-01.png
/instagram-ops prompt-only 精致的抹茶甜点摆盘
```
