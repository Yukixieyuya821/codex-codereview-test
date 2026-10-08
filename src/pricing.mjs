import {requireInteger, multiplyCents, rateCents, sumCents} from './money.mjs';
export function membershipDiscount(request) {
  const tiers = {standard: 0, silver: 500, gold: 1000};
  const tier = request.memberTier ?? 'standard';
  if (typeof tier !== 'string' || !Object.hasOwn(tiers, tier)) throw new RangeError('unknown member tier');
  const coupon = requireInteger(request.couponBps ?? 0, 'couponBps');
  if (coupon > 10000) throw new RangeError('couponBps exceeds 10000');
  return Math.max(coupon, tiers[tier]);
}
export function quote(request) {
  if (!Array.isArray(request.items) || request.items.length === 0) throw new RangeError('items required');
  const lines = request.items.map(item => {
    if (typeof item.sku !== 'string' || !item.sku.trim()) throw new TypeError('sku required');
    return {sku: item.sku, quantity: requireInteger(item.quantity, 'quantity', 1), subtotalCents: multiplyCents(item.unitCents, item.quantity)};
  });
  const subtotalCents = sumCents(lines.map(line => line.subtotalCents));
  const couponBps = membershipDiscount(request);
  const discountCents = rateCents(subtotalCents, couponBps);
  const taxableCents = subtotalCents - discountCents;
  const taxCents = rateCents(taxableCents, request.taxBps ?? 0);
  const shippingCents = requireInteger(request.shippingCents ?? 500, 'shippingCents');
  return {lines, subtotalCents, discountCents, taxCents, shippingCents, totalCents: sumCents([taxableCents, taxCents, shippingCents])};
}
