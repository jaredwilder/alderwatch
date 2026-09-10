import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyMaterialSurface,estimatedMipChainBytes,materialBandWeights,preferredBasisCodec,supplementalTextureSamples} from '../src/material-singularity';
import {residentSavingsRatio} from '../src/gpu-texture-pipeline';

test('material bandwidth closes fine detail before macro structure',()=>{
 const hero=materialBandWeights(.01,1),mid=materialBandWeights(.12,1),far=materialBandWeights(.8,1);
 assert.ok(hero.micro>mid.micro&&mid.micro>=far.micro);
 assert.ok(hero.meso>far.meso);assert.equal(far.micro,0);assert.equal(far.meso,0);assert.equal(far.macro,0);
});

test('solid surfaces classify without accidentally weathering foliage',()=>{
 assert.equal(classifyMaterialSurface('AW_bark oak trunk'),'bark');
 assert.equal(classifyMaterialSurface('wall_plaster_straight'),'plaster');
 assert.equal(classifyMaterialSurface('fence_wood_single'),'timber');
 assert.equal(classifyMaterialSurface('AW_stone rock_2'),'stone');
 assert.equal(classifyMaterialSurface('AW_leaf oak crown'),'other');
 assert.equal(classifyMaterialSurface('fern foliage'),'other');
});

test('new surface synthesis has a hard two-read ceiling and does not double-spend bark/stone',()=>{
 assert.equal(supplementalTextureSamples('timber',.005,1),2);
 assert.equal(supplementalTextureSamples('plaster',.005,1),2);
 assert.equal(supplementalTextureSamples('thatch',.005,1),2);
 assert.equal(supplementalTextureSamples('bark',.005,1),0);
 assert.equal(supplementalTextureSamples('stone',.005,1),0);
 assert.equal(supplementalTextureSamples('timber',.8,1),0);
});

test('Basis policy reserves UASTC precision for data maps and predicts real residency reduction',()=>{
 assert.equal(preferredBasisCodec('color'),'ETC1S');assert.equal(preferredBasisCodec('normal'),'UASTC');assert.equal(preferredBasisCodec('roughness'),'UASTC');
 const rgba=estimatedMipChainBytes(1024,1024,32),uastc=estimatedMipChainBytes(1024,1024,8),etc=estimatedMipChainBytes(1024,1024,4);
 assert.ok(rgba>5_500_000);assert.ok(rgba/uastc>3.9);assert.ok(rgba/etc>7.8);
 const plan=residentSavingsRatio(2048,2048,'normal');assert.ok(plan.ratio>3.9&&plan.ratio<4.1);
});

test('production build stages the exact installed Three Basis transcoder and material runtime installs before area routing',()=>{
 const pkg=readFileSync(new URL('../package.json',import.meta.url),'utf8'),script=readFileSync(new URL('../scripts/prepare_basis_transcoder.mjs',import.meta.url),'utf8'),bootstrap=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8'),runtime=readFileSync(new URL('../src/material-singularity-runtime.ts',import.meta.url),'utf8'),ground=readFileSync(new URL('../src/ground-material.ts',import.meta.url),'utf8');
 assert.match(pkg,/assets:basis/);assert.match(pkg,/prebuild[^\n]*assets:basis/);assert.match(script,/require\.resolve\('three'\)/);assert.match(script,/basis_transcoder\.wasm/);
 assert.ok(bootstrap.indexOf("import './material-singularity-runtime'")<bootstrap.indexOf('const area=prepareSavedArea()'));
 assert.match(runtime,/#include <color_fragment>/);assert.ok(!/uniform sampler2D/.test(runtime),'Proof 10 must reuse resident material maps instead of adding texture uniforms');
 assert.match(ground,/awGroundNoise/);assert.match(ground,/Geometry surrenders to statistical biomass/);
});
