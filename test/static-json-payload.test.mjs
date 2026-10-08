import test from 'node:test';import assert from 'node:assert/strict';import {Orders} from '../src/orders.mjs';
const req=changes=>({items:[{sku:'book',unitCents:1000,quantity:1}],...changes});
test('sparse array cannot replay empty metadata array',()=>{const s=new Orders({book:5});s.place(req({metadata:[]}),'same');assert.throws(()=>s.place(req({metadata:Array(1)}),'same'));});
test('array DTO with named fields must be rejected',()=>{const s=new Orders({book:5});const a=Object.assign([],req({memberTier:'gold'}));assert.throws(()=>s.place(a,'bad'));assert.equal(s.inventory.available('book'),5);});
test('array extra properties must not collide with dense array',()=>{const s=new Orders({book:5});s.place(req({metadata:[]}), 'same');const extra=[];extra.extra='changed';assert.throws(()=>s.place(req({metadata:extra}),'same'));});
