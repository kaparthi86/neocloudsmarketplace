# AI cost evidence

**Date:** 8 November 2026 (Pacific)  
**Finding:** Neo Clouds has no AI provider invoice, no token usage export, no cache log, and no before-and-after cost comparison. A cost claim cannot be made from this repository.

## Why there is no invoice

The model preview path does not call a provider. `POST /v1/models/preview` returns a fixed sentence from `src/examples.js`. It writes no usage record. The cards named Llama 3.1 70B, Llama 3.1 8B, and Gemma 2 9B are catalog metadata.

Listed hourly rates on example machines are discovery prices. They are not what Neo Clouds paid and not what a buyer was charged. `paymentsEnabled` is false. There is no Stripe account in this product.

The control plane's own hosting cost is a Render starter instance plus a 1 GB disk, and Cloudflare in front of the site. Those invoices are not stored in the repository. Attach them below if you want hosting cost in the packet. Do not describe that hosting bill as model spend.

## Evidence to attach, when it exists

| Artifact | File to add | What it must show | In this packet |
|---|---|---|---|
| Provider invoice | `invoices/YYYY-MM.pdf` | Provider name, period, SKU, quantity, amount, currency | Not in the repository |
| Usage export | `usage/YYYY-MM.csv` | Model or accelerator id, tokens or hours, timestamp | Not in the repository |
| Cache log | `cache/YYYY-MM.log` | Hit, miss, key, bytes, or tokens saved | Not in the repository. No cache exists |
| Calculation sheet | `cost/YYYY-MM.xlsx` | Formula from the export to a monthly total | Not in the repository |
| Before and after | `cost/before-after.md` | Same workload, two measured periods, both exports linked | Not in the repository |

## Worksheet, left blank on purpose

| Period | Provider | SKU | Quantity from export | Rate from invoice | Computed total | Notes |
|---|---|---|---|---|---|---|
| | | | | | | |

A number typed into this table without the export and the invoice is not a cost claim.

## What a later comparison is allowed to say

After NC-105, a live reservation that runs a named model can be compared with the listed card rate and with the provider invoice for that period. Until those three files exist, the honest statement is: Neo Clouds has not spent model-provider money, because it has not called a model provider.
