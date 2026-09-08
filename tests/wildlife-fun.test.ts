import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer} from '../src/state';
import {species,predatorCanHunt} from '../src/wildlife-species';
import {ensureRenown,recordRenownEvent} from '../src/renown';

test('wolves now participate in a broader living food web while retaining bison hunting',()=>{
 for(const prey of ['hare','goat','sheep','deer','bison','eagle'] as const)assert.equal(predatorCanHunt('wolf',prey),true,`wolf should hunt ${prey}`);
 assert.equal(predatorCanHunt('bear','wolf'),true,'bears can opportunistically turn wolves into prey');
});

test('eagles visibly cycle through flight exhaustion instead of flying forever',()=>{
 const aerial=species('eagle').aerial!;assert.ok(aerial.maxEnergy<=80);assert.ok(aerial.flightDrainPerSecond>=1);assert.ok(aerial.carryDrainPerSecond>aerial.flightDrainPerSecond);assert.ok(aerial.groundRecoverPerSecond>0);assert.ok(aerial.pickupPrey.includes('hare')&&aerial.pickupPrey.includes('sheep'));
});

test('witnessing ridiculous ecology unlocks persistent achievements without changing karma',()=>{
 const p=makePlayer('Hunter'),before=ensureRenown(p).karma;let unlocked=recordRenownEvent(p,'witness_eagle_pickup',1,10);assert.ok(unlocked.some(a=>a.id==='eagle_airlift'));unlocked=recordRenownEvent(p,'witness_wolf_bison_hunt',1,20);assert.ok(unlocked.some(a=>a.id==='wolf_bison'));recordRenownEvent(p,'witness_predator_kill',1,30);assert.ok(ensureRenown(p).achievements.predation_first);assert.equal(ensureRenown(p).karma,before);
});
