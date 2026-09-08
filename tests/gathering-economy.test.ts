import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addItem,LocalAuthority,makePlayer,quantity,seedState,type ItemId} from '../src/state';
import {FOOD,RECIPES,stats} from '../src/definitions';
import {seedGatheringEconomy,SPECIAL_GATHERABLES} from '../src/gathering-economy';

const economyItems:ItemId[]=['wild_garlic','juniper','sage','truffle','pine_resin','beeswax','charcoal','cordage','resin_pitch','waxed_cord','leather_strap','iron_fittings','frontier_spice','garlic_mushrooms','juniper_tonic','truffle_broth'];
const rareMeals:ItemId[]=['moonlit_hare','blackwing_roast','highland_goat_roast','golden_mutton_rack','kings_hart','old_bear_rib','great_bison_feast','night_wolf_loin','eagle_crown_roast'];

test('special forage seeds deterministically, additively, and keeps truffles scarce',()=>{
 const world=seedState(),nodes=Object.values(world.forage).filter(f=>f.id.startsWith('nature-economy-'));
 assert.ok(nodes.length>=35,'special forage layer should be substantial');
 for(const item of SPECIAL_GATHERABLES)assert.ok(nodes.some(f=>f.item===item),`${item} should exist in the world`);
 const truffles=nodes.filter(f=>f.item==='truffle').length,garlic=nodes.filter(f=>f.item==='wild_garlic').length;
 assert.ok(truffles>0&&truffles<garlic,'truffles should be meaningfully rarer than common seasoning forage');
 const remembered=nodes[0];remembered.harvested=true;remembered.readyAt=123456;seedGatheringEconomy(world);assert.equal(world.forage[remembered.id].readyAt,123456,'seeding must not reroll or reset persisted forage state');
});

test('special forage harvests the economy item while reusing stable world plant visuals',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;const truffle=Object.values(a.state.forage).find(f=>f.item==='truffle')!;assert.ok(truffle);assert.equal(truffle.kind,'mushroom');p.position=[...truffle.position];
 assert.equal(a.dispatch({type:'forage',playerId:p.id,forageId:truffle.id}).ok,true);assert.equal(quantity(p,'truffle'),1);assert.equal(truffle.harvested,true);assert.equal(truffle.readyAt,a.state.tick+60*1200);assert.equal(a.dispatch({type:'forage',playerId:p.id,forageId:truffle.id}).ok,false);
});

test('honey harvest now cross-feeds crafting with beeswax',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;a.state.forage.testHive={id:'testHive',kind:'wild_honey',position:[0,0,0],harvested:false};p.position=[0,0,0];
 assert.equal(a.dispatch({type:'forage',playerId:p.id,forageId:'testHive'}).ok,true);assert.equal(quantity(p,'wild_honey'),1);assert.equal(quantity(p,'beeswax'),1);assert.equal(a.state.forage.testHive.readyAt,a.state.tick+60*600);
});

test('gathered resources process through campfire and workbench into replacement gear materials',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[...a.state.stations['alderbrook-fire'].position];
 addItem(a.state,p,'wood',4);addItem(a.state,p,'pine_resin',1);addItem(a.state,p,'wild_garlic',1);addItem(a.state,p,'juniper',1);addItem(a.state,p,'sage',1);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'charcoal',stationId:'alderbrook-fire'}).ok,true);assert.equal(quantity(p,'charcoal'),2);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'resin_pitch',stationId:'alderbrook-fire'}).ok,true);assert.equal(quantity(p,'resin_pitch'),1);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'frontier_spice',stationId:'alderbrook-fire'}).ok,true);assert.equal(quantity(p,'frontier_spice'),2);
 p.position=[...a.state.stations['alderbrook-bench'].position];addItem(a.state,p,'fiber',3);addItem(a.state,p,'hide',1);addItem(a.state,p,'beeswax',2);addItem(a.state,p,'iron',3);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'cordage',stationId:'alderbrook-bench'}).ok,true);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'waxed_cord',stationId:'alderbrook-bench'}).ok,true);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'leather_strap',stationId:'alderbrook-bench'}).ok,true);assert.equal(quantity(p,'leather_strap'),2);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'iron_fittings',stationId:'alderbrook-bench'}).ok,true);assert.equal(quantity(p,'iron_fittings'),2);
 addItem(a.state,p,'wood',2);const bows=quantity(p,'bow');assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'hunter_bow',stationId:'alderbrook-bench'}).ok,true);assert.equal(quantity(p,'bow'),bows+1);
 for(const id of ['iron_axe','mining_pick','builders_hammer','hunter_bow'])assert.ok(RECIPES.some(r=>r.id===id),`${id} replacement recipe missing`);
});

test('rare trophy feasts now require the expanded gathering economy',()=>{
 const special=new Set<ItemId>(['wild_garlic','juniper','sage','truffle','frontier_spice']);
 for(const meal of rareMeals){const recipe=RECIPES.find(r=>r.id===meal);assert.ok(recipe,`${meal} recipe missing`);assert.ok(Object.keys(recipe.cost).some(item=>special.has(item as ItemId)),`${meal} should require gathered seasonings or rare forage`);}
 const truffleMeals=rareMeals.filter(meal=>RECIPES.find(r=>r.id===meal)?.cost.truffle);assert.ok(truffleMeals.length>=3,'black truffles should gate several prestige dishes');
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[...a.state.stations['alderbrook-fire'].position];const kings=RECIPES.find(r=>r.id==='kings_hart')!;
 for(const [item,count] of Object.entries(kings.cost))if(item!=='truffle')addItem(a.state,p,item as ItemId,count!);
 assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'kings_hart',stationId:'alderbrook-fire'}).ok,false,'rare meat alone should not finish a prestige meal');addItem(a.state,p,'truffle',1);assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'kings_hart',stationId:'alderbrook-fire'}).ok,true);
});

test('forager-only foods form their own viable buff branch',()=>{
 for(const item of ['garlic_mushrooms','juniper_tonic','truffle_broth'] as ItemId[]){const recipe=RECIPES.find(r=>r.output===item);assert.ok(recipe);assert.equal(recipe.station,'campfire');assert.ok(FOOD[item]);}
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[...a.state.stations['alderbrook-fire'].position];const recipe=RECIPES.find(r=>r.id==='truffle_broth')!;for(const [item,count] of Object.entries(recipe.cost))addItem(a.state,p,item as ItemId,count!);assert.equal(a.dispatch({type:'craft',playerId:p.id,recipeId:'truffle_broth',stationId:'alderbrook-fire'}).ok,true);const before=stats(p);assert.equal(a.dispatch({type:'eat',playerId:p.id,item:'truffle_broth'}).ok,true);const after=stats(p);assert.equal(after.health-before.health,40);assert.equal(after.stamina-before.stamina,40);
});

test('every new gathering and processing item has visual icon coverage',()=>{
 const source=readFileSync(new URL('../src/item-icons.ts',import.meta.url),'utf8'),atlas=readFileSync(new URL('../public/assets/ui/economy-icons.svg',import.meta.url),'utf8');
 for(const item of economyItems)assert.match(source,new RegExp(`${item}:\\[`),`${item} icon coordinate missing`);
 assert.match(source,/economy-icons\.svg/);assert.match(source,/new Set\(\['truffle'/,'rare truffle should receive rare-item glow');assert.match(atlas,/width="600" height="300"/);assert.match(atlas,/<!-- row 1: garlic, juniper, sage, truffle, resin, beeswax -->/);
});
