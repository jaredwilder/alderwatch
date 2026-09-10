import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const shell=readFileSync(new URL('../src/area-gameplay-shell.ts',import.meta.url),'utf8');
const crossing=readFileSync(new URL('../src/ironward-crossing.ts',import.meta.url),'utf8');

test('cross-area shell exposes the same survivor controls instead of a travel-only HUD',()=>{
 for(const token of ['TAB · PACK','M · MAP','J · JOURNAL','C · RECIPES','KeyQ','Digit1','Digit5'])assert.ok(shell.includes(token),`missing ${token}`);
 assert.ok(shell.includes('Inventory, gathering, crafting and progression are shared.'));
 assert.ok(!shell.includes('__area-planning-only__'),'streamed areas must not be hardwired to recipe-planning-only mode');
 assert.ok(shell.includes('nearestStation()'),'streamed areas must resolve real local crafting stations');
});

test('streamed-area map uses the Far March cartography visual contract',()=>{
 for(const token of ['world-map-overlay','world-map-frame','world-map-layout','world-map-sidebar','world-map-you','world-map-selection'])assert.ok(shell.includes(token),`missing shared map surface ${token}`);
 assert.ok(shell.includes('Areas are streamed world geography, not separate games.'));
});

test('streamed-area shell explicitly owns M because generic Input reserves M for a map surface',()=>{
 assert.match(shell,/window\.addEventListener\('keydown',this\.onKey,true\)/);
 assert.match(shell,/e\.code!==\'KeyM\'/);
 assert.match(shell,/if\(this\.mode===\'map\'\)this\.close\(\);else this\.openMap\(\)/);
});

test('Ironward Crossing actually mounts the shell with live local bounds and gates',()=>{
 assert.ok(crossing.includes("new AreaGameplayShell"));
 assert.ok(crossing.includes("areaId:IRONWARD_CROSSING"));
 assert.ok(crossing.includes("bounds:{minX:-32,maxX:32,minZ:-36,maxZ:36}"));
 assert.ok(crossing.includes("label:'Far March Gate'"));
 assert.ok(crossing.includes("label:'Gatewatch Road'"));
 assert.ok(crossing.includes('equipVisual:item=>character.equip(item)'));
});

test('open survivor panels suppress world locomotion instead of mutating area coordinates behind UI',()=>{
 assert.ok(crossing.includes('character.preStep(1/60,input,yaw,!shell?.blocked)'));
 assert.ok(crossing.includes('if(!shell?.blocked)updateHud(now)'));
 assert.ok(shell.includes("this.o.input.active=false"));
 assert.ok(shell.includes("this.o.input.active=true"));
});
