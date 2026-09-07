import * as T from 'three';
import {model} from '../tests/load-assets';
const g=await model('survivor');
for(const clip of g.animations){
 const mixer=new T.AnimationMixer(g.scene),action=mixer.clipAction(clip).play();action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;
 const prev=new Map<string,T.Vector3>();let fastest={speed:0,bone:'',time:0};
 for(let i=0;i<=Math.ceil(clip.duration*120);i++){
  mixer.setTime(Math.min(i/120,clip.duration));g.scene.updateMatrixWorld(true);
  for(const name of ['hand_l','lowerarm_l','hand_r','lowerarm_r']){const p=g.scene.getObjectByName(name)!.getWorldPosition(new T.Vector3());const last=prev.get(name);if(last){const speed=p.distanceTo(last)*120;if(speed>fastest.speed)fastest={speed,bone:name,time:i/120};}prev.set(name,p);}
 }
 console.log(clip.name,fastest);mixer.stopAllAction();mixer.uncacheRoot(g.scene);
}
