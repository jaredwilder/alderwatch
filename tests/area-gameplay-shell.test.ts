import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const shell=readFileSync(new URL('../src/area-gameplay-shell.ts',import.meta.url),'utf8');
const crossing=readFileSync(new URL('../src/ironward-crossing.ts',import.meta.url),'utf8');

test('cross-area shell exposes the survivor controls instead of a travel-only HUD',()=>{
 for(const token of ['TAB · PACK','M · MAP','J · JOURNAL','C · RECIPES','KeyQ','Digit1','Digit5'])assert.ok(shell.includes(token),`missing ${token}`);
 assert.ok(shell.includes('Building is unavailable in ${this.o.areaName} until structures are area-addressed'));
 assert.ok(shell.includes('Recipe planning is available everywhere'));
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
