import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/dev-tools.ts',import.meta.url),'utf8');

test('dev panel visibly exposes every currently playable streamed destination',()=>{
 for(const command of ['travel crossing','travel basin','travel mine','travel crownroad','travel greyhaven','travel wolfpine','travel charcoal','travel march'])assert.ok(source.includes(`data-cmd="${command}"`),`missing dev button ${command}`);
});

test('Greyhaven and Wolfpine dev jumps enter the owning area then apply safe local spawns before runtime construction',()=>{
 assert.match(source,/DEV_SPAWN_KEY/);assert.match(source,/normalized==='greyhaven'/);assert.match(source,/queueAreaSpawn\(CROWNROAD_VALE,\[0,\.03,-18\],0\)/);assert.match(source,/normalized==='wolfpinecamp'/);assert.match(source,/queueAreaSpawn\(WOLFPINE,\[0,\.03,-44\],0\)/);assert.match(source,/applyPendingDevSpawn\(\)/);
});

test('console travel aliases match the surfaced realm names',()=>{
 for(const alias of ['mine:DEEP_IRON_MINE','deepiron:DEEP_IRON_MINE','vale:CROWNROAD_VALE','crownroad:CROWNROAD_VALE','wolf:WOLFPINE','wolfpine:WOLFPINE'])assert.ok(source.includes(alias),`missing alias ${alias}`);
 assert.match(source,/travel crossing\|basin\|mine\|crownroad\|greyhaven\|wolfpine\|march/);
});
