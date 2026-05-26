# Lifestyle Content — Enhanced Prompt Template

## Template Structure

Generate the prompt by filling ALL sections below IN ORDER. Each section is a flowing paragraph.
Separate sections with periods. The final prompt reads as one cohesive, ultra-detailed description.

**Target length: 600-1200 words.**

---

### Section 1: Shot Type & Camera Setup (30-50 words)
```
Professional lifestyle photography, {shot_type}, {lens_spec}, {depth_of_field}
```

**shot_type** options:
- `wide establishing shot capturing the full environment and activity context`
- `medium shot at approximately 2-3 meters from the scene, showing the activity with environmental context`
- `close-up detail shot focusing on hands, objects, or textures that tell the story`
- `overhead bird's-eye view at 90 degrees capturing a flat lay arrangement`

**lens_spec** — always include:
- Focal length: `35mm` (environmental), `50mm` (standard), `85mm` (subject isolation)
- Aperture: `f/2.0` (dreamy bokeh), `f/4` (moderate depth), `f/5.6` (scene clarity)
- Sensor: `full-frame sensor`

**depth_of_field** — be specific:
- "Shallow depth of field with the primary activity area tack-sharp and the environment gently dissolving into smooth circular bokeh beyond 1.5 meters"
- "Moderate depth of field keeping foreground props and midground activity in focus, with the background softening at approximately 3 meters"

### Section 2: Primary Scene Description (100-180 words)
```
{exhaustive_scene_description}
```

**Rules for maximum stability:**
- Describe the scene or activity WITHOUT human faces — focus on:
  - Hands, objects, environments, activities from a specific viewpoint
  - Objects in use (not static displays) to imply activity
- List EVERY visible element from foreground to background:
  - Each object: name, material, color (with hex), size, position
  - Surface textures and finishes
  - Temperature and tactile cues (sun-warmed, cool, crisp)
- Use measurable spatial relationships:
  - "A sage green yoga mat (#8FBC8F) unrolled diagonally from bottom-left to upper-right, occupying approximately 40% of the frame"
  - "A ceramic cup of matcha tea approximately 8cm in diameter, positioned at the upper-right third"

### Section 3: Product Integration (40-80 words)
```
{product_in_context_description}
```

**Only if a branded product appears in the scene:**
- Reference the FIRST reference image for packaging fidelity
- Describe how the product fits naturally into the scene (not forced or posed)
- Position: exact location relative to other elements
- "Preserve all text, logos, and label details exactly as shown in the first reference image"

### Section 4: Environment & Setting Detail (60-90 words)
```
{environment_description}
```

Describe the FULL environment with specificity:
- Architecture: "A modern apartment with floor-to-ceiling windows, white walls (#FAFAFA), light oak hardwood flooring (#D4A574)"
- Vegetation: "Three potted plants: a monstera deliciosa in a white ceramic pot on the left, a snake plant in a terracotta pot behind, and a small succulent on the windowsill"
- Furniture: materials, colors, style
- Distance and scale relationships between elements

### Section 5: Spatial Layout & Composition Grid (50-70 words)
```
{composition_description}
```

Use PRECISE placement:
- "Primary activity zone at the right-third intersection, occupying 45% of frame. Leading lines from the window frame draw the eye diagonally toward the subject"
- "Layered depth: foreground plant at 0.5m creating a natural frame on the left, midground activity at 2m, background window at 4m"
- Negative space location and percentage

### Section 6: Lighting Rig — Full Specification (70-100 words)
```
{lighting_description}
```

- **Key light**: "Natural window light entering from the right side at approximately the 3 o'clock position, soft and diffused through sheer white curtains, color temperature approximately 5500K (warm daylight), creating broad, even illumination with gentle gradients"
- **Fill**: "Natural ambient bounce from the white walls and ceiling, filling shadows to approximately 40% density, maintaining a soft, airy quality"
- **Practical lights**: any visible lamps, candles, or screens and their contribution
- **Shadow character**: "Very soft shadows with minimal edge definition, shadow color warm gray (#9E9E9E), deepest shadows at approximately 30% density"

### Section 7: Color Palette & Grading (50-70 words)
```
{color_palette_description}
```

List 5-7 dominant colors with hex, coverage %, and location:
- "Dominant palette: soft cream white (#FFF8E7, 35%, walls and ceiling), warm oak (#D4A574, 20%, flooring), sage green (#8FBC8F, 10%, yoga mat and plants), warm terracotta (#C97B5C, 8%, accent pot and throw), deep charcoal (#424242, 5%, accents). Overall lifted, bright color grade with shadows raised to approximately +20%, saturation at natural 65%, warm shift of +300K."

### Section 8: Material & Texture Map (50-70 words)
```
{texture_description}
```

For each major surface:
- "Oak flooring: satin finish with visible natural grain running horizontally, warm reflectivity catching window light. Yoga mat: matte non-reflective rubber texture with subtle diamond pattern. Ceramic mug: smooth glossy exterior glaze, matte unglazed base. Linen throw: soft woven texture with visible thread pattern, slightly crumpled naturally."

### Section 9: Atmospheric Effects (30-50 words)
```
{atmosphere_description}
```

- "Warm golden light filtering through the curtains creating visible soft light beams with dust motes catching the light at approximately 5% opacity. Subtle natural lens flare from the window edge. Minimal vignette, approximately 5% corner darkening."

### Section 10: Mood & Style Anchor (30-40 words)
```
{mood_description}
```

Read `style.mood` from brand config. Expand:
- "Calm, mindful, and intentionally lived. The image conveys a quiet moment of self-care and presence. Visual style references premium lifestyle editorials with a Scandinavian-meets-Japanese aesthetic."

### Section 11: Technical Quality Anchor (FIXED)
```
Ultra-high resolution with every texture rendered in crisp detail — thread count on fabrics, wood grain on surfaces, condensation on cold beverages. Natural-looking with no artificial staging visible. Professional color grading with lifted shadows, clean highlights, and natural skin-tone-friendly warmth. Lifestyle editorial quality suitable for premium brand social media and wellness publications. No visual artifacts, no AI generation tells.
```

### Section 12: Negative Prompt (FIXED)
```
Do not include: any text, typography, letters, words, numbers, or characters. No watermarks, logos, brand marks, or signatures. No visible human faces or identifiable people. No cluttered, messy, or distracting backgrounds. No harsh, unflattering, or fluorescent lighting. No overly staged, plastic, or stock-photo aesthetic. No forced product placement. No AI generation artifacts such as distorted objects, impossible geometry, or melted details.
```
