/**
 * Health and launch metadata — mirrors AI Hub /api/health pattern.
 */

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { store } from './store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const indexHtmlPath = join(PUBLIC_DIR, 'index.html');
const marketplaceHtmlPath = join(PUBLIC_DIR, 'marketplace.html');

export const DEFAULT_HONESTY_BANNER =
  'Early access: demo listings are simulated. Live provider nodes use neo-agent connect. Reservations do not charge you — no payments collected.';

/** Always shown. BETA_MESSAGE overrides the wording; BETA_TESTING no longer hides it. */
export function honestyBannerText() {
  return process.env.BETA_MESSAGE || DEFAULT_HONESTY_BANNER;
}

export function betaBannerText() {
  return honestyBannerText();
}

export function healthPayload() {
  const prod = process.env.NODE_ENV === 'production';
  const indexHtmlDeployed = existsSync(indexHtmlPath) && existsSync(marketplaceHtmlPath);
  const liveNodes = [...store.nodes.values()].filter(n => n.live === true);
  const onlineLive = liveNodes.filter(n => n.last_heartbeat_at
    && (Date.now() - new Date(n.last_heartbeat_at).getTime()) <= Number(process.env.AGENT_HEARTBEAT_TTL_MS || 90_000));
  const base = {
    ok: true,
    service: 'neo-clouds-marketplace',
    betaMessage: betaBannerText(),
    simulated: true,
    paymentsEnabled: false,
    liveHardwareConnect: true,
    liveNodes: liveNodes.length,
    onlineLiveNodes: onlineLive.length,
    indexHtmlDeployed,
    seedDemoEnabled: process.env.SEED_DEMO === '1',
    accounts: store.accounts.size,
    listings: store.listings.size,
    models: store.models.size,
    providerPilotWaitlist: store.providerPilot.length,
    canonicalDomain: process.env.CANONICAL_DOMAIN || 'neocloudsmarketplace.com',
  };
  if (prod) return base;
  return {
    ...base,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8788,
    ...(indexHtmlDeployed
      ? {}
      : {
          deployHint:
            'Missing public/index.html. Set Render Root Directory to neo-clouds and redeploy.',
        }),
  };
}
