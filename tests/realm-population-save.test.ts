import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState} from '../src/state';
import {REALM_LOGICAL_POPULATION,REALM_POPULATION_DAY_TICKS,advanceRealmPopulationToTick,ensureRealmPopulation,populationAccounting} from '../src/realm-population';

test('legacy-style world state acquires the million-person realm layer additively without schema bump',()=>{
 const world=seedState();world.worldSeed=90210;const player=makePlayer('Warden');world.players[player.id]=player;assert.equal(world.version,1);assert.equal(world.realmPopulation,undefined);const population=ensureRealmPopulation(world);assert.equal(world.version,1);assert.equal(population.population,REALM_LOGICAL_POPULATION);assert.equal(populationAccounting(population).total,REALM_LOGICAL_POPULATION);
 const roundTrip=JSON.parse(JSON.stringify(world));assert.equal(roundTrip.version,1);assert.equal(roundTrip.realmPopulation.population,REALM_LOGICAL_POPULATION);
});

test('realm population catch-up follows authoritative world tick and is idempotent on reload',()=>{
 const world=seedState();world.worldSeed=411;const player=makePlayer('Hunter');world.players[player.id]=player;world.tick=365*REALM_POPULATION_DAY_TICKS;const first=advanceRealmPopulationToTick(world);assert.equal(first.days,365);assert.equal(world.realmPopulation!.lastProcessedDay,365);const snapshot=JSON.parse(JSON.stringify(world));const second=advanceRealmPopulationToTick(snapshot);assert.equal(second.days,0);assert.equal(second.epochs,0);assert.equal(snapshot.realmPopulation.lastProcessedDay,365);assert.ok(snapshot.realmPopulation.recent.length<=12);
});
