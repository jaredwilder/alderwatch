import './profile-paperdoll-install';
import type {PlayerState} from './state';

export type RenownEvent=
 |'drink_crow_milk'|'drink_honey'|'kill_hare'|'kill_crow'|'kill_goat'|'kill_sheep'|'kill_deer'|'kill_bison'|'kill_wolf'|'kill_bear'|'kill_eagle'
 |'kill_baddie'|'complete_bounty'|'complete_expedition'|'forage'|'craft'|'build'|'rest'|'trade_buy'|'trade_sell'|'skill_gain'|'grandmaster'
 |'witness_eagle_pickup'|'witness_eagle_drop'|'witness_eagle_exhausted'|'witness_wolf_bison_hunt'|'witness_pack_aggro'|'witness_predator_kill'|'witness_eagle_eaten';

export interface RenownState {
 karma:number;
 fame:number;
 gold:number;
 reputation:Record<string,number>;
 counters:Record<string,number>;
 achievements:Record<string,number>;
}
export interface AchievementDefinition {id:string;title:string;description:string;hidden?:boolean;test:(r:RenownState)=>boolean}

const repNames=['Alderbrook','March Wardens','Free Traders','Wildkeepers'] as const;
const count=(r:RenownState,key:string)=>r.counters[key]??0;
const kills=(r:RenownState)=>['hare','crow','goat','sheep','deer','bison','wolf','bear','eagle'].reduce((n,k)=>n+count(r,'kill_'+k),0);
const speciesKilled=(r:RenownState)=>['hare','crow','goat','sheep','deer','bison','wolf','bear','eagle'].filter(k=>count(r,'kill_'+k)>0).length;

export const ACHIEVEMENTS:readonly AchievementDefinition[]=[
 {id:'crowmilk_first',title:'DRANK YOUR FIRST CROW MILK!',description:'Nobody stopped you. History will remember this failure of supervision.',test:r=>count(r,'drink_crow_milk')>=1},
 {id:'crowmilk_five',title:'THE MILKMAN COMETH',description:'Five crow milks. Dairy science has formally left the building.',test:r=>count(r,'drink_crow_milk')>=5},
 {id:'crowmilk_twenty',title:'BONE DENSITY: QUESTIONABLE',description:'Twenty crow milks consumed. Your physician has blocked your number.',hidden:true,test:r=>count(r,'drink_crow_milk')>=20},
 {id:'honey_first',title:'BEAR ADJACENT BEHAVIOR',description:'Eat wild honey directly from the source. What could notice?',test:r=>count(r,'drink_honey')>=1},
 {id:'hare_first',title:'HARE TODAY, GONE TOMORROW',description:'You killed a bunny. Karma noticed immediately.',test:r=>count(r,'kill_hare')>=1},
 {id:'hare_ten',title:'THE BUNNY PROBLEM',description:'Ten hares. This stopped being an accident several rabbits ago.',test:r=>count(r,'kill_hare')>=10},
 {id:'crow_first',title:'A MURDER OF ONE',description:'A crow has submitted a strongly worded complaint from beyond.',test:r=>count(r,'kill_crow')>=1},
 {id:'bison_first',title:'BISON-TENNIAL',description:'A frankly unreasonable amount of animal has become dinner.',test:r=>count(r,'kill_bison')>=1},
 {id:'wolf_first',title:'DO NOT PET',description:'You successfully completed the wolf petting tutorial incorrectly.',test:r=>count(r,'kill_wolf')>=1},
 {id:'bear_first',title:'BEARLY LEGAL',description:'You fought a bear and the paperwork somehow cleared.',test:r=>count(r,'kill_bear')>=1},
 {id:'eagle_first',title:'FREEDOM WAS CANCELLED',description:'An eagle has discovered that the food chain is a circle.',test:r=>count(r,'kill_eagle')>=1},
 {id:'species_five',title:'DAVID ATTENBOROUGH WOULD LEAVE',description:'Five different species have experienced your field research.',test:r=>speciesKilled(r)>=5},
 {id:'wildlife_fifty',title:'DOCUMENTARY CREW BLACKLISTED',description:'Fifty wildlife kills. The ecosystem has stopped signing release forms.',test:r=>kills(r)>=50},
 {id:'eagle_airlift',title:'THE EAGLE HAS YOUR BUNNY',description:'Witness an eagle perform unauthorized rabbit aviation.',test:r=>count(r,'witness_eagle_pickup')>=1},
 {id:'eagle_airlift_five',title:'AIR FREIGHT DEPARTMENT',description:'Witness five eagle airlifts. Nobody has filed a manifest.',test:r=>count(r,'witness_eagle_pickup')>=5},
 {id:'eagle_drop',title:'GRAVITY HAS ENTERED THE FOOD WEB',description:'Witness an eagle drop its cargo before dinner.',test:r=>count(r,'witness_eagle_drop')>=1},
 {id:'eagle_exhausted',title:'THE SKY RAN OUT OF GAS',description:'Watch an exhausted eagle land and continue the day on foot.',test:r=>count(r,'witness_eagle_exhausted')>=1},
 {id:'wolf_bison',title:'THREE WOLVES HAVE A BUSINESS PLAN',description:'Witness wolves decide a bison is a reasonable group project.',test:r=>count(r,'witness_wolf_bison_hunt')>=1},
 {id:'wolf_interference',title:'YOU INTERRUPTED DINNER',description:'Interfere with a wolf hunt and become the revised menu.',test:r=>count(r,'witness_pack_aggro')>=1},
 {id:'predation_first',title:'NATURE DOCUMENTARY, UNAUTHORIZED',description:'Witness one animal kill another without any player quest involved.',test:r=>count(r,'witness_predator_kill')>=1},
 {id:'predation_ten',title:'THE WILDERNESS IS PLAYING WITHOUT YOU',description:'Witness ten predator kills. The simulation would like privacy.',test:r=>count(r,'witness_predator_kill')>=10},
 {id:'eagle_eaten',title:'THE FOOD CHAIN HAS LOOPED',description:'Witness a grounded eagle become somebody else’s dinner.',test:r=>count(r,'witness_eagle_eaten')>=1},
 {id:'baddie_first',title:'LOCAL PROBLEM SOLVER',description:'One outlaw removed from the March. Alderbrook approves.',test:r=>count(r,'kill_baddie')>=1},
 {id:'baddie_twenty',title:'HUMAN RESOURCES',description:'Twenty hostile humans have been permanently offboarded.',test:r=>count(r,'kill_baddie')>=20},
 {id:'bounty_first',title:'HAS SWORD, WILL TRAVEL',description:'Claim your first bounty and become employable in the worst possible industry.',test:r=>count(r,'complete_bounty')>=1},
 {id:'bounty_six',title:'THE BOARD IS AFRAID OF YOU',description:'Six bounties claimed. New postings now include hazard pay.',test:r=>count(r,'complete_bounty')>=6},
 {id:'expedition',title:'MARCHWARDEN ENERGY',description:'Finish the Ash Road expedition and return with receipts.',test:r=>count(r,'complete_expedition')>=1},
 {id:'forage_25',title:'TOUCH GRASS PROFESSIONALLY',description:'Twenty-five successful forage actions. This is technically a career.',test:r=>count(r,'forage')>=25},
 {id:'craft_25',title:'ETSY OF THE APOCALYPSE',description:'Craft twenty-five things while civilization remains optional.',test:r=>count(r,'craft')>=25},
 {id:'build_20',title:'OSHA HAS LEFT THE CHAT',description:'Place twenty structures. Load-bearing confidence is now a personality trait.',test:r=>count(r,'build')>=20},
 {id:'rest_10',title:'CAMPFIRE INFLUENCER',description:'Rest ten times. Sponsored by Sitting Near Logs.',test:r=>count(r,'rest')>=10},
 {id:'trade_20',title:'MARKET MANIPULATOR',description:'Twenty trades completed. The invisible hand is visibly yours.',test:r=>count(r,'trade_buy')+count(r,'trade_sell')>=20},
 {id:'gold_250',title:'MEDIEVAL LIQUIDITY EVENT',description:'Hold 250 crowns without immediately converting them into stew.',test:r=>r.gold>=250},
 {id:'fame_25',title:'PEOPLE HAVE HEARD THINGS',description:'Reach 25 Fame. Accuracy of the stories is not guaranteed.',test:r=>r.fame>=25},
 {id:'fame_60',title:'UNFORTUNATELY LEGENDARY',description:'Reach 60 Fame. Strangers are now wrong about you professionally.',test:r=>r.fame>=60},
 {id:'karma_good',title:'SUSPICIOUSLY DECENT PERSON',description:'Reach +20 Karma despite everything happening out here.',test:r=>r.karma>=20},
 {id:'karma_bad',title:'LOCAL MENACE',description:'Reach -20 Karma. Even the rabbits have started a neighborhood watch.',test:r=>r.karma<=-20},
 {id:'famous_villain',title:'QUESTIONABLE CELEBRITY',description:'Be famous and terrible at the same time. Ultima would understand.',test:r=>r.fame>=30&&r.karma<=-10},
 {id:'grandmaster',title:'GRANDMASTER SOMETHING!',description:'Reach 100.0 in any skill. The decimal grind has achieved enlightenment.',test:r=>count(r,'grandmaster')>=1},
];

export function ensureRenown(player:PlayerState):RenownState{
 const p=player as PlayerState&{renown?:RenownState};
 if(!p.renown)p.renown={karma:0,fame:0,gold:25,reputation:{},counters:{},achievements:{}};
 const r=p.renown;r.karma=Number.isFinite(r.karma)?r.karma:0;r.fame=Number.isFinite(r.fame)?r.fame:0;r.gold=Number.isFinite(r.gold)?r.gold:25;r.reputation??={};r.counters??={};r.achievements??={};
 for(const name of repNames)if(!Number.isFinite(r.reputation[name]))r.reputation[name]=0;
 return r;
}
function rep(r:RenownState,name:string,delta:number){r.reputation[name]=Math.max(-100,Math.min(100,(r.reputation[name]??0)+delta));}
function tune(r:RenownState,event:RenownEvent,amount:number){
 if(event==='kill_hare'){r.karma-=1*amount;r.fame+=.2*amount;rep(r,'Wildkeepers',-1.5*amount);}
 else if(event==='kill_goat'||event==='kill_sheep'){r.karma-=2*amount;r.fame+=.35*amount;rep(r,'Alderbrook',-1*amount);rep(r,'Wildkeepers',-2*amount);}
 else if(event==='kill_deer'||event==='kill_bison'){r.fame+=.45*amount;rep(r,'Wildkeepers',-.15*amount);}
 else if(event==='kill_wolf'||event==='kill_bear'){r.karma+=.5*amount;r.fame+=.8*amount;rep(r,'Wildkeepers',.5*amount);}
 else if(event==='kill_eagle'){r.karma-=.5*amount;r.fame+=.8*amount;rep(r,'Wildkeepers',-1*amount);}
 else if(event==='kill_baddie'){r.karma+=2*amount;r.fame+=1.5*amount;rep(r,'Alderbrook',2*amount);rep(r,'March Wardens',2*amount);r.gold+=2*amount;}
 else if(event==='complete_bounty'){r.karma+=5*amount;r.fame+=4*amount;r.gold+=15*amount;rep(r,'Alderbrook',8*amount);rep(r,'March Wardens',6*amount);}
 else if(event==='complete_expedition'){r.karma+=10*amount;r.fame+=10*amount;r.gold+=35*amount;rep(r,'Alderbrook',15*amount);rep(r,'March Wardens',15*amount);}
 else if(event==='trade_buy'||event==='trade_sell')rep(r,'Free Traders',.75*amount);
 else if(event==='build')rep(r,'Alderbrook',.15*amount);
 else if(event==='forage')rep(r,'Wildkeepers',.05*amount);
 else if(event.startsWith('witness_'))rep(r,'Wildkeepers',.08*amount);
}
export function recordRenownEvent(player:PlayerState,event:RenownEvent,amount=1,tick=0){
 const r=ensureRenown(player);r.counters[event]=(r.counters[event]??0)+amount;tune(r,event,amount);r.karma=Math.round(r.karma*10)/10;r.fame=Math.round(r.fame*10)/10;r.gold=Math.max(0,Math.round(r.gold));
 const unlocked:AchievementDefinition[]=[];for(const a of ACHIEVEMENTS)if(!r.achievements[a.id]&&a.test(r)){r.achievements[a.id]=tick||Date.now();unlocked.push(a);}return unlocked;
}
export function karmaTitle(value:number){if(value<=-50)return 'Dreaded';if(value<=-20)return 'Villainous';if(value<=-5)return 'Shady';if(value>=50)return 'Saintly';if(value>=20)return 'Honorable';if(value>=5)return 'Good';return 'Neutral';}
export function fameTitle(value:number){if(value>=60)return 'Legendary';if(value>=30)return 'Famous';if(value>=15)return 'Notable';if(value>=5)return 'Known';return 'Unknown';}
export function reputationTitle(value:number){if(value>=75)return 'Exalted';if(value>=40)return 'Revered';if(value>=15)return 'Friendly';if(value<=-50)return 'Hated';if(value<=-15)return 'Distrusted';return 'Neutral';}
