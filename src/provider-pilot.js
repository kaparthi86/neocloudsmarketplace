/**
 * Provider pilot / waitlist — collect interest + hardware inventory.
 * Early access only: no payouts, no live provisioning promises.
 */

import { store, makeId } from './store.js';

const VALID_ACCELERATORS = ['gpu', 'tpu'];
const VALID_WORKLOADS = ['training', 'inference', 'fine-tune', 'other'];
const VALID_INTERCONNECTS = ['NVLink', 'InfiniBand', 'PCIe', 'ICI', 'Ethernet', 'none', ''];

function requireString(value, field, { max = 200 } = {}) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} must be at most ${max} characters`);
  return trimmed;
}

function optionalString(value, field, { max = 200 } = {}) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} must be at most ${max} characters`);
  return trimmed;
}

function optionalNumber(value, field, { min = 0, max = 1_000_000 } = {}) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${field} must be a number between ${min} and ${max}`);
  }
  return n;
}

function normalizeWorkload(raw) {
  if (raw == null || raw === '') return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  const out = [...new Set(list.map(t => String(t).trim().toLowerCase()).filter(Boolean))];
  for (const w of out) {
    if (!VALID_WORKLOADS.includes(w)) {
      throw new Error(`workload tags must be one of: ${VALID_WORKLOADS.join(', ')}`);
    }
  }
  return out;
}

/**
 * Submit provider pilot interest + optional hardware inventory.
 * Public endpoint — no auth required for waitlist.
 */
export function submitProviderPilot(body = {}) {
  const name = requireString(body.name, 'name', { max: 120 });
  const email = requireString(body.email, 'email', { max: 200 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('email looks invalid');

  const company = optionalString(body.company, 'company', { max: 160 });
  const notes = optionalString(body.notes, 'notes', { max: 2000 });
  const region = optionalString(body.region, 'region', { max: 80 });
  const accelerator_model = optionalString(
    body.accelerator_model || body.gpu_model,
    'accelerator_model',
    { max: 120 },
  );

  let accelerator_type = optionalString(body.accelerator_type || body.kind, 'accelerator_type', { max: 16 }).toLowerCase();
  if (accelerator_type && !VALID_ACCELERATORS.includes(accelerator_type)) {
    throw new Error('accelerator_type must be gpu or tpu');
  }
  if (!accelerator_type && accelerator_model) accelerator_type = 'gpu';

  const accelerator_count = optionalNumber(
    body.accelerator_count ?? body.gpu_count,
    'accelerator_count',
    { min: 1, max: 10_000 },
  );
  const memory_gb_per_chip = optionalNumber(
    body.memory_gb_per_chip ?? body.vram_gb_per_gpu,
    'memory_gb_per_chip',
    { min: 1, max: 10_000 },
  );
  const price_per_hour = optionalString(body.price_per_hour, 'price_per_hour', { max: 32 });
  if (price_per_hour && !/^(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/.test(price_per_hour)) {
    throw new Error('price_per_hour must look like 1.25');
  }

  const interconnect = optionalString(body.interconnect, 'interconnect', { max: 40 });
  if (interconnect && !VALID_INTERCONNECTS.includes(interconnect)) {
    throw new Error(`interconnect must be one of ${VALID_INTERCONNECTS.filter(Boolean).join(', ')}`);
  }

  const workloads = normalizeWorkload(body.workloads ?? body.workload ?? body.tags);

  const entry = {
    interest_id: makeId('ppi'),
    name,
    email,
    company,
    region,
    accelerator_type: accelerator_type || null,
    accelerator_model: accelerator_model || null,
    accelerator_count,
    memory_gb_per_chip,
    interconnect: interconnect || null,
    price_per_hour: price_per_hour || null,
    workloads,
    notes,
    status: 'waitlist',
    created_at: new Date().toISOString(),
  };

  store.providerPilot.push(entry);
  return {
    interest_id: entry.interest_id,
    status: entry.status,
    message:
      'Thanks — you are on the provider pilot waitlist. We will follow up by email. This does not provision live hardware or enable payouts yet.',
    created_at: entry.created_at,
  };
}

export function providerPilotSummary() {
  return {
    count: store.providerPilot.length,
    waitlist: true,
    paymentsEnabled: false,
    liveProvisioning: false,
  };
}
