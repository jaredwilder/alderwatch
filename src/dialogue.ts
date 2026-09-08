// Transport for villager conversation. The browser holds no credential: it posts
// an npcId and a line of speech, and the Alderwatch server attaches the voice.
export interface DialogueTurn {role:'user'|'assistant';content:string}

export const MAX_PLAYER_LINE=400;
/** Turns kept per villager. The server enforces its own cap; this keeps requests small. */
export const HISTORY_KEPT=8;

const ENDPOINT='/api/npc';
/** Shown when the service is unreachable — in the game's voice, never a stack trace. */
const OFFLINE='They look at you, but the words do not come. (No answer from Alderbrook.)';

export function trimHistory(history:DialogueTurn[]){return history.slice(-HISTORY_KEPT);}

/**
 * Ask a villager for their reply. Rejects with a player-readable sentence; the
 * caller shows it in the transcript rather than a console error.
 */
export async function askVillager(npcId:string,message:string,history:DialogueTurn[]):Promise<string>{
 const line=message.replace(/\s+/g,' ').trim().slice(0,MAX_PLAYER_LINE);
 if(!line)throw new Error('Say something first.');
 let response:Response;
 try{
  response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({npcId,message:line,history:trimHistory(history)})});
 }catch{throw new Error(OFFLINE);}
 let payload:{reply?:string;error?:string}={};
 try{payload=await response.json();}catch{/* fall through to the status check */}
 if(!response.ok||!payload.reply)throw new Error(payload.error||OFFLINE);
 return payload.reply;
}
