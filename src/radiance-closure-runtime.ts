import * as T from 'three';
import {ALDERWATCH_SKY_ASSET,radianceClosureTuning,robustHorizonSRGB} from './radiance-closure';

const INSTALL=Symbol.for('alderwatch.radiance-closure.v1');
const targets=new WeakMap<T.Scene,T.WebGLRenderTarget>();

type OutdoorLights={sun:T.DirectionalLight;hemi:T.HemisphereLight};

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

function sampledHorizon(texture:T.Texture){
 if(typeof document==='undefined'||!texture.image)return null;
 try{
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=48;
  const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return null;
  context.drawImage(texture.image as CanvasImageSource,0,0,canvas.width,canvas.height);
  const sample=robustHorizonSRGB(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
  return sample?new T.Color().setRGB(sample[0],sample[1],sample[2],T.SRGBColorSpace):null;
 }catch{return null;}
}

async function closeRadiance(renderer:T.WebGLRenderer,scene:T.Scene){
 if(scene.userData.awRadianceClosure)return;
 scene.userData.awRadianceClosure={state:'loading',version:1};
 const lights=outdoorLights(scene);if(!lights)return;
 const oldEnvironment=scene.environment;
 try{
  const sky=await skyFor(scene,renderer);
  const tuning=radianceClosureTuning(scene.environmentIntensity,lights.hemi.intensity,(scene.fog as T.FogExp2).density);
  const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
  const target=pmrem.fromEquirectangular(sky);pmrem.dispose();targets.set(scene,target);

  // One sky now owns what the eye sees and what PBR materials receive.
  scene.background=sky;scene.environment=target.texture;scene.environmentIntensity=tuning.environmentIntensity;
  lights.hemi.intensity=tuning.hemisphereIntensity;

  // Make atmospheric extinction converge toward the actual panorama horizon instead of a hand-picked swatch.
  const fog=scene.fog as T.FogExp2,horizon=sampledHorizon(sky),oldFog=fog.color.clone();
  if(horizon)fog.color.lerpColors(oldFog,horizon,.62);
  fog.density=tuning.fogDensity;

  if(oldEnvironment&&oldEnvironment!==target.texture&&oldEnvironment!==sky)oldEnvironment.dispose();
  scene.userData.awRadianceClosure={state:'closed',version:1,sky:ALDERWATCH_SKY_ASSET,environmentIntensity:tuning.environmentIntensity,hemisphereIntensity:tuning.hemisphereIntensity,fogDensity:tuning.fogDensity,horizonSampled:!!horizon,steadyStateDrawsAdded:0};
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
