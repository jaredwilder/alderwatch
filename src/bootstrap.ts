import {consumePendingArea,currentPlayer,DEEP_IRON_MINE,enterSavedArea,IRONWARD_BASIN,IRONWARD_CROSSING,migrateRealmSave,playerArea} from './realm-save';
import {advanceRealmPopulationToTick,ensureRealmPopulation} from './realm-population';

const SAVE_KEY='alderwatch.realm.v1';

function prepareSavedArea(){
  let world:any;
  try{world=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{world=null;}
  if(!world?.players)return 'far-march';
  migrateRealmSave(world);
  ensureRealmPopulation(world);
  advanceRealmPopulationToTick(world);
  const pending=consumePendingArea();
  if(pending)enterSavedArea(world,pending);
  // Realm migration/population catch-up is authoritative even when no area transition occurred.
  localStorage.setItem(SAVE_KEY,JSON.stringify(world));
  return currentPlayer(world)?playerArea(currentPlayer(world)!):'far-march';
}

const area=prepareSavedArea();
if(area===IRONWARD_CROSSING){
  await import('./ironward-crossing');
}else if(area===IRONWARD_BASIN){
  await import('./ironward-basin');
}else if(area===DEEP_IRON_MINE){
  await import('./deep-iron-mine');
}else{
  await import('./main');
  await import('./runtime-extensions');
}