import {quote} from './pricing.mjs';
import {Inventory} from './inventory.mjs';
function canonical(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('nonfinite numbers are not allowed');
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export class Orders {
  constructor(seed) {
    this.inventory = new Inventory(seed);
    this.orders = new Map(); this.requests = new Map(); this.nextId = 1;
  }
  place(request, idempotencyKey) {
    if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) throw new TypeError('idempotency key required');
    const fingerprint = canonical(request);
    const previous = this.requests.get(idempotencyKey);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error('idempotency key payload mismatch');
      return structuredClone(this.orders.get(previous.orderId));
    }

    // Validate everything before reserving inventory or recording an order.
    // A failed request must not consume an idempotency key or order ID.
    // Returned values are detached from persisted state.
    const id = 'ORD-' + this.nextId;
    const priced = quote(request);
    this.inventory.reserve(id, priced.lines);
    const order = {id, state: 'reserved', ...priced};
    this.orders.set(id, order);
    this.requests.set(idempotencyKey, {fingerprint, orderId: id});
    this.nextId++;
    return structuredClone(order);
  }
  pay(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('unknown order');
    if (order.state === 'paid') return structuredClone(order);
    if (order.state !== 'reserved') throw new Error('invalid payment state');
    order.state = 'paid'; return structuredClone(order);
  }
  cancel(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('unknown order');
    if (order.state === 'cancelled') return structuredClone(order);
    if (order.state !== 'reserved') throw new Error('paid order requires manual refund');
    this.inventory.release(orderId); order.state = 'cancelled'; return structuredClone(order);
  }
}
