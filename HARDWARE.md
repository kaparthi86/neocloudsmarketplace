# Neo Clouds — Real hardware connect

Critical path for onboarding **live providers** and **customers**.

## What shipped

| Capability | Detail |
|---|---|
| **Persistence** | SQLite via `NEO_DB_PATH` (default `data/neo-clouds.sqlite`) |
| **Live nodes** | `POST /v1/nodes` with `"live": true` |
| **neo-agent** | Heartbeat, challenge attest, provision ack (`scripts/neo-agent.mjs`) |
| **Availability** | Live listings require attested + fresh heartbeat |
| **Reserve** | Live → `pending_provision` until the agent creates an SSH user and acks |
| **Provider console** | `/console.html` |

Fixed example listings (`ex_lst_h100`, `ex_lst_a100`, `ex_lst_tpu`) are simulated constants. Reserving one saves a note and does not open SSH. Live nodes are the only path that hands over access.

## Provider onboarding (live)

1. Open https://neocloudsmarketplace.com/console.html  
2. **Get provider key** (or paste `nkp_…`)  
3. **Register live node** (model, count, region, …)  
4. On the GPU/TPU host:

```bash
NEO_API_BASE=https://neocloudsmarketplace.com \
NEO_API_KEY=nkp_your_key \
NEO_NODE_ID=node_xxx \
NEO_SSH_HOST=your.public.hostname \
node scripts/neo-agent.mjs
```

5. Agent attests the node and keeps it online  
6. **Publish listing** in the console  
7. Customer reserves from `/marketplace` → agent creates an SSH user and key → reservation becomes `active`. The agent deletes that user when the reservation ends, is cancelled, or the heartbeat goes stale.  

## Customer onboarding

1. `/marketplace` → **Get API Key** as **Customer**  
2. Browse listings — live nodes show when agent is online  
3. Reserve → if live, status `pending_provision` then `active` after agent ack  
4. Use `connection_info` (SSH host, per-reservation user, private key) — **still no payments**

## API cheatsheet

```bash
# Live node
curl -s -X POST "$API/v1/nodes" -H "Authorization: Bearer $NKP" -H 'Content-Type: application/json' \
  -d '{"hostname":"gpu-1","gpu_model":"H100","gpu_count":8,"vram_gb_per_gpu":80,"region":"us-east-1","live":true}'

# Challenge attest (or let neo-agent do it)
curl -s -X POST "$API/v1/nodes/$NODE/attest/challenge" -H "Authorization: Bearer $NKP"

# Heartbeat
curl -s -X POST "$API/v1/agent/heartbeat" -H "Authorization: Bearer $NKP" -H 'Content-Type: application/json' \
  -d '{"node_id":"'"$NODE"'","agent_version":"0.1.0","hardware_fingerprint":"..."}'
```

## Env

| Variable | Meaning |
|---|---|
| `NEO_DB_PATH` | SQLite path (`:memory:` for tests) |
| `AGENT_HEARTBEAT_TTL_MS` | Online window (default 90000). A live hold closes when the heartbeat is older than this. |
| `NEO_SSH_PROVISION` | Set `0` on the agent only to skip creating the host user. |
| `ALLOW_STUB_ATTEST=1` | Allow flag-flip attest on live nodes (dev only) |
| `ADMIN_API_KEY` | Operator inbox at `/admin` |

**Deploy note:** `render.yaml` uses the Render starter plan and a 1GB disk mounted at `/var/data`. SQLite lives at `NEO_DB_PATH=/var/data/neo-clouds.sqlite`. The free plan sleeps and cannot keep that disk, so live heartbeats and saved keys would not survive.

## Not included yet (next)

- Containers / vLLM wiring. The agent does create and delete a per-reservation SSH user.  
- Payments / payouts  
- Postgres (SQLite on a persistent disk is the persistence layer for now)  

Attestation **requires** the agent proof. Heartbeats are accepted only for nodes registered with `live: true`. Reservations expire on their own: active holds complete at `ends_at`, and `pending_provision` cancels if the agent does not ack within `RESERVATION_PROVISION_TIMEOUT_MS` (default 15 minutes).

Payments remain **disabled**. Example machines and model previews are labeled simulated and do not run a GPU or TPU. A listing is real only when neo-agent is attested and heartbeating.
