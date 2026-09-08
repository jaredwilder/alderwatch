import * as T from 'three';
import {Assets} from './assets';
import {MEDIEVAL_ASSET_SPECS} from './medieval-asset-specs';
import {sanitizeWorldProp} from './world-sanity';

if(typeof document!=='undefined'){void import('./overnight-overdrive');void import('./outlaw-legends');void import('./adventure-secrets');void import('./scavenger-chaos');}

/**
 * LIVE ACCEPTANCE GATE.
 *
 * Alderwatch has two authored libraries with very different source conventions.
 * The MegaKit substitutions for these five close-camera kit names repeatedly
 * produced map-spanning roofs/beams after nested assembly + consolidation.
 * Close-up gameplay therefore uses the known-stable original kit versions.
 * External complete buildings/props remain available everywhere else.
 */
export const STABLE_CLOSEUP_KIT_NAMES=new Set(['village_details','village_roof','village_gable','palisade','camp_shelter']);

const box=new T.Box3(),size=new T.Vector3();
export function enforceAuthoredRootContract(name:string,root:T.Object3D){
 const spec=MEDIEVAL_ASSET_SPECS[name];
 sanitizeWorldProp(root);
 root.updateMatrixWorld(true);box.setFromObject(root);box.getSize(size);
 const span=Math.max(size.x,size.z),height=size.y;
 const maxSpan=(spec?.maxSpan??12)*1.18;
 const maxHeight=spec?.fit==='height'?Math.max(spec.target*1.35,3.2):Math.max(8,maxSpan*.9);
 const factor=Math.min(1,maxSpan/Math.max(span,1e-4),maxHeight/Math.max(height,1e-4));
 if(factor<1){root.scale.multiplyScalar(factor);root.updateMatrixWorld(true);root.userData.awRootContractClamped=true;}
 root.userData.awLiveAcceptedAsset=name;
 return root;
}

export function installGfxReleaseGate(){
 const proto=Assets.prototype as any;if(proto.__awGfxReleaseGate)return;
 const original=proto.prop;
 proto.prop=function(name:string){
  if(STABLE_CLOSEUP_KIT_NAMES.has(name)){
   const source=this.kit?.scene?.getObjectByName(name);
   if(source){const stable=source.clone(true);stable.userData.awStableCloseupFallback=true;return stable;}
  }
  return enforceAuthoredRootContract(name,original.call(this,name));
 };
 proto.__awGfxReleaseGate=true;
}

installGfxReleaseGate();
