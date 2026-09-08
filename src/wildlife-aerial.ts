import {aerialProfile,type AnimalState} from './wildlife-species';
import {recordAnimalAct} from './wildlife-notoriety';

export type AerialPreyAction='pickup'|'kill'|'strike'|null;

export function ensureAerialState(animal:AnimalState){
 const config=aerialProfile(animal.kind);if(!config)return animal;
 animal.energy??=config.maxEnergy;
 animal.airborne??=true;
 animal.energy=Math.max(0,Math.min(config.maxEnergy,animal.energy));
 return animal;
}

export function aerialPreyAction(predator:AnimalState,prey:AnimalState):AerialPreyAction{
 const config=aerialProfile(predator.kind);if(!config)return null;
 if(config.pickupPrey.includes(prey.kind))return 'pickup';
 if(config.killPrey.includes(prey.kind))return 'kill';
 return 'strike';
}

export function beginCarry(carrier:AnimalState,prey:AnimalState,tick:number){
 const config=aerialProfile(carrier.kind);
 if(!config||!carrier.airborne||carrier.carriedPreyId||prey.carriedById||!config.pickupPrey.includes(prey.kind))return false;
 carrier.carriedPreyId=prey.id;carrier.carryUntil=tick+Math.round(config.carrySeconds*60);prey.carriedById=carrier.id;
 carrier.huntTargetId=undefined;carrier.huntBestDistance=undefined;recordAnimalAct(carrier,'airlift',tick);
 return true;
}

export function releaseCarry(carrier:AnimalState,animals:Record<string,AnimalState>){
 const prey=carrier.carriedPreyId?animals[carrier.carriedPreyId]:undefined;
 if(prey&&prey.carriedById===carrier.id)prey.carriedById=undefined;
 carrier.carriedPreyId=undefined;carrier.carryUntil=undefined;
 return prey;
}

export interface AerialEnergyStep {landed:boolean;tookOff:boolean;exhaustedDrop:boolean}
export function stepAerialEnergy(animal:AnimalState,dt:number):AerialEnergyStep{
 const config=aerialProfile(animal.kind);if(!config)return {landed:false,tookOff:false,exhaustedDrop:false};
 ensureAerialState(animal);let landed=false,tookOff=false;
 if(animal.airborne){
  const drain=animal.carriedPreyId?config.carryDrainPerSecond:config.flightDrainPerSecond;
  animal.energy=Math.max(0,(animal.energy??config.maxEnergy)-drain*dt);
  if(animal.energy<=0){animal.airborne=false;landed=true;}
 }else{
  animal.energy=Math.min(config.maxEnergy,(animal.energy??0)+config.groundRecoverPerSecond*dt);
  if(animal.energy>=config.takeoffEnergy){animal.airborne=true;tookOff=true;}
 }
 return {landed,tookOff,exhaustedDrop:landed&&!!animal.carriedPreyId};
}

export function groundPredatorCanReach(prey:AnimalState){return !aerialProfile(prey.kind)||prey.airborne!==true;}
