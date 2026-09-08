import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState,quantity} from '../src/state';
import {ensureRenown} from '../src/renown';
import {marketBuy,marketSell} from '../src/market';

test('market buys with crowns and sells real inventory lots',()=>{
 const w=seedState(),p=makePlayer('Artisan');w.players[p.id]=p;const r=ensureRenown(p),gold=r.gold;const buy=marketBuy(w,p,'berries');assert.equal(buy.ok,true);assert.equal(r.gold,gold-3);assert.ok(quantity(p,'berries')>=6);const sell=marketSell(w,p,'berries');assert.equal(sell.ok,true);assert.equal(r.gold,gold-2);
});
test('market never creates goods when the purse is empty',()=>{
 const w=seedState(),p=makePlayer('Warden');w.players[p.id]=p;const r=ensureRenown(p);r.gold=0;const before=quantity(p,'iron'),out=marketBuy(w,p,'iron');assert.equal(out.ok,false);assert.equal(quantity(p,'iron'),before);assert.equal(r.gold,0);
});
