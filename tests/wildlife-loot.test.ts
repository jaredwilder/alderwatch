import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority,makePlayer,quantity,addItem,type ItemId} from '../src/state';
import {RECIPES,stats} from '../src/definitions';
import {seedNature} from '../src/nature';
import {animalAlive,bearBite,bearMaul,corpseId,damageAnimal,ensureAnimalVitals,resolveWildlifeStrike,wolfBite,wolfMaul} from '../src/wildlife-rules';
import {beginAction,WEAPONS} from '../src/combat-rules';
import {WILDLIFE_SPECIES,type AnimalKind} from '../src/wildlife-species';
import './wildlife-behavior.test';

test('animals gain persistent health without resetting existing saves',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);
 const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!,bison=Object.values(a.state.animals!).find(x=>x.kind==='bison')!,wolf=Object.values(a.state.animals!).find(x=>x.kind==='wolf')!;
 assert.equal(deer.maxHealth,62);assert.equal(bison.maxHealth,240);assert.equal(wolf.maxHealth,74);assert.equal(Object.values(a.state.animals!).filter(x=>x.kind==='bison').length,6);deer.health=31;seedNature(a.state);assert.equal(deer.health,31);assert.equal(animalAlive(deer),true);
});

test('every animal species has its own meat drop and every meat has a campfire recipe',()=>{
 const expected:Record<AnimalKind,ItemId>={hare:'hare_meat',crow:'crow_meat',goat:'goat_meat',sheep:'mutton',deer:'venison',bear:'bear_meat',bison:'bison_meat',wolf:'wolf_meat',eagle:'eagle_meat'};
 const outputs=new Set(RECIPES.filter(r=>r.station==='campfire').map(r=>r.output));
 for(const [kind,meat] of Object.entries(expected) as [AnimalKind,ItemId][]) {
  assert.ok((WILDLIFE_SPECIES[kind].loot[meat]??0)>0,`${kind} should drop ${meat}`);
  assert.ok(RECIPES.some(r=>r.station==='campfire'&&r.cost[meat]),`${meat} should have a campfire recipe`);
 }
 for(const output of ['roasted_hare','crow_skewer','herbed_goat','hearth_mutton','grilled_venison','bear_steak','bison_roast','smoked_wolf','eagle_roast'] as ItemId[])assert.ok(outputs.has(output),`${output} should be cookable`);
});

test('lethal hunting creates one persistent lootable carcass container',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;p.position=[...deer.position];
 ensureAnimalVitals(deer);const hit=damageAnimal(a.state,deer,999,'player',p.id);assert.equal(hit.killed,true);assert.equal(deer.dead,true);const id=corpseId(deer.id),corpse=a.state.containers[id];assert.ok(corpse);assert.equal(corpse.name,'Deer carcass');assert.equal(corpse.inventory.find(s=>s.item==='venison')?.count,4);assert.equal(corpse.inventory.find(s=>s.item==='hide')?.count,2);
 damageAnimal(a.state,deer,999,'player',p.id);assert.equal(Object.keys(a.state.containers).filter(k=>k===id).length,1);assert.ok(a.dispatch({type:'open_container',playerId:p.id,containerId:id}).ok);assert.ok(a.dispatch({type:'transfer',playerId:p.id,containerId:id,item:'venison',count:4,direction:'withdraw'}).ok);assert.equal(quantity(p,'venison'),6);
});

test('bison are durable herd wildlife with substantial species-specific carcass yield',()=>{
 const a=new LocalAuthority(),p=makePlayer('Hunter');a.state.players[p.id]=p;seedNature(a.state);const bison=Object.values(a.state.animals!).find(x=>x.kind==='bison')!;p.position=[...bison.position];
 assert.equal(bison.maxHealth,240);assert.equal(damageAnimal(a.state,bison,999,'player',p.id).killed,true);const corpse=a.state.containers[corpseId(bison.id)];assert.equal(corpse.name,'Bison carcass');assert.equal(corpse.inventory.find(s=>s.item==='bison_meat')?.count,8);assert.equal(corpse.inventory.find(s=>s.item==='hide')?.count,6);
});

test('crow carcasses provide both crow meat and the ingredient required to craft crow milk',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const crow=Object.values(a.state.animals!).find(x=>x.kind==='crow')!;p.position=[...crow.position];
 assert.equal(damageAnimal(a.state,crow,999,'player',p.id).killed,true);const id=corpseId(crow.id),corpse=a.state.containers[id];assert.equal(corpse.inventory.find(s=>s.item==='crow_meat')?.count,1);assert.equal(corpse.inventory.find(s=>s.item==='crow_crop')?.count,1);assert.ok(a.dispatch({type:'open_container',playerId:p.id,containerId:id}).ok);assert.ok(a.dispatch({type:'transfer',playerId:p.id,containerId:id,item:'crow_crop',count:1,direction:'withdraw'}).ok);
 p.position=[...a.state.stations['alderbrook-fire'].position];addItem(a.state,p,'herb',1);assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'crow_milk',stationId:'alderbrook-fire'}).ok,true);assert.equal(quantity(p,'crow_milk'),1);assert.equal(a.dispatch({type:'eat',playerId:p.id,item:'crow_milk'}).ok,true);assert.equal(stats(p).health,125);assert.equal(stats(p).stamina,125);
});

test('species meat can be cooked into a distinct meal with its own buff',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[...a.state.stations['alderbrook-fire'].position];p.inventory=p.inventory.filter(s=>!['venison','berries'].includes(s.item));
 addItem(a.state,p,'bison_meat',1);addItem(a.state,p,'herb',1);addItem(a.state,p,'wood',2);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'bison_roast',stationId:'alderbrook-fire'}).ok,true);assert.equal(quantity(p,'bison_roast'),1);assert.equal(quantity(p,'bison_meat'),0);
 assert.equal(a.dispatch({type:'eat',playerId:p.id,item:'bison_roast'}).ok,true);assert.equal(stats(p).health,140);assert.equal(stats(p).stamina,130);
});

test('bear bites can actually kill prey and leave a carcass',()=>{
 const a=new LocalAuthority();seedNature(a.state);const bear=Object.values(a.state.animals!).find(x=>x.kind==='bear')!,hare=Object.values(a.state.animals!).find(x=>x.kind==='hare')!;hare.health=10;const bite=bearBite(a.state,bear,hare);assert.equal(bite.killed,true);assert.equal(hare.killedBy,'bear');const corpse=a.state.containers[corpseId(hare.id)];assert.ok(corpse);assert.equal(corpse.inventory.find(s=>s.item==='hare_meat')?.count,1);assert.equal(animalAlive(hare),false);
});

test('wolf packs can bring down bison through authoritative wildlife damage',()=>{
 const a=new LocalAuthority();seedNature(a.state);const wolf=Object.values(a.state.animals!).find(x=>x.kind==='wolf')!,bison=Object.values(a.state.animals!).find(x=>x.kind==='bison')!;bison.health=10;
 const bite=wolfBite(a.state,wolf,bison);assert.equal(bite.damage,10);assert.equal(bite.killed,true);assert.equal(bison.killedBy,'wolf');const corpse=a.state.containers[corpseId(bison.id)];assert.ok(corpse);assert.equal(corpse.inventory.find(s=>s.item==='bison_meat')?.count,8);
});

test('ordinary melee actions resolve against wildlife instead of falling through to gathering',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;p.position=[0,0,0];p.yaw=0;p.equipped='axe';deer.position=[0,0,1.5];deer.health=deer.maxHealth;
 assert.ok(beginAction(p,0,'attack').ok);a.state.tick=Math.ceil(WEAPONS.axe!.impact*60);const out=resolveWildlifeStrike(a.state,p,deer,true);assert.equal(out.outcome,'hit');assert.equal(out.damage,20);assert.equal(deer.health,42);assert.equal(deer.lastAttackerId,p.id);assert.ok((deer.alarmedUntil??0)>a.state.tick);
});

test('hunter bow damages wildlife at range and respects obstruction',()=>{
 const a=new LocalAuthority(),p=makePlayer('Hunter');a.state.players[p.id]=p;seedNature(a.state);const deer=Object.values(a.state.animals!).find(x=>x.kind==='deer')!;assert.equal(quantity(p,'bow'),1);p.position=[0,0,0];p.yaw=0;p.equipped='bow';deer.position=[0,0,24];deer.health=deer.maxHealth;
 assert.ok(beginAction(p,0,'attack').ok);a.state.tick=Math.ceil(WEAPONS.bow!.impact*60);const hit=resolveWildlifeStrike(a.state,p,deer,true);assert.equal(hit.outcome,'hit');assert.equal(hit.damage,32);assert.equal(deer.health,30);p.combat=undefined;p.stamina=100;deer.health=62;assert.ok(beginAction(p,a.state.tick+100,'attack').ok);a.state.tick+=100+Math.ceil(WEAPONS.bow!.impact*60);const blocked=resolveWildlifeStrike(a.state,p,deer,false);assert.equal(blocked.outcome,'miss');assert.equal(deer.health,62);
});

test('provoked bears can hit players while dodge and guard still matter',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const bear=Object.values(a.state.animals!).find(x=>x.kind==='bear')!;p.position=[0,0,0];p.yaw=0;bear.position=[0,0,1.2];p.health=100;p.stamina=100;p.combat=undefined;const hit=bearMaul(a.state,bear,p);assert.equal(hit.outcome,'hit');assert.equal(p.health,74);
 p.health=100;p.stamina=100;p.combat=undefined;assert.ok(beginAction(p,0,'dodge').ok);a.state.tick=8;const dodge=bearMaul(a.state,bear,p);assert.equal(dodge.outcome,'dodged');assert.equal(p.health,100);p.health=100;p.stamina=100;p.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,weapon:'sword'};const block=bearMaul(a.state,bear,p);assert.equal(block.outcome,'blocked');assert.equal(p.health,94);assert.equal(p.stamina,80);
});

test('wolf interference attacks are dangerous but respect dodge and guard',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const wolf=Object.values(a.state.animals!).find(x=>x.kind==='wolf')!;p.position=[0,0,0];p.yaw=0;wolf.position=[0,0,1.1];p.health=100;p.stamina=100;p.combat=undefined;
 const hit=wolfMaul(a.state,wolf,p);assert.equal(hit.outcome,'hit');assert.equal(p.health,86);p.health=100;p.stamina=100;p.combat=undefined;assert.ok(beginAction(p,0,'dodge').ok);a.state.tick=8;assert.equal(wolfMaul(a.state,wolf,p).outcome,'dodged');assert.equal(p.health,100);
 p.health=100;p.stamina=100;p.combat={kind:'idle',started:0,until:0,consumed:false,blocking:true,weapon:'sword'};const block=wolfMaul(a.state,wolf,p);assert.equal(block.outcome,'blocked');assert.equal(p.health,96);assert.equal(p.stamina,87);
});
