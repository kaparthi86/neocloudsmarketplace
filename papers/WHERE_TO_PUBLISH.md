# Where to publish (for citations from AI + infra people)

Companion to [`neo-clouds-unused-accelerator-marketplace.md`](./neo-clouds-unused-accelerator-marketplace.md).

## Reality check (read this first)

Top conferences cite **measured systems and clear research questions**, not product landing pages. Your fastest citation path:

1. Put a polished preprint on **arXiv** (`cs.DC` + `cs.LG`) within days.  
2. Submit a **workshop** version (easier accept, still indexed / tweeted by researchers).  
3. Collect **idle-util + provision latency** data → upgrade to a full MLSys / SoCC paper.

Without numbers, pitch it as a **system design + research agenda** paper—not as “we solved GPU markets.”

---

## Tier A — maximum visibility with AI + infra researchers

| Venue | Why | Fit for Neo Clouds now |
|---|---|---|
| **arXiv** (`cs.DC`, `cs.LG`, optionally `cs.NI`) | Default discovery layer; Google Scholar, Semantic Scholar, Twitter/X | **Do this first** |
| **MLSys** (conference or workshops) | Best overlap of ML + systems people who cite infra work | Strong after you add eval |
| **NeurIPS / ICML / ICLR workshops** on efficiency, systems for ML, or serving | World-class AI readers; workshops accept early systems | **Best near-term peer venue** |
| **ACM SoCC** | Cloud / marketplace / multi-tenant systems audience | Good for agent + market design |
| **EuroSys / NSDI workshops** (HotCloud-style if running) | Infra citation graph | Position / early system |

## Tier B — solid infra citation graph

| Venue | Notes |
|---|---|
| **IEEE ICDCS**, **Middleware**, **IC2E** | Distributed systems / cloud eng |
| **HotOS** (if position paper is sharp) | High prestige, very selective, idea-first |
| **USENIX ATC** / **OSDI** workshops | Only with strong measurement story |

## Tier C — industry + practitioner amplification (citations + awareness)

| Channel | Why |
|---|---|
| **MLOps Community / LF AI** talks | Practitioners who later write papers |
| **Stanford MLSys seminar / Berkeley RISE / Sky Computing talks** (invite or cold email) | Directly reaches citation-heavy labs |
| **Hugging Face blog / Discord**, **GPU Mode**, **Latent Space** podcast | Awareness → GitHub → eventual citations |
| **Company blogs that cite arXiv** (Anyscale, Modal, Together, CoreWeave engineering) | Secondary citation funnel |

Avoid as primary “research” homes: Medium-only posts, SEO blogs, or pure marketing PDFs—they rarely enter the academic citation graph.

---

## Recommended sequence (practical)

### Week 1–2
1. Finalize author list + affiliations.  
2. Add 1 architecture figure.  
3. Upload to **arXiv** (cs.DC primary, cs.LG secondary).  
4. Post link on X/LinkedIn + email 10 MLSys/Sky researchers with a 5-line ask (“feedback on research agenda §8”).

### Month 1–2
5. Submit **workshop** (NeurIPS/ICML/MLSys workshop CFPs—watch deadlines).  
6. Title pattern that gets cited:  
   *“Neo Clouds: Open Marketplace Architecture for Unused GPUs/TPUs”*  
   not *“Introducing our startup.”*

### Month 3–6 (citation compound interest)
7. Instrument agents → idle fraction + time-to-ack tables.  
8. Submit **MLSys** or **SoCC** full paper with eval.  
9. Release a small public trace dataset (even N=few providers) — datasets get citations.

---

## Title / framing tips for citations

**Good frames (researchers cite these):**
- Unused / stranded accelerator capacity  
- Secondary markets for GPUs/TPUs  
- Attestation + liveness for marketplace inventory  
- Workload-aware discovery (hardware × workload × price)

**Weak frames (get ignored):**
- “Uber for GPUs” without mechanism/eval  
- Tokenomics-first decentralized compute (unless that’s truly your contribution)  
- Overclaiming production scale you don’t have  

---

## Who to cite (and who may cite you back)

Reference and engage:
- SkyPilot / sky computing papers  
- GPU sharing & cluster schedulers (Gandiva, Tiresias, etc.)  
- Spot/preemptible VM market studies  
- Confidential computing / attestation surveys  

Email corresponding authors of recent MLSys “GPU market / multi-cloud / serving” papers with your arXiv link—polite technical notes outperform mass marketing.

---

## What *not* to expect

- Nature / Science / NeurIPS main track will not accept a marketplace product pitch without heavy science.  
- Citations lag: workshops + arXiv often need 6–18 months to accumulate.  
- One paper rarely “gets world-class citations” alone—pair it with open code, a tiny public trace, and a follow-up measurement paper.
