import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {LocalAuthority} from '../src/state';
import {ambientWanderHeading,bearTarget,cohesiveFleeHeading,headingVector,herdCenter,seedNature,type AnimalState} from '../src/nature';
import {inferAnimalForward} from '../src/animal-models';

const animal=(id:string,kind:AnimalState['kind'],x:number,z:number):AnimalState=>({id,kind,position:[x,0,z],home:[x,0,z],yaw:0,phase:0});

test('frontier wildlife roster puts livestock nearby and deer in encounterable Southwood herds',()=>{
 const authority=new LocalAuthority();seedNature(authority.state);
 const animals=Object.values(authority.state.animals!);
 const goats=animals.filter(a=>a.kind==='goat'),sheep=animals.filter(a=>a.kind==='sheep'),deer=animals.filter(a=>a.kind==='deer'),bears=animals.filter(a=>a.kind==='bear');
 assert.ok(animals.length>=28);
 assert.ok(goats.length>=5&&goats.every(a=>a.home[2]<=45));
 assert.ok(sheep.length>=5&&sheep.every(a=>a.home[2]<=45));
 assert.ok(deer.length>=8);
 assert.ok(deer.filter(a=>a.home[2]>=80&&a.home[2]<=165).length>=8);
 assert.equal(bears.length,3,'bears should stay uncommon');
});

test('seeding is additive and never resets an existing animal transform or health',()=>{
 const authority=new LocalAuthority();authority.state.animals={'southwood-deer-0':{...animal('southwood-deer-0','deer',99,99),yaw:1.25,phase:42,health:17,maxHealth:62}};
 seedNature(authority.state);const deer=authority.state.animals!['southwood-deer-0'];
 assert.deepEqual(deer.position,[99,0,99]);assert.equal(deer.yaw,1.25);assert.equal(deer.phase,42);assert.equal(deer.health,17);
 assert.ok(Object.keys(authority.state.animals!).length>1);
});

test('bear selects nearest live prey inside acquisition radius only',()=>{
 const bear=animal('bear','bear',0,0),deer=animal('deer','deer',8,0),sheep=animal('sheep','sheep',4,0),farGoat=animal('goat','goat',40,0),otherBear=animal('other-bear','bear',2,0);
 assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear})?.id,'sheep');
 sheep.dead=true;assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear})?.id,'deer');
 deer.position=[31,0,0];assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear}),undefined);
});

test('herd flee heading remains away from threat while bending toward separated herd mates',()=>{
 const focal=animal('sheep-0','sheep',0,0),mate=animal('sheep-1','sheep',5,2),outsider=animal('sheep-far','sheep',50,50),all={focal,mate,outsider};
 const center=herdCenter(focal,all)!;assert.ok(center[0]>0&&center[0]<4);
 const yaw=cohesiveFleeHeading(focal,[0,0,-5],center),[x,z]=headingVector(yaw);
 assert.ok(z>0,'flee vector must point away from a threat behind the animal');
 assert.ok(x>0,'cohesion should bend flight toward nearby herd mates');
});

test('ambient wander is world-space steering, not recursive yaw that makes herds orbit',()=>{
 const sheep=animal('pasture-sheep-0','sheep',0,0);sheep.phase=12.5;sheep.yaw=-2.4;const first=ambientWanderHeading(sheep);sheep.yaw=2.7;const second=ambientWanderHeading(sheep);assert.equal(first,second,'wander heading must not depend on current yaw');
 sheep.phase+=.05;const next=ambientWanderHeading(sheep),delta=Math.abs(T.MathUtils.euclideanModulo(next-first+Math.PI,Math.PI*2)-Math.PI);assert.ok(delta<.08,'ambient heading should bend gradually instead of spinning the animal');
});

test('movement heading uses Alderwatch +Z and matches world displacement',()=>{
 assert.deepEqual(headingVector(0),[0,1]);
 const [x,z]=headingVector(Math.PI/2);assert.ok(Math.abs(x-1)<1e-12&&Math.abs(z)<1e-12);
 const [rx,rz]=headingVector(Math.PI);assert.ok(Math.abs(rx)<1e-12&&Math.abs(rz+1)<1e-12);
});

test('authored animal forward is inferred from rig anatomy instead of species yaw guesses',()=>{
 const rig=(head:[number,number,number],hips:[number,number,number])=>{const root=new T.Group(),h=new T.Bone(),b=new T.Bone();h.name='Head';b.name='Hips';h.position.set(...head);b.position.set(...hips);root.add(h,b);return root;};
 const plusZ=inferAnimalForward(rig([0,0,2],[0,0,0]));assert.equal(plusZ.axis,'+z');assert.equal(plusZ.proven,true);assert.ok(Math.abs(plusZ.correctionYaw)<1e-12);
 const minusZ=inferAnimalForward(rig([0,0,-2],[0,0,0]));assert.equal(minusZ.axis,'-z');assert.equal(minusZ.proven,true);assert.ok(Math.abs(Math.abs(minusZ.correctionYaw)-Math.PI)<1e-12);
 const plusX=inferAnimalForward(rig([2,0,0],[0,0,0]));assert.equal(plusX.axis,'+x');assert.equal(plusX.proven,true);assert.ok(Math.abs(plusX.correctionYaw+Math.PI/2)<1e-12);
 const unknown=inferAnimalForward(new T.Group());assert.equal(unknown.proven,false);assert.equal(unknown.axis,'unknown');assert.equal(unknown.correctionYaw,0);
});