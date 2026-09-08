import {Combat} from './combat';
import {addItem,type EnemyState,type PlayerState,type WorldState} from './state';
import {height} from './terrain';
import {ensureRenown} from './renown';
import {ensureRuntimeWorld} from './runtime-safety';

export interface GiantDefinition {id:string;name:string;epithet:string;region:string;x:number;z:number;health:number;scale:number;reward:number;gear:'axe'|'sword'|'fine_sword'}
export const GIANTS:readonly GiantDefinition[]=[
 {id:'giant-hroth',name:'HROTH',epithet:'THE BELL-TOWER',region:'Wolfpine',x:505,z:430,health:760,scale:2.45,reward:85,gear:'axe'},
 {id:'giant-maela',name:'MAELA',epithet:'STONE-MOTHER',region:'Greymoor',x:-520,z:390,health:900,scale:2.65,reward:105,gear:'fine_sword'},
 {id:'giant-gorm',name:'GORM',epithet:'OF NINE CARTS',region:'Giant’s Step',x:410,z:555,health:1020,scale:2.8,reward:125,gear:'fine_sword'},
 {id:'giant-bramble',name:'OLD BRAMBLE-KNEE',epithet:'WHO REMEMBERS THE FIRST ROAD',region:'Blackfen',x:-425,z:555,health:820,scale:2.55,reward:95,gear:'sword'},
 {id:'giant-accounting',name:'THE EXTREMELY LARGE ACCOUNTING ERROR',epithet:'UNRESOLVED SINCE THE OLD KINGDOM',region:'Stonewake',x:80,z:600,health:1180,scale:2.95,reward:150,gear:'fine_sword'},
] as const;

type GiantEnemy=EnemyState&{awGiantId?:string;awGiantRewarded?:boolean};
const byId=new Map(GIANTS.map(g=>[g.id,g]));
export function isGiant(enemy:EnemyState|undefined):enemy is GiantEnemy{return !!enemy&&byId.has(enemy.id);}
export function giantDefinition(enemy:EnemyState){return byId.get(enemy.id);}

export function seedGiants(world:WorldState){const w=ensureRuntimeWorld(world);for(const g of GIANTS){if(w.enemies[g.id]){(w.enemies[g.id] as GiantEnemy).awGiantId=g.id;continue;}const y=height(g.x,g.z);w.enemies[g.id]={id:g.id,name:`${g.name}, ${g.epithet}`,role:'captain',position:[g.x,y+.02,g.z],home:[g.x,y+.02,g.z],yaw:Math.PI,health:g.health,maxHealth:g.health,stamina:100,equipped:g.gear==='fine_sword'?'fine_sword':g.gear,phase:'patrol',decisionAt:0,rewarded:false,awGiantId:g.id} as GiantEnemy;}if(!w.progress.includes('giants-v1'))w.progress.push('giants-v1');return w;}

function host(cls:string){let el=document.querySelector<HTMLElement>('.'+cls);if(!el){el=document.createElement('div');el.className=cls;document.body.append(el);}return el;}
function entry(g:GiantDefinition){if(typeof document==='undefined')return;const card=document.createElement('section');card.className='giant-entry';card.innerHTML='<small>WORLD BOSS · THE MARCH TREMBLES</small><h1></h1><h2></h2><p></p>';card.querySelector('h1')!.textContent=g.name;card.querySelector('h2')!.textContent=g.epithet;card.querySelector('p')!.textContent=`${g.region} · ${g.health} health · this is a terrible time to discover whether dodging works`;document.body.append(card);requestAnimationFrame(()=>card.classList.add('show'));setTimeout(()=>card.classList.remove('show'),5200);setTimeout(()=>card.remove(),6200);}
function deathCard(g:GiantDefinition,reward:number){if(typeof document==='undefined')return;const card=document.createElement('div');card.className='giant-victory';card.innerHTML='<small>GIANT FELLED</small><strong></strong><span></span>';card.querySelector('strong')!.textContent=`${g.name} · ${g.epithet}`;card.querySelector('span')!.textContent=`+${reward} crowns · Fame +8 · legendary-quality war gear`;host('giant-victory-feed').prepend(card);setTimeout(()=>card.remove(),10000);}

function reward(world:WorldState,p:PlayerState,e:GiantEnemy){const g=giantDefinition(e);if(!g||e.awGiantRewarded)return;e.awGiantRewarded=true;const r=ensureRenown(p);r.gold+=g.reward;r.fame=Math.round((r.fame+8)*10)/10;r.reputation['March Wardens']=(r.reputation['March Wardens']??0)+5;const before=new Set(p.inventory.map(s=>s.id));addItem(world,p,g.gear,1);const stack=p.inventory.find(s=>!before.has(s.id)&&s.item===g.gear)??p.inventory.filter(s=>s.item===g.gear).at(-1);if(stack)(stack as any).quality=1.58;const key='giant-killed-'+g.id;if(!world.progress.includes(key))world.progress.push(key);deathCard(g,g.reward);try{localStorage.setItem('alderwatch.realm.v1',JSON.stringify(world));}catch{}}

function inspect(combat:any){const world=ensureRuntimeWorld(combat.authority.state as WorldState),p=combat.player.state as PlayerState;let nearest:{g:GiantDefinition;e:GiantEnemy;d:number}|undefined;for(const g of GIANTS){const e=world.enemies[g.id] as GiantEnemy|undefined;if(!e)continue;const runtime=combat.raiders?.get(g.id);if(runtime?.actor){runtime.actor.root.scale.setScalar(g.scale);runtime.actor.moveSpeed=.58;runtime.actor.root.userData.awGiant=true;}if(e.health<=0)continue;const d=Math.hypot(e.position[0]-p.position[0],e.position[2]-p.position[2]);if(!nearest||d<nearest.d)nearest={g,e,d};if(d<105){const key='giant-sighted-'+g.id;if(!world.progress.includes(key)){world.progress.push(key);entry(g);try{localStorage.setItem('alderwatch.realm.v1',JSON.stringify(world));}catch{}}}}
 if(typeof document==='undefined')return;let bar=document.querySelector<HTMLElement>('.giant-boss-bar');if(nearest&&nearest.d<125){if(!bar){bar=document.createElement('aside');bar.className='giant-boss-bar';bar.innerHTML='<small>WORLD BOSS</small><strong></strong><span></span><div><i></i></div>';document.body.append(bar);}bar.querySelector('strong')!.textContent=`${nearest.g.name} · ${nearest.g.epithet}`;bar.querySelector('span')!.textContent=`${nearest.g.region} · ${Math.round(nearest.d)} m`;const pct=Math.max(0,Math.min(100,nearest.e.health/nearest.e.maxHealth*100));(bar.querySelector('i') as HTMLElement).style.width=pct+'%';bar.hidden=false;}else if(bar)bar.hidden=true;
}

const installed=Symbol.for('alderwatch.giant-encounters.v1');
export function installGiantEncounters(){const g=globalThis as any;if(g[installed])return;g[installed]=true;const proto=Combat.prototype as any;const pre=proto.preStep;if(!proto.__awGiantsPre){proto.preStep=function(dt:number){const out=pre.call(this,dt);inspect(this);return out;};proto.__awGiantsPre=true;}const strike=proto.playerStrike;if(!proto.__awGiantsStrike){proto.playerStrike=function(...args:any[]){const world=ensureRuntimeWorld(this.authority.state),p=this.player.state as PlayerState;const before=new Map(GIANTS.map(g=>[g.id,world.enemies[g.id]?.health??0]));const out=strike.apply(this,args);for(const giant of GIANTS){const e=world.enemies[giant.id] as GiantEnemy|undefined;if(e&&before.get(giant.id)!>0&&e.health<=0)reward(world,p,e);}return out;};proto.__awGiantsStrike=true;}}
