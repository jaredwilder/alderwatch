import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState} from '../src/state';
import {advanceRealmCrimeKnowledge,crimeAccounting,crimeKnowledgeAt,recordRealmCrime,wantedLevelAt} from '../src/realm-crime';
import {ensureRealmHistory} from '../src/provenance-frontier';

function worldWithPlayer(){const world=seedState(),player=makePlayer('Warden');world.players[player.id]=player;return {world,player};}

test('unwitnessed crime stays private instead of creating omniscient justice',()=>{
 const {world,player}=worldWithPlayer();const crime=recordRealmCrime(world,{externalKey:'unseen-theft',kind:'theft',perpetratorId:player.id,perpetratorName:player.name,ward:112,witnesses:[],summary:'The Wanderer stole from an empty roadside cache with nobody present.'});
 assert.equal(crime.atomId,undefined);assert.equal(crimeKnowledgeAt(world,crime.id,112),undefined);assert.equal(wantedLevelAt(world,player.id,112),0);assert.equal(Object.keys(ensureRealmHistory(world).externalKeys).some(k=>k.includes('unseen-theft')),false);
});

test('witnessed crime preserves exact perpetrator provenance and local legal certainty',()=>{
 const {world,player}=worldWithPlayer();const crime=recordRealmCrime(world,{externalKey:'greyhaven-assault',kind:'assault',perpetratorId:player.id,perpetratorName:player.name,ward:112,witnesses:['citizen-a','citizen-b']});
 assert.ok(crime.atomId);const local=crimeKnowledgeAt(world,crime.id,112)!;assert.equal(local.kind,'witnessed');assert.equal(local.strength,1);assert.equal(local.provenance,crime.atomId);assert.ok(wantedLevelAt(world,player.id,112)>=2);
 const atom=ensureRealmHistory(world).atoms[crime.atomId!];assert.equal(atom.actorId,player.id);assert.ok(atom.subjects.includes('witness:citizen-a'));assert.ok(atom.subjects.includes('witness:citizen-b'));
});

test('crime reports propagate by time instead of instantly making every district omniscient',()=>{
 const {world,player}=worldWithPlayer();const crime=recordRealmCrime(world,{externalKey:'slow-murder-report',kind:'murder',perpetratorId:player.id,perpetratorName:player.name,ward:112,witnesses:['gate-clerk']});
 const sourceDistrict=Math.floor(112/16),remoteWard=0;assert.notEqual(Math.floor(remoteWard/16),sourceDistrict);assert.equal(crimeKnowledgeAt(world,crime.id,remoteWard),undefined);
 world.tick=3600*sourceDistrict;advanceRealmCrimeKnowledge(world);const remote=crimeKnowledgeAt(world,crime.id,remoteWard);if(remote){assert.equal(remote.kind,'rumor');assert.equal(remote.provenance,crime.atomId);assert.ok(remote.strength<1);}assert.ok(wantedLevelAt(world,player.id,112)>wantedLevelAt(world,player.id,remoteWard));
});

test('crime recording and propagation are idempotent under duplicate external keys',()=>{
 const {world,player}=worldWithPlayer(),input={externalKey:'duplicate-crime',kind:'theft' as const,perpetratorId:player.id,perpetratorName:player.name,ward:112,witnesses:['merchant']};const a=recordRealmCrime(world,input),b=recordRealmCrime(world,input);assert.equal(a.id,b.id);assert.equal(crimeAccounting(world).incidents,1);world.tick=3600*10;advanceRealmCrimeKnowledge(world);const once=crimeAccounting(world);advanceRealmCrimeKnowledge(world);assert.deepEqual(crimeAccounting(world),once);
});
