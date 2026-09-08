import test from 'node:test';
import assert from 'node:assert/strict';
import {model} from './load-assets';

test('diagnose shipping combat skeleton and clip timing',async()=>{
 const g=await model('survivor');
 const bones:string[]=[];g.scene.traverse(o=>{if(/root|pelvis|hip|spine|thigh/i.test(o.name))bones.push(o.name);});
 console.log('COMBAT_BONES',JSON.stringify(bones));
 for(const name of ['attack','heavy','chop','mine']){
  const clip=g.animations.find(c=>c.name===name)!;assert.ok(clip,name);
  const tracks=clip.tracks.map(t=>t.name).filter(n=>/root|pelvis|hip|spine|thigh/i.test(n));
  console.log('COMBAT_CLIP',name,'duration',clip.duration,'tracks',JSON.stringify(tracks));
 }
});
