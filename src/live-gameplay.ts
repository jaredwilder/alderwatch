import type {ItemId,PlayerState} from './state';

/**
 * Player-facing equipment order. Keep keyboard, HUD, automation and icon surfaces
 * driven from this one list so adding a weapon cannot silently ship without a slot.
 */
export const HOTBAR_ITEMS:readonly ItemId[]=['pickaxe','axe','sword','hammer','bow'];

/** Foods considered by the one-key field ration action, strongest/specialized first. */
export const QUICK_FOOD_ITEMS:readonly ItemId[]=['crow_milk','woodland_broth','hearty_stew','grilled_venison','wild_honey','berries'];

export function displayedHotbarItem(player:PlayerState,item:ItemId){
 return item==='sword'&&player.inventory.some(stack=>stack.item==='fine_sword')?'fine_sword':item;
}

export function ownsHotbarItem(player:PlayerState,item:ItemId){
 return player.inventory.some(stack=>stack.item===item||(item==='sword'&&stack.item==='fine_sword'));
}
