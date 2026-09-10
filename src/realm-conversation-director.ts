import {SimulatedPlayerPopulation} from './simulated-players';
import type {PlayerState,WorldState} from './state';
import {AMBIENT_CHAT_THREADS,CALLBACK_INTERJECTIONS,CONTEXT_CHAT_SCENES,PLAYER_TOPIC_INTERJECTIONS,RARE_CHAT_SCENES,type RealmChatBotId,type RealmChatFact,type RealmChatInterjection,type RealmChatScene,type RealmChatTopic} from './realm-chat-scenes';

const BOT_PREFIX='player-bot-';
const marker=Symbol.for('alderwatch.realm-conversation-director.v1');
const EVENT_FACTS=new Set<RealmChatFact>(['structure-added','animal-kill','iron-gain','food-gain','hide-gain']);
const FOOD_RX=/(meat|stew|broth|roast|pottage|platter|grill|berries|honey|mushroom|tonic|tenderloin|rack|rib|loin|saddle|breast)$/;

type BotRuntimeLike={definition:{id:string;name:string};player:PlayerState;group:{visible:boolean};index:number};
type TopicMemory={topic:Exclude<RealmChatTopic,'misc'>;name:string;at:number};
type Snapshot={structures:number;deadAnimals:number;iron:number;food:number;hide:number;health:number};
type DirectorState={nextContext:number;nextThread:number;sequence:number;snapshot:Snapshot;pending:Map<RealmChatFact,number>;lastScene:Map<string,number>;recentLines:Map<string,number>;topics:TopicMemory[];once:Set<string>;emitting:boolean;lastSpeaker?:string};

const states=new WeakMap<SimulatedPlayerPopulation,DirectorState>();

function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function choose<T>(xs:readonly T[],seed:string){return xs[hash(seed)%xs.length]!;}
function human(world:WorldState){return Object.values(world.players).find(p=>!p.id.startsWith(BOT_PREFIX));}
function bots(pop:SimulatedPlayerPopulation){return pop.runtimes as unknown as BotRuntimeLike[];}
function distanceXZ(a:[number,number,number],b:[number,number,number]){return Math.hypot(a[0]-b[0],a[2]-b[2]);}
function itemCount(p:PlayerState,predicate:(id:string)=>boolean){return p.inventory.reduce((n,s)=>n+(predicate(s.item)?s.count:0),0);}
function snapshot(world:WorldState,p:PlayerState):Snapshot{return {structures:Object.keys(world.structures).length,deadAnimals:Object.values(world.animals??{}).filter(a=>(a as any).dead).length,iron:itemCount(p,id=>id==='iron'),food:itemCount(p,id=>FOOD_RX.test(id)),hide:itemCount(p,id=>id==='hide'),health:p.health};}
function onceKey(world:WorldState){return `alderwatch.realm-chat-director.${world.worldSeed??'preview'}.v1`;}
function loadOnce(world:WorldState){try{return new Set<string>(JSON.parse(localStorage.getItem(onceKey(world))||'[]'));}catch{return new Set<string>();}}
function persistOnce(world:WorldState,d:DirectorState){try{localStorage.setItem(onceKey(world),JSON.stringify([...d.once]));}catch{}}
function ensure(pop:SimulatedPlayerPopulation,time=0){let d=states.get(pop);if(d)return d;const p=human(pop.state);d={nextContext:time+4,nextThread:time+24+hash(String(pop.state.worldSeed))%14,sequence:0,snapshot:p?snapshot(pop.state,p):{structures:0,deadAnimals:0,iron:0,food:0,hide:0,health:100},pending:new Map(),lastScene:new Map(),recentLines:new Map(),topics:[],once:loadOnce(pop.state),emitting:false};states.set(pop,d);return d;}

export function classifyRealmChatTopic(text:string):RealmChatTopic{
 const m=text.toLowerCase();
 if(/\bbear(s)?\b/.test(m))return 'bear';
 if(/\b(wolf|wolves|pack)\b/.test(m))return 'wolves';
 if(/\bbison\b/.test(m))return 'bison';
 if(/\b(build|building|base|camp|house|wall|roof|door|foundation|beam|chest|storage)\b/.test(m))return 'build';
 if(/\b(trade|buy|sell|price|market|crowns|deal|wts|wtb)\b/.test(m))return 'trade';
 if(/\b(food|eat|hungry|stew|meat|berries|honey|cook|meal)\b/.test(m))return 'food';
 if(/\biron\b/.test(m))return 'iron';
 if(/\b(road|path|trail|route|ridge|where am i|lost)\b/.test(m))return 'road';
 if(/\b(fight|fighting|attack|aggro|hit|dodge|block|killed|dead|combat)\b/.test(m))return 'combat';
 if(/\b(weird|strange|wtf|fog|crow|mushroom|haunted|cursed|glitch|theory)\b/.test(m))return 'weird';
 if(/\b(help|anyone|somebody|need you|come here|save me)\b/.test(m))return 'help';
 return 'misc';
}

export function realmChatLineKey(speakerId:string,text:string){return `${speakerId}:${text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}`;}
export function realmChatRepeatCooldownMs(text:string){const n=text.trim().length;return n<=4?35_000:n<=12?90_000:420_000;}

export function scoreRealmChatScene(scene:RealmChatScene,facts:ReadonlySet<RealmChatFact>,now:number,lastAt=-Infinity,seenOnce=false){
 if(scene.once&&seenOnce)return -Infinity;
 if(now-lastAt<scene.cooldown)return -Infinity;
 if(scene.requires?.some(f=>!facts.has(f)))return -Infinity;
 if(scene.any?.length&&!scene.any.some(f=>facts.has(f)))return -Infinity;
 const required=scene.requires?.length??0,optional=scene.any?.filter(f=>facts.has(f)).length??0;
 return scene.priority+required*14+optional*5;
}

export function pickRealmChatScene(scenes:readonly RealmChatScene[],facts:ReadonlySet<RealmChatFact>,now:number,lastScene:ReadonlyMap<string,number>,seenOnce:ReadonlySet<string>,seed:string){
 const eligible=scenes.map(scene=>({scene,score:scoreRealmChatScene(scene,facts,now,lastScene.get(scene.id),seenOnce.has(scene.id))})).filter(x=>Number.isFinite(x.score));
 if(!eligible.length)return undefined;const best=Math.max(...eligible.map(x=>x.score)),band=eligible.filter(x=>x.score>=best-7);return choose(band,seed).scene;
}

function observeEvents(pop:SimulatedPlayerPopulation,d:DirectorState,time:number,p:PlayerState){
 const next=snapshot(pop.state,p),prev=d.snapshot;
 if(next.structures>prev.structures)d.pending.set('structure-added',time+9);
 if(next.deadAnimals>prev.deadAnimals)d.pending.set('animal-kill',time+9);
 if(next.iron>prev.iron)d.pending.set('iron-gain',time+10);
 if(next.food>prev.food)d.pending.set('food-gain',time+10);
 if(next.hide>prev.hide)d.pending.set('hide-gain',time+10);
 d.snapshot=next;
 for(const [fact,until] of d.pending)if(until<time)d.pending.delete(fact);
}

export function realmChatFacts(world:WorldState,p:PlayerState,pending:ReadonlyMap<RealmChatFact,number>=new Map(),time=0){
 const facts=new Set<RealmChatFact>();
 const nearbyAnimals=Object.values(world.animals??{}).filter(a=>!(a as any).dead&&distanceXZ((a as any).position,p.position)<28);
 if(nearbyAnimals.some(a=>(a as any).kind==='bear'&&distanceXZ((a as any).position,p.position)<23))facts.add('bear-near');
 if(nearbyAnimals.filter(a=>(a as any).kind==='wolf'&&distanceXZ((a as any).position,p.position)<25).length>=2)facts.add('wolf-pack');
 if(nearbyAnimals.some(a=>(a as any).kind==='bison'&&distanceXZ((a as any).position,p.position)<27))facts.add('bison-near');
 if(Object.values(world.enemies).some(e=>e.phase!=='dead'&&distanceXZ(e.position,p.position)<28))facts.add('enemy-near');
 if(p.health<42)facts.add('low-health');if(p.stamina<26)facts.add('low-stamina');
 if(Math.hypot(p.position[0],p.position[2]+38)>78)facts.add('far-out');
 if(p.combat&&p.combat.kind!=='idle'&&p.combat.kind!=='death')facts.add('combat');
 for(const [fact,until] of pending)if(until>=time)facts.add(fact);
 return facts;
}

function online(pop:SimulatedPlayerPopulation,id:RealmChatBotId){return bots(pop).find(r=>r.definition.id===id&&r.group.visible);}
function pickSpeaker(pop:SimulatedPlayerPopulation,ids:readonly RealmChatBotId[],seed:string,avoid?:string){const possible=ids.map(id=>online(pop,id)).filter((x):x is BotRuntimeLike=>Boolean(x));if(!possible.length)return undefined;const fresh=possible.filter(r=>r.definition.id!==avoid);return choose(fresh.length?fresh:possible,seed);}
function hasSpeakers(pop:SimulatedPlayerPopulation,scene:RealmChatScene){return scene.beats.every((beat,i)=>Boolean(pickSpeaker(pop,beat.speakers,scene.id+':availability:'+i)));}
function dangerous(pop:SimulatedPlayerPopulation){const p=human(pop.state);if(!p)return false;const f=realmChatFacts(pop.state,p);return f.has('combat')||f.has('enemy-near')||f.has('bear-near')||f.has('wolf-pack');}

function render(text:string,vars:Record<string,string>){let out=text;for(const [k,v] of Object.entries(vars))out=out.replaceAll(`{${k}}`,v);return out;}
function appendDirected(pop:SimulatedPlayerPopulation,d:DirectorState,r:BotRuntimeLike,text:string){d.emitting=true;try{(pop as any).append({speakerId:r.player.id,name:r.definition.name,text,at:Date.now()});d.lastSpeaker=r.definition.id;}finally{d.emitting=false;}}

function emitScene(pop:SimulatedPlayerPopulation,d:DirectorState,scene:RealmChatScene,time:number,interruptible:boolean){
 d.lastScene.set(scene.id,time);if(scene.once){d.once.add(scene.id);persistOnce(pop.state,d);}d.sequence++;
 let elapsed=0,previous:string|undefined;
 scene.beats.forEach((beat,index)=>{const [lo,hi]=beat.delay??[550,1200];if(index)elapsed+=lo+hash(`${scene.id}:${d.sequence}:${index}`)%Math.max(1,hi-lo+1);const delay=elapsed;
  window.setTimeout(()=>{if(interruptible&&index>0&&dangerous(pop))return;const r=pickSpeaker(pop,beat.speakers,`${scene.id}:${d.sequence}:speaker:${index}`,previous);if(!r)return;const text=choose(beat.lines,`${scene.id}:${d.sequence}:line:${index}`);appendDirected(pop,d,r,text);previous=r.definition.id;},delay);
 });
 for(const f of scene.requires??[])if(EVENT_FACTS.has(f))d.pending.delete(f);
}

function emitInterjection(pop:SimulatedPlayerPopulation,d:DirectorState,item:RealmChatInterjection,seed:string,vars:Record<string,string>={}){const r=pickSpeaker(pop,item.speakers,seed,d.lastSpeaker);if(!r)return false;appendDirected(pop,d,r,render(choose(item.lines,seed+':line'),vars));return true;}

function contextPulse(pop:SimulatedPlayerPopulation,d:DirectorState,time:number,p:PlayerState){
 if(time<d.nextContext)return;d.nextContext=time+4;const facts=realmChatFacts(pop.state,p,d.pending,time);if(!facts.size)return;
 const scene=pickRealmChatScene(CONTEXT_CHAT_SCENES,facts,time,d.lastScene,d.once,`${pop.state.worldSeed}:${d.sequence}:context:${Math.floor(time/4)}`);if(!scene||!hasSpeakers(pop,scene))return;
 const hasEvent=(scene.requires??[]).some(f=>EVENT_FACTS.has(f));if(!hasEvent&&hash(`${scene.id}:${Math.floor(time/4)}`)%100>=32)return;
 emitScene(pop,d,scene,time,false);
}

function callbackPulse(pop:SimulatedPlayerPopulation,d:DirectorState,time:number){
 const now=Date.now(),candidates=d.topics.filter(t=>now-t.at>35_000&&now-t.at<260_000);if(!candidates.length||hash(`${d.sequence}:${Math.floor(time/20)}:callback`)%100>=38)return false;
 const memory=choose(candidates,`${pop.state.worldSeed}:${d.sequence}:memory`),bank=CALLBACK_INTERJECTIONS[memory.topic];if(!bank?.length)return false;
 const item=choose(bank,`${memory.topic}:${d.sequence}:callback`);return emitInterjection(pop,d,item,`${memory.topic}:${d.sequence}:emit`,{a:memory.name});
}

function threadPulse(pop:SimulatedPlayerPopulation,d:DirectorState,time:number){
 if(time<d.nextThread)return;d.nextThread=time+48+hash(`${d.sequence}:thread-gap`)%38;if(document.visibilityState==='hidden'||!document.querySelector('.hotbar'))return;if(dangerous(pop)){d.nextThread=time+16;return;}
 if(callbackPulse(pop,d,time)){d.sequence++;return;}
 const rareRoll=hash(`${pop.state.worldSeed}:${d.sequence}:rare`)%29===0;
 const pool=rareRoll?RARE_CHAT_SCENES:AMBIENT_CHAT_THREADS,facts=new Set<RealmChatFact>();
 const eligible=pool.filter(scene=>Number.isFinite(scoreRealmChatScene(scene,facts,time,d.lastScene.get(scene.id),d.once.has(scene.id)))&&hasSpeakers(pop,scene));if(!eligible.length)return;
 const scene=choose(eligible,`${pop.state.worldSeed}:${d.sequence}:${rareRoll?'rare':'thread'}`);emitScene(pop,d,scene,time,true);
}

function rememberTopic(d:DirectorState,name:string,text:string,at:number){const topic=classifyRealmChatTopic(text);if(topic==='misc')return;d.topics.push({topic,name,at});d.topics=d.topics.slice(-24);}
function directedMessage(text:string){return /(^|\s)@[a-z0-9_.]+/i.test(text);}
function shouldPileOn(text:string,topic:RealmChatTopic){if(topic==='misc'||directedMessage(text))return false;const broad=/\b(anyone|everybody|chat|guys|yall|y'all|somebody)\b/i.test(text);return hash(text+':pileon')%100<(broad?82:44);}

function playerPileOn(pop:SimulatedPlayerPopulation,d:DirectorState,text:string){const topic=classifyRealmChatTopic(text),bank=PLAYER_TOPIC_INTERJECTIONS[topic];if(!bank?.length||!shouldPileOn(text,topic))return;const delay=2800+hash(text+':pile-delay')%2400;window.setTimeout(()=>{if(dangerous(pop)&&!['bear','wolves','bison','combat','help'].includes(topic))return;const options=bank.filter(item=>item.speakers.some(id=>online(pop,id)));if(!options.length)return;emitInterjection(pop,d,choose(options,`${text}:${d.sequence}:pile`),`${text}:${d.sequence}:pile-emit`);},delay);}

function install(){
 const g=globalThis as any;if(g[marker])return;g[marker]=true;const proto=SimulatedPlayerPopulation.prototype as any,originalUpdate=proto.update,originalAppend=proto.append,originalSend=proto.sendPlayerChat,originalDispose=proto.dispose;
 proto.append=function(this:SimulatedPlayerPopulation,message:{speakerId:string;name:string;text:string;at:number;human?:boolean}){const d=ensure(this),isBot=message.speakerId?.startsWith(BOT_PREFIX);if(isBot){const key=realmChatLineKey(message.speakerId,message.text),last=d.recentLines.get(key)??-Infinity,now=message.at||Date.now();if(now-last<realmChatRepeatCooldownMs(message.text))return;d.recentLines.set(key,now);if(d.recentLines.size>320){for(const [k,t] of d.recentLines)if(now-t>600_000)d.recentLines.delete(k);}}const out=originalAppend.call(this,message);if(!d.emitting&&(message.human||isBot))rememberTopic(d,message.name,message.text,message.at||Date.now());return out;};
 proto.sendPlayerChat=function(this:SimulatedPlayerPopulation,text:string){const d=ensure(this),out=originalSend.call(this,text);playerPileOn(this,d,text);return out;};
 proto.update=function(this:SimulatedPlayerPopulation,time:number){const out=originalUpdate.call(this,time),p=human(this.state);if(!p)return out;const d=ensure(this,time);observeEvents(this,d,time,p);contextPulse(this,d,time,p);threadPulse(this,d,time);return out;};
 proto.dispose=function(this:SimulatedPlayerPopulation){states.delete(this);return originalDispose.call(this);};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')install();
