# Product roadmap

**Date:** 8 November 2026 (Pacific)  
**Horizon:** what has shipped, what the first market test still requires, and what stays later on purpose.

## Now — shipped on `main`

| Theme | Shipped |
|---|---|
| Catalog | Home, marketplace, hardware / workload / price filters, GPU and TPU |
| Supply | Live node registration, challenge attestation, heartbeat, provider console |
| Demand | API-key reserve, buyer reservation view, access details after ack |
| Access | Per-reservation SSH user, created on ack, removed when the hold ends, is cancelled, or the agent goes quiet |
| Trust | Operator inbox, key recovery and rotation, rate limits, durable SQLite |
| Catalog before supply | Fixed example machines and canned model previews, kept distinct from live nodes |
| Company | General and investor contact addresses |

## Next — first market test

The product can accept a live machine. The market test is not done until the operating measures in the PRD have recorded results.

1. Five providers with an attested node and a fresh heartbeat.
2. Three buyers who reserve a live machine and receive an ack.
3. One of those reservations reaches `completed`.
4. One provider lists a second time.
5. Payments stay off until a live reservation has completed.

## Later — after a completed live job

| Item | Why it waits |
|---|---|
| Payments and payouts | A charge before a completed live job would bill a path that has not been proven |
| Usage ledger for accelerator-hours | Needs completed live hours to reconcile |
| Containers and vLLM | The agent currently opens a host user. A workload runtime is a second product |
| Cluster scheduling across providers | The reservation is the contract. A planner can consume it later |
| Postgres | SQLite on a disk is enough for the first cohort |
| Device attestation from the accelerator vendor | Challenge proof binds the agent. Vendor quotes are a stronger identity layer |
| Scoped keys and OAuth | Bearer keys are the early-access credential |

## Sequence the architect is holding

Supply and host access come before demand campaigns. Demand campaigns come before payments. Payments come before a claim that Neo Clouds is a paid cloud. Model previews stay a catalog surface until a live machine actually runs a model.
