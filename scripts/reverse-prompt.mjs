/**
 * Instagram Ops — Reverse Prompt Engine
 *
 * Analyzes an image and produces a lean, intent-first reproduction prompt
 * (gpt-image-2 grammar) that, fed back to the image model, recreates the image
 * as closely as a from-scratch text-to-image prompt allows.
 *
 * Fallback tool only: the main pipeline refines by editing the ACTUAL image
 * (change ONLY X / preserve Y — see generate-image.mjs --edit-image). Use
 * reverse-prompt when you need to reproduce an image you did NOT generate here
 * and have no original prompt to edit from.
 *
 * Usage:
 *   node scripts/reverse-prompt.mjs --input output/my-image.png
 *   node scripts/reverse-prompt.mjs --input output/my-image.png --provider openai
 *   node scripts/reverse-prompt.mjs --input output/my-image.png --provider claude
 *
 * The script:
 *   1. Reads the image as base64
 *   2. Sends it to a vision model with the analysis prompt below
 *   3. Receives back a lean 120-250 word reproduction prompt
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

const ANALYSIS_PROMPT = `You are reverse-engineering an image into a prompt for gpt-image-2 (the April 2026 model). Look at the image and write ONE flowing English prompt that would recreate it as closely as possible.

Follow this block order, but do NOT print the labels — output one flowing paragraph:
Intent -> Scene / background -> Subject -> Key details -> Text -> Style -> Constraints

Rules (gpt-image-2 rewards tight instructional prompts, NOT old "magic words"):
- OPEN WITH INTENT, naming what the image is: "Create a warm editorial food photograph of ...", "Create a product hero shot of ...". Never open with praise like "Professional, ultra-detailed".
- 120-250 words total, hard cap ~300. High signal density: every clause must describe something actually visible. Cut filler.
- Name the subject specifically and describe only the components that define it (key objects/toppings, the vessel, the few defining colors) — don't catalogue every pixel.
- Quote any visible text EXACTLY as it appears, in quotes, with position (e.g. headline (top center): "..."). For non-English text, name the script/font flavor.
- Hex codes ONLY for the few defining/brand colors (e.g. "#071D49"), not for every element.
- ONE light direction + ONE color temperature (e.g. "soft key from upper-left, ~5000K"). Don't invent a multi-light rig.
- ONE style anchor (a medium/era or a named reference), not a stack of styles.
- End with a SHORT negative clause of real exclusions only (e.g. "no text other than the quoted strings, no extra logos, no hands or faces").
- NO magic words anywhere: no "4K", "8K", "ultra detailed", "ultra-high resolution", "masterpiece", "trending on artstation", "300 DPI", "professional color grading", "no AI generation tells".

Output ONLY the prompt — no commentary, no markdown fences, no preamble.`;

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
