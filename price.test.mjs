import test from 'node:test';
import assert from 'node:assert/strict';
import {totalCents} from './price.mjs';
test('discount reduces total',()=>assert.equal(totalCents(1000,2,10),1800));
test('zero discount',()=>assert.equal(totalCents(1234,3,0),3702));
test('nearest cent',()=>assert.equal(totalCents(101,1,15),86));
