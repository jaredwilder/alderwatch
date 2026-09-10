import type {AreaId} from './realm-runtime';
import {height as farMarchHeight} from './terrain';
import {WOLFPINE_AREA,WOLFPINE_HALF} from './wolfpine-world';

export interface BuildTerrainProfile {
 areaId:AreaId;
 label:string;
 height:(x:number,z:number)=>number;
 contains:(x:number,z:number)=>boolean;
 solid:(x:number,z:number)=>boolean;
 outsideMessage:string;
 surfaceMessage:string;
}

/**
 * The Far March profile is the old building contract written down explicitly. Keeping
 * these exact bounds and height checks here makes the extraction behavior-preserving.
 */
export const FAR_MARCH_BUILD_TERRAIN:BuildTerrainProfile={
 areaId:'far-march',
 label:'the settled March',
 height:farMarchHeight,
 contains:(x,z)=>Math.abs(x)<=70&&z>=-92&&z<=70,
 solid:(x,z)=>farMarchHeight(x,z)>=-1.1,
 outsideMessage:'Build within the settled March',
 surfaceMessage:'The ground is under water',
};

/** Wolfpine is currently a flat streamed area; the authored border keeps builds off the unload seam. */
export const WOLFPINE_BUILD_TERRAIN:BuildTerrainProfile={
 areaId:WOLFPINE_AREA,
 label:'Wolfpine',
 height:()=>0,
 contains:(x,z)=>Math.abs(x)<=WOLFPINE_HALF-8&&Math.abs(z)<=WOLFPINE_HALF-8,
 solid:()=>true,
 outsideMessage:'Build within the Wolfpine frontier',
 surfaceMessage:'Find solid ground in Wolfpine',
};

const PROFILES=new Map<AreaId,BuildTerrainProfile>([
 [FAR_MARCH_BUILD_TERRAIN.areaId,FAR_MARCH_BUILD_TERRAIN],
 [WOLFPINE_BUILD_TERRAIN.areaId,WOLFPINE_BUILD_TERRAIN],
]);

export function buildTerrainForArea(areaId:AreaId){return PROFILES.get(areaId);}
