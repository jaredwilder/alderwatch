import {LocalAuthority,makePlayer,addItem,type StructureState} from './state';
import type {BuildKind} from './definitions';
import {height} from './terrain';

export function natureFixture(){const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[0,height(0,18)+.02,18];return a.state;}
export function frontierFixture(){const state=natureFixture(),p=Object.values(state.players)[0];p.position=[0,height(0,110)+.02,110];p.frontierTarget='frontier-0';return state;}

export function expeditionFixture(){
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;
 p.position=[7,height(7,-28)+.02,-28];p.health=110;p.equipped='fine_sword';
 addItem(a.state,p,'fine_sword',1);addItem(a.state,p,'wood',12);addItem(a.state,p,'grilled_venison',3);addItem(a.state,p,'hearty_stew',3);
 return a.state;
}

/** Disposable, explicitly labelled development realm. Never written to the player's save. */
export function houseFixture(){
 const a=new LocalAuthority(),p=makePlayer('Warden'),base=height(18,9);a.state.players[p.id]=p;
 p.position=[21,height(21,9),9];p.health=110;p.equipped='hammer';
 addItem(a.state,p,'wood',120);addItem(a.state,p,'stone',40);addItem(a.state,p,'fiber',20);
 function place(kind:BuildKind,x:number,y:number,z:number,yaw=0,supportId?:string):StructureState{
  const result=a.dispatch({type:'place',playerId:p.id,kind,position:[x,y,z],yaw,supportId});
  if(!result.ok)throw new Error('House fixture '+kind+': '+result.message);
  return Object.values(a.state.structures).at(-1)!;
 }
 const front=place('foundation',18,base,9),back=place('foundation',18,base,6);
 for(const floor of [front,back]){
  place('wall',16.5,base+.44,floor.position[2],-Math.PI/2,floor.id);
  place('window',19.5,base+.44,floor.position[2],Math.PI/2,floor.id);
 }
 place('doorway',18,base+.44,10.5,0,front.id);
 place('window',18,base+.44,4.5,Math.PI,back.id);
 for(const floor of [front,back])place('roof',18,base+3.14,floor.position[2],0,floor.id);
 place('workbench',18,base+.47,5.2,0,back.id);
 place('chest',17.2,base+.47,7,0,back.id);
 p.position=[18,height(18,13.4)+.02,13.4];p.yaw=Math.PI;
 return a.state;
}
