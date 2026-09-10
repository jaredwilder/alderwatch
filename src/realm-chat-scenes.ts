export type RealmChatBotId='kestrel'|'mira'|'vex'|'laggoblin'|'river'|'niko77'|'toast'|'quietfox';
export type RealmChatTopic='bear'|'wolves'|'bison'|'build'|'trade'|'food'|'iron'|'road'|'combat'|'weird'|'help'|'misc';
export type RealmChatFact='bear-near'|'wolf-pack'|'bison-near'|'enemy-near'|'low-health'|'low-stamina'|'far-out'|'combat'|'structure-added'|'animal-kill'|'iron-gain'|'food-gain'|'hide-gain';

export interface RealmChatBeat {speakers:readonly RealmChatBotId[];lines:readonly string[];delay?:readonly [number,number]}
export interface RealmChatScene {id:string;requires?:readonly RealmChatFact[];any?:readonly RealmChatFact[];priority:number;cooldown:number;once?:boolean;beats:readonly RealmChatBeat[]}
export interface RealmChatInterjection {speakers:readonly RealmChatBotId[];lines:readonly string[]}

export const CONTEXT_CHAT_SCENES:readonly RealmChatScene[]=[
 {id:'bear-close-1',requires:['bear-near'],priority:82,cooldown:150,beats:[
  {speakers:['quietfox','vex'],lines:['bear close','bear. close.','bear nearby'],delay:[0,0]},
  {speakers:['kestrel','mira'],lines:['where exactly because i have a terrible amount of confidence','pls nobody kite it through camp again','okay who is volunteering to make this worse'],delay:[700,1600]},
  {speakers:['vex','toast','laggoblin'],lines:['do not bring it here','alive bear is a liability. dead bear is inventory','ask if it has a quest first'],delay:[650,1500]},
 ]},
 {id:'bear-close-2',requires:['bear-near','low-health'],priority:96,cooldown:210,beats:[
  {speakers:['mira'],lines:['you are NOT fighting that bear on that health lol','come back toward us please','absolutely not. heal first'],delay:[0,0]},
  {speakers:['vex','kestrel'],lines:['for once mira is right','yeah no thats a corpse speedrun','the bear has more health than your future'],delay:[650,1300]},
 ]},
 {id:'wolf-pack-1',requires:['wolf-pack'],priority:84,cooldown:145,beats:[
  {speakers:['quietfox'],lines:['pack close','multiple wolves','wolves. more than two'],delay:[0,0]},
  {speakers:['vex','kestrel'],lines:['dont split them unless you can finish one','finally something worth hitting','whoever pulls first better keep moving'],delay:[650,1400]},
  {speakers:['mira','niko77'],lines:['i have food if this goes badly','okay i come but dont run opposite directions','stay together pls'],delay:[700,1500]},
 ]},
 {id:'bison-near-1',requires:['bison-near'],priority:72,cooldown:190,beats:[
  {speakers:['quietfox','niko77'],lines:['bison close','big one nearby','bison here. give space'],delay:[0,0]},
  {speakers:['kestrel','laggoblin'],lines:['chat i can absolutely take it (lie)','it has chosen a direction and i oppose that direction','do not challenge the meat locomotive'],delay:[650,1500]},
  {speakers:['toast','vex'],lines:['potentially enormous inventory event','if anyone punches it near me im logging out emotionally','leave it until we have an actual plan'],delay:[700,1600]},
 ]},
 {id:'enemy-near-1',requires:['enemy-near'],priority:90,cooldown:120,beats:[
  {speakers:['quietfox','vex'],lines:['company','hostiles close','heads up. not wildlife'],delay:[0,0]},
  {speakers:['kestrel','vex'],lines:['good. i was getting productive','positions first loot later','okay finally stop hitting livestock'],delay:[500,1200]},
 ]},
 {id:'low-health-1',requires:['low-health'],priority:76,cooldown:170,beats:[
  {speakers:['mira','niko77'],lines:['hey maybe eat literally anything','you need food bad lol','come camp i have food'],delay:[0,0]},
  {speakers:['kestrel','vex','river'],lines:['health bar doing minimalist art rn','youre one squirrel away from a loading screen','hard to build when dead. old carpenter wisdom'],delay:[650,1400]},
 ]},
 {id:'low-stamina-1',requires:['low-stamina'],priority:56,cooldown:170,beats:[
  {speakers:['river','mira','niko77'],lines:['slow down before you arrive nowhere tired','eat something dude','wait little. stamina first'],delay:[0,0]},
  {speakers:['kestrel','laggoblin'],lines:['cardio diff','stamina is a social construct until wolf','walking update deployed'],delay:[650,1300]},
 ]},
 {id:'far-out-1',requires:['far-out'],priority:48,cooldown:240,beats:[
  {speakers:['quietfox','river'],lines:['youre pretty far out','long walk back from there','thats a long way from the fire'],delay:[0,0]},
  {speakers:['laggoblin','kestrel','mira'],lines:['good thats where the map starts lying','bring something weird back','pls at least come back with a story'],delay:[700,1600]},
 ]},
 {id:'build-complete-1',requires:['structure-added'],priority:110,cooldown:25,beats:[
  {speakers:['river','mira'],lines:['new piece is up','okay that actually helped','there we go. civilization by inches'],delay:[0,0]},
  {speakers:['vex','kestrel','niko77'],lines:['acceptable. next','wait hold on we built something that isnt cursed','good. now another one'],delay:[700,1600]},
 ]},
 {id:'build-complete-2',requires:['structure-added'],priority:104,cooldown:25,beats:[
  {speakers:['vex'],lines:['who placed that','i am inspecting this aggressively','dont celebrate until it survives contact with geometry'],delay:[0,0]},
  {speakers:['river','mira','kestrel'],lines:['leave it alone vex it stands','lmao give it six seconds','VEXED has entered municipal review'],delay:[650,1400]},
  {speakers:['vex'],lines:['i said acceptable not good','standards are free','someone has to have eyes'],delay:[650,1400]},
 ]},
 {id:'animal-kill-1',requires:['animal-kill'],priority:108,cooldown:18,beats:[
  {speakers:['kestrel','quietfox','vex'],lines:['down','clean','finally'],delay:[0,0]},
  {speakers:['toast','mira','niko77'],lines:['loot before economics changes','grab the meat dont leave it','nice. food secured maybe'],delay:[550,1200]},
 ]},
 {id:'animal-kill-2',requires:['animal-kill','low-health'],priority:116,cooldown:18,beats:[
  {speakers:['mira','vex'],lines:['okay NOW heal','won the fight lost the health bar','you survived. barely counts'],delay:[0,0]},
  {speakers:['kestrel','toast'],lines:['worth','corpse positive balance sheet','never punished lmao'],delay:[600,1300]},
 ]},
 {id:'iron-haul-1',requires:['iron-gain'],priority:106,cooldown:35,beats:[
  {speakers:['toast'],lines:['IRON DETECTED. suddenly im available','hello valued iron owner','market notification: i care now'],delay:[0,0]},
  {speakers:['niko77','river','vex'],lines:['bring camp. we need it','dont sell all of it this time','do not encourage him'],delay:[650,1400]},
  {speakers:['toast'],lines:['counterpoint: encourage me','i can offer several stones and a future apology','ignore the anti-commerce lobby'],delay:[650,1400]},
 ]},
 {id:'food-haul-1',requires:['food-gain'],priority:88,cooldown:45,beats:[
  {speakers:['mira','niko77','toast'],lines:['okay food situation improved','nice. actual food','inventory becoming edible. bullish'],delay:[0,0]},
  {speakers:['kestrel','vex','laggoblin'],lines:['dibs if its not crow related','eat before you start another stupid fight','does it know it is food yet'],delay:[700,1500]},
 ]},
 {id:'hide-haul-1',requires:['hide-gain'],priority:82,cooldown:50,beats:[
  {speakers:['toast'],lines:['hide liquidity event','i am respectfully looking at that hide','wow nice hide unrelated what are your prices'],delay:[0,0]},
  {speakers:['vex','mira','river'],lines:['hes going to lowball you','keep some for crafting lol','use it before you convert it into toast money'],delay:[650,1400]},
 ]},
 {id:'combat-hot-1',requires:['combat'],priority:70,cooldown:95,beats:[
  {speakers:['vex','quietfox','kestrel'],lines:['finish the fight','eyes up','less typing more violence'],delay:[0,0]},
 ]},
];

export const AMBIENT_CHAT_THREADS:readonly RealmChatScene[]=[
 {id:'storage-one-item',priority:20,cooldown:900,beats:[
  {speakers:['kestrel'],lines:['who put ONE stone in the chest'],delay:[0,0]},
  {speakers:['river'],lines:['same person who leaves empty tools in there probably'],delay:[700,1500]},
  {speakers:['laggoblin'],lines:['thats the ceremonial stone dont move it'],delay:[650,1500]},
  {speakers:['vex'],lines:['im moving it'],delay:[550,1100]},
 ]},
 {id:'toast-tax',priority:20,cooldown:820,beats:[
  {speakers:['toast'],lines:['new policy im charging a convenience fee for convenient items'],delay:[0,0]},
  {speakers:['mira'],lines:['you dont own the chest toast'],delay:[700,1400]},
  {speakers:['toast'],lines:['great then its a platform fee'],delay:[600,1300]},
 ]},
 {id:'lag-tree-court',priority:20,cooldown:980,beats:[
  {speakers:['laggoblin'],lines:['need a second opinion. tree looks guilty yes or no'],delay:[0,0]},
  {speakers:['quietfox'],lines:['yes'],delay:[650,1100]},
  {speakers:['river'],lines:['of what'],delay:[500,1000]},
  {speakers:['laggoblin'],lines:['finally somebody asks the dangerous question'],delay:[650,1300]},
 ]},
 {id:'vex-wall-review',priority:20,cooldown:860,beats:[
  {speakers:['vex'],lines:['which one of you is emotionally attached to the west wall'],delay:[0,0]},
  {speakers:['mira'],lines:['why'],delay:[500,1000]},
  {speakers:['vex'],lines:['preparing you'],delay:[550,1100]},
  {speakers:['river'],lines:['leave my wall alone'],delay:[550,1200]},
 ]},
 {id:'kestrel-duel-admin',priority:20,cooldown:780,beats:[
  {speakers:['kestrel'],lines:['anyone duel me by the road'],delay:[0,0]},
  {speakers:['vex'],lines:['no'],delay:[500,900]},
  {speakers:['kestrel'],lines:['cowardice acknowledged'],delay:[500,1000]},
  {speakers:['vex'],lines:['im six feet from you'],delay:[550,1100]},
 ]},
 {id:'niko-directions',priority:20,cooldown:900,beats:[
  {speakers:['niko77'],lines:['which way east road after big rock'],delay:[0,0]},
  {speakers:['quietfox'],lines:['left at split'],delay:[550,1100]},
  {speakers:['laggoblin'],lines:['DO NOT trust left conceptually'],delay:[550,1200]},
  {speakers:['niko77'],lines:['okay i trust fox'],delay:[550,1150]},
 ]},
 {id:'mira-food-label',priority:20,cooldown:760,beats:[
  {speakers:['mira'],lines:['i labeled the food chest again'],delay:[0,0]},
  {speakers:['kestrel'],lines:['counterpoint i cannot read'],delay:[550,1100]},
  {speakers:['vex'],lines:['we know'],delay:[450,850]},
 ]},
 {id:'river-axe',priority:20,cooldown:920,beats:[
  {speakers:['river'],lines:['whose axe is in the road'],delay:[0,0]},
  {speakers:['kestrel'],lines:['road axe'],delay:[550,1000]},
  {speakers:['river'],lines:['thats not an owner'],delay:[550,1100]},
  {speakers:['laggoblin'],lines:['road owns it under salvage law'],delay:[600,1200]},
 ]},
 {id:'bear-insurance',priority:20,cooldown:980,beats:[
  {speakers:['toast'],lines:['gauging interest in bear insurance'],delay:[0,0]},
  {speakers:['mira'],lines:['what does it cover'],delay:[550,1050]},
  {speakers:['toast'],lines:['mostly the emotional period before the bear'],delay:[600,1250]},
  {speakers:['vex'],lines:['nothing. it covers nothing.'],delay:[500,1000]},
 ]},
 {id:'quietfox-long-message',priority:20,cooldown:1200,once:true,beats:[
  {speakers:['quietfox'],lines:['i have considered the situation carefully and i think we should take the north ridge instead'],delay:[0,0]},
  {speakers:['kestrel'],lines:['FOX PARAGRAPH'],delay:[450,900]},
  {speakers:['mira'],lines:['omg screenshot it'],delay:[450,900]},
  {speakers:['quietfox'],lines:['regret'],delay:[450,900]},
 ]},
 {id:'mushroom-union',priority:20,cooldown:1080,beats:[
  {speakers:['laggoblin'],lines:['mushroom update: they have organized'],delay:[0,0]},
  {speakers:['niko77'],lines:['what'],delay:[450,900]},
  {speakers:['laggoblin'],lines:['cant discuss active negotiations'],delay:[550,1100]},
  {speakers:['toast'],lines:['can i invest'],delay:[550,1100]},
 ]},
 {id:'camp-name',priority:20,cooldown:1300,beats:[
  {speakers:['mira'],lines:['does the camp have a name yet'],delay:[0,0]},
  {speakers:['kestrel'],lines:['bad decisions fort'],delay:[550,1100]},
  {speakers:['river'],lines:['no'],delay:[450,850]},
  {speakers:['laggoblin'],lines:['the no is part of the name'],delay:[550,1100]},
 ]},
 {id:'toast-crow-portfolio',priority:20,cooldown:1100,beats:[
  {speakers:['toast'],lines:['i am exiting my crow position'],delay:[0,0]},
  {speakers:['vex'],lines:['you never had a crow position'],delay:[550,1050]},
  {speakers:['toast'],lines:['then the exit was extremely efficient'],delay:[600,1200]},
 ]},
 {id:'vex-compliment',priority:20,cooldown:1500,once:true,beats:[
  {speakers:['vex'],lines:['camp looks decent'],delay:[0,0]},
  {speakers:['mira'],lines:['EVERYONE BE NORMAL'],delay:[450,850]},
  {speakers:['kestrel'],lines:['clip it'],delay:[450,850]},
  {speakers:['vex'],lines:['never mind'],delay:[500,950]},
 ]},
 {id:'river-weather',priority:20,cooldown:980,beats:[
  {speakers:['river'],lines:['if weather turns im blaming whoever skipped the roof'],delay:[0,0]},
  {speakers:['kestrel'],lines:['weather cant prove anything'],delay:[550,1100]},
  {speakers:['river'],lines:['rain has witnesses'],delay:[550,1100]},
 ]},
 {id:'mira-group-trip',priority:20,cooldown:920,beats:[
  {speakers:['mira'],lines:['anyone wanna do a normal calm supply run'],delay:[0,0]},
  {speakers:['kestrel'],lines:['define normal'],delay:[500,950]},
  {speakers:['mira'],lines:['youre uninvited already'],delay:[500,1000]},
  {speakers:['kestrel'],lines:['omw'],delay:[450,900]},
 ]},
 {id:'niko-market',priority:20,cooldown:1000,beats:[
  {speakers:['niko77'],lines:['toast why three stone for berry'],delay:[0,0]},
  {speakers:['toast'],lines:['market conditions'],delay:[500,950]},
  {speakers:['niko77'],lines:['condition is robbery'],delay:[550,1050]},
  {speakers:['vex'],lines:['hes learning'],delay:[450,900]},
 ]},
 {id:'fox-bear',priority:20,cooldown:1150,beats:[
  {speakers:['quietfox'],lines:['bear moved'],delay:[0,0]},
  {speakers:['kestrel'],lines:['where'],delay:[450,900]},
  {speakers:['quietfox'],lines:['away'],delay:[450,850]},
  {speakers:['kestrel'],lines:['incredible intelligence thank you'],delay:[550,1050]},
 ]},
 {id:'lag-map',priority:20,cooldown:1280,beats:[
  {speakers:['laggoblin'],lines:['my map and the world are in a disagreement'],delay:[0,0]},
  {speakers:['river'],lines:['follow the road'],delay:[500,1000]},
  {speakers:['laggoblin'],lines:['road is a biased witness'],delay:[550,1100]},
 ]},
 {id:'kestrel-goat',priority:20,cooldown:1400,once:true,beats:[
  {speakers:['kestrel'],lines:['hypothetical can a goat hold a grudge'],delay:[0,0]},
  {speakers:['quietfox'],lines:['yes'],delay:[450,850]},
  {speakers:['mira'],lines:['what did you DO'],delay:[450,900]},
  {speakers:['kestrel'],lines:['next question'],delay:[500,950]},
 ]},
 {id:'toast-rumor-market',priority:20,cooldown:1000,beats:[
  {speakers:['toast'],lines:['buying rumors. paying based on entertainment value'],delay:[0,0]},
  {speakers:['laggoblin'],lines:['i have institutional volume'],delay:[550,1100]},
  {speakers:['toast'],lines:['you are why i need risk controls'],delay:[550,1100]},
 ]},
 {id:'river-chair',priority:20,cooldown:1400,once:true,beats:[
  {speakers:['river'],lines:['who built a chair before we finished storage'],delay:[0,0]},
  {speakers:['laggoblin'],lines:['morale infrastructure'],delay:[550,1050]},
  {speakers:['river'],lines:['im burning morale infrastructure'],delay:[550,1100]},
 ]},
 {id:'mira-sheep',priority:20,cooldown:1040,beats:[
  {speakers:['mira'],lines:['there is a sheep just standing here staring at me'],delay:[0,0]},
  {speakers:['laggoblin'],lines:['inspection'],delay:[450,850]},
  {speakers:['vex'],lines:['ignore him'],delay:[450,850]},
  {speakers:['laggoblin'],lines:['thats what the sheep wants'],delay:[500,950]},
 ]},
 {id:'vex-loot',priority:20,cooldown:920,beats:[
  {speakers:['vex'],lines:['stop leaving garbage in storage'],delay:[0,0]},
  {speakers:['toast'],lines:['garbage is pre-market inventory'],delay:[500,1000]},
  {speakers:['vex'],lines:['youre pre-muted'],delay:[500,950]},
 ]},
 {id:'niko-fox',priority:20,cooldown:1120,beats:[
  {speakers:['niko77'],lines:['fox how you always know where animal is'],delay:[0,0]},
  {speakers:['quietfox'],lines:['look'],delay:[450,850]},
  {speakers:['niko77'],lines:['very useful thank you lol'],delay:[500,950]},
 ]},
 {id:'camp-meeting',priority:20,cooldown:1500,once:true,beats:[
  {speakers:['river'],lines:['we should have an actual plan for the camp'],delay:[0,0]},
  {speakers:['kestrel'],lines:['denied'],delay:[450,850]},
  {speakers:['mira'],lines:['seconded'],delay:[450,850]},
  {speakers:['river'],lines:['thats not how plans work'],delay:[500,1000]},
 ]},
 {id:'lag-crow-case',priority:20,cooldown:1600,once:true,beats:[
  {speakers:['laggoblin'],lines:['crow has been following me for ten minutes. building a case'],delay:[0,0]},
  {speakers:['toast'],lines:['do you owe it money'],delay:[500,950]},
  {speakers:['laggoblin'],lines:['not in this jurisdiction'],delay:[550,1050]},
  {speakers:['vex'],lines:['i hate this server'],delay:[450,900]},
 ]},
];

export const PLAYER_TOPIC_INTERJECTIONS:Record<RealmChatTopic,readonly RealmChatInterjection[]>={
 bear:[
  {speakers:['kestrel'],lines:['where. asking irresponsibly','bear? coordinates immediately','how bear are we talking']},
  {speakers:['vex'],lines:['do not bring it to camp','kill it or leave it alone','if its chasing you keep running past me']},
  {speakers:['mira'],lines:['pls dont solo it lol','do you need food first','wait are you okay']},
  {speakers:['quietfox'],lines:['which side','how close','tracks?']},
  {speakers:['toast'],lines:['alive bear or inventory bear','interested in post-bear assets','bear news moves markets']},
  {speakers:['laggoblin'],lines:['ask its intentions','same bear or new management','bear has entered the chat spiritually']},
 ],
 wolves:[
  {speakers:['quietfox'],lines:['how many','where','pack or one']},
  {speakers:['vex'],lines:['dont split them','finish one first','stop running in circles then']},
  {speakers:['kestrel'],lines:['omw to make this worse','wolf content lets go','finally chat has a purpose']},
  {speakers:['mira'],lines:['come toward camp if youre hurt','i can bring food','dont get surrounded pls']},
  {speakers:['niko77'],lines:['i come help','two? three?','wait me i have sword']},
 ],
 bison:[
  {speakers:['quietfox'],lines:['leave room','dont stand downhill','big one?']},
  {speakers:['kestrel'],lines:['i can take it in a fair legal proceeding','bison duel arc begins','do NOT tell vex im going there']},
  {speakers:['toast'],lines:['how much bison hypothetically','meat index waking up','keep me informed financially']},
  {speakers:['laggoblin'],lines:['meat locomotive detected','they remember faces','bison politics are escalating']},
 ],
 build:[
  {speakers:['river'],lines:['what are we building','mark the spot','foundation first']},
  {speakers:['mira'],lines:['i can bring wood','wait i wanna help','where at']},
  {speakers:['vex'],lines:['show me before you place anything','define building','please use a square angle once']},
  {speakers:['niko77'],lines:['i have wood','yes where','i help']},
  {speakers:['kestrel'],lines:['architectural mistakes incoming','can i be unqualified foreman','make it taller for no reason']},
 ],
 trade:[
  {speakers:['toast'],lines:['HELLO','name a price badly','finally relevant chat']},
  {speakers:['vex'],lines:['dont trade with toast','check the count first','hes already typing']},
  {speakers:['mira'],lines:['what do you need','i might have extra','pls dont let toast scam you']},
 ],
 food:[
  {speakers:['mira'],lines:['i have some at camp','what do you need','wait i can cook']},
  {speakers:['niko77'],lines:['i have berries maybe','come camp','food chest']},
  {speakers:['toast'],lines:['food market open','edible or technically edible','i have inventory with nutritional allegations']},
  {speakers:['kestrel'],lines:['anything except crow','if its free im hungry','food buff me immediately']},
 ],
 iron:[
  {speakers:['toast'],lines:['where did you find iron','selling? just asking aggressively','iron owner detected']},
  {speakers:['river'],lines:['save it for fittings','bring it back','good. dont waste it']},
  {speakers:['niko77'],lines:['nice bring camp','we need many iron','where mine']},
  {speakers:['vex'],lines:['do not sell all of it','toast sit down','keep enough to actually make something']},
 ],
 road:[
  {speakers:['quietfox'],lines:['which road','what marker','north or east']},
  {speakers:['river'],lines:['stay on it after dark','road beats brush','take food']},
  {speakers:['laggoblin'],lines:['roads are suggestions with drainage','which version of the road','road has been acting normal. suspicious']},
 ],
 combat:[
  {speakers:['vex'],lines:['finish first type later','block','stop typing']},
  {speakers:['kestrel'],lines:['WIN THEN EXPLAIN','clip it','send location']},
  {speakers:['mira'],lines:['you good??','come back if low','dont die typing lol']},
 ],
 weird:[
  {speakers:['laggoblin'],lines:['finally','continue immediately','i believe you with no evidence']},
  {speakers:['kestrel'],lines:['bro what','screenshots or propaganda','okay im listening unfortunately']},
  {speakers:['quietfox'],lines:['where','describe it','dont touch it']},
  {speakers:['vex'],lines:['ignore lag','probably nothing','if lag says touch it dont']},
 ],
 help:[
  {speakers:['mira'],lines:['yeah what do you need','where are you','i can come']},
  {speakers:['niko77'],lines:['yes i help','where','coming']},
  {speakers:['kestrel'],lines:['say please so i can pretend to negotiate','omw probably','what disaster']},
  {speakers:['vex'],lines:['with what','location','make it quick']},
 ],
 misc:[],
};

export const CALLBACK_INTERJECTIONS:Record<Exclude<RealmChatTopic,'misc'>,readonly RealmChatInterjection[]>={
 bear:[
  {speakers:['kestrel'],lines:['still thinking about {a}s bear report btw','re: the bear situation from {a}: bad genre of sentence','did {a} ever resolve the bear problem or become it']},
  {speakers:['laggoblin'],lines:['{a}s bear message has entered my evidence board','following up on the bear lore. professionally','bear thread remains spiritually open']},
 ],
 wolves:[
  {speakers:['quietfox'],lines:['about those wolves earlier: stay alert','still watching the wolf situation','wolf message noted']},
  {speakers:['vex'],lines:['if {a}s wolf problem comes here im blaming chat','still not grouping for a wolf parade','wolf issue from earlier better stay elsewhere']},
 ],
 bison:[
  {speakers:['toast'],lines:['following up on {a}s bison disclosure for market reasons','bison thread remains financially significant','still accepting post-bison inventory']},
  {speakers:['laggoblin'],lines:['{a}s bison report changed my worldview slightly','bison case remains open','still processing the bison information']},
 ],
 build:[
  {speakers:['river'],lines:['{a} did that build problem ever get fixed','still thinking about that wall conversation','whoever mentioned building earlier: i have opinions now']},
  {speakers:['vex'],lines:['i reviewed the build take from earlier. denied','still disagreeing with the architecture thread','the earlier building plan remains suspicious']},
 ],
 trade:[
  {speakers:['toast'],lines:['circling back to the trade thing because money','whoever mentioned selling earlier im suddenly free','trade thread still open if anyone developed judgment']},
  {speakers:['vex'],lines:['reminder that toast is not a neutral market','do not let the earlier trade discussion become a toast discussion','financial safety announcement: no']},
 ],
 food:[
  {speakers:['mira'],lines:['did whoever needed food earlier actually eat','food check from earlier btw','still have food if that was unresolved']},
  {speakers:['kestrel'],lines:['i would like to reopen the food discussion for selfish reasons','food thread update: still hungry','whoever said food earlier created demand']},
 ],
 iron:[
  {speakers:['toast'],lines:['reopening {a}s iron topic with cash-adjacent enthusiasm','still thinking about that iron','iron conversation remains extremely actionable']},
  {speakers:['river'],lines:['save some of that iron from earlier','iron is useful before it becomes currency','dont forget the iron job']},
 ],
 road:[
  {speakers:['quietfox'],lines:['still thinking about that road report','road note from earlier: remembered','whoever asked road: take the ridge if unsure']},
  {speakers:['laggoblin'],lines:['the road discourse has not concluded','{a}s road message keeps gaining implications','i have developed a second road theory unfortunately']},
 ],
 combat:[
  {speakers:['vex'],lines:['earlier fight looked survivable. barely','combat thread closed? good','still judging that fight from earlier']},
  {speakers:['kestrel'],lines:['was the earlier fight cool or just medically expensive','fight recap when','still waiting on combat highlights']},
 ],
 weird:[
  {speakers:['laggoblin'],lines:['{a} i have not forgotten the weird thing','the earlier weird report has aged beautifully','update: still no normal explanation for that message']},
  {speakers:['quietfox'],lines:['about the weird thing earlier: dont touch it','still want a location on that weird report','weird report remembered']},
 ],
 help:[
  {speakers:['mira'],lines:['did whoever needed help earlier get sorted','still need help from earlier?','checking that help request didnt vanish']},
  {speakers:['niko77'],lines:['you still need help?','help thing okay now?','i can still come if need']},
 ],
};

export const RARE_CHAT_SCENES:readonly RealmChatScene[]=[
 {id:'rare-fox-poetry',priority:4,cooldown:99999,once:true,beats:[
  {speakers:['quietfox'],lines:['sunset on wet steel. wolf tracks crossing ours. nice night.'],delay:[0,0]},
  {speakers:['kestrel'],lines:['WHO STOLE FOX ACCOUNT'],delay:[450,850]},
  {speakers:['quietfox'],lines:['blocked'],delay:[450,850]},
 ]},
 {id:'rare-toast-ipo',priority:4,cooldown:99999,once:true,beats:[
  {speakers:['toast'],lines:['announcing initial public offering of one barrel'],delay:[0,0]},
  {speakers:['river'],lines:['thats my barrel'],delay:[500,950]},
  {speakers:['toast'],lines:['founder dispute. normal at this stage'],delay:[550,1050]},
 ]},
 {id:'rare-lag-prophecy',priority:4,cooldown:99999,once:true,beats:[
  {speakers:['laggoblin'],lines:['at 3:17 the west fern will know too much'],delay:[0,0]},
  {speakers:['mira'],lines:['what happens at 3:17'],delay:[500,950]},
  {speakers:['laggoblin'],lines:['excellent question dont be west'],delay:[550,1050]},
 ]},
 {id:'rare-vex-heart',priority:4,cooldown:99999,once:true,beats:[
  {speakers:['vex'],lines:['good run today'],delay:[0,0]},
  {speakers:['kestrel'],lines:['????????'],delay:[400,800]},
  {speakers:['mira'],lines:['are you sick'],delay:[400,800]},
  {speakers:['vex'],lines:['forget it'],delay:[450,850]},
 ]},
 {id:'rare-river-dad',priority:4,cooldown:99999,once:true,beats:[
  {speakers:['river'],lines:['proud of this camp actually'],delay:[0,0]},
  {speakers:['mira'],lines:['awww'],delay:[450,850]},
  {speakers:['river'],lines:['dont start'],delay:[450,850]},
 ]},
 {id:'rare-niko-wealth',priority:4,cooldown:99999,once:true,beats:[
  {speakers:['niko77'],lines:['i have 99 wood. i am rich man now'],delay:[0,0]},
  {speakers:['toast'],lines:['we should discuss wealth management'],delay:[500,950]},
  {speakers:['niko77'],lines:['no'],delay:[450,850]},
 ]},
];
