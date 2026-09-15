# Neo Clouds — Real hardware connect

Critical path for onboarding **live providers** and **customers**.

## What shipped

| Capability | Detail |
|---|---|
| **Persistence** | SQLite via `NEO_DB_PATH` (default `data/neo-clouds.sqlite`) |
| **Live nodes** | `POST /v1/nodes` with `"live": true` |
| **neo-agent** | Heartbeat, challenge attest, provision ack (`scripts/neo-agent.mjs`) |
| **Availability** | Live listings require attested + fresh heartbeat |
| **Reserve** | Live → `pending_provision` until agent acks SSH/connection info |
| **Provider console** | `/console.html` |

Demo/SEED nodes stay `live: false` and remain simulated.

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
NEO_SSH_USER=neo \
node scripts/neo-agent.mjs
```

5. Agent attests the node and keeps it online  
6. **Publish listing** in the console  
7. Customer reserves from `/marketplace` → agent acks → reservation becomes `active` with connection info  

## Customer onboarding

1. `/marketplace` → **Get API Key** as **Customer** (or sample key if `SEED_DEMO=1`)  
2. Browse listings — live nodes show when agent is online  
3. Reserve → if live, status `pending_provision` then `active` after agent ack  
4. Use `connection_info` (SSH host/user/token) — **still no payments**

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
| `AGENT_HEARTBEAT_TTL_MS` | Online window (default 90000) |
| `ALLOW_STUB_ATTEST=1` | Allow flag-flip attest on live nodes (dev only) |
| `SEED_DEMO=1` | Demo listings + sample customer key |

**Deploy note:** On Render free, the filesystem is ephemeral — set a persistent disk for `data/` in production so SQLite survives restarts.

## Not included yet (next)

- Real SSH user provisioning / containers / vLLM wiring  
- Payments / payouts  
- Postgres (SQLite is the persistence layer for now)  

Payments remain **disabled**. Inference canned responses remain for demo models until a live inference runtime is attached.
