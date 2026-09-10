import test from 'node:test';
import assert from 'node:assert/strict';
import type {PlayerState,WorldState} from '../src/state';
import {classifyRealmChatTopic,pickRealmChatScene,realmChatFacts,realmChatLineKey,realmChatRepeatCooldownMs,scoreRealmChatScene} from '../src/realm-conversation-director';
import type {RealmChatScene} from '../src/realm-chat-scenes';

const player:PlayerState={id:'human',name:'Player',archetype:'Hunter',position:[0,0,0],yaw:0,health:100,stamina:100,inventory:[],equipped:null,hair:'#000',skin:'#aaa',hood:false,skills:{},buffs:[]};
function world():WorldState{return {version:1,tick:0,players:{human:{...player}},resources:{},forage:{},drops:{},structures:{},stations:{},containers:{},enemies:{},opened:[],progress:[],nextId:1,animals:{}};}

test('realm chat topic classifier recognizes natural MMO shorthand',()=>{
 assert.equal(classifyRealmChatTopic('chat bear north wtf'),'bear');
 assert.equal(classifyRealmChatTopic('anyone selling iron?'),'trade');
 assert.equal(classifyRealmChatTopic('roof is cooked who can build'),'build');
 assert.equal(classifyRealmChatTopic('im lost on the east road'),'road');
 assert.equal(classifyRealmChatTopic('this fog is cursed lol'),'weird');
});

test('specific contextual scenes outrank generic scenes like Valve-style fact matching',()=>{
 const generic:RealmChatScene={id:'bear',requires:['bear-near'],priority:80,cooldown:0,beats:[]};
 const specific:RealmChatScene={id:'bear-hurt',requires:['bear-near','low-health'],priority:80,cooldown:0,beats:[]};
 const facts=new Set(['bear-near','low-health'] as const);
 assert.ok(scoreRealmChatScene(specific,facts,10)>scoreRealmChatScene(generic,facts,10));
 assert.equal(pickRealmChatScene([generic,specific],facts,10,new Map(),new Set(),'fixed')?.id,'bear-hurt');
});

test('scene picker respects cooldown and once-only dialogue',()=>{
 const once:RealmChatScene={id:'rare',priority:50,cooldown:0,once:true,beats:[]};
 const repeat:RealmChatScene={id:'repeat',priority:40,cooldown:100,beats:[]};
 assert.equal(scoreRealmChatScene(once,new Set(),20,-Infinity,true),-Infinity);
 assert.equal(scoreRealmChatScene(repeat,new Set(),50,10,false),-Infinity);
 assert.ok(Number.isFinite(scoreRealmChatScene(repeat,new Set(),120,10,false)));
});

test('world facts come from real nearby state rather than invented chat claims',()=>{
 const w=world(),p={...player,health:35,stamina:20,position:[0,0,0]};w.players.human=p;
 w.animals={bear1:{id:'bear1',kind:'bear',position:[7,0,2],dead:false},wolf1:{id:'wolf1',kind:'wolf',position:[6,0,3],dead:false},wolf2:{id:'wolf2',kind:'wolf',position:[9,0,4],dead:false}} as any;
 w.enemies.raider={id:'raider',name:'Raider',position:[12,0,0],yaw:0,home:[12,0,0],health:50,maxHealth:50,stamina:50,equipped:'sword',phase:'alert',decisionAt:0,rewarded:false};
 const facts=realmChatFacts(w,p);
 for(const fact of ['bear-near','wolf-pack','enemy-near','low-health','low-stamina'] as const)assert.ok(facts.has(fact),fact);
});

test('repeat suppression is stricter for substantial barks than tiny acknowledgements',()=>{
 assert.equal(realmChatLineKey('player-bot-kestrel','  Bear DIFF!! '),'player-bot-kestrel:bear diff');
 assert.equal(realmChatRepeatCooldownMs('lol'),35_000);
 assert.equal(realmChatRepeatCooldownMs('bear west'),90_000);
 assert.equal(realmChatRepeatCooldownMs('who put exactly one stone in the chest'),420_000);
});
