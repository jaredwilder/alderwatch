import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {LocalAuthority,makePlayer} from '../src/state';
import {ambientWanderHeading,bearTarget,cohesiveFleeHeading,headingVector,herdCenter,seedNature,type AnimalState} from '../src/nature';
import {inferAnimalForward} from '../src/animal-models';
import {aggroWolfPack,predatorTarget,predatorThreat,wolfFlankPoint,wolfInterferer} from '../src/wildlife-ai';
import {MAX_WOLF_PACK_SIZE,WILDLIFE_SPAWNS} from '../src/wildlife-spawns';
import {WILDLIFE_SPECIES} from '../src/wildlife-species';

const animal=(id:string,kind:AnimalState['kind'],x:number,z:number,packId?:string):AnimalState=>({id,kind,position:[x,0,z],home:[x,0,z],yaw:0,phase:0,packId});

test('frontier wildlife roster is organized and wolf packs never exceed three',()=>{
 const authority=new LocalAuthority();seedNature(authority.state);
 const animals=Object.values(authority.state.animals!);
 const goats=animals.filter(a=>a.kind==='goat'),sheep=animals.filter(a=>a.kind==='sheep'),deer=animals.filter(a=>a.kind==='deer'),bears=animals.filter(a=>a.kind==='bear'),bison=animals.filter(a=>a.kind==='bison'),wolves=animals.filter(a=>a.kind==='wolf');
 assert.ok(goats.length>=5&&goats.every(a=>a.home[2]<=45));assert.ok(sheep.length>=5&&sheep.every(a=>a.home[2]<=45));
 assert.ok(deer.length>=8&&deer.filter(a=>a.home[2]>=80&&a.home[2]<=165).length>=8);assert.equal(bears.length,3,'bears should stay uncommon');assert.equal(bison.length,5);assert.equal(wolves.length,6);
 const packs=new Map<string,number>();for(const wolf of WILDLIFE_SPAWNS.filter(spawn=>spawn.kind==='wolf')){assert.ok(wolf.packId);packs.set(wolf.packId!,1+(packs.get(wolf.packId!)??0));}
 assert.ok([...packs.values()].every(size=>size>0&&size<=MAX_WOLF_PACK_SIZE));assert.equal(Math.max(...packs.values()),3);
});

test('every species owns complete gameplay tuning in one registry',()=>{
 for(const [kind,config] of Object.entries(WILDLIFE_SPECIES)){assert.ok(config.maxHealth>0,kind);assert.ok(config.turnRate>0,kind);if(config.authored)assert.ok((config.modelHeight??0)>0,kind);}
 assert.deepEqual(WILDLIFE_SPECIES.wolf.predator?.prey,['bison']);assert.equal(WILDLIFE_SPECIES.wolf.herd,true);
});

test('seeding is additive and never resets an existing animal transform or health',()=>{
 const authority=new LocalAuthority();authority.state.animals={'southwood-deer-0':{...animal('southwood-deer-0','deer',99,99),yaw:1.25,phase:42,health:17,maxHealth:62}};
 seedNature(authority.state);const deer=authority.state.animals!['southwood-deer-0'];
 assert.deepEqual(deer.position,[99,0,99]);assert.equal(deer.yaw,1.25);assert.equal(deer.phase,42);assert.equal(deer.health,17);assert.ok(Object.keys(authority.state.animals!).length>1);
});

test('bear selects nearest live prey inside acquisition radius only',()=>{
 const bear=animal('bear','bear',0,0),deer=animal('deer','deer',8,0),sheep=animal('sheep','sheep',4,0),farGoat=animal('goat','goat',40,0),otherBear=animal('other-bear','bear',2,0);
 assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear})?.id,'sheep');sheep.dead=true;assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear})?.id,'deer');deer.position=[31,0,0];assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear}),undefined);
});

test('wolves hunt bison only and bison recognizes wolves as predators',()=>{
 const wolf=animal('wolf','wolf',0,0,'pack'),nearBison=animal('bison-near','bison',8,0),farBison=animal('bison-far','bison',18,0),deer=animal('deer','deer',3,0),all={wolf,nearBison,farBison,deer};
 assert.equal(predatorTarget(wolf,all)?.id,'bison-near');assert.equal(predatorThreat(nearBison,all)?.id,'wolf');deer.position=[1,0,0];assert.equal(predatorTarget(wolf,all)?.kind,'bison');
});

test('three wolves approach one bison on distinct deterministic flank points',()=>{
 const quarry=animal('bison','bison',0,0),a=animal('wolf-a','wolf',12,0,'pack'),b=animal('wolf-b','wolf',12,1,'pack'),c=animal('wolf-c','wolf',12,-1,'pack'),all={quarry,a,b,c};
 const points=[wolfFlankPoint(a,quarry,all),wolfFlankPoint(b,quarry,all),wolfFlankPoint(c,quarry,all)];
 assert.deepEqual(points[0],quarry.position,'pack leader closes directly');assert.notDeepEqual(points[1],points[0]);assert.notDeepEqual(points[2],points[0]);assert.notDeepEqual(points[1],points[2]);
});

test('interfering with a bison hunt turns the entire wolf pack onto that player',()=>{
 const authority=new LocalAuthority(),p=makePlayer('Warden');authority.state.players[p.id]=p;authority.state.tick=100;
 const quarry=animal('bison','bison',0,0),a=animal('wolf-a','wolf',5,0,'pack'),b=animal('wolf-b','wolf',6,1,'pack'),c=animal('wolf-c','wolf',6,-1,'pack'),all={quarry,a,b,c};quarry.lastAttackerId=p.id;quarry.alarmedUntil=500;
 const interferer=wolfInterferer(a,quarry,all,authority.state.players,authority.state.tick);assert.equal(interferer?.id,p.id);aggroWolfPack(a,all,p.id,authority.state.tick);
 for(const wolf of [a,b,c]){assert.equal(wolf.aggroPlayerId,p.id);assert.ok((wolf.aggroUntil??0)>authority.state.tick);assert.equal(wolf.huntTargetId,undefined);}
});

test('herd flee heading remains away from threat while bending toward separated herd mates',()=>{
 const focal=animal('sheep-0','sheep',0,0),mate=animal('sheep-1','sheep',5,2),outsider=animal('sheep-far','sheep',50,50),all={focal,mate,outsider};
 const center=herdCenter(focal,all)!;assert.ok(center[0]>0&&center[0]<4);const yaw=cohesiveFleeHeading(focal,[0,0,-5],center),[x,z]=headingVector(yaw);assert.ok(z>0);assert.ok(x>0);
});

test('ambient wander is world-space steering, not recursive yaw that makes herds orbit',()=>{
 const sheep=animal('pasture-sheep-0','sheep',0,0);sheep.phase=12.5;sheep.yaw=-2.4;const first=ambientWanderHeading(sheep);sheep.yaw=2.7;const second=ambientWanderHeading(sheep);assert.equal(first,second);
 sheep.phase+=.05;const next=ambientWanderHeading(sheep),delta=Math.abs(T.MathUtils.euclideanModulo(next-first+Math.PI,Math.PI*2)-Math.PI);assert.ok(delta<.08);
});

test('movement heading uses Alderwatch +Z and matches world displacement',()=>{assert.deepEqual(headingVector(0),[0,1]);const [x,z]=headingVector(Math.PI/2);assert.ok(Math.abs(x-1)<1e-12&&Math.abs(z)<1e-12);const [rx,rz]=headingVector(Math.PI);assert.ok(Math.abs(rx)<1e-12&&Math.abs(rz+1)<1e-12);});

test('authored animal forward is inferred from rig anatomy instead of species yaw guesses',()=>{
 const rig=(head:[number,number,number],hips:[number,number,number])=>{const root=new T.Group(),h=new T.Bone(),b=new T.Bone();h.name='Head';b.name='Hips';h.position.set(...head);b.position.set(...hips);root.add(h,b);return root;};
 const plusZ=inferAnimalForward(rig([0,0,2],[0,0,0]));assert.equal(plusZ.axis,'+z');assert.equal(plusZ.proven,true);assert.ok(Math.abs(plusZ.correctionYaw)<1e-12);const minusZ=inferAnimalForward(rig([0,0,-2],[0,0,0]));assert.equal(minusZ.axis,'-z');assert.equal(minusZ.proven,true);assert.ok(Math.abs(Math.abs(minusZ.correctionYaw)-Math.PI)<1e-12);const plusX=inferAnimalForward(rig([2,0,0],[0,0,0]));assert.equal(plusX.axis,'+x');assert.equal(plusX.proven,true);assert.ok(Math.abs(plusX.correctionYaw+Math.PI/2)<1e-12);const unknown=inferAnimalForward(new T.Group());assert.equal(unknown.proven,false);assert.equal(unknown.axis,'unknown');assert.equal(unknown.correctionYaw,0);
});
