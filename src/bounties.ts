import {addItem,quantity,type PlayerState,type WorldState,type Vec3} from './state';
import {height} from './terrain';

export interface BountySite {id:string;name:string;position:Vec3;enemies:string[]}
export interface BountyProgress {active?:string;completed:string[]}
export const BOUNTIES=[
 {id:'woodcutters',name:'The Woodcutters’ Ransom',x:22,z:2,count:1,hint:'A deserter stole the woodcutters’ pay. Defeat him and open his chest.',reward:'Sword (or 4 extra iron if already armed) · 2 grilled venison · 6 iron'},
 {id:'poachers',name:'The Poachers’ Hollow',x:48,z:14,count:2,hint:'Two poachers have taken the eastern hollow. Break their guard and recover the stockpile.',reward:'12 iron · 8 hide · 2 woodland broth'},
] as const;
const dist=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function seedBounties(w:WorldState){
 w.bountySites??={};
 for(const def of BOUNTIES){
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
   const x=site.position[0]+(i?1.7:-1.7),z=site.position[2]-2,p:Vec3=[x,height(x,z)+.02,z];
   w.enemies[id]??={id,name:def.id==='woodcutters'?'Ransom deserter':'Hollow poacher',bountyId:def.id,position:p,home:[...p],yaw:0,health:def.count===1?60:78,maxHealth:def.count===1?60:78,stamina:100,equipped:i?'sword':'axe',phase:'patrol',decisionAt:0,rewarded:false};
  });
  const id='bounty-cache-'+def.id;w.containers[id]??={id,name:def.name+' · reward chest',position:[...site.position],inventory:[],looted:false};
 }
}
export function bountyObjective(w:WorldState,p:PlayerState){
 const site=p.bounties?.active?w.bountySites?.[p.bounties.active]:undefined;if(!site)return;
 const remaining=site.enemies.filter(id=>w.enemies[id]?.health>0).length;
 return {title:site.name.toUpperCase(),text:remaining?`Defeat ${remaining} ${remaining===1?'outlaw':'outlaws'} · hold LMB to chain cuts`:'Camp cleared · E at the reward chest',position:site.position};
}
export function bountyCommand(w:WorldState,p:PlayerState,action:'accept'|'claim',id:string){
 const def=BOUNTIES.find(b=>b.id===id),site=w.bountySites?.[id];
 if(!def||!site)return {ok:false,message:'No clear campsite is available for this bounty.'};
 const progress=p.bounties??={completed:[]};
 if(progress.completed.includes(id))return {ok:false,message:'You already collected this bounty.'};
 if(action==='accept'){p.frontierTarget=undefined;progress.active=id;return {ok:true,message:def.name+' tracked · follow the HUD bearing. Q eats provisions.'};}
 if(progress.active!==id)return {ok:false,message:'Track this bounty in your journal first · J'};
 if(dist(p.position,site.position)>2.5)return {ok:false,message:'Stand beside the bounty chest.'};
 if(site.enemies.some(e=>!w.enemies[e]||w.enemies[e].health>0))return {ok:false,message:'Defeat every defender before claiming the reward.'};
 if(id==='woodcutters'){if(!quantity(p,'sword')&&!quantity(p,'fine_sword'))addItem(w,p,'sword',1);else addItem(w,p,'iron',4);addItem(w,p,'grilled_venison',2);addItem(w,p,'iron',6);}
 else {addItem(w,p,'iron',12);addItem(w,p,'hide',8);addItem(w,p,'woodland_broth',2);}
 progress.completed.push(id);progress.active=undefined;w.containers['bounty-cache-'+id].looted=true;
 return {ok:true,message:'BOUNTY COMPLETE · '+def.reward+' · J for another contract'};
}
