# Tickets

These tickets are reconstructed from the repository history. Neo Clouds does not keep a separate issue tracker in this repo. Closed rows cite the pull request that landed the work. Open rows are the remaining scope from the roadmap.

## Closed

| ID | Ticket | Done | Evidence |
|---|---|---|---|
| NC-001 | Stand up a separate marketplace repo and domain from Student AI Hub | 5 Sep 2026 | Commit `2fae460` |
| NC-002 | Catalog filters for accelerator, workload, and price | 5 Sep 2026 | PR #1, PR #2 |
| NC-003 | Home, About, Contact, and marketplace at `/marketplace` | 9 Sep 2026 | PR #6 |
| NC-004 | Live hardware connect: attest, heartbeat, provision ack | 15 Sep 2026 | PR #7 |
| NC-005 | Operator contact path and privacy mailto | 15 Sep 2026 | PR #8 |
| NC-006 | System design record for the control plane | 16 Sep 2026 | PR #11 |
| NC-007 | Durable disk, operator inbox, rate limits, key recovery, reservation expiry | 24 Sep 2026 | PR #13, PR #14 |
| NC-008 | Remove sample key, stub attest, leaderboard, waitlist, and unused inference | 25 Sep 2026 | PR #14 |
| NC-009 | Put labeled example machines and model previews back, without making them live | 25 Sep 2026 | PR #15 |
| NC-010 | Investor contact address on the contact list | 1 Oct 2026 | PR #16 |
| NC-011 | Open and close a per-reservation SSH user, and mail the buyer when access is ready | 8 Oct 2026 | PR #17 |
| NC-012 | Home hero photograph in the site palette | 8 Oct 2026 | PR #18, PR #19 |
| NC-013 | Remove honesty banners and the matching disclaimer sentences | 5 Nov 2026 | PR #20 |

## Open

| ID | Ticket | Acceptance |
|---|---|---|
| NC-101 | Record the first market test against the PRD measures | A dated export shows live supply, ack rate, clean completion, and repeat supply. Empty cells stay empty |
| NC-102 | Capture dated product screenshots and a short demo | Files named in [07-release-history.md](./07-release-history.md) exist and match the build they claim |
| NC-103 | Export Cloudflare analytics for the public site | A dashboard export is attached. Counts are not typed in by hand |
| NC-104 | Payments after one completed live reservation | A completed live reservation exists first. Checkout is a later change with its own decision record |
| NC-105 | Workload runtime on the reserved host | Containers or vLLM, scoped to the reservation user, with the same revoke path |
| NC-106 | Move persistence off SQLite when a second cohort needs it | A decision record that names the operational limit SQLite hit |

## Not a ticket

Publishing a company revenue forecast, a user count, or a cost saving that has no source file.
