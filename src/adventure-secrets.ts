import * as T from 'three';
import {Landscape} from './landscape';
import {height} from './terrain';
import {addItem,ITEMS,type ItemId,type PlayerState,type WorldState} from './state';
import {ensureRenown,ACHIEVEMENTS,type AchievementDefinition} from './renown';
import {qualityLabel} from './loot';

interface Secret {id:string;name:string;x:number;z:number;crowns:number;loot:readonly [ItemId,number][];gear?:{item:ItemId;quality:number};joke:string}
const SECRETS:readonly Secret[]=[
 {id:'hunter',name:'The Old Hunter’s Cache',x:46,z:74,crowns:18,loot:[['hide',4],['grilled_venison',2]],gear:{item:'bow',quality:1.24},joke:'Someone buried an excellent bow and then apparently forgot the entire concept of maps.'},
 {id:'smuggler',name:'Bridge Smuggler’s Box',x:-38,z:42,crowns:32,loot:[['iron',5],['wild_honey',2]],joke:'Contraband recovered. You have heroically decided to keep all of it.'},
 {id:'crow-priest',name:'The Extremely Heretical Picnic',x:-82,z:116,crowns:12,loot:[['crow_crop',3],['herb',4],['crow_milk',2]],joke:'There are cups. There are feathers. There are questions that should remain unanswered.'},
 {id:'ironward',name:'Ironward Veteran’s Chest',x:118,z:62,crowns:45,loot:[['iron',8],['hearty_stew',2]],gear:{item:'sword',quality:1.4},joke:'A retired soldier hid a sword here. Retirement appears to be going poorly.'},
];
const groups=new WeakMap<Landscape,T.Group>();let active:Landscape|undefined;const installed=Symbol.for('alderwatch.adventure-secrets.v1');
const SECRET_ACHIEVEMENTS:AchievementDefinition[]=[
 {id:'secret_first',title:'WHO LEFT THIS HERE?',description:'Open a hidden March cache. Exploration has become financially irresponsible.',test:r=>(r.counters.secret_cache??0)>=1},
 {id:'secret_all',title:'THE MAP WAS IN YOUR HEART',description:'Find every hidden cache without being given a quest marker like a civilized person.',test:r=>(r.counters.secret_cache??0)>=SECRETS.length},
];
function installAchievements(){for(const a of SECRET_ACHIEVEMENTS)if(!ACHIEVEMENTS.some(x=>x.id===a.id))(ACHIEVEMENTS as AchievementDefinition[]).push(a);}
function popup(title:string,text:string){let host=document.querySelector<HTMLElement>('.overdrive-feed');if(!host){host=document.createElement('div');host.className='overdrive-feed';document.body.append(host);}const c=document.createElement('div');c.className='overdrive-card';c.innerHTML='<small>HIDDEN CACHE</small><strong></strong><span></span>';c.querySelector('strong')!.textContent=title;c.querySelector('span')!.textContent=text;host.prepend(c);setTimeout(()=>c.remove(),8600);}
function addGear(w:WorldState,p:PlayerState,item:ItemId,quality:number){const before=new Set(p.inventory.map(s=>s.id));addItem(w,p,item,1);const stack=p.inventory.find(s=>!before.has(s.id)&&s.item===item)??p.inventory.filter(s=>s.item===item).at(-1);if(stack)stack.quality=quality;}
function unlock(p:PlayerState,w:WorldState){const r=ensureRenown(p);r.counters.secret_cache=(r.counters.secret_cache??0)+1;for(const a of SECRET_ACHIEVEMENTS)if(!r.achievements[a.id]&&a.test(r)){r.achievements[a.id]=w.tick||Date.now();popup('ACHIEVEMENT · '+a.title,a.description);}}
function build(land:Landscape){active=land;if(groups.has(land))return;const root=new T.Group();root.name='Hidden March caches';land.scene.add(root);for(const s of SECRETS){const g=new T.Group();g.name=s.name;g.position.set(s.x,height(s.x,s.z)+.02,s.z);const chest=land.assets.prop('chest');chest.scale.setScalar(.92);g.add(chest);const lantern=land.assets.prop('lantern');lantern.position.set(.8,.1,.45);lantern.scale.setScalar(.85);g.add(lantern);const stone=land.assets.prop('paving_0');stone.position.set(-.55,.01,.3);stone.scale.setScalar(.52);g.add(stone);g.userData.secretId=s.id;root.add(g);}groups.set(land,root);}
function nearest(land:Landscape,p:PlayerState){let best:Secret|undefined,bestD=3;for(const s of SECRETS){const d=Math.hypot(p.position[0]-s.x,p.position[2]-s.z);if(d<bestD){best=s;bestD=d;}}return best;}
function open(secret:Secret,land:Landscape,p:PlayerState){const w=land.state,key='secret-opened-'+secret.id;if(w.progress.includes(key)){popup(secret.name,'Empty. You were already the problem here.');return;}w.progress.push(key);for(const [item,count] of secret.loot)addItem(w,p,item,count);if(secret.gear)addGear(w,p,secret.gear.item,secret.gear.quality);const r=ensureRenown(p);r.gold+=secret.crowns;r.fame=Math.round((r.fame+1.5)*10)/10;unlock(p,w);const gear=secret.gear?` · ${qualityLabel(secret.gear.quality)} ${ITEMS[secret.gear.item].name}`:'';popup(secret.name.toUpperCase(),`${secret.joke} · +${secret.crowns} crowns${gear}`);try{localStorage.setItem('alderwatch.realm.v1',JSON.stringify(w));}catch{}}
function installWorld(){const proto=Landscape.prototype as any;if(proto.__awAdventureSecrets)return;const terrain=proto.terrain,update=proto.update;proto.terrain=function(...args:any[]){const out=terrain.apply(this,args);build(this);return out;};proto.update=function(...args:any[]){build(this);return update.apply(this,args);};proto.__awAdventureSecrets=true;}
function key(e:KeyboardEvent){if(e.code!=='KeyE'||e.repeat||!active)return;const p=Object.values(active.state.players)[0];if(!p)return;const s=nearest(active,p);if(!s)return;e.preventDefault();e.stopImmediatePropagation();open(s,active,p);}
function install(){const g=globalThis as any;if(g[installed])return;g[installed]=true;installAchievements();installWorld();window.addEventListener('keydown',key,true);}
if(typeof window!=='undefined'&&typeof document!=='undefined')install();
