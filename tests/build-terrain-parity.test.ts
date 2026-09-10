import test from 'node:test';
import assert from 'node:assert/strict';
import {activateAreaObjects,ensureAreaObjectStore} from '../src/area-object-store';
import {FAR_MARCH_BUILD_TERRAIN,WOLFPINE_BUILD_TERRAIN} from '../src/build-terrain';
import {placementError} from '../src/economy';
import {addItem,LocalAuthority,makePlayer} from '../src/state';
import {WOLFPINE_AREA} from '../src/wolfpine-world';

test('Far March building validation keeps the pre-extraction boundary contract',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[69,FAR_MARCH_BUILD_TERRAIN.height(69,0),0];addItem(a.state,p,'wood',99);addItem(a.state,p,'stone',99);
 const outside={type:'place' as const,playerId:p.id,kind:'foundation' as const,position:[72,FAR_MARCH_BUILD_TERRAIN.height(72,0),0] as [number,number,number],yaw:0};
 assert.equal(placementError(a,p,outside),'Build within the settled March');
});

test('Wolfpine uses the same placement authority with an area terrain profile',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;addItem(a.state,p,'wood',99);addItem(a.state,p,'stone',99);ensureAreaObjectStore(a.state,'far-march');activateAreaObjects(a.state,WOLFPINE_AREA,'far-march');p.position=[12,0,12];
 const place={type:'place' as const,playerId:p.id,kind:'foundation' as const,position:[15,WOLFPINE_BUILD_TERRAIN.height(15,12),12] as [number,number,number],yaw:0};
 assert.equal(placementError(a,p,place),null);
 const out=a.dispatch(place);assert.equal(out.ok,true,out.message);const built=Object.values(a.state.structures)[0];assert.ok(built);assert.equal(built.areaId,WOLFPINE_AREA);assert.equal(p.home,undefined,'a Wolfpine shelter must not overwrite the legacy Far March respawn/home coordinate');
 activateAreaObjects(a.state,'far-march',WOLFPINE_AREA);assert.equal(Object.keys(a.state.structures).length,0,'Wolfpine build leaked into the Far March active slice');
 activateAreaObjects(a.state,WOLFPINE_AREA,'far-march');assert.deepEqual(a.state.structures[built.id].position,[15,0,12],'Wolfpine build did not survive area projection');
});

test('areas without a declared terrain adapter fail closed instead of borrowing March coordinates',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;addItem(a.state,p,'wood',99);addItem(a.state,p,'stone',99);ensureAreaObjectStore(a.state,'far-march');activateAreaObjects(a.state,'crownroad-vale','far-march');p.position=[0,0,0];
 assert.equal(placementError(a,p,{type:'place',playerId:p.id,kind:'foundation',position:[3,0,0],yaw:0}),'Building is not enabled in crownroad-vale');
});
