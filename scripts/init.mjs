/**
 * Image Genius — Initialization Wizard
 *
 * Flow:
 *   Step 1: Choose AI for prompt generation (Claude or GPT)
 *           → Launch that CLI's own login wizard
 *   Step 2: Choose image generation mode (free quota via OpenAI login, or API paid)
 *           → If free-quota and not already logged into OpenAI, launch codex for login
 *   Step 3: Show our custom welcome page
 */

import fs from "fs/promises";
import readline from "readline";
import { spawn } from "child_process";
import { detectInstalledClis } from "../lib/cli-runner.mjs";

const PREFS_PATH = "config/user-prefs.json";

async function loadPrefs() {
  try { return JSON.parse(await fs.readFile(PREFS_PATH, "utf-8")); }
  catch { return { initialized: false }; }
}

async function savePrefs(prefs) {
  await fs.writeFile(PREFS_PATH, JSON.stringify(prefs, null, 2) + "\n");
}

function makeRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

async function pickChoice(rl, prompt, options) {
  while (true) {
    const ans = (await ask(rl, prompt)).trim();
    const n = parseInt(ans, 10);
    if (n >= 1 && n <= options.length) return options[n - 1];
    console.log(`  Please enter a number 1-${options.length}.`);
  }
}

function runInteractive(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", shell: true });
    proc.on("close", (code) => resolve(code));
    proc.on("error", reject);
  });
}

function showWelcome(prefs) {
  const provider = prefs.prompt_model.provider;
  const mode = prefs.image_generation.mode;
  const providerLabel = provider === "claude" ? "Claude (Anthropic)" : "GPT (Codex)";
  const modeLabel = mode === "free-quota" ? "Free quota (OpenAI subscription)" : "API paid";

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██╗███╗   ███╗ █████╗  ██████╗ ███████╗                    ║
║   ██║████╗ ████║██╔══██╗██╔════╝ ██╔════╝                    ║
║   ██║██╔████╔██║███████║██║  ███╗█████╗                      ║
║   ██║██║╚██╔╝██║██╔══██║██║   ██║██╔══╝                      ║
║   ██║██║ ╚═╝ ██║██║  ██║╚██████╔╝███████╗                    ║
║   ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                    ║
║                                                              ║
║                G E N I U S      v 2 . 0                      ║
║                                                              ║
║   AI-powered Instagram content image creation                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║`);
  console.log(`║   ✓ Prompt CLI:    ${providerLabel.padEnd(40)}  ║`);
  console.log(`║   ✓ Image gen:     ${modeLabel.padEnd(40)}  ║`);
  console.log(`║                                                              ║
║   Try it now:                                                ║
║                                                              ║
║     imagegen "AminoVITAL Gold post-workout scene"            ║
║     imagegen regenerate                                      ║
║     imagegen refine output\\xxx.png                           ║
║                                                              ║
║   For interactive mode, just type:  imagegen                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

async function pressEnterToContinue(rl, msg = "Press Enter to continue...") {
  await ask(rl, `\n${msg}`);
}

async function main() {
  const reset = process.argv.includes("--reset");
  const prefs = await loadPrefs();

  if (prefs.initialized && !reset) {
    console.log("\n  Already initialized. Run with --reset to reconfigure.\n");
    console.log(`  Prompt CLI:      ${prefs.prompt_model?.provider}`);
    console.log(`  Image gen mode:  ${prefs.image_generation?.mode}\n`);
    return;
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║          Image Genius — Setup Wizard                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const clis = await detectInstalledClis();

  console.log("Step 1: Choose your AI for PROMPT generation\n");

  const providers = [];
  if (clis.claude) providers.push({ id: "claude", cmd: "claude", label: "Claude (Anthropic) — via Claude CLI" });
  if (clis.codex)  providers.push({ id: "codex",  cmd: "codex",  label: "GPT (OpenAI)       — via Codex CLI" });

  if (providers.length === 0) {
    console.log("❌ No AI CLI detected. Install at least one:");
    console.log("   npm install -g @anthropic-ai/claude-code");
    console.log("   npm install -g @openai/codex\n");
    return;
  }

  providers.forEach((p, i) => console.log(`  [${i + 1}] ${p.label}`));

  let rl = makeRl();
  const chosenProvider = await pickChoice(rl, `\n  Your choice (1-${providers.length}): `, providers);

  console.log(`\n→ Launching ${chosenProvider.cmd} CLI...`);
  console.log(`  Complete the login flow if it's your first time.`);
  console.log(`  When you see the CLI's welcome page, type /exit to return here.\n`);

  await pressEnterToContinue(rl, "Press Enter to launch...");
  rl.close();

  await runInteractive(chosenProvider.cmd);

  console.log("\n✓ Back to Image Genius setup\n");

  rl = makeRl();
  console.log("\nStep 2: Choose your IMAGE generation mode\n");

  const openaiAuthd = (chosenProvider.id === "codex");

  if (openaiAuthd) {
    console.log("  You're already authenticated with OpenAI via Codex.\n");
  } else {
    console.log("  Image generation requires OpenAI access. Pick one:\n");
  }

  const imageOptions = [
    { id: "free-quota", label: "Free quota — uses your OpenAI subscription (no per-image cost)" },
    { id: "api",        label: "API paid   — uses OPENAI_API_KEY from .env" },
  ];
  imageOptions.forEach((o, i) => console.log(`  [${i + 1}] ${o.label}`));

  const chosenImageMode = await pickChoice(rl, `\n  Your choice (1-${imageOptions.length}): `, imageOptions);

  if (chosenImageMode.id === "free-quota" && !openaiAuthd) {
    if (!clis.codex) {
      console.log("\n⚠  Free-quota mode requires Codex CLI for OpenAI authentication.");
      console.log("   Install: npm install -g @openai/codex");
      console.log("\n   Switching to API mode for now. Re-run init after installing codex.\n");
      chosenImageMode.id = "api";
    } else {
      console.log("\n→ Launching codex for OpenAI account login...");
      console.log("  Pick 'Sign in with ChatGPT' if you have a Plus/Pro plan.");
      console.log("  When done, type /exit to return here.\n");
      await pressEnterToContinue(rl, "Press Enter to launch...");
      rl.close();
      await runInteractive("codex");
      console.log("\n✓ Back to Image Genius setup\n");
      rl = makeRl();
    }
  }

  if (chosenImageMode.id === "api") {
    try {
      const env = await fs.readFile(".env", "utf-8");
      if (!env.includes("OPENAI_API_KEY=sk-")) {
        console.log("\n⚠  No valid OPENAI_API_KEY found in .env.");
        console.log("   Add: OPENAI_API_KEY=sk-... to .env before generating images.");
      }
    } catch {
      console.log("\n⚠  No .env file. Copy .env.example to .env and add OPENAI_API_KEY.");
    }
  }

  rl.close();

  const newPrefs = {
    initialized: true,
    prompt_model: { provider: chosenProvider.id, model: null },
    image_generation: { mode: chosenImageMode.id, model: "gpt-image-2" },
    notes: {
      provider_options: ["claude", "codex"],
      image_mode_options: ["free-quota", "api"],
      image_models: ["gpt-image-2", "gpt-image-1"],
    },
  };
  await savePrefs(newPrefs);

  showWelcome(newPrefs);
}

main().catch((err) => {
  console.error(`\n❌ Setup failed: ${err.message}`);
  process.exit(1);
});
