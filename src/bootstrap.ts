import {consumePendingArea,currentPlayer,DEEP_IRON_MINE,enterSavedArea,IRONWARD_BASIN,IRONWARD_CROSSING,migrateRealmSave,playerArea,CROWNROAD_VALE} from './realm-save';
import {advanceRealmPopulationToTick,ensureRealmPopulation} from './realm-population';
import {advanceRealmSocietyToTick,ensureRealmSocial} from './realm-society';
import {advanceRealmHistoryToTick,ensureRealmHistory} from './provenance-frontier';

const SAVE_KEY='alderwatch.realm.v1';

function prepareSavedArea(){
  let world:any;
  try{world=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{world=null;}
  if(!world?.players)return 'far-march';
  migrateRealmSave(world);
  ensureRealmPopulation(world);
  advanceRealmPopulationToTick(world);
  ensureRealmSocial(world);
  advanceRealmSocietyToTick(world);
  ensureRealmHistory(world);
  advanceRealmHistoryToTick(world);
  const pending=consumePendingArea();
  if(pending)enterSavedArea(world,pending);
  // Population, society and causal history catch-up are authoritative before an area materializes.
  localStorage.setItem(SAVE_KEY,JSON.stringify(world));
  return currentPlayer(world)?playerArea(currentPlayer(world)!):'far-march';
}

const area=prepareSavedArea();
if(area===IRONWARD_CROSSING){
  await import('./ironward-crossing');
}else if(area===IRONWARD_BASIN){
  await import('./ironward-basin');
  await import('./ironward-society-overlay');
}else if(area===DEEP_IRON_MINE){
  await import('./deep-iron-mine');
}else if(area===CROWNROAD_VALE){
  await import('./crownroad-vale');
}else{
  await import('./main');
  await import('./runtime-extensions');
}
