import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer} from '../src/state';
import {ACHIEVEMENTS,ensureRenown,recordRenownEvent} from '../src/renown';

test('crow milk immediately unlocks the correct ridiculous achievement',()=>{
 const p=makePlayer('Hunter'),before=ensureRenown(p);assert.equal(before.gold,25);const unlocked=recordRenownEvent(p,'drink_crow_milk',1,10);assert.ok(unlocked.some(a=>a.id==='crowmilk_first'));assert.ok(ensureRenown(p).achievements.crowmilk_first);
});
test('karma and fame are independent like classic Ultima notoriety',()=>{
 const p=makePlayer('Warden');for(let i=0;i<12;i++)recordRenownEvent(p,'kill_hare',1,i);for(let i=0;i<10;i++)recordRenownEvent(p,'kill_baddie',1,20+i);const r=ensureRenown(p);assert.ok(r.fame>0);assert.ok(r.karma>0,'good deeds can recover bad karma while fame keeps accumulating');for(let i=0;i<35;i++)recordRenownEvent(p,'kill_hare',1,40+i);assert.ok(ensureRenown(p).karma<0);assert.ok(ensureRenown(p).fame>10);
});
test('achievement catalog is extensive rather than a token badge system',()=>{assert.ok(ACHIEVEMENTS.length>=25);assert.ok(ACHIEVEMENTS.some(a=>a.title.includes('CROW MILK')));assert.ok(ACHIEVEMENTS.some(a=>a.id==='famous_villain'));});
