import test from 'node:test';
import assert from 'node:assert/strict';
import {CellWindow} from '../src/area-cell-stream';
import {makePlayer,seedState} from '../src/state';
import {advanceIronwardToTick,ensureIronwardCapsule,INITIAL_IRONWARD_STATE,IRONWARD_DAY_TICKS,ironwardEventsForDay} from '../src/ironward-simulation';
import {replaySettlement} from '../src/world-capsule';
import {enterSavedArea,FAR_MARCH,IRONWARD_BASIN,IRONWARD_CROSSING,migrateRealmSave} from '../src/realm-save';

test('streaming cell window remains bounded while crossing an arbitrarily large coordinate range',()=>{
 const created:string[]=[],disposed:string[]=[];
 const stream=new CellWindow({cellSize:48,radius:1,create:c=>{const id=`${c.x},${c.z}`;created.push(id);return id;},dispose:h=>disposed.push(h.value)});
 for(const x of [0,47,49,480,4800,-4800,999999]){stream.update(x,x/2);assert.ok(stream.active.size<=9);assert.equal(stream.active.size,stream.maxActive);}
 assert.ok(created.length>9);assert.ok(disposed.length>0);stream.dispose();assert.equal(stream.active.size,0);
});

test('Ironward daily history is random-access deterministic',()=>{
 const one=ironwardEventsForDay(197709,37),two=ironwardEventsForDay(197709,37);
 assert.deepEqual(one,two);assert.ok(one.length>=1);assert.equal(one[0].kind,'ordinary_day');
});

test('compiled Ironward catch-up exactly matches full daily replay',()=>{
 const world=seedState();world.worldSeed=887766;world.tick=0;ensureIronwardCapsule(world);
 const targetDay=42,events=[];for(let day=1;day<=targetDay;day++)events.push(...ironwardEventsForDay(world.worldSeed,day));
 const oracle=replaySettlement(structuredClone(INITIAL_IRONWARD_STATE),events);
 const result=advanceIronwardToTick(world,targetDay*IRONWARD_DAY_TICKS);
 assert.equal(result.days,targetDay);assert.equal(result.eventCount,events.length);assert.deepEqual(result.state,oracle);assert.deepEqual(ensureIronwardCapsule(world).state,oracle);
});

test('Ironward catch-up is idempotent at an already compiled world day',()=>{
 const world=seedState();world.worldSeed=42;ensureIronwardCapsule(world);const tick=19*IRONWARD_DAY_TICKS;
 const first=advanceIronwardToTick(world,tick),snapshot=structuredClone(ensureIronwardCapsule(world));const second=advanceIronwardToTick(world,tick);
 assert.ok(first.days>0);assert.equal(second.days,0);assert.equal(second.eventCount,0);assert.deepEqual(ensureIronwardCapsule(world),snapshot);
});

test('Far March Crossing Basin chain preserves independent local positions',()=>{
 const world=seedState(),p=makePlayer('Warden');world.players[p.id]=p;migrateRealmSave(world);p.position=[220,3,40];p.yaw=.4;
 enterSavedArea(world,IRONWARD_CROSSING);p.position=[2,.03,20];p.yaw=.8;
 enterSavedArea(world,IRONWARD_BASIN);p.position=[18,.03,61];p.yaw=1.2;
 enterSavedArea(world,IRONWARD_CROSSING);assert.deepEqual(p.position,[2,.03,20]);assert.equal(p.yaw,.8);
 enterSavedArea(world,FAR_MARCH);assert.deepEqual(p.position,[220,3,40]);assert.equal(p.yaw,.4);
 enterSavedArea(world,IRONWARD_BASIN);assert.deepEqual(p.position,[18,.03,61]);assert.equal(p.yaw,1.2);
});

test('Ironward capsule survives JSON snapshots without retaining full history',()=>{
 const world=seedState();world.worldSeed=123;ensureIronwardCapsule(world);advanceIronwardToTick(world,80*IRONWARD_DAY_TICKS);const restored=JSON.parse(JSON.stringify(world));
 const capsule=restored.settlementCapsules['ironward-gatewatch'];assert.ok(capsule);assert.ok(capsule.totalEvents>80);assert.ok(capsule.epochs>1);assert.ok(capsule.recentEvents.length<=8);assert.ok(JSON.stringify(capsule).length<2500);
});
