import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {crownroadIsGreyhavenCell,crownroadLocationName} from '../src/crownroad-world';

test('Greyhaven occupies a deliberate 3x3 city footprint instead of one procedural cell',()=>{
 const cells=[] as string[];
 for(let z=-2;z<=2;z++)for(let x=-2;x<=2;x++)if(crownroadIsGreyhavenCell({x,z}))cells.push(`${x},${z}`);
 assert.equal(cells.length,9);assert.ok(cells.includes('0,0'));assert.ok(cells.includes('-1,-1'));assert.ok(cells.includes('1,1'));
 assert.equal(crownroadLocationName(0,0),'Greyhaven');
 assert.equal(crownroadLocationName(48,0),'Greyhaven · East Ward');
 assert.equal(crownroadLocationName(-48,0),'Greyhaven · West Ward');
 assert.equal(crownroadLocationName(0,-48),'Greyhaven · South Ward');
 assert.equal(crownroadLocationName(0,48),'Greyhaven · North Ward');
});

test('large overworld runtimes keep nine-cell detail but mount Tier-2 visual continuity beneath it',()=>{
 const crown=readFileSync(new URL('../src/crownroad-vale.ts',import.meta.url),'utf8');
 const basin=readFileSync(new URL('../src/ironward-basin.ts',import.meta.url),'utf8');
 for(const source of [crown,basin]){
  assert.match(source,/createStreamedAreaFarField/);
  assert.match(source,/new CellWindow\(\{cellSize:/);
  assert.match(source,/stream\.residentSize/);
 }
 assert.match(crown,/crownroadIsGreyhavenCell\(coord\)\?0:roadside/,'Greyhaven must not receive random scatter on top of authored city composition');
 assert.doesNotMatch(crown,/setHSL\(\.18\+worldRandom/,'Crownroad cell ground must not advertise cell boundaries through random tint');
 assert.doesNotMatch(basin,/setHSL\(\.19\+worldRandom/,'Basin cell ground must not advertise cell boundaries through random tint');
});
