import {ITEMS,type ItemId,type Stack} from './state';
import {qualityTier} from './loot';

export interface ItemAffix {id:string;label:string;damage?:number;note:string}
export interface AffixedStack extends Stack {awName?:string;awAffixes?:ItemAffix[]}
const WEAPONS=new Set<ItemId>(['axe','pickaxe','sword','fine_sword','bow']);
const prefixes:readonly ItemAffix[]=[
 {id:'keen',label:'Keen',damage:.035,note:'A cleaner edge and a little more bite.'},
 {id:'hunters',label:'Hunter’s',damage:.04,note:'Balanced for killing things that had other plans.'},
 {id:'ashen',label:'Ashen',damage:.05,note:'Smoke-darkened steel from somebody else’s story.'},
 {id:'wolfbitten',label:'Wolf-Bitten',damage:.045,note:'The teeth marks are probably decorative.'},
 {id:'ironward',label:'Ironward',damage:.06,note:'Heavy work from the eastern heights.'},
 {id:'marchwarden',label:'Marchwarden’s',damage:.065,note:'A weapon with official-looking consequences.'},
];
const suffixes:readonly ItemAffix[]=[
 {id:'march',label:'of the March',damage:.025,note:'The road recognizes this weapon.'},
 {id:'hunt',label:'of the Hunt',damage:.035,note:'Built for the moment prey becomes a problem.'},
 {id:'crows',label:'of Crows',damage:.02,note:'No one remembers approving this inscription.'},
 {id:'iron',label:'of Ironward',damage:.04,note:'Carries the weight of the eastern ridge.'},
 {id:'wolfpine',label:'of Wolfpine',damage:.045,note:'Smells faintly of pine smoke and bad odds.'},
 {id:'milk',label:'of Questionable Milk',damage:.03,note:'Absolutely not recognized by any guild.'},
];
function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0;}
function countFor(stack:Stack){const tier=qualityTier(stack.quality);return tier==='legendary'?2:tier==='masterwork'?2:tier==='exceptional'||tier==='fine'?1:0;}
export function ensureItemAffixes(stack:Stack){const s=stack as AffixedStack;if(s.awAffixes)return s.awAffixes;if(!WEAPONS.has(stack.item)||countFor(stack)===0){s.awAffixes=[];return s.awAffixes;}const h=hash(stack.id+'|'+stack.item+'|'+stack.quality.toFixed(3)),out:ItemAffix[]=[];out.push(prefixes[h%prefixes.length]);if(countFor(stack)>1)out.push(suffixes[Math.floor(h/17)%suffixes.length]);s.awAffixes=out;s.awName=itemDisplayName(s);return out;}
export function itemDisplayName(stack:Stack){const affixes=(stack as AffixedStack).awAffixes??ensureItemAffixes(stack),base=ITEMS[stack.item].name;if(!affixes.length)return base;const prefix=affixes.find(a=>prefixes.includes(a))?.label,suffix=affixes.find(a=>suffixes.includes(a))?.label;return [prefix,base,suffix].filter(Boolean).join(' ');}
export function affixDamageMultiplier(stack:Stack|undefined){if(!stack)return 1;const bonus=ensureItemAffixes(stack).reduce((n,a)=>n+(a.damage??0),0);return Math.min(1.13,1+bonus);}
export function affixSummary(stack:Stack){const a=ensureItemAffixes(stack);return a.length?a.map(x=>`${x.label} · ${x.note}`).join(' | '):'No magical nonsense detected.';}
export function bestEquippedStack(inventory:Stack[],item:ItemId|null){if(!item)return undefined;return inventory.filter(s=>s.item===item).sort((a,b)=>(b.quality??1)-(a.quality??1)||a.id.localeCompare(b.id))[0];}
