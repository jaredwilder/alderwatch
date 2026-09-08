import test from 'node:test';
import assert from 'node:assert/strict';
import {bestItemQuality,craftedQuality,enemyDropQuality,qualityDamageMultiplier,qualityTier} from '../src/loot';
import {animalBountyCrowns,animalDisplayName,ensureWildTrait,recordAnimalAct} from '../src/wildlife-notoriety';
import {makePlayer,type EnemyState} from '../src/state';
import type {AnimalState} from '../src/wildlife-species';

test('equipment quality has meaningful but bounded Diablo-style tiers',()=>{
 assert.equal(qualityTier(1),'common');assert.equal(qualityTier(1.12),'fine');assert.equal(qualityTier(1.28),'exceptional');assert.equal(qualityTier(1.4),'masterwork');assert.equal(qualityTier(1.55),'legendary');
 assert.ok(qualityDamageMultiplier(1.5)>1.35);assert.ok(qualityDamageMultiplier(99)<1.5);
});

test('skill-built gear improves with use and best owned quality drives equipped power',()=>{
 const p=makePlayer('Artisan');p.skills.blacksmithing=80;p.inventory.push({id:'masterwork-sword',item:'sword',count:1,quality:1.42});p.equipped='sword';
 assert.ok(craftedQuality(p,'sword')>1.15);assert.equal(bestItemQuality(p,'sword'),1.42);
});

test('captains guarantee exciting quality loot',()=>{
 const enemy:EnemyState={id:'test-captain',name:'Captain',role:'captain',position:[0,0,0],home:[0,0,0],yaw:0,health:80,maxHealth:80,stamina:100,equipped:'sword',phase:'patrol',decisionAt:0,rewarded:false};
 assert.equal(qualityTier(enemyDropQuality(enemy)),'masterwork');
});

test('rare beast traits are deterministic, persistent and raise bounty value',()=>{
 let rare:AnimalState|undefined;for(let i=0;i<500&&!rare;i++){const a:AnimalState={id:'elite-search-'+i,kind:'wolf',position:[0,0,0],home:[0,0,0],yaw:0,phase:0};if(ensureWildTrait(a))rare=a;}
 assert.ok(rare);const first=ensureWildTrait(rare!)!;assert.equal(ensureWildTrait(rare!)?.id,first.id);const base=animalBountyCrowns(rare!);recordAnimalAct(rare!,'livestock_kill',1);recordAnimalAct(rare!,'livestock_kill',2);assert.ok(animalBountyCrowns(rare!)>base);assert.match(animalDisplayName(rare!),new RegExp(first.prefix));
});
