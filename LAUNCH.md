# Launch Neo Clouds at neocloudsmarketplace.com

Neo Clouds is a **separate product** from Student AI Hub. It gets its own GitHub repo, Render service, and domain.

**Canonical URL:** https://neocloudsmarketplace.com

See also: [PRODUCT.md](./PRODUCT.md)

---

## Overview

| Step | What |
|---|---|
| 1 | Standalone repo (not Student AI Hub) |
| 2 | Render web service `neo-clouds-marketplace` |
| 3 | DNS → `neocloudsmarketplace.com` |
| 4 | Verify `/api/health` |
| 5 | Share the link |

Do **not** deploy Neo Clouds using AI Hub’s root `render.yaml` or AI Hub’s domain.

---

## Step 1 — Standalone GitHub repo

Create a new repo, e.g. **`neo-clouds-marketplace`**, empty (no README).

**Private is fine.** Render can deploy from a private repo if your GitHub account is connected. Use private while you launch; switch to public later if you want others to fork the marketplace.

Public is only required if you want the “open-source GPU marketplace” pitch to include a public source repo. The product at **neocloudsmarketplace.com** works the same either way.

**If you are working in Cursor Cloud**, this environment cannot push to the private repo (GitHub token is only for Student-AI-Hub). Use this instead — the standalone tree is already on a public branch:

```bash
git clone --depth 1 -b cursor/neo-clouds-standalone-e68b https://github.com/kaparthi86/Student-AI-Hub.git neo-clouds-src
cd neo-clouds-src
git remote set-url origin https://github.com/kaparthi86/neo-clouds-marketplace.git
git push -u origin HEAD:main
```

That copies only Neo Clouds files (`src/`, `public/`, `render.yaml`) onto your private repo `main`.

Or, from this folder on a machine that can see the private repo:

```bash
./scripts/publish-standalone.sh https://github.com/kaparthi86/neo-clouds-marketplace.git
```

The repo root should contain `package.json`, `render.yaml`, `src/`, `public/` — not a nested `neo-clouds/` folder.

**Ongoing development:** work in the standalone repo, or sync from `neo-clouds/` in Student-AI-Hub when needed.

---

## Step 2 — Local smoke test

```bash
cp .env.example .env
node --test
npm start
```

Open http://localhost:8788 — listings, **Get API Key**, reserve.

---

## Step 3 — Deploy on Render (Neo Clouds only)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect **`neo-clouds-marketplace`** repo (not Student-AI-Hub)
3. Blueprint file: **`render.yaml`** at repo root
4. Service name: **`neo-clouds-marketplace`**
5. Root Directory: **leave blank** (repo root)
6. Blueprint plan is **starter** with a disk at `/var/data` (do not switch this service to free)

Environment (defaults in `render.yaml`):

| Variable | Launch |
|---|---|
| `NODE_ENV` | `production` |
| `CANONICAL_DOMAIN` | `neocloudsmarketplace.com` |
| `BETA_TESTING` | `0` |
| `NEO_DB_PATH` | `/var/data/neo-clouds.sqlite` |
| `ADMIN_API_KEY` | set in the dashboard (operator inbox) |
| `NEO_OPERATOR_EMAIL` | inbox that should receive contact mail |
| `NEO_INVESTOR_EMAIL` | `investorsneoclouds@googlegroups.com` for investor notes |
| `RESEND_API_KEY` + `NEO_MAIL_FROM` | or `NEO_MAIL_WEBHOOK_URL` instead |

The homepage always shows that nothing is charged. Optional `BETA_MESSAGE` overrides that wording. Do not add Stripe or checkout until you decide to bill.

---

## Step 4 — Custom domain

1. Render → **neo-clouds-marketplace** → **Settings → Custom Domains**
2. Add **`neocloudsmarketplace.com`** (and optionally `www.neocloudsmarketplace.com`)
3. At your domain registrar, add the DNS records Render shows
4. Wait for Verified + TLS

Pick one canonical host (apex or `www`) and redirect the other.

---

## Step 5 — Launch checks

```bash
curl -s https://neocloudsmarketplace.com/api/health
```

Expect:

- `"ok": true`
- `"service": "neo-clouds-marketplace"`
- `"canonicalDomain": "neocloudsmarketplace.com"`
- `"indexHtmlDeployed": true`

Browser:

- `/` — marketing home  
- `/marketplace` — GPU marketplace app  
- `/about.html`, `/contact.html`, `/console.html`  
- `/privacy.html`, `/terms.html`  
- **Get API Key** → reserve a listing whose agent is online

---

## Step 6 — Go live message

> **Neo Clouds** — open GPU marketplace  
> https://neocloudsmarketplace.com  
> Browse live GPU and TPU listings, get an API key, reserve compute.

---

## Step 7 — After real providers join

Provider flow: share **[/console.html](./public/console.html)**. **Get API Key (Provider)** → register a live node → neo-agent attest and heartbeat → listing. See [HARDWARE.md](./HARDWARE.md).

---

## Step 8 — Scale checklist

| Item | Action |
|---|---|
| Hosting | Blueprint uses Render **starter** so the process stays awake for 90s heartbeats |
| Persistence | SQLite on the blueprint disk at `/var/data`. Postgres before multi-instance traffic |
| Operator inbox | Set `ADMIN_API_KEY`, open `/admin` |
| Email | Set `RESEND_API_KEY` + `NEO_MAIL_FROM`, or `NEO_MAIL_WEBHOOK_URL`, and `NEO_OPERATOR_EMAIL` |
| Billing | Easy Billing Meter API (optional) |
| Real GPUs | SSH + vLLM on provider nodes |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| AI Hub page on your domain | Wrong Render service — domain must point to **neo-clouds-marketplace**, not student-ai-hub |
| `/` 404 | Render Root Directory must be blank for standalone repo |
| Empty listings | A provider must register a live node and keep neo-agent online |
| Domain not verifying | DNS propagation; match Render records exactly |
