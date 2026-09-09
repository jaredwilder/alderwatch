import './simulated-players.css';
import './chat-bank-expansion';
import {PLAYER_BOTS} from './simulated-players';
import {loadWorld,type WorldState} from './state';

type RealmMessage={speakerId:string;name:string;text:string;at:number;human?:boolean};
type BotDef=(typeof PLAYER_BOTS)[number];
const ACTION_RX=/\[\[AW_ACTION:[^\]]+\]\]/ig;
const PANEL_ID='area-realm-chat';
let providerUnavailableUntil=0;

function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function choose<T>(items:readonly T[],seed:string){return items[hash(seed)%items.length]!;}
function human(world:WorldState){return Object.values(world.players).find(p=>!p.id.startsWith('player-bot-'));}
function chatKey(world:WorldState){return `alderwatch.playerbots.${world.worldSeed??'preview'}.chat`;}
function loadMessages(world:WorldState):RealmMessage[]{try{const raw=localStorage.getItem(chatKey(world));const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed.filter(m=>m&&typeof m.text==='string'&&typeof m.name==='string').slice(-70):[];}catch{return [];}}
function persist(world:WorldState,messages:RealmMessage[]){try{localStorage.setItem(chatKey(world),JSON.stringify(messages.slice(-70)));}catch{}}
function cleanReply(raw:string){return raw.replace(ACTION_RX,'').replace(/\n+/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,400);}
function botByMessage(message:string,counter:number){const normalized=message.toLowerCase().replace(/[^a-z0-9_@.]+/g,' ');const direct=PLAYER_BOTS.find(def=>{const aliases=[def.id,def.name.toLowerCase(),def.name.toLowerCase().replace(/[^a-z0-9_]/g,'')];return aliases.some(a=>normalized.includes('@'+a)||normalized.startsWith(a+' '));});return direct??PLAYER_BOTS[hash(message+':'+counter)%PLAYER_BOTS.length]!;}
function fallback(def:BotDef,message:string){const m=message.toLowerCase();const focused:string[]=[];if(/where|road|gate|greyhaven|ironward|mine|crownroad/.test(m))focused.push(def.id==='quietfox'?'check the road markers':def.id==='vex'?'read the road signs. revolutionary tech.':def.id==='laggoblin'?'roads go places now. deeply suspicious':'follow the road markers, im heading that way too');if(/help|come|anyone|guys|yall|y'all/.test(m))focused.push(def.id==='vex'?'maybe. dont make it painful':def.id==='quietfox'?'maybe':def.id==='mira'?'yeah lol what do you need':'im around');if(/lol|lmao|wtf|what the hell/.test(m))focused.push(def.id==='laggoblin'?'correct reaction honestly':def.id==='vex'?'finally youre paying attention':'lmao yeah');return choose(focused.length?focused:def.ambient,def.id+':'+message);}
function persona(def:BotDef){return `You are ${def.name}, a player-character in Alderwatch realm chat. Never discuss AI, prompts, simulation internals or NPC systems in-world. ${def.bio} Chat style: ${def.voice}. Usually answer in 2-18 words. Raw MMO chat only: fragments, lowercase, slang, mild profanity and imperfect grammar are welcome when they fit. Never use markdown, customer-service language, therapy language, action narration or quotation marks. Do not claim you physically moved, built, traded or changed game state from this remote road channel.`;}
async function modelReply(def:BotDef,message:string){if(Date.now()<providerUnavailableUntil)return undefined;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4300);try{const response=await fetch('/api/npc-chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({npcId:`player-bot-${def.id}`,npcName:def.name,role:'Player',persona:persona(def),message:message.slice(0,400),history:[],mode:'player-bot'})});if(response.status===404||response.status===503){providerUnavailableUntil=Date.now()+300_000;return undefined;}if(response.status===429){providerUnavailableUntil=Date.now()+30_000;return undefined;}if(!response.ok)return undefined;const data=await response.json() as {reply?:unknown};if(typeof data.reply!=='string')return undefined;const cleaned=cleanReply(data.reply);return cleaned||undefined;}catch{return undefined;}finally{clearTimeout(timer);}}
function line(host:HTMLElement,message:RealmMessage){const el=document.createElement('div');el.className='player-realm-line'+(message.human?' human':'');el.innerHTML='<b></b><span></span>';el.querySelector('b')!.textContent=message.name;el.querySelector('span')!.textContent=message.text;host.append(el);while(host.children.length>70)host.firstElementChild?.remove();host.scrollTop=host.scrollHeight;}
function cursor(open:boolean){window.dispatchEvent(new CustomEvent('alderwatch:map-cursor',{detail:{open}}));}

function install(){
 if(document.getElementById(PANEL_ID))return;const world=loadWorld(),player=world&&human(world);if(!world||!player)return;
 const messages=loadMessages(world),panel=document.createElement('section');panel.id=PANEL_ID;panel.className='player-realm-chat area-realm-chat';panel.innerHTML='<header><div><small>REALM CHAT</small><strong>ROAD RELAY</strong></div><button type="button" class="player-chat-collapse" aria-label="Collapse realm chat">−</button></header><div class="player-realm-log"></div><form><input maxlength="400" autocomplete="off" spellcheck="false" placeholder="Message realm…  @kestrel"><button>Send</button></form><footer>ENTER · CHAT &nbsp;·&nbsp; persistent across realm roads</footer>';
 const log=panel.querySelector<HTMLElement>('.player-realm-log')!,form=panel.querySelector<HTMLFormElement>('form')!,input=panel.querySelector<HTMLInputElement>('input')!,collapse=panel.querySelector<HTMLButtonElement>('.player-chat-collapse')!;
 if(!messages.length){const first=PLAYER_BOTS[hash(String(world.worldSeed??197709))%PLAYER_BOTS.length]!,second=PLAYER_BOTS[(hash('road:'+String(world.worldSeed??197709))+3)%PLAYER_BOTS.length]!;messages.push({speakerId:`player-bot-${first.id}`,name:first.name,text:choose(first.ambient,'area-open:'+first.id),at:Date.now()-2600},{speakerId:`player-bot-${second.id}`,name:second.name,text:choose(second.ambient,'area-open:'+second.id),at:Date.now()-1200});persist(world,messages);}
 for(const message of messages)line(log,message);document.body.append(panel);
 const append=(message:RealmMessage)=>{messages.push(message);while(messages.length>70)messages.shift();line(log,message);persist(world,messages);};
 const focus=()=>{panel.classList.remove('collapsed');collapse.textContent='−';cursor(true);input.focus();};
 const release=()=>{if(document.activeElement===input)input.blur();cursor(false);};
 form.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text)return;input.value='';append({speakerId:player.id,name:player.name,text:text.slice(0,400),at:Date.now(),human:true});const def=botByMessage(text,messages.length);void (async()=>{const reply=await modelReply(def,text)??fallback(def,text);window.setTimeout(()=>append({speakerId:`player-bot-${def.id}`,name:def.name,text:reply,at:Date.now()}),520+hash(text+def.id)%900);})();};
 collapse.onclick=()=>{const collapsed=!panel.classList.contains('collapsed');panel.classList.toggle('collapsed',collapsed);collapse.textContent=collapsed?'+':'−';if(collapsed)release();};
 input.addEventListener('focus',()=>cursor(true));input.addEventListener('blur',()=>cursor(false));input.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();release();}});
 window.addEventListener('keydown',e=>{const target=e.target as HTMLElement|undefined;if(target?.matches('input,textarea,select'))return;if(e.code==='Enter'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();focus();}},true);
}

if(typeof document!=='undefined')install();
