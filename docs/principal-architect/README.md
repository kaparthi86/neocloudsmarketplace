# Neo Clouds — principal architect evidence

**Product:** Neo Clouds Marketplace  
**Site:** https://neocloudsmarketplace.com  
**Repository:** https://github.com/kaparthi86/neocloudsmarketplace  
**Role this packet supports:** Principal architect, AI infrastructure  
**Dossier date:** 8 November 2026 (Pacific)  
**Source of truth:** `main` at `1310d4d` (merge of pull request #20)

This packet is the product record for a principal architect review. It covers product ownership, technical design, release history, cost, adoption, and outside validation.

Numbers, invoices, user counts, testimonials, awards, and letters appear only when they exist. Empty tables mean the evidence has not been collected. They are not zero results.

## What the architect owns

Neo Clouds is an open marketplace for spare GPUs and TPUs. A provider attaches a machine with a host agent. A buyer reserves a window on a machine that is attested and still heartbeating. The control plane is one Node.js service with a SQLite snapshot. It is a separate product from Student AI Hub.

The original technical work is the trust split: attestation proves which host answered, a heartbeat proves it is still online, and a per-reservation SSH user is created on ack and removed when the hold ends. Example machines and model previews are fixed catalog rows. They do not call a model provider and they do not open a host.

## Evidence map

| Review area | What a principal packet needs | Where it is | Status |
|---|---|---|---|
| Product ownership | PRD, roadmap, tickets, launch plan, decision records | [01-prd.md](./01-prd.md), [02-roadmap.md](./02-roadmap.md), [03-backlog.md](./03-backlog.md), [04-launch-plan.md](./04-launch-plan.md), [05-decision-records.md](./05-decision-records.md) | Written from the shipped product |
| Technical originality | Architecture, AI workflow, prompts, code, model choices | [06-architecture.md](./06-architecture.md) | Written from the repository. Preview is a fixed reply, not a model call |
| Product history | Dated screenshots, demos, release notes, versions | [07-release-history.md](./07-release-history.md) | Release notes are dated from git. Screenshots and a demo recording are not in the repository |
| AI cost claims | Invoices, usage exports, cache logs, spreadsheets, before/after | [08-cost-evidence.md](./08-cost-evidence.md) | No provider invoice exists. The preview path does not call a model |
| Adoption and impact | Users, analytics, retention, feedback, testimonials | [09-adoption.md](./09-adoption.md) | Counters exist. No export, cohort, or testimonial is stored here |
| Independent validation | Articles, talks, awards, letters | [10-validation.md](./10-validation.md) | Drafts live in the repo. Publication, awards, and letters are not recorded |

## How to read a gap

A row marked **Not in the repository** is a collection task. Attach the file named in that section. Do not fill the cell with an estimate.
