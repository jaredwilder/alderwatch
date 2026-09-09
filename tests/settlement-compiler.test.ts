import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHARCOAL_CAMP_CHARTER,CHARCOAL_CAMP_PLAN,compileCharcoalCamp} from '../src/charcoal-camp-plan';
import {placementsWithin,settlementClearanceAt} from '../src/settlement-compiler';

const CELL=48;
const cellOf=(x:number,z:number)=>`${Math.round(x/CELL)},${Math.round(z/CELL)}`;

test('SG-1 Charcoal Camp compiles deterministically from one semantic charter',()=>{
 assert.deepEqual(compileCharcoalCamp(),compileCharcoalCamp());
 assert.equal(CHARCOAL_CAMP_PLAN.charter.id,'wolfpine-charcoal-camp');
 assert.equal(CHARCOAL_CAMP_CHARTER.purpose.includes('charcoal'),true);
 assert.equal(CHARCOAL_CAMP_PLAN.zones.length,8);
 assert.equal(CHARCOAL_CAMP_PLAN.paths.length,8);
 assert.ok(CHARCOAL_CAMP_PLAN.placements.length>=26);
 assert.equal(CHARCOAL_CAMP_PLAN.score.access,1);
 assert.ok(CHARCOAL_CAMP_PLAN.score.storyCoherence>.95);
 assert.ok(CHARCOAL_CAMP_PLAN.score.total>.9);
});

test('camp topology connects arrival to work, shelter, storage, water and cart service',()=>{
 const byId=new Map(CHARCOAL_CAMP_PLAN.zones.map(z=>[z.id,z]));
 for(const id of ['arrival','fire-court','sleep-shelter','covered-store','charcoal-work','loading-yard','cart-service','water-run'])assert.ok(byId.has(id),id);
 const edges=new Set(CHARCOAL_CAMP_PLAN.paths.flatMap(p=>[`${p.from}>${p.to}`,`${p.to}>${p.from}`]));
 assert.ok(edges.has('arrival>fire-court'));
 assert.ok(edges.has('fire-court>charcoal-work'));
 assert.ok(edges.has('charcoal-work>loading-yard'));
 assert.ok(edges.has('loading-yard>cart-service'));
 assert.ok(edges.has('sleep-shelter>water-run'));
 const cart=CHARCOAL_CAMP_PLAN.paths.find(p=>p.id==='yard-to-cart')!;assert.ok(cart.width>=3.2,'wagon service path must remain cart-width');
});

test('props are semantic story clusters instead of independent scatter',()=>{
 const stories=new Map<string,string[]>();for(const p of CHARCOAL_CAMP_PLAN.placements){const list=stories.get(p.story)??[];list.push(p.id);stories.set(p.story,list);}
 for(const story of ['crew-shelter','social-fire','covered-storage','charcoal-work','loading-yard','cart-service','water-run'])assert.ok((stories.get(story)?.length??0)>=2,`${story} must be a cluster`);
 const wagon=CHARCOAL_CAMP_PLAN.placements.find(p=>p.id==='loading-wagon')!;assert.equal(wagon.zoneId,'loading-yard');
 const timber=CHARCOAL_CAMP_PLAN.placements.filter(p=>p.story==='charcoal-work'&&p.asset==='wood_pile');assert.ok(timber.length>=3);
});

test('settlement plan crosses streaming cells but cells only slice the finished plan',()=>{
 const occupied=new Set(CHARCOAL_CAMP_PLAN.placements.map(p=>cellOf(p.position.x,p.position.z)));
 assert.ok(occupied.size>=3,`expected multi-cell proof, got ${[...occupied].join(' ')}`);
 const slices=[-1,0,1].map(x=>placementsWithin(CHARCOAL_CAMP_PLAN,x*CELL-CELL/2,x*CELL+CELL/2,-72,-24).length);
 assert.ok(slices.filter(n=>n>0).length>=3,'west/core/east cells must all receive compiler-owned placements');
});

test('forest clearing derives from semantic use-space rather than a camp-centre radius',()=>{
 assert.equal(settlementClearanceAt(CHARCOAL_CAMP_PLAN,13,-49,2),true,'charcoal work zone');
 assert.equal(settlementClearanceAt(CHARCOAL_CAMP_PLAN,-27,-61,2),true,'water run');
 assert.equal(settlementClearanceAt(CHARCOAL_CAMP_PLAN,26,-34,2),true,'cart service');
 assert.equal(settlementClearanceAt(CHARCOAL_CAMP_PLAN,43,-80,2),false,'unrelated forest');
});

test('Wolfpine runtime consumes the compiler and deletes the old one-cell camp recipe',()=>{
 const source=readFileSync(new URL('../src/wolfpine.ts',import.meta.url),'utf8');
 assert.match(source,/renderSettlementCell\(\{plan:CHARCOAL_CAMP_PLAN/);
 assert.match(source,/settlementClearanceAt\(CHARCOAL_CAMP_PLAN/);
 assert.doesNotMatch(source,/coord\.x===0&&coord\.z===-1\)\{const shelter=assets\.authoredCampShelter/);
});
