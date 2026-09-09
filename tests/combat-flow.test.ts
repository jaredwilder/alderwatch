import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState,type EnemyState} from '../src/state';
import {attackProfile,beginAction,canCancelInto,counterOpening,resolveStrike,setGuard} from '../src/combat-rules';

function duel(){
 const w=seedState(),player=makePlayer('Warden');player.position=[0,0,0];player.yaw=0;player.equipped='sword';player.health=100;player.stamina=100;w.players[player.id]=player;
 const enemy:EnemyState={id:'duelist',name:'March duelist',position:[0,0,1.45],yaw:Math.PI,home:[0,0,1.45],health:140,maxHealth:140,stamina:100,equipped:'sword',phase:'circle',decisionAt:0,rewarded:false};w.enemies[enemy.id]=enemy;
 return {w,player,enemy};
}
const impactTick=(fighter:{combat?:any,equipped:any})=>Math.ceil((attackProfile(fighter as any)?.impact??0)*60);

test('frame-tight dodge creates a real counter opening',()=>{
 const {w,player,enemy}=duel();
 beginAction(enemy,0,'attack');const impact=impactTick(enemy);w.tick=impact;
 player.combat={kind:'dodge',started:impact-10,until:impact+38,consumed:false,blocking:false,weapon:player.equipped};
 const out=resolveStrike(w,enemy,player);
 assert.equal(out.outcome,'dodged');assert.equal(out.perfectDodge,true);assert.match(out.message,/Perfect dodge/);
 assert.equal(counterOpening(enemy,w.tick),true);assert.equal(enemy.combat?.kind,'hit');assert.ok((enemy.combat?.until??0)-w.tick>=48);
});

test('ordinary dodge evades without gifting a counter opening',()=>{
 const {w,player,enemy}=duel();
 beginAction(enemy,0,'attack');const impact=impactTick(enemy);w.tick=impact;
 player.combat={kind:'dodge',started:impact-22,until:impact+26,consumed:false,blocking:false,weapon:player.equipped};
 const out=resolveStrike(w,enemy,player);
 assert.equal(out.outcome,'dodged');assert.equal(out.perfectDodge,false);assert.equal(counterOpening(enemy,w.tick),false);
});

test('parry stagger turns the next sword hit into a damaging riposte',()=>{
 const {w,player,enemy}=duel();
 beginAction(enemy,0,'attack');const enemyImpact=impactTick(enemy);w.tick=enemyImpact;setGuard(player,enemyImpact-6,true);
 const parry=resolveStrike(w,enemy,player);assert.equal(parry.outcome,'parried');assert.equal(counterOpening(enemy,w.tick),true);
 player.combat=undefined;beginAction(player,w.tick,'attack');w.tick+=impactTick(player);
 const riposte=resolveStrike(w,player,enemy);assert.equal(riposte.counter,true);assert.equal(riposte.outcome,'hit');assert.equal(riposte.message,'Riposte');assert.ok((riposte.damage??0)>24,'Riposte did not amplify sword damage');
});

test('axe pressure breaks an exhausted guard and creates a punish window',()=>{
 const {w,player,enemy}=duel();player.equipped='axe';player.stamina=100;enemy.stamina=20;
 enemy.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,guardSince:0,weapon:enemy.equipped};
 beginAction(player,0,'attack');w.tick=impactTick(player);
 const out=resolveStrike(w,player,enemy);assert.equal(out.guardBreak,true);assert.equal(out.outcome,'hit');assert.match(out.message,/Guard broken/);assert.equal(enemy.stamina,0);assert.equal(counterOpening(enemy,w.tick),true);
});

test('weapon identity changes guard pressure instead of every block costing the same',()=>{
 // This is deliberately a sustained guard, not the separate frame-tight parry mechanic.
 const sword=duel();sword.enemy.stamina=60;sword.enemy.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,guardSince:-20,weapon:sword.enemy.equipped};beginAction(sword.player,0,'attack');sword.w.tick=impactTick(sword.player);const swordOut=resolveStrike(sword.w,sword.player,sword.enemy);assert.equal(swordOut.outcome,'blocked');const swordLeft=sword.enemy.stamina;
 const axe=duel();axe.player.equipped='axe';axe.enemy.stamina=60;axe.enemy.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,guardSince:-20,weapon:axe.enemy.equipped};beginAction(axe.player,0,'attack');axe.w.tick=impactTick(axe.player);const axeOut=resolveStrike(axe.w,axe.player,axe.enemy);assert.equal(axeOut.outcome,'blocked');assert.ok(axe.enemy.stamina<swordLeft,'Axe should punish guard stamina harder than sword');assert.ok((axeOut.damage??0)>(swordOut.damage??0),'Axe should chip guard harder than sword');
});

test('light attacks become dodge-cancellable only after contact is committed',()=>{
 const {w,player,enemy}=duel();beginAction(player,0,'attack');const impact=impactTick(player);w.tick=impact-1;
 assert.equal(canCancelInto(player,w.tick,'dodge'),false,'Pre-contact light attack should retain commitment');
 w.tick=impact;resolveStrike(w,player,enemy);assert.equal(player.combat?.consumed,true);
 assert.equal(canCancelInto(player,w.tick,'dodge'),false,'Exact hit frame should not instant-cancel');
 w.tick=Math.ceil((attackProfile(player)!.impact+.04)*60);assert.equal(canCancelInto(player,w.tick,'dodge'),true);
 const stamina=player.stamina;const dodge=beginAction(player,w.tick,'dodge');assert.equal(dodge.ok,true);assert.equal(player.combat?.kind,'dodge');assert.equal(player.stamina,stamina-22);
});

test('heavy attacks keep commitment until late recovery before dodge cancel',()=>{
 const {w,player,enemy}=duel();beginAction(player,0,'heavy');const impact=impactTick(player);w.tick=impact;resolveStrike(w,player,enemy);const until=player.combat!.until;
 assert.equal(canCancelInto(player,impact+8,'dodge'),false,'Heavy should remain committed after impact');
 assert.equal(canCancelInto(player,until-13,'dodge'),true,'Heavy should allow a late defensive recovery cancel');
});

test('attacks cannot cancel dodge or another live attack',()=>{
 const {player}=duel();beginAction(player,0,'dodge');assert.equal(canCancelInto(player,5,'attack'),false);assert.equal(beginAction(player,5,'attack').ok,false);
});
