import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const crown=readFileSync(new URL('../src/crownroad-vale.ts',import.meta.url),'utf8');
const mine=readFileSync(new URL('../src/deep-iron-mine.ts',import.meta.url),'utf8');

test('Crownroad and Greyhaven keep the shared survivor shell instead of a stripped area HUD',()=>{
 assert.match(crown,/import \{AreaGameplayShell,type AreaMapLandmark\} from '\.\/area-gameplay-shell'/);
 assert.match(crown,/new AreaGameplayShell\(\{areaId:CROWNROAD_VALE,areaName:'Crownroad Vale'/);
 assert.match(crown,/bounds:\{minX:-CROWNROAD_HALF,maxX:CROWNROAD_HALF,minZ:-CROWNROAD_HALF,maxZ:CROWNROAD_HALF\}/);
 assert.match(crown,/CROWNROAD_POIS\.map/);
 assert.match(crown,/label:'Gatewatch Road'/);
 assert.match(crown,/shell\.mountHud\(\)/);
 assert.match(crown,/character\.preStep\(1\/60,input,yaw,!shell\.blocked\)/);
 assert.match(crown,/if\(!shell\.blocked\)\{discover\(\)/);
});

test('Deep Iron keeps the survivor shell and charts only explored mine rooms',()=>{
 assert.match(mine,/import \{AreaGameplayShell,type AreaMapLandmark\} from '\.\/area-gameplay-shell'/);
 assert.match(mine,/new AreaGameplayShell\(\{areaId:DEEP_IRON_MINE,areaName:'Deep Iron Mine'/);
 assert.match(mine,/bounds:\{minX:-52,maxX:52,minZ:-8,maxZ:110\}/);
 assert.match(mine,/new Set\(\[\.\.\.dungeon\.discovered,'entrance',currentRoom\.id\]\)/);
 assert.match(mine,/DEEP_IRON_ROOMS\.filter\(room=>known\.has\(room\.id\)\)/);
 assert.match(mine,/shell\.mountHud\(\)/);
 assert.match(mine,/!shellConsumed&&!shell\.blocked&&input\.take\('KeyE'\)/);
 assert.match(mine,/character\.preStep\(1\/60,input,yaw,!shell\.blocked\)/);
 assert.match(mine,/if\(!shell\.blocked\)updateHud\(now\)/);
});

test('both downstream shells still use physical travel and real equipment authority',()=>{
 for(const source of [crown,mine]){
  assert.match(source,/requestAreaTravel\(IRONWARD_BASIN\)/);
  assert.match(source,/equipVisual:item=>character\.equip\(item\)/);
  assert.match(source,/renderHud:hud,save/);
 }
});
