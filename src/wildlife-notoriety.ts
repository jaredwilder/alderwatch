import type {AnimalKind,AnimalState} from './wildlife-species';

export type AnimalAct='wild_kill'|'livestock_kill'|'attack_person'|'kill_person'|'airlift';
export const WANTED_NOTORIETY=20;
const EFFECTS:Record<AnimalAct,{karma:number;notoriety:number}>={
 wild_kill:{karma:-1,notoriety:4},
 livestock_kill:{karma:-8,notoriety:14},
 attack_person:{karma:-4,notoriety:6},
 kill_person:{karma:-15,notoriety:20},
 airlift:{karma:-5,notoriety:10},
};
const EPITHETS:Record<AnimalKind,readonly string[]>={
 hare:['the Garden Defendant','the Suspiciously Fast'],crow:['the Crop Inspector','the Blackmail Department'],
 goat:['the Fence Appellant','the Headbutt Solicitor'],sheep:['the Wool Dissident','the Pasture Radical'],deer:['the Hedgerow Fugitive','the Orchard Trespasser'],
 bear:['the Picnic Magistrate','the Forester’s Problem','the Honey Taxman'],bison:['the Fence Inspector','the Cart Abolisher','the Several-Hundred-Kilo Complaint'],
 wolf:['the Mutton Auditor','the Wool Collector','the Dinner Committee'],eagle:['the Bunny Helicopter','the Airborne Larcenist','the Mutton Aviation Authority'],
};
function hash(id:string){let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return h>>>0;}
export function ensureAnimalNotoriety(a:AnimalState){a.wildKarma=Number.isFinite(a.wildKarma)?a.wildKarma:0;a.notoriety=Number.isFinite(a.notoriety)?a.notoriety:0;a.misdeeds??={};return a;}
export function isWantedAnimal(a:AnimalState){ensureAnimalNotoriety(a);return !a.bountyClaimed&&(a.notoriety??0)>=WANTED_NOTORIETY;}
export function animalEpithet(a:AnimalState){ensureAnimalNotoriety(a);if(!a.epithet)a.epithet=EPITHETS[a.kind][hash(a.id)%EPITHETS[a.kind].length];return a.epithet;}
export function animalDisplayName(a:AnimalState){const kind=a.kind[0].toUpperCase()+a.kind.slice(1);return isWantedAnimal(a)?`${kind}, ${animalEpithet(a)}`:kind;}
export function wildKarmaTitle(value:number){if(value<=-40)return 'Feral Menace';if(value<=-20)return 'Notorious';if(value<=-5)return 'Shady Animal';if(value>=20)return 'Woodland Saint';if(value>=5)return 'Good Creature';return 'Just An Animal';}
export function animalBountyCrowns(a:AnimalState){ensureAnimalNotoriety(a);return Math.min(60,10+Math.floor((a.notoriety??0)/10)*5);}
export function recordAnimalAct(a:AnimalState,act:AnimalAct,tick:number){ensureAnimalNotoriety(a);const wasWanted=isWantedAnimal(a),effect=EFFECTS[act];a.wildKarma=Math.max(-100,Math.min(100,(a.wildKarma??0)+effect.karma));a.notoriety=Math.max(0,Math.min(100,(a.notoriety??0)+effect.notoriety));a.misdeeds![act]=(a.misdeeds![act]??0)+1;const wanted=isWantedAnimal(a);if(wanted&&!wasWanted){a.wantedSince=tick;animalEpithet(a);}return {becameWanted:wanted&&!wasWanted,wanted,karma:a.wildKarma!,notoriety:a.notoriety!};}
export function mostWanted(animals:Record<string,AnimalState>){return Object.values(animals).filter(isWantedAnimal).sort((a,b)=>(b.notoriety??0)-(a.notoriety??0)||a.id.localeCompare(b.id));}
