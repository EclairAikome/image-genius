# Image Genius

> **AI-powered Instagram content generation that doesn't drift.**
> Standalone PowerShell CLI &middot; Claude or GPT for prompt writing &middot; Free quota via ChatGPT Plus subscription

[![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://github.com/EclairAikome/image-genius/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## The problem

Hand-crafting on-brand Instagram images in Canva takes 1-2 hours per post. The common "ask Claude for a prompt, paste it into ChatGPT" shortcut speeds things up but has three persistent pain points:

1. **Cross-app copy-paste fatigue** — endless back-and-forth between tabs, manually saving drafts.
2. **Prompts vary wildly across sessions** — same idea, different length, different style, different result.
3. **Regeneration drifts** — ask GPT Image to tweak one thing, and it quietly changes the elements you wanted to keep.

**Image Genius** is a single PowerShell command that solves all three.

---

## Highlights

### Long, hyper-detailed prompts built for gpt-image-2

Image generation models trade off precision against randomness at every unspecified dimension. The shorter the prompt, the more decisions the model improvises — and the less reproducible the output.

Image Genius templates produce **600-1200 word structured prompts** with 13 mandatory sections:

| Section | What it locks down |
|---|---|
| Camera setup | Focal length, aperture, depth of field, sensor type |
| Primary subject | Exhaustive description with measurable details |
| Product packaging | Preserves SKU exactly via reference image |
| Secondary props | Position, material, color, size relative to subject |
| Surface & background | Material, distance, blur characteristics |
| Spatial layout | Rule-of-thirds grid, frame percentages, geometry |
| Lighting rig | Key/fill/rim/practical lights with clock positions and color temps |
| Color palette | Every color with hex code AND coverage % |
| Material & texture map | Reflectivity, finish, special properties per surface |
| Brand color integration | Channel-specific colors woven into the scene |
| Atmospheric effects | Bokeh shape, haze density, lens artifacts |
| Mood & style anchor | Tone + photographic reference |
| Negative prompt | Explicit exclusions (text, watermarks, faces, AI tells) |

The result: outputs that are reproducible interpretations of explicit instructions rather than stochastic guesses.

### Stability through specificity

Every aspect of the image is explicitly described, leaving nothing to chance:

- Colors as `(#071D49)` and `(#D4A84E)`, never just "navy" and "gold"
- Lighting as "key light from 10 o'clock at 5200K", never just "from the left"
- Sizes as "occupying 26% of frame height at the lower-right third intersection"
- Distances as "approximately 2 meters behind the subject"
- Quantities as "exactly two slices" and "three potted plants"

The `modes/_shared.md` ruleset enforces this discipline — the LLM cannot hand-wave abstractly.

### Multi-model choice — your subscription, your pick

Choose your prompt-generation engine at setup:

- **Claude** via [Claude CLI](https://github.com/anthropics/claude-code) — leverages Claude's reasoning for nuanced visual descriptions
- **GPT** via [Codex CLI](https://github.com/openai/codex) — uses OpenAI's flagship reasoning models

Both CLIs handle their own authentication (subscription login OR API key, your choice). Image generation always uses **gpt-image-2** for the final output.

### Free quota via ChatGPT Plus subscription

Two image generation modes — toggle with `imagegen init`:

| Mode | How it works | Cost |
|---|---|---|
| **Free quota** | Delegates to Codex CLI's built-in `image_gen` tool, which uses your ChatGPT Plus/Pro subscription | $0 per image |
| **API paid** | Direct OpenAI Images API calls with your `OPENAI_API_KEY` | Pay-per-image |

You can switch at any time without losing your prompts or settings.

### Refine mode — surgical edits without regeneration drift

The classic frustration: you generate something great, want to tweak just one detail, but the next generation has a different lighting, different composition, different gold halo around the product.

Image Genius solves this with `refine`:

1. **Reverse-engineer** — feed your existing image to a vision-capable LLM, which produces a 800-1200 word reproduction prompt describing every visual detail.
2. **Targeted edit** — you describe what to change; the engine applies ONLY that change to the reverse-engineered prompt.
3. **Regenerate** — the new image preserves every detail (lighting, composition, materials, props, color halos) except your specific edit.

```powershell
imagegen refine output/2026-05-27-aminovital-gold-01.png
> Change the background text from "ENERGY" to "POWER UP"
```

### Channel and SKU aware

Built for multi-brand, multi-channel workflows. The included config models Ajinomoto Singapore's three Instagram channels:

- `@ajinomotosg_dryfoods` — seasonings, Blendy coffee (7 SKUs)
- `@ajinomotosgfrozenfoods` — frozen foods
- `@aminovital_sg` — AminoVITAL sports supplements (6 SKUs)

The pipeline:

1. Detects the **channel** from keywords in your description (dryfoods/frozen/aminovital)
2. Identifies the **SKU** by matching aliases (e.g., "msg", "ajinomoto seasoning", "umami" all map to `AJI-NO-MOTO`)
3. Verifies **product reference photos** exist — halts if missing
4. Loads channel-specific brand colors, mood, and recurring elements
5. Picks the correct **logo variant** (e.g., AminoVITAL has navy + white versions for light/dark scenes)
6. Passes the SKU's official photo as a reference image so the generated packaging matches exactly

Generalizes to any brand with a similar multi-channel structure — just edit `config/brand.yml`.

---

## Architecture

```
image-genius/
+-- cli.mjs                       Standalone CLI entry point (REPL + arg modes)
+-- cli.ps1                       PowerShell wrapper
+-- lib/
|   +-- cli-runner.mjs            Spawns Claude or Codex CLI via stdin pipe
|   +-- channel-detector.mjs      Deterministic keyword + alias matching
|   +-- meta-prompt-builder.mjs   Assembles instructions for the LLM
|   +-- prompt-engine.mjs         Orchestrator (detection -> meta-prompt -> CLI)
+-- templates/
|   +-- food.md                   13-section template for food photography
|   +-- lifestyle.md              13-section template for lifestyle shots
|   +-- product.md                13-section template for product hero shots
+-- modes/
|   +-- _shared.md                Cross-cutting rules and stability anchors
|   +-- generate.md               Generate-mode specifics
+-- config/
|   +-- brand.yml                 Channel + SKU catalog, brand identity, asset paths
|   +-- user-prefs.json           Your model + mode choices (gitignored content)
+-- scripts/
|   +-- init.mjs                  Interactive setup wizard
|   +-- generate-image.mjs        OpenAI API call OR codex delegation
|   +-- reverse-prompt.mjs        Vision-LLM image-to-prompt extractor
|   +-- add-logo.mjs              Fallback logo overlay via sharp
|   +-- doctor.mjs                Environment health check
+-- assets/                       Brand logos, product photos, reference posts
+-- output/                       Generated images (gitignored)
+-- drafts/                       Prompt drafts (gitignored)
```

---

## Quick start

### Prerequisites

- Node.js 18+
- PowerShell (Windows) or any shell that can run `node`
- One of:
  - [Claude CLI](https://github.com/anthropics/claude-code) (`npm install -g @anthropic-ai/claude-code`)
  - [Codex CLI](https://github.com/openai/codex) (`npm install -g @openai/codex`)

### Install

```powershell
git clone https://github.com/EclairAikome/image-genius.git
cd image-genius
npm install
```

### One-time setup

```powershell
node cli.mjs init
```

The wizard will:
1. Ask whether you want Claude or GPT for prompt writing
2. Launch that CLI's own login flow (subscription or API key)
3. Ask whether to use free-quota or API-paid for image generation
4. If you picked free-quota and aren't logged into OpenAI yet, launch Codex login
5. Show a custom welcome page

### Generate

```powershell
node cli.mjs "AminoVITAL Gold post-workout scene"
```

Or interactive REPL:

```powershell
node cli.mjs
ig> 一碗热腾腾的味之素拉面，暖色调
ig> /regenerate
ig> /refine output/2026-05-27-dryfoods-ramen-01.png
ig> /exit
```

### Convenience: global launcher

Add this function to your PowerShell `$PROFILE` so you can run `imagegen` from any directory:

```powershell
function imagegen {
    $projectPath = "D:\path\to\image-genius"
    Push-Location $projectPath
    try {
        $env:NODE_NO_WARNINGS = "1"
        node cli.mjs @args
    }
    finally {
        Pop-Location
        Remove-Item Env:NODE_NO_WARNINGS -ErrorAction SilentlyContinue
    }
}
```

---

## Commands

| Command | Description |
|---|---|
| `imagegen` | Interactive REPL mode |
| `imagegen "<description>"` | One-shot generate |
| `imagegen regenerate` | Fresh generation from the last description |
| `imagegen refine <image-path>` | Reverse-prompt + targeted edits |
| `imagegen prompt-only "<desc>"` | Generate the prompt without calling the image API |
| `imagegen init` | Re-run setup wizard |
| `imagegen doctor` | Environment health check |
| `imagegen config` | Show current configuration |

REPL slash-commands (when inside `ig>`): `/regenerate`, `/refine <path>`, `/prompt <desc>`, `/config`, `/init`, `/exit`.

---

## Customizing for your brand

Edit `config/brand.yml`. The schema:

```yaml
brand:
  name: "Your Brand"

defaults:
  image:
    model: "gpt-image-2"
    size: "1088x1360"      # Closest multiple-of-16 to Instagram 4:5
    quality: "high"

assets:
  ajinomoto_logo: "assets/your-main-logo.png"
  # ... other shared asset paths

channels:
  channel_name:
    instagram_handle: "@your_account"
    description: "What this channel posts"
    product_pictures_dir: "assets/Channel Name"
    keywords: [list, of, detection, signals]
    style:
      primary_colors: ["#HEX1", "#HEX2"]
      photography_style: "..."
      mood: "..."
    logo:
      file: "assets/channel-logo.png"
    skus:
      SKU-ID:
        dir: "Subfolder Name"
        aliases: [search, terms, that, map, to, this, sku]
        logo_references: ["past-post-1.png", "past-post-2.png"]
```

The pipeline auto-discovers everything from this file.

---

## Why this works (the science)

Image generation models trade precision against randomness at every unspecified visual dimension. A 100-word prompt leaves hundreds of decisions to the model's prior distribution — lighting direction, exact colors, prop placement, material textures, atmospheric haze. Each unspecified dimension is a roll of the dice.

Long, hyper-specific prompts lock down nearly every visual decision, making the output a deterministic interpretation of explicit instructions rather than a stochastic guess. gpt-image-2's attention is wide enough to honor 1000+ word constraints faithfully.

Image Genius enforces this discipline automatically: you provide a one-sentence brief, the engine produces an 800+ word structured prompt with hex codes, grid coordinates, and lighting rigs.

The same principle drives `refine` — instead of describing changes on top of a previous generation (which compounds randomness), we first establish a 1000-word ground-truth prompt from the actual image, then make surgical edits. The new output has the same level of specificity as the original generation's full context.

---

## License

MIT.

---

Built for [Ajinomoto Singapore](https://www.ajinomoto.com.sg/) and generalized for any multi-channel brand workflow.
