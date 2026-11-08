# Adoption and impact

**Date:** 8 November 2026 (Pacific)  
**Finding:** This repository does not contain user counts, a retention cohort, customer feedback, or a testimonial. The site has instrumentation. The measurements have not been exported into this packet.

## What is instrumented

| Signal | Where it lives | What this packet has |
|---|---|---|
| Page analytics | Cloudflare Web Analytics beacon on the public pages, since 15 Sep 2026 | The beacon. Not a dashboard export |
| Process health | `GET /api/health` reports `accounts`, `listings`, `liveNodes`, `onlineLiveNodes` | The fields. Not a dated snapshot |
| Reservations | SQLite snapshot on the server disk | Not exported |
| Contact notes | Operator inbox | Not exported |

Health counts are process memory plus the local snapshot. They are not a public user total, and they mix example listings with live ones if you read `listings` without splitting `example`.

## Measures, unfilled

| Measure | Definition | Result |
|---|---|---|
| Registered accounts | Rows in `accounts` on a named date | Not exported |
| Live supply | Attested nodes inside the heartbeat TTL | Not exported |
| Reservations created | Live and example, reported separately | Not exported |
| Ack rate | See the PRD | Not exported |
| Clean completion | See the PRD | Not exported |
| Repeat reserve, 7 day | Buyers with a second live reserve | Not computed |
| Repeat supply | Providers with a second listing week | Not computed |

## Feedback and testimonials

| Source | File to add | In this packet |
|---|---|---|
| Contact-form notes, with permission | `feedback/YYYY-MM-DD.md` | Not exported. The inbox is private |
| A named customer quote | `testimonials/name.md` with the date and the permission | None |
| A named provider quote | `testimonials/name.md` | None |

Do not write a quote from a contact note unless that person agreed to be cited. Do not invent a company name.

## Impact statement that is currently allowed

Neo Clouds is an early-access marketplace with a live path for one host and a catalog of example machines. Impact on buyers, hours delivered, and money saved has not been measured in this packet. The first market test in the roadmap is the measurement.
