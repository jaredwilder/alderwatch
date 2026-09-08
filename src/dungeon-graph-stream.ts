export interface DungeonRoomNode{ id:string; neighbors:readonly string[] }
export interface DungeonRoomHandle<T>{id:string;value:T}
export interface DungeonGraphWindowOptions<T>{
  graph:Record<string,DungeonRoomNode>;
  budget:number;
  create:(id:string)=>T;
  dispose:(handle:DungeonRoomHandle<T>)=>void;
}

/**
 * Materializes a deterministic BFS neighborhood around the current room, hard-capped
 * by budget. Runtime cost depends on the local cut, not total dungeon size.
 */
export class DungeonGraphWindow<T>{
  readonly active=new Map<string,DungeonRoomHandle<T>>();
  constructor(readonly options:DungeonGraphWindowOptions<T>){
    if(!Number.isInteger(options.budget)||options.budget<1)throw new Error('Dungeon graph budget must be a positive integer');
  }
  wanted(center:string){
    if(!this.options.graph[center])throw new Error('Unknown dungeon room '+center);
    const queue=[center],seen=new Set<string>([center]),out:string[]=[];
    while(queue.length&&out.length<this.options.budget){const id=queue.shift()!;out.push(id);const neighbors=[...this.options.graph[id].neighbors].sort();for(const next of neighbors)if(this.options.graph[next]&&!seen.has(next)){seen.add(next);queue.push(next);}}
    return out;
  }
  update(center:string){
    const wanted=this.wanted(center),keep=new Set(wanted);
    for(const id of wanted)if(!this.active.has(id))this.active.set(id,{id,value:this.options.create(id)});
    for(const [id,handle] of [...this.active])if(!keep.has(id)){this.options.dispose(handle);this.active.delete(id);}
    return wanted;
  }
  dispose(){for(const handle of this.active.values())this.options.dispose(handle);this.active.clear();}
  get maxActive(){return this.options.budget;}
}
