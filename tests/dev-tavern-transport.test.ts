import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const transport=readFileSync(new URL('../src/dev-tavern-transport.ts',import.meta.url),'utf8');
const bootstrap=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8');

test('dev tools surface both porch jump and direct interior entry for The Tipsy Alder',()=>{
 assert.match(transport,/Jump · Tipsy Alder/);
 assert.match(transport,/Enter · Tipsy Alder/);
 assert.match(transport,/PORCH_X=-9\.8/);
 assert.match(transport,/PORCH_Z=-25\.8/);
 assert.match(transport,/PORCH_YAW=0/);
 assert.doesNotMatch(transport,/PORCH_YAW=Math\.PI/,'regression: PI faces away from the tavern');
 assert.match(transport,/dev\.teleport!\(PORCH_X,PORCH_Z,PORCH_YAW\)/);
 assert.match(transport,/forceEnterTipsyAlderForDev/);
 assert.match(transport,/data-tipsy-alder-jump/);
 assert.match(transport,/data-tipsy-alder-enter/);
 assert.doesNotMatch(transport,/if\(!enter\(\)\)jump\(\)/,'direct interior entry must never silently degrade into an exterior teleport');
 assert.match(transport,/ENTRY FAILED · click Jump first/,'a failed direct entry must be visible to the tester');
});

test('tavern dev transport installs immediately after the core dev tools',()=>{
 const core=bootstrap.indexOf("await import('./dev-tools')");
 const tavern=bootstrap.indexOf("await import('./dev-tavern-transport')");
 assert.ok(core>=0,'core dev tools import missing');
 assert.ok(tavern>core,'tavern transport must install after core dev tools');
});
