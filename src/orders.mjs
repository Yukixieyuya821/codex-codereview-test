import {quote, membershipDiscount} from './pricing.mjs';
import {Inventory} from './inventory.mjs';
function canonical(value) {
  const kind = typeof value;
  if (kind === 'symbol' || kind === 'function' || kind === 'bigint') throw new TypeError('unsupported payload type');
  if (kind === 'number' && !Number.isFinite(value)) throw new TypeError('nonfinite numbers are not allowed');
  if (value === undefined) return 'undefined';
  if (value && kind === 'object') {
    if (Object.getOwnPropertySymbols(value).length) throw new TypeError('symbol payload keys are unsupported');
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (Array.isArray(value) && key === 'length') continue;
      if (!descriptor.enumerable || !('value' in descriptor)) throw new TypeError('static enumerable payload required');
    }
  }
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError('plain array required');
    const keys = Object.keys(value);
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) throw new TypeError('dense unnamed array required');
    return '[' + keys.map(key => canonical(value[key])).join(',') + ']';
  }
  if (value && kind === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError('plain payload object required');
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
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
    request = {...request, couponBps: membershipDiscount(request)};
    const previous = this.requests.get(idempotencyKey);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error('idempotency key payload mismatch');
      return structuredClone(this.orders.get(previous.orderId));
    }

    // Validate everything before reserving inventory or recording an order.
    // A failed request must not consume an idempotency key or order ID.
    // Returned values are detached from persisted state.
    const id = 'ORD-' + this.nextId;
    const normalized = {
      items: request.items,
      couponBps: request.couponBps,
      taxBps: request.taxBps,
      shippingCents: request.shippingCents
    };
    const priced = quote(normalized);
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
  ship(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('unknown order');
    if (order.state === 'shipped') return structuredClone(order);
    if (order.state !== 'paid') throw new Error('order must be paid before shipment');
    order.state = 'shipped'; return structuredClone(order);
  }
  cancel(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('unknown order');
    if (order.state === 'cancelled') return structuredClone(order);
    if (order.state !== 'reserved') throw new Error('paid order requires manual refund');
    this.inventory.release(orderId); order.state = 'cancelled'; return structuredClone(order);
  }
}
