import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../src/crafting-expansion';
import {RECIPES} from '../src/definitions';
import {EXPANDED_RECIPES,EXPANDED_RECIPE_IDS,registerCraftingExpansion} from '../src/crafting-expansion';
import {CATEGORY_LABELS,RECIPE_COLLECTIONS,collectionProgress,masteryRank,prerequisiteRecipe,recipeBookStats,recipeCategory,recipeKnown,recipeMastered,recipeRarity,recipeReady} from '../src/recipe-compendium';
import {LocalAuthority,addItem,makePlayer,quantity} from '../src/state';

function realm(){const authority=new LocalAuthority(),player=makePlayer('Artisan');authority.state.players[player.id]=player;return {authority,player};}

test('crafting expansion is a whole mastery layer with unique authoritative recipes',()=>{
 registerCraftingExpansion();assert.ok(EXPANDED_RECIPES.length>=45,'expected a game-sized follow-up recipe layer');assert.ok(RECIPES.length>=85,'base + mastery recipes should form a substantial book');
 const ids=RECIPES.map(r=>r.id);assert.equal(new Set(ids).size,ids.length,'recipe IDs must stay globally unique');
 for(const recipe of EXPANDED_RECIPES){assert.ok(EXPANDED_RECIPE_IDS.has(recipe.id));assert.ok(recipe.requires?.startsWith('crafted-'),recipe.id+' should be mastery-gated');assert.ok(prerequisiteRecipe(recipe),recipe.id+' prerequisite must resolve to a real base recipe');assert.ok(recipe.count>=2,recipe.id+' should reward mastery with batch output');}
});

test('bulk production genuinely improves throughput after mastering the base method',()=>{
 const base=RECIPES.find(r=>r.id==='charcoal')!,bulk=RECIPES.find(r=>r.id==='colliers_long_burn')!;assert.ok((base.cost.wood??0)/base.count>(bulk.cost.wood??0)/bulk.count);
 const baseSpice=RECIPES.find(r=>r.id==='frontier_spice')!,satchel=RECIPES.find(r=>r.id==='provisioners_spice_satchel')!;assert.ok((baseSpice.cost.wild_garlic??0)/baseSpice.count>(satchel.cost.wild_garlic??0)/satchel.count);
});

test('authority refuses a mastery recipe until its prerequisite was actually crafted',()=>{
 const {authority,player}=realm(),fire=authority.state.stations['alderbrook-fire'];player.position=[...fire.position];addItem(authority.state,player,'wood',8);
 assert.equal(authority.dispatch({type:'craft',playerId:player.id,recipeId:'colliers_long_burn',stationId:fire.id}).ok,false);assert.equal(quantity(player,'charcoal'),0);
 authority.state.progress.push('crafted-charcoal');assert.equal(authority.dispatch({type:'craft',playerId:player.id,recipeId:'colliers_long_burn',stationId:fire.id}).ok,true);assert.equal(quantity(player,'charcoal'),10);assert.ok(authority.state.progress.includes('crafted-colliers_long_burn'));
});

test('rare banquet progression turns one mastered trophy cut into two servings only after the signature dish',()=>{
 const {authority,player}=realm(),fire=authority.state.stations['alderbrook-fire'],recipe=RECIPES.find(r=>r.id==='kings_hart_banquet')!;player.position=[...fire.position];
 assert.equal(recipeKnown(authority.state,recipe),false);authority.state.progress.push('crafted-kings_hart');assert.equal(recipeKnown(authority.state,recipe),true);assert.equal(recipeRarity(recipe),'masterwork');assert.equal(recipeCategory(recipe),'banquet');
 for(const [item,count] of Object.entries(recipe.cost))addItem(authority.state,player,item as any,count);assert.equal(recipeReady(authority.state,player,recipe),true);assert.equal(authority.dispatch({type:'craft',playerId:player.id,recipeId:recipe.id,stationId:fire.id}).ok,true);assert.equal(quantity(player,'kings_hart'),2);
});

test('recipe book statistics and mastery rank are derived from persisted crafted flags',()=>{
 const {authority,player}=realm();const before=recipeBookStats(authority.state,player);assert.equal(before.mastered,0);assert.ok(before.total>=85);for(const recipe of RECIPES.slice(0,26))authority.state.progress.push('crafted-'+recipe.id);const after=recipeBookStats(authority.state,player);assert.equal(after.mastered,26);assert.equal(masteryRank(after.mastered),'Camp Cook');assert.ok(after.percent>0);assert.ok(recipeMastered(authority.state,RECIPES[0]));
});

test('the compendium has meaningful collection shelves across the entire economy',()=>{
 const {authority}=realm();assert.ok(RECIPE_COLLECTIONS.length>=8);const labels=new Set(Object.values(CATEGORY_LABELS));for(const collection of RECIPE_COLLECTIONS){assert.ok(collection.recipeIds.length>=6,collection.id);for(const id of collection.recipeIds)assert.ok(RECIPES.some(r=>r.id===id),`${collection.id}: ${id}`);const empty=collectionProgress(authority.state,collection);assert.equal(empty.mastered,0);for(const id of collection.recipeIds)authority.state.progress.push('crafted-'+id);assert.equal(collectionProgress(authority.state,collection).complete,true);}assert.ok(labels.has('Master Banquets'));assert.ok(labels.has('Materials & Processing'));
});

test('recipe book UI exposes visual browsing, ready filters, collections and mastery status',()=>{
 const source=readFileSync('src/recipe-book-ui.ts','utf8');for(const token of ['📖 Recipe Book','Ready now','Trophy','Banquets','book-collections','book-progress','MASTERWORK','aw-item-icon'])assert.ok(source.includes(token),token);
});
