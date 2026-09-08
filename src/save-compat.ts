import type {WorldState} from './state';

/**
 * Repair additive v1 fields that older/in-between Alderwatch saves may not contain.
 * Do not fabricate the two identity-bearing roots (`players`, `resources`): callers
 * still reject a save that never had those. Everything here is collection shape only.
 */
export function normalizeLegacyWorldShape(world:any):WorldState{
 world.forage??={};
 world.drops??={};
 world.structures??={};
 world.containers??={};
 world.enemies??={};
 world.opened??=[];
 world.progress??=[];
 world.nextId??=1;
 for(const player of Object.values(world.players??{}) as any[]){
  player.inventory??=[];
  player.buffs??=[];
  player.skills??={};
 }
 return world as WorldState;
}
