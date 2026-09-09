import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STREAMED_GRASS_RINGS,streamedGrassBudget} from '../src/streamed-observer-grass';
import {AREA_ENTRY,WOLFPINE} from '../src/realm-save';
import {realmRoutes,realmRouteAtlasText} from '../src/realm-route-surfacing';
import {WOLFPINE_ACTIVE_CELL_CAP,WOLFPINE_ADDRESSABLE_CELLS,WOLFPINE_POIS} from '../src/wolfpine-world';

test('streamed observer grass keeps a fixed frontier budget independent of realm size',()=>{
 const budget=streamedGrassBudget();
 assert.equal(STREAMED_GRASS_RINGS.length,4);
 assert.equal(budget.drawCalls,4);
 assert.equal(budget.slots,18368);
 assert.equal(budget.maxTriangles,266496);
 assert.ok(budget.maxTriangles<300000);
});

test('Wolfpine is a bounded major region with preserved authored sites',()=>{
 assert.equal(WOLFPINE_ADDRESSABLE_CELLS,121);
 assert.equal(WOLFPINE_ACTIVE_CELL_CAP,9);
 assert.ok(AREA_ENTRY[WOLFPINE]);
 assert.ok(WOLFPINE_POIS.some(p=>p.name==='Wolfpine Charcoal Camp'));
 assert.ok(WOLFPINE_POIS.some(p=>p.name==='The Bent Spear Stockade'));
});

test('Wolfpine is surfaced from Crownroad and can return west',()=>{
 assert.ok(realmRoutes('crownroad-vale').some(r=>r.areaId===WOLFPINE&&r.kind==='area'));
 assert.ok(realmRoutes(WOLFPINE).some(r=>r.areaId==='crownroad-vale'&&r.kind==='area'));
 assert.match(realmRouteAtlasText(),/Wolfpine/);
});

test('dev tools expose Wolfpine before the area is called playable',()=>{
 const dev=readFileSync(new URL('../src/dev-tools.ts',import.meta.url),'utf8');
 assert.match(dev,/Travel · Wolfpine/);
 assert.match(dev,/Jump · Charcoal Camp/);
 assert.match(dev,/wolfpine:WOLFPINE/);
});

test('streamed frontier graphics compose before large overworld construction',()=>{
 const bootstrap=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8');
 const installer=bootstrap.indexOf('await installStreamedFrontierGraphics();');
 const basin=bootstrap.indexOf("await import('./ironward-basin')");
 const crown=bootstrap.indexOf("await import('./crownroad-vale')");
 const wolf=bootstrap.indexOf("await import('./wolfpine')");
 assert.ok(installer>=0&&installer<basin);
 assert.ok(crown>installer);
 assert.ok(wolf>installer);
});
