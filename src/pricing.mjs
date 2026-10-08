import {requireInteger, multiplyCents, rateCents, sumCents} from './money.mjs';
export function quote(request) {
  if (!Array.isArray(request.items) || request.items.length === 0) throw new RangeError('items required');
  const lines = request.items.map(item => {
    if (typeof item.sku !== 'string' || !item.sku.trim()) throw new TypeError('sku required');
    return {sku: item.sku, quantity: requireInteger(item.quantity, 'quantity', 1), subtotalCents: multiplyCents(item.unitCents, item.quantity)};
  });
  const subtotalCents = sumCents(lines.map(line => line.subtotalCents));
  const couponBps = request.couponBps ?? 0;
  const discountCents = rateCents(subtotalCents, couponBps);
  const taxableCents = subtotalCents - discountCents;
  const taxCents = rateCents(taxableCents, request.taxBps ?? 0);
  const shippingCents = requireInteger(request.shippingCents ?? 500, 'shippingCents');
  return {lines, subtotalCents, discountCents, taxCents, shippingCents, totalCents: sumCents([taxableCents, taxCents, shippingCents])};
}
