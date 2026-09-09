import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {StreamedAreaSurfaceSet} from '../src/streamed-area-surface';

test('streamed surface set reuses geometry identity for the whole region lifetime',()=>{
 const texture=()=>new T.Texture(),assets={textures:{'field-color':texture(),'field-normal':texture(),'field-rough':texture(),meadow:texture(),soil:texture()}} as any;
 const surfaces=new StreamedAreaSurfaceSet(assets,{ground:'#aaa',road:'#987'});
 const a=surfaces.geometry(48.3,48.3),b=surfaces.geometry(48.3,48.3),c=surfaces.geometry(48.5,7),d=surfaces.geometry(48.5,7);
 assert.strictEqual(a,b);assert.strictEqual(c,d);assert.notStrictEqual(a,c);assert.equal(surfaces.geometryCount,2);
 surfaces.dispose();assert.equal(surfaces.geometryCount,0);
});

test('Crownroad and Ironward no longer construct or dispose a MeshStandardMaterial per cell',()=>{
 const crown=readFileSync(new URL('../src/crownroad-vale.ts',import.meta.url),'utf8');
 const basin=readFileSync(new URL('../src/ironward-basin.ts',import.meta.url),'utf8');
 for(const [name,source] of [['Crownroad',crown],['Ironward',basin]] as const){
  assert.match(source,/new StreamedAreaSurfaceSet/);
  assert.match(source,/surfaces\.geometry/);
  assert.doesNotMatch(source,/buildCell[\s\S]{0,1400}new T\.MeshStandardMaterial/,`${name} buildCell must not allocate tile materials`);
  assert.doesNotMatch(source,/disposeCell[\s\S]{0,500}\.material.*dispose/,`${name} cell retirement must not dispose shared materials`);
 }
});

test("King's East Gate is now a physical E handoff to Wolfpine",()=>{
 const crown=readFileSync(new URL('../src/crownroad-vale.ts',import.meta.url),'utf8');
 assert.match(crown,/function travelWolfpine\(\)/);
 assert.match(crown,/requestAreaTravel\(WOLFPINE\)/);
 assert.match(crown,/east<=5\?'E · King’s East Gate · Enter Wolfpine'/);
 assert.match(crown,/if\(interact&&east<=5\)\{travelWolfpine\(\);return;\}/);
 assert.doesNotMatch(crown,/eastern realm gate not yet opened/);
});
