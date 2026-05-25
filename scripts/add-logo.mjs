import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

const args = process.argv.slice(2);
let inputPath = null;
let outputPath = null;
let channelName = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--input" && args[i + 1]) inputPath = args[i + 1];
  if (args[i] === "--output" && args[i + 1]) outputPath = args[i + 1];
  if (args[i] === "--channel" && args[i + 1]) channelName = args[i + 1];
}

if (!inputPath) {
  console.error("Usage: node add-logo.mjs --input <image-path> [--output <output-path>] [--channel <name>]");
  process.exit(1);
}

const config = yaml.load(await fs.readFile("config/brand.yml", "utf-8"));

let logoConfig;
if (channelName && config.channels?.[channelName]?.logo) {
  logoConfig = config.channels[channelName].logo;
} else {
  const firstChannel = Object.values(config.channels || {}).find((ch) => ch.logo);
  logoConfig = firstChannel?.logo || {};
}

if (!logoConfig || logoConfig === null) {
  console.log("This channel has no logo configured. Skipping.");
  process.exit(0);
}

const logoFile = logoConfig.file || "assets/logo.png";
const logoWidth = logoConfig.width || 120;
const posX = logoConfig.position?.x ?? 50;
const posY = logoConfig.position?.y ?? 50;
const opacity = logoConfig.opacity ?? 1.0;

try {
  await fs.access(logoFile);
} catch {
  console.error(`ERROR: Logo file not found at '${logoFile}'.`);
  console.error("Place your company logo at assets/logo.png and try again.");
  process.exit(1);
}

if (!outputPath) {
  const parsed = path.parse(inputPath);
  outputPath = path.join(parsed.dir, `${parsed.name}-final${parsed.ext}`);
}

console.log(`Input: ${inputPath}`);
console.log(`Logo: ${logoFile} (width: ${logoWidth}px, position: ${posX},${posY})`);

let logoBuffer = await sharp(logoFile)
  .resize({ width: logoWidth })
  .ensureAlpha()
  .toBuffer();

if (opacity < 1.0) {
  const opacityValue = Math.round(opacity * 255);
  const { width, height } = await sharp(logoBuffer).metadata();
  const opacityMask = Buffer.alloc(width * height, opacityValue);
  logoBuffer = await sharp(logoBuffer)
    .joinChannel(opacityMask, { raw: { width, height, channels: 1 } })
    .toBuffer();
}

await sharp(inputPath)
  .composite([
    {
      input: logoBuffer,
      left: posX,
      top: posY,
    },
  ])
  .toFile(outputPath);

console.log(`\nDone! Final image: ${outputPath}`);

const { size } = await fs.stat(outputPath);
console.log(`Size: ${(size / 1024).toFixed(0)} KB`);
