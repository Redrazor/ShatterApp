---
name: stance-extract
description: >
  Use this skill when the user wants to extract combat stats from a unit's
  stance card(s) in the ShatterApp browser. Extracts ranged and melee attack/
  defense dice numbers and ranged range value for each stance. Data is saved
  to public/data/stances.json. Triggers on phrases like "extract stance stats
  for X", "read stance card numbers", "add stance data for unit Y", or when
  viewing a unit profile and the user asks to collect stance numbers.
version: 1.0.0
---

# Stance Extract Skill

Extracts combat stats from stance cards visible in the ShatterApp browser
and saves them to `public/data/stances.json`.

## Card Layout

The right-hand section of each stance card contains a 3-row × 2-column stat box:

```
┌─────────────────────┬──────────────────────┐
│  [gun icon + ⊕N]    │  [crossed swords]    │  ← weapon type headers
│  (ranged — range=N) │  (melee)             │
├─────────────────────┼──────────────────────┤
│  6  (dark chevron)  │  8  (dark chevron)   │  ← ATTACK DICE
├─────────────────────┼──────────────────────┤
│  5  (blue box)      │  5  (blue box)       │  ← DEFENSE DICE
└─────────────────────┴──────────────────────┘
```

- **Left column** = ranged attack. The top-left black box contains a gun icon and,
  if the unit can attack at range, a circled number `⊕N` = range value.
- **Right column** = melee attack. Identified by the crossed-swords icon.
- **Dark downward-pointing chevron/arrow** = attack dice count.
- **Blue/lighter box** = defense dice count.
- A **dash `–`** in an attack cell means the unit cannot attack with that weapon
  type in this stance (store as `null`).
- Range is shown as `⊕N` inside the gun header box. If absent (no circled number),
  store range as `null`.

## Units With Only One Stance

Some units have only one stance card (no `stance2` image path in characters.json).
In this case, extract and store a single stance object under `stances[0]`.
The Stance tab in the app will show only one card with no Flip button.

## Output Format

Data is stored in `public/data/stances.json`, keyed by `characterId` (number):

```json
{
  "1": {
    "characterId": 1,
    "name": "General Anakin Skywalker",
    "swpCode": "SWP01",
    "stances": [
      {
        "stanceNumber": 1,
        "stanceName": "Form V Djem So",
        "ranged": {
          "range": 4,
          "attack": 6,
          "defense": 5
        },
        "melee": {
          "attack": 8,
          "defense": 5
        }
      },
      {
        "stanceNumber": 2,
        "stanceName": "Form V Shien",
        "ranged": {
          "range": null,
          "attack": null,
          "defense": 6
        },
        "melee": {
          "attack": 7,
          "defense": 6
        }
      }
    ]
  }
}
```

- `stanceName` — the name shown in the top-right header of the stance card
- `ranged.range` — integer or `null` if no circled range number is shown
- `ranged.attack` — integer or `null` if cell shows `–`
- `ranged.defense` — integer (always present even if ranged attack is null)
- `melee.attack` — integer or `null` if cell shows `–`
- `melee.defense` — integer (always present)
- If a unit has no ranged column at all (very rare), set `"ranged": null`

## Step-by-Step Procedure

### 1. Identify the current unit

Check if the browser is on a unit profile page (`/browse/:id`).
- If yes — use that unit. Get character ID from the URL.
- If user named a unit — navigate to `/browse`, wait for load, click matching card.

Check `public/data/characters.json` to confirm whether `stance2` is populated
(non-empty string). This tells you whether to expect 1 or 2 stance cards.

### 2. Navigate to the Stance tab

```js
async (page) => {
  const stanceTab = page.getByRole('button', { name: 'Stance' });
  await stanceTab.click();
  await page.waitForTimeout(400);
}
```

### 3. Take a screenshot and extract Stance 1

Take a screenshot with `browser_take_screenshot`. Use vision to read:
- **Stance name** — top-right header text
- **Ranged column** (left): range from ⊕N in gun header, attack dice, defense dice
- **Melee column** (right): attack dice, defense dice

If the numbers are hard to read, click the ⛶ fullscreen button first.

### 4. Flip to Stance 2 (if applicable)

If the unit has `stance2` in characters.json:

```js
async (page) => {
  await page.getByText('↪ Flip').click();
  await page.waitForTimeout(400);
}
```

Take another screenshot and extract Stance 2 stats.

### 5. Present to user for validation

**Always stop and show the user the extracted data before saving.** Display as:

```
Extracted stance stats for **General Anakin Skywalker** (ID: 1, SWP01):

**Stance 1 — Form V Djem So**
  Ranged:  Range 4 | Attack 6 | Defense 5
  Melee:              Attack 8 | Defense 5

**Stance 2 — Form V Shien**
  Ranged:  Range — | Attack — | Defense 6
  Melee:              Attack 7 | Defense 6

Are these correct? Type YES to save, or correct any mistakes before I write the file.
```

**Do not write any files until the user confirms.**

### 6. Save to stances.json

Once the user confirms:

1. Read `public/data/stances.json` (start with `{}` if it doesn't exist)
2. Add/overwrite the entry for this character's ID
3. Write the updated file with the `Write` tool (pretty-printed JSON)

### 7. Confirm

> Saved stance stats for **General Anakin Skywalker** to `public/data/stances.json`.
> Ready for the next unit.

## Error Cases

| Situation | Action |
|-----------|--------|
| App not loaded / 0 units | Wait for API (cold start ~30s), retry |
| Numbers hard to read | Click ⛶ fullscreen button, re-screenshot |
| No Flip button on Stance tab | Unit has only 1 stance — confirm with characters.json |
| Unit has no ranged column | Set `"ranged": null` |
| Attack cell shows `–` | Store `null` for that attack value |
| Range cell shows no ⊕ number | Store `range: null` |
