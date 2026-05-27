/**
 * Meta-Prompt Builder
 *
 * Constructs the comprehensive instruction the CLI tool (Claude or Codex)
 * receives. The CLI is asked to act as a prompt engineer and produce a
 * structured English image generation prompt following our templates.
 */

import fs from "fs/promises";

async function safeRead(filePath) {
  try { return await fs.readFile(filePath, "utf-8"); }
  catch { return null; }
}

export async function buildMetaPrompt({
  userInput,
  channel,
  channelConfig,
  sku,
  skuConfig,
  contentType,
  productRefs,
  logoFile,
  logoPlacementDescription,
}) {
  const sharedRules = await safeRead("modes/_shared.md");
  const generateRules = await safeRead("modes/generate.md");
  const template = await safeRead(`templates/${contentType}.md`);

  const channelSummary = `
Channel: ${channel}
Instagram handle: ${channelConfig.instagram_handle}
Description: ${channelConfig.description}
Photography style: ${channelConfig.style?.photography_style || "(default)"}
Mood: ${channelConfig.style?.mood || "(default)"}
Primary brand colors: ${(channelConfig.style?.primary_colors || []).join(", ") || "(none specified)"}
Recurring elements: ${(channelConfig.style?.recurring_elements || []).join(", ") || "(none)"}
`.trim();

  const skuSummary = `
SKU id: ${sku}
SKU folder: ${skuConfig.dir}
Aliases: ${(skuConfig.aliases || []).join(", ")}
`.trim();

  const refsSummary = productRefs.images.length > 0
    ? `Product reference images (passed to image API; image MUST preserve packaging exactly as in reference #1):\n${productRefs.images.map((p, i) => `  [${i + 1}] ${p}`).join("\n")}`
    : "No product reference images.";

  const logoSummary = logoFile
    ? `Logo file (passed as LAST reference image):\n  ${logoFile}\nPlacement: ${logoPlacementDescription}`
    : "No logo configured for this channel.";

  return `You are an expert prompt engineer for AI image generation. Your job is to produce a single, structured English image generation prompt that will be passed directly to OpenAI's image generation API (gpt-image-2).

═══════════════════════════════════════════════════════════════════════
GLOBAL RULES
═══════════════════════════════════════════════════════════════════════
${sharedRules || "(shared rules not loaded)"}

═══════════════════════════════════════════════════════════════════════
GENERATE-MODE RULES
═══════════════════════════════════════════════════════════════════════
${generateRules || "(generate rules not loaded)"}

═══════════════════════════════════════════════════════════════════════
TEMPLATE TO FOLLOW (content type: ${contentType})
═══════════════════════════════════════════════════════════════════════
${template || "(template not loaded)"}

═══════════════════════════════════════════════════════════════════════
CHANNEL CONTEXT
═══════════════════════════════════════════════════════════════════════
${channelSummary}

═══════════════════════════════════════════════════════════════════════
SKU CONTEXT
═══════════════════════════════════════════════════════════════════════
${skuSummary}

═══════════════════════════════════════════════════════════════════════
REFERENCE IMAGES
═══════════════════════════════════════════════════════════════════════
${refsSummary}

${logoSummary}

═══════════════════════════════════════════════════════════════════════
USER REQUEST
═══════════════════════════════════════════════════════════════════════
"${userInput}"

═══════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════
Generate the complete image generation prompt following the template structure section-by-section. The prompt MUST:

1. Be 600-1200 words total
2. Be in fluent English
3. Follow every section of the template, in order, separated by periods
4. Name the product specifically (use the SKU's full proper name)
5. Instruct the model to preserve packaging exactly as in reference image #1
6. Include the logo placement instruction referring to the last reference image
7. Include hex codes for ALL colors mentioned
8. Include precise spatial descriptors (clock positions, frame percentages)
9. End with the negative prompt section
10. Be ONE flowing prompt — section headings are for YOUR structure but should NOT appear in output

CRITICAL OUTPUT FORMAT:
- Output ONLY the final image generation prompt
- No preamble, no markdown code fences, no commentary
- Begin directly with "Professional commercial..." or equivalent
- The output will be piped directly to the image generation API

Generate the prompt now.`;
}

export function buildRefineMetaPrompt({ originalPrompt, requestedChanges }) {
  return `You are a prompt engineer. Below is a detailed image generation prompt extracted from a reference image. The user wants to make TARGETED edits to it while keeping everything else identical.

═══════════════════════════════════════════════════════════════════════
ORIGINAL PROMPT (from reverse-engineering)
═══════════════════════════════════════════════════════════════════════
${originalPrompt}

═══════════════════════════════════════════════════════════════════════
REQUESTED CHANGES
═══════════════════════════════════════════════════════════════════════
${requestedChanges}

═══════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════
Apply ONLY the requested changes. Keep every other detail — colors, hex codes, positions, lighting, materials, props — IDENTICAL to the original.

OUTPUT FORMAT:
- Output ONLY the modified prompt
- No commentary, no markdown fences, no preamble`;
}
