import {RECIPES,type Recipe} from './definitions';

/**
 * Follow-up economy layer. Every recipe reuses authoritative Alderwatch items so this can add
 * depth without a save-schema bump. Efficient bulk methods unlock only after the single-serving
 * or base-production recipe has been mastered once (the existing crafted-<id> progress flags).
 */
export const EXPANDED_RECIPES:Recipe[]=[
 // Production mastery: bulk methods reward actually learning the economy instead of replacing it.
 {id:'colliers_long_burn',name:'Collier’s long burn',cost:{wood:8},station:'campfire',output:'charcoal',count:10,requires:'crafted-charcoal',description:'Bank a full timber stack under earth and coals. A mastered bulk burn yields ten charcoal.'},
 {id:'ropemakers_long_twist',name:'Ropemaker’s long twist',cost:{fiber:12},station:'workbench',output:'cordage',count:5,requires:'crafted-cordage',description:'Work a long run of flax at once. Twelve bundles become five strong cords.'},
 {id:'pitch_kettle',name:'Pitch kettle',cost:{pine_resin:4,charcoal:3},station:'campfire',output:'resin_pitch',count:5,requires:'crafted-resin_pitch',description:'Keep a proper pitch kettle hot and recover more usable waterproof resin from each batch.'},
 {id:'chandlers_cord_batch',name:'Chandler’s cord batch',cost:{cordage:4,beeswax:3},station:'workbench',output:'waxed_cord',count:5,requires:'crafted-waxed_cord',description:'Wax several bow cords together while the comb is warm. Five weatherproof strings.'},
 {id:'tanners_strap_bundle',name:'Tanner’s strap bundle',cost:{hide:4,beeswax:3},station:'workbench',output:'leather_strap',count:10,requires:'crafted-leather_strap',description:'Cut a full hide run before waxing. Ten hard-wearing frontier straps.'},
 {id:'smiths_fittings_batch',name:'Smith’s fittings batch',cost:{iron:12,charcoal:3},station:'workbench',output:'iron_fittings',count:10,requires:'crafted-iron_fittings',description:'Keep the iron hot and work ten matched fittings before the forge cools.'},
 {id:'provisioners_spice_satchel',name:'Provisioner’s spice satchel',cost:{wild_garlic:3,juniper:3,sage:3},station:'campfire',output:'frontier_spice',count:8,requires:'crafted-frontier_spice',description:'Dry a whole forager’s basket into eight portions of concentrated frontier spice.'},

 // Forager pantry: scaled versions of the non-meat cooking branch.
 {id:'woodland_broth_kettle',name:'Woodland broth kettle',cost:{mushroom:8,herb:3,sage:1,wood:3},station:'campfire',output:'woodland_broth',count:5,requires:'crafted-woodland_broth',description:'A camp kettle for a whole hunting party. Five bowls with less firewood per serving.'},
 {id:'garlic_mushroom_skillet',name:'Garlic mushroom skillet',cost:{mushroom:6,wild_garlic:2,sage:2,wood:2},station:'campfire',output:'garlic_mushrooms',count:4,requires:'crafted-garlic_mushrooms',description:'Brown a skillet full of woodland mushrooms for four forager suppers.'},
 {id:'hunters_tonic_crock',name:'Hunter’s tonic crock',cost:{juniper:6,sage:3,wild_honey:2,wood:2},station:'campfire',output:'juniper_tonic',count:4,requires:'crafted-juniper_tonic',description:'Steep a crock of juniper tonic instead of wasting honey on single cups.'},
 {id:'truffle_broth_service',name:'Truffle broth service',cost:{truffle:2,mushroom:3,wild_garlic:2,sage:2,wood:2},station:'campfire',output:'truffle_broth',count:3,requires:'crafted-truffle_broth',description:'A rare black-truffle service for three. Extravagant, but finally worth laying a table.'},

 // Nine-hunt cookhouse mastery.
 {id:'hare_roasting_tray',name:'Hare roasting tray',cost:{hare_meat:3,herb:2,sage:1,wood:2},station:'campfire',output:'roasted_hare',count:3,requires:'crafted-roasted_hare',description:'Three herb-roasted hares over one carefully managed fire.'},
 {id:'crow_skewer_rack',name:'Crow skewer rack',cost:{crow_meat:3,juniper:1,wood:2},station:'campfire',output:'crow_skewer',count:3,requires:'crafted-crow_skewer',description:'A whole rack of blackened crow skewers with crushed juniper.'},
 {id:'goat_chop_board',name:'Goat chop board',cost:{goat_meat:3,herb:2,wild_garlic:1,wood:2},station:'campfire',output:'herbed_goat',count:3,requires:'crafted-herbed_goat',description:'Three garlic-herb goat chops prepared as one cookhouse board.'},
 {id:'mutton_hearth_tray',name:'Mutton hearth tray',cost:{mutton:3,sage:2,wood:2},station:'campfire',output:'hearth_mutton',count:3,requires:'crafted-hearth_mutton',description:'Slow-roast three mutton portions in the same banked hearth.'},
 {id:'venison_grill_rack',name:'Venison grill rack',cost:{venison:3,juniper:1,wood:2},station:'campfire',output:'grilled_venison',count:3,requires:'crafted-grilled_venison',description:'Three venison cuts grilled together with a little juniper smoke.'},
 {id:'bear_steak_board',name:'Bear steak board',cost:{bear_meat:3,sage:2,wood:4},station:'campfire',output:'bear_steak',count:3,requires:'crafted-bear_steak',description:'A huge board of bear steaks. Mastered fire control saves two timber over separate cooks.'},
 {id:'bison_roast_board',name:'Bison roast board',cost:{bison_meat:3,wild_garlic:1,wood:4},station:'campfire',output:'bison_roast',count:3,requires:'crafted-bison_roast',description:'Three bison roasts sharing one hard garlic fire.'},
 {id:'wolf_smoke_rack',name:'Wolf smoke rack',cost:{wolf_meat:3,juniper:2,wood:4},station:'campfire',output:'smoked_wolf',count:3,requires:'crafted-smoked_wolf',description:'A loaded smoke rack turns three wolf cuts into durable road food.'},
 {id:'eagle_roasting_tray',name:'Eagle roasting tray',cost:{eagle_meat:3,sage:2,wood:2},station:'campfire',output:'eagle_roast',count:3,requires:'crafted-eagle_roast',description:'Three highland eagle portions roasted together with woodland sage.'},

 // Deep cookpot mastery: larger pots give meaningful ingredient efficiency.
 {id:'hare_pottage_kettle',name:'Hare pottage kettle',cost:{hare_meat:2,mushroom:2,herb:1,sage:1,wood:1},station:'campfire',output:'hare_pottage',count:2,requires:'crafted-hare_pottage',description:'A two-bowl kettle of hare pottage that wastes almost no heat.'},
 {id:'blackpot_crow_kettle',name:'Blackpot crow kettle',cost:{crow_meat:2,mushroom:2,berries:2,juniper:1,wood:1},station:'campfire',output:'crow_blackpot',count:2,requires:'crafted-crow_blackpot',description:'A larger blackpot stretches crow, berries, and mushrooms into two meals.'},
 {id:'goatberry_cookpot',name:'Goatberry cookpot',cost:{goat_meat:2,mushroom:2,berries:2,wild_garlic:1,herb:1,wood:1},station:'campfire',output:'goat_stew',count:2,requires:'crafted-goat_stew',description:'Two thick goatberry stews from one carefully tended pot.'},
 {id:'shepherds_cookpot',name:'Shepherd’s cookpot',cost:{mutton:2,mushroom:2,sage:1,herb:1,wood:1},station:'campfire',output:'mutton_stew',count:2,requires:'crafted-mutton_stew',description:'Two rich shepherd’s pots for the timber cost of one.'},
 {id:'venison_glaze_platter',name:'Venison glaze platter',cost:{venison:2,berries:3,juniper:1,wild_honey:1,wood:1},station:'campfire',output:'venison_berry_roast',count:2,requires:'crafted-venison_berry_roast',description:'Stretch one honey glaze across two berry-juniper venison roasts.'},
 {id:'bear_pottage_cauldron',name:'Bear pottage cauldron',cost:{bear_meat:2,mushroom:3,sage:1,herb:1,wood:3},station:'campfire',output:'bear_pottage',count:2,requires:'crafted-bear_pottage',description:'A heavy bear cauldron makes two enormous bowls with less fuel.'},
 {id:'bison_trail_cauldron',name:'Bison trail cauldron',cost:{bison_meat:2,mushroom:2,berries:3,wild_garlic:1,herb:1,wood:3},station:'campfire',output:'bison_stew',count:2,requires:'crafted-bison_stew',description:'Two trail stews from a proper bison-sized cauldron.'},
 {id:'wolf_broth_cauldron',name:'Wolf broth cauldron',cost:{wolf_meat:2,mushroom:2,juniper:1,herb:1,wood:3},station:'campfire',output:'wolf_broth',count:2,requires:'crafted-wolf_broth',description:'A hard-smoked double batch of Blackwood wolf broth.'},
 {id:'eagle_broth_kettle',name:'Eagle broth kettle',cost:{eagle_meat:2,mushroom:2,sage:1,herb:1,wood:1},station:'campfire',output:'eagle_broth',count:2,requires:'crafted-eagle_broth',description:'Two light highland broths from one quick kettle.'},

 // Feast service: turn mastered feast recipes into group-scale provisioning.
 {id:'hunters_table_service',name:'Hunter’s table service',cost:{hare_meat:2,venison:2,eagle_meat:2,berries:5,frontier_spice:2,wood:4},station:'campfire',output:'hunter_platter',count:3,requires:'crafted-hunter_platter',description:'Lay three hunter’s platters at once. A real camp table instead of one heroic plate.'},
 {id:'mixed_grill_service',name:'Frontier mixed-grill service',cost:{goat_meat:2,mutton:2,bison_meat:2,frontier_spice:4,wood:4},station:'campfire',output:'frontier_mixed_grill',count:3,requires:'crafted-frontier_mixed_grill',description:'Three mixed grills from a single long fire and a serious spice pouch.'},
 {id:'predator_stew_cauldron',name:'Predator stew cauldron',cost:{bear_meat:2,wolf_meat:2,mushroom:4,wild_honey:2,frontier_spice:2,wood:4},station:'campfire',output:'predator_stew',count:3,requires:'crafted-predator_stew',description:'A frankly irresponsible cauldron of bear-and-wolf stew for three.'},

 // Trophy banquets: one rare cut can feed two only after its signature dish has been mastered.
 {id:'moonlit_hare_banquet',name:'Moonlit hare banquet',cost:{hare_saddle:1,wild_honey:2,sage:2,juniper:2,frontier_spice:2,wood:2},station:'campfire',output:'moonlit_hare',count:2,requires:'crafted-moonlit_hare',description:'Carve the prized saddle properly and turn one rare hare into two master servings.'},
 {id:'blackwing_banquet',name:'Blackwing banquet',cost:{crow_breast:1,wild_honey:2,juniper:3,sage:2,frontier_spice:1,wood:2},station:'campfire',output:'blackwing_roast',count:2,requires:'crafted-blackwing_roast',description:'A mastered blackwing carve doubles the table value of a rare crow breast.'},
 {id:'highland_goat_banquet',name:'Highland goat banquet',cost:{goat_tenderloin:1,wild_garlic:3,sage:2,frontier_spice:2,wood:3},station:'campfire',output:'highland_goat_roast',count:2,requires:'crafted-highland_goat_roast',description:'Stretch one rare tenderloin into a pair of extravagant highland plates.'},
 {id:'golden_mutton_banquet',name:'Golden mutton banquet',cost:{mutton_rack:1,wild_honey:2,wild_garlic:2,frontier_spice:2,wood:3},station:'campfire',output:'golden_mutton_rack',count:2,requires:'crafted-golden_mutton_rack',description:'Carve the prime rack across two honey-garlic feast plates.'},
 {id:'kings_hart_banquet',name:'King’s hart banquet',cost:{hart_tenderloin:1,truffle:2,juniper:2,frontier_spice:2,wild_honey:1,wood:3},station:'campfire',output:'kings_hart',count:2,requires:'crafted-kings_hart',description:'Two royal hart plates from one rare tenderloin, paid for in black truffle.'},
 {id:'old_bear_banquet',name:'Old-bear banquet',cost:{bear_rib:1,truffle:2,wild_honey:2,sage:2,frontier_spice:1,wood:3},station:'campfire',output:'old_bear_rib',count:2,requires:'crafted-old_bear_rib',description:'A mastered rib carve produces two monstrous old-bear feast portions.'},
 {id:'great_bison_banquet',name:'Great bison banquet',cost:{bison_hump:1,wild_garlic:3,juniper:2,frontier_spice:3,wild_honey:1,wood:3},station:'campfire',output:'great_bison_feast',count:2,requires:'crafted-great_bison_feast',description:'One prized hump cut becomes two Great Bison Feasts only under a master provisioner.'},
 {id:'night_wolf_banquet',name:'Night-wolf banquet',cost:{wolf_loin:1,juniper:3,sage:2,frontier_spice:2,truffle:1,wood:3},station:'campfire',output:'night_wolf_loin',count:2,requires:'crafted-night_wolf_loin',description:'A rare night-wolf loin carved into two stamina-heavy master plates.'},
 {id:'eagle_crown_banquet',name:'Eagle-crown banquet',cost:{eagle_breast:1,truffle:2,wild_honey:2,sage:2,frontier_spice:2,wood:2},station:'campfire',output:'eagle_crown_roast',count:2,requires:'crafted-eagle_crown_roast',description:'Turn the crown breast into two absurdly luxurious highland servings.'},

 // Quartermaster restock: mastered replacement gear can be produced in economical pairs.
 {id:'woodsman_axe_pair',name:'Woodsman’s axe pair',cost:{wood:3,iron_fittings:4,leather_strap:2,resin_pitch:1},station:'workbench',output:'axe',count:2,requires:'crafted-iron_axe',description:'A matched pair of replacement axes for a serious timber camp.'},
 {id:'miners_pick_pair',name:'Miner’s pick pair',cost:{wood:3,iron_fittings:6,leather_strap:2,resin_pitch:1},station:'workbench',output:'pickaxe',count:2,requires:'crafted-mining_pick',description:'Two fitted mining picks built as one quartermaster order.'},
 {id:'builders_hammer_pair',name:'Builder’s hammer pair',cost:{wood:3,iron_fittings:4,leather_strap:2},station:'workbench',output:'hammer',count:2,requires:'crafted-builders_hammer',description:'Two field hammers for a settlement crew.'},
 {id:'hunters_bow_pair',name:'Hunter’s bow pair',cost:{wood:7,waxed_cord:2,resin_pitch:2,leather_strap:1},station:'workbench',output:'bow',count:2,requires:'crafted-hunter_bow',description:'Two weatherproof hunting bows from a single carefully prepared stave order.'},
 {id:'marcher_sword_stock',name:'Marcher sword stock',cost:{wood:5,stone:3,iron:7,charcoal:1},station:'workbench',output:'sword',count:2,requires:'crafted-sword',description:'Forge two dependable marcher swords while the iron is already hot.'},
 {id:'tempered_sword_commission',name:'Tempered sword commission',cost:{sword:2,iron:10,hide:3,charcoal:2},station:'workbench',output:'fine_sword',count:2,requires:'crafted-fine_sword',description:'A masterwork commission for two tempered blades with less waste at the forge.'},
];

export const EXPANDED_RECIPE_IDS=new Set(EXPANDED_RECIPES.map(r=>r.id));

export function registerCraftingExpansion(){
 const seen=new Set(RECIPES.map(r=>r.id));
 for(const recipe of EXPANDED_RECIPES)if(!seen.has(recipe.id)){RECIPES.push(recipe);seen.add(recipe.id);}
 return RECIPES;
}

registerCraftingExpansion();
if(typeof document!=='undefined')void import('./recipe-book-ui');
