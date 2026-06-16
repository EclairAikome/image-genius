# Image Genius

> **AI-powered Instagram content generation that stays on brand.**
> Lean, intent-first prompts built for GPT Image 2 &middot; Standalone PowerShell CLI &middot; Claude or GPT for prompt writing &middot; Free quota via ChatGPT Plus subscription

[![Version](https://img.shields.io/badge/version-2.2.0-blue)](https://github.com/EclairAikome/image-genius/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## The problem

GPT Image 2 (April 2026) was a generational leap: it follows long, instructional prompts without losing detail, renders text correctly (Chinese / Japanese / Korean included), supports custom resolutions, and does precise local edits with a `change ONLY X / preserve Y` pattern. Getting a clean, on-brand Instagram image out of it *should* be easy. In practice, the usual "ask an LLM for a prompt, paste it into the image model" shortcut runs into three persistent problems:

1. **Old prompt habits waste the model.** Reflexes carried over from earlier image models — stacking *4K, ultra-detailed, masterpiece, trending on artstation*, over-describing every dimension into 1000-word walls, and never actually looking at the result — are ignored or actively harmful on GPT Image 2. You burn generations on bloated prompts and mangled, off-brand output.
2. **Prompts vary wildly across sessions** — same idea, different length, different style, different result.
3. **Regeneration drifts** — ask the model to tweak one thing, and it quietly changes the elements you wanted to keep.

**Image Genius** is a single PowerShell command that solves all three.

---

## Highlights

### Lean, intent-first prompts built for GPT Image 2

GPT Image 2 (April 2026) follows tight *instructional* prompts faithfully — but
it does **not** reward the old "magic word" style, and it loses the thread when a
prompt runs too long. Pile on 800–1200 words of `ultra-detailed, 4K, masterpiece,
professional color grading` plus a five-light studio rig and three restatements of
the palette, and the instructions you actually care about — keep the packaging
exact, put the logo here, render this compliant text — get buried. The output
"forgets" them.

Image Genius writes the opposite kind of prompt. Each one is a **120–250 word
art-direction brief** in a fixed 7-block order:

```
Intent  →  Scene  →  Subject  →  Key details  →  Text  →  Style  →  Constraints
```

Those seven blocks set the **order**. Six writing principles set the **quality**
of what goes into them:

| Principle | What it means |
|---|---|
| **Open with intent** | "Create a premium product hero photograph of …" — the opening selects the model's mode. Never "Professional commercial photography, ultra-detailed…". |
| **Preserve, don't re-describe** | The real product photo is passed as reference #1. The prompt says "preserve the packaging exactly as in reference #1" instead of cataloguing every label surface — re-describing a reference image just fights it and causes drift. |
| **Precision where it matters** | Hex codes for brand/accent colors and numeric logo placement (corner, % width, padding) — not for every incidental prop. |
| **One light, one style** | One key direction + one color temperature; one named style anchor. No multi-light rigs, no stacked styles. |
| **No magic words** | No `4K / 8K / ultra-detailed / masterpiece / 300 DPI / "no AI generation tells"`. Fidelity comes from the API `quality` parameter, not adjectives. |
| **Real negatives only** | A short exclusion clause for things you actually don't want, not pre-2026 boilerplate. |

The result: high signal density. Every clause does concrete instructional work, so
the load-bearing brand requirements survive all the way to the pixels.

### Visual self-verification

The pipeline doesn't just generate and hope. After every image, it **opens the
result and checks it against the brief** — packaging text intact, logo in the
right corner and size, on-image text exact (and, for AminoVITAL, HSA-compliant),
composition as specified. If a check fails, it changes one dimension and tries
again, so you're shown a *verified* result instead of "here's an image, does it
look right?"

### Logo placement learned from your past posts

For brand-consistent logo placement, vague text instructions aren't enough. Image Genius has the prompt-generation LLM **open and inspect** the SKU's past Instagram posts before writing the logo clause:

1. List past posts in `brand.yml` under `channels.<channel>.skus.<sku>.logo_references`
2. The meta-prompt's `PRE-WORK` block tells the LLM to view each reference and read off:
   - Corner (top-left / top-right / bottom-left / bottom-right)
   - Logo width as % of canvas
   - Padding from edges as %
   - Tagline arrangement (stacked / beside / below)
3. Those numbers go straight into the prompt — `"top-right, 14% width, 2.5% top / 2% right padding"` instead of just `"top-right corner"`

Paired with the visual-verification step above, this keeps logo placement matching your established standard across every SKU.

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

The classic frustration: you generate something great, want to tweak just one detail, but the next generation comes back with different lighting, different composition, a different gold halo around the product.

Image Genius solves this by editing the **actual image** through GPT Image 2's edit endpoint — not by regenerating from scratch:

1. **Change ONLY X** — you say what to change; the CLI builds a short `change ONLY X / preserve Y exactly` instruction.
2. **Preserve the rest** — composition, packaging text, logo position, lighting and color grade are all listed as preserved, so the model leaves them untouched.
3. **One round-trip** — the edit runs on the real pixels, so there's no image→prose→image detour and nothing to drift.

```powershell
imagegen refine output/2026-05-27-aminovital-gold-01.png "change the headline from 'ENERGY' to 'POWER UP'"
```

(`reverse-prompt` is still available as a fallback for reproducing an image you didn't generate here.)

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
|   +-- food.md                   7-block, 120-250 word template for food photography
|   +-- lifestyle.md              7-block template for lifestyle shots
|   +-- product.md                7-block template for product hero shots
+-- modes/
|   +-- _shared.md                Cross-cutting rules (lean-prompt grammar, verification)
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
ig> /refine output/2026-05-27-dryfoods-ramen-01.png 把背景换成暖色
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
| `imagegen refine <image-path> "<change>"` | Edit an existing image — change ONLY X, preserve the rest |
| `imagegen prompt-only "<desc>"` | Generate the prompt without calling the image API |
| `imagegen init` | Re-run setup wizard |
| `imagegen doctor` | Environment health check |
| `imagegen config` | Show current configuration |

REPL slash-commands (when inside `ig>`): `/regenerate`, `/refine <path> <change>`, `/prompt <desc>`, `/config`, `/init`, `/exit`.

### Debug / verbose mode

By default the CLI shows only clean status milestones (prompt-ready, image-ready). To see the prompt-generation LLM's full thinking and codex's internal tool calls during image generation:

```powershell
$env:IMAGEGEN_VERBOSE = "1"
imagegen "your description"
```

Useful when debugging why a reference image wasn't picked up, or why the logo landed in the wrong spot.

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

## Why this works

GPT Image 2 is an *instruction-following* image model. It will honour the
specifics you give it — but, like any model with a finite attention budget, it
follows a prompt most reliably when that prompt is tight. There's a working band
(roughly 120–250 words for this kind of brief) where every clause lands. Push far
past it and the signal thins out: the brand-critical instructions — keep the
packaging exact, place the logo here, render this exact compliant text — start to
compete with filler and get dropped. That's the "context rot" you see as a long
prompt quietly losing details.

So Image Genius optimizes for **signal density, not word count**:

- **Specify what matters, skip what doesn't.** Hex codes for brand and accent
  colors, numeric logo placement, one light direction, one style anchor — and
  nothing on the dimensions you don't care about. Over-specification is noise.
- **Let the reference image do its job.** The real product photo is passed to the
  API, so the prompt says "preserve reference #1" instead of re-describing the
  label. Re-describing a reference just fights the pixels and invites drift.
- **No magic words.** `4K / ultra-detailed / masterpiece / 300 DPI / "no AI tells"`
  are pre-2026 habits that GPT Image 2 ignores or is hurt by. Fidelity comes from
  the API `quality` parameter.
- **Edit, don't re-roll.** `refine` changes the actual pixels through the edit
  endpoint with a `change ONLY X / preserve Y` instruction — so the parts you
  liked can't drift, with no image→prose→image round-trip.
- **Verify before shipping.** The agent looks at every result and checks it
  against the brief, then iterates one dimension at a time if needed.

---

## License

MIT.

---

Built for [Ajinomoto Singapore](https://www.ajinomoto.com.sg/) and generalized for any multi-channel brand workflow.
