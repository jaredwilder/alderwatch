import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FOREST_CONTACT_CAPACITY,PerceptualGovernor,forestContactBudget,forestVisualHash,observerRingQuality,rockPhenotype,treePhenotype} from '../src/forest-singularity';

const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('tree phenotype is deterministic, bounded and materially non-clone-like',()=>{
 const a=treePhenotype(18.25,-43.5),b=treePhenotype(18.25,-43.5);assert.deepEqual(a,b);
 const seen=new Set<string>();
 for(let x=-96;x<=96;x+=17)for(let z=-96;z<=96;z+=19){
  const p=treePhenotype(x,z);assert.ok(p.height>=.84&&p.height<=1.19);assert.ok(p.widthX>=.82&&p.widthX<=1.22);assert.ok(p.widthZ>=.82&&p.widthZ<=1.22);assert.ok(Math.abs(p.leanX)<=.071&&Math.abs(p.leanZ)<=.071);assert.ok(p.rootFlare>=.86&&p.rootFlare<=1.42);seen.add(`${p.height.toFixed(3)}:${p.widthX.toFixed(3)}:${p.widthZ.toFixed(3)}`);
 }
 assert.ok(seen.size>80,'world field should express many distinct oak phenotypes');
 assert.equal(forestVisualHash(1.25,2.5,7),forestVisualHash(1.25,2.5,7));
});

test('rock deformation stays bounded while breaking repeated silhouettes',()=>{
 const seen=new Set<string>();for(let i=0;i<80;i++){const p=rockPhenotype(i*2.7,-i*1.9);assert.ok(p.x>=.86&&p.x<=1.16);assert.ok(p.z>=.86&&p.z<=1.16);assert.ok(p.y>=.82&&p.y<=1.18);assert.ok(Math.abs(p.tiltX)<=.091&&Math.abs(p.tiltZ)<=.091);seen.add(`${p.x.toFixed(3)}:${p.y.toFixed(3)}:${p.z.toFixed(3)}`);}assert.ok(seen.size>70);
});

test('ground-contact realism is one fixed observer draw rather than per-tree decals',()=>{
 assert.deepEqual(forestContactBudget(),{capacity:96,segments:20,maxTriangles:1920,drawCalls:1});assert.equal(FOREST_CONTACT_CAPACITY,96);
});

test('perceptual governor sheds far detail first and recovers with hysteresis',()=>{
 const g=new PerceptualGovernor(16.67);for(let i=0;i<120;i++)g.sample(28);const stressed=g.quality;assert.ok(stressed>=.56&&stressed<.70);
 const low={hero:observerRingQuality(stressed,'hero'),near:observerRingQuality(stressed,'near'),mid:observerRingQuality(stressed,'mid'),far:observerRingQuality(stressed,'far')};
 assert.equal(low.hero,1);assert.ok(low.hero>=low.near&&low.near>=low.mid&&low.mid>=low.far);
 for(let i=0;i<30;i++)g.sample(12.5);assert.ok(g.quality>stressed,'headroom should restore quality');assert.ok(g.quality<1,'recovery should be deliberately slower than shedding');
});

test('runtime composes canopy depth, phenotype, contact field and the grass quality gate',()=>{
 const runtime=source('src/forest-singularity-runtime.ts'),grass=source('src/visual-detail-overdrive.ts'),boot=source('src/bootstrap.ts');
 assert.match(runtime,/AW_leaf/);assert.match(runtime,/gl_FrontFacing/);assert.match(runtime,/GroundContactField/);assert.match(runtime,/treePhenotype/);assert.match(runtime,/rockPhenotype/);assert.match(runtime,/PerceptualGovernor/);
 assert.match(grass,/awObserverQuality/);assert.match(grass,/awObserverVisibility=.*awObserverQuality/);assert.match(grass,/v4-quality/);
 assert.ok(boot.indexOf("import('./tree-bark-hd')")<boot.indexOf("import('./forest-singularity-runtime')"),'forest pass must layer after generated bark and existing observer-detail materials');
 assert.ok(boot.indexOf("import('./forest-singularity-runtime')")<boot.indexOf("import('./main')"),'forest runtime must patch prototypes before world construction');
});
