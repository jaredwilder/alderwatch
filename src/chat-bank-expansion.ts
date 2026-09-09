import {PLAYER_BOTS} from './simulated-players';
import {NPC_ROSTER} from './npcs';

/**
 * Pure copy expansion only: no new state authority, routing, commands or AI surface.
 * These lines are deliberately short, uneven, occasionally stupid, and written to
 * sound like people inhabiting the same messy MMO rather than a dialogue generator.
 */
export const PLAYER_CHAT_EXPANSION:Record<string,readonly string[]>={
 kestrel:[
  'whoever aggroed that bear owes me rent','bro i parried a sheep psychologically','south road is cursed do not ask for evidence','im carrying this expedition emotionally and badly','somebody duel me by the broken cart','that deer has better movement than half this server','who put a campfire IN the doorway lmao','i found iron. suddenly everyone is my friend','if you need help say please so i can say no first','VEXED is typing like hes about to invoice us','wait wait wait dont kill it yet','nah that hitbox had a personal issue with me','im at alderbrook. bring problems','there is absolutely a guy in the woods. source: vibes','i stole nothing. i relocated unattended resources','who has arrows and poor judgment','ok that was actually clean','LMAO THE BISON','do not follow me i have no plan','fine follow me i have a slightly better no plan'
 ],
 mira:[
  'left cooked food near the bench again dont all inhale it','does anyone actually need flax or am i becoming flax','found a nice build spot and immediately got chased off it lol','if youre hurt come back toward town i have food','whoever dropped 40 stone i love you a normal amount','wait there are THREE bears over there','i can bring timber if someone marks where','made extra stew because apparently we live like this now','pls stop fighting next to the storage chest lol','i found someones axe by the road again','anyone want to go get iron? i dont want to go alone','the camp looks way better now omg','i am once again asking everyone to close the door','hold on im coming with bandages and bad timing','there is a deer stuck judging me','who needs berries i have become the berry problem','i can fix that wall','dont sell all the honey i need some','okay whoever built this little corner its cute','coming back. inventory is a disaster'
 ],
 vex:[
  'stop pulling everything','that was your plan?','unbelievable pathing. yours, not the wolf','door. use it.','you missed an animal the size of a cottage','do not bring that thing here','i said north. that is not north.','clean hit. finally.','your inventory management is offensive','drop the junk and move','three of you for one deer. historic','who built this','no seriously who built this','ill hold the road. dont make it weird','bear incoming. wake up','you have ten seconds before this becomes my problem','acceptable','that was almost competent','quit looting during aggro','fine. good fight.'
 ],
 laggoblin:[
  'the moss moved first','bad news the hill has opinions','found a rock shaped like administrative failure','why is the deer walking like it pays taxes','there are too many crows for this to be casual','i heard crafting noises from an empty house','new theory: road is longer when carrying iron','someone put 1 berry in storage. threatening','the bison has selected violence and also me','wait why is the moon daytime colored','i am following a suspicious fern','do trees respawn mad','the cart wheel blinked. documented','MOSS KNOWS','if i disappear delete my mushroom collection','okay the fog did not know my password. it guessed it','there is a goat where no goat should achieve','inventory says full but spiritually i have room','who keeps leaving doors open for the entities','im going east until something explains itself'
 ],
 river:[
  'if the roof leaks im naming it after whoever rushed me','good foundation. dont get excited','bring another stack of timber and we can finish this','somebody put the chest where a door belongs','ive seen worse walls but they were on fire','measure once, rebuild twice apparently','dont waste iron on that yet','road camp needs another light','ill repair it after i finish pretending not to notice it','whoever stacked this stone did alright','weather side needs bracing','leave the good axe in the chest this time','if youre going east take food','thats enough beams. stop helping','nice joinery. suspiciously nice','we can make this place work','dont build downhill from your own door','someone fetch resin','that cart is one pothole from religion','im staying here until this wall learns manners'
 ],
 niko77:[
  'i find iron but bear also find me','we need more wood. always more wood','who take food from chest? is okay but say lol','i go east road. maybe stupid','wait i come with you','this deer very fast man','camp good now. roof little strange','i have stone x40 where put','wolf behind you behind you','inventory full again unbelievable','i make fire here yes?','need one more hide','market person want too much','i bring honey','this road goes nowhere then suddenly bear','nice sword. expensive?','i can help build after this','where everyone go','okay i am lost but productive','coming town now'
 ],
 toast:[
  'buying panic at wholesale prices','bear population up. hide futures complicated','who is hoarding iron i respect and oppose you','berry market has entered a correction','offering 6 stone for one compelling rumor','i can make this deal worse if needed','selling directions. accuracy not guaranteed','someone just flooded market with venison','timber shortage is fake i saw your chest','paying premium for items with a story','do not undercut me during an animal attack','i have acquired seventeen reasons not to open my inventory','who wants a deeply questionable bundle deal','honey is basically gold if you ignore economics','new listing: axe, lightly abandoned','market update: everyone is broke','i will buy that before you realize you need it','trading stew for iron. this is financial advice','inventory space available for lease','crow products remain an emerging sector'
 ],
 quietfox:[
  'two wolves east','dont cross yet','found iron','bear moved south','need wood','road clear','not clear anymore','good shot','too many tracks','come here','wait','heard something','wrong hill','bison close','leave it','taking the long way','door open','three deer north','nice camp','im back'
 ]
};

export const NPC_CHAT_EXPANSION:Record<string,readonly string[]>={
 mara:[
  'If you ask the price twice, it becomes the higher one.','No, I will not buy a wet boot. Its partner, perhaps.','Someone is cornering the berry market and I admire the commitment.','Timber moves before storms. So do sensible traders.','I have three buyers for iron and four liars claiming they found some.','Bring me something scarce, useful, or funny. Ideally all three.','The road tax is not mine. The complaining fee is.','Do not bleed on the merchandise unless you intend to purchase it.','I heard Greyhaven pays better. Greyhaven is also farther away.','A full pack is just a negotiation you have not started yet.','If ToastMerchant comes in here, tell him I died.','That hide is good. Your asking price is fiction.'
 ],
 wulfric:[
  'Half the town wants a bow. Half the town should not have one.','Straight grain, dry string, quiet hands. Then you may blame the wind.','I can fix the bow. I cannot fix what you did with it.','The deer are not impressed by expensive equipment.','Bring feathers that have not been stepped on. A difficult request here.','Your draw is too hard. Pride usually is.','I watched Kestrel miss a bison. We will never speak of it.','An arrow is a small argument delivered very quickly.','Wax the string before it begins complaining.','That shaft is bent enough to navigate around a tree.','Good fletching looks boring. That is how you know it is good.','If you lose another dozen arrows, start naming them.'
 ],
 elske:[
  'The bees are calm. I do not trust it.','Someone tried bargaining with the hive again. The hive won.','Honey is never free. Sometimes the price is merely invisible.','Do not run near the skeps unless you want a faster afternoon.','Smoke drifts. Bees remember. People mostly do neither.','I found a boot beside the hive. No foot. Promising.','The queen has rejected your market theory.','Bring me wax and I will pretend I did not see that swat.','Rain makes them cross. ToastMerchant makes me cross.','A quiet hive is either happy or planning something.','You may have the honey. The bees may have a different opinion.','Tomas asked whether bees can milk crows. I closed the door.'
 ],
 pell:[
  'If it smells heroic, I used too much sage.','Bring meat. Keep the explanation.','Nobody needs to know what went into the blackpot.','The stew is safe. The ladle has seen things.','A hungry guard is a negotiable guard.','I can cook bear. I cannot make bear a good idea.','Salt is low. Complaints remain abundant.','If the venison is still warm, do not tell me why.','I made enough for six. This means four players.','Mushrooms first, then meat, then regret.','The pot has survived three raids and one cooking lesson.','Crow milk is a beverage only in the legal sense.'
 ],
 sigrid:[
  'Whoever set that post can come back and apologize to gravity.','Timber bends. Bad plans bend faster.','A square corner is apparently forbidden knowledge now.','If the roof is decorative, say so before the rain does.','Bring nails. Real nails. Not optimism.','That wall will stand. I am less certain about the builder.','A cart wheel should rotate. This one is exploring alternatives.','Measure from the foundation, not from your feelings.','I can repair it. I cannot unsee it.','The west beam wants replacing before it chooses violence.','Good wood sounds different when you strike it. Bad wood sounds expensive.','Someone has been using my level as a weapon again.'
 ],
 tomas:[
  'The breakthrough remains imminent and poorly funded.','I have solved the bucket problem by acquiring another bucket.','Crow milk is only impossible if you are trapped by existing categories.','Mara has banned the phrase market-ready from her stall. Temporary setback.','The crop is not empty. It is pre-product.','One day they will name a tavern drink after me. Possibly as a warning.','I require herbs, patience, and fewer witnesses.','The prototype separated overnight. This is either progress or soup.','Do not shake the jar. Actually, perhaps shake the jar.','Pell refuses my collaboration proposal. Fear of disruption.','I have revised the process from seven steps to eleven stronger steps.','The crows are withholding key operational knowledge.'
 ],
 ylva:[
  'Fresh tracks east. Heavy. Not deer.','If the birds lift all at once, stop talking.','A bear that circles downwind has already decided something.','Do not chase wounded game into brush you cannot see through.','Three wolves crossed the road before dawn.','The big bison is moving again. Give it the room it thinks it owns.','You can hear bad footing before you see it.','Someone fired at a deer from the road. The deer learned more than they did.','If Moss says the forest blinked, ignore the wording and check the forest.','Carry food. Panic burns through it quickly.','Tracks north are old. Tracks behind you are not.','Hunting alone is quiet. Getting hurt alone is quieter.'
 ],
 'gate-guard':[
  'Road is open. Your judgment remains under review.','If you drag another bear to the gate, I am charging admission.','No fighting in the crossing. Finish it outside like civilized idiots.','I saw three players leave east. Two came back arguing about a mushroom.','Keep the cart lane clear. Yes, that includes your campfire.','Greyhaven road is passable if you define passable generously.','Report raiders, fires, and livestock where livestock should not be.','A bounty notice is not a souvenir. Put it back.','I do not care who started it. I care who finishes it near my gate.','The watch has a list. Being funny does not remove you from it.','If the road goes quiet at midday, come tell me.','Ironward is beyond the hill. So are consequences.'
 ],
 moss:[
  'The old road hums when nobody is walking on it. Very rude.','Found six bootprints going into the brush and seven coming out. Kept walking.','There is a stump east of town that was not there yesterday. Probably a stump.','The bison knows the shortcut. It refuses to negotiate.','I slept under the broken cart once. Woke up somewhere politically different.','If you hear bells in Southwood, there are no bells in Southwood.','Saw Rurik smile. Worse than the wolf thing.','Someone buried a spoon by the road. I respect mysteries with low stakes.','The hill past Ironward looks taller from the wrong side.','Crows trade information. Mostly insults.','Alderbrook has nine people and at least fourteen ongoing theories.','Do not follow the blue mushroom lights. Unless you do. Then take notes.'
 ]
};

const installed=Symbol.for('alderwatch.chat-bank-expansion.v1');

export function installExpandedChatBanks(){
 const g=globalThis as Record<PropertyKey,unknown>;
 if(g[installed])return;
 g[installed]=true;
 for(const player of PLAYER_BOTS){
  const extra=PLAYER_CHAT_EXPANSION[player.id]??[];
  (player as any).ambient=[...player.ambient,...extra];
 }
 for(const npc of NPC_ROSTER){
  const extra=NPC_CHAT_EXPANSION[npc.id]??[];
  (npc as any).lines=[...npc.lines,...extra];
 }
}

if(typeof window!=='undefined')installExpandedChatBanks();
