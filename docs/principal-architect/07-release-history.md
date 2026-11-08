# Release history

**Date of this list:** 8 November 2026 (Pacific)  
**Versions:** Neo Clouds is early access. The agent reports `agent_version` `0.2.0`. The site has no separate semver. History below is the `main` merge history.

Screenshots and a demo recording are not in this repository. The capture list at the end is the set to attach. Do not backdate a screenshot to a release it does not show.

## Versions

| Version | Date | What changed |
|---|---|---|
| Marketplace split | 5 Sep 2026 | Standalone repo, GPU and TPU catalog, filters |
| Site | 9 Sep 2026 | Home, About, Contact, app moved to `/marketplace` |
| Live connect | 15 Sep 2026 | Agent attest, heartbeat, provision ack. Contact email. Cloudflare beacon added to public pages |
| Design record | 16 Sep 2026 | System design document |
| Launch ops | 24 Sep 2026 | Disk, operator inbox, rate limits, key recovery, reservation expiry |
| Scope cut | 25 Sep 2026 | Sample key, stub attest, leaderboard, waitlist, and unused inference removed |
| Examples | 25 Sep 2026 | Fixed H100, A100, TPU rows and three model previews |
| Investor path | 1 Oct 2026 | `investorsneoclouds@googlegroups.com` on contact |
| Access 0.2.0 | 8 Oct 2026 | Per-reservation SSH user, revoke, buyer mail, quiet-agent close |
| Hero | 8 Oct 2026 | Rack photograph, then the gold and blue rack row |
| Copy | 5 Nov 2026 | Honesty banners and the matching disclaimer sentences removed |

## Release notes

### 5 Nov 2026 — copy

The gold strips are gone from Home, Marketplace, About, Contact, the console, and the system-design page. Health and config no longer return banner text. Reservation notes and customer mail no longer carry the payment sentence. Example rows are still simulated. `paymentsEnabled` is still false. PR #20.

### 8 Oct 2026 — access

A live ack creates a Linux user for that reservation and returns the private key on the reservation. The agent deletes the user when the reservation completes, is cancelled, or the heartbeat is stale. The buyer is mailed when access is ready. The private key stays on the reservation page. PR #17. The same day, the home hero became a gold and blue rack row. PR #19.

### 1 Oct 2026 — investor contact

The contact page lists a general address and an investor address. Investor intent is mailed to `NEO_INVESTOR_EMAIL` when mail is configured. PR #16.

### 25 Sep 2026 — examples after the cut

Seeded demo inventory, the public sample key, stub attestation, the leaderboard, the provider waitlist, and the unused chat API were removed. Fixed example machines and canned model previews were then added so the catalog still shows the product. Live rows stay first. PR #14 and PR #15.

### 24 Sep 2026 — launch ops

The service moved to the Render starter plan with a disk. Accounts can recover and rotate keys. Reservations expire. The operator inbox can see contact notes without receiving API keys. PR #13 and PR #14.

### 15–16 Sep 2026 — a provider can connect a machine

`neo-agent` can attest, heartbeat, and ack. The system design document describes that control plane. PR #7 and PR #11.

### 5–9 Sep 2026 — the marketplace is its own product

The repo was split from Student AI Hub. The catalog gained hardware, workload, and price controls. Home, About, and Contact shipped. PR #1, PR #2, and PR #6.

## Screenshots and demo — not attached

Capture these against production or a build you name, and keep the date in the filename.

| File to add | Shows |
|---|---|
| `home-YYYY-MM-DD.png` | Home hero and the first section |
| `marketplace-listings-YYYY-MM-DD.png` | Live rows, if any, and the example rows beneath them |
| `marketplace-reserve-YYYY-MM-DD.png` | Reserve dialog |
| `marketplace-models-YYYY-MM-DD.png` | The three preview cards |
| `console-YYYY-MM-DD.png` | Provider console and the agent command |
| `reservations-YYYY-MM-DD.png` | A reservation after ack, with the key visible only in that capture's private archive |
| `demo-YYYY-MM-DD.mp4` | Register, attest, reserve, ack, and revoke |

Do not put a private key in a screenshot that leaves the operator's archive. A demo can show the user and host and redact the key.
