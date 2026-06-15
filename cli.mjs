#!/usr/bin/env node
// Suppress Node deprecation warnings in child processes we spawn.
// Our spawn args are hardcoded — no injection risk.
process.env.NODE_NO_WARNINGS = "1";

/**
 * Image Genius — Standalone PowerShell CLI
 *
 * Usage:
 *   node cli.mjs                              Interactive REPL mode
 *   node cli.mjs "<description>"              One-shot generate
 *   node cli.mjs regenerate                   Regenerate from last draft
 *   node cli.mjs refine <image-path> <change> Edit an existing image (change ONLY X)
 *   node cli.mjs prompt-only "<description>"  Generate prompt only, no image
 *   node cli.mjs init                         Run setup wizard
 *   node cli.mjs doctor                       Environment health check
 *   node cli.mjs config                       Show current configuration
 */

import fs from "fs/promises";
import { spawn } from "child_process";
import readline from "readline";

import { generatePrompt, saveDraft } from "./lib/prompt-engine.mjs";
import { buildEditPrompt } from "./lib/meta-prompt-builder.mjs";

const PREFS_PATH = "config/user-prefs.json";

async function loadPrefs() {
  try { return JSON.parse(await fs.readFile(PREFS_PATH, "utf-8")); }
  catch { return { initialized: false }; }
}

async function ensureInitialized() {
  const prefs = await loadPrefs();
  if (!prefs.initialized) {
    console.log("\n⚠  First-time setup required.\n");
    await runScript("scripts/init.mjs");
    return await loadPrefs();
  }
  return prefs;
}

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [scriptPath, ...args], { stdio: "inherit", shell: true });
    proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${scriptPath} exited ${code}`)));
    proc.on("error", reject);
  });
}

async function cmdGenerate(userInput, { promptOnly = false } = {}) {
  const prefs = await ensureInitialized();
  const verbose = process.env.IMAGEGEN_VERBOSE === "1";

  console.log(`\n→ Generating prompt (${prefs.prompt_model?.provider}${prefs.prompt_model?.model ? "/" + prefs.prompt_model.model : ""})...`);

  const result = await generatePrompt(userInput);

  if (!result.ok) {
    if (result.needsUserInput) {
      console.log(`\n${result.needsUserInput.message}`);
      console.log(`Options: ${result.needsUserInput.options.join(", ")}`);
      console.log(`\nRe-run with explicit channel/SKU.`);
      return;
    }
    console.error(`\n❌ ${result.error}`);
    return;
  }

  const wordCount = result.prompt.split(/\s+/).length;
  console.log(`✓ Prompt ready: ${wordCount} words (${result.prompt.length} chars)`);
  console.log(`  channel: ${result.metadata.channel} | sku: ${result.metadata.sku} | type: ${result.metadata.content_type}`);

  const draftPath = await saveDraft(result.prompt, result.metadata);
  console.log(`  draft: ${draftPath}`);

  if (verbose || promptOnly) {
    console.log(`\n────────────── GENERATED PROMPT ──────────────\n`);
    console.log(result.prompt);
    console.log(`\n──────────────────────────────────────────────\n`);
  }

  if (promptOnly) return;

  const imageMode = prefs.image_generation?.mode || "api";
  const args = ["--prompt-file", draftPath];
  if (imageMode === "manual") args.push("--mode", "manual");
  await runScript("scripts/generate-image.mjs", args);
}

async function cmdRegenerate() {
  try {
    const draft = JSON.parse(await fs.readFile("drafts/last-prompt.json", "utf-8"));
    console.log(`→ Regenerating from last description: "${draft.description}"`);
    await cmdGenerate(draft.description);
  } catch {
    console.error("❌ No previous draft found. Run a generation first.");
  }
}

async function cmdRefine(imagePath, changeText = "", askFn = null) {
  if (!imagePath) {
    console.error("Usage: node cli.mjs refine <image-path> <what to change>");
    return;
  }
  const prefs = await ensureInitialized();

  try {
    await fs.access(imagePath);
  } catch {
    console.error(`❌ Image not found: ${imagePath}`);
    return;
  }

  let change = (changeText || "").trim();
  if (!change && askFn) change = (await askFn("What should change? ")).trim();
  if (!change) {
    console.error('Provide what to change, e.g.  refine output/foo.png  "make the background navy"');
    return;
  }

  // gpt-image-2 edit endpoint: change ONLY X, preserve everything else. We edit
  // the actual pixels — no reverse-prompt round-trip, no regeneration drift.
  const editPrompt = buildEditPrompt({ requestedChanges: change });

  let lastDraft = {};
  try { lastDraft = JSON.parse(await fs.readFile("drafts/last-prompt.json", "utf-8")); } catch {}

  const slug = change.replace(/[^\w\s]/g, "").trim().split(/\s+/).slice(0, 3).join("-").toLowerCase() || "edit";
  const refineDraft = {
    description: `refine-${slug}`,
    channel: lastDraft.channel || null,
    sku: lastDraft.sku || null,
    edit: true,
    source_image: imagePath,
    reference_images: [imagePath],
    prompt: editPrompt,
    settings: lastDraft.settings || {},
    timestamp: new Date().toISOString(),
  };
  await fs.mkdir("drafts", { recursive: true });
  const draftPath = `drafts/refine-${Date.now()}.json`;
  await fs.writeFile(draftPath, JSON.stringify(refineDraft, null, 2) + "\n");

  console.log(`→ Editing ${imagePath} — change ONLY: ${change}`);

  const imageMode = prefs.image_generation?.mode || "api";
  if (imageMode === "manual") {
    console.log("\nManual mode can't auto-edit. In ChatGPT, attach the source image and paste:\n");
    console.log(editPrompt + "\n");
    return;
  }
  const argv = ["--prompt-file", draftPath];
  if (imageMode === "free-quota") argv.push("--mode", "free-quota");
  await runScript("scripts/generate-image.mjs", argv);
}

async function cmdConfig() {
  const prefs = await loadPrefs();
  console.log("\n=== Current Configuration ===\n");
  console.log(JSON.stringify(prefs, null, 2));
  try {
    const brandRaw = await fs.readFile("config/brand.yml", "utf-8");
    const brandLine = brandRaw.split("\n").find((l) => l.includes("name:"));
    console.log(`\nBrand config: config/brand.yml (${brandLine?.trim()})`);
  } catch {}
}

async function interactiveMode() {
  await ensureInitialized();

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║          Image Genius — Interactive Mode                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\nCommands:");
  console.log("  <description>          Generate image from description");
  console.log("  /regenerate            Regenerate from last description");
  console.log("  /refine <path> <change> Edit an existing image (change ONLY X)");
  console.log("  /prompt <desc>         Generate prompt only (no image)");
  console.log("  /config           Show configuration");
  console.log("  /init             Re-run setup wizard");
  console.log("  /exit or /quit    Leave\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => new Promise((r) => rl.question("ig> ", r));

  while (true) {
    const input = (await prompt()).trim();
    if (!input) continue;
    if (["/exit", "/quit"].includes(input)) break;

    try {
      if (input === "/regenerate") {
        await cmdRegenerate();
      } else if (input.startsWith("/refine")) {
        const rest = input.slice(7).trim();
        const [refinePath, ...changeParts] = rest.split(/\s+/);
        const ask = (q) => new Promise((r) => rl.question(q, r));
        await cmdRefine(refinePath, changeParts.join(" "), ask);
      } else if (input.startsWith("/prompt ")) {
        await cmdGenerate(input.slice(8).trim(), { promptOnly: true });
      } else if (input === "/config") {
        await cmdConfig();
      } else if (input === "/init") {
        await runScript("scripts/init.mjs", ["--reset"]);
      } else if (input.startsWith("/")) {
        console.log(`Unknown command: ${input}`);
      } else {
        await cmdGenerate(input);
      }
    } catch (err) {
      console.error(`\n❌ Error: ${err.message}\n`);
    }
  }

  rl.close();
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) return { mode: "interactive" };
  const cmd = args[0];
  switch (cmd) {
    case "init":   return { mode: "init" };
    case "doctor": return { mode: "doctor" };
    case "config": return { mode: "config" };
    case "regenerate": return { mode: "regenerate" };
    case "refine": return { mode: "refine", imagePath: args[1], change: args.slice(2).join(" ") };
    case "prompt-only": return { mode: "prompt-only", input: args.slice(1).join(" ") };
    default:
      return { mode: "generate", input: args.join(" ") };
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  switch (opts.mode) {
    case "interactive":  await interactiveMode(); break;
    case "init":         await runScript("scripts/init.mjs", ["--reset"]); break;
    case "doctor":       await runScript("scripts/doctor.mjs"); break;
    case "config":       await cmdConfig(); break;
    case "regenerate":   await cmdRegenerate(); break;
    case "refine":       await cmdRefine(opts.imagePath, opts.change); break;
    case "prompt-only":  await cmdGenerate(opts.input, { promptOnly: true }); break;
    case "generate":     await cmdGenerate(opts.input); break;
  }
}

main().catch((err) => {
  console.error(`\n❌ Fatal: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
