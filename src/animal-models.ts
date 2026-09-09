import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {AUTHORED_ANIMAL_KINDS,species,type AuthoredAnimalKind} from './wildlife-species';
import {animalCoat,softenedAnimalGeometry} from './animal-surface';

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
const SKINS:Record<AuthoredAnimalKind,{body:string;dark:string;light:string}>={
 hare:{body:'#8f7967',dark:'#3b3028',light:'#c8b6a0'},
 crow:{body:'#171b1f',dark:'#080a0c',light:'#3e4850'},
 goat:{body:'#92775c',dark:'#403126',light:'#c2aa89'},
 sheep:{body:'#cfc5aa',dark:'#2e2923',light:'#eee4c9'},
 deer:{body:'#8f5936',dark:'#493020',light:'#d1af84'},
 bear:{body:'#4a3022',dark:'#241912',light:'#79543b'},
 bison:{body:'#3d2c24',dark:'#1f1714',light:'#6e5442'},
 wolf:{body:'#6a6a64',dark:'#353632',light:'#aaa79d'},
 eagle:{body:'#5b4028',dark:'#2b2119',light:'#d9d3bc'},
};

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

function skinnedMaterial(material:T.Material,kind:AuthoredAnimalKind,label:string,index:number){
 const palette=SKINS[kind],m=material.clone() as T.MeshStandardMaterial,name=(label+' '+m.name).toLowerCase();
 const dark=/hoof|horn|nose|snout|muzzle|eye|beak|claw|talon|paw|mane|foot/.test(name),light=/belly|chest|neck|tail|wool|featherwhite|headwhite/.test(name);
 const target=new T.Color(dark?palette.dark:light?palette.light:palette.body);
 if('color' in m&&m.color instanceof T.Color){if(m.map)m.color.multiply(target.clone().lerp(new T.Color('#ffffff'),.58));else m.color.copy(target);}
 if('roughness' in m)m.roughness=kind==='sheep'?.98:(kind==='eagle'||kind==='crow')?.82:.94;
 if('metalness' in m)m.metalness=0;
 // Models with anonymous one-material submeshes still get enough tonal breakup to stop reading as white test geometry.
 if(!m.map&&index%5===3&&'color' in m&&m.color instanceof T.Color)m.color.lerp(new T.Color(palette.light),.22);
 animalCoat(m,kind);return m;
}
/** Keep authored textures when present, but replace bare/default-white animal materials with grounded species palettes. */
export function skinAnimalModel(root:T.Object3D,kind:AuthoredAnimalKind){let index=0;root.traverse(o=>{if(!(o instanceof T.Mesh))return;o.geometry=softenedAnimalGeometry(o.geometry);const n=index++;if(Array.isArray(o.material))o.material=o.material.map(m=>skinnedMaterial(m,kind,o.name,n));else o.material=skinnedMaterial(o.material,kind,o.name,n);o.castShadow=o.receiveShadow=true;o.frustumCulled=false;});return root;}

export async function loadExtendedAnimalLibrary(){
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const library:Partial<Record<AuthoredAnimalKind,GLTF>>={};
 await Promise.all(AUTHORED_ANIMAL_KINDS.map(async kind=>{
  try{library[kind]=await loader.loadAsync(`/assets/animals/${kind}.glb`);}
  catch(error){console.warn(`Alderwatch authored ${kind} model could not load; keeping its fallback when available.`,error);}
 }));
 return library;
}

export function instantiateAnimal(kind:AuthoredAnimalKind,gltf:GLTF):AnimalInstance{
 const root=skinAnimalModel(clone(gltf.scene),kind),forward=inferAnimalForward(root);
 if(!forward.proven)console.warn(`Could not prove authored forward axis for ${kind}; leaving model yaw uncorrected rather than guessing.`);
 root.rotation.y+=forward.correctionYaw;
 root.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());
 const targetHeight=species(kind).modelHeight??1;
 const scale=targetHeight/Math.max(size.y,.01);
 root.scale.multiplyScalar(scale);root.updateMatrixWorld(true);
 const grounded=new T.Box3().setFromObject(root);root.position.y-=grounded.min.y;
 root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=true;if(o instanceof T.SkinnedMesh){o.computeBoundingSphere();if(o.boundingSphere)o.boundingSphere.radius*=3;}}});
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