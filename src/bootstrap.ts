import './canon-authority-bridge';
import {consumePendingArea,currentPlayer,DEEP_IRON_MINE,enterSavedArea,IRONWARD_BASIN,IRONWARD_CROSSING,migrateRealmSave,playerArea,CROWNROAD_VALE} from './realm-save';
import {advanceRealmPopulationToTick,ensureRealmPopulation} from './realm-population';
import {advanceRealmSocietyToTick,ensureRealmSocial} from './realm-society';
import {advanceRealmHistoryToTick,ensureRealmHistory} from './provenance-frontier';
import {applyRealmConsequences,ensureRealmConsequences} from './realm-consequences';
import {normalizeLegacyWorldShape} from './save-compat';

const SAVE_KEY='alderwatch.realm.v1';

function prepareSavedArea(){
  let world:any;
  try{world=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{world=null;}
  if(!world?.players||!world?.resources)return 'far-march';
  // Continue must be able to load every additive v1 save shape we have shipped.
  // Normalize collection fields before newer realm systems or gathering migrations inspect them.
  normalizeLegacyWorldShape(world);
  migrateRealmSave(world);
  ensureRealmPopulation(world);
  advanceRealmPopulationToTick(world);
  ensureRealmSocial(world);
  advanceRealmSocietyToTick(world);
  ensureRealmHistory(world);
  advanceRealmHistoryToTick(world);
  ensureRealmConsequences(world);
  applyRealmConsequences(world);
  const pending=consumePendingArea();
  if(pending)enterSavedArea(world,pending);
  // Population, society, causal history and its compiled consequences are authoritative before an area materializes.
  localStorage.setItem(SAVE_KEY,JSON.stringify(world));
  return currentPlayer(world)?playerArea(currentPlayer(world)!):'far-march';
}

async function installFarMarchPlayerUI(){
  // These are player-critical surfaces. They must not disappear because an unrelated
  // chat/social/realm presentation module later in runtime-extensions throws during startup.
  const essential=[
    ['UI stack',()=>import('./ui-stack')],
    ['Backpack',()=>import('./backpack-ui')],
    ['Item icons',()=>import('./item-icons')],
    ['Recipe Book',()=>import('./recipe-book-ui')],
  ] as const;
  for(const [name,load] of essential){
    try{await load();}
    catch(error){console.error(`Alderwatch ${name} failed to install`,error);}
  }
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
  await installFarMarchPlayerUI();
  try{await import('./runtime-extensions');}
  catch(error){console.error('Alderwatch optional runtime extensions failed to install',error);}
}
