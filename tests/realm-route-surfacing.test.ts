import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CROWNROAD_VALE,DEEP_IRON_MINE,FAR_MARCH,IRONWARD_BASIN,IRONWARD_CROSSING} from '../src/realm-save';
import {REALM_ROUTE_GRAPH,realmRouteAtlasText,realmRoutes} from '../src/realm-route-surfacing';

test('realm atlas surfaces every currently playable loaded area instead of hiding them behind dev commands',()=>{
 const ids=[FAR_MARCH,IRONWARD_CROSSING,IRONWARD_BASIN,DEEP_IRON_MINE,CROWNROAD_VALE];
 for(const id of ids)assert.ok(REALM_ROUTE_GRAPH[id],`missing surfaced route node for ${id}`);
 const atlas=realmRouteAtlasText();
 assert.match(atlas,/Far March/);assert.match(atlas,/Ironward Crossing/);assert.match(atlas,/Gatewatch/);assert.match(atlas,/Deep Iron/);assert.match(atlas,/Greyhaven/);
});

test('Crossing has an explicit forward route and Basin visibly branches to both major regions',()=>{
 const crossing=realmRoutes(IRONWARD_CROSSING);assert.ok(crossing.some(r=>r.areaId===IRONWARD_BASIN&&/NORTH/.test(r.direction)));
 const basin=realmRoutes(IRONWARD_BASIN);assert.ok(basin.some(r=>r.areaId===DEEP_IRON_MINE&&/NORTH/.test(r.direction)));assert.ok(basin.some(r=>r.areaId===CROWNROAD_VALE&&/EAST/.test(r.direction)&&/Greyhaven/.test(r.name)));
});

test('streamed-area bootstrap always installs route surfacing and persistent realm chat',()=>{
 const source=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8');
 assert.match(source,/installStreamedAreaSurface/);assert.match(source,/realm-route-surfacing/);assert.match(source,/area-realm-chat/);
 for(const branch of ['IRONWARD_CROSSING','IRONWARD_BASIN','DEEP_IRON_MINE','CROWNROAD_VALE'])assert.match(source,new RegExp(`area===${branch}[\\s\\S]*?installStreamedAreaSurface\\(\\)`));
});

test('Far March map gets the beyond-March atlas while area chat shares the existing persistent world-chat stream',()=>{
 const runtime=readFileSync(new URL('../src/runtime-extensions.ts',import.meta.url),'utf8'),chat=readFileSync(new URL('../src/area-realm-chat.ts',import.meta.url),'utf8'),routes=readFileSync(new URL('../src/realm-route-surfacing.ts',import.meta.url),'utf8');
 assert.match(runtime,/realm-route-surfacing/);assert.match(routes,/BEYOND THE FAR MARCH/);assert.match(routes,/CONTINUE →/);
 assert.match(chat,/alderwatch\.playerbots\./);assert.match(chat,/\/api\/npc-chat/);assert.match(chat,/alderwatch:map-cursor/);assert.match(chat,/e\.code==='Enter'/);
});
