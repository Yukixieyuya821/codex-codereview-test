import test from 'node:test';
import assert from 'node:assert/strict';
import {Orders} from '../src/orders.mjs';
const req = changes => ({items:[{sku:'book',unitCents:1000,quantity:1}],...changes});
for(const field of ['taxBps','couponBps','shippingCents'])test('idempotency rejects nonfinite '+field+' instead of returning null-payload order',()=>{
  const s=new Orders({book:5});s.place(req({[field]:null}),'same');
  assert.throws(()=>s.place(req({[field]:NaN}),'same'));
  assert.throws(()=>s.place(req({[field]:Infinity}),'same'));
  assert.equal(s.inventory.available('book'),4);
});
