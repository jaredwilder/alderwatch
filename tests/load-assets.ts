import fs from 'node:fs';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
// Shipping geometry/skins/actions are kept intact; only GPU images are omitted in Node.
export async function model(name:string):Promise<GLTF>{
 const b=fs.readFileSync(`public/assets/${name}.glb`),length=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+length).toString());
 const offset=20+length,bin=b.subarray(offset+8,offset+8+b.readUInt32LE(offset));
 j.buffers[0].uri='data:application/octet-stream;base64,'+bin.toString('base64');
 j.images=[];j.textures=[];j.materials=(j.materials??[]).map((m:any)=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0}}));
 j.extensionsRequired=[];j.extensionsUsed=[];
 if(!globalThis.ProgressEvent)(globalThis as any).ProgressEvent=class {constructor(public type:string,public data:any){}};
 return new Promise((resolve,reject)=>new GLTFLoader().parse(JSON.stringify(j),'',resolve,reject));
}
