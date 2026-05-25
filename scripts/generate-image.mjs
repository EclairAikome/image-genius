import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import "dotenv/config";

const args = process.argv.slice(2);
let promptFile = "drafts/last-prompt.json";
let directPrompt = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--prompt-file" && args[i + 1]) promptFile = args[i + 1];
  if (args[i] === "--prompt" && args[i + 1]) directPrompt = args[i + 1];
}

const config = yaml.load(await fs.readFile("config/brand.yml", "utf-8"));
const defaults = config.defaults || {};

let prompt, description, channel;
let settingsOverride = {};

if (directPrompt) {
  prompt = directPrompt;
  description = directPrompt;
} else {
  const promptData = JSON.parse(await fs.readFile(promptFile, "utf-8"));
  prompt = promptData.prompt;
  description = promptData.description || "image";
  channel = promptData.channel;
  settingsOverride = promptData.settings || {};
}

const model = settingsOverride.model || defaults.image?.model || "gpt-image-1";
const size = settingsOverride.size || defaults.image?.size || "1024x1536";
const quality = settingsOverride.quality || defaults.image?.quality || "high";
const outputDir = defaults.output?.directory || "output";
const format = defaults.output?.format || "png";

if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const openai = new OpenAI();

console.log(`Channel: ${channel || "(none)"}`);
console.log(`Model: ${model}`);
console.log(`Size: ${size} | Quality: ${quality}`);
console.log(`Prompt preview: ${prompt.substring(0, 120)}...`);
console.log("Generating...");

let imageBuffer;

try {
  if (model.startsWith("gpt-image")) {
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
