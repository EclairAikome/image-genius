# Food Content — Prompt Template

## Template Structure

Generate the prompt by filling each section below IN ORDER. Do not skip any section.
Separate sections with periods. The final prompt should read as one cohesive paragraph.

### Section 1: Shot Type & Photography Style
```
Professional commercial food photography, {shot_type}, {lens_description}
```

**shot_type** options (pick the most appropriate):
- `overhead flat lay shot` — for plated dishes, bowls, ingredient spreads
- `45-degree angle shot` — for stacked/layered foods, burgers, sandwiches, tall drinks
- `eye-level close-up` — for texture details, cross-sections, pour shots
- `three-quarter angle` — default for most single-dish presentations

**lens_description** options:
- `50mm lens, f/2.8, shallow depth of field` — standard food photography
- `macro lens, extreme close-up, ultra-sharp detail` — for texture shots
- `35mm lens, wider composition` — for table scenes with multiple elements

### Section 2: Main Subject
```
{detailed_description_of_food}
```

Rules:
- Name the dish specifically (cuisine + dish name)
- Describe 3-5 visible ingredients/toppings
- Include texture descriptors (crispy, creamy, glistening, steaming, etc.)
- Include temperature cues (steaming, frosted, chilled, etc.)
- Example: "A steaming bowl of Japanese tonkotsu ramen with rich milky pork bone broth, topped with two slices of tender chashu pork, a perfectly soft-boiled ajitama egg cut in half revealing a runny golden yolk, sheets of dark nori seaweed, fresh chopped green scallions, and a swirl of chili oil on the surface"

### Section 3: Setting & Background
```
{surface_description}, {background_description}
```

**surface** options:
- `set on a rustic dark wooden table`
- `placed on a clean white marble countertop`
- `on a textured ceramic plate atop a linen tablecloth`
- `on a traditional woven bamboo mat`
- `on a modern slate serving board`

**background** options:
- `with a softly blurred kitchen background`
- `against a warm, out-of-focus restaurant interior with ambient lighting`
- `with a minimal, clean background in neutral tones`
- `with bokeh lights from a cozy dining atmosphere`

### Section 4: Composition & Framing
```
{composition_description}
```

Options:
- `Centered composition with the dish as the hero, rule of thirds applied`
- `Off-center composition with negative space on the left for text overlay area`
- `Symmetrical overhead arrangement with ingredients artfully scattered around the main dish`
- `Dynamic diagonal composition creating visual movement`

Note: if the user wants space for text/captions in the Instagram post, use the "negative space" option.

### Section 5: Lighting
```
{lighting_description}
```

Options:
- `Warm, natural window light coming from the left side, creating soft shadows and highlights on the food surface`
- `Dramatic side lighting with a warm golden tone, emphasizing texture and depth`
- `Bright, even overhead lighting with minimal shadows for a clean, modern look`
- `Warm backlight creating a golden rim around steam rising from the dish, with fill light from the front`

Default: first option (warm natural light) — most universally appealing for food.

### Section 6: Color Palette
```
{color_description}
```

Base: read `style.primary_colors` from brand config. Then add:
- `Warm earth tones with {brand_colors} accents` — for cozy, homey dishes
- `Vibrant, saturated colors highlighting the natural hues of fresh ingredients` — for salads, fruits
- `Rich, deep tones with golden and amber highlights` — for fried, roasted, baked foods
- `Clean, bright palette with white and green dominance` — for healthy, light dishes

### Section 7: Supporting Elements & Props
```
{props_description}
```

Pick 2-4 props that complement the dish:
- Utensils: chopsticks, wooden spoon, fork and knife, cooking spatula
- Vessels: ceramic bowl, cast iron skillet, wooden serving board, glass jar
- Ingredients: scattered herbs, whole spices, lemon wedges, garlic cloves
- Textiles: linen napkin, woven placemat, kitchen towel
- Garnish elements: fresh herb sprigs, sesame seeds, chili flakes

### Section 8: Atmosphere & Mood
```
{mood_description}
```

Read `style.mood` from brand config. Then expand:
- `Cozy, inviting, and appetizing atmosphere evoking the comfort of a home-cooked meal`
- `Elegant and sophisticated dining experience with a refined aesthetic`
- `Fresh, healthy, and vibrant energy suggesting wholesome ingredients`
- `Rustic, artisanal charm with handcrafted quality`

### Section 9: Technical Specifications
```
High resolution, ultra-sharp focus on the food, beautiful bokeh background, professional color grading, appetizing food styling, editorial quality suitable for magazine publication
```

This section is FIXED — always use this exact text.

### Section 10: Negative Prompt
```
Do not include: text, typography, letters, words, numbers, watermarks, logos, brand marks, signatures, human hands, human faces, blurry areas on the main subject, oversaturated unnatural colors, plastic-looking food, AI-generated artifacts, distorted utensils or plates
```

This section is FIXED — always use this exact text, appended after the main prompt.

## Complete Example Output

```
Professional commercial food photography, three-quarter angle shot, 50mm lens, f/2.8, shallow depth of field. A steaming bowl of Japanese tonkotsu ramen with rich milky pork bone broth, topped with two slices of tender chashu pork, a perfectly soft-boiled ajitama egg cut in half revealing a runny golden yolk, sheets of dark nori seaweed, fresh chopped green scallions, and a swirl of chili oil on the surface. Set on a rustic dark wooden table, against a warm, out-of-focus restaurant interior with ambient lighting. Centered composition with the dish as the hero, rule of thirds applied. Warm, natural window light coming from the left side, creating soft shadows and highlights on the food surface. Warm earth tones with amber and deep red accents complementing the rich broth. A pair of dark wooden chopsticks resting on a ceramic chopstick holder beside the bowl, a small dish of pickled ginger, and scattered sesame seeds on the table surface. Cozy, inviting, and appetizing atmosphere evoking the warmth of a traditional Japanese ramen shop. High resolution, ultra-sharp focus on the food, beautiful bokeh background, professional color grading, appetizing food styling, editorial quality suitable for magazine publication.

Do not include: text, typography, letters, words, numbers, watermarks, logos, brand marks, signatures, human hands, human faces, blurry areas on the main subject, oversaturated unnatural colors, plastic-looking food, AI-generated artifacts, distorted utensils or plates.
```
