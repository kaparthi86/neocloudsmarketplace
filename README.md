# Neo Clouds Marketplace

Open GPU marketplace and inference platform — **separate from [Student AI Hub](https://github.com/kaparthi86/Student-AI-Hub)**.

**Live site:** [neocloudsmarketplace.com](https://neocloudsmarketplace.com)  
**Launch guide:** [LAUNCH.md](./LAUNCH.md)  
**System design:** [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)  
**Product boundary:** [PRODUCT.md](./PRODUCT.md)

Providers list **GPUs and TPUs**. Customers browse by accelerator type, model, region, and price, reserve hours, and call models via an OpenAI-compatible API.

**Site:** [Home](https://neocloudsmarketplace.com/) · [Marketplace](https://neocloudsmarketplace.com/marketplace) · [About](https://neocloudsmarketplace.com/about.html) · [Contact](https://neocloudsmarketplace.com/contact.html)

## Quickstart

```bash
cp .env.example .env
node --test
npm start
# → http://localhost:8788
```

`SEED_DEMO=1` loads sample H100/A100 listings and models.

## Deploy (standalone)

1. Use repo **`neo-clouds-marketplace`** (not Student-AI-Hub) — see [LAUNCH.md](./LAUNCH.md)
2. Render Blueprint → `render.yaml` at repo root
3. Custom domain → **neocloudsmarketplace.com**
4. Verify `/api/health`

## Features

- GPU listings, reservations, provider nodes + attestation
- **Live hardware connect:** neo-agent heartbeat, challenge attest, provision ack — see [HARDWARE.md](./HARDWARE.md)
- OpenAI-compatible `/v1/chat/completions` with streaming
- Public browse; API keys for reserve and inference
- Provider pilot waitlist: [/providers.html](./public/providers.html) · [PROVIDER-PILOT.md](./PROVIDER-PILOT.md)
- Provider console: [/console.html](./public/console.html)
- SQLite persistence (`NEO_DB_PATH`)
- Privacy, Terms, health check, beta banner

## API

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/health` | No |
| `POST` | `/v1/auth/register` | No |
| `GET` | `/v1/listings` | No |
| `GET` | `/v1/models` | No |
| `POST` | `/v1/reservations` | Customer key |
| `POST` | `/v1/chat/completions` | Any key |

## License

Open source — fork and run your own marketplace.
