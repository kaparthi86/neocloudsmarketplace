# Launch plan

**Stage:** Early access is deployed. The market test has not been scored.  
**Date:** 8 November 2026 (Pacific)  
**Runbook already in the repo:** [LAUNCH.md](../../LAUNCH.md)

## Launch bar that is already met

| Gate | How it is met |
|---|---|
| A public site on its own domain | neocloudsmarketplace.com, separate from Student AI Hub |
| A process that stays up and keeps data | Render starter plan, disk at `/var/data`, `NEO_DB_PATH` |
| A provider can attach a real machine | Console plus `neo-agent` 0.2.0 |
| A buyer can hold that machine only while the agent is online | Attest, heartbeat TTL, reservation conflicts |
| Access is closed when the hold ends | Agent release loop deletes the reservation user |
| An operator can read inbound notes | `/admin` with `ADMIN_API_KEY` |
| Abuse limits on account and contact routes | Rate limits when `NODE_ENV=production` or `RATE_LIMIT=1` |
| The catalog is understandable with no live agent | Example listings and model previews |

## Launch bar that is not met

| Gate | Missing evidence |
|---|---|
| Five attested, heartbeating nodes | No dated node export in this packet |
| Three acknowledged live reservations | No reservation export |
| One clean completion | No completed-live-hour record |
| One provider who lists again | No repeat-supply record |
| Analytics export | Beacon is installed. The dashboard export is not in the repo |

## Rollout order

1. Operator sets `ADMIN_API_KEY` and mail (`RESEND_API_KEY` plus `NEO_MAIL_FROM`, or `NEO_MAIL_WEBHOOK_URL`).
2. Provider installs the agent on a host as root or passwordless sudo, with `NEO_SSH_PROVISION` left on.
3. Provider attests, heartbeats, and publishes a listing from the console.
4. Buyer registers a customer key and reserves that listing.
5. Agent acks. Buyer copies the user, host, and private key from My reservations. The private key is not emailed.
6. At window end, cancel, or stale heartbeat, the agent deletes that user.
7. Only after one reservation reaches `completed` does a payments design start.

## Launch risks already designed for

| Risk | Control |
|---|---|
| A demo row is treated as a live machine | Example rows are constants, `node_id` is null, and they sort after live rows |
| A dead host stays reservable | Availability requires a fresh heartbeat |
| A shared SSH user outlives the buyer | Username is `neo` plus ten hex characters from the reservation id. Revoke deletes only that pattern |
| A buyer is billed for a machine that never opened | `paymentsEnabled` is false. No checkout route exists |
| The operator inbox leaks API keys | Admin overview does not return customer keys or private keys |

## Abort

Stop inviting providers if acknowledged reservations are closed `agent_offline` more often than they complete, or if the agent cannot create the host user. Fix the host path before adding listings.
