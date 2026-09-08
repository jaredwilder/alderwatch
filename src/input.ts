import {Vector2} from 'three';
export class Input {
 pointer=new Vector2(0,-.25);
 keys=new Set<string>();pressed=new Set<string>();primary=false;secondary=false;dx=0;dy=0;wheel=0;
 private enabled=false;private capture=true;private requesting=false;private wasLocked=false;private lockFailed=false;
 get active(){return this.enabled;}
 set active(value:boolean){this.enabled=value;if(value)this.lockCamera();else{this.clear();this.releaseCamera();this.capture=true;this.lockFailed=false;}}
 get captureCamera(){return this.capture;}
 set captureCamera(value:boolean){this.capture=value;if(!value)this.releaseCamera();else if(this.enabled)this.lockCamera();}
 constructor(public canvas:HTMLCanvasElement){
  window.addEventListener('keydown',e=>{if((e.target as HTMLElement)?.matches('input,select,textarea'))return;if(['Tab','Space','KeyB','KeyC'].includes(e.code))e.preventDefault();if(!this.keys.has(e.code))this.pressed.add(e.code);this.keys.add(e.code);});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));
  window.addEventListener('blur',()=>{this.clear();this.releaseCamera();});
  // Full-screen navigation surfaces need a real cursor. Marking capture false before
  // releasing pointer lock distinguishes this intentional UI transition from browser Escape.
  window.addEventListener('alderwatch:map-cursor',((event:Event)=>{const open=!!(event as CustomEvent<{open:boolean}>).detail?.open;if(open){this.clear();this.captureCamera=false;}else if(this.active)this.captureCamera=true;}) as EventListener);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('mousedown',e=>{
   if(!this.active)return;
   // Recapturing the camera must not also strike an NPC or place a building.
   if(this.capture&&!this.lockFailed&&document.pointerLockElement!==canvas&&typeof canvas.requestPointerLock==='function'){this.lockCamera();return;}
   if(e.button===0){this.primary=true;this.pressed.add('Attack');}
   if(e.button===2)this.secondary=true;
  });
  window.addEventListener('mouseup',e=>{if(e.button===0)this.primary=false;if(e.button===2)this.secondary=false;});
  window.addEventListener('mousemove',e=>{
   if(!this.active)return;
   const locked=document.pointerLockElement===canvas;
   if(locked)this.pointer.set(0,0);
   else if(e.target===canvas){const rect=canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);}
   // If an embedded browser declines capture, hovering the world still gives free look.
   if(locked||e.target===canvas){this.dx+=e.movementX;this.dy+=e.movementY;}
  });
  document.addEventListener('pointerlockchange',()=>{
   const locked=document.pointerLockElement===canvas;
   if(locked){if(!this.active||!this.capture){this.releaseCamera();return;}this.pointer.set(0,0);this.dx=this.dy=0;}
   if(this.wasLocked&&!locked){this.clear();if(this.active&&this.capture)this.pressed.add('Escape');}
   this.wasLocked=locked;
  });
  canvas.addEventListener('wheel',e=>{if(this.active)this.wheel+=Math.sign(e.deltaY);},{passive:true});
 }
 private lockCamera(){
  if(!this.active||!this.capture||this.lockFailed||this.requesting||document.pointerLockElement===this.canvas||!this.canvas.requestPointerLock)return;
  this.requesting=true;
  try{Promise.resolve(this.canvas.requestPointerLock()).catch(()=>{this.lockFailed=true;}).finally(()=>{this.requesting=false;if(this.active&&this.capture&&!this.lockFailed&&document.pointerLockElement!==this.canvas)this.lockCamera();});}catch{this.requesting=false;this.lockFailed=true;}
 }
 private releaseCamera(){if(document.pointerLockElement===this.canvas)document.exitPointerLock();}
 take(key:string){const v=this.pressed.has(key);this.pressed.delete(key);return v;}
 endFrame(){this.dx=this.dy=this.wheel=0;}
 clear(){this.keys.clear();this.pressed.clear();this.primary=this.secondary=false;this.endFrame();}
}
