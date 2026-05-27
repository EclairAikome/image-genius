/**
 * CLI Runner — abstracts invocation of Claude CLI and Codex CLI.
 *
 * Both CLIs are run in non-interactive print mode with the meta-prompt
 * piped via stdin. The CLI's response is captured and cleaned.
 *
 * Authentication: both CLIs use whichever auth method the user has
 * configured (subscription login OR API key). The CLI handles auth
 * transparently — this module just spawns the process.
 */

import { spawn } from "child_process";

const DEFAULT_TIMEOUT_MS = 180_000;     // 3 min — for prompt generation
const IMAGE_GEN_TIMEOUT_MS = 600_000;   // 10 min — codex needs longer for image_gen tool + file ops

/**
 * Run a CLI command with the prompt piped via stdin.
 * Returns the cleaned stdout text.
 */
async function runCliWithStdin(command, args, input, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
    }, timeoutMs);

    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to launch '${command}': ${err.message}`));
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`'${command}' timed out after ${timeoutMs / 1000}s`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`'${command}' exited with code ${code}.\nstderr: ${stderr}`));
        return;
      }
      resolve(stdout);
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

/**
 * Strip common preamble/postamble that CLI tools sometimes add around
 * the actual response (markdown code fences, "Here's the prompt:" intros, etc.)
 */
function cleanCliOutput(raw) {
  let text = raw.trim();

  // Strip leading markdown code fence if present
  text = text.replace(/^```[a-zA-Z]*\n/, "");
  text = text.replace(/\n```\s*$/, "");

  // Strip common preamble phrases
  const preamblePatterns = [
    /^Here's the (?:image |final )?prompt[:\s]*\n+/i,
    /^Here is the (?:image |final )?prompt[:\s]*\n+/i,
    /^The (?:image |final )?prompt is[:\s]*\n+/i,
    /^Generated prompt[:\s]*\n+/i,
    /^Output[:\s]*\n+/i,
  ];
  for (const pattern of preamblePatterns) {
    text = text.replace(pattern, "");
  }

  return text.trim();
}

/**
 * Run Claude CLI in print mode. Uses subscription auth or API key
 * depending on how the user has configured `claude` CLI.
 */
export async function runClaude(prompt, options = {}) {
  const model = options.model || null;
  const args = ["-p"];
  if (model) {
    args.push("--model", model);
  }
  const raw = await runCliWithStdin("claude", args, prompt);
  return cleanCliOutput(raw);
}

/**
 * Run Codex CLI (OpenAI's official agent CLI) in non-interactive mode.
 * Uses Plus/Pro subscription or API key depending on user configuration.
 */
export async function runCodex(prompt, options = {}) {
  const model = options.model || null;
  const args = ["exec"];
  if (model) {
    args.push("--model", model);
  }
  // Use longer timeout for image generation tasks
  const timeoutMs = options.forImageGen ? IMAGE_GEN_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  // codex exec reads from stdin when no prompt argument is provided
  const raw = await runCliWithStdin("codex", args, prompt, timeoutMs);
  return cleanCliOutput(raw);
}

/**
 * Detect which CLIs are installed on this machine.
 * Returns { claude: bool, codex: bool, claudeVersion, codexVersion }.
 */
export async function detectInstalledClis() {
  const result = { claude: false, codex: false, claudeVersion: null, codexVersion: null };

  const check = (cmd) =>
    new Promise((resolve) => {
      const proc = spawn(cmd, ["--version"], { shell: true });
      let out = "";
      proc.stdout.on("data", (c) => (out += c.toString()));
      proc.on("error", () => resolve(null));
      proc.on("close", (code) => resolve(code === 0 ? out.trim() : null));
    });

  result.claudeVersion = await check("claude");
  result.claude = result.claudeVersion !== null;
  result.codexVersion = await check("codex");
  result.codex = result.codexVersion !== null;

  return result;
}

/**
 * High-level entry point — picks the right runner based on provider name.
 */
export async function runCli(provider, prompt, options = {}) {
  switch (provider) {
    case "claude":
      return runClaude(prompt, options);
    case "codex":
    case "gpt":
    case "openai":
      return runCodex(prompt, options);
    default:
      throw new Error(`Unknown CLI provider: ${provider}. Use "claude" or "codex".`);
  }
}
