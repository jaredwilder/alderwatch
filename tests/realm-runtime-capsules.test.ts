import test from 'node:test';
import assert from 'node:assert/strict';
import {RealmManager,seedRealmRuntime,type AreaLifecycle} from '../src/realm-runtime';
import {cellId,morton2D,worldBits,worldInt,worldRandom} from '../src/world-address';
import {
  SETTLEMENT_REGIMES,
  applySettlementEvent,
  applyWorldBlock,
  composeWorldBlocks,
  identityWorldBlock,
  rebaseSettlement,
  replaySettlement,
  summarizeEvents,
  summarizeEvent,
  worldBlockKey,
  type SettlementMacroState,
  type WorldEvent,
  type WorldEventKind,
} from '../src/world-capsule';

const initial=(regime:SettlementMacroState['regime']='calm'):SettlementMacroState=>({regime,population:500,food:800,iron:90,treasury:300,guards:45,danger:6});
const KINDS:WorldEventKind[]=['ordinary_day','market_day','harvest','caravan_arrival','bandit_raid','guard_reinforcement','winter_shortage','recovery_day'];

test('realm manager disposes outgoing area before loading incoming area',()=>{
  const log:string[]=[];
  const area=(id:string):AreaLifecycle<{id:string}>=>({id,load(){log.push('load:'+id);return{id}},dispose(){log.push('dispose:'+id)}});
  const state=seedRealmRuntime(0),manager=new RealmManager(new Map([['far-march',area('far-march')],['ironward',area('ironward')]]),state);
  manager.enter('far-march',0);manager.enter('ironward',10);manager.enter('far-march',20);
  assert.deepEqual(log,['load:far-march','dispose:far-march','load:ironward','dispose:ironward','load:far-march']);
  assert.equal(state.activeAreaId,'far-march');
  assert.equal(state.areas['far-march'].visitCount,2);
  assert.equal(state.areas['ironward'].leftAtTick,20);
});

test('world addressing is random-access, repeatable and order independent',()=>{
  const base={realmSeed:197709,areaId:'ironward',cellX:17,cellZ:-4,slot:8,tag:'oak',epoch:3};
  const a=worldBits(base),b=worldBits({...base}),other=worldBits({...base,slot:9});
  assert.equal(a,b);assert.notEqual(a,other);
  const scrambled=[9,2,30,1,8].map(slot=>worldBits({...base,slot}));
  const direct=new Map([9,2,30,1,8].map(slot=>[slot,worldBits({...base,slot})]));
  assert.deepEqual(scrambled,[9,2,30,1,8].map(slot=>direct.get(slot)));
  assert.ok(worldRandom(base)>=0&&worldRandom(base)<1);
  assert.ok(worldInt(base,7)>=0&&worldInt(base,7)<7);
});

test('Morton cell identity is stable and distinguishes nearby cells',()=>{
  assert.equal(morton2D(0,0),0n);
  assert.equal(morton2D(1,0),1n);
  assert.equal(morton2D(0,1),2n);
  assert.notEqual(cellId('far-march',4,7),cellId('far-march',4,8));
  assert.notEqual(cellId('far-march',4,7),cellId('ironward',4,7));
});

test('one-event capsule exactly matches direct simulation for every semantic start state',()=>{
  for(const regime of SETTLEMENT_REGIMES)for(const kind of KINDS){
    const event:WorldEvent={kind,magnitude:3},state=initial(regime);
    assert.deepEqual(applyWorldBlock(state,summarizeEvent(event)),applySettlementEvent(state,event));
  }
});

test('ordered world blocks are associative but not generally commutative',()=>{
  const a=summarizeEvent({kind:'bandit_raid',magnitude:3});
  const b=summarizeEvent({kind:'guard_reinforcement',magnitude:2});
  const c=summarizeEvent({kind:'market_day',magnitude:1});
  assert.equal(worldBlockKey(composeWorldBlocks(composeWorldBlocks(a,b),c)),worldBlockKey(composeWorldBlocks(a,composeWorldBlocks(b,c))));
  assert.notEqual(worldBlockKey(composeWorldBlocks(a,b)),worldBlockKey(composeWorldBlocks(b,a)));
  assert.equal(worldBlockKey(composeWorldBlocks(identityWorldBlock(),a)),worldBlockKey(a));
});

test('World Capsule Court: 4000 deterministic adversarial event sequences equal tick replay',()=>{
  let seed=0x4a524544;
  const rng=()=>{seed=Math.imul(seed^seed>>>15,0x2c1b3c6d);seed=Math.imul(seed^seed>>>12,0x297a2d39);seed^=seed>>>15;return(seed>>>0)/4294967296;};
  for(let trial=0;trial<4000;trial++){
    const events:WorldEvent[]=[],n=1+Math.floor(rng()*80);
    for(let i=0;i<n;i++)events.push({kind:KINDS[Math.floor(rng()*KINDS.length)],magnitude:1+Math.floor(rng()*8)});
    for(const regime of SETTLEMENT_REGIMES){
      const start=initial(regime),replay=replaySettlement(start,events),compiled=applyWorldBlock(start,summarizeEvents(events));
      assert.deepEqual(compiled,replay,`trial ${trial} regime ${regime}`);
    }
  }
});

test('epoch rebase preserves exact current state and resets composition history',()=>{
  const events:WorldEvent[]=[{kind:'bandit_raid',magnitude:4},{kind:'guard_reinforcement',magnitude:2},{kind:'recovery_day'}];
  const current=applyWorldBlock(initial(),summarizeEvents(events)),rebased=rebaseSettlement(current);
  assert.deepEqual(rebased.checkpoint,current);
  assert.deepEqual(applyWorldBlock(rebased.checkpoint,rebased.nextBlock),current);
  assert.equal(rebased.nextBlock.eventCount,0);
});

test('sparse named exceptions fail closed instead of being laundered into a macro block',()=>{
  const event:WorldEvent={kind:'bandit_raid',magnitude:1,exceptionId:'mara-pennymarch'};
  assert.throws(()=>summarizeEvent(event),/Sparse exception/);
  assert.throws(()=>applySettlementEvent(initial(),event),/Sparse exception/);
});
