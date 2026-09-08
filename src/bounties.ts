import {addItem,quantity,type ItemId,type PlayerState,type WorldState,type Vec3} from './state';
import {height} from './terrain';
import {animalBountyCrowns,animalDisplayName,mostWanted} from './wildlife-notoriety';

export interface BountySite {id:string;name:string;position:Vec3;enemies:string[]}
export interface BountyProgress {active?:string;completed:string[];activeAnimal?:string;completedAnimals?:string[]}
interface BountyDefinition {id:string;name:string;x:number;z:number;count:number;hint:string;reward:string;items:Partial<Record<ItemId,number>>;starterBlade?:boolean}
export const WILD_BOUNTY_ID='wild-most-wanted';
export const BOUNTIES:readonly BountyDefinition[]=[
 {id:'woodcutters',name:'The Woodcutters’ Ransom',x:22,z:2,count:1,hint:'A deserter stole the woodcutters’ pay. Defeat him and open his chest.',reward:'Sword (or 4 extra iron if already armed) · 2 grilled venison · 6 iron',items:{grilled_venison:2,iron:6},starterBlade:true},
 {id:'poachers',name:'The Poachers’ Hollow',x:48,z:14,count:2,hint:'Two poachers have taken the eastern hollow. Break their guard and recover the stockpile.',reward:'12 iron · 8 hide · 2 woodland broth',items:{iron:12,hide:8,woodland_broth:2}},
 {id:'southwood',name:'The Southwood Tollbreakers',x:58,z:142,count:3,hint:'A three-man road gang is taxing every cart that enters Southwood. Clear their watchfire.',reward:'14 iron · 8 timber · 3 grilled venison',items:{iron:14,wood:8,grilled_venison:3}},
 {id:'ironward',name:'Ironward Blackmail',x:126,z:54,count:3,hint:'Ash Company veterans seized the ridge stores. Take the post and recover their iron reserve.',reward:'20 iron · 6 hide · 2 marcher’s stew',items:{iron:20,hide:6,hearty_stew:2}},
 {id:'briar',name:'The Briar Oathbreakers',x:-128,z:94,count:3,hint:'Oathbreakers are using a ruined holding as a raiding base. End the patrol and loot their stores.',reward:'14 iron · 10 hide · 2 woodland broth',items:{iron:14,hide:10,woodland_broth:2}},
 {id:'heath',name:'The Heath Reavers',x:-210,z:142,count:4,hint:'A hard four-man crew controls the western watch. This is the longest fight on the contract board.',reward:'24 iron · 12 hide · 3 marcher’s stew',items:{iron:24,hide:12,hearty_stew:3}},
 {id:WILD_BOUNTY_ID,name:'Wild Most Wanted',x:0,z:0,count:0,hint:'The Wildkeepers now post contracts on animals that have developed an actual criminal record. Track the worst living menace.',reward:'15+ crowns · reputation · whatever is in the carcass',items:{}},
];
const dist=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function refreshWildMostWanted(w:WorldState){w.bountySites??={};const tracked=Object.values(w.players).map(p=>p.bounties?.activeAnimal).find(Boolean),animals=w.animals??{},target=tracked?animals[tracked!]:mostWanted(animals).find(a=>!a.dead);if(target&&!target.bountyClaimed)w.bountySites[WILD_BOUNTY_ID]={id:WILD_BOUNTY_ID,name:`WANTED · ${animalDisplayName(target)}`,position:[...target.position],enemies:[]};else delete w.bountySites[WILD_BOUNTY_ID];return target;}
export function seedBounties(w:WorldState){
 w.bountySites??={};
 for(const def of BOUNTIES){
  if(def.id===WILD_BOUNTY_ID)continue;
  let site=w.bountySites[def.id];
  if(!site){
   let point:Vec3|undefined;
   for(let r=0;r<=18&&!point;r+=3)for(let i=0;i<(r?16:1);i++){
    const x=def.x+Math.cos(i*Math.PI/8)*r,z=def.z+Math.sin(i*Math.PI/8)*r,p:Vec3=[x,height(x,z),z];
    if(p[1]<0||Object.values(w.structures).some(s=>dist(s.position,p)<11)||Object.values(w.stations).some(s=>dist(s.position,p)<10)||Object.values(w.resources).some(s=>s.phase==='standing'&&dist(s.position,p)<6)||[...Object.values(w.expeditionSites??{}),...Object.values(w.bountySites)].some(s=>dist(s.position,p)<18))continue;
    point=p;break;
   }
   if(!point)continue;
   site=w.bountySites[def.id]={id:def.id,name:def.name,position:point,enemies:Array.from({length:def.count},(_,i)=>`bounty-${def.id}-${i}`)};
  }
  site.enemies.forEach((id,i)=>{
   const angle=(i-(def.count-1)/2)*.72,x=site!.position[0]+Math.sin(angle)*3.1,z=site!.position[2]-2.4+Math.cos(angle)*.55,p:Vec3=[x,height(x,z)+.02,z],maxHealth=66+def.count*7+(i%2)*10;
   w.enemies[id]??={id,name:def.count>=4?(i===0?'Heath captain':'Heath reaver'):def.id==='woodcutters'?'Ransom deserter':def.id==='poachers'?'Hollow poacher':'Frontier outlaw',bountyId:def.id,position:p,home:[...p],yaw:0,health:maxHealth,maxHealth,stamina:100,equipped:i%2?'sword':'axe',phase:'patrol',decisionAt:0,rewarded:false};
  });
  const id='bounty-cache-'+def.id;w.containers[id]??={id,name:def.name+' · reward chest',position:[...site.position],inventory:[],looted:false};
 }
 refreshWildMostWanted(w);
}
export function bountyObjective(w:WorldState,p:PlayerState){
 if(p.bounties?.active===WILD_BOUNTY_ID){const target=p.bounties.activeAnimal?w.animals?.[p.bounties.activeAnimal]:refreshWildMostWanted(w);if(!target)return;const reward=animalBountyCrowns(target);return {title:`WANTED · ${animalDisplayName(target).toUpperCase()}`,text:target.dead?`Bounty resolved · ${reward} crowns recorded`:`Hunt the wanted ${target.kind} · notoriety ${(target.notoriety??0).toFixed(0)} · ${reward} crown bounty`,position:target.position};}
 const site=p.bounties?.active?w.bountySites?.[p.bounties.active]:undefined;if(!site)return;
 const remaining=site.enemies.filter(id=>w.enemies[id]?.health>0).length;
 return {title:site.name.toUpperCase(),text:remaining?`Defeat ${remaining} ${remaining===1?'outlaw':'outlaws'} · hold LMB to chain attacks`:'Camp cleared · E at the reward chest',position:site.position};
}
export function bountyCommand(w:WorldState,p:PlayerState,action:'accept'|'claim',id:string){
 const progress=p.bounties??={completed:[]};p.bounties=progress;progress.completedAnimals??=[];
 if(id===WILD_BOUNTY_ID){const target=action==='accept'?mostWanted(w.animals??{}).find(a=>!a.dead&&!a.bountyClaimed):progress.activeAnimal?w.animals?.[progress.activeAnimal]:undefined;if(!target)return {ok:false,message:'No animal has committed enough nonsense to make the Wild Most Wanted board.'};if(action==='accept'){p.frontierTarget=undefined;progress.active=WILD_BOUNTY_ID;progress.activeAnimal=target.id;refreshWildMostWanted(w);return {ok:true,message:`WANTED · ${animalDisplayName(target)} · ${animalBountyCrowns(target)} crowns. Follow the HUD bearing.`};}return {ok:false,message:'Wanted-beast bounties pay automatically when you bring down the tracked animal.'};}
 const def=BOUNTIES.find(b=>b.id===id),site=w.bountySites?.[id];
 if(!def||!site)return {ok:false,message:'No clear campsite is available for this bounty.'};
 if(progress.completed.includes(id))return {ok:false,message:'You already collected this bounty.'};
 if(action==='accept'){p.frontierTarget=undefined;progress.active=id;progress.activeAnimal=undefined;return {ok:true,message:def.name+' tracked · follow the HUD bearing. Q eats provisions.'};}
 if(progress.active!==id)return {ok:false,message:'Track this bounty in your journal first · J'};
 if(dist(p.position,site.position)>2.5)return {ok:false,message:'Stand beside the bounty chest.'};
 if(site.enemies.some(e=>!w.enemies[e]||w.enemies[e].health>0))return {ok:false,message:'Defeat every defender before claiming the reward.'};
 if(def.starterBlade){if(!quantity(p,'sword')&&!quantity(p,'fine_sword'))addItem(w,p,'sword',1);else addItem(w,p,'iron',4);}
 for(const [item,count] of Object.entries(def.items))if(count)addItem(w,p,item as ItemId,count);
 progress.completed.push(id);progress.active=undefined;w.containers['bounty-cache-'+id].looted=true;
 return {ok:true,message:'BOUNTY COMPLETE · '+def.reward+' · J for another contract'};
}
