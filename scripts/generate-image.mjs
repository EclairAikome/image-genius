import OpenAI, { toFile } from "openai";
import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import yaml from "js-yaml";
import "dotenv/config";

const args = process.argv.slice(2);
let promptFile = "drafts/last-prompt.json";
let directPrompt = null;
let forceMode = null;
const referenceImages = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--prompt-file" && args[i + 1]) promptFile = args[i + 1];
  if (args[i] === "--prompt" && args[i + 1]) directPrompt = args[i + 1];
  if (args[i] === "--reference-image" && args[i + 1]) referenceImages.push(args[i + 1]);
  if (args[i] === "--mode" && args[i + 1]) forceMode = args[i + 1]; // "api" or "manual"
}

const config = yaml.load(await fs.readFile("config/brand.yml", "utf-8"));
const defaults = config.defaults || {};

// Load user preferences for default image gen mode
let prefs = {};
try {
  prefs = JSON.parse(await fs.readFile("config/user-prefs.json", "utf-8"));
} catch {}

const imageMode = forceMode || prefs.image_generation?.mode || "api";

let prompt, description, channel;
let settingsOverride = {};
let promptDataReferences = [];

if (directPrompt) {
  prompt = directPrompt;
  description = directPrompt;
} else {
  const promptData = JSON.parse(await fs.readFile(promptFile, "utf-8"));
  // Support both standard drafts and reverse-prompt drafts
  prompt = promptData.prompt || promptData.reversed_prompt;
  description = promptData.description || promptData.original_description || "image";
  channel = promptData.channel;
  settingsOverride = promptData.settings || {};
  promptDataReferences = promptData.reference_images || [];
}

// CLI --reference-image flags take precedence; otherwise fall back to draft file
const refs = referenceImages.length > 0 ? referenceImages : promptDataReferences;

// Verify each reference image exists
for (const ref of refs) {
  try {
    await fs.access(ref);
  } catch {
    console.error(`ERROR: Reference image not found: ${ref}`);
    process.exit(1);
  }
}

const model = settingsOverride.model || prefs.image_generation?.model || defaults.image?.model || "gpt-image-2";
const size = settingsOverride.size || defaults.image?.size || "1088x1360";
const quality = settingsOverride.quality || defaults.image?.quality || "high";
const outputDir = defaults.output?.directory || "output";
const format = defaults.output?.format || "png";

// ─── Manual Mode ───
if (imageMode === "manual") {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                   MANUAL MODE — ChatGPT Plus               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log("Copy the prompt below and paste it into ChatGPT.\n");
  console.log("────────────────── PROMPT START ──────────────────\n");
  console.log(prompt);
  console.log("\n──────────────────  PROMPT END  ──────────────────\n");

  // Also copy to clipboard if possible
  try {
    const { execSync } = await import("child_process");
    execSync("clip", { input: prompt });
    console.log("[Prompt copied to clipboard]\n");
  } catch {
    // clipboard copy failed, that's OK
  }

  console.log("After generating in ChatGPT:");
  console.log(`  1. Save the image to the ${outputDir}/ folder`);
  console.log('  2. Return here and tell the skill the filename\n');

  // Save prompt file path for the skill to reference later
  const date = new Date().toISOString().split("T")[0];
  const prefix = channel ? `${channel}-` : "";
  const pendingPath = path.join(outputDir, `${date}-${prefix}PENDING.txt`);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(pendingPath, `Prompt file: ${promptFile}\nTimestamp: ${new Date().toISOString()}\n`);
  console.log(`Pending marker: ${pendingPath}`);
  process.exit(0);
}

// ─── API Mode ───
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set. Copy .env.example to .env and add your key.");
  console.error("Or switch to manual mode: node scripts/init.mjs --reset");
  process.exit(1);
}

const openai = new OpenAI();

console.log(`Channel: ${channel || "(none)"}`);
console.log(`Model: ${model}`);
console.log(`Size: ${size} | Quality: ${quality}`);
console.log(`Reference images: ${refs.length > 0 ? refs.join(", ") : "(none)"}`);
console.log(`Prompt length: ${prompt.length} chars / ~${prompt.split(/\s+/).length} words`);
console.log(`Prompt preview: ${prompt.substring(0, 150)}...`);
console.log("Generating...");

let imageBuffer;

try {
  if (refs.length > 0) {
    if (!model.startsWith("gpt-image")) {
      console.error(`ERROR: Reference images require gpt-image model; got "${model}".`);
      process.exit(1);
    }
    const mimeOf = (p) => {
      const ext = path.extname(p).toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
      if (ext === ".png") return "image/png";
      if (ext === ".webp") return "image/webp";
      console.error(`ERROR: Unsupported reference image extension: ${ext}. Use jpg/jpeg/png/webp.`);
      process.exit(1);
    };
    const imageFiles = await Promise.all(
      refs.map(async (p) => toFile(createReadStream(p), path.basename(p), { type: mimeOf(p) }))
    );
    const response = await openai.images.edit({
      model,
      image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
      prompt,
      n: 1,
      size,
      quality,
    });
    const data = response.data[0];
    if (data.b64_json) {
      imageBuffer = Buffer.from(data.b64_json, "base64");
    } else if (data.url) {
      const res = await fetch(data.url);
      imageBuffer = Buffer.from(await res.arrayBuffer());
    }
  } else if (model.startsWith("gpt-image")) {
    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality,
    });
    const data = response.data[0];
    if (data.b64_json) {
      imageBuffer = Buffer.from(data.b64_json, "base64");
    } else if (data.url) {
      const res = await fetch(data.url);
      imageBuffer = Buffer.from(await res.arrayBuffer());
    }
  } else {
    const dalleQuality = quality === "high" ? "hd" : "standard";
    const dalleSize =
      size === "1088x1360" ? "1024x1792" :
      size === "1024x1536" ? "1024x1792" :
      size === "1536x1024" ? "1792x1024" :
      "1024x1024";

    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size: dalleSize,
      quality: dalleQuality,
      response_format: "b64_json",
    });
    imageBuffer = Buffer.from(response.data[0].b64_json, "base64");
  }
} catch (err) {
  if (err.status === 401) {
    console.error("ERROR: Invalid API key. Check your .env file.");
  } else if (err.status === 429) {
    console.error("ERROR: Rate limited. Wait a moment and try again.");
  } else if (err.status === 400 && err.message?.includes("safety")) {
    console.error("ERROR: Prompt rejected by content policy. Adjust the description.");
  } else {
    console.error(`ERROR: ${err.message || err}`);
  }
  process.exit(1);
}

await fs.mkdir(outputDir, { recursive: true });

const date = new Date().toISOString().split("T")[0];
const prefix = channel ? `${channel}-` : "";
const slug = description
  .replace(/[^\w\s一-鿿]/g, "")
  .trim()
  .split(/\s+/)
  .slice(0, 3)
  .join("-")
  .toLowerCase()
  .substring(0, 30)
  || "image";

const existingFiles = await fs.readdir(outputDir).catch(() => []);
const todayFiles = existingFiles.filter(
  (f) => f.startsWith(date) && f.includes(slug)
);
const index = todayFiles.length + 1;

const filename = `${date}-${prefix}${slug}-${String(index).padStart(2, "0")}.${format}`;
const outputPath = path.join(outputDir, filename);

await fs.writeFile(outputPath, imageBuffer);
console.log(`\nDone! Image saved: ${outputPath}`);
console.log(`Size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);
