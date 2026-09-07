import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority,makePlayer,quantity} from '../src/state';
import {seedNature} from '../src/nature';
import {animalAlive,bearBite,corpseId,damageAnimal,ensureAnimalVitals} from '../src/wildlife-rules';

test('animals gain persistent health without resetting existing saves',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);
 const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;assert.equal(deer.maxHealth,62);assert.equal(deer.health,62);deer.health=31;seedNature(a.state);assert.equal(deer.health,31);assert.equal(animalAlive(deer),true);
});

test('lethal hunting creates one persistent lootable carcass container',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;p.position=[...deer.position];
 ensureAnimalVitals(deer);const hit=damageAnimal(a.state,deer,999,'player');assert.equal(hit.killed,true);assert.equal(deer.dead,true);const id=corpseId(deer.id),corpse=a.state.containers[id];assert.ok(corpse);assert.equal(corpse.name,'Deer carcass');assert.equal(corpse.inventory.find(s=>s.item==='venison')?.count,4);assert.equal(corpse.inventory.find(s=>s.item==='hide')?.count,2);
 damageAnimal(a.state,deer,999,'player');assert.equal(Object.keys(a.state.containers).filter(k=>k===id).length,1);
 assert.ok(a.dispatch({type:'open_container',playerId:p.id,containerId:id}).ok);assert.ok(a.dispatch({type:'transfer',playerId:p.id,containerId:id,item:'venison',count:4,direction:'withdraw'}).ok);assert.equal(quantity(p,'venison'),6);assert.equal(corpse.inventory.some(s=>s.item==='venison'),false);
});

test('bear bites can actually kill prey and leave a carcass',()=>{
 const a=new LocalAuthority();seedNature(a.state);const bear=Object.values(a.state.animals!).find(x=>x.kind==='bear')!,hare=Object.values(a.state.animals!).find(x=>x.kind==='hare')!;hare.health=10;const bite=bearBite(a.state,bear,hare);assert.equal(bite.killed,true);assert.equal(hare.killedBy,'bear');assert.ok(a.state.containers[corpseId(hare.id)]);assert.equal(animalAlive(hare),false);
});
