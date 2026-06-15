/**
 * Meta-Prompt Builder
 *
 * Constructs the comprehensive instruction the CLI tool (Claude or Codex)
 * receives. The CLI is asked to act as a prompt engineer and produce a
 * structured English image generation prompt following our templates.
 */

import fs from "fs/promises";
import path from "path";

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
  logoPositionReferenceImages = [],   // NEW: explicit list of past-post paths
}) {
  const sharedRules = await safeRead("modes/_shared.md");
  const generateRules = await safeRead("modes/generate.md");
  const template = await safeRead(`templates/${contentType}.md`);

  // AminoVITAL is a regulated Health Supplement — load HSA text/claims compliance rules
  const avClaimsGuidelines = channel === "aminovital"
    ? await safeRead("modes/_av_claims_guidelines.md")
    : null;

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

  // Build a MANDATORY visual inspection block if there are position references
  const absPositionRefs = logoPositionReferenceImages.map((p) => path.resolve(p));
  const inspectionBlock = absPositionRefs.length > 0
    ? `
═══════════════════════════════════════════════════════════════════════
PRE-WORK — INSPECT LOGO POSITION REFERENCES
═══════════════════════════════════════════════════════════════════════

Before writing the logo clause, open and look at these past posts for SKU "${sku}"
(use your Read / image-viewing tool — don't guess):

${absPositionRefs.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}

From them, read off the logo's CORNER, WIDTH as % of canvas width, PADDING from
the edges, and TAGLINE arrangement. Write these NUMERICALLY into the prompt's
logo clause (e.g. "top-right corner, 14% of canvas width, 2.5% top / 2% right
padding, 'Eat Well, Live Well.' stacked above the mark") — not just "top-right".
If posts disagree, follow the MOST RECENT one (compare dates in filenames).
`.trim()
    : "";

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
${avClaimsGuidelines ? `
═══════════════════════════════════════════════════════════════════════
HSA TEXT & CLAIMS COMPLIANCE — MANDATORY FOR ALL ON-IMAGE TEXT
═══════════════════════════════════════════════════════════════════════
This is an AminoVITAL (Health Supplement) image. EVERY word of text rendered into the
image (headlines, sublines, callouts, numbers) MUST comply with these HSA rules. If the
user's requested wording violates a rule, rewrite it to the nearest compliant phrasing and
put ONLY the compliant version into the image prompt.

${avClaimsGuidelines}
` : ""}

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

${inspectionBlock}

═══════════════════════════════════════════════════════════════════════
USER REQUEST
═══════════════════════════════════════════════════════════════════════
"${userInput}"

═══════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════
Write ONE flowing English image-generation prompt following the template's
7-block order. This targets gpt-image-2, which rewards tight instructional
prompts, NOT the old "magic word" style. The prompt MUST:

1. Be 120-250 words total (hard cap ~300). Signal density over length — cut any
   clause that would not change the output. Do NOT pad to a word count.
2. OPEN WITH INTENT, e.g. "Create a premium product hero photograph of …".
   Never open with "Professional commercial …" or any praise adjective.
3. Name the product specifically (the SKU's full proper name).
4. Handle packaging by PRESERVING reference #1 in one line — do NOT re-describe
   the label surface-by-surface. ("Preserve the packaging exactly as in
   reference image #1 — every character, glyph, color and layout.")
5. Include the logo placement instruction (refer to the last reference image),
   stated numerically: corner, size as % of canvas width, padding, color rule.
6. Use hex codes ONLY for brand/accent colors and the logo — not for every prop.
7. Use ONE light direction + ONE color temperature. No multi-light studio rigs.
8. Use ONE style anchor. No stacked styles.
9. End with a SHORT negative clause of real exclusions only (e.g. "no text other
   than the packaging/logo, no hands or faces, no extra logos"). Do NOT write
   pre-gpt-image-2 noise like "no AI artifacts / no AI generation tells / no
   melted details".
10. Contain NO magic words anywhere: no "4K", "8K", "ultra detailed",
    "ultra-high resolution", "masterpiece", "trending on artstation",
    "300 DPI", "professional color grading", "commercial advertising quality".
11. Be ONE flowing prompt — the block names are YOUR scaffold and must NOT appear.

CRITICAL OUTPUT FORMAT:
- Output ONLY the final image generation prompt
- No preamble, no markdown code fences, no commentary
- Begin directly with "Create a …"
- The output will be piped directly to the image generation API

Generate the prompt now.`;
}

/**
 * Build a short change-ONLY / preserve edit prompt for the gpt-image-2 edit
 * endpoint. The existing image is the input, so we describe ONLY the change and
 * list what to preserve — we do NOT re-describe the whole image (that causes
 * drift). `extraPreserve` lets callers add scene-specific items to protect.
 */
export function buildEditPrompt({ requestedChanges, extraPreserve = [] }) {
  // Default anchors are the brand-critical elements that are rarely the thing
  // being changed. We deliberately leave OUT "the background" — it's a common
  // edit target, and listing it would contradict a background-swap request.
  const preserve = [
    "overall composition and framing",
    "the product and every character on its packaging",
    "the brand logo's position, size and color",
    "lighting direction and color temperature",
    "the overall color grade",
    ...extraPreserve,
  ];
  return `Edit the input image: change ONLY ${requestedChanges.trim()}. `
    + `Preserve exactly: ${preserve.join(", ")}. `
    + `Do not add or remove any other elements, do not restyle the scene, and do `
    + `not alter any text except the change described above.`;
}
