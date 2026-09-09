import {addItem,spend,type PlayerState,type WorldState} from './state';
import {crownroadWardForPosition} from './crownroad-world';
import {representativeHouseholdOrdinal} from './crownroad-residents';
import {applyRealmConsequences,districtTrustForActor,householdTrustForActor,wardPressureAt} from './realm-consequences';
import {promoteCanonicalEvent} from './provenance-frontier';

export const GREYHAVEN_PROVISIONER_POSITION=[11,0,-4] as const;
export const GREYHAVEN_PROVISIONER_RADIUS=4.2;

export interface GreyhavenProvisionQuote{
 ward:number;
 householdOrdinal:number;
 householdTrust:number;
 districtTrust:number;
 marketPressure:number;
 guildPressure:number;
 timberCost:number;
 stewCount:number;
 standing:'cold'|'known'|'favored';
}

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

export function greyhavenProvisionerHousehold(world:WorldState){
 const ward=crownroadWardForPosition(GREYHAVEN_PROVISIONER_POSITION[0],GREYHAVEN_PROVISIONER_POSITION[2]);
 return representativeHouseholdOrdinal(world,ward,'greyhaven-provisioner');
}

export function greyhavenProvisionQuote(world:WorldState,player:PlayerState):GreyhavenProvisionQuote{
 applyRealmConsequences(world);
 const ward=crownroadWardForPosition(GREYHAVEN_PROVISIONER_POSITION[0],GREYHAVEN_PROVISIONER_POSITION[2]);
 const householdOrdinal=greyhavenProvisionerHousehold(world);
 const householdTrust=householdTrustForActor(world,householdOrdinal,player.id);
 const districtTrust=districtTrustForActor(world,player.id,ward);
 const pressure=wardPressureAt(world,ward);
 const remembered=householdTrust+districtTrust;
 // Scarcity raises the barter ask; productive guild pressure offsets it. Exact household
 // memory can materially beat rumor-only standing, so helping this house is visible later.
 const timberCost=clamp(Math.round(4+pressure.market*.28+pressure.watch*.12-pressure.guild*.15-remembered*.55),2,8);
 const stewCount=remembered>=4?2:1;
 const standing=remembered>=4?'favored':remembered>=1?'known':'cold';
 return {ward,householdOrdinal,householdTrust,districtTrust,marketPressure:pressure.market,guildPressure:pressure.guild,timberCost,stewCount,standing};
}

export function useGreyhavenProvisioner(world:WorldState,player:PlayerState){
 const quote=greyhavenProvisionQuote(world,player);
 if(!spend(player,{wood:quote.timberCost}))return {ok:false,message:`Greyhaven provisioner: bring ${quote.timberCost} oak timber for the cookfires.`,quote};
 addItem(world,player,'hearty_stew',quote.stewCount);
 const externalKey=`greyhaven-provision:${player.id}:${world.tick}:${world.nextId}`;
 promoteCanonicalEvent(world,{
  source:'player',actorId:player.id,actorName:player.name,ward:quote.ward,channel:'market',externalKey,
  subjects:['greyhaven-provisioner',`house:${quote.householdOrdinal}`],
  summary:`${player.name} helped the Greyhaven provisioners keep their cookfires supplied, trading ${quote.timberCost} timber into the local market. House ${quote.householdOrdinal} remembers the aid.`
 });
 applyRealmConsequences(world);
 const next=greyhavenProvisionQuote(world,player);
 const reward=quote.stewCount===2?'two Marcher’s stews':'a Marcher’s stew';
 return {ok:true,message:`Greyhaven provisioner · ${quote.timberCost} timber → ${reward}. The household remembers the trade.`,quote:next};
}

export function nearGreyhavenProvisioner(x:number,z:number,radius=GREYHAVEN_PROVISIONER_RADIUS){
 return Math.hypot(x-GREYHAVEN_PROVISIONER_POSITION[0],z-GREYHAVEN_PROVISIONER_POSITION[2])<=radius;
}
