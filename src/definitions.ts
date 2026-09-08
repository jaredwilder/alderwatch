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
 {id:'sword',name:'Marcher’s sword',cost:{wood:3,stone:2,iron:4},station:'workbench',output:'sword',count:1,description:'Forged iron. A dependable blade for the frontier.'},
 {id:'fine_sword',name:'Tempered marcher’s sword',cost:{sword:1,iron:6,hide:2},station:'workbench',output:'fine_sword',count:1,requires:'crafted-sword',description:'Improved balance and a hardened edge. 34 melee damage.'},
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
];
export const FOOD:Partial<Record<ItemId,{health:number;stamina:number;duration:number;heal:number}>>={
 woodland_broth:{health:0,stamina:40,duration:480,heal:25},
 crow_milk:{health:15,stamina:25,duration:360,heal:15},
 wild_honey:{health:0,stamina:0,duration:0,heal:15},
 berries:{health:0,stamina:0,duration:0,heal:10},
 roasted_hare:{health:0,stamina:20,duration:360,heal:18},
 crow_skewer:{health:0,stamina:30,duration:300,heal:12},
 herbed_goat:{health:15,stamina:20,duration:480,heal:20},
 hearth_mutton:{health:30,stamina:0,duration:480,heal:30},
 grilled_venison:{health:35,stamina:0,duration:480,heal:20},
 bear_steak:{health:45,stamina:0,duration:600,heal:35},
 bison_roast:{health:30,stamina:30,duration:600,heal:30},
 smoked_wolf:{health:0,stamina:45,duration:600,heal:18},
 eagle_roast:{health:15,stamina:35,duration:600,heal:22},
 hearty_stew:{health:25,stamina:25,duration:480,heal:25},
};
export function stats(p:PlayerState){let health=p.archetype==='Warden'?110:p.archetype==='Reaver'?115:p.archetype==='Hunter'?95:100;let stamina=p.archetype==='Hunter'?115:100;for(const b of p.buffs){if(b.remaining<=0)continue;const food=FOOD[b.id as ItemId];if(food){health+=food.health;stamina+=food.stamina;}}if(p.expedition?.completed){health+=15;stamina+=15;}return {health,stamina,speed:p.archetype==='Hunter'?1.08:1,damage:(p.archetype==='Reaver'?1.12:1)*(p.expedition?.completed?1.1:1)};}
export const STATIC_STATIONS=[
 {id:'alderbrook-bench',kind:'workbench' as const,name:'Alderbrook workbench',position:[7,height(7,-31),-31] as Vec3},
 {id:'alderbrook-fire',kind:'campfire' as const,name:'Roadside campfire',position:[5,height(5,-26),-26] as Vec3},
 {id:'camp-bench',kind:'workbench' as const,name:'Raider’s workbench',position:[40,height(40,-23),-23] as Vec3},
 {id:'camp-fire',kind:'campfire' as const,name:'Raider’s cookfire',position:[37,height(37,-22),-22] as Vec3},
];
