import {ITEMS,quantity,spend,type ItemId,type PlayerState,type WorldState} from './state';
import {ensureRenown} from './renown';
import {mayNegotiate,type NpcStanding} from './npc-outsider-standing';

export type ContractObjective={kind:'counter'|'supply';key:string;amount:number;baseline:number;item?:ItemId;label:string};
export type ContractOffer={id:string;npcId:string;title:string;objective:ContractObjective;reward:number;baseReward:number;maxReward:number;repFaction:string;repReward:number;createdAt:number;expiresAt:number;durationTicks:number};
export type ActiveContract=ContractOffer&{acceptedAt:number;deadlineAt:number;state:'active'|'ready'};
export type ContractResolution={id:string;npcId:string;title:string;outcome:'completed'|'defaulted'|'abandoned';reward:number;at:number};
export type ContractBook={offers:Record<string,ContractOffer>;active:ActiveContract[];history:ContractResolution[];reliability:Record<string,number>;serial:number};
export type ContractEvent={npcId:string;type:'ready'|'defaulted';text:string;worldReaction:string;trustDelta:number};
export type ContractTurn={handled:boolean;reply?:string;worldReaction?:string;trustDelta?:number;kind?:'trade'|'danger'|'build'|'food'|'gossip'};

type Template={title:string;kind:'counter'|'supply';key:string;item?:ItemId;amount:number;label:string;baseReward:number;repFaction:string;repReward:number;minutes:number};
const TICKS_PER_SECOND=60,MAX_ACTIVE=3;
const BOOKS=new WeakMap<WorldState,ContractBook>();
const TEMPLATES:Record<string,readonly Template[]>={
 mara:[
  {title:'Dry Timber Lot',kind:'supply',key:'wood',item:'wood',amount:12,label:'oak timber',baseReward:24,repFaction:'Free Traders',repReward:3,minutes:14},
  {title:'Roadside Hides',kind:'supply',key:'hide',item:'hide',amount:6,label:'clean hides',baseReward:27,repFaction:'Free Traders',repReward:3,minutes:16},
  {title:'Iron Without Questions',kind:'supply',key:'iron',item:'iron',amount:8,label:'iron ore',baseReward:31,repFaction:'Free Traders',repReward:3.5,minutes:18},
 ],
 sigrid:[
  {title:'Raise the Frame',kind:'counter',key:'build',amount:4,label:'structures raised',baseReward:30,repFaction:'Alderbrook',repReward:4,minutes:18},
  {title:'Seasoned Stock',kind:'supply',key:'wood',item:'wood',amount:16,label:'oak timber',baseReward:29,repFaction:'Alderbrook',repReward:3.5,minutes:16},
 ],
 ylva:[
  {title:'Wolf Quieting',kind:'counter',key:'kill_wolf',amount:2,label:'wolves killed',baseReward:36,repFaction:'Wildkeepers',repReward:4,minutes:18},
  {title:'Old Bear Problem',kind:'counter',key:'kill_bear',amount:1,label:'bear killed',baseReward:43,repFaction:'Wildkeepers',repReward:4.5,minutes:20},
 ],
 'gate-guard':[
  {title:'Clear a Posted Bounty',kind:'counter',key:'complete_bounty',amount:1,label:'bounty completed',baseReward:46,repFaction:'March Wardens',repReward:5,minutes:22},
  {title:'Thin the Outcasts',kind:'counter',key:'kill_baddie',amount:5,label:'outcasts defeated',baseReward:42,repFaction:'March Wardens',repReward:4.5,minutes:20},
 ],
 wulfric:[
  {title:'Hart Count',kind:'counter',key:'kill_deer',amount:2,label:'deer taken',baseReward:32,repFaction:'Wildkeepers',repReward:3.5,minutes:18},
  {title:'Bowyer’s Leather',kind:'supply',key:'hide',item:'hide',amount:7,label:'hides',baseReward:30,repFaction:'Wildkeepers',repReward:3.5,minutes:16},
 ],
 pell:[
  {title:'Hearth Rush',kind:'counter',key:'craft',amount:3,label:'goods crafted',baseReward:25,repFaction:'Alderbrook',repReward:3,minutes:12},
  {title:'Berry Pot',kind:'supply',key:'berries',item:'berries',amount:10,label:'wild berries',baseReward:22,repFaction:'Alderbrook',repReward:2.5,minutes:12},
 ],
 elske:[
  {title:'Honey Tithe',kind:'supply',key:'wild_honey',item:'wild_honey',amount:3,label:'wild honey',baseReward:29,repFaction:'Alderbrook',repReward:3,minutes:16},
  {title:'Wax for the Hives',kind:'supply',key:'beeswax',item:'beeswax',amount:5,label:'beeswax',baseReward:28,repFaction:'Alderbrook',repReward:3,minutes:16},
 ],
 tomas:[
  {title:'Crow-Milk Procurement',kind:'supply',key:'crow_milk',item:'crow_milk',amount:2,label:'crow milk',baseReward:38,repFaction:'Free Traders',repReward:4,minutes:20},
  {title:'Corvid Field Study',kind:'counter',key:'kill_crow',amount:4,label:'crows collected for science',baseReward:27,repFaction:'Free Traders',repReward:2.5,minutes:14},
 ],
 moss:[
  {title:'Ten Useful Things',kind:'counter',key:'forage',amount:10,label:'forage actions',baseReward:27,repFaction:'Wildkeepers',repReward:3,minutes:16},
  {title:'One Black Truffle',kind:'supply',key:'truffle',item:'truffle',amount:1,label:'black truffle',baseReward:34,repFaction:'Wildkeepers',repReward:4,minutes:20},
 ],
};

function clamp(v:number,a:number,b:number){return Math.max(a,Math.min(b,v));}
function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function key(world:WorldState){return `alderwatch.npc-contracts.${world.worldSeed??'preview'}.v1`;}
function emptyBook():ContractBook{return {offers:{},active:[],history:[],reliability:{},serial:0};}
function load(world:WorldState){try{if(typeof localStorage!=='undefined'){const raw=localStorage.getItem(key(world));if(raw){const p=JSON.parse(raw) as Partial<ContractBook>;return {offers:p.offers??{},active:p.active??[],history:(p.history??[]).slice(-24),reliability:p.reliability??{},serial:p.serial??0};}}}catch{}return emptyBook();}
export function contractBook(world:WorldState){let b=BOOKS.get(world);if(!b){b=load(world);BOOKS.set(world,b);}return b;}
export function persistContractBook(world:WorldState,book=contractBook(world)){try{if(typeof localStorage!=='undefined')localStorage.setItem(key(world),JSON.stringify({...book,history:book.history.slice(-24)}));}catch{}}

function counter(player:PlayerState,key:string){return ensureRenown(player).counters[key]??0;}
export function contractProgress(player:PlayerState,c:Pick<ActiveContract,'objective'>){const o=c.objective;return o.kind==='supply'?quantity(player,o.item!):Math.max(0,counter(player,o.key)-o.baseline);}
export function contractComplete(player:PlayerState,c:Pick<ActiveContract,'objective'>){return contractProgress(player,c)>=c.objective.amount;}
function objectiveText(o:ContractObjective){const label=o.kind==='supply'&&o.item?ITEMS[o.item].name:o.label;return `${o.amount} ${label}`;}
function remainingText(world:WorldState,c:ActiveContract){const seconds=Math.max(0,Math.ceil((c.deadlineAt-world.tick)/TICKS_PER_SECOND)),m=Math.floor(seconds/60),s=seconds%60;return `${m}:${String(s).padStart(2,'0')}`;}
function adjustRep(player:PlayerState,faction:string,delta:number){const r=ensureRenown(player);r.reputation[faction]=clamp((r.reputation[faction]??0)+delta,-100,100);}
function resolve(book:ContractBook,c:ActiveContract,outcome:ContractResolution['outcome'],world:WorldState){book.history.push({id:c.id,npcId:c.npcId,title:c.title,outcome,reward:c.reward,at:world.tick});book.history=book.history.slice(-24);book.active=book.active.filter(x=>x.id!==c.id);}
function reliability(book:ContractBook,npcId:string,delta=0){book.reliability[npcId]=clamp((book.reliability[npcId]??0)+delta,-3,5);return book.reliability[npcId]!;}

export function parseContractIntent(message:string):'request'|'accept'|'counter'|'status'|'collect'|'abandon'|null{
 const m=message.toLowerCase();
 if(/\b(contract status|deal status|my contracts?|my obligations?|what do i owe|how am i doing)\b/.test(m))return 'status';
 if(/\b(abandon|cancel (?:the )?contract|break (?:the )?deal|back out)\b/.test(m))return 'abandon';
 if(/\b(collect|pay me|payment|i(?:'|’)m done|finished|completed it|task is done)\b/.test(m))return 'collect';
 if(/\b(counter|make it|i want|for)\b[^\n]{0,30}\b\d{1,3}\s*(?:crowns?|gold)\b/.test(m)||/\b\d{1,3}\s*(?:crowns?|gold)\b[^\n]{0,20}\b(counter|deal)\b/.test(m))return 'counter';
 if(/\b(i accept|accept(?: the)?(?: offer| contract)?|agreed|we have a deal|i(?:'|’)ll do it|ill do it)\b/.test(m))return 'accept';
 if(/\b(any work|work available|work for me|give me work|contracts?|commission|job for me|need anything done|anything need doing)\b/.test(m))return 'request';
 return null;
}
export function counterAmount(message:string){const m=message.match(/(\d{1,3})\s*(?:crowns?|gold)/i);return m?Number(m[1]):undefined;}

function templateFor(world:WorldState,npcId:string,serial:number,standing:NpcStanding){const list=TEMPLATES[npcId]??TEMPLATES.mara!;const t=list[hash(`${world.worldSeed??0}:${npcId}:${serial}`)%list.length]!;const scale=standing==='ally'?1.3:1;return {...t,amount:Math.max(1,Math.ceil(t.amount*scale)),baseReward:Math.round(t.baseReward*(standing==='ally'?1.25:1))};}
export function createContractOffer(world:WorldState,npcId:string,standing:NpcStanding,localTrust:number,book=contractBook(world)){
 const serial=book.serial++,t=templateFor(world,npcId,serial,standing),rel=book.reliability[npcId]??0,premium=(standing==='ally'?.30:.15)+Math.max(0,localTrust)*.02+Math.max(0,rel)*.025;
 const baseReward=t.baseReward,maxReward=Math.max(baseReward,Math.floor(baseReward*(1+Math.min(.48,premium))));
 const offer:ContractOffer={id:`deal-${npcId}-${serial}-${hash(`${world.worldSeed}:${serial}`)}`,npcId,title:t.title,objective:{kind:t.kind,key:t.key,item:t.item,amount:t.amount,baseline:0,label:t.label},reward:baseReward,baseReward,maxReward,repFaction:t.repFaction,repReward:t.repReward,createdAt:world.tick,expiresAt:world.tick+5*60*TICKS_PER_SECOND,durationTicks:t.minutes*60*TICKS_PER_SECOND};
 book.offers[npcId]=offer;persistContractBook(world,book);return offer;
}

function offerLine(o:ContractOffer){return `I can put this in writing: ${o.title}. Your obligation is ${objectiveText(o.objective)}. Payment is ${o.reward} crowns, with ${o.repReward.toFixed(1)} standing among ${o.repFaction}. You may accept, or name a higher crown figure if you mean to bargain.`;}
function activeLine(world:WorldState,p:PlayerState,c:ActiveContract){const progress=Math.min(contractProgress(p,c),c.objective.amount);return `${c.title}: ${progress}/${c.objective.amount} ${c.objective.label}. ${c.reward} crowns due on completion. Time remaining ${remainingText(world,c)}.`;}
function applyCompletion(player:PlayerState,c:ActiveContract){const r=ensureRenown(player);r.gold+=c.reward;r.fame=Math.round((r.fame+.7)*10)/10;r.karma=Math.round((r.karma+.2)*10)/10;r.counters.contract_complete=(r.counters.contract_complete??0)+1;adjustRep(player,c.repFaction,c.repReward);adjustRep(player,'Alderbrook',Math.max(.5,c.repReward*.25));}
function applyDefault(player:PlayerState,c:ActiveContract,abandoned=false){const r=ensureRenown(player);r.counters[abandoned?'contract_abandon':'contract_default']=(r.counters[abandoned?'contract_abandon':'contract_default']??0)+1;adjustRep(player,c.repFaction,abandoned?-1.2:-2.5);adjustRep(player,'Alderbrook',abandoned?-.4:-.8);}

export function sweepContracts(world:WorldState,player:PlayerState,book=contractBook(world)){
 const events:ContractEvent[]=[];let changed=false;
 for(const [npcId,o] of Object.entries(book.offers))if(world.tick>=o.expiresAt){delete book.offers[npcId];changed=true;}
 for(const c of [...book.active]){
  if(contractComplete(player,c)&&c.state==='active'){c.state='ready';events.push({npcId:c.npcId,type:'ready',text:`The ${c.title} obligation is satisfied. Present yourself for settlement.`,worldReaction:`contract done. ${c.title} actually cleared`,trustDelta:0});changed=true;continue;}
  if(world.tick>=c.deadlineAt&&c.state!=='ready'){applyDefault(player,c);reliability(book,c.npcId,-1);resolve(book,c,'defaulted',world);events.push({npcId:c.npcId,type:'defaulted',text:`You have missed the term of ${c.title}. I will remember the default.`,worldReaction:`bro defaulted an NPC contract 💀`,trustDelta:-.8});changed=true;}
 }
 if(changed)persistContractBook(world,book);return events;
}

export function processContractMessage(world:WorldState,player:PlayerState,npcId:string,npcName:string,message:string,standing:NpcStanding,localTrust:number,book=contractBook(world)):ContractTurn{
 const intent=parseContractIntent(message);if(!intent)return {handled:false};
 const offer=book.offers[npcId],active=book.active.find(c=>c.npcId===npcId);
 if(intent==='request'){
  if(!mayNegotiate(standing))return {handled:true,reply:`I do not place written obligations in the hands of strangers. Earn greater standing in Alderbrook, and we may speak of work.`,kind:'trade'};
  if(active)return {handled:true,reply:`We already have terms between us. ${activeLine(world,player,active)}`,kind:'trade'};
  if(offer&&world.tick<offer.expiresAt)return {handled:true,reply:offerLine(offer),kind:'trade'};
  const next=createContractOffer(world,npcId,standing,localTrust,book);return {handled:true,reply:offerLine(next),kind:npcId==='ylva'||npcId==='gate-guard'?'danger':'trade',worldReaction:`${npcName} just offered a real contract. chat economy is getting weird`};
 }
 if(intent==='status'){
  if(active)return {handled:true,reply:activeLine(world,player,active),kind:'trade'};
  if(offer)return {handled:true,reply:`My offer remains open. ${offerLine(offer)}`,kind:'trade'};
  const all=book.active.map(c=>`${c.title} for ${c.npcId}: ${contractProgress(player,c)}/${c.objective.amount}`).join('; ');return {handled:true,reply:all?`Your other outstanding obligations are: ${all}.`:`You have no written obligation with me.`,kind:'gossip'};
 }
 if(intent==='counter'){
  if(!offer)return {handled:true,reply:`There is no offer before us to amend. Ask me for work first.`,kind:'trade'};const amount=counterAmount(message);if(!amount)return {handled:true,reply:`Name the crown figure plainly if you mean to bargain.`,kind:'trade'};
  if(amount<offer.baseReward)return {handled:true,reply:`You are bargaining against yourself. My present offer is ${offer.reward} crowns.`,kind:'trade'};
  if(amount>offer.maxReward){offer.reward=offer.maxReward;persistContractBook(world,book);return {handled:true,reply:`No. I will not pay ${amount} crowns. I can stretch the written sum to ${offer.maxReward}, and not one crown further.`,kind:'trade',trustDelta:-.18,worldReaction:`${npcName} just hard-capped a haggle lol`};}
  offer.reward=amount;persistContractBook(world,book);return {handled:true,reply:`Very well. I will amend the sum to ${amount} crowns. The obligation itself does not change.`,kind:'trade',trustDelta:.08,worldReaction:`actual npc haggling succeeded. ${amount} crowns on the table`};
 }
 if(intent==='accept'){
  if(!offer)return {handled:true,reply:active?`You already accepted ${active.title}. See it through.`:`There is no open offer for you to accept.`,kind:'trade'};
  if(book.active.length>=MAX_ACTIVE)return {handled:true,reply:`You already carry three written obligations. Finish one before taking another.`,kind:'trade'};
  const objective={...offer.objective,baseline:offer.objective.kind==='counter'?counter(player,offer.objective.key):0},c:ActiveContract={...offer,objective,acceptedAt:world.tick,deadlineAt:world.tick+offer.durationTicks,state:'active'};book.active.push(c);delete book.offers[npcId];persistContractBook(world,book);return {handled:true,reply:`Then we have terms. ${c.title}: ${objectiveText(c.objective)} for ${c.reward} crowns. The clock begins now.`,kind:'trade',trustDelta:.12,worldReaction:`${npcName} and ${player.name} actually signed a deal lol`};
 }
 if(intent==='collect'){
  if(!active)return {handled:true,reply:`I owe you no settlement at present.`,kind:'trade'};const progress=contractProgress(player,active);if(progress<active.objective.amount)return {handled:true,reply:`Not yet. ${activeLine(world,player,active)}`,kind:'trade'};
  if(active.objective.kind==='supply'&&!spend(player,{[active.objective.item!]:active.objective.amount}))return {handled:true,reply:`You no longer carry the agreed goods. Bring the full lot before asking settlement.`,kind:'trade'};
  applyCompletion(player,active);reliability(book,npcId,1);resolve(book,active,'completed',world);persistContractBook(world,book);return {handled:true,reply:`The obligation is met. ${active.reward} crowns are yours. I will record that you kept your word.`,kind:'trade',trustDelta:.65,worldReaction:`${player.name} got paid ${active.reward}c by ${npcName}. contract actually completed`};
 }
 if(intent==='abandon'){
  if(!active)return {handled:true,reply:`There is no obligation between us to break.`,kind:'trade'};applyDefault(player,active,true);reliability(book,npcId,-.6);resolve(book,active,'abandoned',world);persistContractBook(world,book);return {handled:true,reply:`So be it. I will strike the obligation, but not the memory of it.`,kind:'beef' as any,trustDelta:-.55,worldReaction:`${player.name} just backed out of ${npcName}'s contract. oof`};
 }
 return {handled:false};
}

export function contractRoleplayContext(world:WorldState,player:PlayerState,npcId:string){const book=contractBook(world),offer=book.offers[npcId],active=book.active.find(c=>c.npcId===npcId);if(active)return `A real game-authoritative contract exists with this speaker: ${active.title}; objective ${objectiveText(active.objective)}; current progress ${contractProgress(player,active)}/${active.objective.amount}; reward ${active.reward} crowns. You may discuss it, but only the contract engine can accept, amend, complete, pay, or cancel it.`;if(offer)return `A real game-authoritative offer is currently open: ${offer.title}; ${objectiveText(offer.objective)} for ${offer.reward} crowns. You may discuss it, but only the contract engine can amend or accept it.`;return 'No game-authoritative contract currently exists between you and this speaker. Do not invent one as though it were binding.';}

export function contractLedger(world:WorldState,player:PlayerState){const book=contractBook(world);return {offers:Object.values(book.offers).filter(o=>world.tick<o.expiresAt),active:book.active.map(c=>({...c,progress:Math.min(contractProgress(player,c),c.objective.amount),remaining:remainingText(world,c)})),history:book.history.slice(-6).reverse(),reliability:{...book.reliability}};}
