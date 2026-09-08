import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState,type EnemyState} from '../src/state';
import {beginAction,counterOpening,resolveStrike,setGuard} from '../src/combat-rules';

function duel(){
 const w=seedState(),player=makePlayer('Warden');player.position=[0,0,0];player.yaw=0;player.equipped='sword';player.health=100;player.stamina=100;w.players[player.id]=player;
 const enemy:EnemyState={id:'duelist',name:'March duelist',position:[0,0,1.45],yaw:Math.PI,home:[0,0,1.45],health:140,maxHealth:140,stamina:100,equipped:'sword',phase:'circle',decisionAt:0,rewarded:false};w.enemies[enemy.id]=enemy;
 return {w,player,enemy};
}

test('frame-tight dodge creates a real counter opening',()=>{
 const {w,player,enemy}=duel();
 beginAction(enemy,0,'attack');w.tick=26;
 player.combat={kind:'dodge',started:16,until:64,consumed:false,blocking:false,weapon:player.equipped};
 const out=resolveStrike(w,enemy,player);
 assert.equal(out.outcome,'dodged');assert.equal(out.perfectDodge,true);assert.match(out.message,/Perfect dodge/);
 assert.equal(counterOpening(enemy,w.tick),true);assert.equal(enemy.combat?.kind,'hit');assert.ok((enemy.combat?.until??0)-w.tick>=48);
});

test('ordinary dodge evades without gifting a counter opening',()=>{
 const {w,player,enemy}=duel();
 beginAction(enemy,0,'attack');w.tick=26;
 player.combat={kind:'dodge',started:4,until:52,consumed:false,blocking:false,weapon:player.equipped};
 const out=resolveStrike(w,enemy,player);
 assert.equal(out.outcome,'dodged');assert.equal(out.perfectDodge,false);assert.equal(counterOpening(enemy,w.tick),false);
});

test('parry stagger turns the next sword hit into a damaging riposte',()=>{
 const {w,player,enemy}=duel();
 beginAction(enemy,0,'attack');w.tick=26;setGuard(player,20,true);
 const parry=resolveStrike(w,enemy,player);assert.equal(parry.outcome,'parried');assert.equal(counterOpening(enemy,w.tick),true);
 player.combat=undefined;beginAction(player,w.tick,'attack');w.tick+=26;
 const riposte=resolveStrike(w,player,enemy);assert.equal(riposte.counter,true);assert.equal(riposte.outcome,'hit');assert.equal(riposte.message,'Riposte');assert.ok((riposte.damage??0)>24,'Riposte did not amplify sword damage');
});

test('axe pressure breaks an exhausted guard and creates a punish window',()=>{
 const {w,player,enemy}=duel();player.equipped='axe';player.stamina=100;enemy.stamina=20;
 enemy.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,guardSince:0,weapon:enemy.equipped};
 beginAction(player,0,'attack');w.tick=34;
 const out=resolveStrike(w,player,enemy);assert.equal(out.guardBreak,true);assert.equal(out.outcome,'hit');assert.match(out.message,/Guard broken/);assert.equal(enemy.stamina,0);assert.equal(counterOpening(enemy,w.tick),true);
});

test('weapon identity changes guard pressure instead of every block costing the same',()=>{
 const sword=duel();sword.enemy.stamina=60;sword.enemy.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,guardSince:0,weapon:sword.enemy.equipped};beginAction(sword.player,0,'attack');sword.w.tick=26;const swordOut=resolveStrike(sword.w,sword.player,sword.enemy);assert.equal(swordOut.outcome,'blocked');const swordLeft=sword.enemy.stamina;
 const axe=duel();axe.player.equipped='axe';axe.enemy.stamina=60;axe.enemy.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,guardSince:0,weapon:axe.enemy.equipped};beginAction(axe.player,0,'attack');axe.w.tick=34;const axeOut=resolveStrike(axe.w,axe.player,axe.enemy);assert.equal(axeOut.outcome,'blocked');assert.ok(axe.enemy.stamina<swordLeft,'Axe should punish guard stamina harder than sword');assert.ok((axeOut.damage??0)>(swordOut.damage??0),'Axe should chip guard harder than sword');
});
