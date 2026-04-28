# Custom Screen — Mobile UX Improvements

> Generated 2026-04-09 by 3 parallel mobile-ux-analyst agents.
> Overall verdict: **Needs significant mobile work.** 9 critical, 12 major, 11 minor issues.
>
> **Progress:** 22/22 done (Tier 1 complete, Tier 2 complete, Tier 3 complete) — branch `feature/custom-mobile-ux`

---

## Cross-Agent Consensus (flagged by all 3 agents)

| Issue | Impact |
|-------|--------|
| ProfileVisualModal hardcoded pixel widths overflow on mobile | Sharing/export flow broken on every phone |
| Phase stepper buttons are 32px (below 44px minimum) | Primary navigation control hard to tap |
| Combat Tree drag-and-drop has no touch fallback | Icon repositioning impossible on iOS Safari |

---

## Tier 1 — Fix Now (broken on mobile) ✅ COMPLETE

### ~~1. ProfileVisualModal responsive cards~~ ✅
- **File:** `src/components/custom/ProfileVisualModal.vue:209-239`
- **Problem:** Hardcoded `width: 240px` / `width: 360px` inline styles. The abilities card alone (360px) exceeds a 375px viewport. The two-card row needs 612px. Horizontal overflow clips cards and breaks PNG export.
- **Fix:** Replace fixed widths with `w-full max-w-[Xpx]` + `flex-col sm:flex-row` stacking. Cards stack vertically on mobile, side-by-side on tablet+.

### ~~2. Remove wheel `preventDefault` on mobile~~ ✅
- **File:** `src/components/custom/phase1/FrontCardPreview.vue:88-93`, `src/components/custom/phase2/StatsCardPreview.vue:57-62`
- **Problem:** Non-passive wheel listener with `preventDefault` locks all page scroll when a finger is over the canvas. No pinch-to-zoom support exists as a mobile alternative.
- **Fix:** Gate the non-passive wheel handler behind a pointer-type check, or make it passive on touch devices. The range slider already handles zoom on mobile.

### ~~3. Combat Tree touch support~~ ✅
- **File:** `src/components/custom/phase4/CombatTreeEditor.vue:167-197`
- **Problem:** HTML5 drag-and-drop does not fire on iOS Safari at all. Users can add icons but cannot reposition them on any touch device.
- **Fix:** Add long-press-to-select + tap-to-place mode as a touch fallback. Store a `touchMoveSource` ref, use `@touchstart` to set it, tapping another cell performs the swap.

### ~~4. Expertise icon delete: replace hover overlay~~ ✅
- **File:** `src/components/custom/phase4/ExpertiseSectionEditor.vue:331-334`
- **Problem:** Delete overlay uses `group-hover:opacity-100` — invisible on touch devices. The `@click` handler exists on the parent but users cannot discover the action.
- **Fix:** Show a persistent small "x" badge on each icon pill instead of a hover-only overlay.

---

## Tier 2 — Fix Soon (degraded but usable)

### ~~5. Increase all touch targets to 44px minimum~~ ✅
> Also fixed during validation: faction buttons `justify-center`, combat tree `overflow-x-auto w-full`, CombatNodePicker dropdown viewport clamping, ProfileVisualModal `items-start` + sticky header.
- **Phase stepper:** `CustomPhaseStepper.vue:35` — `w-8 h-8` (32px) → `w-11 h-11` (44px)
- **Combat tree clear buttons:** `CombatTreeEditor.vue:354` — `w-4 h-4` (16px) → enlarge hit area to 44px
- **SVG connection delete circles:** `CombatTreeEditor.vue:291` — `r="8"` (16px) → add invisible `r="20"` hit zone
- **Action buttons:** `CustomProfileCard.vue:67` — `py-1.5` (~32px) → `py-3` or `min-h-[44px]`
- **Tag remove buttons:** `StatsForm.vue:143` — ~12px → `w-5 h-5` with padding
- **Faction buttons:** `FactionPicker.vue:29` — `py-2` (~36px) → `py-3` (44px)
- **Remove-ability button:** `AbilitiesForm.vue:231` — `w-7 h-7` (28px) → `w-11 h-11`
- **Back button:** `CustomBuilder.vue:185` — ~20px → add `min-h-[44px] py-3`
- **Expertise color swatches:** `ExpertiseSectionEditor.vue:239` — `w-6 h-6` (24px) → `w-9 h-9`
- **Expertise number inputs:** `ExpertiseSectionEditor.vue:265` — `py-0.5` (~18px) → `py-2`
- **Modal action buttons:** `ProfileVisualModal.vue:243` — `py-2` (~30px) → `py-3` or `min-h-[44px]`

### ~~6. Add DPR scaling to canvas composables~~ ✅
- **Files:** `useCardCanvas.ts:7`, `useStatsCanvas.ts:7`, `useStanceCanvas.ts:19`
- **Problem:** Fixed pixel canvas dimensions (600, 900, 836) with no `devicePixelRatio` scaling. Text and edges are visibly blurry on retina phones (DPR 2-3).
- **Fix:** `canvas.width = cssW * Math.min(dpr, 2)` + `ctx.scale(dpr, dpr)`. Cap at 2x to limit GPU memory.

### ~~7. Cap `compressImage` resolution to 1200px max dimension~~ ✅
- **Files:** `FrontCardPreview.vue:47-58`, `ImageUploader.vue:51-64`
- **Problem:** A 48MP iPhone photo stores at full native resolution (8064x6048) as a base64 data URL in localStorage. Massive resolution mismatch with 600x900 canvas causes slow redraws.
- **Fix:** Scale down to max 1200px largest dimension before JPEG encoding. Sufficient for 600px canvas at 2x DPR.

### ~~8. Clamp all dropdown/popup widths to viewport~~ ✅
- **Expertise icon picker:** `ExpertiseSectionEditor.vue:349` — `w-80` (320px) clips off-screen
- **Symbol picker:** `AbilitiesForm.vue:273` — `w-72` (288px) clips on narrow screens
- **Fix:** Add `max-w-[calc(100vw-2rem)]` to both. Switch expertise picker to `right-0` anchor.

### ~~9. Stance stats: collapse to 2-col grid on mobile~~ ✅
- **File:** `StancesForm.vue:162-203`
- **Problem:** `grid-cols-5` produces ~52px cells at 375px. Labels are `text-[10px]` — illegible at arm's length.
- **Fix:** `grid-cols-2 sm:grid-cols-5` with abbreviated labels at `text-xs` (12px). Group as Ranged row + Melee row on mobile.

### ~~10. Fix `@mousedown.prevent` blocking touch on iOS~~ ✅
- **File:** `StatsForm.vue:191`
- **Problem:** `@mousedown.prevent` suppresses the `touchstart→click` chain on iOS Safari in some cases. Tag selection from dropdown may not register.
- **Fix:** Replace with `@pointerdown.prevent` (unified pointer events API).

### ~~11. Replace `confirm()` with inline confirmation UI~~ ✅
- **File:** `CustomBuilder.vue:163, 170`
- **Problem:** Native `confirm()` is blocked in PWA standalone mode and some iframe contexts. Breaks the Star Wars aesthetic.
- **Fix:** Inline `v-if="awaitingConfirm"` row below the trigger button with "Are you sure? Yes / Cancel".

---

## Tier 3 — Polish (minor friction)

### ~~12. Lazy-load canvas preloads by faction~~ ✅
- **File:** `useCardCanvas.ts:80-98`
- **Problem:** Eagerly preloads all 15 faction x unit-type template combinations (24 images total) on every cold mount. On 4G this front-loads megabytes before the user picks a unit type.
- **Fix:** Preload only current faction's 3 templates + era icons. Defer other factions to `requestIdleCallback`.

### ~~13. Suspend inactive phase canvas rendering~~ ✅
- **File:** `CustomBuilder.vue:416-479`
- **Problem:** Up to 4+ canvases with independent RAF loops remain active when their phases are dimmed to `opacity-40`. Causes jank on mid-range Android devices.
- **Fix:** Add a `visible` prop to preview components; short-circuit `render()` when phase is not active.

### ~~14. Gate `loadImageFresh` behind dev mode~~ ✅
- **File:** `useAbilitiesCanvas.ts:264-275`
- **Problem:** Cache-busting `fetch(..., { cache: 'reload' })` fires 29 network requests for inline icons in production on every faction change.
- **Fix:** `import.meta.env.DEV ? loadImageFresh : loadImage`

### ~~15. Add `inputmode="numeric"` to integer inputs~~ ✅
- **Files:** `FrontCardForm.vue:94-100`, `StancesForm.vue:162+`
- **Problem:** `type="number"` shows iOS numeric keypad with +/- and decimal — wrong for integer-only fields.
- **Fix:** `type="text" inputmode="numeric" pattern="[0-9]*"` shows clean numeric pad.

### ~~16. Fix mobile source order in Phase 1~~ ✅
- **File:** `CustomBuilder.vue:221-253`
- **Problem:** Preview canvas has `order-1 md:order-2`, form has `order-2 md:order-1`. On mobile the user sees an empty canvas first, form below — opposite of expected hierarchy.
- **Fix:** Swap so form is `order-1` on mobile (DOM source order), preview `order-2`.

### ~~17. Raise phase section heading opacity~~ ✅
- **File:** `CustomBuilder.vue:219, 292, 355, 409`
- **Problem:** `text-sw-text/40` (40% opacity) + `text-xs uppercase` is illegible on bright/OLED screens in sunlight. Fails WCAG AA 4.5:1 contrast.
- **Fix:** Raise to `text-sw-text/60` minimum.

### ~~18. Update "drag to reposition" hint for touch~~ ✅
- **File:** `ImageUploader.vue:143`
- **Problem:** "Drag to reposition" is mouse-only language. Touch users may not discover the pan gesture.
- **Fix:** Change to "Touch & drag to reposition" or detect pointer type.

### ~~19. Fix inconsistent scale slider ranges~~ ✅
- **Files:** `FrontCardPreview.vue:149` (0.1–5), `ImageUploader.vue:151` (1–3)
- **Problem:** Both sliders control the same `imageScale` field but have different min/max bounds. Slider position and stored value can mismatch.
- **Fix:** Standardize both to the same range.

### ~~20. CombatNodePicker dropdown: account for virtual keyboard~~ ✅
- **File:** `CombatNodePicker.vue:86-98`
- **Problem:** Dropdown positions using `getBoundingClientRect().bottom + 6`. When virtual keyboard opens, the dropdown renders behind it with no repositioning.
- **Fix:** Clamp `top` against `window.visualViewport?.height` and flip above trigger when it would clip.

### ~~21. Improve StancesForm tab bar at 320px~~ ✅
- **File:** `StancesForm.vue:123-139`
- **Problem:** Three tabs with `px-4 uppercase tracking-widest` at 320px viewport are at the truncation margin.
- **Fix:** `px-2 sm:px-4` for safety margin.

### ~~22. Surface PDF download as primary mobile export~~ ✅
- **File:** `ProfileVisualModal.vue:133-163`
- **Problem:** `html-to-image` toPng is unreliable on iOS Safari due to CORS/canvas security. `window.print()` afterprint event is unreliable on mobile.
- **Fix:** Move "Download PDF" (jsPDF path) to first position in the actions list on mobile — it is the most reliable export method.
