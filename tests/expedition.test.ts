import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority,makePlayer,addItem,quantity} from '../src/state';
import {seedExpedition,EXPEDITION_STOPS,expeditionObjective,bearing} from '../src/expedition';
import {stats} from '../src/definitions';
import {seedFrontier,frontierObjective,frontierArea} from '../src/worldgen';
import {height} from '../src/terrain';

test('seeded frontier is deterministic, varied, populated and additive across reloads',()=>{
 const a=new LocalAuthority(),b=new LocalAuthority(),c=new LocalAuthority();seedFrontier(a.state,712);seedFrontier(b.state,712);seedFrontier(c.state,713);
 assert.deepEqual(a.state,b.state);assert.notDeepEqual(a.state.resources,c.state.resources);assert.equal(Object.keys(a.state.frontier!.sites).length,6);assert.ok(Object.keys(a.state.resources).length>500);assert.ok(Object.keys(a.state.forage).length>100);assert.equal(Object.keys(a.state.animals!).length,6);
 for(const r of Object.values(a.state.resources)){assert.ok(frontierArea(r.position[0],r.position[2]));assert.equal(r.position[1],height(r.position[0],r.position[2]));}
 const r=Object.values(a.state.resources)[0];r.health=0;r.phase='fallen';const site=Object.values(a.state.frontier!.sites)[0];a.state.containers[site.id].inventory=[];a.state.containers[site.id].looted=true;const saved=JSON.parse(JSON.stringify(a.state));seedFrontier(saved,999);assert.deepEqual(saved,a.state);
});
test('frontier tracking and guarded loot require actual exploration and victory',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedFrontier(a.state);const site=Object.values(a.state.frontier!.sites).find(s=>s.kind==='camp')!;
 assert.ok(a.dispatch({type:'track_frontier',playerId:p.id,siteId:site.id}).ok);assert.equal(frontierObjective(a.state,p)!.position,site.position);p.position=[...site.position];assert.ok(guardedCache(a.state,site.id));assert.equal(a.dispatch({type:'open_container',playerId:p.id,containerId:site.id}).ok,false);for(const id of site.enemies)a.state.enemies[id].health=0;assert.equal(guardedCache(a.state,site.id),false);assert.ok(a.dispatch({type:'open_container',playerId:p.id,containerId:site.id}).ok);
 assert.ok(a.dispatch({type:'track_frontier',playerId:p.id,siteId:''}).ok);assert.equal(frontierObjective(a.state,p),undefined);
});
test('expansion keeps legacy terrain heights and avoids building over saved homes',()=>{
 for(const [x,z] of [[0,18],[40,-25],[-200,220],[260,-260]]){const old=.6*Math.sin(x*.058)+.8*Math.cos(z*.057)+.48*Math.sin((x+z)*.1)+3.8*Math.exp(-Math.pow((z-20)/23,2))-3*Math.exp(-Math.pow((x+31)/14,2)-Math.pow((z+12)/31,2))+Math.max(0,Math.abs(x)-63)*.13;assert.equal(height(x,z),old);}
 const a=new LocalAuthority();a.state.structures.house={id:'house',kind:'foundation',position:[20,0,105],yaw:0,ownerId:'old'};seedFrontier(a.state);for(const s of Object.values(a.state.frontier!.sites))assert.ok(Math.hypot(s.position[0]-20,s.position[2]-105)>=13);assert.equal(a.state.structures.house.position[1],0);
});
import {seedBounties,bountyObjective} from '../src/bounties';

test('bounty camps preserve saves and pay only after tracking, reaching and clearing their chest',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedBounties(a.state);
 assert.equal(Object.keys(a.state.bountySites!).length,2);const b=a.state.bountySites!.woodcutters;
 const run=(action:'accept'|'claim')=>a.dispatch({type:'bounty',playerId:p.id,action,bountyId:b.id});
 p.position=[...b.position];assert.equal(run('claim').ok,false);assert.ok(run('accept').ok);assert.equal(run('claim').ok,false);assert.ok(guardedCache(a.state,'bounty-cache-'+b.id));
 a.state.enemies[b.enemies[0]].health=0;p.position=[100,0,100];assert.equal(run('claim').ok,false);p.position=[...b.position];assert.match(bountyObjective(a.state,p)!.text,/Camp cleared/);assert.ok(run('claim').ok);assert.equal(quantity(p,'sword'),1);assert.equal(quantity(p,'iron'),6);assert.equal(run('claim').ok,false);
 const saved=JSON.parse(JSON.stringify(a.state));seedBounties(saved);assert.equal(JSON.stringify(saved),JSON.stringify(a.state));
 const second=a.state.bountySites!.poachers;p.position=[...second.position];a.dispatch({type:'bounty',playerId:p.id,action:'accept',bountyId:second.id});a.state.enemies[second.enemies[0]].health=0;assert.equal(a.dispatch({type:'bounty',playerId:p.id,action:'claim',bountyId:second.id}).ok,false);a.state.enemies[second.enemies[1]].health=0;assert.ok(a.dispatch({type:'bounty',playerId:p.id,action:'claim',bountyId:second.id}).ok);assert.equal(quantity(p,'woodland_broth'),2);
});
import {guardedCache,seedEnemies,beginAction,setGuard,resolveStrike} from '../src/combat-rules';
const setup=()=>{const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedExpedition(a.state);return {a,p};};
test('additive expedition seed preserves dead enemies, save progress and moved camps',()=>{
 const {a,p}=setup();p.expedition={accepted:true,recovered:['road'],completed:false};const e=Object.values(a.state.enemies)[0];e.health=0;e.rewarded=true;
 const original=JSON.stringify(a.state);seedExpedition(a.state);assert.equal(JSON.stringify(a.state),original);
 const loaded=JSON.parse(original);seedExpedition(loaded);assert.deepEqual(loaded,a.state);assert.equal(Object.keys(a.state.enemies).length,4);
});
test('new camps route around player buildings without moving or erasing them',()=>{
 const a=new LocalAuthority();a.state.structures.keep={id:'keep',kind:'foundation',position:[24,0,-49],yaw:0,ownerId:'owner'};
 seedExpedition(a.state);assert.ok(Math.hypot(a.state.expeditionSites!.road.position[0]-24,a.state.expeditionSites!.road.position[2]+49)>11);assert.equal(a.state.structures.keep.position[0],24);
});
test('dispatches validate acceptance, reach, order and every defender even when kited away',()=>{
 const {a,p}=setup(),road=a.state.expeditionSites!.road;p.position=[...road.position];
 const recover=()=>a.dispatch({type:'expedition',playerId:p.id,action:'recover',siteId:'road'});
 assert.equal(recover().ok,false);assert.ok(a.dispatch({type:'expedition',playerId:p.id,action:'accept'}).ok);
 a.state.enemies[road.enemies[0]].position=[100,0,100];assert.ok(guardedCache(a.state,'expedition-cache-road'));assert.equal(recover().ok,false);
 for(const id of road.enemies)a.state.enemies[id].health=0;
 p.position=[0,0,0];assert.equal(recover().ok,false);p.position=[...road.position];assert.ok(recover().ok);
 const count=quantity(p,'iron');assert.equal(recover().ok,false);assert.equal(quantity(p,'iron'),count);
 p.position=[...a.state.expeditionSites!.captain.position];assert.equal(a.dispatch({type:'expedition',playerId:p.id,action:'recover',siteId:'captain'}).ok,false);
});
test('complete three-stop outing, save/reload, return and claim one player-owned reward',()=>{
 const {a,p}=setup();a.dispatch({type:'expedition',playerId:p.id,action:'accept'});
 for(const stop of EXPEDITION_STOPS){const site=a.state.expeditionSites![stop.id];for(const id of site.enemies)a.state.enemies[id].health=0;p.position=[...site.position];assert.ok(a.dispatch({type:'expedition',playerId:p.id,action:'recover',siteId:stop.id}).ok);}
 assert.equal(a.dispatch({type:'expedition',playerId:p.id,action:'report'}).ok,false);
 const b=new LocalAuthority(JSON.parse(JSON.stringify(a.state))),q=b.state.players[p.id];q.position=[...b.state.stations['alderbrook-bench'].position];
 assert.ok(b.dispatch({type:'expedition',playerId:q.id,action:'report'}).ok);assert.equal(stats(q).health,125);assert.equal(stats(q).stamina,115);assert.equal(stats(q).damage,1.1);assert.equal(quantity(q,'fine_sword'),1);
 const reward=JSON.stringify(q.inventory);assert.equal(b.dispatch({type:'expedition',playerId:q.id,action:'report'}).ok,false);assert.equal(JSON.stringify(q.inventory),reward);
 const other=makePlayer('Hunter');other.id='another-survivor';b.state.players[other.id]=other;assert.equal(other.expedition,undefined);assert.equal(stats(other).damage,1);
});
test('safe fire restoration costs timber; nearby enemies and remote access fail atomically',()=>{
 const {a,p}=setup();p.position=[...a.state.stations['alderbrook-fire'].position];p.health=20;addItem(a.state,p,'wood',2);
 const rest=()=>a.dispatch({type:'rest',playerId:p.id,stationId:'alderbrook-fire'});assert.ok(rest().ok);assert.equal(p.health,110);assert.equal(quantity(p,'wood'),1);
 assert.equal(rest().ok,false);p.health=20;seedEnemies(a.state);a.state.enemies['raider-camp-sentry'].position=[...p.position];assert.equal(rest().ok,false);assert.equal(p.health,20);assert.equal(quantity(p,'wood'),1);
});
test('quick food uses normal authority and has a persisted ten-second cooldown',()=>{
 const {a,p}=setup();p.health=10;addItem(a.state,p,'grilled_venison',2);const eat=()=>a.dispatch({type:'eat',playerId:p.id,item:'grilled_venison'});
 assert.ok(eat().ok);assert.equal(eat().ok,false);assert.equal(quantity(p,'grilled_venison'),1);a.state.tick+=600;assert.ok(eat().ok);assert.equal(quantity(p,'grilled_venison'),0);
});
test('journal objective and compass reflect real world positions and completion',()=>{
 const {a,p}=setup();assert.equal(bearing([0,0,0],[0,0,-10]),'N · 10 m');assert.equal(bearing([0,0,0],[10,0,0]),'E · 10 m');
 a.dispatch({type:'expedition',playerId:p.id,action:'accept'});assert.equal(expeditionObjective(a.state,p).title,'THE MISSING COURIERS');
 p.expedition!.recovered=['road','stores','captain'];assert.equal(expeditionObjective(a.state,p).title,'BRING THEM HOME');
});

test('a precisely timed guard parries a light attack but cannot parry a heavy cut',()=>{
 for(const heavy of [false,true]){
  const {a,p}=setup(),enemy=Object.values(a.state.enemies)[0];p.position=[0,0,0];p.yaw=0;p.equipped='sword';enemy.position=[0,0,1.2];enemy.yaw=Math.PI;enemy.equipped='sword';
  assert.ok(beginAction(enemy,0,heavy?'heavy':'attack').ok);a.state.tick=heavy?50:26;setGuard(p,a.state.tick-6,true);
  const out=resolveStrike(a.state,enemy,p);assert.equal(out.outcome,heavy?'blocked':'parried');if(!heavy){assert.equal(p.health,100);assert.equal(enemy.combat!.kind,'hit');assert.equal(enemy.combat!.until,a.state.tick+66);}
 }
});
