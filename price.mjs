export function totalCents(unitCents, quantity, discountPercent) {
  return Math.round(unitCents * quantity * (100 + discountPercent) / 100);
}
