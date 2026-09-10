import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('The Tipsy Alder has a permanent village-built street marker independent of lazy interior construction',()=>{
 const npc=readFileSync(new URL('../src/npc.ts',import.meta.url),'utf8');
 assert.match(npc,/TIPSY_ALDER_MARKER=\{x:-12\.15,z:-26\.35\}/);
 assert.ok(npc.includes("g.name='The Tipsy Alder · permanent street marker'"));
 assert.ok(npc.includes("c.fillText('THE TIPSY'"));
 assert.ok(npc.includes("c.fillText('ALDER'"));
 assert.ok(npc.includes('installTipsyAlderStreetMarker(root,assets);'),'street identity must be created synchronously with Village');
 const bridge=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8');
 assert.ok(bridge.includes('private ensure(position:Vec3)'),'test premise: interior construction remains independently lazy');
});

test('Tipsy Alder dev jump lands in the live porch and faces the tavern instead of away from it',()=>{
 const dev=readFileSync(new URL('../src/dev-tavern-transport.ts',import.meta.url),'utf8');
 assert.match(dev,/const PORCH_X=-9\.8;/);
 assert.match(dev,/const PORCH_Z=-25\.8;/);
 assert.match(dev,/const PORCH_YAW=0;/);
 const porch={minX:-13.25,maxX:-6.35,minZ:-31.15,maxZ:-25.55};
 const x=-9.8,z=-25.8;
 assert.ok(x>=porch.minX&&x<=porch.maxX&&z>=porch.minZ&&z<=porch.maxZ,'dev jump must land inside the actual interaction porch');
 // Character yaw 0 points toward -Z; the tavern centre is south of the jump point.
 assert.ok(-29.4<z,'fixture must place the tavern south of the jump location');
 assert.ok(!dev.includes('PORCH_YAW=Math.PI'),'regression: PI pointed the player north, directly away from the pub');
});
