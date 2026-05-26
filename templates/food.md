# Food Content — Enhanced Prompt Template

## Template Structure

Generate the prompt by filling ALL sections below IN ORDER. Each section is a flowing paragraph.
Separate sections with periods. The final prompt reads as one cohesive, ultra-detailed description.

**Target length: 600-1200 words.** Longer prompts produce more stable, reproducible results with gpt-image-2.

---

### Section 1: Shot Type & Camera Setup (30-50 words)
```
Professional commercial food photography, {shot_type}, {lens_spec}, {depth_of_field}
```

**shot_type** — pick the most appropriate:
- `overhead flat lay shot at exactly 90 degrees` — plated dishes, bowls, spreads
- `45-degree three-quarter angle shot` — most single-dish presentations
- `low eye-level shot at approximately 15-20 degrees above the surface` — stacked/tall items
- `straight-on eye-level shot at 0 degrees` — burgers, layer cakes, drinks

**lens_spec** — always include ALL of these:
- Focal length: `50mm` (standard), `85mm` (compression), `100mm macro` (detail)
- Aperture: `f/2.8` (shallow DOF), `f/4` (moderate), `f/5.6` (wider sharp zone)
- Sensor: `full-frame sensor`

**depth_of_field** — be specific:
- `shallow depth of field with the front edge of the dish tack-sharp and the background melting into smooth circular bokeh starting approximately 15cm behind the subject`
- `moderate depth of field keeping the entire dish sharp while the background blurs softly`

### Section 2: Primary Subject — Detailed Description (100-180 words)
```
{exhaustive_food_description}
```

**Rules for maximum stability:**
- Name the dish with full specificity: cuisine + regional variant + dish name
  - YES: "a bowl of authentic Hakata-style tonkotsu ramen with rich, opaque, ivory-white pork bone broth"
  - NO: "a bowl of ramen"
- Describe EVERY visible component from top to bottom:
  - Each topping: name, quantity, color, texture, placement
  - The vessel: shape, material, color, any patterns
  - Temperature cues: steam wisps, condensation, frost, melting
- Use measurable descriptors:
  - "two slices of chashu pork, each approximately 5mm thick, with caramelized edges showing Maillard browning"
  - "a soft-boiled ajitama egg cut precisely in half, the yolk a gradient from deep orange at the center (#E8731A) to pale yellow at the edges (#F5D76E), with a jammy, slightly fluid consistency"
- Specify exact colors with hex codes for key elements

### Section 3: Product Packaging (for branded products — 40-80 words)
```
{product_packaging_description}
```

**Only include this section if the image features a branded product.**
- Reference the FIRST reference image: "The product packaging exactly as shown in the first reference image"
- Describe: label colors, brand name placement, package shape, material (plastic, glass, foil)
- Instruction: "Preserve all text on the packaging exactly — do not alter, rearrange, or invent any characters or words on the label"

### Section 4: Secondary Objects & Props (60-100 words)
```
{props_description}
```

List 3-5 props with FULL specificity for each:
- **Exact position**: "to the left of the bowl, approximately 3cm away"
- **Material & finish**: "dark walnut wood chopsticks with a matte satin finish, tapered tips"
- **Size relative to subject**: "occupying roughly 15% of the frame width"
- **Color with hex**: "a small white ceramic dish (#F8F6F2) containing..."

### Section 5: Surface & Background (50-70 words)
```
{surface_description}. {background_description}
```

**Surface** — be exact:
- Material: "dark-stained solid oak table with visible wood grain running diagonally from bottom-left to top-right"
- Finish: "semi-matte finish with subtle sheen from the key light"
- Color with hex: "deep walnut brown (#3E2723)"

**Background** — specify blur:
- "Background at 2-meter distance, blurred to approximately f/2.8 bokeh"
- "Warm-toned out-of-focus shapes suggesting a restaurant interior with pendant lights creating circular bokeh highlights in warm amber (#FFB74D)"

### Section 6: Spatial Layout & Composition Grid (50-70 words)
```
{composition_description}
```

Use PRECISE placement language:
- "Main subject centered on the intersection of the upper-right rule-of-thirds gridlines, occupying approximately 55% of the total frame area"
- "Negative space in the lower-left quadrant, approximately 25% of the frame, allowing breathing room"
- Geometry: "overall triangular composition formed by the bowl, chopsticks, and sauce dish"

### Section 7: Lighting Rig — Full Specification (70-100 words)
```
{lighting_description}
```

Describe EVERY light source:
- **Key light**: "Diffused key light from the 10 o'clock position (upper-left), color temperature approximately 5000K (neutral daylight), creating a soft gradient of illumination across the food surface with the brightest point on the upper-left of the dish"
- **Fill**: "Subtle bounce fill from a white reflector at the 4 o'clock position, fill-to-key ratio approximately 1:3, lifting shadow density to around 25%"
- **Rim/back**: "Gentle warm backlight from 6 o'clock (directly behind), color temperature 3500K, creating a thin golden rim on rising steam and the back edge of the bowl"
- **Shadow character**: "Soft shadows with gradual falloff over approximately 3cm, shadow color slightly warm (#2D2016) rather than pure black"

### Section 8: Color Palette & Grading (50-70 words)
```
{color_palette_description}
```

List 5-7 dominant colors with:
- Hex code
- Coverage percentage
- Location in frame

Example: "Dominant palette: deep walnut brown (#3E2723, 30%, table surface), ivory white (#FFF8E7, 20%, broth and bowl), golden amber (#FFB74D, 10%, backlight highlights and broth sheen), fresh green (#4CAF50, 5%, scallion garnish), deep charcoal (#212121, 15%, nori and shadow areas). Overall warm color temperature shift of approximately +500K from neutral, medium-high saturation at approximately 70%, contrast ratio medium-high with lifted shadows."

### Section 9: Material & Texture Map (50-70 words)
```
{texture_description}
```

For EACH major surface:
- Reflectivity: matte, satin, glossy, mirror
- Texture detail: smooth, rough, granular, fibrous
- Special properties: translucency, wetness, condensation

Example: "Broth surface: high gloss reflectivity with visible oil droplets creating micro-specular highlights. Chashu pork: satin finish on the fat cap, matte on the lean meat with visible grain fibers. Ceramic bowl: smooth matte exterior with micro-texture glaze, glossy interior. Nori: matte with slight sheen, crisp rigid texture."

### Section 10: Atmospheric Effects (30-50 words)
```
{atmosphere_description}
```

- Steam: "Gentle wisps of steam rising from the broth surface, approximately 5-8cm high, soft white opacity at roughly 15-20%, backlit by the rim light creating a subtle golden glow within the steam"
- Ambient: "Very faint warm atmospheric haze adding 2-3% diffusion to the overall scene"
- Lens: "Subtle natural vignette darkening the corners by approximately 10%"

### Section 11: Mood & Style Anchor (30-40 words)
```
{mood_description}
```

Read `style.mood` from the channel's brand config. Expand into specific visual language:
- "Warm, inviting, and deeply appetizing atmosphere. The image evokes the comfort of a freshly prepared home-cooked Japanese meal. The overall style references editorial food photography as seen in premium culinary magazines."

### Section 12: Technical Quality Anchor (FIXED — always include)
```
Ultra-high resolution with every grain of rice and drop of condensation rendered in crisp detail. Tack-sharp focus on the primary subject with gradual optical falloff. Professional color grading with lifted shadows and controlled highlights. Studio-quality food styling with intentional but natural-looking arrangement. Publication-ready editorial quality suitable for premium brand social media and print advertising. No visual artifacts, no AI generation tells.
```

### Section 13: Negative Prompt (FIXED — always include)
```
Do not include: any text, typography, letters, words, numbers, or characters anywhere in the image. No watermarks, logos, brand marks, or signatures. No human hands, fingers, or faces. No blurry or out-of-focus areas on the main food subject. No oversaturated or neon-like unnatural colors. No plastic-looking or artificial food textures. No distorted plates, bowls, or utensils. No inconsistent perspective or warped geometry. No visible AI generation artifacts such as melted details, extra fingers on utensils, or impossible reflections.
```
