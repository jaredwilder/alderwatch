import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/ironward-basin.ts',import.meta.url),'utf8');

test('Ironward Basin carries the same survivor shell beyond Crossing',()=>{
 assert.match(source,/import \{AreaGameplayShell\} from '\.\/area-gameplay-shell'/);
 assert.match(source,/shell:new AreaGameplayShell|shell=new AreaGameplayShell/);
 assert.match(source,/shell\.mountHud\(\)/);
 assert.match(source,/shell\?\.update\(\)/);
 assert.match(source,/character\.preStep\(1\/60,input,yaw,!shell\?\.blocked\)/);
 assert.match(source,/if\(!shell\?\.blocked\)updateHud\(now\)/);
});

test('Gatewatch local atlas exposes the real downstream road topology',()=>{
 for(const landmark of ['Ironward Crossing Road','Lower Farms','Gatewatch','Crownroad Vale','Deep Iron'])assert.ok(source.includes(landmark),`missing Basin atlas landmark: ${landmark}`);
 assert.match(source,/bounds:\{minX:-HALF,maxX:HALF,minZ:-HALF,maxZ:HALF\}/);
 assert.match(source,/position:\[150,0,0\],kind:'gate'/);
 assert.match(source,/position:\[0,0,150\],kind:'gate'/);
 assert.match(source,/position:\[0,0,-150\],kind:'gate'/);
});
