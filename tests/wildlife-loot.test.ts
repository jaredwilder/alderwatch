import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority,makePlayer,quantity} from '../src/state';
import {seedNature} from '../src/nature';
import {animalAlive,bearBite,bearMaul,corpseId,damageAnimal,ensureAnimalVitals,resolveWildlifeStrike} from '../src/wildlife-rules';
import {beginAction,WEAPONS} from '../src/combat-rules';
import './wildlife-behavior.test';

test('animals gain persistent health without resetting existing saves',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);
 const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;assert.equal(deer.maxHealth,62);assert.equal(deer.health,62);deer.health=31;seedNature(a.state);assert.equal(deer.health,31);assert.equal(animalAlive(deer),true);
});

test('lethal hunting creates one persistent lootable carcass container',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;p.position=[...deer.position];
 ensureAnimalVitals(deer);const hit=damageAnimal(a.state,deer,999,'player',p.id);assert.equal(hit.killed,true);assert.equal(deer.dead,true);const id=corpseId(deer.id),corpse=a.state.containers[id];assert.ok(corpse);assert.equal(corpse.name,'Deer carcass');assert.equal(corpse.inventory.find(s=>s.item==='venison')?.count,4);assert.equal(corpse.inventory.find(s=>s.item==='hide')?.count,2);
 damageAnimal(a.state,deer,999,'player',p.id);assert.equal(Object.keys(a.state.containers).filter(k=>k===id).length,1);
 assert.ok(a.dispatch({type:'open_container',playerId:p.id,containerId:id}).ok);assert.ok(a.dispatch({type:'transfer',playerId:p.id,containerId:id,item:'venison',count:4,direction:'withdraw'}).ok);assert.equal(quantity(p,'venison'),6);assert.equal(corpse.inventory.some(s=>s.item==='venison'),false);
});

test('bear bites can actually kill prey and leave a carcass',()=>{
 const a=new LocalAuthority();seedNature(a.state);const bear=Object.values(a.state.animals!).find(x=>x.kind==='bear')!,hare=Object.values(a.state.animals!).find(x=>x.kind==='hare')!;hare.health=10;const bite=bearBite(a.state,bear,hare);assert.equal(bite.killed,true);assert.equal(hare.killedBy,'bear');assert.ok(a.state.containers[corpseId(hare.id)]);assert.equal(animalAlive(hare),false);
});

test('ordinary melee actions resolve against wildlife instead of falling through to gathering',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;
 p.position=[0,0,0];p.yaw=0;p.equipped='axe';deer.position=[0,0,1.5];deer.health=deer.maxHealth;
 assert.ok(beginAction(p,0,'attack').ok);a.state.tick=Math.ceil(WEAPONS.axe!.impact*60);const out=resolveWildlifeStrike(a.state,p,deer,true);
 assert.equal(out.outcome,'hit');assert.equal(out.damage,20);assert.equal(deer.health,42);assert.equal(deer.lastAttackerId,p.id);assert.ok((deer.alarmedUntil??0)>a.state.tick);
});

test('hunter bow damages wildlife at range and respects obstruction',()=>{
 const a=new LocalAuthority(),p=makePlayer('Hunter');a.state.players[p.id]=p;seedNature(a.state);const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;
 assert.equal(quantity(p,'bow'),1);p.position=[0,0,0];p.yaw=0;p.equipped='bow';deer.position=[0,0,24];deer.health=deer.maxHealth;
 assert.ok(beginAction(p,0,'attack').ok);a.state.tick=Math.ceil(WEAPONS.bow!.impact*60);const hit=resolveWildlifeStrike(a.state,p,deer,true);assert.equal(hit.outcome,'hit');assert.equal(hit.damage,32);assert.equal(deer.health,30);
 p.combat=undefined;p.stamina=100;deer.health=62;assert.ok(beginAction(p,a.state.tick+100,'attack').ok);a.state.tick+=100+Math.ceil(WEAPONS.bow!.impact*60);const blocked=resolveWildlifeStrike(a.state,p,deer,false);assert.equal(blocked.outcome,'miss');assert.equal(deer.health,62);
});

test('provoked bears can hit players while dodge and guard still matter',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const bear=Object.values(a.state.animals!).find(x=>x.kind==='bear')!;
 p.position=[0,0,0];p.yaw=0;bear.position=[0,0,1.2];p.health=100;p.stamina=100;p.combat=undefined;const hit=bearMaul(a.state,bear,p);assert.equal(hit.outcome,'hit');assert.equal(p.health,74);
 p.health=100;p.stamina=100;p.combat=undefined;assert.ok(beginAction(p,0,'dodge').ok);a.state.tick=8;const dodge=bearMaul(a.state,bear,p);assert.equal(dodge.outcome,'dodged');assert.equal(p.health,100);
 p.health=100;p.stamina=100;p.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,weapon:'sword'};const block=bearMaul(a.state,bear,p);assert.equal(block.outcome,'blocked');assert.equal(p.health,94);assert.equal(p.stamina,80);
});
