import type {EnemyState,ItemId,PlayerState} from './state';

export type LootTier='common'|'fine'|'exceptional'|'masterwork'|'legendary';
export const EQUIPMENT_ITEMS=new Set<ItemId>(['axe','pickaxe','hammer','sword','fine_sword','bow']);
export function clampQuality(q:number){return Math.max(1,Math.min(1.6,Math.round((Number.isFinite(q)?q:1)*100)/100));}
export function qualityTier(q:number):LootTier{q=clampQuality(q);return q>=1.5?'legendary':q>=1.36?'masterwork':q>=1.22?'exceptional':q>=1.08?'fine':'common';}
export function qualityLabel(q:number){const tier=qualityTier(q);return tier[0].toUpperCase()+tier.slice(1);}
export function qualityDamageMultiplier(q:number){return 1+(clampQuality(q)-1)*.78;}
export function bestItemQuality(player:PlayerState,item:ItemId|null|undefined){if(!item)return 1;return player.inventory.filter(s=>s.item===item).reduce((best,s)=>Math.max(best,clampQuality(s.quality)),1);}
export function equippedQuality(player:PlayerState){return bestItemQuality(player,player.equipped);}
export function craftedQuality(player:PlayerState,item:ItemId){if(!EQUIPMENT_ITEMS.has(item))return 1;const skill=item==='bow'?(player.skills?.archery??0):item==='hammer'?(player.skills?.carpentry??0):(player.skills?.blacksmithing??0);return clampQuality(1+Math.floor(Math.max(0,skill)/10)*.025);}
function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0;}
export function enemyDropQuality(enemy:EnemyState){const roll=hash(enemy.id)%1000;if(enemy.role==='captain')return 1.48;if(roll<35)return 1.52;if(roll<110)return 1.38;if(roll<260)return 1.24;if(roll<480)return 1.12;return 1;}
export function qualityName(base:string,q:number){const tier=qualityTier(q);return tier==='common'?base:`${qualityLabel(q)} ${base}`;}
export function qualityBonusText(q:number){const pct=Math.round((qualityDamageMultiplier(q)-1)*100);return pct>0?`+${pct}% weapon damage`:'standard issue';}
