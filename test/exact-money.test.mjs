import test from 'node:test';
import assert from 'node:assert/strict';
import {rateCents} from '../src/money.mjs';
test('large safe amount uses exact integer product',()=>{for(const cents of [9007199254740989,4503599627370493,8876543210123456])for(const bps of [1,3333,9999])assert.equal(rateCents(cents,bps),Number((BigInt(cents)*BigInt(bps)+5000n)/10000n));});
test('rate half rounds up',()=>assert.equal(rateCents(1,5000),1));
test('rate result safe at full discount',()=>assert.equal(rateCents(Number.MAX_SAFE_INTEGER,10000),Number.MAX_SAFE_INTEGER));
