import * as T from 'three';

export interface ArrowFlight {mesh:T.Group;velocity:T.Vector3;life:number}

export function makeBow(){
 const group=new T.Group();group.name='bow';
 const wood=new T.MeshStandardMaterial({color:'#5a351f',roughness:.88,metalness:0});
 const cord=new T.LineBasicMaterial({color:'#d8cfb9'});
 const curve=new T.CatmullRomCurve3([new T.Vector3(0,.58,0),new T.Vector3(-.18,.30,0),new T.Vector3(-.23,0,0),new T.Vector3(-.18,-.30,0),new T.Vector3(0,-.58,0)]);
 const stave=new T.Mesh(new T.TubeGeometry(curve,18,.025,5,false),wood);stave.castShadow=true;group.add(stave);
 const stringGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(0,.58,0),new T.Vector3(-.05,0,.04),new T.Vector3(0,-.58,0)]);group.add(new T.Line(stringGeometry,cord));
 const arrow=makeArrow();arrow.scale.setScalar(.72);arrow.position.set(-.03,0,.02);arrow.rotation.x=Math.PI/2;group.add(arrow);
 return group;
}

export function makeArrow(){
 const group=new T.Group();group.name='arrow';
 const shaftMat=new T.MeshStandardMaterial({color:'#6b4728',roughness:.86});
 const iron=new T.MeshStandardMaterial({color:'#4d5150',roughness:.48,metalness:.62});
 const feather=new T.MeshStandardMaterial({color:'#d5c7a9',roughness:1,side:T.DoubleSide});
 const shaft=new T.Mesh(new T.CylinderGeometry(.012,.012,.72,6),shaftMat);shaft.castShadow=true;group.add(shaft);
 const head=new T.Mesh(new T.ConeGeometry(.045,.14,6),iron);head.position.y=.43;head.castShadow=true;group.add(head);
 for(const side of [-1,1]){const f=new T.Mesh(new T.PlaneGeometry(.12,.045),feather);f.position.set(side*.03,-.30,0);f.rotation.y=Math.PI/2;group.add(f);}
 return group;
}

export function launchArrow(root:T.Object3D,from:T.Vector3,to:T.Vector3){
 const mesh=makeArrow(),delta=to.clone().sub(from),distance=Math.max(.01,delta.length()),direction=delta.divideScalar(distance);mesh.position.copy(from);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);root.add(mesh);return {mesh,velocity:direction.multiplyScalar(34),life:Math.min(1.8,distance/34+.4)} satisfies ArrowFlight;
}

export function updateArrow(flight:ArrowFlight,dt:number){
 flight.life-=dt;flight.mesh.position.addScaledVector(flight.velocity,dt);flight.velocity.y-=2.6*dt;flight.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),flight.velocity.clone().normalize());
 if(flight.life>0)return true;
 flight.mesh.removeFromParent();flight.mesh.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];for(const material of materials)material.dispose();}});return false;
}
