/**
 * Prompt Engine — High-level orchestrator.
 */

import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

import {
  detectChannel,
  detectSku,
  detectContentType,
  verifyProductRefs,
  selectLogoFile,
} from "./channel-detector.mjs";
import { buildMetaPrompt } from "./meta-prompt-builder.mjs";
import { runCli } from "./cli-runner.mjs";

async function loadConfig() {
  return yaml.load(await fs.readFile("config/brand.yml", "utf-8"));
}

async function loadPrefs() {
  try { return JSON.parse(await fs.readFile("config/user-prefs.json", "utf-8")); }
  catch { return {}; }
}

function planLogoPlacement(channel, channelConfig) {
  if (channel === "aminovital") {
    const refs = channelConfig.logo_references || [];
    if (refs.length === 0) {
      // No reference posts yet — placeholder. User will populate logo_references.
      return {
        description: "[PLACEMENT TBD — no AminoVITAL reference posts configured yet] Place the logo in a position consistent with the brand's existing Instagram posts. Drop sample posts into assets/AV_Logo_Position_Reference/ and list them in brand.yml channels.aminovital.logo_references to enable auto-derivation",
        colorRule: "render the logo in WHITE on dark-toned backgrounds, or NAVY (#071D49) on light-toned backgrounds — the model selects based on the generated scene's tone",
      };
    }
    // References exist — instruct downstream LLM to inspect them
    return {
      description: `derive the placement (corner, size as % of canvas width, padding) by inspecting these past Instagram posts visually: ${refs.join(", ")}. Match exactly: same corner, same size, same padding`,
      colorRule: "render the logo in WHITE on dark-toned backgrounds, or NAVY (#071D49) on light-toned backgrounds — the model selects based on the generated scene's tone",
    };
  }
  // dryfoods / frozen — Ajinomoto global logo
  return {
    description: "top-right corner of the canvas, occupying approximately 12-15% of the canvas width, with approximately 3% padding from the top and right edges, including the 'Eat Well, Live Well.' tagline above the Aj mark",
    colorRule: "preserve the logo's exact red color and glyph shapes; do not recolour, distort, or skew",
  };
}

export async function generatePrompt(userInput, options = {}) {
  const config = await loadConfig();
  const prefs = await loadPrefs();

  const provider = options.provider || prefs.prompt_model?.provider || "claude";
  const model = options.model || prefs.prompt_model?.model || null;

  // Step 1: Detect channel
  let channel = options.channel || null;
  if (!channel) {
    const channelDetection = await detectChannel(userInput);
    if (channelDetection.confidence === "none") {
      return {
        ok: false,
        needsUserInput: {
          type: "channel",
          message: "I couldn't detect which channel this is for. Please specify.",
          options: Object.keys(config.channels || {}),
        },
      };
    }
    if (channelDetection.confidence === "low") {
      return {
        ok: false,
        needsUserInput: {
          type: "channel",
          message: `Multiple channels match. Please pick one.`,
          options: channelDetection.matches.map((m) => m.channel),
        },
      };
    }
    channel = channelDetection.channel;
  }

  const channelConfig = config.channels?.[channel];
  if (!channelConfig) return { ok: false, error: `Unknown channel: ${channel}` };

  // Step 2: Detect SKU
  let sku = options.sku || null;
  if (!sku) {
    const skuDetection = await detectSku(userInput, channel);
    if (skuDetection.confidence === "none") {
      return {
        ok: false,
        needsUserInput: {
          type: "sku",
          message: `Could not detect SKU for channel '${channel}'.`,
          options: Object.keys(channelConfig.skus || {}),
        },
      };
    }
    if (skuDetection.confidence === "low") {
      return {
        ok: false,
        needsUserInput: {
          type: "sku",
          message: `Multiple SKUs match. Please pick one.`,
          options: skuDetection.matches.map((m) => m.sku),
        },
      };
    }
    sku = skuDetection.sku;
  }

  const skuConfig = channelConfig.skus?.[sku];
  if (!skuConfig) return { ok: false, error: `Unknown SKU '${sku}' in channel '${channel}'` };

  // Step 3: Verify product refs
  const productRefs = await verifyProductRefs(channel, sku);
  if (!productRefs.ok) {
    return { ok: false, error: `${productRefs.error}\n\nPlace product photos at ${productRefs.dir} and try again.` };
  }

  // Step 4: Content type
  const contentType = options.contentType || detectContentType(userInput, channel);

  // Step 5: Plan logo
  const logoPlan = planLogoPlacement(channel, channelConfig);
  const logoFile = await selectLogoFile(channel, null);

  // Step 6: Build meta-prompt
  const metaPrompt = await buildMetaPrompt({
    userInput,
    channel,
    channelConfig,
    sku,
    skuConfig,
    contentType,
    productRefs,
    logoFile,
    logoPlacementDescription: `${logoPlan.description}. ${logoPlan.colorRule}`,
  });

  // Step 7: Call the CLI
  console.log(`\n→ Calling ${provider} CLI to generate prompt...`);
  const startTime = Date.now();
  let generatedPrompt;
  try {
    generatedPrompt = await runCli(provider, metaPrompt, { model });
  } catch (err) {
    return { ok: false, error: `CLI generation failed: ${err.message}` };
  }
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  done in ${elapsed}s (${generatedPrompt.length} chars, ~${generatedPrompt.split(/\s+/).length} words)`);

  const selectedProductRefs = productRefs.images.slice(0, 2);
  const referenceImages = [...selectedProductRefs];
  if (logoFile) referenceImages.push(logoFile);

  return {
    ok: true,
    prompt: generatedPrompt,
    metadata: {
      channel,
      sku,
      content_type: contentType,
      description: userInput,
      reference_images: referenceImages,
      product_reference_dir: productRefs.dir,
      logo_file: logoFile,
      provider,
      model,
      timestamp: new Date().toISOString(),
      settings: {
        model: prefs.image_generation?.model || config.defaults?.image?.model || "gpt-image-2",
        size: config.defaults?.image?.size || "1088x1360",
        quality: config.defaults?.image?.quality || "high",
      },
    },
  };
}

export async function saveDraft(prompt, metadata, file = "drafts/last-prompt.json") {
  const data = {
    description: metadata.description,
    channel: metadata.channel,
    sku: metadata.sku,
    content_type: metadata.content_type,
    prompt,
    reference_images: metadata.reference_images,
    timestamp: metadata.timestamp,
    provider: metadata.provider,
    model: metadata.model,
    settings: metadata.settings,
  };
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
  return file;
}
