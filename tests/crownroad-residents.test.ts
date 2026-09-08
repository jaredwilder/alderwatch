import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState} from '../src/state';
import {REALM_LOGICAL_POPULATION,ensureRealmPopulation} from '../src/realm-population';
import {CROWNROAD_CELL,crownroadWardForPosition} from '../src/crownroad-world';
import {CROWNROAD_RESIDENT_CAP,crownroadResidentDescriptors,representativeHouseholdOrdinal} from '../src/crownroad-residents';
import {HOUSEHOLDS_PER_SHARD} from '../src/realm-society';

test('Greyhaven materializes actual million-realm identities but never more than eighteen bodies',()=>{const world=seedState();const population=ensureRealmPopulation(world),residents=crownroadResidentDescriptors(world,0,0);assert.equal(population.population,REALM_LOGICAL_POPULATION);assert.equal(residents.length,CROWNROAD_RESIDENT_CAP);assert.equal(new Set(residents.map(r=>r.citizen.id)).size,residents.length);const ward=crownroadWardForPosition(0,0);for(const r of residents){assert.equal(r.ward,ward);assert.equal(r.citizen.shard,ward);assert.ok(r.citizen.ordinal>=0&&r.citizen.ordinal<REALM_LOGICAL_POPULATION);assert.match(r.name,/^[A-Z][a-z]+ [A-Z]/);assert.equal(r.householdOrdinal,Math.floor(r.citizen.ordinal/4));}});

test('resident materialization is deterministic and changes with the active Crownroad cell',()=>{const world=seedState(),a=crownroadResidentDescriptors(world,0,0),b=crownroadResidentDescriptors(world,0,0),c=crownroadResidentDescriptors(world,3*CROWNROAD_CELL,-3*CROWNROAD_CELL);assert.deepEqual(a,b);assert.notDeepEqual(a.map(x=>x.citizen.id),c.map(x=>x.citizen.id));assert.ok(c.length<=CROWNROAD_RESIDENT_CAP);});

test('rural Crownroad stays lightly populated while settlements increase density',()=>{const world=seedState(),greyhaven=crownroadResidentDescriptors(world,0,0),rural=crownroadResidentDescriptors(world,5*CROWNROAD_CELL,-5*CROWNROAD_CELL);assert.equal(greyhaven.length,18);assert.ok(rural.length<=4);assert.ok(greyhaven.length>rural.length);});

test('representative household contact is stable and belongs to the exact local ward',()=>{const world=seedState(),ward=crownroadWardForPosition(0,0),a=representativeHouseholdOrdinal(world,ward,'greymarket'),b=representativeHouseholdOrdinal(world,ward,'greymarket');assert.equal(a,b);assert.equal(Math.floor(a/HOUSEHOLDS_PER_SHARD),ward);});

test('resident materialization does not promote citizens merely because they are rendered',()=>{const world=seedState(),player=makePlayer('Visitor');world.players[player.id]=player;crownroadResidentDescriptors(world,0,0);assert.equal(Object.keys(ensureRealmPopulation(world).exceptions).length,0);});
