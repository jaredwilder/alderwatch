import {Landscape} from './landscape';
import {Combat} from './combat';
import {addItem,type PlayerState,type WorldState} from './state';
import {ensureRenown} from './renown';
import {WORLD_BOSSES,isWorldBoss,seedWorldBosses,worldBossDefinition,type WorldBossEnemy} from './world-bosses';
import './world-bosses.css';

const SAVE_KEY='alderwatch.realm.v1';
const installed=Symbol.for('alderwatch.world-boss-runtime.v2');
function persist(world:WorldState){try{localStorage.setItem(SAVE_KEY,JSON.stringify(world));}catch{}}

function encounterCard(boss:(typeof WORLD_BOSSES)[number]){
 if(typeof document==='undefined')return;
 const old=document.querySelector('.world-boss-entry');old?.remove();
 const card=document.createElement('section');card.className='world-boss-entry';card.innerHTML='<small>WORLD BOSS · THE MARCH TREMBLES</small><h1></h1><h2></h2><p></p>';
 card.querySelector('h1')!.textContent=boss.name;card.querySelector('h2')!.textContent=boss.epithet;
 card.querySelector('p')!.textContent=`${boss.region} · ${boss.health} health · this is a terrible time to discover whether dodging works`;
 document.body.append(card);requestAnimationFrame(()=>card.classList.add('show'));setTimeout(()=>card.classList.remove('show'),5200);setTimeout(()=>card.remove(),6100);
}
function victoryCard(boss:(typeof WORLD_BOSSES)[number],reward:number){
 if(typeof document==='undefined')return;
 let host=document.querySelector<HTMLElement>('.world-boss-victory-feed');if(!host){host=document.createElement('div');host.className='world-boss-victory-feed';document.body.append(host);}
 const card=document.createElement('div');card.className='world-boss-victory';card.innerHTML='<small>GIANT FELLED</small><strong></strong><span></span>';
 card.querySelector('strong')!.textContent=`${boss.name} · ${boss.epithet}`;card.querySelector('span')!.textContent=`+${reward} crowns · Fame +8 · legendary-quality war gear`;
 host.prepend(card);setTimeout(()=>card.remove(),10000);
}
function reward(world:WorldState,player:PlayerState,enemy:WorldBossEnemy){
 const boss=worldBossDefinition(enemy.id);if(!boss||enemy.awWorldBossRewarded)return;enemy.awWorldBossRewarded=true;
 const renown=ensureRenown(player);renown.gold+=boss.reward;renown.fame=Math.round((renown.fame+8)*10)/10;renown.reputation['March Wardens']=(renown.reputation['March Wardens']??0)+5;
 const before=new Set(player.inventory.map(s=>s.id));addItem(world,player,boss.gear,1);const stack=player.inventory.find(s=>!before.has(s.id)&&s.item===boss.gear)??player.inventory.filter(s=>s.item===boss.gear).at(-1);if(stack)stack.quality=1.58;
 const key='world-boss-killed-'+boss.id;if(!world.progress.includes(key))world.progress.push(key);victoryCard(boss,boss.reward);persist(world);
}

function inspect(combat:any){
 const world=combat.authority?.state as WorldState|undefined,player=combat.player?.state as PlayerState|undefined;if(!world||!player)return;
 let nearest:{boss:(typeof WORLD_BOSSES)[number];enemy:WorldBossEnemy;distance:number}|undefined;
 for(const boss of WORLD_BOSSES){
  const enemy=world.enemies[boss.id] as WorldBossEnemy|undefined;if(!enemy)continue;
  const runtime=combat.raiders?.get(boss.id);if(runtime?.actor&&!runtime.actor.root.userData.awWorldBoss){runtime.actor.root.userData.awWorldBoss=true;runtime.actor.root.scale.setScalar(boss.scale);runtime.actor.moveSpeed=.58;}
  if(enemy.health<=0)continue;const distance=Math.hypot(enemy.position[0]-player.position[0],enemy.position[2]-player.position[2]);if(!nearest||distance<nearest.distance)nearest={boss,enemy,distance};
  if(distance<105){const key='world-boss-sighted-'+boss.id;if(!world.progress.includes(key)){world.progress.push(key);encounterCard(boss);persist(world);}}
 }
 if(typeof document==='undefined'||world.tick%6!==0)return;
 let bar=document.querySelector<HTMLElement>('.world-boss-bar');
 if(nearest&&nearest.distance<125){
  if(!bar){bar=document.createElement('aside');bar.className='world-boss-bar';bar.innerHTML='<small>WORLD BOSS</small><strong></strong><span></span><div><i></i></div>';document.body.append(bar);}
  bar.querySelector('strong')!.textContent=`${nearest.boss.name} · ${nearest.boss.epithet}`;bar.querySelector('span')!.textContent=`${nearest.boss.region} · ${Math.round(nearest.distance)} m`;
  (bar.querySelector('i') as HTMLElement).style.width=Math.max(0,Math.min(100,nearest.enemy.health/nearest.enemy.maxHealth*100))+'%';bar.hidden=false;
 }else if(bar)bar.hidden=true;
}

export function installWorldBossRuntime(){
 const global=globalThis as any;if(global[installed])return;global[installed]=true;
 // Landscape is constructed before Combat. Seeding here guarantees Combat creates real
 // actors/colliders for the bosses instead of producing map-only promises.
 const land=Landscape.prototype as any,terrain=land.terrain;if(!land.__awWorldBossSeed){land.terrain=function(...args:any[]){seedWorldBosses(this.state as WorldState);return terrain.apply(this,args);};land.__awWorldBossSeed=true;}
 const combat=Combat.prototype as any,preStep=combat.preStep;if(!combat.__awWorldBossPre){combat.preStep=function(dt:number){const out=preStep.call(this,dt);inspect(this);return out;};combat.__awWorldBossPre=true;}
 const strike=combat.playerStrike;if(!combat.__awWorldBossStrike){combat.playerStrike=function(...args:any[]){const world=this.authority?.state as WorldState,player=this.player?.state as PlayerState;const before=new Map(WORLD_BOSSES.map(b=>[b.id,world.enemies[b.id]?.health??0]));const out=strike.apply(this,args);for(const boss of WORLD_BOSSES){const enemy=world.enemies[boss.id];if(isWorldBoss(enemy)&&(before.get(boss.id)??0)>0&&enemy.health<=0)reward(world,player,enemy);}return out;};combat.__awWorldBossStrike=true;}
}
installWorldBossRuntime();
