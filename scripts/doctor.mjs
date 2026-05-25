import fs from "fs/promises";
import yaml from "js-yaml";

const checks = [];
const ok = (name) => checks.push({ name, status: "OK" });
const warn = (name, msg) => checks.push({ name, status: "WARN", msg });
const fail = (name, msg) => checks.push({ name, status: "FAIL", msg });

try {
  await fs.access(".env");
  const env = await fs.readFile(".env", "utf-8");
  if (env.includes("OPENAI_API_KEY=sk-")) {
    ok(".env — API key configured");
  } else if (env.includes("OPENAI_API_KEY=")) {
    warn(".env — API key may be placeholder", "Check that OPENAI_API_KEY has a valid key");
  } else {
    fail(".env — missing OPENAI_API_KEY", "Add OPENAI_API_KEY=sk-... to .env");
  }
} catch {
  fail(".env file missing", "Copy .env.example to .env and add your API key");
}

try {
  const raw = await fs.readFile("config/brand.yml", "utf-8");
  const config = yaml.load(raw);
  if (config.brand?.name) {
    ok(`brand.yml — brand: "${config.brand.name}"`);
  } else {
    warn("brand.yml — brand name empty", "Set brand.name in config/brand.yml");
  }
  if (config.defaults?.image?.model) {
    ok(`brand.yml — model: ${config.defaults.image.model}`);
  }
  const channels = Object.keys(config.channels || {});
  if (channels.length > 0) {
    ok(`brand.yml — ${channels.length} channels: ${channels.join(", ")}`);
  } else {
    warn("brand.yml — no channels defined", "Add channels to config/brand.yml");
  }
} catch {
  fail("config/brand.yml missing or invalid", "Check config/brand.yml syntax");
}

try {
  await fs.access("node_modules/openai");
  ok("Dependencies installed (openai)");
} catch {
  fail("Dependencies not installed", "Run: npm install");
}

try {
  await fs.access("node_modules/sharp");
  ok("Dependencies installed (sharp)");
} catch {
  fail("Dependencies not installed (sharp)", "Run: npm install");
}

try {
  await fs.access("assets/logo.png");
  ok("Logo file present (assets/logo.png)");
} catch {
  warn("No logo file", "Place your logo at assets/logo.png for automatic overlay");
}

try {
  await fs.access("drafts");
  ok("Drafts directory exists");
} catch {
  warn("Drafts directory missing", "Create drafts/ directory");
}

try {
  await fs.access("output");
  ok("Output directory exists");
} catch {
  warn("Output directory missing", "Create output/ directory");
}

console.log("\n=== Instagram Ops — Environment Check ===\n");
for (const c of checks) {
  const icon = c.status === "OK" ? "[OK]" : c.status === "WARN" ? "[!!]" : "[XX]";
  console.log(`  ${icon}  ${c.name}`);
  if (c.msg) console.log(`        -> ${c.msg}`);
}

const fails = checks.filter((c) => c.status === "FAIL");
const warns = checks.filter((c) => c.status === "WARN");
console.log(
  `\n  ${checks.length - fails.length - warns.length} passed, ${warns.length} warnings, ${fails.length} failures\n`
);

if (fails.length > 0) process.exit(1);
