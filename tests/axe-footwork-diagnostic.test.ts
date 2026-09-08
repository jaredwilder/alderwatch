import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {model} from './load-assets';

function plants(scene:T.Group,clip:T.AnimationClip){
 const left=scene.getObjectByName('foot_l'),right=scene.getObjectByName('foot_r');assert.ok(left&&right);
 const mixer=new T.AnimationMixer(scene),action=mixer.clipAction(clip).play();action.setLoop(T.LoopRepeat,Infinity);const L:{t:number,p:T.Vector3}[]=[],R:{t:number,p:T.Vector3}[]=[];
 for(let i=0;i<=120;i++){const t=clip.duration*i/120;mixer.setTime(t);scene.updateMatrixWorld(true);L.push({t,p:left.getWorldPosition(new T.Vector3())});R.push({t,p:right.getWorldPosition(new T.Vector3())});}
 const plant=(points:{t:number,p:T.Vector3}[])=>{const minY=Math.min(...points.map(x=>x.p.y));let best={phase:0,score:Infinity,y:0,speed:0};for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],dt=Math.max(1e-6,c.t-a.t),speed=Math.hypot(c.p.x-a.p.x,c.p.z-a.p.z)/dt,height=b.p.y-minY,score=speed+height*10;if(score<best.score)best={phase:b.t/clip.duration,score,y:b.p.y,speed};}return best;};
 const result={duration:clip.duration,left:plant(L),right:plant(R)};mixer.stopAllAction();mixer.uncacheRoot(scene);return result;
}

test('diagnose real shipping walk and run foot plant phases',async()=>{
 const g=await model('survivor'),walk=g.animations.find(c=>c.name==='walk'),run=g.animations.find(c=>c.name==='run');assert.ok(walk&&run);
 assert.fail(`FOOT_PLANTS ${JSON.stringify({walk:plants(g.scene,walk),run:plants(g.scene,run)})}`);
});
