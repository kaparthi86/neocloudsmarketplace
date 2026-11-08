# PRD — Neo Clouds Marketplace

**Status:** Early access, shipped  
**Owner:** Product and principal architect, Neo Clouds  
**Date:** 8 November 2026 (Pacific)  
**Canonical build:** `main` @ `1310d4d`

## Problem

AI teams need accelerators for a short window. Spare GPUs and TPUs sit in neo-clouds, labs, and colos while buyers wait on a hyperscaler quote. There is no open catalog that shows a specific machine, a listed hourly rate, and a way to reserve it only while that machine is actually online.

## Users

| User | Job |
|---|---|
| Provider | Put an idle GPU or TPU on one catalog and hand a buyer a host login for the reserved window |
| Buyer | Find a machine by accelerator, workload, region, and price, and receive access for a stated number of hours |
| Operator | Read contact notes, see which agents are heartbeating, and see which reservations are still open |

## Outcome

A buyer can reserve a live machine and receive a per-reservation SSH user. A provider can install one agent. The catalog can also show fixed example machines so the product is visible before the first live agent is attached.

## In this release

- Public catalog of GPU and TPU listings, filterable by accelerator type, workload tag, and price
- Customer and provider API keys, with recovery and rotation
- Provider console and `scripts/neo-agent.mjs` for register, attest, heartbeat, provision, and revoke
- Reservation lifecycle: queue, access, complete, cancel, provision timeout, quiet-agent close
- Fixed example listings: H100 SXM5 80GB, A100 80GB, TPU v5e
- Fixed model preview cards: Llama 3.1 70B Instruct, Llama 3.1 8B Instruct, Gemma 2 9B Instruct
- Operator inbox at `/admin`
- Contact for general notes and investor notes
- SQLite on a persistent disk, Render starter plan
- Privacy and terms

## Explicitly out of this release

- Card collection, checkout, escrow, and provider payouts
- A model call to any hosted LLM. Preview returns one fixed sentence
- Containers, vLLM, and a cluster scheduler
- Confidential computing
- A public sample API key, a leaderboard, a provider waitlist, and email-verification gating

## Success measures

These are the operating measures. No result is recorded in this packet.

| Measure | Definition |
|---|---|
| Live supply | Attested nodes whose heartbeat is inside the TTL |
| Time to first heartbeat | Provider account created to first fresh heartbeat |
| Ack rate | Live reservations that receive access, divided by live reservations created |
| Time to access | Reserve to provision ack |
| Clean completion | Live reservations that finish `completed`, divided by reservations that received access |
| Repeat supply | A provider who lists again |
| Agent-offline rate | Access that was closed because the heartbeat went stale |
| Provision-failure rate | Holds closed for timeout or because the window ended before access |
| Revoke completion | Closed live reservations whose host user was revoked |

**First market test, not a result:** five live nodes, three acknowledged reservations, one clean completion, one provider who lists again.

## Non-goals that protect the architecture

Availability is computed from attestation, heartbeat, and conflicting reservations. It is not a flag a provider can set. Example rows stay behind live rows on every sort. A heartbeat cannot turn an example into a live node.
