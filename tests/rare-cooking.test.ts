import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addItem,LocalAuthority,makePlayer,quantity,seedState,type ItemId} from '../src/state';
import {FOOD,RECIPES,stats} from '../src/definitions';
import {killAnimal,rareLootHit,corpseId} from '../src/wildlife-rules';
import {species,type AnimalKind,type AnimalState} from '../src/wildlife-species';

const kinds:AnimalKind[]=['hare','crow','goat','sheep','deer','bear','bison','wolf','eagle'];
const rareRecipes:Record<AnimalKind,[ItemId,ItemId]>={
 hare:['hare_saddle','moonlit_hare'],crow:['crow_breast','blackwing_roast'],goat:['goat_tenderloin','highland_goat_roast'],sheep:['mutton_rack','golden_mutton_rack'],deer:['hart_tenderloin','kings_hart'],bear:['bear_rib','old_bear_rib'],bison:['bison_hump','great_bison_feast'],wolf:['wolf_loin','night_wolf_loin'],eagle:['eagle_breast','eagle_crown_roast'],
};
const expandedMeals:ItemId[]=['hare_pottage','crow_blackpot','goat_stew','mutton_stew','venison_berry_roast','bear_pottage','bison_stew','wolf_broth','eagle_broth','hunter_platter','frontier_mixed_grill','predator_stew'];

function animal(kind:AnimalKind,id:string):AnimalState{return {id,kind,position:[0,0,0],home:[0,0,0],yaw:0,phase:0};}
function findRoll(kind:AnimalKind,want:boolean){
 const world=seedState();world.worldSeed=90210;const profile=species(kind).rareLoot!;
 for(let i=0;i<1000;i++){const a=animal(kind,`${kind}-rare-roll-${i}`);if(rareLootHit(world,a,profile.oneIn)===want)return {world,a};}
 throw new Error(`No deterministic ${want?'hit':'miss'} found for ${kind}`);
}

test('rare cut rolls are deterministic and persist in carcass loot',()=>{
 for(const kind of kinds){
  const profile=species(kind).rareLoot;assert.ok(profile,`${kind} should define rare loot`);assert.ok(profile.oneIn>=6,`${kind} rare drop should remain meaningfully rare`);
  const hit=findRoll(kind,true);assert.equal(rareLootHit(hit.world,hit.a,profile.oneIn),true);assert.equal(rareLootHit(hit.world,hit.a,profile.oneIn),true);
  assert.equal(killAnimal(hit.world,hit.a,'player'),true);const rare=hit.world.containers[corpseId(hit.a.id)].inventory.find(s=>s.item===profile.item);assert.equal(rare?.count,profile.count);assert.equal(rare?.quality,2);
  const miss=findRoll(kind,false);assert.equal(killAnimal(miss.world,miss.a,'player'),true);assert.equal(miss.world.containers[corpseId(miss.a.id)].inventory.some(s=>s.item===profile.item),false);
 }
});

test('every rare species cut feeds one named rare campfire feast',()=>{
 for(const kind of kinds){
  const [cut,meal]=rareRecipes[kind],profile=species(kind).rareLoot!;assert.equal(profile.item,cut);
  const recipe=RECIPES.find(r=>r.id===meal);assert.ok(recipe,`${meal} recipe missing`);assert.equal(recipe.station,'campfire');assert.equal(recipe.output,meal);assert.equal(recipe.cost[cut],1);assert.ok(FOOD[meal],`${meal} needs a food effect`);
 }
});

test('expanded cooking adds species pots and multi-meat feasts with real buffs',()=>{
 for(const meal of expandedMeals){const recipe=RECIPES.find(r=>r.output===meal);assert.ok(recipe,`${meal} recipe missing`);assert.equal(recipe.station,'campfire');const food=FOOD[meal];assert.ok(food,`${meal} food effect missing`);assert.ok(food.health+food.stamina>=40,`${meal} should be stronger than forage`);}
 assert.ok(RECIPES.length>=35,'cooking expansion should remain substantial');
});

test('a rare cut can be cooked and eaten through the authority path',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[...a.state.stations['alderbrook-fire'].position];
 const recipe=RECIPES.find(r=>r.id==='great_bison_feast')!;
 for(const [item,count] of Object.entries(recipe.cost))addItem(a.state,p,item as ItemId,count!);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:recipe.id,stationId:'alderbrook-fire'}).ok,true);assert.equal(quantity(p,'great_bison_feast'),1);
 const before=stats(p);assert.equal(a.dispatch({type:'eat',playerId:p.id,item:'great_bison_feast'}).ok,true);const after=stats(p);assert.equal(after.health-before.health,65);assert.equal(after.stamina-before.stamina,65);
});

test('all new collectible cuts and dishes are wired to the expanded visual atlas',()=>{
 const source=readFileSync(new URL('../src/item-icons.ts',import.meta.url),'utf8'),atlas=readFileSync(new URL('../public/assets/ui/rare-food-icons.svg',import.meta.url),'utf8');
 for(const [cut,meal] of Object.values(rareRecipes)){assert.match(source,new RegExp(`${cut}:\\[`));assert.match(source,new RegExp(`${meal}:\\[`));}
 for(const meal of expandedMeals)assert.match(source,new RegExp(`${meal}:\\[`));
 assert.match(source,/rare-food-icons\.svg/);assert.match(atlas,/width="600" height="500"/);assert.match(atlas,/id="rarecut"/);assert.match(atlas,/id="feast"/);
});
