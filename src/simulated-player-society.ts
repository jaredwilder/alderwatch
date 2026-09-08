import {SimulatedPlayerPopulation} from './simulated-players';
import type {ForageState,PlayerState,WorldState} from './state';

type Relation={score:number;encounters:number;last:string};
type Presence={online:boolean;nextAt:number;sessions:number};
type Errand={kind:'forage';forageId:string;startedAt:number};
type SocietySave={relations:Record<string,Relation>;presence:Record<string,Presence>;errands:Record<string,Errand>;eventCounter:number};
type BotRuntimeLike={definition:{id:string;name:string};player:PlayerState;memory:{mode:string;affinity:number;target?:[number,number]};group:{visible:boolean};index:number};

const BOT_PREFIX='player-bot-';
const marker=Symbol.for('alderwatch.simulated-player-society.v2');
const saves=new WeakMap<SimulatedPlayerPopulation,SocietySave>();
const clocks=new WeakMap<SimulatedPlayerPopulation,{nextSocial:number;nextPresence:number;nextErrand:number}>();

function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function choose<T>(xs:readonly T[],seed:string){return xs[hash(seed)%xs.length]!;}
function clamp(v:number,a:number,b:number){return Math.max(a,Math.min(b,v));}
function key(world:WorldState){return `alderwatch.playerbots.${world.worldSeed??'preview'}.society.v2`;}
function safeLoad(world:WorldState):SocietySave{try{const raw=localStorage.getItem(key(world));if(raw)return JSON.parse(raw) as SocietySave;}catch{}return {relations:{},presence:{},errands:{},eventCounter:0};}
function persist(pop:SimulatedPlayerPopulation,s:SocietySave){try{localStorage.setItem(key(pop.state),JSON.stringify(s));}catch{}}
function relationKey(a:string,b:string){return [a,b].sort().join('|');}
function append(pop:SimulatedPlayerPopulation,name:string,speakerId:string,text:string){(pop as any).append({speakerId,name,text,at:Date.now()});}
function systemLine(pop:SimulatedPlayerPopulation,text:string){(pop as any).append({speakerId:'realm-system',name:'realm',text,at:Date.now()});}
function authority(pop:SimulatedPlayerPopulation){return (pop as any).authority as {dispatch:(c:any)=>{ok:boolean;message:string}};}
function human(world:WorldState){return Object.values(world.players).find(p=>!p.id.startsWith(BOT_PREFIX));}
function idFromSpeaker(speakerId:string){return speakerId.startsWith(BOT_PREFIX)?speakerId.slice(BOT_PREFIX.length):undefined;}

export function socialTone(score:number):'nemesis'|'hostile'|'wary'|'neutral'|'friend'|'ride-or-die'{return score<=-6?'nemesis':score<=-2?'hostile':score<1?'wary':score<4?'neutral':score<8?'friend':'ride-or-die';}
export function chatAffinityDelta(message:string){const m=message.toLowerCase();let n=0;if(/\b(thanks|thank you|ty|nice|good job|gg|love you|legend|goat)\b/.test(m))n+=.45;if(/\b(stupid|idiot|trash|useless|shut up|hate you|moron|garbage)\b/.test(m))n-=.8;if(/\b(fuck you|screw you|go away)\b/.test(m))n-=1.1;return clamp(n,-1.5,.75);}
export function shouldCooperate(affinity:number,seed:number){if(affinity>=4)return true;if(affinity<=-5)return seed%5===0;if(affinity<=-2)return seed%3===0;return seed%5!==0;}

const SOCIAL_LINES={
 friendly:['yo {b} come with me','{b} you still need wood?','{b} that last run was actually clean','im heading out. {b} you coming?'],
 hostile:['{b} dont touch my chest','{b} i am begging you to stop building','not grouping with {b} again lmao','{b} somehow makes wolves look coordinated'],
 weird:['{b} the road is making that noise again','{b} quick question. do deer have unions','{b} i found a rock with bad energy','{b} dont ask why i need six mushrooms'],
 trade:['{b} i have wood if youve got stone','{b} trade? actual trade not your scam from last time','buying hide. {b} dont make this weird'],
};

function socialLine(a:BotRuntimeLike,b:BotRuntimeLike,score:number,counter:number){const tone=socialTone(score),pool=a.definition.id==='laggoblin'?SOCIAL_LINES.weird:a.definition.id==='toast'?SOCIAL_LINES.trade:tone==='friend'||tone==='ride-or-die'?SOCIAL_LINES.friendly:tone==='hostile'||tone==='nemesis'?SOCIAL_LINES.hostile:counter%3===0?SOCIAL_LINES.friendly:SOCIAL_LINES.trade;return choose(pool,`${a.definition.id}:${b.definition.id}:${counter}`).replaceAll('{b}',b.definition.name);}
function replyLine(b:BotRuntimeLike,score:number,counter:number){if(score<=-3)return choose(['no','absolutely not lol','you first','nah after last time?','muted spiritually'],`${b.definition.id}:hate:${counter}`);if(b.definition.id==='quietfox')return choose(['sure','omw','maybe','yep'],`${b.definition.id}:quiet:${counter}`);if(b.definition.id==='niko77')return choose(['yes i come','ok wait me little','sure lets go','i have some stone'],`${b.definition.id}:niko:${counter}`);return choose(['yeah lol','bet','one sec','im down','sure why not'],`${b.definition.id}:ok:${counter}`);}

function ensurePresence(pop:SimulatedPlayerPopulation,s:SocietySave,time:number){for(const r of pop.runtimes as unknown as BotRuntimeLike[]){s.presence[r.definition.id]??={online:true,nextAt:time+35+hash(r.definition.id)%80,sessions:1};const p=s.presence[r.definition.id]!;r.group.visible=p.online;}}
function setPresence(pop:SimulatedPlayerPopulation,r:BotRuntimeLike,p:Presence,online:boolean,time:number){p.sessions+=online?1:0;p.nextAt=time+(online?55+hash(r.definition.id+':on:'+p.sessions)%115:18+hash(r.definition.id+':off:'+p.sessions)%55);if(online){p.online=true;r.group.visible=true;append(pop,r.definition.name,r.player.id,choose(['yo','im back','sup','what did i miss','alright im on'],r.definition.id+':login:'+p.sessions));}else{append(pop,r.definition.name,r.player.id,choose(['brb','im off for a bit','later','food. brb','gtg'],r.definition.id+':logout:'+p.sessions));p.online=false;r.group.visible=false;}}
function onlineRuntimes(pop:SimulatedPlayerPopulation,s:SocietySave){return (pop.runtimes as unknown as BotRuntimeLike[]).filter(r=>s.presence[r.definition.id]?.online!==false);}
function updateOnlineLabel(s:SocietySave){const count=Object.values(s.presence).filter(x=>x.online).length+1;const label=document.querySelector('.player-realm-chat header strong');if(label)label.textContent=`${count} online`;}

function updatePresence(pop:SimulatedPlayerPopulation,s:SocietySave,time:number){const c=clocks.get(pop)!;if(time<c.nextPresence)return;c.nextPresence=time+6;ensurePresence(pop,s,time);for(const r of pop.runtimes as unknown as BotRuntimeLike[]){const p=s.presence[r.definition.id]!;if(time<p.nextAt)continue;const onlineCount=Object.values(s.presence).filter(x=>x.online).length;if(p.online&&onlineCount<=3){p.nextAt=time+25;continue;}setPresence(pop,r,p,!p.online,time);break;}updateOnlineLabel(s);persist(pop,s);}

function updateSocial(pop:SimulatedPlayerPopulation,s:SocietySave,time:number){const c=clocks.get(pop)!;if(time<c.nextSocial)return;c.nextSocial=time+17+hash(String(s.eventCounter))%24;const online=onlineRuntimes(pop,s);if(online.length<2)return;const a=online[s.eventCounter%online.length]!,b=online[(s.eventCounter*3+2)%online.length]!;s.eventCounter++;if(a===b)return;const k=relationKey(a.definition.id,b.definition.id),rel=s.relations[k]??={score:0,encounters:0,last:''};rel.encounters++;const chemistry=((hash(k+':'+rel.encounters)%200)-100)/100;rel.score=clamp(rel.score+chemistry*.34,-10,10);rel.last=chemistry>.35?'good run':chemistry<-.35?'argument':'chatted';s.relations[k]=rel;append(pop,a.definition.name,a.player.id,socialLine(a,b,rel.score,s.eventCounter));const response=replyLine(b,rel.score,s.eventCounter);setTimeout(()=>{if(s.presence[b.definition.id]?.online??true)append(pop,b.definition.name,b.player.id,response);},900+hash(k+':delay:'+rel.encounters)%2300);if(rel.score>3&&hash(k+':meet:'+rel.encounters)%3===0){b.memory.mode='come';b.memory.target=[a.player.position[0],a.player.position[2]];}persist(pop,s);}

function forageCandidates(world:WorldState,p:PlayerState){return Object.values(world.forage).filter(f=>!f.harvested&&Math.hypot(f.position[0]-p.position[0],f.position[2]-p.position[2])<24).sort((a,b)=>Math.hypot(a.position[0]-p.position[0],a.position[2]-p.position[2])-Math.hypot(b.position[0]-p.position[0],b.position[2]-p.position[2]));}
function startErrand(pop:SimulatedPlayerPopulation,s:SocietySave,r:BotRuntimeLike,time:number,f:ForageState){s.errands[r.definition.id]={kind:'forage',forageId:f.id,startedAt:time};r.memory.mode='come';r.memory.target=[f.position[0],f.position[2]];append(pop,r.definition.name,r.player.id,choose([`grabbing ${f.kind??'fiber'} brb`,`i see some ${f.kind??'fiber'}. mine`,`need mats. one sec`,`going gathering for a minute`],r.definition.id+':errand:'+f.id));}
function updateErrands(pop:SimulatedPlayerPopulation,s:SocietySave,time:number){const c=clocks.get(pop)!;for(const r of pop.runtimes as unknown as BotRuntimeLike[]){const e=s.errands[r.definition.id];if(!e)continue;if(s.presence[r.definition.id]?.online===false)continue;const f=pop.state.forage[e.forageId];if(!f||f.harvested){delete s.errands[r.definition.id];r.memory.mode='wander';continue;}if(Math.hypot(f.position[0]-r.player.position[0],f.position[2]-r.player.position[2])<2.05){const out=authority(pop).dispatch({type:'forage',playerId:r.player.id,forageId:f.id});append(pop,r.definition.name,r.player.id,out.ok?choose(['got it','easy','mats secured','yoink'],r.definition.id+':got:'+f.id):`lol ${out.message.toLowerCase()}`);delete s.errands[r.definition.id];r.memory.mode='wander';persist(pop,s);}}
 if(time<c.nextErrand)return;c.nextErrand=time+22+hash('errand:'+s.eventCounter)%28;const available=onlineRuntimes(pop,s).filter(r=>!s.errands[r.definition.id]&&r.memory.mode==='wander');if(!available.length)return;const r=available[hash(String(s.eventCounter)+':worker')%available.length]!,candidate=forageCandidates(pop.state,r.player)[0];if(candidate&&hash(candidate.id+':'+s.eventCounter)%4!==0){startErrand(pop,s,r,time,candidate);persist(pop,s);}}

function namedTarget(pop:SimulatedPlayerPopulation,text:string){const normalized=text.toLowerCase().replace(/[^a-z0-9_@.]+/g,' ');return (pop.runtimes as unknown as BotRuntimeLike[]).find(r=>{const aliases=[r.definition.id,r.definition.name.toLowerCase(),r.definition.name.toLowerCase().replace(/[^a-z0-9_]/g,'')];return aliases.some(a=>normalized.includes('@'+a)||normalized.startsWith(a+' '));});}
function refusal(r:BotRuntimeLike,action:string,counter:number){return choose(r.definition.id==='vex'?['no lol','absolutely not','earn it','nah. terrible plan']:['nah im good','not right now','lol no','youre on your own for that one'],`${r.definition.id}:refuse:${action}:${counter}`);}

function install(){
 const g=globalThis as any;if(g[marker])return;g[marker]=true;const proto=SimulatedPlayerPopulation.prototype as any,originalUpdate=proto.update,originalSend=proto.sendPlayerChat,originalAppend=proto.append,originalApply=proto.applyAction;
 proto.append=function(this:SimulatedPlayerPopulation,message:{speakerId:string}){const s=saves.get(this),id=idFromSpeaker(message.speakerId);if(id&&s?.presence[id]?.online===false)return;return originalAppend.call(this,message);};
 proto.update=function(this:SimulatedPlayerPopulation,time:number){const out=originalUpdate.call(this,time);let s=saves.get(this);if(!s){s=safeLoad(this.state);saves.set(this,s);clocks.set(this,{nextSocial:time+12,nextPresence:time+5,nextErrand:time+18});ensurePresence(this,s,time);}updatePresence(this,s,time);updateSocial(this,s,time);updateErrands(this,s,time);return out;};
 proto.sendPlayerChat=function(this:SimulatedPlayerPopulation,text:string){let s=saves.get(this);if(!s){s=safeLoad(this.state);saves.set(this,s);clocks.set(this,{nextSocial:10,nextPresence:5,nextErrand:18});ensurePresence(this,s,0);}if(/\b(who'?s|who is|whos) online\b|^\/who\b/i.test(text)){const names=onlineRuntimes(this,s).map(r=>r.definition.name);systemLine(this,`${names.join(', ')} and you`);return;}const target=namedTarget(this,text);if(target&&s.presence[target.definition.id]?.online===false){systemLine(this,`${target.definition.name} is offline.`);return;}if(target){const d=chatAffinityDelta(text);target.memory.affinity=clamp(target.memory.affinity+d,-10,10);const h=human(this.state);if(h){const k=relationKey(target.definition.id,'human'),rel=s.relations[k]??={score:0,encounters:0,last:''};rel.score=clamp(rel.score+d,-10,10);rel.last=d>0?'player was kind':d<0?'player insulted them':'chat';rel.encounters++;s.relations[k]=rel;}persist(this,s);}return originalSend.call(this,text);};
 proto.applyAction=function(this:SimulatedPlayerPopulation,r:BotRuntimeLike,action:string,h:PlayerState){const s=saves.get(this);if(s&&['follow','come','build','build_here'].includes(action)){const seed=hash(`${r.definition.id}:${action}:${s.eventCounter}:${Math.floor(Date.now()/5000)}`);if(!shouldCooperate(r.memory.affinity,seed)){append(this,r.definition.name,r.player.id,refusal(r,action,s.eventCounter));r.memory.affinity=clamp(r.memory.affinity-.08,-10,10);persist(this,s);return;}}return originalApply.call(this,r,action,h);};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')install();
