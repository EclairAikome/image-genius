/**
 * Channel & SKU Detector — deterministic keyword matching.
 *
 * Reads channel keywords and SKU aliases from config/brand.yml and
 * matches them against user input. No LLM call needed for this step —
 * it's fast, deterministic, and gives us a confidence signal.
 */

import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

let cachedConfig = null;

async function loadBrandConfig() {
  if (cachedConfig) return cachedConfig;
  cachedConfig = yaml.load(await fs.readFile("config/brand.yml", "utf-8"));
  return cachedConfig;
}

function normalize(text) {
  return text.toLowerCase().trim();
}

export async function detectChannel(userInput) {
  const config = await loadBrandConfig();
  const normalized = normalize(userInput);

  const scores = {};
  for (const [channelId, channel] of Object.entries(config.channels || {})) {
    const keywords = channel.keywords || [];
    let score = 0;
    for (const kw of keywords) {
      const kwLower = normalize(kw);
      if (normalized.includes(kwLower)) {
        const wholeWordRegex = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        score += wholeWordRegex.test(userInput) ? 2 : 1;
      }
    }
    scores[channelId] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topChannel, topScore] = sorted[0];
  const [, secondScore] = sorted[1] || [null, 0];

  let confidence;
  if (topScore === 0) confidence = "none";
  else if (secondScore === 0) confidence = "high";
  else if (topScore >= secondScore * 2) confidence = "medium";
  else confidence = "low";

  return {
    channel: topScore > 0 ? topChannel : null,
    confidence,
    matches: sorted.filter(([, s]) => s > 0).map(([channel, score]) => ({ channel, score })),
  };
}

export async function detectSku(userInput, channelId) {
  const config = await loadBrandConfig();
  const channel = config.channels?.[channelId];
  if (!channel || !channel.skus) return { sku: null, confidence: "none", matches: [] };

  const normalized = normalize(userInput);
  const skuScores = {};

  for (const [skuId, sku] of Object.entries(channel.skus)) {
    const aliases = [skuId, ...(sku.aliases || [])];
    const matchedAliases = [];
    let score = 0;
    for (const alias of aliases) {
      const aliasLower = normalize(alias);
      if (!aliasLower) continue;
      if (normalized.includes(aliasLower)) {
        const wholeWordRegex = new RegExp(`\\b${aliasLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        const isWholeWord = wholeWordRegex.test(userInput);
        score += isWholeWord ? 3 : 1;
        matchedAliases.push({ alias, wholeWord: isWholeWord });
      }
    }
    if (score > 0) skuScores[skuId] = { score, matchedAliases };
  }

  const sorted = Object.entries(skuScores).sort((a, b) => b[1].score - a[1].score);
  const top = sorted[0];
  const second = sorted[1];

  let confidence;
  if (!top) confidence = "none";
  else if (!second) confidence = "high";
  else if (top[1].score >= second[1].score * 2) confidence = "medium";
  else confidence = "low";

  return {
    sku: top ? top[0] : null,
    confidence,
    matches: sorted.map(([sku, { score, matchedAliases }]) => ({ sku, score, matchedAliases })),
  };
}

export function detectContentType(userInput, channelId) {
  const text = normalize(userInput);

  const foodSignals = [
    "dish", "meal", "food", "cook", "recipe", "kitchen", "dining", "plate", "bowl",
    "ingredient", "fresh", "delicious", "tasty", "appetizing", "ramen", "rice",
    "soup", "noodle", "salad", "饺子", "拉面", "面", "汤", "炒", "煮", "饭", "菜",
    "餐", "美食", "料理", "fried", "grilled", "steamed",
  ];
  const lifestyleSignals = [
    "workout", "exercise", "gym", "running", "yoga", "fitness", "morning", "scene",
    "outdoor", "lifestyle", "activity", "training", "运动", "晨练", "户外", "瑜伽",
    "锻炼", "训练", "post-workout",
  ];
  const productSignals = [
    "product", "package", "packaging", "hero shot", "bottle", "sachet", "can",
    "pouch", "tube", "包装", "产品图", "产品照", "single product",
  ];

  const score = (signals) => signals.reduce((s, k) => s + (text.includes(k) ? 1 : 0), 0);
  const foodScore = score(foodSignals);
  const lifestyleScore = score(lifestyleSignals);
  const productScore = score(productSignals);

  if (channelId === "aminovital") {
    if (lifestyleScore >= productScore && lifestyleScore > 0) return "lifestyle";
    if (productScore > 0) return "product";
    return "product";
  }

  if (channelId === "dryfoods" || channelId === "frozen") {
    if (productScore > foodScore) return "product";
    return "food";
  }

  if (foodScore >= lifestyleScore && foodScore >= productScore) return "food";
  if (lifestyleScore >= productScore) return "lifestyle";
  return "product";
}

export async function verifyProductRefs(channelId, skuId) {
  const config = await loadBrandConfig();
  const channel = config.channels?.[channelId];
  const sku = channel?.skus?.[skuId];

  if (!channel || !sku) {
    return { ok: false, dir: null, images: [], error: `SKU ${skuId} not found in channel ${channelId}` };
  }

  const dir = path.join(channel.product_pictures_dir, sku.dir);
  try {
    const files = await fs.readdir(dir);
    const images = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .filter((f) => !f.toLowerCase().startsWith("thumbs"))
      .map((f) => path.join(dir, f));

    if (images.length === 0) {
      return { ok: false, dir, images: [], error: `No usable product images in ${dir}` };
    }
    return { ok: true, dir, images, error: null };
  } catch (err) {
    return { ok: false, dir, images: [], error: `Cannot read ${dir}: ${err.message}` };
  }
}

export async function selectLogoFile(channelId, sceneTone = null) {
  const config = await loadBrandConfig();
  if (channelId === "aminovital") {
    const avLogo = config.assets?.aminovital_logo || {};
    if (sceneTone === "dark") return avLogo.white || avLogo.navy;
    return avLogo.navy || avLogo.white;
  }
  return config.assets?.ajinomoto_logo;
}
