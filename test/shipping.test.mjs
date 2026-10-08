import test from 'node:test';import assert from 'node:assert/strict';import {Orders} from '../src/orders.mjs';
const req={items:[{sku:'book',unitCents:1000,quantity:1}]};
test('shipment requires paid order',()=>{const s=new Orders({book:3});const o=s.place(req,'a');assert.throws(()=>s.ship(o.id));});
test('paid order can ship',()=>{const s=new Orders({book:3});const o=s.place(req,'a');s.pay(o.id);assert.equal(s.ship(o.id).state,'shipped');});
test('shipment is idempotent',()=>{const s=new Orders({book:3});const o=s.place(req,'a');s.pay(o.id);s.ship(o.id);s.ship(o.id);assert.equal(s.inventory.available('book'),2);});
test('shipped cancellation cannot restore stock',()=>{const s=new Orders({book:3});const o=s.place(req,'a');s.pay(o.id);s.ship(o.id);assert.throws(()=>s.cancel(o.id));assert.equal(s.inventory.available('book'),2);});
