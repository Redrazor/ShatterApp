---
name: ability-extract
description: >
  Use this skill when the user wants to extract abilities from a unit's ability
  card (cardBack) in the ShatterApp browser. Each ability has a type determined
  by its leading icon. Extracted data is saved to public/data/abilities.json.
  Triggers on phrases like "extract abilities for X", "read abilities from card",
  "add abilities for unit Y", or when the user is viewing a unit profile and asks
  to collect its abilities.
version: 1.1.0
---

# Ability Extract Skill

Extracts unit abilities from the ability card visible in the ShatterApp browser,
classifies each by its icon type, reads the Force cost, and saves to `public/data/abilities.json`.

## Ability Icon Types

The 5 ability icon types that precede each ability name on the card:

| Type | Icon shape | File |
|------|-----------|------|
| `innate` | Oval with horizontal bar through centre (eye shape) | `public/images/icons/innate.png` |
| `active` | Downward arrow inside an oval | `public/images/icons/active.png` |
| `reactive` | Two circular arrows (recycling symbol) | `public/images/icons/reactive.png` |
| `tactic` | Cross / plus symbol inside an oval | `public/images/icons/tactic.png` |
| `identity` | Starburst / sun inside an oval with vertical lines | `public/images/icons/identity.png` |

When uncertain, use the `Read` tool to view the icon PNGs above for comparison.

## Force Cost

Force costs appear as **small circled numbers** (⊕) immediately after the ability name on the card.
- `innate` abilities: **always** `"cost": null` — they never have a Force cost.
- `active`, `reactive`, `tactic`, `identity` abilities: read the number of ⊕ symbols shown.
  Store as an integer (e.g. 1, 2, 3). If genuinely absent, store `null`.

## Output Format

Data is stored in `public/data/abilities.json`, keyed by `characterId` (number):

```json
{
  "1": {
    "characterId": 1,
    "name": "General Anakin Skywalker",
    "swpCode": "SWP01",
    "abilities": [
      {
        "name": "Force Jump",
        "type": "innate",
        "cost": null,
        "description": "Each character in this Unit may [jump]."
      },
      {
        "name": "I'm Going to End This",
        "type": "active",
        "cost": 2,
        "description": "After this Unit makes a combat action, it may use this ability..."
      },
      {
        "name": "Deflect",
        "type": "reactive",
        "cost": 1,
        "description": "After a melee attack targeting a character in this Unit is resolved, this Unit may use this ability. If the attack roll contained one or more block results, the attacking Unit suffers [damage][damage]."
      }
    ]
  }
}
```

- `name` — exact ability name as it appears on the card (preserve capitalisation)
- `type` — one of: `innate`, `active`, `reactive`, `tactic`, `identity`
- `cost` — integer Force cost (count ⊕ symbols after the name), or `null` for innate abilities
- `description` — full ability text, exactly as written on the card
- **All** inline symbols that appear as icons on the card must be written as `[icon_name]` tokens.
- **Always use the `Read` tool on the reference PNGs below if uncertain — do not guess.**

### Movement action icons (`public/images/icons/`)
| Token | Visual description |
|-------|--------------------|
| `[advance]` | Solid right-pointing filled chevron/arrow — simple single-step movement |
| `[jump]` | Curved arc arrow looping up and forward — like a leaping arc (NOT a straight arrow) |
| `[dash]` | Three stacked speed-line bars pointing right — fast multi-step move; use when card shows two advance arrows OR speed-burst symbol |
| `[reposition]` | Four-directional cross/plus arrows (up/down/left/right) — omnidirectional move while engaged |
| `[climb]` | Arrow pointing upward along a vertical surface |
| `[shove]` | Arrow pushing away from a figure |

### Force / resource icons
| Token | Visual description |
|-------|--------------------|
| `[force]` | Force pip / circled dot — the Force point spent to use abilities. Use `[force]` any time the card text references spending or refreshing Force points inline. |

### Status / effect icons
| Token | Visual description |
|-------|--------------------|
| `[damage]` | Orange lightning-bolt explosion/burst — jagged impact shape. Also used for tracked wound/damage tokens accumulated on a unit. |
| `[heal]` | Medical cross/plus with a small descending tick — looks like a bandage symbol |
| `[hunker]` | Upward-pointing open chevron/shield shape — like a defensive crouch marker |
| `[strained]` | Two orange flame/droplet shapes — fire/heat icon. Only use for the Strained condition token, NOT for general damage. |
| `[exposed]` | Large exclamation mark "!" — the Exposed condition |
| `[disarmed]` | Crossed-out weapon symbol |
| `[pinned]` | Pin/nail shape pointing down |

### Attack type icons
| Token | Visual description |
|-------|--------------------|
| `[ranged]` | Gun/blaster icon |
| `[melee]` | Crossed swords/blades icon |

### Dice result icons
| Token | Visual description |
|-------|--------------------|
| `[fail]` | X or blocked symbol — a failed attack result |
| `[block]` | Shield or deflect symbol |
| `[success]` | Hit/checkmark symbol |
| `[surge]` | Surge/special result symbol |

When uncertain of any icon, use the `Read` tool on `public/images/icons/<name>.png` to compare visually before deciding.

## Step-by-Step Procedure

### 1. Identify the current unit

Check if the browser is already on a unit profile page (`/browse/:id`).
- If yes — use that unit. Read the character ID from the URL.
- If the user named a unit — use `browser_run_code` to navigate to `/browse`,
  wait for units to load, click the matching unit card.

Get the character's `id`, `name`, and `swpCode` from `public/data/characters.json`.

### 2. Navigate to the ability card

Use `browser_run_code` to:
1. Ensure the **Card** tab is active (click it if not)
2. Check whether the card is showing the front (unit portrait) or back (ability list)
3. If the **front** is showing, click the `↪ Flip` button to reveal the ability card
4. Take a screenshot with `browser_take_screenshot`

```js
// Example: ensure ability card is visible
async (page) => {
  // Click Card tab if not active
  const cardTab = page.getByRole('button', { name: 'Card' });
  await cardTab.click();
  await page.waitForTimeout(300);
  // Flip to back if currently on front
  const flipBtn = page.getByText('↪ Flip');
  if (await flipBtn.isVisible()) await flipBtn.click();
  await page.waitForTimeout(400);
}
```

### 3. Extract the abilities using vision

Use the `Read` tool to read the screenshot image. Carefully examine each ability:

- Identify the **icon** to the left of the ability name → determine `type`
- Read the **ability name** (bold/capitalised text)
- Count the **⊕ symbols** after the ability name → `cost` (integer, or `null` for innate)
- Read the full **description text** below the name
- Repeat for all abilities on the card (typically 2–5 abilities)

If any icon is ambiguous, use the `Read` tool to view the reference icon PNGs
in `public/images/icons/` and compare visually.

If the card is too small to read clearly, take a screenshot of just the card element:
```js
async (page) => {
  const cardImg = page.locator('img').first();
  await cardImg.screenshot({ path: 'card-closeup.png' });
}
```

### 4. Present to the user for validation

**Always stop and show the user the extracted data before saving.** Display it as:

```
Extracted abilities for **General Anakin Skywalker** (ID: 1, SWP01):

1. [innate] **Force Jump** (cost: —)
   Each character in this Unit may [jump].

2. [active] **I'm Going to End This** (cost: ⊕⊕)
   After this Unit makes a combat action, it may use this ability. One character
   in this Unit may make an attack targeting one of the same enemy characters
   within range and LOS.

3. [reactive] **Deflect** (cost: —)
   After a [ranged] attack targeting a character in this Unit is resolved, this Unit
   may use this ability. If the attack roll contained one or more [fail] results,
   the attacking Unit suffers [damage][damage].

4. [active] **This Is Where the Fun Begins** (cost: ⊕⊕)
   When a character in this Unit Wounds an enemy Primary Unit or enemy Secondary
   Unit, after the effect is resolved, move the Struggle token one space toward your
   Momentum tokens. Then, if the Wounded Unit is a Primary Unit, each allied
   Galactic Republic character may [heal].

Are these correct? Type YES to save, or correct any mistakes before I write the file.
```

**Do not write any files until the user confirms.**

### 5. Save to abilities.json

Once the user confirms:

1. Read `public/data/abilities.json` (it may not exist yet — start with `{}` if missing)
2. Add/overwrite the entry for this character's ID
3. Write the updated file back with `Write` tool (pretty-printed JSON)

```js
// Merge logic (pseudocode)
const existing = readJsonOrEmpty('public/data/abilities.json')
existing[characterId] = {
  characterId,
  name: characterName,
  swpCode,
  abilities: [ /* extracted, each with name/type/cost/description */ ]
}
writeJson('public/data/abilities.json', existing)
```

### 6. Confirm and move on

Tell the user:
> Saved abilities for **General Anakin Skywalker** to `public/data/abilities.json`.
> Ready for the next unit whenever you are.

## Error Cases

| Situation | Action |
|-----------|--------|
| App not loaded / units show 0 | Wait for API (cold start ~30s), then retry |
| Card image is too small to read clearly | Screenshot just the card element (see step 3) |
| Ability icon is unclear | View reference icon PNGs with `Read` tool and compare |
| Force cost symbols hard to count | Screenshot just the card element at native resolution |
| User corrects an ability | Update your extracted list and ask for confirmation again |
| Character not found in characters.json | Ask user for the exact character name or ID |
