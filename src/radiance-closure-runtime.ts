import * as T from 'three';
import {ALDERWATCH_SKY_ASSET,radianceClosureTuning,robustHorizonSRGB,robustSunAzimuth,wrapAngle,type SunAzimuthEstimate} from './radiance-closure';

const INSTALL=Symbol.for('alderwatch.radiance-closure.v1');
const targets=new WeakMap<T.Scene,T.WebGLRenderTarget>();

type OutdoorLights={sun:T.DirectionalLight;hemi:T.HemisphereLight};
type SkySample={horizon:T.Color|null;sun:SunAzimuthEstimate|null};

function outdoorLights(scene:T.Scene):OutdoorLights|null{
 let sun:T.DirectionalLight|undefined,hemi:T.HemisphereLight|undefined;
 scene.traverse(o=>{
  if(!sun&&o instanceof T.DirectionalLight&&o.castShadow)sun=o;
  if(!hemi&&o instanceof T.HemisphereLight)hemi=o;
 });
 return sun&&hemi?{sun,hemi}:null;
}

function isOutdoorScene(value:unknown):value is T.Scene{
 return value instanceof T.Scene&&value.fog instanceof T.FogExp2&&!!outdoorLights(value);
}

async function skyFor(scene:T.Scene,renderer:T.WebGLRenderer){
 const background=scene.background;
 if(background instanceof T.Texture&&!(background as any).isCubeTexture){
  background.mapping=T.EquirectangularReflectionMapping;
  background.colorSpace=T.SRGBColorSpace;
  return background;
 }
 const sky=await new T.TextureLoader().loadAsync(ALDERWATCH_SKY_ASSET);
 sky.mapping=T.EquirectangularReflectionMapping;sky.colorSpace=T.SRGBColorSpace;
 sky.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());sky.needsUpdate=true;
 return sky;
}

function sampleSky(texture:T.Texture):SkySample{
 if(typeof document==='undefined'||!texture.image)return {horizon:null,sun:null};
 try{
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=48;
  const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return {horizon:null,sun:null};
  context.drawImage(texture.image as CanvasImageSource,0,0,canvas.width,canvas.height);
  const data=context.getImageData(0,0,canvas.width,canvas.height).data,h=robustHorizonSRGB(data,canvas.width,canvas.height),sun=robustSunAzimuth(data,canvas.width,canvas.height);
  return {horizon:h?new T.Color().setRGB(h[0],h[1],h[2],T.SRGBColorSpace):null,sun};
 }catch{return {horizon:null,sun:null};}
}

function alignSkyToSun(scene:T.Scene,sun:T.DirectionalLight,estimate:SunAzimuthEstimate|null){
 if(!estimate||estimate.confidence<.48||estimate.peakContrast<1.12)return null;
 const dx=sun.position.x-sun.target.position.x,dz=sun.position.z-sun.target.position.z;
 if(Math.hypot(dx,dz)<1e-4)return null;
 const directAzimuth=Math.atan2(dz,dx),visibleAzimuth=wrapAngle(estimate.azimuth+scene.backgroundRotation.y),delta=wrapAngle(directAzimuth-visibleAzimuth),yaw=wrapAngle(scene.backgroundRotation.y+delta);
 scene.backgroundRotation.y=yaw;scene.environmentRotation.y=yaw;
 return {yaw,confidence:estimate.confidence,peakContrast:estimate.peakContrast};
}

async function closeRadiance(renderer:T.WebGLRenderer,scene:T.Scene){
 if(scene.userData.awRadianceClosure)return;
 scene.userData.awRadianceClosure={state:'loading',version:1};
 const lights=outdoorLights(scene);if(!lights)return;
 const oldEnvironment=scene.environment;
 try{
  const sky=await skyFor(scene,renderer),sample=sampleSky(sky),alignment=alignSkyToSun(scene,lights.sun,sample.sun);
  const tuning=radianceClosureTuning(scene.environmentIntensity,lights.hemi.intensity,(scene.fog as T.FogExp2).density);
  const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
  const target=pmrem.fromEquirectangular(sky);pmrem.dispose();targets.set(scene,target);

  // One sky now owns what the eye sees and what PBR materials receive.
  scene.background=sky;scene.environment=target.texture;scene.environmentIntensity=tuning.environmentIntensity;
  lights.hemi.intensity=tuning.hemisphereIntensity;

  // Make atmospheric extinction converge toward the actual panorama horizon instead of a hand-picked swatch.
  const fog=scene.fog as T.FogExp2,oldFog=fog.color.clone();
  if(sample.horizon)fog.color.lerpColors(oldFog,sample.horizon,.62);
  fog.density=tuning.fogDensity;

  if(oldEnvironment&&oldEnvironment!==target.texture&&oldEnvironment!==sky)oldEnvironment.dispose();
  scene.userData.awRadianceClosure={state:'closed',version:1,sky:ALDERWATCH_SKY_ASSET,environmentIntensity:tuning.environmentIntensity,hemisphereIntensity:tuning.hemisphereIntensity,fogDensity:tuning.fogDensity,horizonSampled:!!sample.horizon,sunAligned:!!alignment,sunAlignment:alignment,steadyStateDrawsAdded:0};
 }catch(error){
  scene.userData.awRadianceClosure={state:'fallback',version:1,reason:error instanceof Error?error.message:String(error),steadyStateDrawsAdded:0};
  console.warn('Alderwatch radiance closure retained the existing outdoor lighting',error);
 }
}

function install(){
 const global=globalThis as Record<PropertyKey,unknown>;if(global[INSTALL])return;global[INSTALL]=true;
 const proto=T.WebGLRenderer.prototype as any,original=proto.render;let armed=true;
 proto.render=function(...args:any[]){
  const scene=args[0];
  if(armed&&isOutdoorScene(scene)){
   armed=false;
   // Capture the real game scene once, then put Three's render path back exactly as it was.
   // The PMREM is built outside the active render call; steady-state rendering pays no wrapper cost.
   proto.render=original;
   const renderer=this as T.WebGLRenderer;
   queueMicrotask(()=>{void closeRadiance(renderer,scene);});
  }
  return original.apply(this,args);
 };
}

if(typeof window!=='undefined')install();
