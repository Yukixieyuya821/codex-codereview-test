export function requireInteger(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(name + ' must be a safe integer');
  return value;
}
export function multiplyCents(unitCents, quantity) {
  requireInteger(unitCents, 'unitCents'); requireInteger(quantity, 'quantity', 1);
  return requireInteger(unitCents * quantity, 'line total');
}
export function rateCents(cents, basisPoints) {
  requireInteger(cents, 'cents'); requireInteger(basisPoints, 'basisPoints');
  if (basisPoints > 10000) throw new RangeError('basisPoints exceeds 10000');
  return Math.round(cents * basisPoints / 10000);
}
export function sumCents(values) {
  return values.reduce((sum, value) => requireInteger(sum + requireInteger(value, 'amount'), 'sum'), 0);
}
