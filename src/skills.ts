import './gfx-release-gate';
import './wildlife-stories';
import type {ItemId,PlayerState} from './state';

export type SkillId='archery'|'swordsmanship'|'axemanship'|'tactics'|'lumberjacking'|'mining'|'foraging'|'cooking'|'blacksmithing'|'carpentry'|'camping';
export interface SkillDefinition {name:string;profession:string;description:string}

export const SKILLS:Record<SkillId,SkillDefinition>={
 archery:{name:'Archery',profession:'Bowman',description:'Loose arrows true under pressure.'},
 swordsmanship:{name:'Swordsmanship',profession:'Swordsman',description:'Fight with swords and tempered blades.'},
 axemanship:{name:'Axemanship',profession:'Axeman',description:'Use an axe as both tool and weapon.'},
 tactics:{name:'Tactics',profession:'Tactician',description:'Land real blows in dangerous fights.'},
 lumberjacking:{name:'Lumberjacking',profession:'Lumberjack',description:'Work mature timber with an axe.'},
 mining:{name:'Mining',profession:'Miner',description:'Break stone and expose useful ore.'},
 foraging:{name:'Foraging',profession:'Forager',description:'Gather useful plants from the wild.'},
 cooking:{name:'Cooking',profession:'Cook',description:'Prepare food at a fire.'},
 blacksmithing:{name:'Blacksmithing',profession:'Smith',description:'Make practical weapons and equipment.'},
 carpentry:{name:'Carpentry',profession:'Carpenter',description:'Raise foundations, walls and useful structures.'},
 camping:{name:'Camping',profession:'Camper',description:'Make use of a safe fire in the wilderness.'},
};
export const SKILL_ORDER:readonly SkillId[]=['archery','swordsmanship','axemanship','tactics','lumberjacking','mining','foraging','cooking','blacksmithing','carpentry','camping'];

export const SKILL_GAIN=.1;
export const SKILL_CAP=100;
const roundTenth=(value:number)=>Math.round(value*10)/10;
const clampSkill=(value:number)=>roundTenth(Math.max(0,Math.min(SKILL_CAP,value)));

export function ensureSkills(player:PlayerState){
 player.skills??={};
 for(const id of SKILL_ORDER)if(!Number.isFinite(player.skills[id]))player.skills[id]=0;
 return player.skills as Record<string,number>;
}
/**
 * PR #29 briefly coexisted with Alderwatch's old integer counters. That made one
 * cooked meal read as +1.1 instead of +0.1. Existing saves with those legacy
 * keys are converted once: old action counts become tenths and generic counters
 * are folded into their new named UO-style skills.
 */
export function migrateLegacySkills(player:PlayerState){
 const skills=player.skills??={};
 const legacy=['combat','gathering','crafting','building'].some(id=>Number.isFinite(skills[id]));
 if(!legacy){ensureSkills(player);return false;}
 const tenths=(value:number|undefined)=>clampSkill((Number.isFinite(value)?value!:0)*.1);
 skills.tactics=Math.max(Number.isFinite(skills.tactics)?skills.tactics:0,tenths(skills.combat));
 skills.foraging=Math.max(Number.isFinite(skills.foraging)?skills.foraging:0,tenths(skills.gathering));
 skills.blacksmithing=Math.max(Number.isFinite(skills.blacksmithing)?skills.blacksmithing:0,tenths(skills.crafting));
 skills.carpentry=Math.max(Number.isFinite(skills.carpentry)?skills.carpentry:0,tenths(skills.building));
 // `cooking` kept the same key name during the transition, so it needs the same
 // count -> tenths conversion while the legacy marker keys are still present.
 skills.cooking=tenths(skills.cooking);
 delete skills.combat;delete skills.gathering;delete skills.crafting;delete skills.building;
 ensureSkills(player);return true;
}
export function gainSkill(player:PlayerState,id:SkillId,amount=SKILL_GAIN){
 const skills=ensureSkills(player),before=Math.max(0,Math.min(SKILL_CAP,skills[id]??0)),after=roundTenth(Math.min(SKILL_CAP,before+amount));
 skills[id]=after;return {id,before,after,gained:after>before};
}
export function combatSkillFor(item:ItemId|null|undefined):SkillId|undefined{
 if(item==='bow')return 'archery';
 if(item==='sword'||item==='fine_sword')return 'swordsmanship';
 if(item==='axe')return 'axemanship';
 return undefined;
}
export function skillRank(value:number){
 if(value>=100)return 'Grandmaster';
 if(value>=90)return 'Master';
 if(value>=80)return 'Adept';
 if(value>=70)return 'Expert';
 if(value>=60)return 'Journeyman';
 if(value>=50)return 'Skilled';
 if(value>=40)return 'Apprentice';
 if(value>=20)return 'Neophyte';
 return 'Novice';
}
export function skillTitle(id:SkillId,value:number){return `${skillRank(value)} ${SKILLS[id].profession}`;}
export function bestSkill(player:PlayerState){
 const skills=ensureSkills(player);let id:SkillId=SKILL_ORDER[0];
 for(const candidate of SKILL_ORDER)if((skills[candidate]??0)>(skills[id]??0))id=candidate;
 return {id,value:skills[id]??0};
}
export function characterTitle(player:PlayerState){const top=bestSkill(player);return top.value>0?skillTitle(top.id,top.value):`${player.archetype} of the Far March`;}
