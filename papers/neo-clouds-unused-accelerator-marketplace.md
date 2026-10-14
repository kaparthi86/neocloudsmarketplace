# Neo Clouds: An Open Marketplace for Unused Accelerators

**Preprint draft (systems / ML infrastructure)**  
**Authors:** [Your name], Neo Clouds  
**Affiliation:** Neo Clouds Marketplace (`neocloudsmarketplace.com`)  
**Correspondence:** hellonecoloudsmarketplace@googlegroups.com  
**Version:** 0.1 · September 2026  
**Suggested arXiv categories:** `cs.DC`, `cs.LG`, `cs.NI`

> **Honesty note for submission:** This draft is a *system design and research agenda* paper grounded in a working early-access marketplace. It does **not** yet claim large-scale production measurements. Sections marked **[Eval TBD]** should be filled with real traces before a top-tier conference submission.

---

## Abstract

Accelerator demand for training and inference has outpaced transparent, liquid supply outside hyperscalers. Simultaneously, large amounts of GPU and TPU capacity sit underutilized across neo-clouds, research labs, enterprises, and colocation facilities. Existing marketplaces either optimize for opaque bilateral deals, single-provider spot fleets, or crypto-settled decentralized networks that many ML teams will not adopt.

We present **Neo Clouds**, an open marketplace architecture that aggregates *unused* accelerators into a discoverable catalog organized by hardware, workload intent, and price, with an OpenAI-compatible inference surface and a provider agent protocol for live node attestation, heartbeat, and provision acknowledgment. The design goal is not another opaque cloud—it is a low-friction exchange that turns idle silicon into online capacity while remaining open-source and API-first.

We describe the problem framing, system architecture, trust model for live providers, and a research agenda for utilization, matching, pricing, and multi-tenant safety. We release the marketplace prototype at [neocloudsmarketplace.com](https://neocloudsmarketplace.com).

---

## 1. Introduction

Modern AI systems are bottlenecked by access to accelerators. Teams face three recurring failures of the status quo:

1. **Hyperscaler lock-in and quote friction.** Capacity exists, but procurement, region constraints, and opaque pricing slow iteration.
2. **Fragmented secondary supply.** Idle H100/A100/TPU fleets in labs, startups, and neo-clouds rarely appear in a single searchable market with workload-aware filters.
3. **Trust asymmetry.** Buyers need freshness (is the node actually online?) and identity (is the hardware what was listed?). Sellers need a thin integration path without rewriting their stack.

Neo Clouds targets the *unused → online* gap: make spare GPUs and TPUs listable, attest-able, and reservable through one open catalog, at transparent listed rates, with APIs builders already understand.

**Contributions.**

- A **problem formulation** of unused accelerator liquidity as a first-class systems problem for ML infrastructure.
- A **marketplace architecture** separating demo/simulated inventory from live provider nodes with agent-mediated connect.
- A **provider agent protocol** (challenge attestation, heartbeat TTL, pending provision → ack) that binds listings to online hardware without requiring full cluster orchestration on day one.
- A **research agenda** for matching, pricing, utilization measurement, and safety that can attract follow-on work from MLSys and cloud systems communities.

---

## 2. Background and Related Work

### 2.1 Commercial GPU marketplaces and clouds

Platforms such as Vast.ai, RunPod, Lambda, CoreWeave, and others demonstrate demand for non-hyperscaler GPUs. They typically emphasize rental UX and provider onboarding proprietary to each platform. Neo Clouds emphasizes an **open catalog + open APIs + open-source control plane**, with explicit early-access honesty about simulated vs live inventory.

### 2.2 Spot and preemptible markets

Cloud spot markets improve utilization inside a single provider. They do not aggregate *cross-provider unused* capacity or give buyers a uniform hardware/workload/price discovery interface across neo-clouds and labs.

### 2.3 Cluster federation and sky computing

Projects in the sky-computing and multi-cloud scheduling literature argue for optimizing jobs across clouds. Neo Clouds is complementary: it focuses on **supply aggregation and market discovery** rather than a full cross-cloud scheduler. A natural future layer is connecting marketplace reservations to sky-style planners.

### 2.4 Decentralized compute networks

Blockchain-settled compute networks explore permissionless supply. Many ML practitioners still prefer conventional API keys, SSH/container access, and fiat-era billing. Neo Clouds takes a pragmatic path: open protocols first; payments and settlement as a later, explicit layer (currently disabled in the prototype).

---

## 3. Problem Statement

Let \(P\) be a set of providers, each holding accelerators \(A_p\) with intermittent idle intervals. Let \(C\) be customers with jobs characterized by hardware needs \(h\), workload class \(w\) (training / inference / fine-tune), duration, and willingness-to-pay.

**Goal.** Maximize realized useful accelerator-hours matched under constraints of trust (attestation + liveness), discoverability, and operational simplicity—while keeping the marketplace open and programmable.

**Why this is hard.**

- Idle capacity is **intermittent** and poorly advertised.
- Hardware is **heterogeneous** (GPU vs TPU; interconnect; VRAM).
- Buyers optimize for **workload fit**, not only chip SKU.
- Live connect requires **fresh presence** (heartbeat) distinct from static registration.

---

## 4. System Overview

Neo Clouds is a marketplace control plane with:

| Layer | Role |
|---|---|
| Marketing + catalog UI | Discovery by hardware, workload tags, price sort |
| Auth | Provider / customer API keys |
| Listings | Node-linked inventory with availability derived from state |
| Reservations | Simulated instant-active vs live `pending_provision` → agent ack |
| Inference gateway | OpenAI-compatible `/v1/chat/completions` (demo models until live runtime attach) |
| Provider console + `neo-agent` | Live register, attest, heartbeat, provision |

**Design principle:** separate *catalog truth* from *demo UX*. Seeded listings may be simulated; live nodes require attestation and a fresh heartbeat before they appear available.

```
Customer UI/API          Marketplace API           Provider host
     |                         |                        |
     |  browse listings        |                        |
     |------------------------>|                        |
     |  reserve (live)         |   pending_provision    |
     |------------------------>|----------------------->|
     |                         |   heartbeat + ack      |
     |  connection_info        |<-----------------------|
     |<------------------------|                        |
```

---

## 5. Live Provider Protocol

### 5.1 Node registration

Providers register nodes with accelerator type/model/count, memory, interconnect, region, and `live: true`.

### 5.2 Challenge attestation

Stub “flip to attested” is blocked for live nodes. The agent must complete a nonce challenge and hardware fingerprint proof so listing identity is bound to a host-side secret material (fingerprint), not a dashboard checkbox.

### 5.3 Heartbeat and availability

Availability for live listings requires:

1. `attestation_status = attested`
2. Fresh `last_heartbeat_at` within TTL (default 90s)
3. No conflicting active / pending reservation

Attestation proves *who/what*; heartbeat proves *online now*. Conflating them creates false availability.

### 5.4 Provision acknowledgment

Live reservations enter `pending_provision`. The agent acknowledges with SSH/connection metadata. This deliberately stages orchestration: the marketplace coordinates trust and matching first; automatic user provisioning and container isolation are subsequent hardening layers.

---

## 6. Catalog Organization

Buyers rarely shop only by SKU. Neo Clouds treats discovery as three axes:

1. **Hardware** — accelerator type (GPU/TPU), model, interconnect  
2. **Workload** — tags such as training / inference / fine-tune  
3. **Price** — ascending/descending listed $/hr (explicitly *listed*, not billed, while payments are disabled)

This is a product choice with research implications: ranking and matching objectives should be multi-objective (fit × price × reliability), not price alone.

---

## 7. Trust, Safety, and Limitations

**Current trust boundary.** Challenge attest + heartbeat + provider-acked connection info. This is stronger than “listed on a webpage,” weaker than confidential computing + attested TEEs + mediated sandboxes.

**Explicit non-goals of the early system.** Full multi-tenant isolation, automatic SSH user creation, payout rails, and production inference runtime attachment are roadmap items—not claimed complete.

**Threat sketches.**

- Stale inventory → mitigated by heartbeat TTL  
- Misrepresented hardware → partially mitigated by fingerprint challenge; deeper attestation (NVIDIA attestation, TPU topology proofs) is future work  
- Malicious workloads on provider hosts → requires sandboxing / VM / container policy beyond ack-based SSH  

---

## 8. Research Agenda  **[primary citation magnet]**

We outline problems where MLSys and cloud systems researchers can contribute measurable results:

### 8.1 Utilization and idle discovery **[Eval TBD]**

- What fraction of accelerator-hours in neo-clouds/labs is idle at minute/hour granularity?
- How predictive are heartbeat gaps for preemption risk?

### 8.2 Matching and mechanism design

- Matching objectives under intermittent supply  
- Posted-price vs auction for short training bursts vs long fine-tunes  
- Workload-aware ranking (does tagging improve time-to-first-fit?)

### 8.3 Reliability SLOs for secondary markets

- Define availability SLIs for agent-connected nodes  
- Compare stub-simulated markets vs live agent markets on cancellation and time-to-provision

### 8.4 Secure multi-tenancy on spare silicon

- Minimal TEE / confidential VM path for untrusted jobs on provider hardware  
- Attestation chaining from marketplace → agent → device

### 8.5 Inference economics

- When should spare capacity serve *rental* vs *token inference*?  
- Batching and preemption policies for mixed training/inference sellers

---

## 9. Prototype Status

The public prototype implements catalog browse, API keys, reservations, provider pilot waitlist, provider console, SQLite persistence, and the live agent path. Payments are disabled; demo inventory remains labeled simulated; live nodes are distinct.

**Reproducibility.** Source and docs: Neo Clouds Marketplace repository; live site: `https://neocloudsmarketplace.com`.

---

## 10. Conclusion

Unused accelerators are a systems resource, not merely a sales leftover. Neo Clouds proposes an open marketplace control plane that makes idle GPUs and TPUs discoverable and connectable through transparent listings and a live agent protocol. By separating simulation from live presence, and by organizing the catalog around hardware, workload, and price, the platform aims to increase liquidity in secondary accelerator supply.

We invite collaboration on measurement, matching, and secure execution—the ingredients required to turn this architecture into a rigorously evaluated contribution to ML infrastructure.

---

## Acknowledgments

Early-access users, provider pilot participants, and open-source contributors.

---

## References (seed list — expand before arXiv)

1. Sky Computing / multi-cloud scheduling literature (e.g., SkyPilot and related systems).  
2. Cloud spot market and preemptible VM studies.  
3. GPU cluster scheduling and sharing (e.g., Gandiva, Tiresias, AntMan, and successors).  
4. Confidential computing / remote attestation surveys for accelerators.  
5. Marketplace mechanism design (posted prices, matching markets).  
6. Commercial GPU cloud/marketplace product documentation (Vast.ai, RunPod, CoreWeave, etc.) as industrial context.  
7. Neo Clouds Marketplace. https://neocloudsmarketplace.com

*(Replace seed items with formal BibTeX entries before camera-ready / arXiv.)*

---

## Appendix A — Suggested abstract for workshop CFP (≤150 words)

Demand for GPUs and TPUs coexists with substantial idle accelerator capacity outside hyperscalers. We present Neo Clouds, an open marketplace that aggregates unused accelerators into a catalog searchable by hardware, workload, and price, with a provider agent protocol for attestation, heartbeat-based availability, and provision acknowledgment. We describe the architecture of our early-access system, the trust model separating simulated demo inventory from live nodes, and a research agenda on utilization measurement, matching, and secure multi-tenancy for secondary accelerator markets.

---

## Appendix B — What to measure next (for a full conference paper)

| Metric | How to collect | Why reviewers care |
|---|---|---|
| Idle fraction | Agent + nvidia-smi / TPU util traces | Establishes problem magnitude |
| Time-to-provision | Reserve → ack latency | Systems quality |
| Listing freshness | Heartbeat miss rate | Reliability |
| Match success | Query → reserve conversion by filter | Catalog UX as systems artifact |
| Cost vs hyperscaler | Listed $/hr vs on-demand refs | Practical impact |

---

## Appendix C — Author checklist before arXiv upload

- [ ] Fill author names / affiliations / ORCIDs  
- [ ] Replace seed references with BibTeX  
- [ ] Add architecture diagram (export from draw.io / Excalidraw)  
- [ ] Add **[Eval TBD]** numbers or clearly label as position/system paper  
- [ ] License note (e.g., CC BY 4.0 for preprint)  
- [ ] Conflict with any prior published abstract?  
- [ ] Do not claim payments, full isolation, or large fleet scale until true  
