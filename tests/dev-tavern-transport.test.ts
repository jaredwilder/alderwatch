import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const transport=readFileSync(new URL('../src/dev-tavern-transport.ts',import.meta.url),'utf8');
const bootstrap=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8');

test('dev tools surface a one-click jump to The Tipsy Alder porch',()=>{
 assert.match(transport,/Jump · Tipsy Alder/);
 assert.match(transport,/PORCH_X=-9\.3/);
 assert.match(transport,/PORCH_Z=-27\.15/);
 assert.match(transport,/PORCH_YAW=Math\.PI/);
 assert.match(transport,/dev\.teleport!\(PORCH_X,PORCH_Z,PORCH_YAW\)/);
 assert.match(transport,/\.aw-dev-panel \.aw-dev-grid/);
 assert.match(transport,/data-tipsy-alder-jump/);
});

test('tavern dev transport installs immediately after the core dev tools',()=>{
 const core=bootstrap.indexOf("await import('./dev-tools')");
 const tavern=bootstrap.indexOf("await import('./dev-tavern-transport')");
 assert.ok(core>=0,'core dev tools import missing');
 assert.ok(tavern>core,'tavern transport must install after core dev tools');
});
