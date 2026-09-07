import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {AUTHORED_ANIMAL_KINDS,species,type AuthoredAnimalKind} from './wildlife-species';

// Compatibility alias while callers migrate to the clearer authored-animal name.
export type ExtendedAnimalKind=AuthoredAnimalKind;
export type AuthoredForwardAxis='+x'|'-x'|'+z'|'-z'|'unknown';

export interface AnimalForwardCalibration {axis:AuthoredForwardAxis;correctionYaw:number;proven:boolean}
export interface AnimalInstance {
 root:T.Object3D;
 animations:T.AnimationClip[];
 forward:AnimalForwardCalibration;
}

const HEAD_TERMS=['muzzle','snout','nose','head','neck'];
const BODY_TERMS=['pelvis','hips','hip','spine','chest','torso','body'];
interface NamedPoint {node:T.Object3D;priority:number;position:T.Vector3}

function namedPoints(root:T.Object3D,terms:string[]){
 const points:NamedPoint[]=[];
 root.updateMatrixWorld(true);
 root.traverse(node=>{
  const name=node.name.toLowerCase().replace(/[^a-z0-9]/g,'');
  const index=terms.findIndex(term=>name.includes(term));
  if(index>=0)points.push({node,priority:terms.length-index,position:node.getWorldPosition(new T.Vector3())});
 });
 return points;
}

/** Prove model-forward from authored rig anatomy instead of maintaining species yaw guesses. */
export function inferAnimalForward(root:T.Object3D):AnimalForwardCalibration{
 const heads=namedPoints(root,HEAD_TERMS),bodies=namedPoints(root,BODY_TERMS);
 let best:{dx:number;dz:number;score:number}|undefined;
 for(const head of heads)for(const body of bodies){
  if(head.node===body.node)continue;
  const dx=head.position.x-body.position.x,dz=head.position.z-body.position.z,d=Math.hypot(dx,dz);
  if(d<.02)continue;
  const score=d*(1+.04*(head.priority+body.priority));
  if(!best||score>best.score)best={dx,dz,score};
 }
 if(!best)return {axis:'unknown',correctionYaw:0,proven:false};
 const axis:AuthoredForwardAxis=Math.abs(best.dx)>Math.abs(best.dz)?(best.dx>=0?'+x':'-x'):(best.dz>=0?'+z':'-z');
 return {axis,correctionYaw:-Math.atan2(best.dx,best.dz),proven:true};
}

export async function loadExtendedAnimalLibrary(){
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const entries=await Promise.all(AUTHORED_ANIMAL_KINDS.map(async kind=>[kind,await loader.loadAsync(`/assets/animals/${kind}.glb`)] as const));
 return Object.fromEntries(entries) as Record<AuthoredAnimalKind,GLTF>;
}

export function instantiateAnimal(kind:AuthoredAnimalKind,gltf:GLTF):AnimalInstance{
 const root=clone(gltf.scene),forward=inferAnimalForward(root);
 if(!forward.proven)console.warn(`Could not prove authored forward axis for ${kind}; leaving model yaw uncorrected rather than guessing.`);
 root.rotation.y+=forward.correctionYaw;
 root.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());
 const targetHeight=species(kind).modelHeight??1;
 const scale=targetHeight/Math.max(size.y,.01);
 root.scale.multiplyScalar(scale);root.updateMatrixWorld(true);
 const grounded=new T.Box3().setFromObject(root);root.position.y-=grounded.min.y;
 root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;}});
 return {root,animations:gltf.animations,forward};
}

export function animalClips(clips:T.AnimationClip[]){
 const find=(patterns:RegExp[])=>patterns.map(p=>clips.find(c=>p.test(c.name))).find(Boolean);
 const idle=find([/^idle$/i,/idle/i,/stand/i])??clips[0];
 const walk=find([/^walk$/i,/walk/i,/trot/i,/locomotion/i])??idle;
 const run=find([/^run$/i,/run/i,/gallop/i,/sprint/i])??walk;
 const attack=find([/^attack$/i,/attack/i,/bite/i,/maul/i,/strike/i]);
 const fly=find([/^fly$/i,/fly/i,/flight/i,/soar/i,/flap/i])??run??walk??idle;
 return {idle,walk,run,attack,fly};
}
