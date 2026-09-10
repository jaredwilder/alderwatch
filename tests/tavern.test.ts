import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAVERN_DRINKS,MAX_INTOXICATION,addIntoxication,sober,tavernMoveScale,tavernCameraSway,scoreAlderbones,resolveAlderbones} from '../src/tavern-rules';

test('The Tipsy Alder has three distinct drinks and intoxication stays bounded',()=>{
 assert.deepEqual(TAVERN_DRINKS.map(d=>d.name),['Alder Brown','Bee-Stung Cider','Crow’s Regret']);
 let level=0;for(let i=0;i<20;i++)level=addIntoxication(level,'crows_regret');assert.equal(level,MAX_INTOXICATION);
 assert.ok(sober(level,30)<level);assert.equal(sober(.1,30),0);
 assert.ok(tavernMoveScale(MAX_INTOXICATION)>=.88,'drinking may add wobble but must not make movement miserable');
});

test('intoxication camera effect is deterministic and exactly absent while sober',()=>{
 assert.deepEqual(tavernCameraSway(0,12.3),{yaw:0,pitch:0});
 assert.deepEqual(tavernCameraSway(3,12.3),tavernCameraSway(3,12.3));
 assert.notEqual(tavernCameraSway(3,12.3).yaw,0);
});

test('Alderbones rewards pairs and the house really does take ties',()=>{
 assert.equal(scoreAlderbones([4,4]).score,15);assert.equal(scoreAlderbones([6,5]).score,11);
 assert.equal(resolveAlderbones([6,6],[6,5]).winner,'player');
 assert.equal(resolveAlderbones([3,4],[2,5]).winner,'house');
 assert.throws(()=>scoreAlderbones([0,9]));
});

test('tavern source is a real enterable 3D gameplay room, not a dialogue-only facade',()=>{
 const source=readFileSync(new URL('../src/alderbrook-tavern.ts',import.meta.url),'utf8');
 for(const contract of ['The Tipsy Alder','Brinna Keggs','interior capsule','RAPIER.ColliderDesc','InstancedMesh','campfire_burning_q','Alderbones','house pipe','safeSavePosition'])assert.ok(source.includes(contract),`missing tavern contract: ${contract}`);
 const bridge=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8');
 for(const contract of ['Character.prototype.postStep','Character.prototype.preStep','setTranslation','tavern:enter','tavern:exit','openBar','openBones'])assert.ok(bridge.includes(contract),`missing live integration: ${contract}`);
});

test('tavern interactions do not pollute the server-backed Alderbrook persona roster',()=>{
 const source=readFileSync(new URL('../src/npc.ts',import.meta.url),'utf8');
 assert.ok(source.includes('TavernBridge'));assert.ok(source.includes('kept out of VILLAGERS'));
});
