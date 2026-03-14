# ShatterApp — Claude Instructions

## Current Git Branch
Always check and state the current git branch at the start of any session or when performing
git operations. Run `git branch --show-current` if unsure. Never assume the branch.

---

## Feature Development Workflow (MANDATORY)

Follow this workflow **every time** a new feature is started. Do not skip or reorder steps.

### Step 1 — Present the feature for approval
Before writing any code, present the feature to the user:
- Feature name and number (from `future/future_features.md`)
- Key design points and implementation plan
- Any decisions or unknowns that need user input

**Wait for explicit user approval before proceeding.**

### Step 2 — Create a feature branch from main
```bash
git checkout main
git pull origin main
git checkout -b feature/<short-name>
```
Never start work on `main` or a stale branch.

### Step 3 — Implement the feature
Build the feature as approved. Follow all project patterns (see MEMORY.md).

### Step 4 — List acceptance criteria
When implementation is complete, present acceptance criteria as a numbered list using the format **AC1, AC2, AC3…** for the user to manually validate in the browser. Always use this format — never plain bullets or prose. Wait for the user to confirm all criteria pass.

### Step 5 — Run tests until green
```bash
npm test
```
Fix any failures before proceeding. Do not move on with red tests.

### Step 6 — Run coverage until ≥ 75%
```bash
npm run test:coverage
```
Write additional tests if coverage is below 75%. Do not move on until threshold is met.

### Step 7 — Commit, PR, and merge
```bash
git add <relevant files>
git commit -m "feat: ..."
git push origin feature/<short-name>
gh pr create ...
# After user approves PR:
gh pr merge --squash
```

### Step 8 — Version bump on main
After merge, switch to main, pull, then bump the version:
- **Patch** (bug fix / small tweak): `npm version patch`
- **Minor** (new feature): `npm version minor`
- **Major** (breaking change / big milestone): `npm version major`
- If unsure which to use, **ask the user**.

Then update:
1. `src/components/ChangelogModal.vue` — add entry at TOP of `entries[]`
2. `src/App.vue` footer — update version string (search `>v1.x.x</button>`)
3. Commit and push directly to main: `git push origin main`

---

## Key Workflows
See memory file for full project context and mandatory workflows (MEMORY.md).
