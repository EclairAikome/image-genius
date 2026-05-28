---
name: image-gen-rules
description: >-
  MANDATORY rules and operating procedure for running scripts/generate-image.mjs
  to create AminoVITAL / Instagram content images (image-genius / instagram-ops).
  This skill is BOUND to scripts/generate-image.mjs — it MUST be loaded and
  followed BEFORE running that script. Triggers: any request to generate, regenerate,
  refine, or "make" an Instagram / AminoVITAL / Ajinomoto product image, or any
  invocation of scripts/generate-image.mjs.
---

# Image generation rules (bound to `scripts/generate-image.mjs`)

**Before running `scripts/generate-image.mjs`, read and follow this whole file.**
These rules were learned the hard way over multiple sessions building the
AminoVITAL "Pre / During / Post" carousel. Skipping them wastes slow generation
cycles (~3 min each in free-quota mode).

## 0. How to run the script
- Edit the prompt JSON at `drafts/last-prompt.json` (fields: `description`,
  `channel`, `sku`, `content_type`, `prompt`, `product_reference_images`,
  `settings.size` = `1088x1360`), then run:
  `node scripts/generate-image.mjs`
- Mode comes from `config/user-prefs.json` (`free-quota` = codex relay, `api` =
  OpenAI `images.edit`). Output lands in `output/` (gitignored).

## 1. Workflow (user preferences — non-negotiable)
1. **One image at a time.** After each result, STOP and wait for the user to
   confirm before generating the next. Never batch a whole carousel.
2. **One SKU per image.** Even if the plan says "X or Y", split into separate slides.
3. **Never generate the logo.** Leave the brand logo to the user (added in post).
   Keep the **top-right corner clean/empty** on every slide for the AminoVITAL logo.
4. **Communicate in Chinese** (简体中文), including reasoning. (On-image copy stays English.)
5. **Don't over-engineer the script.** Make only the minimal change the user asks for.

## 2. Design / style
6. AV-HK "小清新": product **placed naturally on a surface** (NOT held in a hand),
   blurred shallow-DOF background, only **1–2** sport props, never cluttered.
7. **No small eyebrow/kicker microcopy** above the headline (looks cheap).
8. **Vary composition across slides** (position/angle/prop/headline placement) to
   avoid fatigue — but keep one system: gold `#D4A84E` + white type, and a bottom
   PRE / DURING / POST timeline with the active stage highlighted in gold.
9. **HSA compliance:** use "amino acid nutrition", "fuel", "supports the body".
   NEVER claim recovery/repair/"recover faster" or any efficacy/therapeutic effect.
10. **Packaging must come from the real product photo** in
    `assets/AV Product Picture/<SKU>/`, reproduced character-for-character
    (past failures: 3000→5000 mg, 14本→30本). Set `product_reference_images`.

## 3. Technical pitfalls & fixes
11. **Auto-logo creep:** don't mention any brand name in the prompt, reserve a
    clean top band, and scope negatives to "no added logo/wordmark in the margins".
    Negative prompts ALONE do not work.
12. **Gravity / physics:** an angled top-down view renders the table as a slope and
    objects look like they'll slide off. Specify a "level, horizontal, stable
    surface; objects rest flat and cannot slide".
13. **Picture-in-picture nesting:** codex sometimes insets a smaller image in a
    larger frame. Add "FULL BLEED, no nested frame / no picture-in-picture / no
    inner border / bleed off all four edges".
14. **Aspect-ratio ⇄ crop ⇄ stretch chain (most important):**
    - codex often outputs **2:3**; the script's free-quota size-normalization then
      center-crops to 4:5 and slices ~10% off top & bottom → kills the bottom
      timeline labels.
    - But forcing "STRICTLY 4:5, no 2:3" makes codex **stretch** content into 4:5
      → subjects look vertically elongated.
    - **Correct fix:** tell codex to use **natural, undistorted proportions (never
      stretch/squash/elongate)** AND keep all key content in a **central safe area**
      (top & bottom ~14% left as empty blurred background) so the script's `cover`
      crop (which preserves ratio, never stretches) trims only empty space to reach
      an exact 1088×1360.

## 4. The 3 script changes currently in `generate-image.mjs` (vs upstream)
- free-quota `[A]` product-reference instruction → image-to-image, packaging taken
  pixel-faithfully from the original, no redraw/retypeset.
- free-quota output **size normalization**: sharp `cover` center-crop to the exact
  `settings.size` (e.g. 1088×1360); prints `↳ normalized size A→B`.
- API `images.edit`: appends an IMAGE-TO-IMAGE requirement to the prompt so the
  packaging is reproduced from the original, not regenerated.
(Size normalization is free-quota only; API relies on OpenAI's `size` param.)
