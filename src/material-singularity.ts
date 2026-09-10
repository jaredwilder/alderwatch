export type MaterialSurface='bark'|'stone'|'timber'|'plaster'|'thatch'|'other';

export interface MaterialBandWeights{macro:number;meso:number;micro:number}

const clamp=(x:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
const smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};

/**
 * Screen-space bandwidth admission. footprint is world-units represented by one
 * pixel. Large footprints cannot resolve small spatial frequencies, so the
 * expensive bands disappear before they alias.
 */
export function materialBandWeights(footprint:number,quality=1):MaterialBandWeights{
 const q=clamp(quality),f=Math.max(0,footprint);
 return {
  macro:clamp((1-smooth(.16,.62,f))*(.48+.52*q)),
  meso:clamp((1-smooth(.055,.24,f))*Math.max(0,(q-.18)/.82)),
  micro:clamp((1-smooth(.018,.095,f))*Math.max(0,(q-.52)/.48)),
 };
}

export function classifyMaterialSurface(label:string):MaterialSurface{
 const s=label.toLowerCase();
 if(/bark|trunk|oak/.test(s))return 'bark';
 if(/stone|rock|masonry|rubble/.test(s))return 'stone';
 if(/plaster|lime|stucco|wall_plaster/.test(s))return 'plaster';
 if(/thatch|straw|reed/.test(s))return 'thatch';
 if(/wood|timber|beam|frame|door|fence|floor_wood|support/.test(s))return 'timber';
 return 'other';
}

/** Extra texture reads added by Proof 10 beyond the material's authored base path. */
export function supplementalTextureSamples(surface:MaterialSurface,footprint:number,quality=1){
 if(surface==='other'||surface==='bark'||surface==='stone')return 0; // bark/stone already own Proof-4 bands.
 const b=materialBandWeights(footprint,quality);return (b.meso>.001?1:0)+(b.micro>.001?1:0);
}

export type TextureRole='color'|'normal'|'roughness'|'mask';
export type BasisCodec='ETC1S'|'UASTC';
export function preferredBasisCodec(role:TextureRole):BasisCodec{return role==='color'?'ETC1S':'UASTC';}

/** Exact full mip-chain residency for a block codec expressed as bits/pixel. */
export function estimatedMipChainBytes(width:number,height:number,bitsPerPixel:number){
 let w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height)),bytes=0;
 while(true){bytes+=Math.ceil(w*h*bitsPerPixel/8);if(w===1&&h===1)break;w=Math.max(1,w>>1);h=Math.max(1,h>>1);}
 return bytes;
}

export const BASIS_TRANSCODER_PATH='/basis/';
export const MATERIAL_SINGULARITY_VERSION='proof-10-material-singularity-v1';
