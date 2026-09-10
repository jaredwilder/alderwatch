export const ALDERWATCH_SKY_ASSET='/assets/alderwatch-sky.webp';

export interface RadianceClosureTuning{
 environmentIntensity:number;
 hemisphereIntensity:number;
 fogDensity:number;
}

export interface SunAzimuthEstimate{
 azimuth:number;
 confidence:number;
 peakContrast:number;
}

const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));

/**
 * Rebalance existing outdoor lighting when the actual sky becomes the IBL source.
 * The old HemisphereLight remains as a fail-soft floor, but stops washing out the
 * directional structure now supplied by sky radiance + the sun.
 */
export function radianceClosureTuning(environmentIntensity:number,hemisphereIntensity:number,fogDensity:number):RadianceClosureTuning{
 return {
  environmentIntensity:clamp(environmentIntensity*1.55,.32,.50),
  hemisphereIntensity:clamp(hemisphereIntensity*.46,.20,.40),
  fogDensity:clamp(fogDensity*.88,.0018,.0062),
 };
}

export type SRGB=[number,number,number];

/**
 * Robustly estimate the equirectangular horizon colour from a tiny readback.
 * Bright sun/cloud cores and dark ground silhouettes are trimmed so fog converges
 * to the broad atmospheric horizon rather than one extreme texel.
 */
export function robustHorizonSRGB(data:Uint8ClampedArray,width:number,height:number):SRGB|null{
 if(width<2||height<2||data.length<width*height*4)return null;
 const y0=Math.max(0,Math.floor(height*.43)),y1=Math.min(height-1,Math.ceil(height*.61));
 const stride=Math.max(1,Math.floor(width/128));
 const samples:{r:number;g:number;b:number;l:number}[]=[];
 for(let y=y0;y<=y1;y+=1)for(let x=0;x<width;x+=stride){
  const i=(y*width+x)*4,a=data[i+3];if(a<16)continue;
  const r=data[i],g=data[i+1],b=data[i+2],l=.2126*r+.7152*g+.0722*b;
  samples.push({r,g,b,l});
 }
 if(!samples.length)return null;
 samples.sort((a,b)=>a.l-b.l);
 const lo=samples[Math.floor(samples.length*.12)].l,hi=samples[Math.min(samples.length-1,Math.floor(samples.length*.88))].l;
 let r=0,g=0,b=0,n=0;
 for(const s of samples){if(s.l<lo||s.l>hi)continue;r+=s.r;g+=s.g;b+=s.b;n++;}
 if(!n){for(const s of samples){r+=s.r;g+=s.g;b+=s.b;n++;}}
 return [r/(255*n),g/(255*n),b/(255*n)];
}

/**
 * Locate a genuinely directional bright lobe in an equirectangular sky. The
 * circular mean handles the panorama seam. Confidence prevents broad bright cloud
 * decks from being mistaken for the sun.
 */
export function robustSunAzimuth(data:Uint8ClampedArray,width:number,height:number):SunAzimuthEstimate|null{
 if(width<8||height<4||data.length<width*height*4)return null;
 const lum:number[]=[];let max=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(data[i+3]<16)continue;
  const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];lum.push(l);if(l>max)max=l;
 }
 if(lum.length<16)return null;lum.sort((a,b)=>a-b);
 const median=lum[Math.floor(lum.length*.5)],threshold=lum[Math.floor(lum.length*.965)];
 let cx=0,cz=0,total=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(data[i+3]<16)continue;
  const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];if(l<=threshold)continue;
  const weight=(l-threshold)*(l-threshold),angle=((x+.5)/width-.5)*Math.PI*2;
  cx+=Math.cos(angle)*weight;cz+=Math.sin(angle)*weight;total+=weight;
 }
 if(total<=0)return null;
 return {azimuth:Math.atan2(cz,cx),confidence:Math.hypot(cx,cz)/total,peakContrast:max/Math.max(1,median)};
}

export function wrapAngle(angle:number){
 const tau=Math.PI*2;return ((angle+Math.PI)%tau+tau)%tau-Math.PI;
}
