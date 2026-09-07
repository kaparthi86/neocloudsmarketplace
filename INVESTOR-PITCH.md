# Neo Clouds — Investor Pitch

**HTML deck:** [/investors.html](./public/investors.html) · live path `https://neocloudsmarketplace.com/investors.html`  
**Confidential** · Raising **$100M** · Series B ambition  
**Live:** [neocloudsmarketplace.com](https://neocloudsmarketplace.com)

> *The open exchange for AI accelerators — where fragmented GPU and TPU supply meets unbounded model demand.*

---

## 1. One-liner

**Neo Clouds** is the marketplace and inference layer for AI compute: providers list GPUs and TPUs; builders reserve capacity and call models through an OpenAI-compatible API.

We turn idle and independent accelerator supply into liquid, programmatic infrastructure.

---

## 2. The problem

AI demand for accelerators is exploding. Supply is **scarce, opaque, and trapped**:

| Pain | Reality today |
|------|----------------|
| **Hyperscaler lock-in** | Capacity, pricing, and regions controlled by a few clouds |
| **Fragmented neo-clouds** | Dozens of GPU hosts with no shared discovery, trust, or API |
| **Buyer friction** | Teams waste weeks chasing quotes, Slack DMs, and one-off contracts |
| **Dead inventory** | Labs, colos, and smaller hosts hold chips that never reach demand |
| **Inference ≠ infra** | Renting a box and shipping a model are still two different products |

Training and inference spend is racing ahead of the systems that **price, route, and clear** that capacity in an open market.

---

## 3. The solution

**Neo Clouds = Accelerator exchange + inference gateway**

1. **Supply side** — Providers register nodes, attest, list by hardware / region / price / workload  
2. **Demand side** — Customers browse, reserve hours, and run inference via `/v1/chat/completions`  
3. **Trust layer** — Attestation, availability, leaderboard reputation (roadmap: SLAs, escrow, payouts)  
4. **Programmatic access** — API keys, OpenAI-compatible interface, usage metering for billing partners  

**Product already live (early access):** public marketplace UI, listings catalog (hardware · workload · price), provider registration, reservations, inference API, provider pilot waitlist.

*Honesty for investors:* early access is intentionally simulated on reservations/inference until real provider connect and persistence ship. That is the build — not a side note.

---

## 4. Why now

1. **Model economics force multi-cloud** — No single vendor can satisfy every training and inference profile  
2. **Neo-cloud proliferation** — Independent GPU fleets need a distribution channel beyond their own landing pages  
3. **API standardization** — OpenAI-compatible endpoints made inference portable; compute should be next  
4. **Capital intensity** — Chip owners need utilization; builders need elastic access without owning clusters  
5. **Regulatory & sovereignty** — Region-aware, multi-provider routing becomes a requirement, not a nice-to-have  

The winners of the last cloud cycle owned **regions**. The winners of this cycle will own **liquidity** between chips and models.

---

## 5. Market

**Category:** AI accelerator marketplace + inference exchange  

| Layer | Framing | Directional size |
|-------|---------|------------------|
| **TAM** | Global AI infrastructure / GPU cloud spend | Hundreds of billions over the decade as AI capex compounds |
| **SAM** | Third-party / neo-cloud GPU & TPU rental + inference APIs | Tens of billions — everything outside captive hyperscaler training clusters |
| **SOM (5 yr)** | Take-rate on cleared marketplace GMV + inference margin | Path to **$1B+ revenue** at scale if Neo Clouds becomes the default clearing layer for independent supply |

*We do not claim Neo Clouds has captured this yet. The raise buys the right to build the clearing layer while supply is still fragmented.*

**Comparable power laws:** AWS for VMs · Stripe for payments · OpenAI API for models — each won by becoming the **default interface** over messy supply.

---

## 6. Product wedge

| Surface | What ships | Why it matters |
|---------|------------|----------------|
| **Catalog** | Browse by hardware, workload, price | Buyers shop the way they think |
| **Reserve** | Hourly reservations against listings | Clears spare capacity |
| **Inference** | OpenAI-compatible chat completions | Meet builders where their code already is |
| **Provider pilot** | Waitlist + inventory intake | Seed real supply without fake promises |
| **Roadmap** | Real attest → provision → payouts → SLA tiers | Turn demo liquidity into production liquidity |

**North-star product:** *any* accelerator inventory, *one* API, *global* price discovery.

---

## 7. Business model

**Primary:** Marketplace take rate on reserved compute (target **10–20%** of GMV as trust and settlement mature)  
**Secondary:** Inference margin / routing fee on managed model endpoints  
**Tertiary:** Enterprise — private exchanges, compliance packs, priority matching, billed via partners (e.g. Easy Billing meter)

**Unit economics thesis**

- Low marginal cost to list another provider node  
- High switching cost once workloads and API keys sit on Neo Clouds  
- Network effects: more supply → better price/availability → more demand → more provider pull  

---

## 8. Go-to-market

**Phase 1 — Supply-led (now)**  
Warm intros to GPU hosts → `/providers.html` pilot pack → inventory waitlist → dry-run API listings  

**Phase 2 — Demand density**  
ML startups, fine-tune shops, inference-heavy apps: “cheapest attested H100 in region X via one API”  

**Phase 3 — Programmatic**  
Agents and orchestrators book capacity via API; Neo Clouds becomes infra plumbing, not a website  

**Phase 4 — Enterprise & sovereign**  
Private marketplaces for labs, nations, and regulated industries  

---

## 9. Competition

| Player | What they are | Neo Clouds angle |
|--------|---------------|------------------|
| **Hyperscalers** | Captive capacity | We aggregate *everyone else* and stay neutral |
| **Vertical GPU clouds** | Own fleets (CoreWeave, Lambda, …) | Partners *or* competitors; we win as the open exchange |
| **Peer marketplaces** | Vast, RunPod-class rental | We add trust, workload catalog, and inference as first-class |
| **Job boards / Slack deals** | Opaque human brokerage | We productize price discovery |

**Positioning:** Not “another GPU cloud.” **The exchange layer** above many clouds.

---

## 10. Moat (what $100M buys)

1. **Liquidity** — Density of attested supply in every hot region/SKU  
2. **Trust graph** — Attestation, completion rates, SLA bonds, reputation  
3. **Routing intelligence** — Match workload → hardware → price → reliability  
4. **Developer default** — OpenAI-compatible + SDKs so code targets Neo Clouds first  
5. **Settlement rails** — Escrow, payouts, dispute, invoicing integrations  

Software is copyable. **Two-sided liquidity + trust + settlement** is not.

---

## 11. Traction & stage (truthful)

| Status | Detail |
|--------|--------|
| **Product** | Live marketplace at neocloudsmarketplace.com |
| **Mode** | Early access — simulated reserve/inference until real hardware connect |
| **Supply motion** | Provider pilot waitlist + API dry-run path |
| **Code** | Standalone product, public API surface, catalog by hardware/workload/price |

*Insert before any close:* waitlist size, LOIs, committed GPU-hours, design partners, weekly GMV once live.*

---

## 12. The ask — **$100M**

**Round:** Series B-scale growth capital to become the default accelerator exchange  

### Use of funds

| Allocation | Amount | Purpose |
|------------|--------|---------|
| **Supply & trust** | $30M | Real node agents, attestation, SLAs, provider success, geographic density |
| **Liquidity & GTM** | $25M | Provider acquisition, buyer growth, partner channel, brand in AI infra |
| **Inference & platform** | $20M | Routing, scheduling, multi-node training packs, enterprise private exchanges |
| **Settlement & risk** | $15M | Payments, escrow, fraud, compliance, insurance partnerships |
| **Team & ops** | $10M | Infra, security, support, international |

### What “winning” looks like in 36 months

- Meaningful share of **independent** GPU/TPU rental GMV  
- Thousands of attested nodes across top regions  
- Inference API as a default backend for emerging AI apps  
- Clear path to category-defining revenue and strategic options (IPO or infra consolidator)

---

## 13. Vision

Every accelerator on Earth — from a university TPU slice to a multi-rack H100 pod — should be **discoverable, reservable, and callable** through one open market.

Neo Clouds is building that market.

---

## 14. Contact

**Product:** https://neocloudsmarketplace.com  
**Provider pilot:** https://neocloudsmarketplace.com/providers.html  
**Deck contact:** *[add founder email]*

---

### Appendix — Narrative for partners (30 seconds)

> AI is starving for accelerators. Supply is scattered across neo-clouds, labs, and colos that buyers can’t efficiently find or trust. Neo Clouds is the open marketplace and OpenAI-compatible inference layer that clears that supply — hardware, workload, and price in one catalog. We’re raising $100M to turn early-access liquidity into the default exchange for AI compute.

### Appendix — Risks (investor-grade honesty)

- **Chicken-and-egg** until real provision works — mitigated by pilot waitlist + dry-run API  
- **Hyperscaler response** — stay neutral exchange; don’t try to out-capex AWS  
- **Trust/fraud on supply** — attestation + settlement is core R&D, not a checkbox  
- **Commodity pricing pressure** — win on liquidity, routing, and developer UX, not only $/hr  

---

*This document is a fundraising narrative. It does not constitute an offer to sell securities. Traction figures must be updated with live metrics before investor distribution.*
