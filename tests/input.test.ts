import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input';

class Surface {
 listeners=new Map<string,((e:any)=>void)[]>();
 addEventListener(name:string,fn:(e:any)=>void){this.listeners.set(name,[...(this.listeners.get(name)??[]),fn]);}
 fire(name:string,e:any={}){for(const fn of this.listeners.get(name)??[])fn(e);}
}
function harness(t:any,deny=false){
 const priorWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),priorDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const win=new Surface(),doc=Object.assign(new Surface(),{pointerLockElement:null as any,exitPointerLock:()=>{doc.pointerLockElement=null;doc.fire('pointerlockchange');}});
 const canvas=Object.assign(new Surface(),{getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),requestPointerLock:()=>{if(deny)return Promise.reject(new Error('Browser denied capture'));doc.pointerLockElement=canvas;doc.fire('pointerlockchange');return Promise.resolve();}});
 Object.defineProperty(globalThis,'window',{configurable:true,value:win});Object.defineProperty(globalThis,'document',{configurable:true,value:doc});
 t.after(()=>{for(const [key,prior] of [['window',priorWindow],['document',priorDocument]] as const){if(prior)Object.defineProperty(globalThis,key,prior);else Reflect.deleteProperty(globalThis,key);}});
 return {win,doc,canvas,input:new Input(canvas as unknown as HTMLCanvasElement),move:(x=12,y=-5,target:any=canvas)=>win.fire('mousemove',{target,clientX:600,clientY:150,movementX:x,movementY:y})};
}
test('ordinary mouse movement controls the captured camera without a held button',t=>{const h=harness(t);h.input.active=true;h.move();assert.equal(h.input.dx,12);assert.equal(h.input.dy,-5);assert.equal(h.input.secondary,false);assert.deepEqual(h.input.pointer.toArray(),[0,0]);});
test('right mouse guards independently of free look',t=>{const h=harness(t);h.input.active=true;h.canvas.fire('mousedown',{button:2});assert.equal(h.input.secondary,true);h.move();assert.equal(h.input.dx,12);assert.equal(h.input.take('Attack'),false);h.win.fire('mouseup',{button:2});assert.equal(h.input.secondary,false);h.move();assert.equal(h.input.dx,24);});
test('opening menus releases capture and clears stale motion and held input',t=>{const h=harness(t);h.input.active=true;h.move();h.input.keys.add('KeyW');h.input.secondary=true;h.input.active=false;h.move();assert.equal(h.doc.pointerLockElement,null);assert.equal(h.input.dx,0);assert.equal(h.input.keys.size,0);assert.equal(h.input.secondary,false);assert.equal(h.input.take('Escape'),false);});
test('browser Escape release requests the game menu and cannot leave guard held',t=>{const h=harness(t);h.input.active=true;h.input.secondary=true;h.doc.exitPointerLock();assert.equal(h.input.take('Escape'),true);assert.equal(h.input.secondary,false);});
test('world map intentionally releases capture without synthesizing Escape, then recaptures after an in-flight lock settles',async t=>{const h=harness(t);h.input.active=true;h.input.keys.add('KeyW');h.input.secondary=true;h.win.fire('alderwatch:map-cursor',{detail:{open:true}});assert.equal(h.doc.pointerLockElement,null);assert.equal(h.input.captureCamera,false);assert.equal(h.input.keys.size,0);assert.equal(h.input.secondary,false);assert.equal(h.input.take('Escape'),false);h.win.fire('alderwatch:map-cursor',{detail:{open:false}});assert.equal(h.input.captureCamera,true);await Promise.resolve();await Promise.resolve();assert.equal(h.doc.pointerLockElement,h.canvas);assert.equal(h.input.take('Escape'),false);});
test('build mode keeps a usable cursor and UI hover never rotates the camera',t=>{const h=harness(t);h.input.active=true;h.input.captureCamera=false;assert.equal(h.doc.pointerLockElement,null);assert.equal(h.input.take('Escape'),false);h.move();assert.deepEqual(h.input.pointer.toArray(),[.5,.5]);h.input.endFrame();h.move(100,100,{});assert.equal(h.input.dx,0);h.canvas.fire('mousedown',{button:0});assert.equal(h.input.take('Attack'),true);});
test('denied capture still allows hover free-look and normal attacks',async t=>{const h=harness(t,true);h.input.active=true;await Promise.resolve();await Promise.resolve();h.move();assert.equal(h.input.dx,12);h.canvas.fire('mousedown',{button:0});assert.equal(h.input.take('Attack'),true);});
test('the initial recapture click never also attacks',async t=>{const h=harness(t);h.input.active=true;await Promise.resolve();await Promise.resolve();h.doc.exitPointerLock();h.input.clear();h.canvas.fire('mousedown',{button:0});assert.equal(h.doc.pointerLockElement,h.canvas);assert.equal(h.input.take('Attack'),false);h.canvas.fire('mousedown',{button:0});assert.equal(h.input.take('Attack'),true);});
