# Neo Clouds Marketplace

Open GPU and TPU marketplace — **separate from [Student AI Hub](https://github.com/kaparthi86/Student-AI-Hub)**.

**Live site:** [neocloudsmarketplace.com](https://neocloudsmarketplace.com)  
**Launch guide:** [LAUNCH.md](./LAUNCH.md)  
**System design:** [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)  
**Product boundary:** [PRODUCT.md](./PRODUCT.md)

Providers list **GPUs and TPUs**. Customers browse by accelerator type, model, region, and price, and reserve hours on a machine whose agent is online.

**Site:** [Home](https://neocloudsmarketplace.com/) · [Marketplace](https://neocloudsmarketplace.com/marketplace) · [About](https://neocloudsmarketplace.com/about.html) · [Contact](https://neocloudsmarketplace.com/contact.html)

## Quickstart

```bash
cp .env.example .env
node --test
npm start
# → http://localhost:8788
```

## Deploy (standalone)

1. Use repo **`neo-clouds-marketplace`** (not Student-AI-Hub) — see [LAUNCH.md](./LAUNCH.md)
2. Render Blueprint → `render.yaml` at repo root
3. Custom domain → **neocloudsmarketplace.com**
4. Verify `/api/health`

## Features

- GPU listings, reservations, provider nodes + attestation
- **Live hardware connect:** neo-agent heartbeat, challenge attest, provision ack — see [HARDWARE.md](./HARDWARE.md)
- Public browse; API keys for reserve
- Provider console: [/console.html](./public/console.html)
- SQLite on a persistent disk (`NEO_DB_PATH`)
- Operator inbox at `/admin` (contact notes, node heartbeats)
- API key recovery and rotation
- Reservation expiry (window end and provision timeout)
- Privacy, Terms, health check, request log, beta banner

## API

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/health` | No |
| `POST` | `/v1/auth/register` | No |
| `POST` | `/v1/auth/recover` | No |
| `POST` | `/v1/auth/rotate` | Any key |
| `GET` | `/v1/admin/overview` | Operator key |
| `GET` | `/v1/listings` | No |
| `POST` | `/v1/reservations` | Customer key |

## License

Open source — fork and run your own marketplace.
