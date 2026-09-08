import type {WorldState,PlayerState} from './state';
import {dialogueContext,offlineNpcReply,openRouterSystemPrompt,personaFor,type DialogueTurn} from './npc-dialogue';

let unavailableUntil=0;
export interface NpcChatResult {reply:string;source:'openrouter'|'offline';model?:string}
function compactHistory(history:readonly DialogueTurn[]){return history.slice(-6).map(t=>({role:t.role,content:t.content.slice(0,320)}));}
export async function talkToNpc(npcId:string,message:string,world:WorldState,player:PlayerState,history:readonly DialogueTurn[],region='The Far March'):Promise<NpcChatResult>{
 const ctx=dialogueContext(world,player,region),fallback=()=>({reply:offlineNpcReply(npcId,message,ctx,history.length),source:'offline' as const});
 if(Date.now()<unavailableUntil)return fallback();
 const persona=personaFor(npcId),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4200);
 try{
  const response=await fetch('/api/npc-chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({npcId,npcName:persona.name,role:persona.role,persona:openRouterSystemPrompt(npcId,ctx),message:message.slice(0,400),history:compactHistory(history),context:ctx})});
  if(response.status===404||response.status===503){unavailableUntil=Date.now()+300_000;return fallback();}
  if(!response.ok)throw new Error(`NPC chat HTTP ${response.status}`);
  const data=await response.json() as {reply?:unknown;model?:unknown};if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('NPC chat returned no reply');
  return {reply:data.reply.trim().slice(0,900),source:'openrouter',model:typeof data.model==='string'?data.model:undefined};
 }catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))console.warn('NPC chat fell back to authored dialogue.',error);unavailableUntil=Date.now()+60_000;return fallback();}
 finally{clearTimeout(timer);}
}

export async function ambientNpcTalk(aId:string,bId:string,prompt:string,world:WorldState,player:PlayerState):Promise<string|undefined>{
 if(Date.now()<unavailableUntil)return undefined;const a=personaFor(aId),b=personaFor(bId),ctx=dialogueContext(world,player);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
 try{const response=await fetch('/api/npc-chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({npcId:aId,npcName:a.name,role:a.role,persona:openRouterSystemPrompt(aId,ctx)+` You are speaking directly to ${b.name}, ${b.role}, not to the player.`,message:prompt.slice(0,260),history:[],context:ctx,mode:'ambient'})});if(response.status===404||response.status===503){unavailableUntil=Date.now()+300_000;return undefined;}if(!response.ok)return undefined;const data=await response.json() as {reply?:unknown};return typeof data.reply==='string'?data.reply.trim().slice(0,420):undefined;}catch{return undefined;}finally{clearTimeout(timer);}
}
