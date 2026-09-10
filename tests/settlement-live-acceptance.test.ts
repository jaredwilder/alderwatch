import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeOrganicTrackGeometry,makeIrregularPatchGeometry} from '../src/organic-track';
import {CHARCOAL_CAMP_PLAN} from '../src/charcoal-camp-plan';

function positions(g:ReturnType<typeof makeOrganicTrackGeometry>){return Array.from(g.getAttribute('position').array as ArrayLike<number>);}

test('organic roads are deterministic one-draw strips with bounded imperfect edges',()=>{
 const a=makeOrganicTrackGeometry([{x:-24,z:0},{x:24,z:0}],5.6,'court-road',4),b=makeOrganicTrackGeometry([{x:-24,z:0},{x:24,z:0}],5.6,'court-road',4),other=makeOrganicTrackGeometry([{x:-24,z:0},{x:24,z:0}],5.6,'other-road',4);
 assert.deepEqual(positions(a),positions(b));
 assert.notDeepEqual(positions(a),positions(other));
 const p=positions(a);let maxZ=0;for(let i=2;i<p.length;i+=3)maxZ=Math.max(maxZ,Math.abs(p[i]));
 assert.ok(maxZ>0,'interior centre/edge variation must be visible in geometry');
 assert.ok(maxZ<3.6,'road variation must remain inside a conservative traversable envelope');
 assert.ok(a.getAttribute('position').count<80,'one 48m road must stay tiny');
 a.dispose();b.dispose();other.dispose();
});

test('semantic work-yard patches are irregular compact meshes rather than cell-sized squares',()=>{
 const a=makeIrregularPatchGeometry(7,5,'yard'),b=makeIrregularPatchGeometry(7,5,'yard'),p=positions(a as ReturnType<typeof makeOrganicTrackGeometry>);
 assert.deepEqual(p,positions(b as ReturnType<typeof makeOrganicTrackGeometry>));
 assert.ok(a.getAttribute('position').count<=20);
 const xs:number[]=[],zs:number[]=[];for(let i=0;i<p.length;i+=3){xs.push(p[i]);zs.push(p[i+2]);}
 assert.ok(Math.max(...xs)-Math.min(...xs)<15);
 assert.ok(Math.max(...zs)-Math.min(...zs)<11);
 a.dispose();b.dispose();
});

test('the screenshot-failed rectangular road primitive is removed at all three streaming layers',()=>{
 const settlement=readFileSync(new URL('../src/settlement-runtime.ts',import.meta.url),'utf8');
 const far=readFileSync(new URL('../src/streamed-area-far-field.ts',import.meta.url),'utf8');
 const wolfpine=readFileSync(new URL('../src/wolfpine.ts',import.meta.url),'utf8');
 const crownroad=readFileSync(new URL('../src/crownroad-vale.ts',import.meta.url),'utf8');
 assert.match(settlement,/makeOrganicTrackGeometry/);
 assert.doesNotMatch(settlement,/ribbon\.scale\.set\(path\.width,length,1\)/);
 assert.match(far,/makeOrganicTrackGeometry/);
 assert.doesNotMatch(far,/new T\.PlaneGeometry\(spec\.width,spec\.length\)/);
 assert.doesNotMatch(wolfpine,/plane\(cell,group,WOLFPINE_CELL\+\.5,6\.5,surfaces\.road/);
 assert.match(crownroad,/stream-generated-organic-road/);
 assert.doesNotMatch(crownroad,/new T\.Mesh\(surfaces\.geometry\(w,h\),surfaces\.road\)/);
});

test('Charcoal Camp now has built mass, edge enclosure and beaten-earth semantics',()=>{
 assert.ok(CHARCOAL_CAMP_PLAN.placements.length>=40);
 const shelter=CHARCOAL_CAMP_PLAN.placements.find(p=>p.id==='crew-shelter')!;
 assert.equal(shelter.asset,'hut_c');
 assert.ok(shelter.collision,'crew shelter must be physical built mass');
 assert.equal(CHARCOAL_CAMP_PLAN.placements.some(p=>p.asset==='camp-shelter'),false,'failed skeletal X shelter must not return');
 assert.ok(CHARCOAL_CAMP_PLAN.placements.filter(p=>p.asset==='fence_wood_single').length>=8,'camp needs readable work-yard edges');
 assert.equal(CHARCOAL_CAMP_PLAN.placements.some(p=>p.asset==='fence_wood_ext1'||p.asset==='fence_wood_ext2'),false,'overscaled X fence modules are banned from this close-camera camp');
 const runtime=readFileSync(new URL('../src/settlement-runtime.ts',import.meta.url),'utf8');
 assert.match(runtime,/settlement-ground:/);
 assert.match(runtime,/surfaces\.yard/);
});

test('Saint Orra and Wolfpine roadside sites no longer use the giant fortification composite',()=>{
 const wolfpine=readFileSync(new URL('../src/wolfpine.ts',import.meta.url),'utf8');
 const crownroad=readFileSync(new URL('../src/crownroad-vale.ts',import.meta.url),'utf8');
 assert.doesNotMatch(wolfpine,/authoredFortification\(/);
 assert.doesNotMatch(crownroad,/authoredFortification\(/);
 assert.match(crownroad,/Saint Orra is a roadside checkpoint/);
 assert.match(crownroad,/coord\.x===-4&&coord\.z===0\).*hut_c.*watchtower.*wagon.*fence_wood_single/s);
});
