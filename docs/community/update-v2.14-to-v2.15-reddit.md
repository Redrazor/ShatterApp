# Reddit post — ShatterApp update v2.14 → v2.15.1

**ShatterApp v2.15.1 — Morgan Elsbeth added, Last Updated dates, mobile overhaul, and Custom builder card fixes**

Hey everyone, a few updates dropped this week on [shatterapp.com](https://shatterapp.com).

---

**🗡️ Morgan Elsbeth — SWP83: My Loyalty, My Life (v2.15)**

Morgan Elsbeth is now in the app as a Primary unit (New Republic era, Dathomirian / Nightsister / Galactic Empire tags). Her front card, ability card, and both stance cards are available. Order card is not yet released so that will be added when it is.

Stats: 8 SP · 2 FP · Durability 3 · Stamina 10

Her four abilities are extracted and visible in the Reference tab:

- **Fate Has Decided Our Next Move** [Tactic] — at the start of activation, look at the top card of your Order Deck and choose to put it on top (for movement) or bottom (to give allied Nightsister and Night Trooper units a Force token)
- **Manipulating Hand** [Active, ⊕⊕] — choose an enemy character within range 4 and force them to dash; you control where they go
- **You Will Die Here, Alone** [Innate] — adds 3 dice to melee attacks when the defender has no other enemies nearby
- **My Loyalty, My Life for the Sisterhood** [Reactive] — while not Wounded, pay Strained tokens instead of Force for allied units within 3; when she does Wound, one character may dash and make a 5-dice melee attack

**📅 Last Updated dates on unit profiles (v2.15)**

The old "Card Updated / Card Not Updated" badge on unit profiles has been replaced with a plain **Last Updated** date. Every unit in the app now has a date stamp. This should be a cleaner way to know when a profile was last touched.

---

**📱 Custom Builder mobile overhaul — 22 fixes (v2.14)**

The Custom builder had a lot of rough edges on phones and tablets. This release went through the whole thing methodically and fixed everything flagged:

- **Combat tree on touch** — long-press an icon to select it, then tap a cell to place it. Previously impossible on iOS Safari
- **Expertise delete** — the × badge is now always visible; was previously hover-only and invisible on touch
- **Retina canvases** — card previews now scale with device pixel ratio so text and edges are sharp on high-DPI screens
- **Touch targets** — every button across all four phases is now at least 44px (phase stepper, combat tree controls, faction picker, tag remove, ability delete, colour swatches)
- **Image compression** — large phone photos are scaled down to 1200px max before being stored, preventing slow redraws
- **Mobile layout** — form appears above preview on small screens, phase heading contrast raised, scale slider ranges unified
- **Export on mobile** — PDF download is now the first export option in the ProfileVisualModal (most reliable on iOS)
- **No more scroll lock** — panning a canvas no longer blocks page scroll on mobile

---

**🃏 Custom Builder card fixes (v2.15.1)**

A couple of bugs in the Custom builder were fixed:

- **Abilities card — progressive font scaling** — if you write a lot of ability text, the card now automatically reduces font and icon sizes across four tiers to keep everything visible. Previously long ability blocks would just get clipped off the bottom of the card.
- **Card previews on desktop** — all four phase card previews (front card, stats, abilities, stances) were rendering at their full intrinsic canvas size on desktop and overlapping surrounding content. They now scale correctly to fit their containers.

---

As always, if something is broken or a feature is missing just drop a comment or open an issue on GitHub. Thanks for the continued support.

shatterapp.com | github.com/Redrazor/ShatterApp
