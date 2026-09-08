import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {model} from './load-assets';

test('diagnose real shipping run foot plant phases',async()=>{
 const g=await model('survivor'),clip=g.animations.find(c=>c.name==='run');assert.ok(clip,'missing run clip');
 const bones:string[]=[];g.scene.traverse(o=>{if(o instanceof T.Bone)bones.push(o.name);});
 const left=g.scene.getObjectByName('foot_l'),right=g.scene.getObjectByName('foot_r');
 assert.ok(left&&right,`shipping rig foot names changed; bones=${JSON.stringify(bones)}`);
 const mixer=new T.AnimationMixer(g.scene),action=mixer.clipAction(clip).play();action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;
 const sample=(bone:T.Object3D)=>{const points:{t:number,p:T.Vector3}[]=[];for(let i=0;i<=120;i++){const t=clip.duration*i/120;mixer.setTime(t);g.scene.updateMatrixWorld(true);points.push({t,p:bone.getWorldPosition(new T.Vector3())});}let minY=Math.min(...points.map(x=>x.p.y)),best={phase:0,score:Infinity,y:0,speed:0};for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],speed=c.p.distanceTo(a.p)/Math.max(1e-6,c.t-a.t),height=b.p.y-minY,score=speed+height*8;if(score<best.score)best={phase:b.t/clip.duration,score,y:b.p.y,speed};}return best;};
 const l=sample(left),r=sample(right);mixer.stopAllAction();mixer.uncacheRoot(g.scene);
 assert.fail(`RUN_FOOT_PLANTS ${JSON.stringify({duration:clip.duration,left:l,right:r})}`);
});
