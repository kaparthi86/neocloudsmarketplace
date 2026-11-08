# Decision records

Each record is a choice that is visible in the code on `main`. Dates are the repository dates of the change that locked the decision.

## ADR-001 — Control plane first, orchestrator later

**Date:** 16 Sep 2026, design record in PR #11. Still true on 8 Nov 2026.  
**Decision:** Ship a marketplace control plane: identity, catalog, reservation, and a thin host agent. Do not ship a cluster scheduler, a container runtime, or payouts in the first generation.  
**Why:** The unsolved problem is discovering unused accelerators and binding a reservation to a host that is actually up. Orchestration has incumbents.  
**Consequence:** A reservation ends in an SSH user on one host. It does not place a Kubernetes job.

## ADR-002 — Attestation and heartbeat are different proofs

**Date:** 15 Sep 2026, PR #7. Required proof tightened 24 Sep 2026.  
**Decision:** A live node must pass a challenge. The proof is `sha256(nonce:fingerprint)`. A later heartbeat is accepted only if the node is already live and the fingerprint matches. A heartbeat cannot promote an example or an unattested node.  
**Why:** Identity and liveness fail in different ways. One proof for both lets a stale or spoofed host stay in the catalog.  
**Consequence:** Availability is derived from attest, heartbeat TTL (default 90 seconds), and reservation conflicts.

## ADR-003 — Example inventory is a constant, not a seed

**Date:** 25 Sep 2026. Removed seeded demo rows in PR #14. Added fixed examples in PR #15.  
**Decision:** H100, A100, and TPU v5e examples live in `src/examples.js`. They are not database rows, they are not exclusive, and reserving one stores a note. It does not increment a fake reservation count and it does not open SSH. Live rows sort first.  
**Why:** The catalog has to show the product before a provider is online, and reviewers have to be able to tell the two apart.  
**Consequence:** Model preview is the same pattern: three cards, one fixed reply, `payment_collected: false`.

## ADR-004 — One SSH user per reservation

**Date:** 8 Oct 2026, PR #17.  
**Decision:** The agent creates `neo` plus the first ten hex characters of `sha256(reservation id)`, installs an ed25519 key, and deletes that user when the reservation is completed or cancelled, or when the heartbeat is stale. `NEO_SSH_PROVISION=0` skips the host account and still allows an ack for development. The private key is stored on the reservation and shown to the buyer while the reservation is active. It is not included in email.  
**Why:** A shared `neo` account would leave the previous buyer on the machine.  
**Consequence:** The agent will only delete usernames that match `^neo[a-f0-9]{10}$`.

## ADR-005 — Close a live hold when the agent goes quiet

**Date:** 8 Oct 2026, PR #17.  
**Decision:** A `pending_provision` or `active` reservation with a node is cancelled `agent_offline` when the node is missing or the live heartbeat is stale. If the window has already ended, the reservation completes instead. Example reservations have no node and are skipped. A pending hold that misses the provision window (default 15 minutes) cancels `provision_timeout` and the operator is mailed.  
**Why:** A buyer should not keep a hold on a host the provider has left.  
**Consequence:** Quiet-agent close applies only to live nodes.

## ADR-006 — Payments wait for a completed live job

**Date:** held since the early-access launch, restated when inference billing was removed on 25 Sep 2026.  
**Decision:** `paymentsEnabled` stays false. There is no Stripe route and no usage ledger. Listed `$/hr` values are catalog rates.  
**Why:** Charging against example rows, or against a reservation the agent never acked, would bill a machine the buyer did not receive.  
**Consequence:** Cost claims in this packet have no invoice behind them. See [08-cost-evidence.md](./08-cost-evidence.md).

## ADR-007 — One process, SQLite, starter instance

**Date:** 24 Sep 2026.  
**Decision:** A single Node.js process (engines `>=22`, no npm dependencies) persists JSON snapshots to SQLite. Production uses the Render starter plan and a 1 GB disk. The free plan sleeps and cannot hold the disk.  
**Why:** The first cohort is operator-sized. A second database, and a second service, would add an operations surface before there is a completed reservation.  
**Consequence:** Horizontal scale and Postgres are an explicit later decision, NC-106.

## ADR-008 — Remove surfaces that were not the product

**Date:** 25 Sep 2026, PR #14.  
**Decision:** Remove simulated chat completions, the public sample key, stub attestation, the leaderboard, the provider waitlist, and unused email verification. Keep key recovery and rotation.  
**Why:** Those surfaces let a reviewer believe a GPU had run, or that a waitlist was a supply pipeline.  
**Consequence:** The only model path left is the labeled preview in ADR-003.

## ADR-009 — Investor notes are a separate mailbox

**Date:** 1 Oct 2026, PR #16.  
**Decision:** Contact intent `investor` is stored in the operator inbox and, when mail is configured, sent to `NEO_INVESTOR_EMAIL` (default `investorsneoclouds@googlegroups.com`). General notes go to the operator address.  
**Why:** Investor mail and support mail are different readers.  
**Consequence:** The contact page lists both addresses.

## ADR-010 — The site does not carry a disclaimer strip

**Date:** 5 Nov 2026, PR #20.  
**Decision:** Remove the gold honesty banners and the matching sentences in page copy, reservation notes, and customer email. Leave the behavior: example rows stay simulated, and `paymentsEnabled` stays false.  
**Why:** The strip was a banner. The product behavior is enforced in the reservation and preview paths.  
**Consequence:** A reviewer should read the code and this packet, not a banner, to see what a row will do.
