import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALDERWATCH_SKY_ASSET,radianceClosureTuning,robustHorizonSRGB,robustSunAzimuth,wrapAngle} from '../src/radiance-closure';

test('sky radiance replaces flat ambient without erasing the fail-soft floor',()=>{
 const march=radianceClosureTuning(.30,.78,.0034),wolfpine=radianceClosureTuning(.22,.82,.0057);
 assert.ok(march.environmentIntensity>.30&&march.environmentIntensity<=.50);
 assert.ok(wolfpine.environmentIntensity>.22&&wolfpine.environmentIntensity>=.32);
 assert.ok(march.hemisphereIntensity<.78&&march.hemisphereIntensity>=.20);
 assert.ok(wolfpine.hemisphereIntensity<.82&&wolfpine.hemisphereIntensity>=.20);
 assert.ok(march.fogDensity<.0034&&march.fogDensity>.0025);
 assert.ok(wolfpine.fogDensity<.0057&&wolfpine.fogDensity>.0045);
});

test('horizon estimator rejects tiny sun cores and black silhouettes',()=>{
 const width=64,height=32,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  data[i]=y>=13&&y<=20?126:80;data[i+1]=y>=13&&y<=20?164:110;data[i+2]=y>=13&&y<=20?191:145;data[i+3]=255;
 }
 for(const x of [3,9,17]){const i=(16*width+x)*4;data[i]=data[i+1]=data[i+2]=255;}
 for(const x of [29,31,33]){const i=(17*width+x)*4;data[i]=data[i+1]=data[i+2]=0;}
 const c=robustHorizonSRGB(data,width,height);assert.ok(c);
 assert.ok(Math.abs(c![0]-126/255)<.04);assert.ok(Math.abs(c![1]-164/255)<.04);assert.ok(Math.abs(c![2]-191/255)<.04);
});

test('directional sky lobe yields a stable sun azimuth instead of fighting shadow direction',()=>{
 const width=64,height=32,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;data[i]=95;data[i+1]=120;data[i+2]=145;data[i+3]=255;}
 for(let y=8;y<12;y++)for(let x=48;x<52;x++){const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=255;}
 const sun=robustSunAzimuth(data,width,height);assert.ok(sun);
 const expected=(50/width-.5)*Math.PI*2;
 assert.ok(Math.abs(wrapAngle(sun!.azimuth-expected))<.12);
 assert.ok(sun!.confidence>.9);assert.ok(sun!.peakContrast>1.5);
});

test('sun azimuth estimator is circular across the panorama seam',()=>{
 const width=64,height=32,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;data[i]=88;data[i+1]=108;data[i+2]=130;data[i+3]=255;}
 for(let y=7;y<11;y++)for(const x of [0,1,62,63]){const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=255;}
 const sun=robustSunAzimuth(data,width,height);assert.ok(sun);
 assert.ok(Math.abs(wrapAngle(sun!.azimuth-Math.PI))<.13,'seam lobe must stay one sun, not split into two');
 assert.ok(sun!.confidence>.9);
});

test('radiance closure installs before realm selection and restores the stock render hot path',()=>{
 const bootstrap=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8'),runtime=readFileSync(new URL('../src/radiance-closure-runtime.ts',import.meta.url),'utf8');
 assert.ok(bootstrap.indexOf("import './radiance-closure-runtime'")<bootstrap.indexOf('const area=prepareSavedArea()'));
 assert.match(runtime,/PMREMGenerator\(renderer\)/);assert.match(runtime,/fromEquirectangular\(sky\)/);
 assert.match(runtime,/scene\.environment=target\.texture/);assert.match(runtime,/scene\.background=sky/);
 assert.match(runtime,/backgroundRotation\.y=yaw/);assert.match(runtime,/environmentRotation\.y=yaw/);
 assert.match(runtime,/DirectionalLight&&o\.castShadow/,'interior-only scenes must not be mistaken for outdoor radiance');
 assert.match(runtime,/proto\.render=original/);assert.match(runtime,/steadyStateDrawsAdded:0/);
 assert.ok(!/EffectComposer|SSAOPass|GTAOPass|SMAAPass/.test(runtime),'closure must not hide a full-screen post stack');
 assert.equal(ALDERWATCH_SKY_ASSET,'/assets/alderwatch-sky.webp');
});
