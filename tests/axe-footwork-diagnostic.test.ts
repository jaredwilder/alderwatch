import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {WEAPONS} from '../src/combat-rules';
import {makePlayer} from '../src/state';
import {model} from './load-assets';

function plants(scene:T.Group,clip:T.AnimationClip){
 const left=scene.getObjectByName('foot_l'),right=scene.getObjectByName('foot_r');assert.ok(left&&right);
 const mixer=new T.AnimationMixer(scene),action=mixer.clipAction(clip).play();action.setLoop(T.LoopRepeat,Infinity);const L:{t:number,p:T.Vector3}[]=[],R:{t:number,p:T.Vector3}[]=[];
 for(let i=0;i<=120;i++){const t=clip.duration*i/120;mixer.setTime(t);scene.updateMatrixWorld(true);L.push({t,p:left.getWorldPosition(new T.Vector3())});R.push({t,p:right.getWorldPosition(new T.Vector3())});}
 const plant=(points:{t:number,p:T.Vector3}[])=>{const minY=Math.min(...points.map(x=>x.p.y));let best={phase:0,score:Infinity,y:0,speed:0};for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],dt=Math.max(1e-6,c.t-a.t),speed=Math.hypot(c.p.x-a.p.x,c.p.z-a.p.z)/dt,height=b.p.y-minY,score=speed+height*10;if(score<best.score)best={phase:b.t/clip.duration,score,y:b.p.y,speed};}return best;};
 const result={left:plant(L),right:plant(R)};mixer.stopAllAction();mixer.uncacheRoot(scene);return result;
}
const phaseDistance=(a:number,b:number)=>Math.abs(T.MathUtils.euclideanModulo(a-b+.5,1)-.5);

async function fixture(){
 await RAPIER.init();const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.createCollider(RAPIER.ColliderDesc.cuboid(20,.1,20).setTranslation(0,-.1,0));
 const root=new T.Group(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped='axe';let tick=0;const actor=new Character(assets,physics,p,root);actor.getTick=()=>tick;actor.equip('axe');
 const input={keys:new Set<string>(),secondary:false,take:()=>false};const step=()=>{actor.preStep(1/60,input,Math.PI,true);physics.step();actor.postStep(1/60);root.updateMatrixWorld(true);tick++;};return{physics,root,p,actor,input,step};
}

test('shipping walk and run expose the same alternating plant phases used by axe bracing',async()=>{
 const g=await model('survivor'),walk=g.animations.find(c=>c.name==='walk'),run=g.animations.find(c=>c.name==='run');assert.ok(walk&&run);
 for(const [name,clip] of [['walk',walk],['run',run]] as const){const p=plants(g.scene,clip);assert.ok(phaseDistance(p.left.phase,119/120)<.025,`${name} left plant drifted: ${p.left.phase}`);assert.ok(phaseDistance(p.right.phase,59/120)<.025,`${name} right plant drifted: ${p.right.phase}`);assert.ok(Math.abs(phaseDistance(p.left.phase,p.right.phase)-.5)<.03,`${name} foot plants stopped alternating by a half cycle`);}
});

test('moving axe strike braces the measured lead-foot phase at contact without rooting travel',async()=>{
 const f=await fixture();f.input.keys.add('KeyW');f.input.keys.add('ShiftLeft');for(let i=0;i<20;i++)f.step();const before=f.p.position[2];assert.equal(f.actor.startAttack(),true);let best=1,hipMax=0;const pelvis=f.actor.model.getObjectByName('pelvis');assert.ok(pelvis instanceof T.Bone);const rest=pelvis.quaternion.clone();
 for(let i=0;i<Math.ceil(WEAPONS.axe!.duration*60)+4;i++){f.step();const stride=(f.actor as any).activeStrideAction as T.AnimationAction|undefined;if(stride&&Math.abs(f.actor.attackTime-WEAPONS.axe!.impact)<.035)best=Math.min(best,phaseDistance(((stride.time/stride.getClip().duration)%1+1)%1,119/120));hipMax=Math.max(hipMax,rest.angleTo(pelvis.quaternion));}
 assert.ok(best<.055,`lead foot missed its measured plant phase around contact: ${best}`);assert.ok(f.p.position[2]-before>.65,`axe brace rooted controller travel: ${f.p.position[2]-before}`);assert.ok(hipMax>.55,`axe still lacks violent pelvis rotation: ${hipMax}`);f.physics.free();
});
