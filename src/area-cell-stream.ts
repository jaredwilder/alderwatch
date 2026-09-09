export interface CellCoord {x:number;z:number}
export interface CellHandle<T> {coord:CellCoord;value:T}

export interface CellWindowOptions<T> {
  cellSize:number;
  radius:number;
  create:(coord:CellCoord)=>T;
  dispose:(handle:CellHandle<T>)=>void;
  /**
   * Optional bounded handoff reserve. By default CellWindow warms one incoming
   * strip (2r+1 cells). Set this to 0 for callers that require no reserve.
   */
  prefetchBudget?:number;
  /** Distance from the current cell centre, expressed as a fraction of cell size. Boundary is 0.5. */
  prefetchThreshold?:number;
  /** Maximum warm cells constructed by one update call. */
  prefetchPerUpdate?:number;
}

const key=(x:number,z:number)=>`${x},${z}`;

/**
 * Keeps only a square neighborhood of streaming cells materialized around a point.
 * Total active runtime is bounded by (2r+1)^2 regardless of total area size.
 *
 * Cells are authored around coord*cellSize, so coord 0 spans roughly
 * [-cellSize/2,+cellSize/2]. Select the nearest cell centre; floor(x/cellSize)
 * would move the active window half a cell too early and cause visible popping at
 * the world origin / every centre line.
 *
 * The default handoff reserve is one incoming strip. It is deliberately separate
 * from `active`: the logical/interaction bubble remains the same size while the
 * next strip is constructed over ordinary frames instead of all at once on the
 * seam. Runtime residency therefore remains bounded at active + one strip.
 */
export class CellWindow<T>{
  readonly active=new Map<string,CellHandle<T>>();
  readonly warm=new Map<string,CellHandle<T>>();
  private center?:CellCoord;
  private lastPoint?:{x:number;z:number};
  private warmDirection?:{axis:'x'|'z';sign:number};

  constructor(readonly options:CellWindowOptions<T>){
    if(!(options.cellSize>0))throw new Error('cellSize must be positive');
    if(!Number.isInteger(options.radius)||options.radius<0)throw new Error('radius must be a non-negative integer');
    if(options.prefetchBudget!==undefined&&(!Number.isInteger(options.prefetchBudget)||options.prefetchBudget<0))throw new Error('prefetchBudget must be a non-negative integer');
    const threshold=options.prefetchThreshold??.24;
    if(!(threshold>=0&&threshold<.5))throw new Error('prefetchThreshold must be in [0, 0.5)');
    const perUpdate=options.prefetchPerUpdate??1;
    if(!Number.isInteger(perUpdate)||perUpdate<1)throw new Error('prefetchPerUpdate must be a positive integer');
  }

  private cellIndex(value:number){
    const rounded=Math.round(value/this.options.cellSize);
    return rounded===0?0:rounded;
  }

  centerFor(x:number,z:number):CellCoord{
    return {x:this.cellIndex(x),z:this.cellIndex(z)};
  }

  private clearWarm(){
    for(const handle of this.warm.values())this.options.dispose(handle);
    this.warm.clear();
    this.warmDirection=undefined;
  }

  private stageAhead(x:number,z:number,center:CellCoord,dx:number,dz:number){
    const budget=this.maxWarm;
    if(!budget)return;
    const epsilon=1e-4;
    if(Math.abs(dx)<epsilon&&Math.abs(dz)<epsilon)return;

    const axis:'x'|'z'=Math.abs(dx)>=Math.abs(dz)?'x':'z';
    const delta=axis==='x'?dx:dz;
    const sign=delta>=0?1:-1;
    if(this.warmDirection&&(this.warmDirection.axis!==axis||this.warmDirection.sign!==sign))this.clearWarm();

    const local=axis==='x'
      ?(x-center.x*this.options.cellSize)/this.options.cellSize
      :(z-center.z*this.options.cellSize)/this.options.cellSize;
    if(local*sign<(this.options.prefetchThreshold??.24))return;

    this.warmDirection={axis,sign};
    const candidates:CellCoord[]=[];
    if(axis==='x'){
      const leadX=center.x+sign*(this.options.radius+1);
      for(let offset=-this.options.radius;offset<=this.options.radius;offset++)candidates.push({x:leadX,z:center.z+offset});
    }else{
      const leadZ=center.z+sign*(this.options.radius+1);
      for(let offset=-this.options.radius;offset<=this.options.radius;offset++)candidates.push({x:center.x+offset,z:leadZ});
    }
    candidates.sort((a,b)=>{
      const ax=a.x*this.options.cellSize-x,az=a.z*this.options.cellSize-z;
      const bx=b.x*this.options.cellSize-x,bz=b.z*this.options.cellSize-z;
      return ax*ax+az*az-(bx*bx+bz*bz);
    });
    const target=new Set(candidates.map(coord=>key(coord.x,coord.z)));
    for(const [id,handle] of [...this.warm])if(!target.has(id)){this.options.dispose(handle);this.warm.delete(id);}

    let remaining=Math.min(this.options.prefetchPerUpdate??1,budget-this.warm.size);
    for(const coord of candidates){
      if(remaining<=0)break;
      const id=key(coord.x,coord.z);
      if(this.active.has(id)||this.warm.has(id))continue;
      this.warm.set(id,{coord,value:this.options.create(coord)});
      remaining--;
    }
  }

  update(x:number,z:number){
    const center=this.centerFor(x,z),wanted=new Set<string>();
    const centerChanged=!!this.center&&(this.center.x!==center.x||this.center.z!==center.z);

    for(let dz=-this.options.radius;dz<=this.options.radius;dz++)for(let dx=-this.options.radius;dx<=this.options.radius;dx++){
      const coord={x:center.x+dx,z:center.z+dz},id=key(coord.x,coord.z);wanted.add(id);
      if(this.active.has(id))continue;
      const warmed=this.warm.get(id);
      if(warmed){this.warm.delete(id);this.active.set(id,warmed);}
      else this.active.set(id,{coord,value:this.options.create(coord)});
    }
    for(const [id,handle] of [...this.active])if(!wanted.has(id)){this.options.dispose(handle);this.active.delete(id);}

    if(centerChanged&&this.warm.size)this.clearWarm();
    this.center=center;
    const previous=this.lastPoint,dx=previous?x-previous.x:0,dz=previous?z-previous.z:0;
    this.lastPoint={x,z};
    this.stageAhead(x,z,center,dx,dz);
    return center;
  }

  dispose(){
    for(const handle of this.active.values())this.options.dispose(handle);
    for(const handle of this.warm.values())this.options.dispose(handle);
    this.active.clear();this.warm.clear();this.center=undefined;this.lastPoint=undefined;this.warmDirection=undefined;
  }

  get maxActive(){const width=this.options.radius*2+1;return width*width;}
  get maxWarm(){return this.options.prefetchBudget??(this.options.radius*2+1);}
  get residentSize(){return this.active.size+this.warm.size;}
  get maxResident(){return this.maxActive+this.maxWarm;}
}
