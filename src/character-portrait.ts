import * as T from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import type {Character} from './character';

const SIZE={w:220,h:300};

/** Render the survivor as a UO-style paper-doll portrait without moving the live world camera. */
export function characterPortrait(renderer:T.WebGLRenderer,character:Character){
 const target=new T.WebGLRenderTarget(SIZE.w,SIZE.h,{format:T.RGBAFormat,type:T.UnsignedByteType,depthBuffer:true});
 const scene=new T.Scene();scene.background=new T.Color('#101713');
 const model=clone(character.root);model.position.set(0,0,0);model.rotation.set(0,Math.PI,0);model.scale.setScalar(1);scene.add(model);
 model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=new T.Vector3(),center=new T.Vector3();box.getSize(size);box.getCenter(center);model.position.x-=center.x;model.position.z-=center.z;model.position.y-=box.min.y;model.updateMatrixWorld(true);
 const camera=new T.PerspectiveCamera(28,SIZE.w/SIZE.h,.05,30),height=Math.max(1.8,size.y),distance=Math.max(4.2,height*2.05);camera.position.set(0,height*.56,distance);camera.lookAt(0,height*.52,0);
 scene.add(new T.HemisphereLight('#f2dfc0','#253226',2.0));const key=new T.DirectionalLight('#ffe2b9',2.8);key.position.set(3,5,4);scene.add(key);const rim=new T.DirectionalLight('#8da9c4',1.1);rim.position.set(-4,3,-2);scene.add(rim);
 const previousTarget=renderer.getRenderTarget(),previousViewport=renderer.getViewport(new T.Vector4()),previousScissor=renderer.getScissor(new T.Vector4()),previousScissorTest=renderer.getScissorTest(),previousClear=renderer.getClearColor(new T.Color()),previousAlpha=renderer.getClearAlpha();
 renderer.setRenderTarget(target);renderer.setViewport(0,0,SIZE.w,SIZE.h);renderer.setScissorTest(false);renderer.setClearColor('#101713',1);renderer.clear(true,true,true);renderer.render(scene,camera);
 const pixels=new Uint8Array(SIZE.w*SIZE.h*4);renderer.readRenderTargetPixels(target,0,0,SIZE.w,SIZE.h,pixels);renderer.setRenderTarget(previousTarget);renderer.setViewport(previousViewport);renderer.setScissor(previousScissor);renderer.setScissorTest(previousScissorTest);renderer.setClearColor(previousClear,previousAlpha);target.dispose();
 const canvas=document.createElement('canvas');canvas.className='profile-paperdoll';canvas.width=SIZE.w;canvas.height=SIZE.h;const ctx=canvas.getContext('2d')!,image=ctx.createImageData(SIZE.w,SIZE.h);for(let y=0;y<SIZE.h;y++){const src=(SIZE.h-1-y)*SIZE.w*4,dst=y*SIZE.w*4;image.data.set(pixels.subarray(src,src+SIZE.w*4),dst);}ctx.putImageData(image,0,0);return canvas;
}
