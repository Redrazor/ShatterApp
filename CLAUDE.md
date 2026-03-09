# ShatterApp — Claude Code Instructions

## Feature Development Workflow (MANDATORY)

Every feature must follow this exact flow:

### 1. Branch
- One branch per feature block (e.g. `feature/v161-remove-gl-picker`, `feature/v170-keyword-glossary`)
- Branch from `main`

### 2. Implement
- Write the code for the feature

### 3. Validate
- List acceptance criteria for the feature
- Ask the user to manually validate before proceeding
- Do NOT advance until the user explicitly approves

### 4. Coverage gate
- Run `npm test` to confirm all tests pass
- Run `npm run test:coverage` to check coverage
- Coverage minimum: **75%** (if below, write tests until it passes)

### 5. Version bump + commit
- Bump `package.json` version per the plan (patch/minor/major)
- Add changelog entry to `src/components/ChangelogModal.vue`
- Commit (do NOT push)

### 6. PR + branch rotation
- Create a GitHub PR for the feature branch → main
- Checkout `main`
- Create the next feature branch

---

## Branch / Version Map (Phase 2)

| Branch | Version | Description |
|--------|---------|-------------|
| `feature/v161-remove-gl-picker` | v1.6.1 | Remove GL picker, go straight to mission |
| `feature/v170-keyword-glossary` | v1.7.0 | Keyword glossary tab in Reference view |
| `feature/v170-profile-modal-enhancements` | v1.7.0 | Unit profile modal: model names, order card, exclusion, extra cards |
| `feature/v180-conflict-explanation` | v1.8.0 | Build view: conflict tooltip explaining why unit is disabled |
| `feature/v180-compare-depth` | v1.8.0 | Compare modal: tags, era, stance count, keyword counts |
| `feature/v180-pack-contents` | v1.8.0 | Collection: "What's in this pack?" expand on ProductCard |
| `feature/v190-collection-stats` | v1.9.0 | Collection view completion stats (if not already shipped) |
| `feature/v190-view-tests` | v1.9.0 | View-level smoke tests (BrowseView, BuildView, CollectionView, PlayView) |
| `feature/v200-multiplayer` | v2.0.0 | WebSocket real-time multiplayer session sync |

---

## General Rules
- Read files before modifying them
- No speculative changes — only what the feature requires
- No pushing unless the user explicitly says to push
- Coverage threshold is 75% — if a feature causes it to drop below, add tests before committing
- Always check `npm test` passes before asking for manual validation
