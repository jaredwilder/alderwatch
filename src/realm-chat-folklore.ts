import {SimulatedPlayerPopulation} from './simulated-players';
import type {PlayerState,WorldState} from './state';
import {applyRealmConsequences,atomSequence} from './realm-consequences';
import {ensureRealmHistory,promoteCanonicalEvent,type HistoricalAtom} from './provenance-frontier';
import type {RealmChatBotId} from './realm-chat-scenes';

const BOT_PREFIX='player-bot-';
const marker=Symbol.for('alderwatch.realm-chat-folklore.v1');
const LEDGER_VERSION=1 as const;
const FOLKLORE_CAP=64;
const RECENT_CANON_SCAN=160;

export type RealmFolkloreKind=
 'bear-escape'|'bear-down'|'wolf-escape'|'wolf-down'|'bison-escape'|'bison-down'|'enemy-escape'|'enemy-down'|
 'construction-spree'|'iron-rush'|'craft-spree'|'kill-streak'|'watch-kill'|'bounty'|'expedition'|'rare-find'|
 'realm-grudge'|'realm-succession';

export interface RealmFolklore{
 atomId:string;
 kind:RealmFolkloreKind;
 title:string;
 actorName:string;
 summary:string;
 day:number;
 importance:number;
 target?:string;
}

interface MentionReceipt{firstSeen:number;mentions:number;lastMention:number}
interface FolkloreLedger{version:1;entries:Record<string,MentionReceipt>}
interface BotRuntimeLike{definition:{id:string;name:string};player:PlayerState;group:{visible:boolean}}
interface DangerEpisode{kind:'bear'|'wolf'|'bison'|'enemy';startedTick:number;lastSeenTick:number;startHealth:number;minHealth:number}
interface Gain{tick:number;amount:number}
interface FolkloreRuntime{
 ledger:FolkloreLedger;
 lastSequence:number;
 nextMention:number;
 sequence:number;
 structures:number;
 iron:number;
 danger?:DangerEpisode;
 buildTicks:number[];
 ironGains:Gain[];
 craftTicks:number[];
 killTicks:number[];
 lastBuildLegend:number;
 lastIronLegend:number;
 lastCraftLegend:number;
 lastKillLegend:number;
 lastRecurrence:Record<string,number>;
 disposed:boolean;
}

const runtimes=new WeakMap<SimulatedPlayerPopulation,FolkloreRuntime>();

const TITLE_BANK:Record<RealmFolkloreKind,readonly string[]>={
 'bear-escape':['The Bear Tax','The Fur Audit','The Bear Situation','The Unauthorized Hug','Operation Do Not Pet','The North Road Negotiation'],
 'bear-down':['The Bear Tax Arrears','The Fur Audit Disaster','The Bear Situation','The Unauthorized Hug Incident','Operation Definitely Do Not Pet'],
 'wolf-escape':['The Wolf Committee','The Howling Audit','The Pack Tax','The Bad Dog Summit','The Teeth Meeting','The Wolf Negotiations'],
 'wolf-down':['The Wolf Committee Ruling','The Howling Incident','The Pack Tax Disaster','The Teeth Meeting','The Bad Dog Summit'],
 'bison-escape':['The Meat Locomotive Affair','The Horn Audit','The Moving Wall Incident','The Bison Negotiations','The Hoof Committee'],
 'bison-down':['The Meat Locomotive Incident','The Horn Audit Disaster','The Moving Wall Decision','The Bison Negotiations'],
 'enemy-escape':['The Roadside Audit','The Raider Customer Service Incident','The Sword Committee','The Bad Camp Decision','The Unscheduled PvE Meeting'],
 'enemy-down':['The Roadside Audit Disaster','The Raider Customer Service Incident','The Sword Committee Ruling','The Bad Camp Decision'],
 'construction-spree':['The Housing Bubble','The Wall Era','The Architecture Incident','The Forty-Minute Kingdom','The Beam Economy','The Unlicensed Expansion'],
 'iron-rush':['The Iron Bubble','The Ore Economy','The Anvil Bull Market','The Great Pocket Anvil','The Iron Situation','The Ore Rush Nobody Announced'],
 'craft-spree':['The Workbench Industrial Revolution','The Crafting Shift','The Hammer Economy','The Bench Era','The Production Incident'],
 'kill-streak':['The Raider Recession','The Sword Ledger','The Watch Report','The Hostile NPC Correction','The Extremely Local Extinction Event'],
 'watch-kill':['The {target} Problem','The {target} Business','Operation {target}','The {target} Correction','The {target} Customer Service Case'],
 'bounty':['The Warden Paperwork Speedrun','The Bounty Receipt','The Contract Nobody Read','The Paid Violence Form','The Officially Sanctioned Problem'],
 'expedition':['The Long Walk','The Bad Map Expedition','The Expedition Nobody Packed For','The Road Tax','The Supply Complaint Tour','The Extremely Scenic Mistake'],
 'rare-find':['The Truffle Bubble','The Honey Economy','The Rare Drop Economy','The Forager Bull Market','The Snack Commodity Crisis'],
 'realm-grudge':['The Ledger Feud','The Very Official Beef','The Clerk-Certified Grudge','The Paperwork Hostility','The Administrative Beef'],
 'realm-succession':['The Seal Shuffle','The Chair Update','The Leadership Patch','The Crownless Patch Notes','The Administrative Boss Fight'],
};

type LineSet={speakers:readonly RealmChatBotId[];lines:readonly string[]};
const FRESH_LINES:Record<RealmFolkloreKind,readonly LineSet[]>={
 'bear-escape':[
  {speakers:['kestrel','river'],lines:['okay no. that was {title}','we are naming that {title} before anyone edits history']},
  {speakers:['laggoblin'],lines:['new server lore unlocked: {title}','adding {title} to the evidence board immediately']},
  {speakers:['quietfox'],lines:['{title}. canon.','survived. unfortunately memorable.']},
 ],
 'bear-down':[
  {speakers:['vex','river'],lines:['incident report title: {title}','we are never doing {title} again']},
  {speakers:['kestrel'],lines:['congrats {actor} you invented {title}','{title} is going in the server obituary folder']},
 ],
 'wolf-escape':[
  {speakers:['kestrel','mira'],lines:['calling that {title}','that was one wolf short of a documentary called {title}']},
  {speakers:['niko77'],lines:['{title} any% survived category','new split name just dropped: {title}']},
 ],
 'wolf-down':[
  {speakers:['river','vex'],lines:['well. {title} happened.','file that under {title} and never recreate it']},
  {speakers:['laggoblin'],lines:['pack behavior study concluded. paper title: {title}']},
 ],
 'bison-escape':[
  {speakers:['laggoblin','kestrel'],lines:['we have officially entered {title}','that moving wall event is now {title}']},
  {speakers:['quietfox'],lines:['{title}. large.','horns: 1 plans: 0']},
 ],
 'bison-down':[
  {speakers:['kestrel','river'],lines:['{title} ended exactly how the title suggests','put {title} in the lessons-learned folder']},
  {speakers:['vex'],lines:['{title}. cause: standing near a building with legs.']},
 ],
 'enemy-escape':[
  {speakers:['vex','mira'],lines:['that entire mess is now {title}','official designation: {title}']},
  {speakers:['toast'],lines:['selling commemorative rights to {title}','{title} merch preorders open']},
 ],
 'enemy-down':[
  {speakers:['river','kestrel'],lines:['{title}. we learned something probably.','welp. welcome to the history books, {title}']},
  {speakers:['quietfox'],lines:['{title}. avoid sequel.']},
 ],
 'construction-spree':[
  {speakers:['vex'],lines:['i leave for TWO MINUTES and we get {title}','this is no longer a camp. this is {title}.']},
  {speakers:['toast'],lines:['property values reacting irrationally to {title}','i am already selling plots in {title}']},
  {speakers:['kestrel'],lines:['we built enough walls to create an economic period. {title}.']},
 ],
 'iron-rush':[
  {speakers:['toast'],lines:['welcome to {title}. ore futures are unwell.','{actor} just caused {title} and i have positions']},
  {speakers:['niko77'],lines:['iron routing PB. naming it {title}','inventory% category update: {title}']},
  {speakers:['vex'],lines:['if anyone asks where all the iron went: {title}']},
 ],
 'craft-spree':[
  {speakers:['vex','river'],lines:['the bench has entered {title}','we have apparently begun {title}']},
  {speakers:['toast'],lines:['labor market update: {title}','i am outsourcing to {actor} after {title}']},
 ],
 'kill-streak':[
  {speakers:['kestrel'],lines:['watch report renamed to {title}','okay {actor} is currently running {title}']},
  {speakers:['quietfox'],lines:['{title}. hostile population down.']},
  {speakers:['laggoblin'],lines:['local ecology now includes {title} somehow']},
 ],
 'watch-kill':[
  {speakers:['river','mira'],lines:['that closes the book on {title}','calling that whole thing {title}']},
  {speakers:['kestrel'],lines:['RIP {target}. cause of death: {title}','{title} has concluded with extremely one-sided minutes']},
  {speakers:['toast'],lines:['market has priced in the end of {title}']},
 ],
 'bounty':[
  {speakers:['mira','river'],lines:['{title} is officially in the books','paperwork says we survived {title}']},
  {speakers:['toast'],lines:['nothing legitimizes violence like a receipt. {title}.']},
  {speakers:['quietfox'],lines:['{title}. paid.']},
 ],
 'expedition':[
  {speakers:['river'],lines:['calling that whole trip {title}','future historians may know this as {title}']},
  {speakers:['kestrel'],lines:['we left with a plan and returned with {title}','that expedition has been posthumously renamed {title}']},
  {speakers:['niko77'],lines:['route category now officially called {title}']},
 ],
 'rare-find':[
  {speakers:['toast'],lines:['welcome to {title}. entry fee one rare snack.','commodity desk declaring {title}']},
  {speakers:['kestrel'],lines:['one rare drop and suddenly its {title}','{actor} found ONE thing and toast created {title}']},
 ],
 'realm-grudge':[
  {speakers:['laggoblin'],lines:['local history patch notes: {title}','the clerks have canonized {title}']},
  {speakers:['river'],lines:['apparently the realm now has {title}','people filed paperwork for beef. {title}.']},
 ],
 'realm-succession':[
  {speakers:['laggoblin'],lines:['political patch notes just dropped: {title}','new realm version includes {title}']},
  {speakers:['kestrel'],lines:['somebody changed chairs and now its {title}','adding {title} to things i pretend to understand']},
 ],
};

const RECALL_LINES:readonly LineSet[]=[
 {speakers:['kestrel'],lines:['this has {title} energy and i hate that','remember {title}? apparently we learned nothing','do NOT turn this into {title} 2']},
 {speakers:['river'],lines:['we learned several lessons from {title}. none survived contact with us.','i still think about {title} more than i should','for the record {title} was avoidable']},
 {speakers:['vex'],lines:['do not make me explain {title} again','{title} remains evidence against all of you','we agreed never to recreate {title}']},
 {speakers:['laggoblin'],lines:['{title} remains central to my unified theory','evidence board still has a dedicated {title} wing','historically {title} changed the server']},
 {speakers:['toast'],lines:['{title} commemorative mugs are still available','i continue to hold licensing rights to {title}','market confidence never recovered from {title}']},
 {speakers:['quietfox'],lines:['{title} 2. no.','remembered {title}. regret.','{title}. never again.']},
 {speakers:['mira'],lines:['can we remember {title} without recreating it this time','{title} was funny exactly once','i vote we leave {title} in the past']},
 {speakers:['niko77'],lines:['{title} remains the cursed split','still no clean run since {title}','{title} killed the category']},
];

const REACTION_LINES:readonly LineSet[]=[
 {speakers:['kestrel','mira'],lines:['we are actually calling it that?','that name is unfortunately permanent now','oh no the name stuck']},
 {speakers:['river'],lines:['naming incidents is how servers acquire culture','and this is why nobody lets us write the chronicle','history was a mistake']},
 {speakers:['vex'],lines:['do not put that on a sign','delete the commemorative plaque','i reject this nomenclature']},
 {speakers:['toast'],lines:['too late i bought the domain','merchandising rights claimed','commemorative barrel incoming']},
 {speakers:['quietfox'],lines:['canon.','name accepted.','wiki updated.']},
 {speakers:['laggoblin'],lines:['the archive remembers','the lore engine hungers','this will matter in season four']},
];

function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function choose<T>(xs:readonly T[],seed:string):T{return xs[hash(seed)%xs.length]!;}
function human(world:WorldState){return Object.values(world.players).find(p=>!p.id.startsWith(BOT_PREFIX));}
function bots(pop:SimulatedPlayerPopulation){return pop.runtimes as unknown as BotRuntimeLike[];}
function dist(a:[number,number,number],b:[number,number,number]){return Math.hypot(a[0]-b[0],a[2]-b[2]);}
function itemCount(p:PlayerState,id:string){return p.inventory.reduce((n,s)=>n+(s.item===id?s.count:0),0);}
function areaName(p:PlayerState){const area=(p as PlayerState&{areaId?:string}).areaId;return area?.replaceAll('-',' ')??'the Far March';}
function render(text:string,vars:Record<string,string>){let out=text;for(const [k,v] of Object.entries(vars))out=out.replaceAll(`{${k}}`,v);return out;}
function normalized(text:string){return text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function markerKind(atom:HistoricalAtom){for(const subject of atom.subjects){if(subject.startsWith('folklore:'))return subject.slice('folklore:'.length);}return undefined;}
function isKind(value:string|undefined):value is RealmFolkloreKind{return Boolean(value&&value in TITLE_BANK);}

export function classifyRealmFolkloreAtom(atom:HistoricalAtom):RealmFolkloreKind|undefined{
 const explicit=markerKind(atom);if(isKind(explicit))return explicit;
 const s=atom.summary.toLowerCase();
 if(atom.kind==='grudge')return 'realm-grudge';
 if(atom.kind==='succession')return 'realm-succession';
 if(atom.kind!=='deed')return undefined;
 if(/statement became consequential|put this into the npc relay/.test(s))return undefined;
 if(/\bclaimed\b.*\bcontract\b/.test(s))return 'bounty';
 if(/\breturned from an expedition\b|\bexpedition with a report\b/.test(s))return 'expedition';
 if(/\bblack truffle\b|\bwild honey\b/.test(s))return 'rare-find';
 if(/\bkilled\b/.test(s))return 'watch-kill';
 return undefined;
}

function targetFor(atom:HistoricalAtom){const match=/\bkilled\s+(.+?)\.(?:\s|$)/i.exec(atom.summary);return match?.[1]?.trim();}
function rareTitle(atom:HistoricalAtom){const s=atom.summary.toLowerCase();if(s.includes('truffle'))return 'The Truffle Bubble';if(s.includes('wild honey'))return 'The Honey Economy';}

export function realmFolkloreTitle(seed:number,atom:HistoricalAtom,kind=classifyRealmFolkloreAtom(atom)):string|undefined{
 if(!kind)return undefined;const target=targetFor(atom)??'Hostile';
 const raw=kind==='rare-find'?(rareTitle(atom)??choose(TITLE_BANK[kind],`${seed}:${atom.id}:${kind}`)):choose(TITLE_BANK[kind],`${seed}:${atom.id}:${kind}`);
 return render(raw,{target});
}

export function realmFolkloreImportance(atom:HistoricalAtom,kind=classifyRealmFolkloreAtom(atom)):number{
 if(!kind)return 0;
 const base:Record<RealmFolkloreKind,number>={
  'bear-escape':12,'bear-down':14,'wolf-escape':12,'wolf-down':14,'bison-escape':11,'bison-down':13,'enemy-escape':10,'enemy-down':12,
  'construction-spree':10,'iron-rush':9,'craft-spree':9,'kill-streak':11,'watch-kill':6,'bounty':10,'expedition':10,'rare-find':9,
  'realm-grudge':8,'realm-succession':8,
 };
 let score=base[kind];if(kind==='watch-kill'&&/\b(captain|boss|giant|champion)\b/i.test(atom.summary))score+=4;if(atom.source==='player')score+=1;return score;
}

export function realmFolkloreFromAtom(seed:number,atom:HistoricalAtom):RealmFolklore|undefined{
 const kind=classifyRealmFolkloreAtom(atom),title=realmFolkloreTitle(seed,atom,kind);if(!kind||!title)return undefined;
 return {atomId:atom.id,kind,title,actorName:atom.actorName??'The realm',summary:atom.summary,day:atom.day,importance:realmFolkloreImportance(atom,kind),target:targetFor(atom)};
}

export function rankRealmFolklore(seed:number,atoms:readonly HistoricalAtom[]):RealmFolklore[]{
 return atoms.map(atom=>realmFolkloreFromAtom(seed,atom)).filter((x):x is RealmFolklore=>Boolean(x)).sort((a,b)=>b.importance-a.importance||b.day-a.day||b.atomId.localeCompare(a.atomId));
}

function ledgerKey(world:WorldState){return `alderwatch.realm-chat-folklore.${world.worldSeed??197709}.v1`;}
function loadLedger(world:WorldState):FolkloreLedger{try{const parsed=JSON.parse(localStorage.getItem(ledgerKey(world))||'null') as FolkloreLedger|null;if(parsed?.version===LEDGER_VERSION&&parsed.entries)return parsed;}catch{}return {version:LEDGER_VERSION,entries:{}};}
function saveLedger(world:WorldState,ledger:FolkloreLedger){ledger.entries=Object.fromEntries(Object.entries(ledger.entries).sort((a,b)=>b[1].lastMention-a[1].lastMention).slice(0,FOLKLORE_CAP));try{localStorage.setItem(ledgerKey(world),JSON.stringify(ledger));}catch{}}

function stateFor(pop:SimulatedPlayerPopulation,time=0):FolkloreRuntime{
 let s=runtimes.get(pop);if(s)return s;const p=human(pop.state),history=ensureRealmHistory(pop.state);
 s={ledger:loadLedger(pop.state),lastSequence:history.sequence-1,nextMention:time+58+hash(String(pop.state.worldSeed))%35,sequence:0,structures:Object.keys(pop.state.structures).length,iron:p?itemCount(p,'iron'):0,buildTicks:[],ironGains:[],craftTicks:[],killTicks:[],lastBuildLegend:-Infinity,lastIronLegend:-Infinity,lastCraftLegend:-Infinity,lastKillLegend:-Infinity,lastRecurrence:{},disposed:false};runtimes.set(pop,s);return s;
}

function online(pop:SimulatedPlayerPopulation,id:RealmChatBotId){return bots(pop).find(r=>r.definition.id===id&&r.group.visible);}
function pickSpeaker(pop:SimulatedPlayerPopulation,ids:readonly RealmChatBotId[],seed:string,avoid?:string){const all=ids.map(id=>online(pop,id)).filter((x):x is BotRuntimeLike=>Boolean(x));if(!all.length)return undefined;const fresh=all.filter(r=>r.definition.id!==avoid);return choose(fresh.length?fresh:all,seed);}
function append(pop:SimulatedPlayerPopulation,r:BotRuntimeLike,text:string){(pop as unknown as {append:(m:{speakerId:string;name:string;text:string;at:number})=>void}).append({speakerId:r.player.id,name:r.definition.name,text,at:Date.now()});}
function vars(story:RealmFolklore){return {title:story.title,actor:story.actorName,target:story.target??'that hostile'};}
function markMention(world:WorldState,s:FolkloreRuntime,atomId:string){const now=Date.now(),prior=s.ledger.entries[atomId]??{firstSeen:now,mentions:0,lastMention:0};prior.mentions++;prior.lastMention=now;s.ledger.entries[atomId]=prior;saveLedger(world,s.ledger);}

function emitFresh(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,story:RealmFolklore){
 const item=choose(FRESH_LINES[story.kind],`${story.atomId}:fresh:${s.sequence++}`),speaker=pickSpeaker(pop,item.speakers,`${story.atomId}:fresh-speaker`);if(!speaker)return;
 append(pop,speaker,render(choose(item.lines,`${story.atomId}:fresh-line`),vars(story)));
 window.setTimeout(()=>{if(s.disposed)return;const reaction=choose(REACTION_LINES,`${story.atomId}:reaction`),r=pickSpeaker(pop,reaction.speakers,`${story.atomId}:reaction-speaker`,speaker.definition.id);if(r)append(pop,r,render(choose(reaction.lines,`${story.atomId}:reaction-line`),vars(story)));},900+hash(story.atomId)%1200);markMention(pop.state,s,story.atomId);
}
function emitRecall(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,story:RealmFolklore){const item=choose(RECALL_LINES,`${story.atomId}:recall:${s.sequence++}`),r=pickSpeaker(pop,item.speakers,`${story.atomId}:recall-speaker`);if(!r)return;append(pop,r,render(choose(item.lines,`${story.atomId}:recall-line:${s.sequence}`),vars(story)));markMention(pop.state,s,story.atomId);}

function recentAtoms(world:WorldState){return Object.values(ensureRealmHistory(world).atoms).slice(-RECENT_CANON_SCAN);}
function stories(world:WorldState){return rankRealmFolklore(world.worldSeed??197709,recentAtoms(world)).filter(story=>story.importance>=8);}
function storyForAtom(world:WorldState,atom:HistoricalAtom){return realmFolkloreFromAtom(world.worldSeed??197709,atom);}
function family(kind:RealmFolkloreKind){return kind.replace(/-(escape|down)$/,'');}
function storyForFamily(world:WorldState,kind:string){return stories(world).find(story=>family(story.kind)===kind);}

function promote(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,p:PlayerState,kind:RealmFolkloreKind,summary:string,key:string){
 const channel=kind.includes('construction')||kind.includes('craft')?'guild':kind==='iron-rush'?'market':'watch';
 const atom=promoteCanonicalEvent(pop.state,{source:'player',actorId:p.id,actorName:p.name,channel,externalKey:`chat-folklore:${p.id}:${key}`,subjects:[`folklore:${kind}`],summary});applyRealmConsequences(pop.state);s.lastSequence=Math.max(s.lastSequence,atomSequence(atom));return atom;
}

function dangerKind(world:WorldState,p:PlayerState):DangerEpisode['kind']|undefined{
 const live=Object.values(world.animals??{}).filter(a=>!(a as {dead?:boolean}).dead);
 if(live.some(a=>(a as {kind:string}).kind==='bear'&&dist((a as {position:[number,number,number]}).position,p.position)<23))return 'bear';
 if(live.filter(a=>(a as {kind:string}).kind==='wolf'&&dist((a as {position:[number,number,number]}).position,p.position)<25).length>=2)return 'wolf';
 const fighting=Boolean(p.combat&&p.combat.kind!=='idle'&&p.combat.kind!=='death');if(fighting&&live.some(a=>(a as {kind:string}).kind==='bison'&&dist((a as {position:[number,number,number]}).position,p.position)<14))return 'bison';
 if(Object.values(world.enemies).some(e=>e.phase!=='dead'&&dist(e.position,p.position)<25))return 'enemy';return undefined;
}
function dangerLabel(kind:DangerEpisode['kind']){return kind==='wolf'?'wolf-pack':kind;}

function startDanger(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,p:PlayerState,kind:DangerEpisode['kind'],tick:number){
 s.danger={kind,startedTick:tick,lastSeenTick:tick,startHealth:p.health,minHealth:p.health};const prior=storyForFamily(pop.state,kind);if(!prior)return;
 const last=s.lastRecurrence[kind]??-Infinity;if(tick-last<90)return;s.lastRecurrence[kind]=tick;
 window.setTimeout(()=>{if(s.disposed)return;const item=choose(RECALL_LINES,`${prior.atomId}:sequel:${s.sequence++}`),r=pickSpeaker(pop,item.speakers,`${prior.atomId}:sequel-speaker`);if(r)append(pop,r,render(choose(item.lines,`${prior.atomId}:sequel-line`),vars(prior)));},1200+hash(`${prior.atomId}:${tick}`)%1300);
}

function finishDanger(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,p:PlayerState,episode:DangerEpisode){
 const loss=Math.max(0,episode.startHealth-episode.minHealth),down=episode.minHealth<=0;if(!down&&episode.minHealth>35&&loss<35)return;
 const suffix=down?'down':'escape',kind=`${episode.kind}-${suffix}` as RealmFolkloreKind,place=areaName(p),health=Math.max(0,Math.round(episode.minHealth));
 const summary=down?`${p.name} fell during a ${dangerLabel(episode.kind)} encounter in ${place}; the overlap of place, threat, and timing became a named server incident.`:`${p.name} came out of a ${dangerLabel(episode.kind)} encounter in ${place} after health fell to ${health}; the scrape became a named server incident.`;
 const atom=promote(pop,s,p,kind,summary,`${kind}:${Math.floor(episode.startedTick/20)}`),story=storyForAtom(pop.state,atom);if(story)window.setTimeout(()=>{if(!s.disposed)emitFresh(pop,s,story);},1800+hash(atom.id)%1400);
}

function observeDanger(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,p:PlayerState){
 const tick=pop.state.tick,current=dangerKind(pop.state,p),episode=s.danger;if(episode){episode.minHealth=Math.min(episode.minHealth,p.health);if(current===episode.kind){episode.lastSeenTick=tick;return;}if(current&&current!==episode.kind){finishDanger(pop,s,p,episode);s.danger=undefined;startDanger(pop,s,p,current,tick);return;}if(tick-episode.lastSeenTick>=4){finishDanger(pop,s,p,episode);s.danger=undefined;}}else if(current)startDanger(pop,s,p,current,tick);
}

function pushRepeated(ticks:number[],tick:number,count:number,windowSeconds:number){for(let i=0;i<count;i++)ticks.push(tick);while(ticks.length&&tick-ticks[0]!>windowSeconds)ticks.shift();}
function observePhysicalSpree(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,p:PlayerState){
 const tick=pop.state.tick,nextStructures=Object.keys(pop.state.structures).length,added=Math.max(0,nextStructures-s.structures);s.structures=nextStructures;
 if(added){pushRepeated(s.buildTicks,tick,added,120);if(s.buildTicks.length>=4&&tick-s.lastBuildLegend>240){const count=s.buildTicks.length,start=s.buildTicks[0]!,atom=promote(pop,s,p,'construction-spree',`${p.name} raised ${count} structures inside two minutes in ${areaName(p)}; the burst became a named chapter of camp history.`,`construction-spree:${Math.floor(start/30)}`),story=storyForAtom(pop.state,atom);s.lastBuildLegend=tick;s.buildTicks=[];if(story)window.setTimeout(()=>{if(!s.disposed)emitFresh(pop,s,story);},1700);}}
 const nextIron=itemCount(p,'iron'),gain=Math.max(0,nextIron-s.iron);s.iron=nextIron;if(gain)s.ironGains.push({tick,amount:gain});s.ironGains=s.ironGains.filter(g=>tick-g.tick<=180);const totalIron=s.ironGains.reduce((n,g)=>n+g.amount,0);
 if(totalIron>=10&&tick-s.lastIronLegend>300){const start=s.ironGains[0]!.tick,atom=promote(pop,s,p,'iron-rush',`${p.name} hauled ${totalIron} iron into inventory inside three minutes; chat promoted the short run into server folklore.`,`iron-rush:${Math.floor(start/30)}`),story=storyForAtom(pop.state,atom);s.lastIronLegend=tick;s.ironGains=[];if(story)window.setTimeout(()=>{if(!s.disposed)emitFresh(pop,s,story);},1700);}
}

function observeNewCanon(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,p:PlayerState){
 const history=ensureRealmHistory(pop.state),fresh=Object.values(history.atoms).filter(atom=>atomSequence(atom)>s.lastSequence).sort((a,b)=>atomSequence(a)-atomSequence(b));
 for(const atom of fresh){s.lastSequence=Math.max(s.lastSequence,atomSequence(atom));const story=storyForAtom(pop.state,atom);if(story&&story.importance>=10&&!markerKind(atom))window.setTimeout(()=>{if(!s.disposed)emitFresh(pop,s,story);},2200+hash(atom.id)%1600);const text=atom.summary.toLowerCase(),tick=pop.state.tick;
  if(atom.actorId===p.id&&/\bcompleted\b.*\bat the work station\b/.test(text)){pushRepeated(s.craftTicks,tick,1,180);if(s.craftTicks.length>=3&&tick-s.lastCraftLegend>300){const start=s.craftTicks[0]!,made=s.craftTicks.length,created=promote(pop,s,p,'craft-spree',`${p.name} completed ${made} work-station crafts inside three minutes; the workbench run acquired a server nickname.`,`craft-spree:${Math.floor(start/30)}`),madeStory=storyForAtom(pop.state,created);s.lastCraftLegend=tick;s.craftTicks=[];if(madeStory)window.setTimeout(()=>{if(!s.disposed)emitFresh(pop,s,madeStory);},1900);}}
  if(atom.actorId===p.id&&/\bkilled\b/.test(text)&&!markerKind(atom)){pushRepeated(s.killTicks,tick,1,300);if(s.killTicks.length>=3&&tick-s.lastKillLegend>420){const start=s.killTicks[0]!,kills=s.killTicks.length,created=promote(pop,s,p,'kill-streak',`${p.name} put ${kills} hostile kills into watch history inside five minutes; the run became a named piece of server history.`,`kill-streak:${Math.floor(start/30)}`),killStory=storyForAtom(pop.state,created);s.lastKillLegend=tick;s.killTicks=[];if(killStory)window.setTimeout(()=>{if(!s.disposed)emitFresh(pop,s,killStory);},1900);}}
 }
}

function pickRecall(world:WorldState,s:FolkloreRuntime,seed:string,text?:string){
 const all=stories(world);if(!all.length)return undefined;if(text){const n=normalized(text),exact=all.find(story=>n.includes(normalized(story.title)));if(exact)return exact;}
 const now=Date.now(),eligible=all.filter(story=>now-(s.ledger.entries[story.atomId]?.lastMention??0)>180_000);if(!eligible.length)return undefined;
 const scored=eligible.map(story=>{const receipt=s.ledger.entries[story.atomId],novelty=receipt?Math.max(0,20-receipt.mentions*5):28,score=story.importance*8+novelty+(hash(`${seed}:${story.atomId}`)%13);return {story,score};});const best=Math.max(...scored.map(x=>x.score)),band=scored.filter(x=>x.score>=best-9);return choose(band,seed).story;
}

function folklorePulse(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,p:PlayerState,time:number){
 if(time<s.nextMention)return;s.nextMention=time+82+hash(`${pop.state.worldSeed}:${s.sequence}:folklore-gap`)%72;if(document.visibilityState==='hidden'||!document.querySelector('.hotbar')||dangerKind(pop.state,p))return;const story=pickRecall(pop.state,s,`${pop.state.worldSeed}:${s.sequence}:ambient`);if(story)emitRecall(pop,s,story);
}
function playerRecall(pop:SimulatedPlayerPopulation,s:FolkloreRuntime,text:string){const known=stories(pop.state);if(!/\b(remember|lore|legend|incident|history|wiki|again|what happened|server story)\b/i.test(text)&&!known.some(story=>normalized(text).includes(normalized(story.title))))return;const story=pickRecall(pop.state,s,`${text}:${s.sequence}:asked`,text);if(story)window.setTimeout(()=>{if(!s.disposed)emitRecall(pop,s,story);},1700+hash(text)%1500);}

function install(){
 const g=globalThis as Record<PropertyKey,unknown>;if(g[marker])return;g[marker]=true;const proto=SimulatedPlayerPopulation.prototype as unknown as {update:(time:number)=>unknown;sendPlayerChat:(text:string)=>unknown;dispose:()=>unknown},originalUpdate=proto.update,originalSend=proto.sendPlayerChat,originalDispose=proto.dispose;
 proto.sendPlayerChat=function(this:SimulatedPlayerPopulation,text:string){const out=originalSend.call(this,text),s=stateFor(this);playerRecall(this,s,text);return out;};
 proto.update=function(this:SimulatedPlayerPopulation,time:number){const out=originalUpdate.call(this,time),p=human(this.state);if(!p)return out;const s=stateFor(this,time);observeNewCanon(this,s,p);observeDanger(this,s,p);observePhysicalSpree(this,s,p);folklorePulse(this,s,p,time);return out;};
 proto.dispose=function(this:SimulatedPlayerPopulation){const s=runtimes.get(this);if(s)s.disposed=true;runtimes.delete(this);return originalDispose.call(this);};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')install();