import {SimulatedPlayerPopulation} from './simulated-players';
import {areaWard,promoteCanonicalEvent,type CanonSource} from './provenance-frontier';
import {applyRealmConsequences} from './realm-consequences';
import type {SocialChannel} from './social-separator';
import type {PlayerState} from './state';

const marker=Symbol.for('alderwatch.canon-social-bridge.v1');
const BOT_PREFIX='player-bot-';
type Message={speakerId:string;name:string;text:string;at:number;human?:boolean};
type AreaPlayer=PlayerState&{areaId?:string};

function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function sourceFor(id:string):CanonSource{return id.startsWith(BOT_PREFIX)?'simulated-player':id.startsWith('npc-')||id.startsWith('npc:')?'npc':id==='realm-system'?'world':'player';}
export function socialChannelForText(text:string):SocialChannel{const s=text.toLowerCase();if(/fight|attack|danger|wolf|bear|giant|outlaw|bounty|crime|hate|idiot|grudge|betray/.test(s))return 'watch';if(/trade|market|price|crowns|buy|sell|wood|stone|ore|supply/.test(s))return 'market';if(/build|roof|wall|house|craft|mine|forge|work|guild/.test(s))return 'guild';return 'kin';}
export function canonWorthySocialText(text:string){return /danger|attack|giant|outlaw|bounty|crime|grudge|betray|marry|married|birth|child|migrat|leader|chief|seal|built|build here|trade|market|price|rare|truffle|boss|killed|saved|hate you|love you|fight/i.test(text);}
function human(pop:SimulatedPlayerPopulation){return Object.values(pop.state.players).find(p=>!p.id.startsWith(BOT_PREFIX));}
function actorWard(pop:SimulatedPlayerPopulation,speakerId:string){const p=pop.state.players[speakerId] as AreaPlayer|undefined;return areaWard(p?.areaId??(human(pop) as AreaPlayer|undefined)?.areaId);}
function promoteMessage(pop:SimulatedPlayerPopulation,m:Message,keyPrefix:string){if(!canonWorthySocialText(m.text))return;const source=sourceFor(m.speakerId),actorId=m.speakerId,actorName=m.name||m.speakerId,ward=actorWard(pop,m.speakerId),key=`${keyPrefix}:${m.speakerId}:${m.at}:${hash(m.text)}`;promoteCanonicalEvent(pop.state,{source,actorId,actorName,ward,channel:socialChannelForText(m.text),externalKey:key,summary:`${actorName}: “${m.text.slice(0,180)}” — the statement became consequential enough to enter realm memory.`});applyRealmConsequences(pop.state);}

function scanNpcNetwork(pop:SimulatedPlayerPopulation,seen:Set<string>){let promoted=false;for(const line of Array.from(document.querySelectorAll<HTMLElement>('.realm-channel-npc .npc-network-line')).slice(-24)){const name=line.querySelector('b')?.textContent?.trim()??'Unknown',text=line.querySelector('span')?.textContent?.trim()??'';if(!text)continue;const sig=`${name}|${text}`;if(seen.has(sig))continue;seen.add(sig);if(seen.size>160)seen.delete(seen.values().next().value!);if(!canonWorthySocialText(text))continue;const humanLine=line.classList.contains('human'),p=human(pop),actorId=humanLine?(p?.id??'player'):`npc:${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,source:CanonSource=humanLine?'player':'npc';promoteCanonicalEvent(pop.state,{source,actorId,actorName:humanLine?(p?.name??name):name,ward:areaWard((p as AreaPlayer|undefined)?.areaId),channel:socialChannelForText(text),externalKey:`npc-chat:${hash(sig)}`,summary:`${humanLine?(p?.name??name):name} put this into the NPC relay: “${text.slice(0,180)}”. It now has an exact causal source.`});promoted=true;}if(promoted)applyRealmConsequences(pop.state);}

function install(){
 const g=globalThis as any;if(g[marker])return;g[marker]=true;const proto=SimulatedPlayerPopulation.prototype as any,originalAppend=proto.append,originalUpdate=proto.update;const seen=new WeakMap<SimulatedPlayerPopulation,Set<string>>();
 proto.append=function(this:SimulatedPlayerPopulation,message:Message){const out=originalAppend.call(this,message);try{promoteMessage(this,message,'world-chat');}catch(error){console.warn('Alderwatch canon chat bridge skipped message',error);}return out;};
 proto.update=function(this:SimulatedPlayerPopulation,time:number){const out=originalUpdate.call(this,time);let set=seen.get(this);if(!set){set=new Set;seen.set(this,set);}try{scanNpcNetwork(this,set);}catch(error){console.warn('Alderwatch NPC canon bridge skipped scan',error);}return out;};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')install();
