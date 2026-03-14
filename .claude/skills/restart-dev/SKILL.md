---
name: restart-dev
description: >
  Ensures both the Vite dev server and the Express/Socket.io API server for
  ShatterApp are running. First checks if both ports are already active — if so,
  confirms they are up without restarting. If either is missing, kills both ports
  and does a full restart via `npm run dev:all`.
version: 1.1.0
---

# Ensure Dev Servers Are Running

Do NOT ask for confirmation — execute all steps automatically.

## Steps

### Step 1 — Check if both servers are already running

```bash
lsof -ti :3001 > /dev/null 2>&1 && echo "API:UP" || echo "API:DOWN"
lsof -ti :5173 > /dev/null 2>&1 && echo "VITE:UP" || echo "VITE:DOWN"
```

- If **both** show UP → skip to Step 4 (just confirm to the user, no restart needed).
- If **either** shows DOWN → proceed to Step 2.

### Step 2 — Kill anything on ports 3001 and 5173

```bash
lsof -ti :3001 | xargs kill -9 2>/dev/null; lsof -ti :5173 | xargs kill -9 2>/dev/null
```

### Step 3 — Start both servers in the background, logging to `/tmp/shatter-dev.log`

```bash
npm run dev:all > /tmp/shatter-dev.log 2>&1 &
```

Wait 5 seconds, then tail the log to confirm both are up:

```bash
sleep 5 && tail -20 /tmp/shatter-dev.log
```

### Step 4 — Confirm to the user

- Vite is running on http://localhost:5173
- API server is running on http://localhost:3001
- Whether servers were already running or freshly started
- If freshly started, tell the user to **hard-refresh** the browser (Cmd+Shift+R / Ctrl+Shift+R) before testing
