// Forward-port only geometry. Original gameplay nodes, skins, materials and every animation stay intact.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {copyToDocument,prune,dedup} from '@gltf-transform/functions';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),dir='assets/source/visual-pass';
for(const [asset,refinement] of [['frontier-kit','woodland'],['survivor','character-refined']]){
 const original=`${dir}/${asset}-original.glb`;
 try{await fs.access(original);}catch{await fs.copyFile(`public/assets/${asset}.glb`,original);}
 const doc=await io.read(original),source=await io.read(`${dir}/${refinement}.glb`),root=doc.getRoot();
 for(const node of source.getRoot().listNodes().filter(n=>n.getMesh())){
  const dest=root.listNodes().find(n=>n.getName()===node.getName());if(!dest)continue;
  assert.deepEqual(node.getMatrix(),dest.getMatrix(),'Mesh coordinate system changed: '+node.getName());
  const mesh=copyToDocument(doc,source,[node.getMesh()]).get(node.getMesh());
  for(const p of mesh.listPrimitives()){
   const name=p.getMaterial().getName(),material=dest.getMesh().listPrimitives().map(x=>x.getMaterial()).find(m=>m.getName()===name);
   assert.ok(material,'Unknown material '+name);p.setMaterial(material);
   if(asset==='survivor'){
    assert.ok(node.getSkin(),'Refinement lost skin');const sj=node.getSkin().listJoints(),dj=dest.getSkin().listJoints();
    const remap=sj.map(j=>dj.findIndex(d=>d.getName()===j.getName()));assert.ok(remap.every(i=>i>=0));
    const binds=node.getSkin().getInverseBindMatrices(),db=dest.getSkin().getInverseBindMatrices();
    for(let i=0;i<sj.length;i++){const a=binds.getElement(i,[]),b=db.getElement(remap[i],[]);assert.ok(a.every((v,k)=>Math.abs(v-b[k])<.0001),'Bind pose changed '+sj[i].getName());}
    const joints=p.getAttribute('JOINTS_0');assert.ok(joints);const array=joints.getArray();for(let i=0;i<array.length;i++)array[i]=remap[array[i]];
   }else if(!p.getAttribute('COLOR_0')){
    const pos=p.getAttribute('POSITION'),color=new Float32Array(pos.getCount()*3);
    for(let i=0;i<pos.getCount();i++){const v=pos.getElement(i,[]),shade=.80+.14*Math.sin(v[0]*2.7+v[2]*3.1);color.set([shade,shade,shade],i*3);}
    p.setAttribute('COLOR_0',doc.createAccessor().setType('VEC3').setArray(color).setBuffer(root.listBuffers()[0]));
   }
  }
  dest.setMesh(mesh);console.log('Replaced geometry:',dest.getName());
 }
 for(const a of root.listAccessors())a.setBuffer(root.listBuffers()[0]);
 for(const b of root.listBuffers().slice(1))b.dispose();
 await doc.transform(prune({keepLeaves:true,keepAttributes:true}),dedup());
 await io.write(`public/assets/${asset}.glb`,doc);
 console.log(asset,(await fs.stat(`public/assets/${asset}.glb`)).size,'bytes; animations',root.listAnimations().length);
}
