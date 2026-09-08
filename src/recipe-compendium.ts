import {RECIPES,type Recipe} from './definitions';
import {EXPANDED_RECIPE_IDS,registerCraftingExpansion} from './crafting-expansion';
import type {ItemId,PlayerState,WorldState} from './state';

registerCraftingExpansion();

export type RecipeCategory='hearth'|'cookhouse'|'provisioning'|'processing'|'tools'|'trophy'|'banquet';
export type RecipeRarity='common'|'uncommon'|'rare'|'masterwork';

const PROCESSING_OUTPUTS=new Set<ItemId>(['charcoal','cordage','resin_pitch','waxed_cord','leather_strap','iron_fittings','frontier_spice']);
const TOOL_OUTPUTS=new Set<ItemId>(['axe','pickaxe','hammer','sword','fine_sword','bow']);
const TROPHY_IDS=new Set(['moonlit_hare','blackwing_roast','highland_goat_roast','golden_mutton_rack','kings_hart','old_bear_rib','great_bison_feast','night_wolf_loin','eagle_crown_roast']);
const BIG_FEAST_IDS=new Set(['hunter_platter','frontier_mixed_grill','predator_stew']);
const FORAGER_IDS=new Set(['woodland_broth','crow_milk','garlic_mushrooms','juniper_tonic','truffle_broth']);

export function recipeCategory(recipe:Recipe):RecipeCategory{
 if(recipe.id.includes('banquet'))return 'banquet';
 if(TROPHY_IDS.has(recipe.id))return 'trophy';
 if(TOOL_OUTPUTS.has(recipe.output))return 'tools';
 if(PROCESSING_OUTPUTS.has(recipe.output))return 'processing';
 if(EXPANDED_RECIPE_IDS.has(recipe.id)||BIG_FEAST_IDS.has(recipe.id))return 'provisioning';
 if(FORAGER_IDS.has(recipe.id))return 'hearth';
 return 'cookhouse';
}

export function recipeRarity(recipe:Recipe):RecipeRarity{
 if(recipe.id.includes('banquet')||recipe.id==='tempered_sword_commission')return 'masterwork';
 if(TROPHY_IDS.has(recipe.id)||recipe.id==='truffle_broth'||recipe.id==='truffle_broth_service')return 'rare';
 if(EXPANDED_RECIPE_IDS.has(recipe.id)||BIG_FEAST_IDS.has(recipe.id)||recipe.id==='fine_sword')return 'uncommon';
 return 'common';
}

export const CATEGORY_LABELS:Record<RecipeCategory,string>={
 hearth:'Forager’s Hearth',cookhouse:'Camp Cookery',provisioning:'Provisioning',processing:'Materials & Processing',tools:'Tools & Smithing',trophy:'Trophy Table',banquet:'Master Banquets',
};
export const RARITY_LABELS:Record<RecipeRarity,string>={common:'Common',uncommon:'Journeyman',rare:'Rare',masterwork:'Masterwork'};

export function recipeMastered(world:WorldState,recipe:Recipe){return world.progress.includes('crafted-'+recipe.id);}
export function prerequisiteRecipe(recipe:Recipe){
 if(!recipe.requires?.startsWith('crafted-'))return undefined;
 const id=recipe.requires.slice('crafted-'.length);return RECIPES.find(r=>r.id===id);
}
export function recipeKnown(world:WorldState,recipe:Recipe){return !recipe.requires||world.progress.includes(recipe.requires);}
export function recipeOwned(player:PlayerState,item:string){return player.inventory.filter(s=>s.item===item).reduce((sum,s)=>sum+s.count,0);}
export function recipeReady(world:WorldState,player:PlayerState,recipe:Recipe){return recipeKnown(world,recipe)&&Object.entries(recipe.cost).every(([item,count])=>recipeOwned(player,item)>=count);}

export interface RecipeBookStats {total:number;known:number;mastered:number;ready:number;percent:number;masterwork:number;}
export function recipeBookStats(world:WorldState,player:PlayerState):RecipeBookStats{
 const total=RECIPES.length,known=RECIPES.filter(r=>recipeKnown(world,r)).length,mastered=RECIPES.filter(r=>recipeMastered(world,r)).length,ready=RECIPES.filter(r=>recipeReady(world,player,r)).length,masterwork=RECIPES.filter(r=>recipeRarity(r)==='masterwork'&&recipeMastered(world,r)).length;
 return {total,known,mastered,ready,percent:total?Math.round(mastered/total*100):0,masterwork};
}

export interface RecipeCollection {id:string;name:string;description:string;recipeIds:readonly string[];}
export const RECIPE_COLLECTIONS:readonly RecipeCollection[]=[
 {id:'working-hearth',name:'The Working Hearth',description:'Foraged broths, mushrooms, tonic, and the first rare truffle service.',recipeIds:['woodland_broth','garlic_mushrooms','juniper_tonic','truffle_broth','woodland_broth_kettle','garlic_mushroom_skillet','hunters_tonic_crock','truffle_broth_service']},
 {id:'nine-hunts',name:'The Nine Hunts',description:'Master a signature basic meal from every huntable Alderwatch species.',recipeIds:['roasted_hare','crow_skewer','herbed_goat','hearth_mutton','grilled_venison','bear_steak','bison_roast','smoked_wolf','eagle_roast']},
 {id:'blackwood-pot',name:'The Blackwood Cookpot',description:'The deep-pantry species stews, pottages, glazes, and broths.',recipeIds:['hare_pottage','crow_blackpot','goat_stew','mutton_stew','venison_berry_roast','bear_pottage','bison_stew','wolf_broth','eagle_broth']},
 {id:'provisioner',name:'Provisioner’s Bench',description:'Base processing plus the efficient bulk methods that turn gathering into industry.',recipeIds:['charcoal','resin_pitch','frontier_spice','cordage','waxed_cord','leather_strap','iron_fittings','colliers_long_burn','ropemakers_long_twist','pitch_kettle','chandlers_cord_batch','tanners_strap_bundle','smiths_fittings_batch','provisioners_spice_satchel']},
 {id:'road-table',name:'The Road Table',description:'Master the three multi-animal feasts, then learn to feed a whole expedition.',recipeIds:['hunter_platter','frontier_mixed_grill','predator_stew','hunters_table_service','mixed_grill_service','predator_stew_cauldron']},
 {id:'trophy-table',name:'The Trophy Table',description:'Nine rare cuts. Nine signature dishes. No substitutions.',recipeIds:['moonlit_hare','blackwing_roast','highland_goat_roast','golden_mutton_rack','kings_hart','old_bear_rib','great_bison_feast','night_wolf_loin','eagle_crown_roast']},
 {id:'master-banquet',name:'Quartermaster’s Banquet',description:'Master every rare feast twice over by learning the banquet carve.',recipeIds:['moonlit_hare_banquet','blackwing_banquet','highland_goat_banquet','golden_mutton_banquet','kings_hart_banquet','old_bear_banquet','great_bison_banquet','night_wolf_banquet','eagle_crown_banquet']},
 {id:'tools-march',name:'Tools of the March',description:'Forge, replace, and eventually stock the working tools and weapons of a settlement.',recipeIds:['sword','fine_sword','iron_axe','mining_pick','builders_hammer','hunter_bow','woodsman_axe_pair','miners_pick_pair','builders_hammer_pair','hunters_bow_pair','marcher_sword_stock','tempered_sword_commission']},
] as const;

export function collectionProgress(world:WorldState,collection:RecipeCollection){
 const mastered=collection.recipeIds.filter(id=>world.progress.includes('crafted-'+id)).length;
 return {mastered,total:collection.recipeIds.length,complete:mastered===collection.recipeIds.length};
}

export function masteryRank(mastered:number){
 if(mastered>=80)return 'Master of the Alderwatch Table';
 if(mastered>=60)return 'March Quartermaster';
 if(mastered>=40)return 'Master Provisioner';
 if(mastered>=25)return 'Camp Cook';
 if(mastered>=10)return 'Apprentice Provisioner';
 return 'Recipe Scratcher';
}

export function recipeHint(recipe:Recipe){
 const prerequisite=prerequisiteRecipe(recipe);if(prerequisite)return `Master ${prerequisite.name} first.`;
 const category=recipeCategory(recipe);if(category==='trophy')return 'A rare animal cut makes this possible.';
 if(category==='processing')return 'Process gathered frontier materials at the correct station.';
 if(category==='tools')return 'Workbench craft · keep timber, iron work, straps, and pitch stocked.';
 return recipe.station==='campfire'?'Campfire recipe · gather, hunt, and cook.':'Workbench recipe.';
}
