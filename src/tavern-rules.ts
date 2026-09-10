export type TavernDrinkId='alder_brown'|'bee_stung_cider'|'crows_regret';
export interface TavernDrink{id:TavernDrinkId;name:string;subtitle:string;intoxication:number;stamina:number;toast:string}
export const TAVERN_DRINKS:readonly TavernDrink[]=[
 {id:'alder_brown',name:'Alder Brown',subtitle:'Nutty brown ale · dependable courage',intoxication:.72,stamina:14,toast:'Alder Brown. Toasted malt, smoke, and just enough bad judgment.'},
 {id:'bee_stung_cider',name:'Bee-Stung Cider',subtitle:'Dry apple · wild honey · sharp finish',intoxication:1.02,stamina:10,toast:'Bee-Stung Cider. Sweet for half a second, then it starts an argument.'},
 {id:'crows_regret',name:"Crow’s Regret",subtitle:'The house pour · nobody remembers the recipe',intoxication:1.62,stamina:5,toast:"Crow’s Regret. Brinna watches you drink it like a medic watches a siege ladder."},
] as const;

export const MAX_INTOXICATION=5;
export function drinkById(id:TavernDrinkId){const drink=TAVERN_DRINKS.find(d=>d.id===id);if(!drink)throw new Error(`Unknown tavern drink ${id}`);return drink;}
export function addIntoxication(current:number,id:TavernDrinkId){return Math.min(MAX_INTOXICATION,Math.max(0,current)+drinkById(id).intoxication);}
export function sober(current:number,dt:number){return Math.max(0,current-Math.max(0,dt)/150);}
export function tavernMoveScale(intoxication:number){const t=Math.min(1,Math.max(0,intoxication)/MAX_INTOXICATION);return 1-t*.12;}
export function tavernCameraSway(intoxication:number,seconds:number){const t=Math.min(1,Math.max(0,intoxication)/MAX_INTOXICATION);if(t<.04)return{yaw:0,pitch:0};return{yaw:Math.sin(seconds*1.37)*.030*t+Math.sin(seconds*.53)*.012*t,pitch:Math.sin(seconds*1.09+.8)*.018*t};}
export function intoxicationLabel(intoxication:number){if(intoxication<.35)return'';if(intoxication<1.5)return'MERRY';if(intoxication<2.8)return'WARM';if(intoxication<4)return'TIPSY';return'ABSOLUTELY ALDERED';}

export type BonesRoll=readonly [number,number];
export interface BonesScore{roll:BonesRoll;total:number;pair:boolean;score:number;label:string}
export function scoreAlderbones(roll:BonesRoll):BonesScore{const [a,b]=roll;if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||a>6||b<1||b>6)throw new Error('Alderbones dice must be integers from 1 to 6');const pair=a===b,total=a+b,score=total+(pair?7:0);return{roll,total,pair,score,label:pair?`pair of ${a}s · ${score}`:`${total}`};}
export function resolveAlderbones(player:BonesRoll,house:BonesRoll){const p=scoreAlderbones(player),h=scoreAlderbones(house),winner=p.score>h.score?'player':'house';return{player:p,house:h,winner,copy:winner==='player'?`You throw ${p.label}. House throws ${h.label}. THE TABLE ERUPTS.`:`You throw ${p.label}. House throws ${h.label}. House takes ties. Of course it does.`} as const;}
