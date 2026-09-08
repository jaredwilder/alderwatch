import {consumePendingArea,currentPlayer,enterSavedArea,IRONWARD_CROSSING,migrateRealmSave,playerArea} from './realm-save';

const SAVE_KEY='alderwatch.realm.v1';

function prepareSavedArea(){
  let world:any;
  try{world=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{world=null;}
  if(!world?.players)return 'far-march';
  migrateRealmSave(world);
  const pending=consumePendingArea();
  if(pending){
    enterSavedArea(world,pending);
    localStorage.setItem(SAVE_KEY,JSON.stringify(world));
  }
  return currentPlayer(world)?playerArea(currentPlayer(world)!):'far-march';
}

const area=prepareSavedArea();
if(area===IRONWARD_CROSSING){
  await import('./ironward-crossing');
}else{
  await import('./main');
  await import('./runtime-extensions');
}
