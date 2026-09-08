import test from 'node:test';
import assert from 'node:assert/strict';
import {contractBook,contractComplete,contractProgress,counterAmount,parseContractIntent,processContractMessage,sweepContracts} from '../src/npc-contract-game';
import {ensureRenown} from '../src/renown';
import {quantity,type PlayerState,type WorldState} from '../src/state';

function player():PlayerState{return {id:'human',name:'Wanderer',archetype:'Warden',position:[0,0,0],yaw:0,health:100,stamina:100,inventory:[],equipped:null,hair:'#000',skin:'#aaa',hood:false,skills:{},buffs:[]};}
function world(seed=41):WorldState{return {version:1,worldSeed:seed,tick:1000,players:{},resources:{},forage:{},drops:{},structures:{},stations:{},containers:{},enemies:{},opened:[],progress:[],nextId:1};}
function add(p:PlayerState,item:any,count:number){p.inventory.push({id:`${item}-${p.inventory.length}`,item,count,quality:1});}

test('relay contract language maps to a bounded negotiation grammar',()=>{
 assert.equal(parseContractIntent('Mara, any work available?'),'request');
 assert.equal(parseContractIntent('I accept the offer.'),'accept');
 assert.equal(parseContractIntent('Make it 41 crowns.'),'counter');
 assert.equal(counterAmount('Make it 41 crowns.'),41);
 assert.equal(parseContractIntent('contract status'),'status');
 assert.equal(parseContractIntent('I am done, pay me.'),'collect');
 assert.equal(parseContractIntent('back out of the deal'),'abandon');
 assert.equal(parseContractIntent('Any wolves north?'),null);
});

test('action contracts count only deeds performed after acceptance',()=>{
 const w=world(7),p=player();w.players[p.id]=p;const r=ensureRenown(p);r.counters.complete_bounty=3;r.counters.kill_baddie=9;
 processContractMessage(w,p,'gate-guard','Rurik Vale','Any work available?','negotiator',0);
 const book=contractBook(w),offer=book.offers['gate-guard'];assert.ok(offer);const before=r.counters[offer.objective.key]??0;
 processContractMessage(w,p,'gate-guard','Rurik Vale','I accept the offer.','negotiator',0);
 const active=book.active[0]!;assert.equal(active.objective.baseline,before);assert.equal(contractProgress(p,active),0);
 r.counters[active.objective.key]=before+active.objective.amount-1;assert.equal(contractComplete(p,active),false);
 r.counters[active.objective.key]=before+active.objective.amount;assert.equal(contractComplete(p,active),true);
});

test('delivery settlement consumes the agreed goods and pays real crowns',()=>{
 const w=world(9),p=player();w.players[p.id]=p;const r=ensureRenown(p),goldBefore=r.gold;
 processContractMessage(w,p,'mara','Mara Pennymarch','Do you have any work for me?','negotiator',1);
 const book=contractBook(w),offer=book.offers.mara!;assert.equal(offer.objective.kind,'supply');add(p,offer.objective.item!,offer.objective.amount+2);
 processContractMessage(w,p,'mara','Mara Pennymarch','I accept the offer.','negotiator',1);const active=book.active[0]!,beforeQty=quantity(p,active.objective.item!);
 const out=processContractMessage(w,p,'mara','Mara Pennymarch','The task is done. Pay me.','negotiator',1);assert.equal(out.handled,true);assert.match(out.reply??'',/crowns are yours/i);
 assert.equal(quantity(p,active.objective.item!),beforeQty-active.objective.amount);assert.equal(ensureRenown(p).gold,goldBefore+active.reward);assert.equal(book.active.length,0);assert.equal(book.history.at(-1)?.outcome,'completed');
});

test('haggling has an authoritative ceiling instead of letting dialogue invent rewards',()=>{
 const w=world(12),p=player();w.players[p.id]=p;processContractMessage(w,p,'mara','Mara Pennymarch','Any work available?','negotiator',0);
 const offer=contractBook(w).offers.mara!,tooHigh=offer.maxReward+50,out=processContractMessage(w,p,'mara','Mara Pennymarch',`Make it ${tooHigh} crowns.`,'negotiator',0);
 assert.equal(out.handled,true);assert.ok((out.trustDelta??0)<0);assert.match(out.reply??'',/not one crown further/i);assert.equal(contractBook(w).offers.mara!.reward,offer.maxReward);
});

test('the player can carry at most three simultaneous written obligations',()=>{
 const w=world(17),p=player();w.players[p.id]=p;
 for(const [id,name] of [['mara','Mara'],['sigrid','Sigrid'],['ylva','Ylva']] as const){processContractMessage(w,p,id,name,'Any work available?','negotiator',1);processContractMessage(w,p,id,name,'I accept the offer.','negotiator',1);}
 assert.equal(contractBook(w).active.length,3);processContractMessage(w,p,'gate-guard','Rurik','Any work available?','negotiator',1);const out=processContractMessage(w,p,'gate-guard','Rurik','I accept the offer.','negotiator',1);
 assert.match(out.reply??'',/three written obligations/i);assert.equal(contractBook(w).active.length,3);
});

test('missed deadlines default automatically and damage earned standing',()=>{
 const w=world(23),p=player();w.players[p.id]=p;const r=ensureRenown(p);r.reputation['March Wardens']=20;
 processContractMessage(w,p,'gate-guard','Rurik Vale','Any work available?','negotiator',0);processContractMessage(w,p,'gate-guard','Rurik Vale','I accept the offer.','negotiator',0);const c=contractBook(w).active[0]!,before=r.reputation[c.repFaction]??0;
 w.tick=c.deadlineAt+1;const events=sweepContracts(w,p);assert.equal(events[0]?.type,'defaulted');assert.equal(contractBook(w).active.length,0);assert.equal(contractBook(w).history.at(-1)?.outcome,'defaulted');assert.ok((r.reputation[c.repFaction]??0)<before);
});

test('outsiders cannot bypass standing by simply asking for a contract',()=>{
 const w=world(29),p=player();w.players[p.id]=p;const out=processContractMessage(w,p,'mara','Mara Pennymarch','Give me work.','outsider',5);
 assert.equal(out.handled,true);assert.match(out.reply??'',/strangers|standing/i);assert.equal(Object.keys(contractBook(w).offers).length,0);
});
