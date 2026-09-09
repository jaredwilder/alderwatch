export const IRONWARD_CROSSING_GATE=Object.freeze({x:350,z:35,radius:42});

export function isNearIronwardCrossing(x:number,z:number,radius=IRONWARD_CROSSING_GATE.radius){
  return Math.hypot(x-IRONWARD_CROSSING_GATE.x,z-IRONWARD_CROSSING_GATE.z)<=radius;
}

export function parseFarMarchHudPosition(text:string):{x:number;z:number}|null{
  const match=text.match(/(?:^|\b)X\s*(-?\d+(?:\.\d+)?)\s*(?:·|\||,)?\s*Z\s*(-?\d+(?:\.\d+)?)/i);
  if(!match)return null;
  const x=Number(match[1]),z=Number(match[2]);
  return Number.isFinite(x)&&Number.isFinite(z)?{x,z}:null;
}
