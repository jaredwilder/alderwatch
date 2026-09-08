import './item-icons';
import type {ItemId,PlayerState,Vec3} from './state';
import {height} from './terrain';
export type BuildKind='foundation'|'wall'|'window'|'doorway'|'roof'|'workbench'|'campfire'|'chest'|'palisade';
export type StationKind='workbench'|'campfire';
export interface BuildDefinition {name:string;cost:Partial<Record<ItemId,number>>;description:string;category:'home'|'station'|'defense';}
export const BUILDS:Record<BuildKind,BuildDefinition>={
 foundation:{name:'Stone-footed floor',cost:{wood:6,stone:3},description:'A three-pace timber floor on a fieldstone foundation.',category:'home'},
 wall:{name:'Braced timber wall',cost:{wood:4},description:'A solid wall, snapped to the edge of a floor.',category:'home'},
 window:{name:'Window wall',cost:{wood:4},description:'Let daylight into your home.',category:'home'},
 doorway:{name:'Doorway & oak door',cost:{wood:5},description:'A hinged door in a sturdy timber frame.',category:'home'},
 roof:{name:'Thatched roof bay',cost:{wood:5,fiber:2},description:'Shelter from the elements. Requires two supporting walls.',category:'home'},
 workbench:{name:'Workbench',cost:{wood:8,stone:3},description:'Craft weapons and improve your equipment at home.',category:'station'},
 campfire:{name:'Campfire',cost:{wood:3,stone:4},description:'Cook food that strengthens your body for the road.',category:'station'},
 chest:{name:'Bound oak chest',cost:{wood:6},description:'Store supplies safely at your home.',category:'station'},
 palisade:{name:'Oak palisade',cost:{wood:5},description:'A sharpened timber barrier for your settlement.',category:'defense'},
};
export interface Recipe {id:string;name:string;cost:Partial<Record<ItemId,number>>;station:StationKind;output:ItemId;count:number;description:string;requires?:string;}
export const RECIPES:Recipe[]=[
 {id:'woodland_broth',name:'Woodland broth',cost:{mushroom:2,herb:1,wood:1},station:'campfire',output:'woodland_broth',count:1,description:'Foraged mushrooms and herbs. +40 stamina for eight minutes; restores 25 health.'},
 {id:'crow_milk',name:'Crow milk',cost:{crow_crop:1,herb:1},station:'campfire',output:'crow_milk',count:1,description:'Render one crow crop with wild herbs into a deeply questionable tonic. +15 health and +25 stamina for six minutes.'},

 {id:'charcoal',name:'Hardwood charcoal',cost:{wood:2},station:'campfire',output:'charcoal',count:2,description:'Bank timber in the fire to make dense charcoal for hot crafting work.'},
 {id:'resin_pitch',name:'Resin pitch',cost:{pine_resin:1,charcoal:1},station:'campfire',output:'resin_pitch',count:1,description:'Heat pine resin with charcoal into tough waterproof pitch.'},
 {id:'frontier_spice',name:'Frontier spice blend',cost:{wild_garlic:1,juniper:1,sage:1},station:'campfire',output:'frontier_spice',count:2,description:'Dry garlic, juniper, and sage into two portions of concentrated game seasoning.'},
 {id:'cordage',name:'Flax cordage',cost:{fiber:3},station:'workbench',output:'cordage',count:1,description:'Twist three bundles of wild flax into strong cordage.'},
 {id:'waxed_cord',name:'Waxed bow cord',cost:{cordage:1,beeswax:1},station:'workbench',output:'waxed_cord',count:1,description:'Seal flax cord with beeswax for a strong weather-resistant bowstring.'},
 {id:'leather_strap',name:'Waxed leather straps',cost:{hide:1,beeswax:1},station:'workbench',output:'leather_strap',count:2,description:'Cut and wax hide into two durable equipment straps.'},
 {id:'iron_fittings',name:'Forged iron fittings',cost:{iron:3,charcoal:1},station:'workbench',output:'iron_fittings',count:2,description:'Work iron hot over charcoal into two sets of frontier fittings.'},

 {id:'sword',name:'Marcher’s sword',cost:{wood:3,stone:2,iron:4},station:'workbench',output:'sword',count:1,description:'Forged iron. A dependable blade for the frontier.'},
 {id:'fine_sword',name:'Tempered marcher’s sword',cost:{sword:1,iron:6,hide:2},station:'workbench',output:'fine_sword',count:1,requires:'crafted-sword',description:'Improved balance and a hardened edge. 34 melee damage.'},
 {id:'iron_axe',name:'Iron axe',cost:{wood:2,iron_fittings:2,leather_strap:1},station:'workbench',output:'axe',count:1,description:'Replace a lost axe with a fitted iron head and waxed leather haft.'},
 {id:'mining_pick',name:'Mining pick',cost:{wood:2,iron_fittings:3,leather_strap:1},station:'workbench',output:'pickaxe',count:1,description:'A fresh mining pick built from fitted iron and a bound timber haft.'},
 {id:'builders_hammer',name:'Builder’s hammer',cost:{wood:2,iron_fittings:2,leather_strap:1},station:'workbench',output:'hammer',count:1,description:'A field hammer assembled from processed frontier materials.'},
 {id:'hunter_bow',name:'Hunter’s bow',cost:{wood:4,waxed_cord:1,resin_pitch:1},station:'workbench',output:'bow',count:1,description:'A replacement hunting bow lashed with waxed cord and resin pitch.'},

 {id:'garlic_mushrooms',name:'Garlic woodland mushrooms',cost:{mushroom:2,wild_garlic:1,sage:1,wood:1},station:'campfire',output:'garlic_mushrooms',count:1,description:'Mushrooms browned with garlic and sage. +20 health and +15 stamina for 6 minutes; restores 22 health.'},
 {id:'juniper_tonic',name:'Juniper hunter’s tonic',cost:{juniper:2,sage:1,wild_honey:1,wood:1},station:'campfire',output:'juniper_tonic',count:1,description:'Honeyed juniper and sage tonic. +10 health and +45 stamina for 8 minutes; restores 18 health.'},
 {id:'truffle_broth',name:'Black truffle broth',cost:{truffle:1,mushroom:1,wild_garlic:1,sage:1,wood:1},station:'campfire',output:'truffle_broth',count:1,description:'A rare woodland broth. +40 health and +40 stamina for 12 minutes; restores 45 health.'},

 {id:'roasted_hare',name:'Rosemary hare',cost:{hare_meat:1,herb:1,wood:1},station:'campfire',output:'roasted_hare',count:1,description:'Lean hare roasted with wild herbs. +20 stamina for 6 minutes; restores 18 health.'},
 {id:'crow_skewer',name:'Charred crow skewer',cost:{crow_meat:1,wood:1},station:'campfire',output:'crow_skewer',count:1,description:'Dark crow meat blistered over flame. +30 stamina for 5 minutes; restores 12 health.'},
 {id:'herbed_goat',name:'Herbed goat chop',cost:{goat_meat:1,herb:1,wood:1},station:'campfire',output:'herbed_goat',count:1,description:'A herb-crusted goat chop. +15 health and +20 stamina for 8 minutes.'},
 {id:'hearth_mutton',name:'Hearth-roasted mutton',cost:{mutton:1,wood:1},station:'campfire',output:'hearth_mutton',count:1,description:'Rich mutton roasted slowly. +30 maximum health for 8 minutes; restores 30 health.'},
 {id:'grilled_venison',name:'Grilled venison',cost:{venison:1,wood:1},station:'campfire',output:'grilled_venison',count:1,description:'+35 maximum health and slow recovery for 8 minutes.'},
 {id:'bear_steak',name:'Blackwood bear steak',cost:{bear_meat:1,herb:1,wood:2},station:'campfire',output:'bear_steak',count:1,description:'A huge seared bear steak. +45 maximum health for 10 minutes; restores 35 health.'},
 {id:'bison_roast',name:'Bison herb roast',cost:{bison_meat:1,herb:1,wood:2},station:'campfire',output:'bison_roast',count:1,description:'A frontier feast. +30 health and +30 stamina for 10 minutes.'},
 {id:'smoked_wolf',name:'Smoked wolf strips',cost:{wolf_meat:1,wood:2},station:'campfire',output:'smoked_wolf',count:1,description:'Hard-smoked wolf strips. +45 maximum stamina for 10 minutes; restores 18 health.'},
 {id:'eagle_roast',name:'Highland eagle roast',cost:{eagle_meat:1,herb:1,wood:1},station:'campfire',output:'eagle_roast',count:1,description:'Dark highland game with wild herbs. +15 health and +35 stamina for 10 minutes.'},
 {id:'hearty_stew',name:'Marcher’s stew',cost:{venison:1,berries:2,wood:1},station:'campfire',output:'hearty_stew',count:1,description:'+25 health and +25 stamina for 8 minutes.'},

 {id:'hare_pottage',name:'Hare & mushroom pottage',cost:{hare_meat:1,mushroom:1,herb:1,sage:1,wood:1},station:'campfire',output:'hare_pottage',count:1,description:'A deep woodland pot. +15 health and +30 stamina for 8 minutes; restores 28 health.'},
 {id:'crow_blackpot',name:'Blackpot crow',cost:{crow_meat:1,mushroom:1,berries:1,juniper:1,wood:1},station:'campfire',output:'crow_blackpot',count:1,description:'Crow, berries, juniper, and mushrooms cooked dark. +10 health and +35 stamina for 7 minutes; restores 20 health.'},
 {id:'goat_stew',name:'Goatberry stew',cost:{goat_meat:1,mushroom:1,berries:1,wild_garlic:1,herb:1,wood:1},station:'campfire',output:'goat_stew',count:1,description:'A thick garlic goat stew. +30 health and +20 stamina for 10 minutes; restores 30 health.'},
 {id:'mutton_stew',name:'Shepherd’s mutton pot',cost:{mutton:1,mushroom:1,sage:1,herb:1,wood:1},station:'campfire',output:'mutton_stew',count:1,description:'A rich sage shepherd’s pot. +40 health and +10 stamina for 10 minutes; restores 35 health.'},
 {id:'venison_berry_roast',name:'Berry-glazed venison',cost:{venison:1,berries:2,juniper:1,wild_honey:1,wood:1},station:'campfire',output:'venison_berry_roast',count:1,description:'Honeyed venison with berries and juniper. +30 health and +30 stamina for 10 minutes; restores 32 health.'},
 {id:'bear_pottage',name:'Bear & mushroom pottage',cost:{bear_meat:1,mushroom:2,sage:1,herb:1,wood:2},station:'campfire',output:'bear_pottage',count:1,description:'Heavy sage woodland fare. +50 health and +15 stamina for 12 minutes; restores 40 health.'},
 {id:'bison_stew',name:'Bison trail stew',cost:{bison_meat:1,mushroom:1,berries:2,wild_garlic:1,herb:1,wood:2},station:'campfire',output:'bison_stew',count:1,description:'A huge garlic trail stew. +40 health and +40 stamina for 12 minutes; restores 40 health.'},
 {id:'wolf_broth',name:'Blackwood wolf broth',cost:{wolf_meat:1,mushroom:1,juniper:1,herb:1,wood:2},station:'campfire',output:'wolf_broth',count:1,description:'Hard-smoked wolf with juniper in herb broth. +10 health and +55 stamina for 12 minutes; restores 24 health.'},
 {id:'eagle_broth',name:'Highland eagle broth',cost:{eagle_meat:1,mushroom:1,sage:1,herb:1,wood:1},station:'campfire',output:'eagle_broth',count:1,description:'A light sage highland broth. +20 health and +50 stamina for 12 minutes; restores 26 health.'},

 {id:'hunter_platter',name:'Hunter’s platter',cost:{hare_meat:1,venison:1,eagle_meat:1,berries:2,frontier_spice:1,wood:2},station:'campfire',output:'hunter_platter',count:1,description:'Hare, venison, eagle, berries, and frontier spice. +45 health and +55 stamina for 15 minutes; restores 45 health.'},
 {id:'frontier_mixed_grill',name:'Frontier mixed grill',cost:{goat_meat:1,mutton:1,bison_meat:1,frontier_spice:2,wood:2},station:'campfire',output:'frontier_mixed_grill',count:1,description:'Goat, mutton, and bison with a double spice crust. +60 health and +45 stamina for 15 minutes; restores 50 health.'},
 {id:'predator_stew',name:'Blackwood predator stew',cost:{bear_meat:1,wolf_meat:1,mushroom:2,wild_honey:1,frontier_spice:1,wood:2},station:'campfire',output:'predator_stew',count:1,description:'Bear and wolf with mushroom, honey, and spice. +55 health and +60 stamina for 15 minutes; restores 55 health.'},

 {id:'moonlit_hare',name:'Moonlit hare saddle',cost:{hare_saddle:1,wild_honey:1,sage:1,juniper:1,frontier_spice:1,wood:1},station:'campfire',output:'moonlit_hare',count:1,description:'Rare feast with sage and juniper. +35 health and +65 stamina for 20 minutes; restores 45 health.'},
 {id:'blackwing_roast',name:'Blackwing honey roast',cost:{crow_breast:1,wild_honey:1,juniper:2,sage:1,wood:1},station:'campfire',output:'blackwing_roast',count:1,description:'Rare honey-juniper roast. +25 health and +70 stamina for 18 minutes; restores 38 health.'},
 {id:'highland_goat_roast',name:'Highland tenderloin roast',cost:{goat_tenderloin:1,wild_garlic:2,sage:1,frontier_spice:1,wood:2},station:'campfire',output:'highland_goat_roast',count:1,description:'Rare garlic highland roast. +60 health and +50 stamina for 20 minutes; restores 55 health.'},
 {id:'golden_mutton_rack',name:'Golden mutton rack',cost:{mutton_rack:1,wild_honey:1,wild_garlic:1,frontier_spice:1,wood:2},station:'campfire',output:'golden_mutton_rack',count:1,description:'Rare honey-garlic rack. +70 health and +35 stamina for 20 minutes; restores 65 health.'},
 {id:'kings_hart',name:'King’s hart plate',cost:{hart_tenderloin:1,truffle:1,juniper:1,frontier_spice:1,wood:2},station:'campfire',output:'kings_hart',count:1,description:'Rare hart and black truffle plate. +60 health and +60 stamina for 20 minutes; restores 65 health.'},
 {id:'old_bear_rib',name:'Old-bear honey rib',cost:{bear_rib:1,truffle:1,wild_honey:1,sage:1,wood:2},station:'campfire',output:'old_bear_rib',count:1,description:'Rare bear rib with truffle, honey, and sage. +75 health and +30 stamina for 20 minutes; restores 75 health.'},
 {id:'great_bison_feast',name:'Great bison feast',cost:{bison_hump:1,wild_garlic:2,juniper:1,frontier_spice:2,wood:2},station:'campfire',output:'great_bison_feast',count:1,description:'Rare bison feast with a heavy spice crust. +65 health and +65 stamina for 20 minutes; restores 75 health.'},
 {id:'night_wolf_loin',name:'Night-wolf loin roast',cost:{wolf_loin:1,juniper:2,sage:1,frontier_spice:1,wood:2},station:'campfire',output:'night_wolf_loin',count:1,description:'Rare juniper wolf loin. +30 health and +75 stamina for 20 minutes; restores 50 health.'},
 {id:'eagle_crown_roast',name:'Eagle-crown roast',cost:{eagle_breast:1,truffle:1,wild_honey:1,sage:1,frontier_spice:1,wood:1},station:'campfire',output:'eagle_crown_roast',count:1,description:'Rare eagle, truffle, honey, and sage roast. +45 health and +70 stamina for 20 minutes; restores 55 health.'},
];
export const FOOD:Partial<Record<ItemId,{health:number;stamina:number;duration:number;heal:number}>>={
 woodland_broth:{health:0,stamina:40,duration:480,heal:25},crow_milk:{health:15,stamina:25,duration:360,heal:15},wild_honey:{health:0,stamina:0,duration:0,heal:15},berries:{health:0,stamina:0,duration:0,heal:10},
 garlic_mushrooms:{health:20,stamina:15,duration:360,heal:22},juniper_tonic:{health:10,stamina:45,duration:480,heal:18},truffle_broth:{health:40,stamina:40,duration:720,heal:45},
 roasted_hare:{health:0,stamina:20,duration:360,heal:18},crow_skewer:{health:0,stamina:30,duration:300,heal:12},herbed_goat:{health:15,stamina:20,duration:480,heal:20},hearth_mutton:{health:30,stamina:0,duration:480,heal:30},grilled_venison:{health:35,stamina:0,duration:480,heal:20},bear_steak:{health:45,stamina:0,duration:600,heal:35},bison_roast:{health:30,stamina:30,duration:600,heal:30},smoked_wolf:{health:0,stamina:45,duration:600,heal:18},eagle_roast:{health:15,stamina:35,duration:600,heal:22},hearty_stew:{health:25,stamina:25,duration:480,heal:25},
 hare_pottage:{health:15,stamina:30,duration:480,heal:28},crow_blackpot:{health:10,stamina:35,duration:420,heal:20},goat_stew:{health:30,stamina:20,duration:600,heal:30},mutton_stew:{health:40,stamina:10,duration:600,heal:35},venison_berry_roast:{health:30,stamina:30,duration:600,heal:32},bear_pottage:{health:50,stamina:15,duration:720,heal:40},bison_stew:{health:40,stamina:40,duration:720,heal:40},wolf_broth:{health:10,stamina:55,duration:720,heal:24},eagle_broth:{health:20,stamina:50,duration:720,heal:26},
 hunter_platter:{health:45,stamina:55,duration:900,heal:45},frontier_mixed_grill:{health:60,stamina:45,duration:900,heal:50},predator_stew:{health:55,stamina:60,duration:900,heal:55},
 moonlit_hare:{health:35,stamina:65,duration:1200,heal:45},blackwing_roast:{health:25,stamina:70,duration:1080,heal:38},highland_goat_roast:{health:60,stamina:50,duration:1200,heal:55},golden_mutton_rack:{health:70,stamina:35,duration:1200,heal:65},kings_hart:{health:60,stamina:60,duration:1200,heal:65},old_bear_rib:{health:75,stamina:30,duration:1200,heal:75},great_bison_feast:{health:65,stamina:65,duration:1200,heal:75},night_wolf_loin:{health:30,stamina:75,duration:1200,heal:50},eagle_crown_roast:{health:45,stamina:70,duration:1200,heal:55},
};
export function stats(p:PlayerState){let health=p.archetype==='Warden'?110:p.archetype==='Reaver'?115:p.archetype==='Hunter'?95:100;let stamina=p.archetype==='Hunter'?115:100;for(const b of p.buffs){if(b.remaining<=0)continue;const food=FOOD[b.id as ItemId];if(food){health+=food.health;stamina+=food.stamina;}}if(p.expedition?.completed){health+=15;stamina+=15;}return {health,stamina,speed:p.archetype==='Hunter'?1.08:1,damage:(p.archetype==='Reaver'?1.12:1)*(p.expedition?.completed?1.1:1)};}
export const STATIC_STATIONS=[
 {id:'alderbrook-bench',kind:'workbench' as const,name:'Alderbrook workbench',position:[7,height(7,-31),-31] as Vec3},
 {id:'alderbrook-fire',kind:'campfire' as const,name:'Roadside campfire',position:[5,height(5,-26),-26] as Vec3},
 {id:'camp-bench',kind:'workbench' as const,name:'Raider’s workbench',position:[40,height(40,-23),-23] as Vec3},
 {id:'camp-fire',kind:'campfire' as const,name:'Raider’s cookfire',position:[37,height(37,-22),-22] as Vec3},
];
