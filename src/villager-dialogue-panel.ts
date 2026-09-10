import {askVillager,type DialogueTurn} from './dialogue';
import type {Villager} from './npc';
import {handleTavernEntity} from './tavern-bridge';

const conversations=new Map<string,DialogueTurn[]>();
function ensureStyle(){
 if(document.querySelector('#villager-dialogue-style'))return;
 const style=document.createElement('style');style.id='villager-dialogue-style';
 style.textContent=`
.villager-dialogue{width:min(680px,calc(100vw - 32px))}
.dialogue-content{display:flex;flex-direction:column;gap:14px}
.dialogue-log{display:flex;flex-direction:column;gap:10px;max-height:46vh;min-height:180px;overflow-y:auto;padding:14px 16px;background:#0d1412a8;border:1px solid var(--line);scrollbar-width:thin}
.dialogue-log p{margin:0;font-size:13px;line-height:1.75}
.dialogue-npc{color:#e4ce9a}
.dialogue-player{color:#bfc8bd;padding-left:14px;border-left:2px solid #cab78347}
.dialogue-npc.muted{color:#9aa294;font-style:italic}
.dialogue-form{display:flex;gap:10px}
.dialogue-form input{flex:1;min-width:0;padding:11px 14px;color:#eee8d8;background:#ffffff08;border:1px solid var(--line)}
.dialogue-form input::placeholder{color:#8d9488}
.dialogue-form input:disabled{opacity:.5}
.dialogue-form button{padding:11px 22px;font:13px Cinzel;letter-spacing:.08em;color:#e4ce9a;border:1px solid #cab78366}
`;
 document.head.append(style);
}

export function openVillagerDialogue(ui:HTMLElement,villager:Villager,resume:()=>void){
 if(handleTavernEntity(ui,villager.id,resume))return;
 ensureStyle();let history=conversations.get(villager.id);if(!history){history=[{role:'assistant',content:villager.greeting}];conversations.set(villager.id,history);}const turns=history;
 ui.innerHTML='<section class="menu-card game-panel villager-dialogue"><button class="back">← Return to the March</button><div class="eyebrow"></div><h2></h2><div class="panel-content dialogue-content"></div></section>';
 ui.querySelector<HTMLButtonElement>('.back')!.onclick=resume;ui.querySelector('.eyebrow')!.textContent=villager.role.toUpperCase()+' · ALDERBROOK';ui.querySelector('h2')!.textContent=villager.name;
 const content=ui.querySelector<HTMLElement>('.dialogue-content')!,log=document.createElement('div');log.className='dialogue-log';log.setAttribute('role','log');log.setAttribute('aria-live','polite');
 const form=document.createElement('form');form.className='dialogue-form';const field=document.createElement('input');field.type='text';field.maxLength=400;field.autocomplete='off';field.placeholder='Say something…';field.setAttribute('aria-label','Speak to '+villager.name);field.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();resume();}};
 const send=document.createElement('button');send.type='submit';send.textContent='Speak';form.append(field,send);content.append(log,form);const note=document.createElement('p');note.className='muted';note.textContent='They answer in their own words. Esc or ← returns to the March.';content.append(note);
 const render=()=>{log.replaceChildren();for(const turn of turns){const line=document.createElement('p');line.className=turn.role==='user'?'dialogue-player':'dialogue-npc';line.textContent=(turn.role==='user'?'You':villager.name)+' · '+turn.content;log.append(line);}log.scrollTop=log.scrollHeight;};
 render();field.focus();let pending=false;
 form.onsubmit=async e=>{e.preventDefault();const said=field.value.trim();if(!said||pending)return;field.value='';turns.push({role:'user',content:said});render();pending=true;send.disabled=field.disabled=true;const waiting=document.createElement('p');waiting.className='dialogue-npc muted';waiting.textContent=villager.name+' considers…';log.append(waiting);log.scrollTop=log.scrollHeight;try{turns.push({role:'assistant',content:await askVillager(villager.id,said,turns.slice(0,-1))});}catch(error){turns.push({role:'assistant',content:(error as Error).message});}pending=false;send.disabled=field.disabled=false;render();field.focus();};
}
