import type {AnimalKind,AnimalState} from './wildlife-species';

export type AnimalAct='wild_kill'|'livestock_kill'|'attack_person'|'kill_person'|'airlift';
export type WildTraitId='ancient'|'dire'|'albino'|'massive'|'scarred'|'cunning';
export interface WildTraitProfile {id:WildTraitId;prefix:string;health:number;scale:number;lootQuality:number;bounty:number;description:string}
export const WANTED_NOTORIETY=20;
const EFFECTS:Record<AnimalAct,{karma:number;notoriety:number}>={
 wild_kill:{karma:-1,notoriety:4},livestock_kill:{karma:-8,notoriety:14},attack_person:{karma:-4,notoriety:6},kill_person:{karma:-15,notoriety:20},airlift:{karma:-5,notoriety:10},
};
const EPITHETS:Record<AnimalKind,readonly string[]>={
 hare:['the Garden Defendant','the Suspiciously Fast'],rabbit:['the Lettuce Litigator','the Hedge Tunnel Inspector'],crow:['the Crop Inspector','the Blackmail Department'],
 goat:['the Fence Appellant','the Headbutt Solicitor'],sheep:['the Wool Dissident','the Pasture Radical'],deer:['the Hedgerow Fugitive','the Orchard Trespasser'],stag:['the Antlered Trespass Notice','the Orchard Duke'],
 boar:['the Rootwork Contractor','the Turnip Demolition Crew'],fox:['the Henhouse Consultant','the Red-Furred Solicitor'],
 bear:['the Picnic Magistrate','the Forester’s Problem','the Honey Taxman'],bison:['the Fence Inspector','the Cart Abolisher','the Several-Hundred-Kilo Complaint'],
 wolf:['the Mutton Auditor','the Wool Collector','the Dinner Committee'],eagle:['the Bunny Helicopter','the Airborne Larcenist','the Mutton Aviation Authority'],
};
export const WILD_TRAITS:Record<WildTraitId,WildTraitProfile>={
 ancient:{id:'ancient',prefix:'Ancient',health:1.55,scale:1.12,lootQuality:1.45,bounty:20,description:'Old enough to have opinions about the road.'},
 dire:{id:'dire',prefix:'Dire',health:1.4,scale:1.1,lootQuality:1.38,bounty:16,description:'Larger, meaner and clearly promoted without oversight.'},
 albino:{id:'albino',prefix:'Pale',health:1.18,scale:1.04,lootQuality:1.32,bounty:12,description:'Rare coloration. The Wildkeepers are already writing it down.'},
 massive:{id:'massive',prefix:'Massive',health:1.5,scale:1.16,lootQuality:1.4,bounty:18,description:'The normal size chart has been politely ignored.'},
 scarred:{id:'scarred',prefix:'Scarred',health:1.32,scale:1.06,lootQuality:1.3,bounty:14,description:'Has survived enough bad ideas to become one.'},
 cunning:{id:'cunning',prefix:'Cunning',health:1.24,scale:1.03,lootQuality:1.28,bounty:12,description:'Looks at fences like they are suggestions.'},
};
function hash(id:string){let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return h>>>0;}
type PersonaAnimal=AnimalState&{wildTrait?:WildTraitId|null;eliteApplied?:boolean};
export function ensureWildTrait(a:AnimalState){const x=a as PersonaAnimal;if(x.wildTrait===undefined){const h=hash(a.id),denom=a.kind==='hare'||a.kind==='crow'?19:a.kind==='wolf'||a.kind==='bear'||a.kind==='eagle'?7:11;x.wildTrait=h%denom===0?(Object.keys(WILD_TRAITS) as WildTraitId[])[Math.floor(h/denom)%Object.keys(WILD_TRAITS).length]:null;}return x.wildTrait?WILD_TRAITS[x.wildTrait]:undefined;}
export function ensureAnimalNotoriety(a:AnimalState){a.wildKarma=Number.isFinite(a.wildKarma)?a.wildKarma:0;a.notoriety=Number.isFinite(a.notoriety)?a.notoriety:0;a.misdeeds??={};ensureWildTrait(a);return a;}
export function isWantedAnimal(a:AnimalState){ensureAnimalNotoriety(a);return !a.bountyClaimed&&(a.notoriety??0)>=WANTED_NOTORIETY;}
export function animalEpithet(a:AnimalState){ensureAnimalNotoriety(a);if(!a.epithet)a.epithet=EPITHETS[a.kind][hash(a.id)%EPITHETS[a.kind].length];return a.epithet;}
export function animalDisplayName(a:AnimalState){ensureAnimalNotoriety(a);const kind=a.kind[0].toUpperCase()+a.kind.slice(1),trait=ensureWildTrait(a),base=trait?`${trait.prefix} ${kind}`:kind,earnedName=(a.notoriety??0)>=WANTED_NOTORIETY||!!a.epithet;return earnedName?`${base}, ${animalEpithet(a)}`:base;}
export function wildKarmaTitle(value:number){if(value<=-40)return 'Feral Menace';if(value<=-20)return 'Notorious';if(value<=-5)return 'Shady Animal';if(value>=20)return 'Woodland Saint';if(value>=5)return 'Good Creature';return 'Just An Animal';}
export function animalBountyCrowns(a:AnimalState){ensureAnimalNotoriety(a);return Math.min(90,10+Math.floor((a.notoriety??0)/10)*5+(ensureWildTrait(a)?.bounty??0));}
export function recordAnimalAct(a:AnimalState,act:AnimalAct,tick:number){ensureAnimalNotoriety(a);const wasWanted=isWantedAnimal(a),effect=EFFECTS[act],swagger=ensureWildTrait(a)?1.15:1;a.wildKarma=Math.max(-100,Math.min(100,(a.wildKarma??0)+effect.karma));a.notoriety=Math.max(0,Math.min(100,(a.notoriety??0)+effect.notoriety*swagger));a.misdeeds![act]=(a.misdeeds![act]??0)+1;const wanted=isWantedAnimal(a);if(wanted&&!wasWanted){a.wantedSince=tick;animalEpithet(a);}return {becameWanted:wanted&&!wasWanted,wanted,karma:a.wildKarma!,notoriety:a.notoriety!};}
export function mostWanted(animals:Record<string,AnimalState>){return Object.values(animals).filter(isWantedAnimal).sort((a,b)=>(b.notoriety??0)-(a.notoriety??0)||a.id.localeCompare(b.id));}
