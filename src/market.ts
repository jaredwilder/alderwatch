import {addItem,spend,type ItemId,type PlayerState,type WorldState} from './state';
import {ensureRenown,recordRenownEvent,type AchievementDefinition} from './renown';

export interface MarketGood {item:ItemId;buy:number;sell:number;count:number;note:string}
export const MARKET_GOODS:readonly MarketGood[]=[
 {item:'berries',buy:3,sell:1,count:3,note:'Cheap road food.'},
 {item:'wild_honey',buy:6,sell:3,count:1,note:'Wild skep honey.'},
 {item:'grilled_venison',buy:8,sell:4,count:1,note:'Hot off the market brazier.'},
 {item:'hearty_stew',buy:13,sell:6,count:1,note:'Proper marching food.'},
 {item:'wood',buy:5,sell:2,count:4,note:'Dry split oak.'},
 {item:'stone',buy:5,sell:2,count:4,note:'Foundation-grade fieldstone.'},
 {item:'iron',buy:9,sell:4,count:2,note:'A pair of useful ore chunks.'},
 {item:'hide',buy:11,sell:5,count:2,note:'Cured and ready to work.'},
 {item:'herb',buy:4,sell:2,count:2,note:'For cooking and extremely dubious dairy.'},
 {item:'crow_crop',buy:18,sell:7,count:1,note:'Mara refuses to explain where this came from.'},
];
export type MarketResult={ok:boolean;message:string;unlocked:AchievementDefinition[]};
function good(item:ItemId){return MARKET_GOODS.find(g=>g.item===item);}
export function marketBuy(state:WorldState,player:PlayerState,item:ItemId):MarketResult{
 const g=good(item),r=ensureRenown(player);if(!g)return {ok:false,message:'Mara does not stock that.',unlocked:[]};if(r.gold<g.buy)return {ok:false,message:`Need ${g.buy} crowns. You have ${r.gold}.`,unlocked:[]};r.gold-=g.buy;addItem(state,player,g.item,g.count);return {ok:true,message:`Bought ${g.count} × ${g.item.replaceAll('_',' ')} · ${g.buy} crowns`,unlocked:recordRenownEvent(player,'trade_buy',1,state.tick)};
}
export function marketSell(state:WorldState,player:PlayerState,item:ItemId):MarketResult{
 const g=good(item),r=ensureRenown(player);if(!g)return {ok:false,message:'Mara is not buying that.',unlocked:[]};if(!spend(player,{[g.item]:g.count}))return {ok:false,message:`You need ${g.count} to sell this lot.`,unlocked:[]};r.gold+=g.sell;return {ok:true,message:`Sold ${g.count} × ${g.item.replaceAll('_',' ')} · +${g.sell} crowns`,unlocked:recordRenownEvent(player,'trade_sell',1,state.tick)};
}
