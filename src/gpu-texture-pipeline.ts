import type * as T from 'three';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {BASIS_TRANSCODER_PATH,estimatedMipChainBytes,preferredBasisCodec,type TextureRole} from './material-singularity';

export interface GpuTexturePlan{
 role:TextureRole;
 codec:'ETC1S'|'UASTC';
 sourceBitsPerPixel:number;
 targetBitsPerPixel:number;
}

/** Conservative planning model; actual native target depends on device support. */
export function gpuTexturePlan(role:TextureRole):GpuTexturePlan{
 const codec=preferredBasisCodec(role);
 return {role,codec,sourceBitsPerPixel:32,targetBitsPerPixel:codec==='ETC1S'?4:8};
}

export function residentSavingsRatio(width:number,height:number,role:TextureRole){
 const plan=gpuTexturePlan(role),rgba=estimatedMipChainBytes(width,height,plan.sourceBitsPerPixel),compressed=estimatedMipChainBytes(width,height,plan.targetBitsPerPixel);
 return {rgba,compressed,ratio:rgba/Math.max(1,compressed)};
}

/**
 * Production loader factory. The Basis transcoder files are copied from the exact
 * installed Three.js package during predev/prebuild, avoiding CDN/runtime version drift.
 */
export function createAlderwatchKTX2Loader(renderer:T.WebGLRenderer){
 return new KTX2Loader().setTranscoderPath(BASIS_TRANSCODER_PATH).setWorkerLimit(2).detectSupport(renderer);
}
