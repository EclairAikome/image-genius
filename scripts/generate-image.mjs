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
let editImage = null;               // edit endpoint: single input image to change
const referenceImages = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--prompt-file" && args[i + 1]) promptFile = args[i + 1];
  if (args[i] === "--prompt" && args[i + 1]) directPrompt = args[i + 1];
  if (args[i] === "--reference-image" && args[i + 1]) referenceImages.push(args[i + 1]);
  if (args[i] === "--edit-image" && args[i + 1]) editImage = args[i + 1];
  if (args[i] === "--mode" && args[i + 1]) forceMode = args[i + 1]; // "api" | "free-quota" | "manual"
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
let productRefImages = [];
let logoFileFromDraft = null;
let logoPositionRefs = [];
let skuFromDraft = null;
let isEdit = false;
let editInput = null;

if (editImage) {
  // CLI edit: --edit-image <path> --prompt "change ONLY X / preserve Y"
  isEdit = true;
  editInput = editImage;
  prompt = directPrompt;
  description = "refine";
  if (!prompt) {
    console.error('ERROR: --edit-image requires --prompt "Edit the input image: change ONLY ...".');
    process.exit(1);
  }
} else if (directPrompt) {
  prompt = directPrompt;
  description = directPrompt;
} else {
  const promptData = JSON.parse(await fs.readFile(promptFile, "utf-8"));
  prompt = promptData.prompt || promptData.reversed_prompt;
  description = promptData.description || promptData.original_description || "image";
  channel = promptData.channel;
  skuFromDraft = promptData.sku || null;
  settingsOverride = promptData.settings || {};
  promptDataReferences = promptData.reference_images || [];
  productRefImages = promptData.product_reference_images || [];
  logoFileFromDraft = promptData.logo_file || null;
  logoPositionRefs = promptData.logo_position_reference_images || [];
  // Edit/refine draft: operate on the existing image, change ONLY what's asked.
  if (promptData.edit === true && promptData.source_image) {
    isEdit = true;
    editInput = promptData.source_image;
  }
}

// For an edit, the ONLY input to the model is the image being edited.
const refs = isEdit
  ? [editInput]
  : (referenceImages.length > 0 ? referenceImages : promptDataReferences);

// Verify each reference image exists
for (const ref of refs) {
  try {
    await fs.access(ref);
  } catch {
    console.error(`ERROR: ${isEdit ? "Image to edit" : "Reference image"} not found: ${ref}`);
    process.exit(1);
  }
}

const model = settingsOverride.model || prefs.image_generation?.model || defaults.image?.model || "gpt-image-2";
const size = settingsOverride.size || defaults.image?.size || "1088x1360";
const quality = settingsOverride.quality || defaults.image?.quality || "high";
const outputDir = defaults.output?.directory || "output";
const format = defaults.output?.format || "png";

// ─── Validate size upfront (fast, clear failure instead of an opaque API error) ───
function validateSize(s) {
  const m = /^(\d+)x(\d+)$/i.exec(String(s).trim());
  if (!m) {
    console.error(`ERROR: size must be WxH (got "${s}"). Set defaults.image.size in config/brand.yml.`);
    process.exit(1);
  }
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (w <= 0 || h <= 0) {
    console.error(`ERROR: size dimensions must be positive (got "${s}").`);
    process.exit(1);
  }
  if (Math.max(w, h) >= 3840) {
    console.error(`ERROR: longest side must be < 3840px (got ${Math.max(w, h)}px in "${s}").`);
    process.exit(1);
  }
  const ratio = Math.max(w, h) / Math.min(w, h);
  if (ratio > 3) {
    console.error(`ERROR: aspect ratio must be <= 3:1 (got ${ratio.toFixed(2)}:1 in "${s}").`);
    process.exit(1);
  }
}
validateSize(size);

// ─── Retry with exponential backoff on rate-limit / server errors ───
async function withRetry(fn, { retries = 4, label = "request" } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status;
      const retryable = status === 429 || (typeof status === "number" && status >= 500);
      if (!retryable || attempt === retries - 1) throw err;
      const waitMs = Math.round((2 ** attempt) * 1000 + Math.random() * 250);
      console.error(`  ⚠ ${label} failed (HTTP ${status}); retrying in ${(waitMs / 1000).toFixed(1)}s …`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

// ─── Helper: build output filename ───
function buildOutputPath() {
  const date = new Date().toISOString().split("T")[0];
  const prefix = channel ? `${channel}-` : "";
  const slug = (description || "image")
    .replace(/[^\w\s一-鿿]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("-")
    .toLowerCase()
    .substring(0, 30) || "image";
  return { date, prefix, slug };
}

// ─── Free-Quota Mode (delegates image generation to codex CLI) ───
if (imageMode === "free-quota") {
  console.log("\n→ Free-quota mode — delegating image generation to codex CLI...");
  console.log(`Channel: ${channel || "(none)"}`);
  console.log(`Prompt length: ${prompt.length} chars / ~${prompt.split(/\s+/).length} words`);

  await fs.mkdir(outputDir, { recursive: true });
  const { date, prefix, slug } = buildOutputPath();
  const existingFiles = await fs.readdir(outputDir).catch(() => []);
  const todayFiles = existingFiles.filter((f) => f.startsWith(date) && f.includes(slug));
  const index = todayFiles.length + 1;
  const filename = `${date}-${prefix}${slug}-${String(index).padStart(2, "0")}.${format}`;
  const outputPath = path.resolve(outputDir, filename);

  let codexRequest;

  if (isEdit) {
    // ── Refine: precise local edit of an existing image ──
    const editInputAbs = path.resolve(editInput);
    console.log(`→ Edit mode — input: ${path.basename(editInputAbs)}`);
    codexRequest = `TASK: Make a PRECISE LOCAL EDIT to an existing image using your built-in image_gen tool in edit mode.

==================== EDIT INSTRUCTION (use verbatim) ====================
${prompt}
========================================================================

INPUT IMAGE (pass this file to image_gen as the image to edit):
    ${editInputAbs}

STEP 1 — Call image_gen in EDIT mode with the input image above and the edit
instruction verbatim. Change ONLY what the instruction names; keep everything
else (composition, packaging text, logo, lighting, background) exactly as in the
input image. Do NOT re-describe or regenerate the whole image.

STEP 2 — Save the result to this absolute path:
    ${outputPath}

STEP 3 — Output (only this, one line):
    ${outputPath}

==================== SPECS ====================
  Model: ${model}    Size: ${size}    Quality: ${quality}    Format: ${format}

CRITICAL RULES:
  - This is an EDIT, not a fresh generation. Preserve everything not named.
  - Do NOT fabricate new packaging text, label graphics, or logo variants.
  - Save the binary PNG to the exact path above.`;
  } else {
    // ── Generation with reference images (product photo + logo) ──
    const productRefsAbs = productRefImages.map((p) => path.resolve(p));
    const logoFileAbs = logoFileFromDraft ? path.resolve(logoFileFromDraft) : null;
    const logoPositionRefsAbs = logoPositionRefs.map((p) => path.resolve(p));

    let referenceBlock = "";
    if (productRefsAbs.length > 0 || logoFileAbs || logoPositionRefsAbs.length > 0) {
      referenceBlock = `\n==================== REFERENCE IMAGES (MANDATORY) ====================\n`;
      if (productRefsAbs.length > 0) {
        referenceBlock += `\n[A] PRODUCT PHOTO REFERENCE — Pass this file directly to the image_gen tool as an input/reference image. The generated image MUST preserve every text character, color, design element, and packaging detail from this photo:\n${productRefsAbs.map((p) => `    ${p}`).join("\n")}\n`;
      }
      if (logoFileAbs) {
        referenceBlock += `\n[B] BRAND LOGO FILE — Pass this file as a second input/reference to the image_gen tool. The generated image MUST contain this exact logo (preserving its glyph shapes and color) at the position specified in the prompt:\n    ${logoFileAbs}\n`;
      }
      if (logoPositionRefsAbs.length > 0) {
        referenceBlock += `\n[C] LOGO POSITION REFERENCES — Past Instagram posts showing where the brand logo goes for this SKU. INSPECT these images visually using your view/read tool to determine the EXACT corner, size (as % of canvas width), padding, and tagline arrangement. Do NOT pass these as image_gen inputs — they are for YOU to inspect, then describe the placement to image_gen in the prompt:\n${logoPositionRefsAbs.map((p) => `    ${p}`).join("\n")}\n`;
      }
      referenceBlock += `\n========================================================================\n`;
    }

    codexRequest = `TASK: Generate an Instagram brand image using your built-in image_gen tool, with the supplied reference images as MANDATORY inputs.

This is NOT pure text-to-image. You MUST use the reference images:
  - Product photo as a packaging-fidelity reference (so the generated package matches the real product)
  - Brand logo file as the actual logo to embed
  - Position-reference past posts as visual cues for logo placement (YOU inspect them)

==================== IMAGE PROMPT (use verbatim) ====================
${prompt}
======================================================================
${referenceBlock}
==================== STEP-BY-STEP INSTRUCTIONS ====================

STEP 1 — Inspect position references (if any):
  Use your file/image viewing tool to OPEN each path listed under [C] above. From those past Instagram posts, note the logo's EXACT corner, size as % of canvas width, padding from edges, and any tagline layout. This information overrides any vague placement language in the image prompt.

STEP 2 — Call image_gen in EDIT/COMPOSITION mode:
  Invoke your built-in image_gen tool. Pass:
    - The full image prompt above (verbatim, do not summarize)
    - The product photo from [A] as an input/reference image (preserve packaging exactly)
    - The brand logo file from [B] as a second input/reference (embed at the location derived from step 1)
  If image_gen has separate parameters for "main input image" vs "additional references", use the product photo as the main input and the logo as an additional reference.

STEP 3 — Save the result:
  Save the generated image to this absolute path:
    ${outputPath}

STEP 4 — Output (only this, one line):
    ${outputPath}

==================== SPECS ====================
  Model: ${model}    Size: ${size}    Quality: ${quality}    Format: ${format}

CRITICAL RULES:
  - References under [A] and [B] MUST be passed to image_gen as actual image inputs, not described in text
  - References under [C] MUST be inspected visually by you, then their visual information used to instruct image_gen
  - Do NOT modify, summarize, or shorten the image prompt
  - Do NOT fabricate new packaging text, label graphics, or logo variants — use only what's in the reference files
  - Save the binary PNG to the exact path above`;
  }

  const verbose = process.env.IMAGEGEN_VERBOSE === "1";
  const { spawn } = await import("child_process");
  const HARD_TIMEOUT_MS = 600_000;
  const POLL_INTERVAL_MS = 2_000;
  const STABILITY_CHECK_MS = 1_500;
  const HEARTBEAT_INTERVAL_MS = 15_000;

  // Print reference summary (clean, single block) — generation only
  if (!isEdit) {
    const productRefsAbs = productRefImages.map((p) => path.resolve(p));
    const logoFileAbs = logoFileFromDraft ? path.resolve(logoFileFromDraft) : null;
    const logoPositionRefsAbs = logoPositionRefs.map((p) => path.resolve(p));
    if (productRefsAbs.length > 0 || logoFileAbs || logoPositionRefsAbs.length > 0) {
      console.log("→ References:");
      if (productRefsAbs.length > 0) {
        console.log(`    product: ${productRefsAbs.map((p) => path.basename(p)).join(", ")}`);
      }
      if (logoFileAbs) {
        console.log(`    logo:    ${path.basename(logoFileAbs)}`);
      }
      if (logoPositionRefsAbs.length > 0) {
        console.log(`    position refs: ${logoPositionRefsAbs.map((p) => path.basename(p)).join(", ")}`);
      }
    }
  }
  console.log(`→ ${isEdit ? "Editing" : "Generating"} image (free-quota mode)...`);

  const codexProc = spawn("codex", ["exec"], {
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  codexProc.stdin.write(codexRequest);
  codexProc.stdin.end();

  // Silently discard codex's verbose output (unless verbose flag set)
  codexProc.stdout.on("data", (chunk) => {
    if (verbose) process.stdout.write(chunk);
  });
  codexProc.stderr.on("data", (chunk) => {
    if (verbose) process.stderr.write(chunk);
  });

  const startTime = Date.now();
  let detectedSize = 0;
  let firstSeenAt = 0;
  let earlyExitTriggered = false;

  // Heartbeat — keep user informed without spamming
  const heartbeatTimer = setInterval(() => {
    if (earlyExitTriggered) return;
    const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);
    process.stdout.write(`  ⏳ still working (${elapsedMin} min elapsed)\n`);
  }, HEARTBEAT_INTERVAL_MS);

  // Poll for the output file
  const pollTimer = setInterval(async () => {
    if (earlyExitTriggered) return;
    try {
      const stat = await fs.stat(outputPath);
      if (stat.size < 1024) return;
      if (firstSeenAt === 0) {
        firstSeenAt = Date.now();
        detectedSize = stat.size;
        return;
      }
      if (Date.now() - firstSeenAt >= STABILITY_CHECK_MS && stat.size === detectedSize) {
        earlyExitTriggered = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        codexProc.kill("SIGTERM");
        setTimeout(() => { try { codexProc.kill("SIGKILL"); } catch {} }, 3000);
      } else {
        detectedSize = stat.size;
      }
    } catch {
      // not yet
    }
  }, POLL_INTERVAL_MS);

  const hardTimer = setTimeout(() => {
    if (!earlyExitTriggered) {
      clearInterval(heartbeatTimer);
      console.error(`\n❌ Hard timeout (${HARD_TIMEOUT_MS / 1000}s). Killing codex.`);
      try { codexProc.kill("SIGKILL"); } catch {}
    }
  }, HARD_TIMEOUT_MS);

  await new Promise((resolve) => {
    codexProc.on("close", () => {
      clearInterval(pollTimer);
      clearInterval(heartbeatTimer);
      clearTimeout(hardTimer);
      resolve();
    });
    codexProc.on("error", (err) => {
      clearInterval(pollTimer);
      clearInterval(heartbeatTimer);
      clearTimeout(hardTimer);
      console.error(`\n❌ Codex spawn error: ${err.message}`);
      resolve();
    });
  });

  try {
    const stats = await fs.stat(outputPath);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`✓ Image saved: ${outputPath} (${(stats.size / 1024).toFixed(0)} KB, ${elapsed}s)`);
    console.log(`  Next: open the image and verify packaging, logo, text and (AminoVITAL) HSA compliance before posting.`);
    if (!verbose) {
      console.log(`  (re-run with IMAGEGEN_VERBOSE=1 to see codex's internal output)`);
    }
  } catch {
    console.error(`\n⚠  Image not found at ${outputPath} after codex exit.`);
    console.error("   Try API mode for guaranteed reference fidelity: imagegen init");
    process.exit(1);
  }
  process.exit(0);
}

// ─── Manual Mode (legacy — clipboard + ChatGPT website) ───
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
if (isEdit) {
  console.log(`Mode: edit | input: ${editInput}`);
} else {
  console.log(`Reference images: ${refs.length > 0 ? refs.join(", ") : "(none)"}`);
}
console.log(`Prompt length: ${prompt.length} chars / ~${prompt.split(/\s+/).length} words`);
console.log(`Prompt preview: ${prompt.substring(0, 150)}...`);
console.log(isEdit ? "Editing..." : "Generating...");

let imageBuffer;

async function dataToBuffer(data) {
  if (data.b64_json) return Buffer.from(data.b64_json, "base64");
  if (data.url) {
    const res = await fetch(data.url);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("API response contained neither b64_json nor url.");
}

try {
  if (refs.length > 0) {
    if (!model.startsWith("gpt-image")) {
      console.error(`ERROR: ${isEdit ? "Editing" : "Reference images"} requires a gpt-image model; got "${model}".`);
      process.exit(1);
    }
    const mimeOf = (p) => {
      const ext = path.extname(p).toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
      if (ext === ".png") return "image/png";
      if (ext === ".webp") return "image/webp";
      console.error(`ERROR: Unsupported image extension: ${ext}. Use jpg/jpeg/png/webp.`);
      process.exit(1);
    };
    const imageFiles = await Promise.all(
      refs.map(async (p) => toFile(createReadStream(p), path.basename(p), { type: mimeOf(p) }))
    );
    const data = await withRetry(async () => {
      const response = await openai.images.edit({
        model,
        image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
        prompt,
        n: 1,
        size,
        quality,
      });
      return response.data[0];
    }, { label: "images.edit" });
    imageBuffer = await dataToBuffer(data);
  } else if (model.startsWith("gpt-image")) {
    const data = await withRetry(async () => {
      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size,
        quality,
      });
      return response.data[0];
    }, { label: "images.generate" });
    imageBuffer = await dataToBuffer(data);
  } else {
    const dalleQuality = quality === "high" ? "hd" : "standard";
    const dalleSize =
      size === "1088x1360" ? "1024x1792" :
      size === "1024x1536" ? "1024x1792" :
      size === "1536x1024" ? "1792x1024" :
      "1024x1024";

    const data = await withRetry(async () => {
      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size: dalleSize,
        quality: dalleQuality,
        response_format: "b64_json",
      });
      return response.data[0];
    }, { label: "images.generate (dalle)" });
    imageBuffer = Buffer.from(data.b64_json, "base64");
  }
} catch (err) {
  if (err.status === 401) {
    console.error("ERROR: Invalid API key. Check your .env file.");
  } else if (err.status === 429) {
    console.error("ERROR: Rate limited after retries. Wait a moment and try again.");
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
console.log(`Next: open the image and verify packaging, logo, text and (AminoVITAL) HSA compliance before posting.`);
