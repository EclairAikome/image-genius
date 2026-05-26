/**
 * Instagram Ops — Initialization Wizard
 *
 * Interactive setup for first-time users.
 * Configures prompt model, image generation mode, and validates environment.
 *
 * Usage: node scripts/init.mjs
 *        node scripts/init.mjs --reset   (re-run setup)
 */

import fs from "fs/promises";
import readline from "readline";

const PREFS_PATH = "config/user-prefs.json";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function loadPrefs() {
  try {
    return JSON.parse(await fs.readFile(PREFS_PATH, "utf-8"));
  } catch {
    return { initialized: false, prompt_model: {}, image_generation: {} };
  }
}

async function savePrefs(prefs) {
  await fs.writeFile(PREFS_PATH, JSON.stringify(prefs, null, 2) + "\n");
}

async function main() {
  const reset = process.argv.includes("--reset");
  const prefs = await loadPrefs();

  if (prefs.initialized && !reset) {
    console.log("\n  Already initialized. Run with --reset to reconfigure.\n");
    console.log(`  Prompt model:    ${prefs.prompt_model.provider} / ${prefs.prompt_model.model}`);
    console.log(`  Image gen mode:  ${prefs.image_generation.mode}`);
    console.log(`  Image model:     ${prefs.image_generation.model}\n`);
    rl.close();
    return;
  }

  console.log("\n=== Instagram Ops — Setup Wizard ===\n");

  // Step 1: Prompt generation model
  console.log("Step 1: Choose your PROMPT generation model\n");
  console.log("  [1] Claude  — Uses your Claude Code subscription (free with Pro/Max)");
  console.log("  [2] OpenAI  — Uses OpenAI API key (pay-per-use) or ChatGPT Plus (manual)\n");

  let provider;
  while (true) {
    const choice = (await ask("  Your choice (1 or 2): ")).trim();
    if (choice === "1") { provider = "claude"; break; }
    if (choice === "2") { provider = "openai"; break; }
    console.log("  Please enter 1 or 2.");
  }

  let promptModel;
  if (provider === "claude") {
    console.log("\n  Available Claude models:");
    console.log("  [1] claude-sonnet-4-20250514 (recommended — fast, high quality)");
    console.log("  [2] claude-opus-4-20250514   (slower, best reasoning)\n");
    const m = (await ask("  Your choice (1 or 2, default 1): ")).trim();
    promptModel = m === "2" ? "claude-opus-4-20250514" : "claude-sonnet-4-20250514";
  } else {
    console.log("\n  Available OpenAI models:");
    console.log("  [1] gpt-4.1       (recommended — best quality)");
    console.log("  [2] o4-mini       (fast reasoning)");
    console.log("  [3] gpt-4.1-mini  (fastest, cheapest)\n");
    const m = (await ask("  Your choice (1-3, default 1): ")).trim();
    promptModel = m === "2" ? "o4-mini" : m === "3" ? "gpt-4.1-mini" : "gpt-4.1";
  }

  // Step 2: Image generation mode
  console.log("\n\nStep 2: Choose your IMAGE generation mode\n");
  console.log("  [1] API mode    — Fully automated, calls OpenAI API directly");
  console.log("                    Costs ~$0.04-0.19 per image (gpt-image-2)");
  console.log("  [2] Manual mode — Generates prompt, copies to clipboard");
  console.log("                    You paste into ChatGPT to use Plus subscription (free)\n");

  let imageMode;
  while (true) {
    const choice = (await ask("  Your choice (1 or 2): ")).trim();
    if (choice === "1") { imageMode = "api"; break; }
    if (choice === "2") { imageMode = "manual"; break; }
    console.log("  Please enter 1 or 2.");
  }

  let imageModel = "gpt-image-2";
  if (imageMode === "api") {
    console.log("\n  Available image models:");
    console.log("  [1] gpt-image-2 (recommended — best quality, latest)");
    console.log("  [2] gpt-image-1 (older, slightly cheaper)\n");
    const m = (await ask("  Your choice (1 or 2, default 1): ")).trim();
    imageModel = m === "2" ? "gpt-image-1" : "gpt-image-2";
  }

  // Step 3: Validate environment
  console.log("\n\nStep 3: Validating environment...\n");

  let envOk = true;

  if (imageMode === "api" || provider === "openai") {
    try {
      const env = await fs.readFile(".env", "utf-8");
      if (env.includes("OPENAI_API_KEY=sk-")) {
        console.log("  [OK] OpenAI API key found in .env");
      } else {
        console.log("  [!!] OpenAI API key not found. Add OPENAI_API_KEY=sk-... to .env");
        envOk = false;
      }
    } catch {
      console.log("  [!!] .env file missing. Copy .env.example to .env and add your API key.");
      envOk = false;
    }
  }

  if (provider === "claude") {
    try {
      const env = await fs.readFile(".env", "utf-8");
      if (env.includes("ANTHROPIC_API_KEY=")) {
        console.log("  [OK] Anthropic API key found in .env");
      } else {
        console.log("  [!!] Anthropic API key not found in .env.");
        console.log("       If running inside Claude Code, this is fine (subscription is used).");
        console.log("       For standalone use, add ANTHROPIC_API_KEY=sk-ant-... to .env");
      }
    } catch {
      console.log("  [!!] No .env file. If running in Claude Code, this is OK for prompt gen.");
    }
  }

  // Save preferences
  prefs.initialized = true;
  prefs.prompt_model = { provider, model: promptModel };
  prefs.image_generation = { mode: imageMode, model: imageModel };
  await savePrefs(prefs);

  console.log("\n=== Setup Complete ===\n");
  console.log(`  Prompt model:    ${provider} / ${promptModel}`);
  console.log(`  Image gen mode:  ${imageMode}`);
  console.log(`  Image model:     ${imageModel}`);
  console.log(`\n  Preferences saved to ${PREFS_PATH}`);
  if (imageMode === "manual") {
    console.log("\n  Manual mode: prompts will be displayed for you to paste into ChatGPT.");
    console.log("  After generating in ChatGPT, save the image to output/ and tell the skill.\n");
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
