import type {Assets} from './assets';
import type {WorldState} from './state';
import {renderCharacterPaperdoll} from './character-paperdoll';

let assets:Assets|undefined,state:WorldState|undefined;
const installed=Symbol.for('alderwatch.paperdoll.v1');

function install(){const g=globalThis as any;if(g[installed])return;g[installed]=true;
 // Capture the same Assets/WorldState used by the live realm without touching main.ts.
 import('./landscape').then(({Landscape})=>{const proto=Landscape.prototype as any;if(proto.__awPaperdoll)return;const terrain=proto.terrain;proto.terrain=function(...args:any[]){assets=this.assets;state=this.state;return terrain.apply(this,args);};proto.__awPaperdoll=true;});
 const decorate=()=>{const panel=document.querySelector<HTMLElement>('.fun-profile');if(!panel||panel.dataset.paperdoll==='1'||!assets||!state)return;const player=Object.values(state.players)[0];if(!player)return;const holder=document.createElement('div');holder.className='profile-paperdoll-wrap';const label=document.createElement('div');label.className='profile-paperdoll-label';label.textContent='PAPER DOLL · EQUIPPED NOW';holder.append(label);const rendered=renderCharacterPaperdoll(assets,player);holder.append(rendered.canvas);panel.insertBefore(holder,panel.querySelector('.profile-summary'));panel.dataset.paperdoll='1';const close=panel.querySelector<HTMLButtonElement>('.fun-close');if(close){const prior=close.onclick;close.onclick=e=>{rendered.dispose();prior?.call(close,e as any);};}};
 const observer=new MutationObserver(()=>queueMicrotask(decorate));observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('keydown',e=>{if(e.code==='KeyP')setTimeout(decorate,0);},true);}

if(typeof window!=='undefined'&&typeof document!=='undefined')install();
