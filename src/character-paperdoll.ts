import * as T from 'three';
import type {Assets} from './assets';
import type {PlayerState} from './state';
import {makeBow} from './archery';

/** A compact, isolated renderer for the P-profile paper doll. It never moves the live game camera. */
export function renderCharacterPaperdoll(assets:Assets,player:PlayerState){
 const canvas=document.createElement('canvas');canvas.className='profile-paperdoll';canvas.width=220;canvas.height=300;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(220,300,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 const scene=new T.Scene();scene.background=new T.Color('#101713');
 const model=assets.human();scene.add(model);
 model.traverse(o=>{if(o.name.includes('Hood'))o.visible=player.hood;if(o.name.includes('Hair_Simple'))o.visible=!player.hood;if(o instanceof T.Mesh){const mats=(Array.isArray(o.material)?o.material:[o.material]).map(old=>{const m=(old as T.MeshStandardMaterial).clone();if(m.name.includes('Hair'))m.color.set(player.hair);if(m.name.includes('Superhero')||m.name.includes('Regular_Male'))m.color.set(player.skin);return m;});o.material=Array.isArray(o.material)?mats:mats[0];o.castShadow=true;o.receiveShadow=true;}});
 const mixer=new T.AnimationMixer(model),idle=assets.survivor.animations.find(c=>c.name==='idle');if(idle){mixer.clipAction(idle).play();mixer.update(.18);}
 const grip=model.getObjectByName('Grip_R');if(grip&&player.equipped&&['axe','pickaxe','sword','fine_sword','hammer','bow'].includes(player.equipped)){
  const tool=player.equipped==='bow'?makeBow():assets.prop(player.equipped==='fine_sword'?'sword':player.equipped);grip.add(tool);tool.position.set(0,0,0);model.updateMatrixWorld(true);
  const shaft=new T.Vector3(0,-.98,.20).normalize(),edge=new T.Vector3(-1,0,0),normal=new T.Vector3().crossVectors(edge,shaft).normalize();edge.crossVectors(shaft,normal).normalize();const worldQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(edge,shaft,normal));tool.quaternion.copy(grip.getWorldQuaternion(new T.Quaternion()).invert().multiply(worldQ));if(player.equipped==='bow'){tool.scale.setScalar(1.08);tool.rotateY(Math.PI/2);tool.rotateZ(Math.PI/2);}
 }
 model.rotation.y=Math.PI;model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=new T.Vector3(),center=new T.Vector3();box.getSize(size);box.getCenter(center);model.position.set(-center.x,-box.min.y,-center.z);model.updateMatrixWorld(true);
 const h=Math.max(1.75,size.y),camera=new T.PerspectiveCamera(27,220/300,.05,30);camera.position.set(0,h*.56,Math.max(4.2,h*2.1));camera.lookAt(0,h*.5,0);scene.add(new T.HemisphereLight('#f1dfbf','#263126',2.1));const key=new T.DirectionalLight('#ffe0b7',2.7);key.position.set(3,5,4);scene.add(key);const rim=new T.DirectionalLight('#8ea6be',1.0);rim.position.set(-4,3,-2);scene.add(rim);renderer.render(scene,camera);
 return {canvas,dispose:()=>{renderer.dispose();scene.clear();}};
}
