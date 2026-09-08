import test from 'node:test';
import assert from 'node:assert/strict';
import {CellWindow} from '../src/area-cell-stream';
import {CROWNROAD_ACTIVE_CELL_CAP,CROWNROAD_ADDRESSABLE_CELLS,CROWNROAD_GRID_WIDTH,CROWNROAD_RADIUS,crownroadCellIndex,crownroadCellInBounds,crownroadWardForCell} from '../src/crownroad-world';
import {CROWNROAD_VALE,IRONWARD_BASIN,enterSavedArea,migrateRealmSave,rememberCurrentArea} from '../src/realm-save';
import {makePlayer,seedState} from '../src/state';

test('Crownroad Vale exposes exactly 169 deterministic major-region cells',()=>{const indices=new Set<number>(),wards=new Set<number>();for(let z=-CROWNROAD_RADIUS;z<=CROWNROAD_RADIUS;z++)for(let x=-CROWNROAD_RADIUS;x<=CROWNROAD_RADIUS;x++){assert.ok(crownroadCellInBounds({x,z}));indices.add(crownroadCellIndex({x,z}));wards.add(crownroadWardForCell({x,z}));}assert.equal(CROWNROAD_GRID_WIDTH,13);assert.equal(CROWNROAD_ADDRESSABLE_CELLS,169);assert.equal(indices.size,169);assert.equal(Math.min(...indices),0);assert.equal(Math.max(...indices),168);assert.equal(wards.size,32);});

test('Crownroad runtime residency stays capped at nine regardless of traversal distance',()=>{let created=0,disposed=0;const stream=new CellWindow({cellSize:48,radius:1,create:coord=>{created++;return `${coord.x},${coord.z}`;},dispose:()=>{disposed++;}});assert.equal(stream.maxActive,CROWNROAD_ACTIVE_CELL_CAP);for(const [x,z] of [[-290,0],[-200,160],[0,0],[220,-190],[290,0],[999999,999999],[-999999,777777]] as const){stream.update(x,z);assert.ok(stream.active.size<=9);}assert.ok(created>9);assert.ok(disposed>0);stream.dispose();assert.equal(stream.active.size,0);});

test('Crownroad has independent persistent position and round-trips through Ironward',()=>{const world=seedState();const p=makePlayer('Wayfarer');world.players[p.id]=p;migrateRealmSave(world);enterSavedArea(world,CROWNROAD_VALE);assert.equal(p.areaId,CROWNROAD_VALE);p.position=[123,0.03,-77];p.yaw=.75;rememberCurrentArea(p);enterSavedArea(world,IRONWARD_BASIN);assert.equal(p.areaId,IRONWARD_BASIN);enterSavedArea(world,CROWNROAD_VALE);assert.deepEqual(p.position,[123,0.03,-77]);assert.equal(p.yaw,.75);assert.equal(world.realmAreas?.[CROWNROAD_VALE]?.visitCount,2);});
