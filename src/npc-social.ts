import type {PlayerState,WorldState} from './state';
import type {NpcRuntime} from './npcs';
import {ambientNpcExchange,personaFor} from './npc-dialogue';
import {ambientNpcTalk} from './npc-chat-client';

type SocietyState={lastBucket:number;relations:Record<string,number>;trades:number;beefs:number;gossip:number};
let pending=false;
function society(world:WorldState):SocietyState{const w=world as WorldState&{npcSociety?:SocietyState};return w.npcSociety??=( {lastBucket:-1,relations:{},trades:0,beefs:0,gossip:0});}
function distanceToPlayer(n:NpcRuntime,p:PlayerState){return Math.hypot(n.group.position.x-p.position[0],n.group.position.z-p.position[2]);}
function feed(kind:string,title:string,text:string){if(typeof document==='undefined')return;let host=document.querySelector<HTMLElement>('.npc-social-feed');if(!host){host=document.createElement('div');host.className='npc-social-feed';document.body.append(host);}const card=document.createElement('div');card.className='npc-social-card '+kind;card.innerHTML='<small></small><strong></strong><span></span>';card.querySelector('small')!.textContent=kind==='trade'?'ALDERBROOK BUSINESS':kind==='beef'?'ALDERBROOK BEEF':'STREET GOSSIP';card.querySelector('strong')!.textContent=title;card.querySelector('span')!.textContent=text;host.prepend(card);while(host.children.length>2)host.lastElementChild?.remove();setTimeout(()=>card.remove(),9000);}
export function updateNpcSocial(runtimes:readonly NpcRuntime[],world:WorldState,time:number){const p=Object.values(world.players)[0];if(!p||runtimes.length<2)return;const s=society(world),bucket=Math.floor(time/34);if(bucket<=s.lastBucket||pending)return;const local=runtimes.filter(n=>distanceToPlayer(n,p)<30);if(local.length<2)return;s.lastBucket=bucket;const a=local[Math.abs(bucket*7+3)%local.length],others=local.filter(n=>n!==a),b=others[Math.abs(bucket*11+5)%others.length];if(!b)return;const exchange=ambientNpcExchange(a.definition.id,b.definition.id,bucket),key=[a.definition.id,b.definition.id].sort().join('|');if(exchange.kind==='trade'){s.trades++;s.relations[key]=(s.relations[key]??0)+.3;}else if(exchange.kind==='beef'){s.beefs++;s.relations[key]=(s.relations[key]??0)-.5;}else{s.gossip++;s.relations[key]=(s.relations[key]??0)+.05;}
 const authored=`${exchange.opener} — ${b.definition.name}: ${exchange.answer}`;feed(exchange.kind,`${a.definition.name} ↔ ${b.definition.name}`,authored);
 pending=true;void ambientNpcTalk(a.definition.id,b.definition.id,exchange.opener,world,p).then(ai=>{if(ai)feed(exchange.kind,`${a.definition.name} ↔ ${b.definition.name}`,ai);}).finally(()=>{pending=false;});
}
export function npcSocietySummary(world:WorldState){const s=society(world);return {trades:s.trades,beefs:s.beefs,gossip:s.gossip,relations:{...s.relations}};}
