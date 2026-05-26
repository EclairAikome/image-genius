/**
 * Instagram Ops — Reverse Prompt Engine
 *
 * Analyzes a generated image and produces an ultra-detailed prompt
 * that, when fed back to the image model, should reproduce an image
 * as close to the original as possible.
 *
 * Usage:
 *   node scripts/reverse-prompt.mjs --input output/my-image.png
 *   node scripts/reverse-prompt.mjs --input output/my-image.png --provider openai
 *   node scripts/reverse-prompt.mjs --input output/my-image.png --provider claude
 *
 * The script:
 *   1. Reads the image as base64
 *   2. Sends it to a vision model with a meticulously crafted analysis prompt
 *   3. Receives back a ~800-1200 word structured reproduction prompt
 *   4. Saves to drafts/reverse-<timestamp>.json
 *   5. Prints the prompt for review
 */

import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import "dotenv/config";

const args = process.argv.slice(2);
let inputPath = null;
let provider = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--input" && args[i + 1]) inputPath = args[i + 1];
  if (args[i] === "--provider" && args[i + 1]) provider = args[i + 1];
}

if (!inputPath) {
  console.error("Usage: node scripts/reverse-prompt.mjs --input <image-path> [--provider claude|openai]");
  process.exit(1);
}

// Load user preferences for default provider
let prefs = {};
try {
  prefs = JSON.parse(await fs.readFile("config/user-prefs.json", "utf-8"));
} catch {}

if (!provider) {
  provider = prefs.prompt_model?.provider || "openai";
}

const imageBuffer = await fs.readFile(inputPath);
const base64Image = imageBuffer.toString("base64");
const mimeType = inputPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

const ANALYSIS_PROMPT = `You are an expert image-to-prompt reverse engineer. Your job is to analyze this image and produce a prompt that, when given to an AI image generator, would reproduce this image as faithfully as possible.

Analyze EVERY aspect of the image and write a structured reproduction prompt following these sections IN ORDER. Be obsessively specific — measure proportions, name exact colors, describe every object.

## Required Sections (write each as a flowing paragraph, separated by periods):

**1. SHOT TYPE & CAMERA SETUP** (30-50 words)
- Exact shot angle (overhead, 45°, eye-level, three-quarter, etc.)
- Lens focal length estimate (24mm, 35mm, 50mm, 85mm, 100mm macro)
- Aperture estimate (f/1.8, f/2.8, f/4, f/5.6, f/8)
- Depth of field description (what's sharp, what's blurred, bokeh shape)

**2. PRIMARY SUBJECT** (80-120 words)
- What is the main subject? Name it specifically (e.g., "Japanese tonkotsu ramen" not "a bowl of soup")
- Describe every visible component from top to bottom or left to right
- Include exact textures (glossy, matte, rough, smooth, translucent, opaque)
- Include exact apparent temperatures (steaming, frosted, room temp)
- Describe colors using specific names AND hex codes where possible
- Note any text/branding visible on products (exact wording and font style)

**3. SECONDARY OBJECTS & PROPS** (60-100 words)
- List every secondary object visible
- For each: exact position relative to the main subject (left, right, behind, foreground)
- Materials and finishes of each prop
- Size relative to the main subject

**4. SURFACE & SETTING** (40-60 words)
- What surface is everything sitting on? (wood type, marble color, fabric, etc.)
- Background description (blurred, sharp, color, bokeh points, gradient)
- Distance between subject and background

**5. SPATIAL LAYOUT** (40-60 words)
- Where is the main subject positioned? (center, rule-of-thirds left, offset right, etc.)
- How much negative space and where?
- Overall composition geometry (triangular, diagonal, centered, S-curve)
- Canvas coverage of main subject as percentage of frame

**6. LIGHTING RIG** (60-80 words)
- Key light: direction (clock position), intensity, color temperature (warm/cool/neutral, approximate Kelvin)
- Fill light: if present, direction and ratio to key
- Rim/back light: if present, describe halo or edge highlights
- Practical lights: any visible light sources in the scene
- Shadow characteristics: hard/soft, direction, density, color

**7. COLOR PALETTE** (40-60 words)
- List the 5-7 dominant colors with approximate hex codes
- Overall color temperature of the scene
- Saturation level (muted, natural, vibrant, oversaturated)
- Any color grading or tint applied (warm orange shift, cool blue, etc.)
- Contrast level (low/medium/high)

**8. MATERIAL & TEXTURE MAP** (50-70 words)
- For each major surface: describe its reflectivity (matte, satin, glossy, mirror)
- Transparency or translucency of any elements
- Wetness, condensation, or moisture on any surface
- Any visible grain, pattern, or texture detail

**9. ATMOSPHERIC EFFECTS** (30-50 words)
- Steam, smoke, haze, dust particles?
- Lens effects: flare, chromatic aberration, vignette?
- Bokeh characteristics: shape (circular, hexagonal), size, color
- Any motion blur?

**10. MOOD & STYLE** (30-40 words)
- Overall emotional tone
- Photography style reference (editorial, commercial, lifestyle, fine art)
- Era/trend reference if applicable

**11. NEGATIVE PROMPT** (fixed)
End with: "Do not include: [list anything NOT in the image that should be excluded, such as text, watermarks, people, etc.]"

## Output Rules:
- Write as ONE continuous prompt, sections separated by periods
- Total length: 800-1200 words
- Use only concrete visual descriptors — no emotional or abstract language
- Include hex color codes inline (e.g., "deep navy blue (#071D49)")
- All measurements as percentages of frame or relative terms
- Do NOT add any meta-commentary, just output the prompt`;

console.log(`Analyzing image: ${inputPath}`);
console.log(`Provider: ${provider}`);
console.log("Reverse-engineering prompt...\n");

let reversedPrompt;

try {
  if (provider === "openai") {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI();
    const model = prefs.prompt_model?.model || "gpt-4.1";

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });
    reversedPrompt = response.choices[0].message.content;
  } else if (provider === "claude") {
    // Use Anthropic SDK if available, otherwise fall back to fetch
    let Anthropic;
    try {
      const mod = await import("@anthropic-ai/sdk");
      Anthropic = mod.default || mod.Anthropic;
    } catch {
      console.error("ERROR: @anthropic-ai/sdk not installed. Run: npm install @anthropic-ai/sdk");
      console.error("Or use --provider openai instead.");
      process.exit(1);
    }
    const anthropic = new Anthropic();
    const model = prefs.prompt_model?.model || "claude-sonnet-4-20250514";

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64Image },
            },
            { type: "text", text: ANALYSIS_PROMPT },
          ],
        },
      ],
    });
    reversedPrompt = response.content[0].text;
  } else {
    console.error(`ERROR: Unknown provider "${provider}". Use "claude" or "openai".`);
    process.exit(1);
  }
} catch (err) {
  console.error(`ERROR: ${err.message || err}`);
  process.exit(1);
}

// Save to drafts
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const draftFile = `drafts/reverse-${timestamp}.json`;

// Also try to load the original draft if it exists, for context
let originalDraft = null;
try {
  originalDraft = JSON.parse(await fs.readFile("drafts/last-prompt.json", "utf-8"));
} catch {}

const draftData = {
  source_image: inputPath,
  provider,
  reversed_prompt: reversedPrompt,
  original_prompt: originalDraft?.prompt || null,
  original_description: originalDraft?.description || null,
  channel: originalDraft?.channel || null,
  sku: originalDraft?.sku || null,
  timestamp: new Date().toISOString(),
  instructions: "Edit 'reversed_prompt' with your changes, then use this file with: node scripts/generate-image.mjs --prompt-file " + draftFile,
};

await fs.writeFile(draftFile, JSON.stringify(draftData, null, 2) + "\n");

console.log("=== Reversed Prompt ===\n");
console.log(reversedPrompt);
console.log(`\n=== Saved to ${draftFile} ===`);
console.log("\nTo regenerate with edits:");
console.log(`  1. Edit the prompt in ${draftFile}`);
console.log(`  2. Run: node scripts/generate-image.mjs --prompt-file ${draftFile}`);
