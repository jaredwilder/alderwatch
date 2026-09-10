import './canon-authority-bridge';
import './radiance-closure-runtime';
import './material-singularity-runtime';
import {consumePendingArea,currentPlayer,DEEP_IRON_MINE,enterSavedArea,IRONWARD_BASIN,IRONWARD_CROSSING,migrateRealmSave,playerArea,CROWNROAD_VALE,WOLFPINE} from './realm-save';
import {advanceRealmPopulationToTick,ensureRealmPopulation} from './realm-population';
import {advanceRealmSocietyToTick,ensureRealmSocial} from './realm-society';
import {advanceRealmHistoryToTick,ensureRealmHistory} from './provenance-frontier';
import {applyRealmConsequences,ensureRealmConsequences} from './realm-consequences';
import {normalizeLegacyWorldShape} from './save-compat';
import {activateAreaObjects,ensureAreaObjectStore} from './area-object-store';

const SAVE_KEY='alderwatch.realm.v1';

function prepareSavedArea(){
  let world:any;
  try{world=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{world=null;}
  if(!world?.players||!world?.resources)return 'far-march';
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
  const player=currentPlayer(world),outgoing=player?playerArea(player):'far-march';
  ensureAreaObjectStore(world,outgoing);
  const pending=consumePendingArea();
  if(pending){enterSavedArea(world,pending);activateAreaObjects(world,pending,outgoing);}
  else activateAreaObjects(world,outgoing,outgoing);
  localStorage.setItem(SAVE_KEY,JSON.stringify(world));
  return currentPlayer(world)?playerArea(currentPlayer(world)!):'far-march';
}

async function installFarMarchPlayerUI(){
  const essential=[
    ['UI stack',()=>import('./ui-stack')],
    ['Backpack',()=>import('./backpack-ui')],
    ['Item icons',()=>import('./item-icons-module')],
    ['Recipe Book',()=>import('./recipe-book-ui')],
    ['Ironward road gate',()=>import('./realm-travel-ui')],
  ] as const;
  for(const [name,load] of essential){
    try{await load();}
    catch(error){console.error(`Alderwatch ${name} failed to install`,error);}
  }
}

async function installStreamedAreaSurface(){
  const surface=[
    ['Realm routes',()=>import('./realm-route-surfacing')],
    ['Realm chat',()=>import('./area-realm-chat')],
  ] as const;
  for(const [name,load] of surface){
    try{await load();}
    catch(error){console.error(`Alderwatch streamed-area ${name} failed to install`,error);}
  }
}

async function installStreamedFrontierGraphics(){
  try{
    const [{Character},{installStreamedFrontierGraphics}]=await Promise.all([import('./character'),import('./streamed-frontier-graphics-runtime')]);
    installStreamedFrontierGraphics(Character);
  }catch(error){console.error('Alderwatch streamed frontier graphics failed to install',error);}
}

const area=prepareSavedArea();
try{await import('./dev-tools');}catch(error){console.error('Alderwatch dev tools failed to install',error);}

if(area===IRONWARD_CROSSING){
  await import('./ironward-crossing');
  await installStreamedAreaSurface();
}else if(area===IRONWARD_BASIN){
  await installStreamedFrontierGraphics();
  await import('./ironward-basin');
  await import('./ironward-society-overlay');
  await installStreamedAreaSurface();
}else if(area===DEEP_IRON_MINE){
  await import('./deep-iron-mine');
  await installStreamedAreaSurface();
}else if(area===CROWNROAD_VALE){
  await installStreamedFrontierGraphics();
  await import('./crownroad-vale');
  await installStreamedAreaSurface();
}else if(area===WOLFPINE){
  await installStreamedFrontierGraphics();
  await import('./wolfpine');
  await installStreamedAreaSurface();
}else{
  await import('./natural-detail-runtime');
  try{await import('./visual-detail-overdrive');}
  catch(error){console.error('Alderwatch visual detail overdrive failed to install',error);}
  try{await import('./tree-bark-hd');}
  catch(error){console.error('Alderwatch HD tree bark failed to install',error);}
  try{await import('./forest-singularity-runtime');}
  catch(error){console.error('Alderwatch forest singularity failed to install',error);}
  try{await import('./ecology-singularity-runtime');}
  catch(error){console.error('Alderwatch ecology singularity failed to install',error);}
  try{await import('./horizon-singularity-runtime');}
  catch(error){console.error('Alderwatch horizon singularity failed to install',error);}
  await import('./main');
  await installFarMarchPlayerUI();
  try{await import('./runtime-extensions');}
  catch(error){console.error('Alderwatch optional runtime extensions failed to install',error);}
}
