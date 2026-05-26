import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

const args = process.argv.slice(2);
const opts = {
  input: null,
  output: null,
  channel: null,
  logo: null,
  x: null,
  y: null,
  width: null,
  opacity: null,
};

for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  const val = args[i + 1];
  if (flag === "--input" && val) opts.input = val;
  if (flag === "--output" && val) opts.output = val;
  if (flag === "--channel" && val) opts.channel = val;
  if (flag === "--logo" && val) opts.logo = val;
  if (flag === "--x" && val !== undefined) opts.x = parseInt(val, 10);
  if (flag === "--y" && val !== undefined) opts.y = parseInt(val, 10);
  if (flag === "--width" && val !== undefined) opts.width = parseInt(val, 10);
  if (flag === "--opacity" && val !== undefined) opts.opacity = parseFloat(val);
}

if (!opts.input) {
  console.error(
    "Usage: node add-logo.mjs --input <image-path> [--output <path>] [--channel <name>] " +
    "[--logo <path>] [--x <px>] [--y <px>] [--width <px>] [--opacity <0-1>]"
  );
  process.exit(1);
}

const config = yaml.load(await fs.readFile("config/brand.yml", "utf-8"));

// Channel logo config provides defaults; CLI flags override.
let channelLogo = {};
if (opts.channel && config.channels?.[opts.channel]?.logo) {
  channelLogo = config.channels[opts.channel].logo;
}

const logoFile = opts.logo || channelLogo.file;
const logoWidth = opts.width ?? channelLogo.width ?? 160;
const posX = opts.x ?? channelLogo.position?.x ?? 50;
const posY = opts.y ?? channelLogo.position?.y ?? 50;
const opacity = opts.opacity ?? channelLogo.opacity ?? 1.0;

if (!logoFile) {
  console.error("ERROR: No logo path provided. Pass --logo <path> or --channel <name> with a configured logo.");
  process.exit(1);
}

try {
  await fs.access(logoFile);
} catch {
  console.error(`ERROR: Logo file not found at '${logoFile}'.`);
  process.exit(1);
}

const outputPath = opts.output || (() => {
  const parsed = path.parse(opts.input);
  return path.join(parsed.dir, `${parsed.name}-final${parsed.ext}`);
})();

console.log(`Input: ${opts.input}`);
console.log(`Logo:  ${logoFile} (width: ${logoWidth}px, position: ${posX},${posY}, opacity: ${opacity})`);

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

await sharp(opts.input)
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
