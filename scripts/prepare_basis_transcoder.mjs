import {mkdir,copyFile,stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';

const require=createRequire(import.meta.url);
const threeEntry=require.resolve('three');
const threeRoot=resolve(dirname(threeEntry),'..');
const source=join(threeRoot,'examples','jsm','libs','basis');
const target=resolve('public','basis');
await mkdir(target,{recursive:true});
for(const name of ['basis_transcoder.js','basis_transcoder.wasm']){
 const from=join(source,name),to=join(target,name);await stat(from);await copyFile(from,to);
}
console.log('Prepared Three.js Basis transcoder in public/basis');
