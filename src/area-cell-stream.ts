export interface CellCoord {x:number;z:number}
export interface CellHandle<T> {coord:CellCoord;value:T}

export interface CellWindowOptions<T> {
  cellSize:number;
  radius:number;
  create:(coord:CellCoord)=>T;
  dispose:(handle:CellHandle<T>)=>void;
}

const key=(x:number,z:number)=>`${x},${z}`;

/**
 * Keeps only a square neighborhood of streaming cells materialized around a point.
 * Total active runtime is bounded by (2r+1)^2 regardless of total area size.
 */
export class CellWindow<T>{
  readonly active=new Map<string,CellHandle<T>>();
  constructor(readonly options:CellWindowOptions<T>){
    if(!(options.cellSize>0))throw new Error('cellSize must be positive');
    if(!Number.isInteger(options.radius)||options.radius<0)throw new Error('radius must be a non-negative integer');
  }
  centerFor(x:number,z:number):CellCoord{
    return {x:Math.floor(x/this.options.cellSize),z:Math.floor(z/this.options.cellSize)};
  }
  update(x:number,z:number){
    const center=this.centerFor(x,z),wanted=new Set<string>();
    for(let dz=-this.options.radius;dz<=this.options.radius;dz++)for(let dx=-this.options.radius;dx<=this.options.radius;dx++){
      const coord={x:center.x+dx,z:center.z+dz},id=key(coord.x,coord.z);wanted.add(id);
      if(!this.active.has(id))this.active.set(id,{coord,value:this.options.create(coord)});
    }
    for(const [id,handle] of [...this.active])if(!wanted.has(id)){this.options.dispose(handle);this.active.delete(id);}
    return center;
  }
  dispose(){for(const handle of this.active.values())this.options.dispose(handle);this.active.clear();}
  get maxActive(){const width=this.options.radius*2+1;return width*width;}
}
