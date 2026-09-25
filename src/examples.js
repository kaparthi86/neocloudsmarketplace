/**
 * Fixed simulated catalog. These rows are not stored and never become live.
 * A neo-agent listing is the only path that can hand over access.
 */

export const EXAMPLE_NOTE =
  'Simulated reservation. No machine was opened and nothing was charged.';

export const PREVIEW_REPLY =
  'This is a canned example from Neo Clouds. No GPU or TPU ran this request, and nothing was billed.';

export const EXAMPLE_LISTINGS = [
  {
    listing_id: 'ex_lst_h100',
    example: true,
    simulated: true,
    live: false,
    available: true,
    provider_id: 'example',
    node_id: null,
    accelerator_type: 'gpu',
    accelerator_model: 'H100-SXM5-80GB',
    gpu_model: 'H100-SXM5-80GB',
    gpu_count: 8,
    vram_gb: 640,
    interconnect: 'NVLink',
    region: 'us-east-1',
    price_per_hour: '2.85',
    currency: 'USD',
    spot: false,
    min_hours: 1,
    max_hours: 168,
    network_bandwidth_gbps: 100,
    storage_gb: 2000,
    tags: ['training'],
    view_count: 0,
    reservation_count: 0,
    node_online: null,
  },
  {
    listing_id: 'ex_lst_a100',
    example: true,
    simulated: true,
    live: false,
    available: true,
    provider_id: 'example',
    node_id: null,
    accelerator_type: 'gpu',
    accelerator_model: 'A100-80GB',
    gpu_model: 'A100-80GB',
    gpu_count: 4,
    vram_gb: 320,
    interconnect: 'NVLink',
    region: 'eu-west-1',
    price_per_hour: '1.40',
    currency: 'USD',
    spot: false,
    min_hours: 1,
    max_hours: 168,
    network_bandwidth_gbps: 50,
    storage_gb: 1000,
    tags: ['inference'],
    view_count: 0,
    reservation_count: 0,
    node_online: null,
  },
  {
    listing_id: 'ex_lst_tpu',
    example: true,
    simulated: true,
    live: false,
    available: true,
    provider_id: 'example',
    node_id: null,
    accelerator_type: 'tpu',
    accelerator_model: 'TPU-v5e-8',
    gpu_model: 'TPU-v5e-8',
    gpu_count: 8,
    vram_gb: 128,
    interconnect: 'ICI',
    region: 'us-central1',
    price_per_hour: '1.10',
    currency: 'USD',
    spot: false,
    min_hours: 1,
    max_hours: 72,
    network_bandwidth_gbps: 25,
    storage_gb: 500,
    tags: ['fine-tune'],
    view_count: 0,
    reservation_count: 0,
    node_online: null,
  },
];

export const EXAMPLE_MODELS = [
  {
    model_id: 'ex_mdl_llama70',
    example: true,
    simulated: true,
    listing_id: 'ex_lst_h100',
    model_name: 'Llama-3.1-70B-Instruct',
    model_family: 'llama',
    context_length: 131072,
    input_price_per_1k_tokens: '0.90',
    output_price_per_1k_tokens: '0.90',
    currency: 'USD',
    accelerator_model: 'H100-SXM5-80GB',
    status: 'preview',
  },
  {
    model_id: 'ex_mdl_llama8',
    example: true,
    simulated: true,
    listing_id: 'ex_lst_a100',
    model_name: 'Llama-3.1-8B-Instruct',
    model_family: 'llama',
    context_length: 131072,
    input_price_per_1k_tokens: '0.08',
    output_price_per_1k_tokens: '0.08',
    currency: 'USD',
    accelerator_model: 'A100-80GB',
    status: 'preview',
  },
  {
    model_id: 'ex_mdl_gemma',
    example: true,
    simulated: true,
    listing_id: 'ex_lst_tpu',
    model_name: 'Gemma-2-9B-Instruct',
    model_family: 'gemma',
    context_length: 8192,
    input_price_per_1k_tokens: '0.06',
    output_price_per_1k_tokens: '0.06',
    currency: 'USD',
    accelerator_model: 'TPU-v5e-8',
    status: 'preview',
  },
];

export function findExampleListing(listingId) {
  return EXAMPLE_LISTINGS.find(l => l.listing_id === listingId) || null;
}

export function findExampleModel(ref) {
  return EXAMPLE_MODELS.find(m => m.model_id === ref || m.model_name === ref) || null;
}

export function previewExampleModel(modelRef) {
  const model = findExampleModel(modelRef);
  if (!model) {
    const e = new Error(`model '${modelRef}' not found`);
    e.status = 404;
    throw e;
  }
  return {
    id: `preview_${model.model_id}`,
    object: 'chat.completion',
    model: model.model_name,
    example: true,
    simulated: true,
    payment_collected: false,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: PREVIEW_REPLY },
      finish_reason: 'stop',
    }],
  };
}
