# Pantry App

A mobile-first pantry-aware recipe PWA. Track what you have, cook what's ready, plan your week, generate a smart shopping list, and monitor your nutrition — all offline-capable with no account required.

Built with **Next.js 16**, **Zustand** (localStorage persistence), **Tailwind CSS**, and **Groq AI** for recipe importing.

---

## Screenshots

### Pantry
> 📸 *Pantry screen showing staples as pills and regulars with Full/Half/Low level controls*

Track everything you keep at home across three tiers:
- **Staples** — always-on items (olive oil, spices, tinned tomatoes)
- **Regulars** — items you restock (eggs, yoghurt, lentils) with a Full / Half / Low indicator
- **Variables** — items you buy for specific recipes tracked by quantity (e.g. 300g red lentils)

---

### Recipes
> 📸 *Recipes list with cookability badges showing Ready or missing ingredient count*

Each recipe card shows a live **cookability badge** — green "Ready" if you have everything, or red "X missing" if not — calculated against your current pantry state.

- Search by title, description, or tag
- Filter by tag (vegetarian, batch-cook, quick, etc.)
- Import from URL or pasted text via Groq AI
- Create recipes manually with the + New button

---

### Recipe Detail
> 📸 *Recipe detail showing ingredient list with tier dots, servings scaler, and step-by-step instructions*

- **Servings scaler** — tap − / + to scale all ingredient amounts up or down
- **Missing ingredients banner** — lists exactly what's missing and why (not in pantry, level low, insufficient quantity)
- **Ingredient tier dots** — grey = staple, blue = regular, orange = variable
- Macro summary per (scaled) serving
- **Start Cooking** button launches Cook Mode

---

### Cook Mode
> 📸 *Cook mode showing a step with a countdown timer button*

Full-screen, distraction-free cooking experience:

- One step at a time with a progress bar
- **Step 1** shows a full ingredient checklist for your chosen serving count
- Steps with a duration show a **countdown timer** — tap ▶ to start, ⏸ to pause, ↺ to reset
- **Wake lock** keeps your screen on so it doesn't dim mid-cook
- Finishing a recipe automatically deducts used Variable quantities from your pantry

---

### Plan
> 📸 *Weekly planner grid with Breakfast/Lunch/Dinner rows and drag-and-drop meal slots*

Drag-and-drop weekly meal planner:

- 7-day grid (Mon–Sun) with Breakfast, Lunch, and Dinner slots
- Tap **+** in any slot to pick a recipe and serving count
- Drag a meal card to move it to a different day or slot
- **Batch Session panel** appears below when meals are planned — shows total servings needed per recipe, number of batches, and estimated time, so you can prep efficiently

---

### Shop
> 📸 *Shopping list grouped by category with checkbox items*

Smart shopping list generated from your week plan:

- Hit **Regenerate** (or Generate List) after planning meals
- Only lists what you actually need — items already in your pantry at sufficient levels are excluded
- Grouped by category: Produce, Tins & Cans, Grains & Legumes, Dairy & Eggs, Protein, Condiments & Spices
- Tap any item to check it off (strikethrough + dimmed)
- Progress counter shows how many items are ticked

---

### Nutrition
> 📸 *Weekly nutrition screen with macro and micro progress bars and gap alerts*

Weekly nutrition rollup calculated from your meal plan:

- **Macro bars** — Protein, Carbs, Fat, Fibre vs. weekly targets
- **Micro bars** — Iron, Calcium, Vitamin C, Vitamin D, B12, Zinc
- **Gap alerts** — amber banner if any nutrient is below 70% of the weekly target
- **Absorption hints** — contextual tips (e.g. "Add vitamin C-rich foods to improve iron absorption")

---

### AI Recipe Import
> 📸 *Import Recipe modal with From URL and Paste Text tabs*

Import any recipe from the web or a block of text:

- **From URL** — paste any recipe page link; the server fetches the HTML, strips it to clean text, and sends it to Groq
- **Paste Text** — paste raw text copied from anywhere (a blog, a photo transcription, a chat message)
- Groq (`llama-3.3-70b-versatile`) parses the content into the app's full Recipe schema — assigns ingredient tiers, detects step timers, estimates macros, infers tags
- A **preview screen** shows the full parsed recipe before saving — review ingredients, steps, and macros, then Save or Try Again

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Add your Groq API key

Create `.env.local` in the project root (already gitignored):

```env
GROQ_API_KEY=gsk_...
```

Get a free key at [console.groq.com](https://console.groq.com).

### 3. Run the dev server

```bash
npm run dev
```

Opens at [http://localhost:3001](http://localhost:3001).

---

## How It Works

### Pantry tiers

Every recipe ingredient is assigned a **tier** that determines cookability and shopping logic:

| Tier | Name | Examples | Cookability rule |
|------|------|----------|-----------------|
| 1 | Staple | olive oil, salt, garlic, spices | Must be in your Staples list |
| 2 | Regular | eggs, onions, lentils, yoghurt | Must be in Regulars at Full or Half level |
| 3 | Variable | red lentils 300g, chicken breast | Must be in Variables with sufficient quantity |

### Cookability check

The **Ready** / **X missing** badge on every recipe card is a live check against your pantry. It runs every time your pantry changes. Optional ingredients are excluded from the check.

### Shopping list generation

When you hit Regenerate on the Shop screen, the app:
1. Totals up all ingredients across your week plan (scaled to serving counts)
2. Subtracts what you already have in sufficient amounts
3. Outputs only the net shortfall, sorted by supermarket category

### Nutrition tracking

Macros and micros are summed across all planned meals for the week, scaled to each meal's serving count. Gaps are flagged at 70% of weekly targets based on standard dietary reference values.

### Data persistence

Everything is stored in `localStorage` under the key `pantry-app-v1` — no server, no account. Works fully offline after the first load. The PWA manifest and service worker allow it to be installed on your home screen.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand with localStorage persistence |
| Drag & Drop | @dnd-kit/core |
| AI import | Groq API (`llama-3.3-70b-versatile`) |
| PWA | Web App Manifest + Service Worker |

---

## Project Structure

```
src/
  app/
    pantry/          # Pantry management screen
    recipes/         # Recipe list, detail, new recipe form
      [id]/cook/     # Full-screen cook mode
    plan/            # Weekly meal planner
    shop/            # Shopping list
    nutrition/       # Weekly nutrition tracker
    api/
      import-recipe/ # Server route: fetch URL + Groq parse
  components/
    layout/          # BottomTabBar, ServiceWorkerRegistrar
    recipes/         # ImportRecipeModal
  hooks/
    useTimer.ts      # Countdown timer
    useWakeLock.ts   # Screen wake lock
    useIsCookable.ts # Pantry cookability check
  lib/
    types.ts         # All TypeScript interfaces
    store.ts         # Zustand store (all state + actions)
    defaults.ts      # Seed data (pantry + 2 starter recipes)
    cookable.ts      # Cookability logic
    shopping.ts      # Shopping list generation
    nutrition.ts     # Weekly nutrition aggregation
    wakeLock.ts      # Wake Lock API + nosleep.js fallback
    importExport.ts  # JSON export/import helpers
```

---

## PWA Installation

On mobile, tap **Share → Add to Home Screen** (iOS) or **Install App** (Android Chrome) to install as a standalone app with no browser chrome.
