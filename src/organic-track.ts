import * as T from 'three';

export interface TrackPoint {x:number;z:number}

function hash32(text:string){let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;return h>>>0;}
function noise(seed:string,index:number,channel:string){return (hash32(`${seed}:${index}:${channel}`)/0xffffffff)*2-1;}

/**
 * One-draw, deterministic road/track strip with deliberately imperfect edges.
 * Geometry cost is O(length / step), not world area. Width and centre drift are
 * bounded so roads stay traversable while losing the rectangular debug-ribbon look.
 */
export function makeOrganicTrackGeometry(points:readonly TrackPoint[],width:number,seed:string,step=5){
 if(points.length<2)throw new Error('organic track requires at least two points');
 if(!(width>0&&step>0))throw new Error('organic track width and step must be positive');
 const samples:{x:number;z:number;along:number}[]=[];let along=0;
 for(let segment=1;segment<points.length;segment++){
  const a=points[segment-1],b=points[segment],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),count=Math.max(1,Math.ceil(length/step));
  for(let i=0;i<=count;i++){
   if(segment>1&&i===0)continue;
   const t=i/count;samples.push({x:a.x+dx*t,z:a.z+dz*t,along:along+length*t});
  }
  along+=length;
 }
 const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[],total=Math.max(along,1e-6);
 for(let i=0;i<samples.length;i++){
  const here=samples[i],prev=samples[Math.max(0,i-1)],next=samples[Math.min(samples.length-1,i+1)],tx=next.x-prev.x,tz=next.z-prev.z,tl=Math.max(1e-6,Math.hypot(tx,tz)),nx=-tz/tl,nz=tx/tl;
  const end=i===0||i===samples.length-1,centreDrift=end?0:noise(seed,i,'centre')*Math.min(.32,width*.075),edgeNoise=end?0:noise(seed,i,'width')*.13;
  const half=width*.5*(1+edgeNoise),cx=here.x+nx*centreDrift,cz=here.z+nz*centreDrift;
  positions.push(cx+nx*half,0,cz+nz*half,cx-nx*half,0,cz-nz*half);
  normals.push(0,1,0,0,1,0);uvs.push(0,here.along/total,1,here.along/total);
  if(i){const j=(i-1)*2;indices.push(j,j+2,j+1,j+2,j+3,j+1);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeBoundingSphere();geometry.name=`AW Organic Track ${seed}`;return geometry;
}

/** Low-cost irregular semantic ground patch for yards, fire courts and work zones. */
export function makeIrregularPatchGeometry(radiusX:number,radiusZ:number,seed:string,segments=18){
 if(!(radiusX>0&&radiusZ>0))throw new Error('patch radii must be positive');
 const positions=[0,0,0],normals=[0,1,0],uvs=[.5,.5],indices:number[]=[];
 for(let i=0;i<=segments;i++){
  const angle=i/segments*Math.PI*2,edge=i===segments?noise(seed,0,'edge'):noise(seed,i,'edge'),r=.88+edge*.10,x=Math.cos(angle)*radiusX*r,z=Math.sin(angle)*radiusZ*r;
  positions.push(x,0,z);normals.push(0,1,0);uvs.push(.5+x/(radiusX*2.2),.5+z/(radiusZ*2.2));
 }
 for(let i=1;i<=segments;i++)indices.push(0,i,i+1);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeBoundingSphere();geometry.name=`AW Irregular Patch ${seed}`;return geometry;
}
