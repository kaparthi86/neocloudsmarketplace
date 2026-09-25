/**
 * Neo Clouds GPU Marketplace — production entry point
 */

import { initPersistence, closePersistence } from './db.js';
import { createMarketplaceServer } from './server.js';
import { expireReservations } from './lifecycle.js';

const PORT = Number(process.env.PORT || 8788);
const HOST = process.env.HOST || '0.0.0.0';

process.on('uncaughtException', (err) => {
  console.error('FATAL uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('FATAL unhandledRejection:', err);
  process.exit(1);
});

try {
  const dbInfo = initPersistence();
  const server = createMarketplaceServer();
  server.on('error', (err) => {
    console.error('FATAL server listen error:', err);
    process.exit(1);
  });
  server.listen(PORT, HOST, () => {
    const domain = process.env.CANONICAL_DOMAIN || 'neocloudsmarketplace.com';
    console.log(`Neo Clouds Marketplace listening on http://${HOST}:${PORT}`);
    console.log(`Canonical domain: https://${domain}`);
    console.log(`Persistence: ${dbInfo.path}`);
    console.log('Live hardware: neo-agent heartbeat + challenge attest + provision ack enabled.');
    console.log('Reservation expiry sweeper running.');
    console.log('Payments remain disabled.');
  });
  const expiryTimer = setInterval(() => {
    try { expireReservations(); } catch (err) { console.error('expireReservations failed:', err.message); }
  }, 30_000);
  if (typeof expiryTimer.unref === 'function') expiryTimer.unref();

  const shutdown = () => {
    try { closePersistence(); } catch { /* ignore */ }
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (err) {
  console.error('FATAL startup:', err);
  process.exit(1);
}
