import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

export type ExtendedAnimalKind='goat'|'sheep'|'deer'|'bear';

const SPECS:Record<ExtendedAnimalKind,{url:string;height:number;yaw:number}>={
 goat:{url:'/assets/animals/goat.glb',height:.9,yaw:Math.PI},
 sheep:{url:'/assets/animals/sheep.glb',height:.95,yaw:Math.PI},
 deer:{url:'/assets/animals/deer.glb',height:1.75,yaw:0},
 bear:{url:'/assets/animals/bear.glb',height:1.65,yaw:Math.PI},
};

export interface AnimalInstance {
 root:T.Object3D;
 animations:T.AnimationClip[];
}

export async function loadExtendedAnimalLibrary(){
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const entries=await Promise.all((Object.keys(SPECS) as ExtendedAnimalKind[]).map(async kind=>[kind,await loader.loadAsync(SPECS[kind].url)] as const));
 return Object.fromEntries(entries) as Record<ExtendedAnimalKind,GLTF>;
}

export function instantiateAnimal(kind:ExtendedAnimalKind,gltf:GLTF):AnimalInstance{
 const root=clone(gltf.scene);
 root.rotation.y=SPECS[kind].yaw;
 root.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());
 const scale=SPECS[kind].height/Math.max(size.y,.01);
 root.scale.multiplyScalar(scale);root.updateMatrixWorld(true);
 const grounded=new T.Box3().setFromObject(root);root.position.y-=grounded.min.y;
 root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;}});
 return {root,animations:gltf.animations};
}

export function animalClips(clips:T.AnimationClip[]){
 const find=(patterns:RegExp[])=>patterns.map(p=>clips.find(c=>p.test(c.name))).find(Boolean);
 const idle=find([/^idle$/i,/idle/i,/stand/i])??clips[0];
 const walk=find([/^walk$/i,/walk/i,/trot/i,/locomotion/i])??idle;
 const run=find([/^run$/i,/run/i,/gallop/i,/sprint/i])??walk;
 return {idle,walk,run};
}
