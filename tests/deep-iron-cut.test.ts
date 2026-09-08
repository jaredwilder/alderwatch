import test from 'node:test';
import assert from 'node:assert/strict';
import {seedState,makePlayer} from '../src/state';
import {DungeonGraphWindow} from '../src/dungeon-graph-stream';
import {DEEP_IRON_GRAPH,DEEP_IRON_ROOMS,DEEP_IRON_ROOM_BY_ID,DEEP_IRON_DAY_TICKS,advanceDeepIronToTick,ensureDeepIron,lowerWorksInput} from '../src/deep-iron-dungeon';
import {DEEP_MINE_CERTIFICATE_COUNT,DEEP_MINE_INPUTS,DEEP_MINE_STATES,deepMineCertificateFor,deepMineOutputKey,deepMineQuotient,deepMineStep,stepDeepMineCertificate,type MineBoundaryOutput} from '../src/deep-iron-boundary';
import {DEEP_IRON_MINE,IRONWARD_BASIN,enterSavedArea,migrateRealmSave} from '../src/realm-save';

function reachable(start:string){const seen=new Set([start]),queue=[start];while(queue.length){const id=queue.shift()!;for(const next of DEEP_IRON_GRAPH[id].neighbors)if(!seen.has(next)){seen.add(next);queue.push(next);}}return seen;}

test('Deep Iron room graph is fully connected and physically cardinal',()=>{
 assert.equal(DEEP_IRON_ROOMS.length,24);assert.equal(reachable('entrance').size,DEEP_IRON_ROOMS.length);
 for(const room of DEEP_IRON_ROOMS)for(const id of DEEP_IRON_GRAPH[room.id].neighbors){const other=DEEP_IRON_ROOM_BY_ID[id],dx=Math.abs(room.position[0]-other.position[0]),dz=Math.abs(room.position[2]-other.position[2]);assert.ok((dx===18&&dz===0)||(dx===0&&dz===18),`${room.id} -> ${id} must be one room corridor`);}
});

test('graph streamer obeys a hard active-room budget independent of dungeon size',()=>{
 const graph:Record<string,{id:string;neighbors:string[]}>={};for(let i=0;i<10000;i++)graph['r'+i]={id:'r'+i,neighbors:[...(i?['r'+(i-1)]:[]),...(i<9999?['r'+(i+1)]:[])]};
 let created=0,disposed=0;const window=new DungeonGraphWindow({graph,budget:7,create:id=>{created++;return id;},dispose:()=>{disposed++;}});
 for(const id of ['r0','r50','r5000','r9999','r1234']){window.update(id);assert.ok(window.active.size<=7);assert.equal(window.maxActive,7);}
 window.dispose();assert.equal(window.active.size,0);assert.ok(created>7);assert.ok(disposed>0);
});

test('576-state runtime cut certificate exactly simulates all 16,384 microstates for every boundary input',()=>{
 assert.equal(DEEP_MINE_STATES.length,16384);assert.equal(DEEP_MINE_CERTIFICATE_COUNT,576);
 for(const state of DEEP_MINE_STATES){const certificate=deepMineCertificateFor(state);for(const input of DEEP_MINE_INPUTS){const micro=deepMineStep(state,input),cut=stepDeepMineCertificate(certificate,input);assert.equal(deepMineOutputKey(cut.output),deepMineOutputKey(micro.output));assert.equal(cut.certificate,deepMineCertificateFor(micro.state));}}
});

test('automatic partition refinement proves the runtime certificate never merges distinct boundary behavior',()=>{
 const quotient=deepMineQuotient();assert.ok(quotient.classes.length<=DEEP_MINE_CERTIFICATE_COUNT);assert.ok(quotient.classes.length<DEEP_MINE_STATES.length);
 const automaticClassByRuntime=new Map<number,number>();for(const state of DEEP_MINE_STATES){const runtime=deepMineCertificateFor(state),automatic=quotient.classOf.get(`${state.support},${state.ore},${state.threat},${state.rubbleMask}`)!;const prior=automaticClassByRuntime.get(runtime);if(prior===undefined)automaticClassByRuntime.set(runtime,automatic);else assert.equal(automatic,prior);}
});

test('cut certificate and full hidden mine remain trace-equivalent for a simulated year',()=>{
 const starts=DEEP_MINE_STATES.filter((_,i)=>i%2053===0).slice(0,8);
 for(const start of starts){let micro=structuredClone(start),certificate=deepMineCertificateFor(start);let last:MineBoundaryOutput={oreExport:0,casualties:0,alarm:'quiet',passage:'open'};for(let day=1;day<=365;day++){const input=lowerWorksInput(day,last),a=deepMineStep(micro,input),b=stepDeepMineCertificate(certificate,input);assert.equal(deepMineOutputKey(a.output),deepMineOutputKey(b.output));micro=a.state;certificate=b.certificate;last=a.output;}assert.equal(certificate,deepMineCertificateFor(micro));}
});

test('Deep Iron persistent catch-up remains compact and idempotent',()=>{
 const world=seedState();world.worldSeed=90210;const player=makePlayer('Warden');world.players[player.id]=player;const state=ensureDeepIron(world);const initial=state.lowerWorks.certificate;world.tick=120*DEEP_IRON_DAY_TICKS;assert.equal(advanceDeepIronToTick(world),true);assert.equal(state.lowerWorks.lastProcessedDay,120);assert.ok(state.lowerWorks.recent.length<=8);assert.notEqual(state.lowerWorks.certificate,initial);const snapshot=JSON.parse(JSON.stringify(world));assert.ok(snapshot.deepIron.lowerWorks.recent.length<=8);assert.equal(advanceDeepIronToTick(world),false);
});

test('Basin and Deep Iron preserve independent local positions across realm cuts',()=>{
 const world=seedState(),player=makePlayer('Hunter');world.players[player.id]=player;migrateRealmSave(world);player.areaId=IRONWARD_BASIN;player.position=[3,.03,149];player.yaw=.2;enterSavedArea(world,DEEP_IRON_MINE);assert.deepEqual(player.position,[0,.03,4]);player.position=[-18,.03,72];player.yaw=2.4;enterSavedArea(world,IRONWARD_BASIN);assert.deepEqual(player.position,[3,.03,149]);enterSavedArea(world,DEEP_IRON_MINE);assert.deepEqual(player.position,[-18,.03,72]);assert.equal(player.yaw,2.4);
});