import * as T from 'three';
import type {Assets} from './assets';

/** Presentation-only skep. Honey ownership/respawn remains in the authority forage record. */
export function createBeehiveVisual(assets:Assets){
 const root=new T.Group();root.name='Wild beehive';
 const profile=[[.04,0],[.29,.05],[.36,.23],[.37,.46],[.33,.68],[.24,.87],[.11,.99],[.03,1.03]].map(([x,y])=>new T.Vector2(x,y));
 const hive=new T.Mesh(new T.LatheGeometry(profile,14),new T.MeshStandardMaterial({map:assets.textures.thatch,color:'#d0ad68',roughness:1}));
 hive.castShadow=hive.receiveShadow=true;root.add(hive);
 const base=new T.Mesh(new T.BoxGeometry(.82,.12,.62),new T.MeshStandardMaterial({map:assets.textures.timber,color:'#8b653d',roughness:.96}));base.position.y=.06;base.castShadow=base.receiveShadow=true;root.add(base);
 const opening=new T.Mesh(new T.CircleGeometry(.095,12),new T.MeshStandardMaterial({color:'#201a14',roughness:1,side:T.DoubleSide}));opening.position.set(0,.35,.355);opening.rotation.x=0;root.add(opening);
 const beeGeometry=new T.BufferGeometry();const coords=[] as number[];for(let i=0;i<9;i++){const a=i*2.399,r=.48+(i%3)*.08;coords.push(Math.cos(a)*r,.48+(i%4)*.12,Math.sin(a)*r);}beeGeometry.setAttribute('position',new T.Float32BufferAttribute(coords,3));
 const bees=new T.Points(beeGeometry,new T.PointsMaterial({color:'#30251a',size:.035,sizeAttenuation:true}));bees.name='Bee cloud';root.add(bees);
 return root;
}
