# Neo Clouds — Provider pilot pack

**Share URL:** https://neocloudsmarketplace.com/providers.html

Use this when talking to GPU/TPU operators for the early-access pilot.

## Honesty (say this first)

- Marketplace listings, reservations, and inference are **simulated** today.
- Joining the waitlist collects **interest + inventory only**.
- **No live jobs, no payouts, no payment collection** yet.
- Pilot API keys are stored on the persistent disk. Lost keys can be emailed back when mail is configured.
- Waitlist and contact rows are in the operator inbox at `/admin`. Email to the operator is sent only when `RESEND_API_KEY` or `NEO_MAIL_WEBHOOK_URL` is set.

## What to ask them for

| Field | Example |
|---|---|
| Name / email / company | ops@atlasgpu.com |
| Accelerator | GPU or TPU · `H100-SXM5-80GB` |
| Count + memory/chip | 8 × 80GB |
| Interconnect / region | NVLink · `us-east-1` |
| Listed $/hr | `2.85` (indicative) |
| Workload tags | `training`, `inference`, `fine-tune` |

## Waitlist form

Send providers to **/providers.html** and have them submit the form  
(`POST /v1/provider-pilot`).

## API dry-run (optional)

```bash
# Register provider → nkp_ key
curl -s -X POST https://neocloudsmarketplace.com/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Atlas GPU","email":"you@company.com","role":"provider"}'

# Node → attest (stub) → listing with workload tags
# See /providers.html#api-quickstart for the full curl sequence.
```

## After they join

1. Confirm we received their `interest_id`.
2. Do **not** promise live provisioning or payouts.
3. Read the row in `/admin` (and in operator email when mail is configured). Invite them onto the live console when they are ready to run neo-agent.
