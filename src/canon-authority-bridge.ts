import {LocalAuthority,ITEMS,type Command,type PlayerState,type WorldState} from './state';
import {areaWard,promoteCanonicalEvent,type CanonicalEventInput,type CanonSource} from './provenance-frontier';

const marker=Symbol.for('alderwatch.canon-authority-bridge.v1');
const BOT_PREFIX='player-bot-';
type AreaPlayer=PlayerState&{areaId?:string};

const sourceFor=(playerId:string):CanonSource=>playerId.startsWith(BOT_PREFIX)?'simulated-player':'player';
const actor=(world:WorldState,playerId:string)=>world.players[playerId];
const clipped=(text:string,n=110)=>text.length>n?text.slice(0,n-1)+'…':text;

/** Pure mapping from an already-accepted command to the small subset worth retaining as canon. */
export function canonicalEventForSuccessfulCommand(world:WorldState,command:Command,message:string,enemyWasAlive=false):CanonicalEventInput|undefined{
 const p=actor(world,command.playerId);if(!p)return;const source=sourceFor(p.id),ward=areaWard((p as AreaPlayer).areaId),base={source,actorId:p.id,actorName:p.name,ward} as const;
 if(command.type==='place')return {...base,channel:'guild',externalKey:`command:${world.tick}:${p.id}:place:${world.nextId-1}`,summary:`${p.name} raised ${command.kind.replaceAll('_',' ')} in ${(p as AreaPlayer).areaId??'the Far March'}; the construction entered the realm record.`};
 if(command.type==='craft')return {...base,channel:'guild',externalKey:`command:${world.tick}:${p.id}:craft:${command.recipeId}:${world.nextId}`,summary:`${p.name} completed ${command.recipeId.replaceAll('_',' ')} at the work station; guild talk carried the result outward.`};
 if(command.type==='bounty'&&command.action==='claim')return {...base,channel:'watch',externalKey:`command:${world.tick}:${p.id}:bounty:${command.bountyId}`,summary:`${p.name} claimed the ${command.bountyId.replaceAll('-',' ')} contract. The watch entered the deed into March record.`};
 if(command.type==='expedition'&&command.action==='report')return {...base,channel:'watch',externalKey:`command:${world.tick}:${p.id}:expedition:${command.siteId??'active'}`,summary:`${p.name} returned from an expedition with a report worth carrying beyond the local road.`};
 if(command.type==='open_container')return {...base,channel:'market',externalKey:`command:${world.tick}:${p.id}:container:${command.containerId}`,summary:`${p.name} opened ${clipped(message)}; word of recovered supplies entered the road market.`};
 if(command.type==='forage'){
  const f=world.forage[command.forageId],item=f?.item??f?.kind;if(item==='truffle'||item==='wild_honey')return {...base,channel:'market',externalKey:`command:${world.tick}:${p.id}:forage:${command.forageId}`,summary:`${p.name} found ${item==='truffle'?'a black truffle':'wild honey'}; the unusually good find became market gossip.`};
 }
 if(command.type==='harvest'&&/Timber|Stone fractured/i.test(message))return {...base,channel:'guild',externalKey:`command:${world.tick}:${p.id}:harvest:${command.resourceId}`,summary:`${p.name} finished breaking a frontier resource node; working hands carried the news through the local guild network.`};
 if(command.type==='strike'&&command.enemyId&&enemyWasAlive){const enemy=world.enemies[command.enemyId];if(enemy&&enemy.health<=0)return {...base,channel:'watch',externalKey:`command:${world.tick}:${p.id}:kill:${enemy.id}`,subjects:[enemy.id],summary:`${p.name} killed ${enemy.name}. The death entered watch reports and can now survive as realm history.`};}
 return undefined;
}

function install(){
 const g=globalThis as Record<PropertyKey,unknown>;if(g[marker])return;g[marker]=true;const proto=LocalAuthority.prototype as LocalAuthority&{dispatch:(command:Command)=>{ok:boolean;message:string}},original=proto.dispatch;
 proto.dispatch=function(this:LocalAuthority,command:Command){const enemyWasAlive=command.type==='strike'&&command.enemyId?((this.state.enemies[command.enemyId]?.health??0)>0):false,out=original.call(this,command);if(out.ok){const event=canonicalEventForSuccessfulCommand(this.state,command,out.message,enemyWasAlive);if(event)promoteCanonicalEvent(this.state,event);}return out;};
}

if(typeof window!=='undefined')install();
