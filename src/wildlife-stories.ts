if(typeof document!=='undefined')void import('./wildlife-stories.css');
import {Nature} from './nature';
import type {WorldState} from './state';
import type {AnimalState} from './wildlife-species';
import {animalAlive} from './wildlife-rules';
import {animalBountyCrowns,animalDisplayName,ensureAnimalNotoriety,isWantedAnimal,mostWanted,wildKarmaTitle} from './wildlife-notoriety';
import {refreshWildMostWanted} from './bounties';
import {ensureRenown,recordRenownEvent,type AchievementDefinition,type RenownEvent} from './renown';

interface Tracker{
 ready:boolean;
 carry:Map<string,string|undefined>;
 airborne:Map<string,boolean>;
 hunt:Map<string,string|undefined>;
 aggro:Map<string,number>;
 packAggro:Map<string,number>;
 wanted:Map<string,boolean>;
 dead:Set<string>;
 paid:Set<string>;
}
const trackers=new WeakMap<object,Tracker>();
const installed=Symbol.for('alderwatch.wildlife-stories.v1');
const distance=(a:[number,number,number],b:[number,number,number])=>Math.hypot(a[0]-b[0],a[2]-b[2]);

function feed(){if(typeof document==='undefined')return;let el=document.querySelector<HTMLElement>('.wild-story-feed');if(!el){el=document.createElement('div');el.className='wild-story-feed';document.body.append(el);}return el;}
function wildStory(title:string,text:string){const host=feed();if(!host)return;const card=document.createElement('div');card.className='wild-story';card.innerHTML='<small>THE WILDERNESS JUST DID A THING</small><strong></strong><span></span>';card.querySelector('strong')!.textContent=title;card.querySelector('span')!.textContent=text;host.prepend(card);while(host.children.length>3)host.lastElementChild?.remove();setTimeout(()=>card.remove(),7200);}
function achievementPop(a:AchievementDefinition){const host=document.querySelector<HTMLElement>('.achievement-feed')??document.body.appendChild(Object.assign(document.createElement('div'),{className:'achievement-feed'}));const card=document.createElement('div');card.className='achievement-pop';card.innerHTML='<small>ACHIEVEMENT UNLOCKED</small><strong></strong><span></span>';card.querySelector('strong')!.textContent=a.title;card.querySelector('span')!.textContent=a.description;host.prepend(card);setTimeout(()=>card.remove(),9000);}
function witness(w:WorldState,event:RenownEvent){const p=Object.values(w.players)[0];if(!p)return;for(const a of recordRenownEvent(p,event,1,w.tick))if(typeof document!=='undefined')achievementPop(a);}
function nearPlayer(w:WorldState,a:AnimalState,r=95){return Object.values(w.players).some(p=>p.health>0&&distance(p.position,a.position)<r);}
function preyName(kind:string){return kind==='hare'?'rabbit':kind;}
function announceBeastBounty(w:WorldState,a:AnimalState,t:Tracker){if(!a.bountyClaimed||t.paid.has(a.id))return;const p=Object.values(w.players)[0];if(!p?.bounties?.completedAnimals?.includes(a.id))return;t.paid.add(a.id);const reward=animalBountyCrowns(a);wildStory('WANTED BEAST: PAID',`${animalDisplayName(a)} is off the board. Mara authorizes ${reward} crowns and absolutely no questions.`);}

/** Improve the intentionally ridiculous eagle carry without changing authoritative positions. */
function dressCarry(nature:any,w:WorldState){
 for(const a of Object.values(w.animals??{}) as AnimalState[]){const visual=nature.animals?.get(a.id);if(!visual?.group)continue;
  if(a.carriedById){const carrier=w.animals?.[a.carriedById];if(!carrier)continue;const swing=Math.sin((carrier.phase??0)*4.1)*.13,sideX=Math.cos(carrier.yaw)*swing,sideZ=-Math.sin(carrier.yaw)*swing;visual.group.position.set(carrier.position[0]+sideX,carrier.position[1]-(a.kind==='sheep'?.92:.58),carrier.position[2]+sideZ);visual.group.rotation.set(.08,carrier.yaw+Math.PI,a.kind==='sheep'?1.48:1.28);visual.group.userData.awCarryPose=true;
  }else if(animalAlive(a)&&visual.group.userData.awCarryPose){visual.group.rotation.x=0;visual.group.rotation.z=0;delete visual.group.userData.awCarryPose;}
 }
}

function inspect(nature:any){const w=nature.w as WorldState|undefined;if(!w?.animals)return;dressCarry(nature,w);if(w.tick%12!==0)return;
 let t=trackers.get(nature);if(!t){t={ready:false,carry:new Map(),airborne:new Map(),hunt:new Map(),aggro:new Map(),packAggro:new Map(),wanted:new Map(),dead:new Set(),paid:new Set()};trackers.set(nature,t);}
 const animals=Object.values(w.animals) as AnimalState[];for(const a of animals)ensureAnimalNotoriety(a);
 if(!t.ready){for(const a of animals){t.carry.set(a.id,a.carriedPreyId);t.airborne.set(a.id,a.airborne===true);t.hunt.set(a.id,a.huntTargetId);t.aggro.set(a.id,a.aggroUntil??0);t.wanted.set(a.id,isWantedAnimal(a));if(a.dead)t.dead.add(a.id);if(a.bountyClaimed)t.paid.add(a.id);}t.ready=true;refreshWildMostWanted(w);return;}
 for(const a of animals){
  const close=nearPlayer(w,a),wanted=isWantedAnimal(a),oldWanted=t.wanted.get(a.id)??false;if(wanted&&!oldWanted){wildStory('NEW WANTED BEAST',`${animalDisplayName(a)} has accumulated ${(a.notoriety??0).toFixed(0)} Notoriety and ${a.wildKarma?.toFixed(0)} Wild Karma. The contract board has opinions.`);}
  const oldCarry=t.carry.get(a.id),carry=a.carriedPreyId;if(a.kind==='eagle'&&carry&&carry!==oldCarry&&close){const prey=w.animals[carry];wildStory(prey?.kind==='sheep'?'AIRBORNE MUTTON':'THE EAGLE HAS YOUR BUNNY',prey?.kind==='sheep'?'An eagle has made a deeply ambitious livestock decision.':'A rabbit has been promoted to involuntary aviation.');witness(w,'witness_eagle_pickup');}
  if(a.kind==='eagle'&&oldCarry&&!carry&&close){wildStory('PACKAGE DELIVERED. CONDITION: UNCLEAR.',`The eagle dropped its ${preyName(w.animals[oldCarry]?.kind??'prey')}. Gravity has entered the food web.`);witness(w,'witness_eagle_drop');}
  const oldAir=t.airborne.get(a.id),air=a.airborne===true;if(a.kind==='eagle'&&oldAir===true&&!air&&close){wildStory('EAGLE OUT OF GAS','The apex of the sky is now walking. Wolves have been notified.');witness(w,'witness_eagle_exhausted');}
  const oldHunt=t.hunt.get(a.id),hunt=a.huntTargetId;if(a.kind==='wolf'&&hunt!==oldHunt&&hunt&&w.animals[hunt]?.kind==='bison'&&close){wildStory('THREE WOLVES HAVE A BUSINESS PLAN','A wolf pack has selected several hundred kilograms of consequences.');witness(w,'witness_wolf_bison_hunt');}
  if(a.kind==='wolf'&&a.packId&&(a.aggroUntil??0)>w.tick&&a.aggroPlayerId===Object.values(w.players)[0]?.id){const old=t.packAggro.get(a.packId)??0;if(old<=w.tick&&close){t.packAggro.set(a.packId,a.aggroUntil??0);wildStory('YOU INTERRUPTED DINNER','The entire wolf pack has amended the menu. You are the amendment.');witness(w,'witness_pack_aggro');}}
  if(a.dead&&!t.dead.has(a.id)){t.dead.add(a.id);announceBeastBounty(w,a,t);if(a.killedBy&&a.killedBy!=='player'&&close){const killer=a.killedBy.toUpperCase();wildStory('NATURE DOCUMENTARY, UNAUTHORIZED',`${killer} killed a ${a.kind}. No quest marker was involved.`);witness(w,'witness_predator_kill');if(a.kind==='eagle'&&(a.killedBy==='wolf'||a.killedBy==='bear')){wildStory('THE FOOD CHAIN HAS LOOPED','The exhausted sky predator has been eaten by a ground predator. Perfectly normal game development.');witness(w,'witness_eagle_eaten');}}}
  t.carry.set(a.id,carry);t.airborne.set(a.id,air);t.hunt.set(a.id,hunt);t.aggro.set(a.id,a.aggroUntil??0);t.wanted.set(a.id,wanted);
 }
 refreshWildMostWanted(w);decorateProfile(w);
}

function decorateProfile(w:WorldState){if(typeof document==='undefined')return;const panel=document.querySelector<HTMLElement>('.fun-profile');if(!panel||panel.querySelector('.wildlife-chronicle'))return;const p=Object.values(w.players)[0];if(!p)return;const r=ensureRenown(p),alive=Object.values(w.animals??{}).filter(a=>!a.dead),counts=(kind:string)=>alive.filter(a=>a.kind===kind).length,wanted=mostWanted(w.animals??{}).filter(a=>!a.dead).slice(0,3);const title=document.createElement('div');title.className='profile-section-title';title.textContent='WILDLIFE CHRONICLE';const block=document.createElement('div');block.className='wildlife-chronicle';block.innerHTML=`<div><strong>${alive.length}</strong><small>animals currently alive</small></div><div><strong>${counts('wolf')}</strong><small>wolves still making choices</small></div><div><strong>${counts('eagle')}</strong><small>eagles with fuel remaining</small></div><div><strong>${r.counters.witness_predator_kill??0}</strong><small>predator kills witnessed</small></div><div><strong>${r.counters.witness_eagle_pickup??0}</strong><small>involuntary airlifts</small></div><div><strong>${r.counters.kill_hare??0}</strong><small>bunny crimes personally committed</small></div>`;if(wanted.length){const wantedTitle=document.createElement('div');wantedTitle.className='profile-section-title';wantedTitle.textContent='WILD MOST WANTED';const list=document.createElement('div');list.className='wildlife-chronicle';for(const a of wanted){const row=document.createElement('div');row.innerHTML=`<strong>${animalDisplayName(a)}</strong><small>${wildKarmaTitle(a.wildKarma??0)} · Karma ${(a.wildKarma??0).toFixed(0)} · Notoriety ${(a.notoriety??0).toFixed(0)} · ${animalBountyCrowns(a)} crowns</small>`;list.append(row);}panel.append(wantedTitle,list);}const achievements=panel.querySelector('.profile-section-title:last-of-type');if(achievements){panel.insertBefore(title,achievements);panel.insertBefore(block,achievements);}else panel.append(title,block);}

export function installWildlifeStories(){const g=globalThis as any;if(g[installed])return;g[installed]=true;const proto=Nature.prototype as any,original=proto.update;if(proto.__awWildStories)return;proto.update=function(dt:number){const out=original.call(this,dt);inspect(this);return out;};proto.__awWildStories=true;}
installWildlifeStories();
