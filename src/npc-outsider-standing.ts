import {ensureRenown} from './renown';
import type {PlayerState} from './state';

export type NpcStanding='outsider'|'known'|'trusted'|'negotiator'|'ally';
export interface StandingSignals {alderbrook:number;faction:number;fame:number;karma:number;localTrust:number}

const FACTION_BY_NPC:Record<string,string>={
 mara:'Free Traders',tomas:'Free Traders',
 'gate-guard':'March Wardens',
 wulfric:'Wildkeepers',ylva:'Wildkeepers',moss:'Wildkeepers',
 sigrid:'Alderbrook',pell:'Alderbrook',elske:'Alderbrook',
};

function clamp(v:number,a:number,b:number){return Math.max(a,Math.min(b,v));}
export function standingScore(s:StandingSignals){return s.alderbrook*.45+s.faction*.35+s.fame*.12+s.karma*.08+s.localTrust*3;}
export function standingFromSignals(s:StandingSignals):NpcStanding{const score=standingScore(s);return score>=50?'ally':score>=30?'negotiator':score>=15?'trusted':score>=5?'known':'outsider';}
export function standingForPlayer(player:PlayerState,npcId:string,localTrust=0){const r=ensureRenown(player),faction=FACTION_BY_NPC[npcId]??'Alderbrook';return standingFromSignals({alderbrook:r.reputation.Alderbrook??0,faction:r.reputation[faction]??0,fame:r.fame,karma:r.karma,localTrust});}
export function mayNegotiate(standing:NpcStanding){return standing==='negotiator'||standing==='ally';}
export function standingLabel(standing:NpcStanding){return standing==='ally'?'ALLY':standing==='negotiator'?'NEGOTIATOR':standing==='trusted'?'TRUSTED OUTSIDER':standing==='known'?'KNOWN OUTSIDER':'OUTSIDER';}

export function relayTrustDelta(message:string){const m=message.toLowerCase();let n=0;if(/\b(please|thank you|thanks|good day|hail|appreciate|fair enough)\b/.test(m))n+=.18;if(/\b(liar|idiot|stupid|trash|shut up|hate you|moron)\b/.test(m))n-=.7;if(/\b(fuck you|i'?ll kill you|threat|screw you)\b/.test(m))n-=1.05;return clamp(n,-1.2,.3);}
export function negotiationIntent(message:string){return /\b(negotiate|terms|deal|contract|discount|credit|better price|lower price|price break|arrangement|agreement)\b/i.test(message);}

export function npcRoleplayRegister(text:string){
 let out=text.trim().replace(/\bim\b/g,"I'm").replace(/\bdont\b/g,"don't").replace(/\bdoesnt\b/g,"doesn't").replace(/\bwasnt\b/g,"wasn't").replace(/\bcant\b/g,"can't").replace(/\bwont\b/g,"won't");
 out=out.replace(/(^|[.!?]\s+)([a-z])/g,(_,p:string,c:string)=>p+c.toUpperCase());
 if(out&&!/[.!?…]$/.test(out))out+='.';
 return out;
}

export function relayRoleplayContext(standing:NpcStanding,localTrust:number,canNegotiate=mayNegotiate(standing)){
 const relation=standing==='outsider'?'The speaker is an unfamiliar outsider using the public Alderbrook Relay. Be civil but suspicious; do not treat them as one of the townsfolk.':standing==='known'?'The speaker is a known outsider. You recognize the name, but trust remains limited.':standing==='trusted'?'The speaker has earned meaningful local trust. You may speak more candidly and vouch for them when appropriate.':standing==='negotiator'?'The speaker has earned standing sufficient for serious negotiation. You may discuss terms, favors, obligations, prices, access, and reciprocal commitments, while the game remains authoritative over actual state changes.':'The speaker is a proven ally of the settlement. Treat their word as carrying real weight unless your personal motives strongly disagree.';
 return `${relation} This is traditional in-world roleplay, not modern player chat. Use proper capitalization and punctuation. Avoid internet slang, typo affectations, emoji, chat abbreviations, and modern customer-service phrasing. Keep your established personality and medieval-frontier worldview. Local personal trust is ${localTrust.toFixed(1)}. ${canNegotiate?'You may entertain negotiations and propose terms, but never claim a transaction or game-state change has already occurred.':'Do not enter binding negotiation yet; if asked for special terms, explain that greater standing must be earned first.'}`;
}

export function guardedNegotiationRefusal(name:string,standing:NpcStanding){const rank=standingLabel(standing).toLowerCase();return npcRoleplayRegister(`${name}, you are still regarded as ${rank} here. Earn greater standing in Alderbrook, and then we may speak of special terms`);}

export function witnessLine(standing:NpcStanding,speaker:string,witness:string,seed:number){const suspicious=[`${speaker}, do you know this outsider?`,`The relay is public. I would mind what promises are made to strangers.`,`I have heard the name, but not enough to stake anything upon it.`];const known=[`I know the name. Let the outsider speak.`,`They have been seen doing useful work. I would hear them out.`,`Known, yes. Trusted is another matter.`];const trusted=[`I will vouch that they have dealt fairly with us so far.`,`They have earned the right to be heard.`,`I have no objection. Their word has carried weight before.`];const pool=standing==='outsider'?suspicious:standing==='known'?known:trusted;return `${witness}: ${pool[seed%pool.length]}`;}
