import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Assets} from '../src/assets';
import {HOTBAR_ITEMS,QUICK_FOOD_ITEMS,displayedHotbarItem} from '../src/live-gameplay';
import {makePlayer} from '../src/state';

test('live hotbar exposes every starter combat tool including the bow',()=>{
 assert.deepEqual(HOTBAR_ITEMS,['axe','pickaxe','sword','hammer','bow']);
 const player=makePlayer('Warden');
 assert.equal(HOTBAR_ITEMS.every(item=>item==='sword'||player.inventory.some(stack=>stack.item===item)),true);
 assert.equal(displayedHotbarItem(player,'sword'),'sword');
 player.inventory.push({id:'fine',item:'fine_sword',count:1,quality:1});
 assert.equal(displayedHotbarItem(player,'sword'),'fine_sword');
});

test('new ecology consumables participate in the field-ration action',()=>{
 assert.equal(QUICK_FOOD_ITEMS.includes('crow_milk'),true);
 assert.equal(QUICK_FOOD_ITEMS.includes('wild_honey'),true);
});

test('broken authored highland overlay cannot cover the playable March',()=>{
 const highland=new Assets().prop('highland');
 assert.ok(highland instanceof T.Group);
 assert.equal(highland.children.length,0);
});
