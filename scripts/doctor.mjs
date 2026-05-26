import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

const checks = [];
const ok = (name) => checks.push({ name, status: "OK" });
const warn = (name, msg) => checks.push({ name, status: "WARN", msg });
const fail = (name, msg) => checks.push({ name, status: "FAIL", msg });

// .env
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

// brand.yml
let config;
try {
  config = yaml.load(await fs.readFile("config/brand.yml", "utf-8"));
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

// Dependencies
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

// Brand logos
const ajiLogo = config?.assets?.ajinomoto_logo;
if (ajiLogo) {
  try {
    await fs.access(ajiLogo);
    ok(`Ajinomoto logo present (${ajiLogo})`);
  } catch {
    fail(`Ajinomoto logo missing at ${ajiLogo}`, "Place the Ajinomoto brand logo at the configured path");
  }
}

const avDark = config?.assets?.aminovital_logo?.dark;
if (avDark) {
  try {
    await fs.access(avDark);
    ok(`AminoVITAL logo (dark) present (${avDark})`);
  } catch {
    fail(`AminoVITAL dark logo missing at ${avDark}`, "Place the navy AV logo at the configured path");
  }
}


// Logo position reference dir
const refDir = config?.assets?.logo_position_reference_dir;
if (refDir) {
  try {
    const entries = await fs.readdir(refDir);
    const pngCount = entries.filter((f) => f.toLowerCase().endsWith(".png")).length;
    if (pngCount > 0) {
      ok(`Logo position references present (${pngCount} files in ${refDir})`);
    } else {
      warn(`No reference images in ${refDir}`, "Reference posts inform per-SKU logo placement");
    }
  } catch {
    warn(`${refDir} missing`, "Create the directory and add reference posts per SKU");
  }
}

// Product picture directories per channel
for (const [channelName, channel] of Object.entries(config?.channels || {})) {
  const dir = channel.product_pictures_dir;
  if (!dir) continue;
  try {
    const entries = await fs.readdir(dir);
    const subDirs = entries.filter((e) => !e.startsWith(".") && e !== "Thumbs.db");
    if (subDirs.length > 0) {
      ok(`Product pictures: ${channelName} (${subDirs.length} SKU folders in ${dir})`);
    } else {
      warn(`Product pictures: ${channelName} dir empty (${dir})`, "Add SKU subfolders with product images");
    }
  } catch {
    if (channelName === "frozen") {
      warn(`Product pictures: ${channelName} dir missing (${dir})`, "Will halt at generation time until SKU folder exists");
    } else {
      fail(`Product pictures: ${channelName} dir missing (${dir})`, "Create the directory and add SKU subfolders");
    }
  }
}

// Per-SKU folders inside each channel
for (const [channelName, channel] of Object.entries(config?.channels || {})) {
  const dir = channel.product_pictures_dir;
  const skus = channel.skus || {};
  if (!dir || Object.keys(skus).length === 0) continue;
  const missing = [];
  for (const [skuId, sku] of Object.entries(skus)) {
    if (!sku.dir) continue;
    try {
      const skuPath = path.join(dir, sku.dir);
      const files = await fs.readdir(skuPath);
      const usable = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
      if (usable.length === 0) missing.push(`${skuId} (folder empty)`);
    } catch {
      missing.push(`${skuId} (folder missing: ${sku.dir})`);
    }
  }
  if (missing.length === 0) {
    ok(`SKU coverage: ${channelName} — all ${Object.keys(skus).length} SKUs have product images`);
  } else {
    warn(`SKU coverage: ${channelName} — ${missing.length} missing`, missing.join("; "));
  }
}

// Drafts & output
try { await fs.access("drafts"); ok("Drafts directory exists"); }
catch { warn("Drafts directory missing", "Create drafts/ directory"); }

try { await fs.access("output"); ok("Output directory exists"); }
catch { warn("Output directory missing", "Create output/ directory"); }

// Render
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
