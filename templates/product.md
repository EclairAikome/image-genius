# Product Content — Enhanced Prompt Template

## Template Structure

Generate the prompt by filling ALL sections below IN ORDER. Each section is a flowing paragraph.
Separate sections with periods. The final prompt reads as one cohesive, ultra-detailed description.

**Target length: 600-1200 words.**

---

### Section 1: Shot Type & Camera Setup (30-50 words)
```
Professional commercial product photography, {shot_type}, {lens_spec}, {depth_of_field}
```

**shot_type** options:
- `hero shot — the product centered on a clean surface with dramatic presence`
- `lifestyle product shot — the product in its natural use environment`
- `flat lay arrangement — product and accessories organized from directly above at 90 degrees`
- `dramatic low-angle shot at approximately 10-15 degrees — looking slightly upward at the product for imposing presence`

**lens_spec**:
- `100mm macro lens, f/5.6, tack-sharp detail across the entire product surface, full-frame sensor`
- `85mm lens, f/2.0, sharp product with smooth bokeh isolation, full-frame sensor`
- `50mm lens, f/4, clean neutral perspective, full-frame sensor`

**depth_of_field**:
- "The entire product surface from front label to back edge is rendered in razor-sharp focus, with the background dissolving into a smooth gradient starting approximately 10cm behind the product"

### Section 2: Product Description — Exhaustive Detail (120-200 words)
```
{exhaustive_product_description}
```

**Rules for maximum stability:**
- Reference the FIRST reference image explicitly: "The product exactly as shown in the first reference image"
- Describe EVERY visible surface of the product:
  - Package shape: sachet, bottle, box, can, tube — exact dimensions if known
  - Material: plastic film, glass, aluminum foil, cardboard, matte laminate, glossy shrink wrap
  - Colors: EVERY color on the packaging with hex codes
  - Text: describe visible text areas — "the brand name in [font style] across the upper portion, the product variant name below in [color]"
  - Finish: glossy, matte, metallic, holographic, textured emboss
- Orientation: "Product standing upright, label facing directly toward camera, tilted approximately 5 degrees to the right to show slight dimensionality"
- Condition: "pristine, factory-fresh, no dents, creases, or wear"
- Critical instruction: "Preserve every character, glyph, and design element on the packaging exactly as shown in the reference — do not alter, rearrange, add, or remove any label content"

### Section 3: Supporting Props & Context (50-80 words)
```
{props_description}
```

Pick 2-4 minimal, non-competing props:
- Each prop: exact name, material, color (#hex), finish, position
- "A single gold (#D4A84E) metallic sachet torn open at the top, placed at the lower-right at approximately 4 o'clock, contents partially visible — fine white crystalline powder"
- Size relationships: "props are intentionally smaller than the hero product, each at roughly 20-30% of the product's visual mass"

### Section 4: Surface & Background (60-80 words)
```
{surface_description}. {background_description}
```

**Surface**:
- "Clean, seamless surface in [specific color with hex], with subtle material texture visible: [marble veining / wood grain / brushed metal pattern / matte paper]"
- Reflectivity: "Semi-reflective surface creating a subtle, contact shadow and faint mirror reflection of the product base at approximately 10% opacity"

**Background**:
- "Smooth gradient background transitioning from [color A with hex] at the bottom to [color B with hex] at the top, with no visible seams or hard edges"
- OR: contextual background with specific blur

### Section 5: Spatial Layout & Composition Grid (50-70 words)
```
{composition_description}
```

- "Hero product placed at the vertical center, offset slightly left of horizontal center by approximately 5%, occupying 50-60% of the frame height"
- "Ample breathing room: minimum 15% negative space on all sides"
- Supporting props arranged to create visual balance without competing
- Geometry: "Clean vertical axis alignment with the product as the undisputed focal point"

### Section 6: Lighting Rig — Full Specification (80-120 words)
```
{lighting_description}
```

Product photography demands precise lighting:
- **Key light**: "Large softbox at the 10 o'clock position, approximately 45 degrees above horizontal, diffused to eliminate hard specular highlights on the packaging while maintaining readable contrast on text and design elements. Color temperature 5200K (neutral commercial daylight)"
- **Fill**: "Secondary fill from the 2 o'clock position at 1:4 ratio to key, preventing the shadow side from going completely dark, lifting shadow detail to approximately 20%"
- **Rim/edge**: "Thin edge light from directly behind at 6 o'clock, creating a fine 1-2px luminous outline separating the product from the background, especially visible on the product's silhouette edges"
- **Base light**: "Subtle upward bounce from the reflective surface, filling the underside of the product with soft, even light"
- **Shadow**: "Primary shadow falling to the lower-right, soft with 4-5cm gradual falloff, shadow color complementary to the background (#1A1A2E for dark backgrounds)"

### Section 7: Color Palette & Grading (50-70 words)
```
{color_palette_description}
```

For product shots, the palette must serve the product:
- List product colors first (the product IS the palette)
- Background and props chosen to complement, never compete
- "Overall color grade: neutral to slightly warm (+200K), saturation at accurate-to-life 75%, contrast medium-high to give the product dimensionality and shelf presence. Highlights clean and unclipped, shadows with subtle detail."

### Section 8: Material & Texture Map (60-80 words)
```
{texture_description}
```

Products demand material accuracy:
- "Package surface: [glossy laminate with visible light reflections following the curvature / matte finish absorbing light evenly / metallic foil with anisotropic reflections]. Sealed edges: crisp factory-sealed lines. Any transparent windows: showing contents behind with accurate refraction"
- Props materials: same level of detail
- Surface: reflectivity characteristics

### Section 9: Brand Color Integration (40-60 words)
```
{brand_color_integration}
```

**Channel-specific:**
- **aminovital**: "Accent elements in navy blue (#071D49) and warm metallic gold (#D4A84E) — these appear in background gradients, lighting rim color, or surface reflections, reinforcing the brand palette without overwhelming the product"
- **dryfoods/frozen**: integrate brand colors from config subtly into background or props

### Section 10: Atmospheric Effects (30-50 words)
```
{atmosphere_description}
```

- "Clean studio atmosphere with no visible haze or particles. Subtle rim-lit glow around the product creating a premium halo effect at approximately 5% intensity"
- For sports/energy products: "Dynamic energy suggested by subtle directional light streaks or gradient shifts implying motion, at approximately 8-10% opacity"

### Section 11: Mood & Style Anchor (30-40 words)
```
{mood_description}
```

Read `style.mood` from brand config. Expand:
- "Premium, aspirational, and commanding. The product is the undisputed hero of the frame, presented with the confidence and polish of a luxury brand campaign. Clean, modern commercial aesthetic."

### Section 12: Technical Quality Anchor (FIXED)
```
Ultra-high resolution with every label character, barcode, and design element rendered in razor-sharp detail. True-to-life color accuracy matching the reference product packaging. Professional retouching quality with clean gradients, no banding, and smooth tonal transitions. Commercial advertising quality suitable for e-commerce hero images, social media campaigns, and print advertising at 300 DPI. No visual artifacts, no AI generation tells.
```

### Section 13: Negative Prompt (FIXED)
```
Do not include: any text, typography, or characters NOT already present on the product packaging itself. No watermarks, no additional logos, no signatures. No human hands, fingers, or faces. No competing visual elements or busy backgrounds. No reflections that reveal studio equipment. No dust, scratches, or imperfections on the product (unless specifically requested). No inconsistent shadows or impossible reflections. No distorted product geometry or warped label text. No AI generation artifacts.
```
