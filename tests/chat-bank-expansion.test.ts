import test from 'node:test';
import assert from 'node:assert/strict';
import {NPC_CHAT_EXPANSION,PLAYER_CHAT_EXPANSION} from '../src/chat-bank-expansion';

test('expanded MMO chat bank is actually large',()=>{
 const playerLines=Object.values(PLAYER_CHAT_EXPANSION).flat();
 const npcLines=Object.values(NPC_CHAT_EXPANSION).flat();
 assert.equal(Object.keys(PLAYER_CHAT_EXPANSION).length,8);
 assert.equal(Object.keys(NPC_CHAT_EXPANSION).length,9);
 assert.ok(playerLines.length>=160,`expected >=160 player lines, got ${playerLines.length}`);
 assert.ok(npcLines.length>=108,`expected >=108 NPC lines, got ${npcLines.length}`);
 assert.equal(new Set(playerLines).size,playerLines.length,'player expansion contains duplicate lines');
 assert.equal(new Set(npcLines).size,npcLines.length,'NPC expansion contains duplicate lines');
});

test('expanded visible chat copy contains no implementation giveaway language',()=>{
 const all=[...Object.values(PLAYER_CHAT_EXPANSION).flat(),...Object.values(NPC_CHAT_EXPANSION).flat()];
 const giveaway=/\b(?:AI|bot|prompt|model|simulation|language model|generated response)\b/i;
 const offenders=all.filter(line=>giveaway.test(line));
 assert.deepEqual(offenders,[]);
});

test('every existing persona receives substantial additional variety',()=>{
 for(const [id,lines] of Object.entries(PLAYER_CHAT_EXPANSION))assert.ok(lines.length>=20,`${id} needs >=20 lines`);
 for(const [id,lines] of Object.entries(NPC_CHAT_EXPANSION))assert.ok(lines.length>=12,`${id} needs >=12 lines`);
});
