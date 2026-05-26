# Instagram Ops

AI-powered Instagram content creation workflow built as a Claude Code skill for **Ajinomoto Singapore**.

## Architecture

```
instagram-ops/
├── .claude/skills/instagram-ops/
│   └── SKILL.md              ← Skill entry point (router + full pipeline)
├── config/
│   └── brand.yml             ← Brand identity, channels, SKU catalog, logo paths
├── modes/
│   ├── _shared.md            ← Cross-cutting rules (product refs, logo, guardrails)
│   └── generate.md           ← Prompt-engineering details
├── templates/
│   ├── food.md               ← Food photography prompt template
│   ├── lifestyle.md          ← Lifestyle photography prompt template
│   └── product.md            ← Product photography prompt template
├── scripts/
│   ├── generate-image.mjs    ← OpenAI image generate / edit (supports reference images)
│   ├── add-logo.mjs          ← Logo overlay via sharp (CLI x/y/width overrides)
│   └── doctor.mjs            ← Environment health check
├── assets/
│   ├── Ajinomoto_Group_Global_Brand_logo.jpg       ← Used on dryfoods + frozen
│   ├── AV Logo/
│   │   ├── AV LOGO.PNG                             ← Navy AV logo (light-toned images)
│   │   └── AV LOGO White.png                       ← White AV logo (dark-toned images, user-provided)
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
2. Skill detects channel (dryfoods / frozen / aminovital) from keywords
3. **Identifies the SKU** from the description (asks if ambiguous)
4. **Verifies the SKU's product reference photos exist** — HALTS and asks the user if missing
5. Plans logo placement:
   - **dryfoods / frozen** → reads the SKU's reference posts in `Logo_Position_Size_Reference/` and derives a plain-English placement description
   - **aminovital** → standard top-left, with auto-recolour rule (white on dark, navy on light)
6. Classifies content type (food / lifestyle / product) and loads matching template
7. Generates a structured English prompt that names the SKU, tells the model to preserve packaging from reference #1, and instructs it to render the logo (reference #2) per the placement description
8. Calls OpenAI `images.edit` once with both references → final post-ready image
9. Returns the path. **No separate logo overlay step.**

If the model places the logo wrong and the user wants a deterministic fix, they can invoke
`add-logo <path>` to run `add-logo.mjs` (sharp overlay) manually.

## Key Design Decisions

- **One-shot generation, no post-processing**: the model handles logo compositing, scaling, and recolouring natively when given the logo as a reference. Adding a sharp overlay step on top is double-work and produces inferior results for AV's tone-adaptive case.
- **Reference images are mandatory**: the model receives the official product photo every time so labels and packaging stay accurate. Without it, GPT renders distorted brand text.
- **Per-SKU logo placement description**: dryfoods/frozen SKUs each have a "Logo Position Size Reference" image that documents where the Ajinomoto logo sits in past posts. Claude inspects this visually at draft time and converts it into a one-sentence placement description embedded in the prompt — the reference image itself is NOT passed to the API (avoids the model copying food/recipe-step elements from past posts).
- **Tone-aware AV logo**: the AV logo is the navy variant on disk; the prompt instructs the model to recolour it to white when the generated background is dark.
- **Templates enforce consistency**: every prompt follows the same 10-section structure.
- **Fresh regeneration only**: never edit a generated image; always regenerate to avoid quality degradation.
- **English prompts**: image models perform best with English prompts; user input is translated automatically.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env`, add your `OPENAI_API_KEY`
3. Confirm `config/brand.yml` channels & SKU catalog reflect your products
4. Ensure these assets are in place:
   - `assets/Ajinomoto_Group_Global_Brand_logo.jpg`
   - `assets/AV Logo/AV LOGO.PNG`
   - `assets/AV Logo/AV LOGO White.png` (transparent-bg white variant — provide when ready)
   - Per-SKU product photos under `assets/Dry Food/<SKU>/` and `assets/AV Product Picture/<SKU>/`
   - Per-SKU position references in `assets/Logo_Position_Size_Reference/`
5. Run `npm run doctor` to verify setup

## Usage (via Claude Code skill)

```
/instagram-ops 一碗暖意十足的早餐,涂着 Kewpie 风格日式蛋黄酱的吐司
/instagram-ops AminoVITAL Gold sachet on a runner's bench post-workout
/instagram-ops Blendy iced latte in a sunny morning setting
/instagram-ops regenerate
/instagram-ops add-logo output/2026-05-26-dryfoods-mayo-toast-01.png
/instagram-ops prompt-only 精致的 HONDASHI 高汤摆盘
```
