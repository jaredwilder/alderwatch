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

export function ensureSkills(player:PlayerState){
 player.skills??={};
 for(const id of SKILL_ORDER)if(!Number.isFinite(player.skills[id]))player.skills[id]=0;
 return player.skills as Record<string,number>;
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
