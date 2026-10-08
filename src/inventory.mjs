import {requireInteger} from './money.mjs';
export class Inventory {
  constructor(seed) {
    this.stock = new Map(); this.reservations = new Map();
    for (const [sku, amount] of Object.entries(seed)) this.stock.set(sku, requireInteger(amount, 'stock'));
  }
  available(sku) { return this.stock.get(sku) ?? 0; }
  reserve(orderId, lines) {
    if (this.reservations.has(orderId)) return;
    const requested = new Map();
    for (const line of lines) requested.set(line.sku, (requested.get(line.sku) ?? 0) + requireInteger(line.quantity, 'quantity', 1));
    for (const [sku, quantity] of requested) {
      requireInteger(quantity, 'aggregate quantity', 1);
      if (this.available(sku) < quantity) throw new Error('out of stock: ' + sku);
    }
    for (const [sku, quantity] of requested) this.stock.set(sku, this.available(sku) - quantity);
    this.reservations.set(orderId, requested);
  }
  release(orderId) {
    const reservation = this.reservations.get(orderId);
    if (!reservation) return false;
    for (const [sku, quantity] of reservation) this.stock.set(sku, this.available(sku) - quantity);
    this.reservations.delete(orderId); return true;
  }
}
