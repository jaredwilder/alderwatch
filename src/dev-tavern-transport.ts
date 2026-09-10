import {forceEnterTipsyAlderForDev} from './tavern-bridge';

// Dev jump is a visual acceptance jump, not merely a coordinate shortcut.
// Land in the visible front yard, face the door, and also expose a direct interior
// button so tavern rendering can be tested independently of exterior interaction.
const PORCH_X=-9.8;
const PORCH_Z=-25.8;
const PORCH_YAW=0;

type AlderwatchDevAPI={
 enabled?:boolean;
 teleport?:(x:number,z:number,yaw?:number)=>void;
 tavern?:()=>void;
 tavernEnter?:()=>boolean;
};

export function installTipsyAlderDevTransport(){
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 const dev=(window as typeof window&{AlderwatchDev?:AlderwatchDevAPI}).AlderwatchDev;
 if(!dev?.enabled||typeof dev.teleport!=='function')return false;
 const grid=document.querySelector<HTMLElement>('.aw-dev-panel .aw-dev-grid');
 if(!grid)return false;
 const jump=()=>dev.teleport!(PORCH_X,PORCH_Z,PORCH_YAW);
 const enter=()=>forceEnterTipsyAlderForDev();
 dev.tavern=jump;dev.tavernEnter=enter;
 if(!grid.querySelector('[data-tipsy-alder-jump]')){
  const button=document.createElement('button');
  button.dataset.tipsyAlderJump='1';
  button.textContent='Jump · Tipsy Alder';
  button.title='Jump to The Tipsy Alder front yard, facing the sign and entrance';
  button.onclick=jump;
  const heal=grid.querySelector('[data-cmd="heal"]');
  if(heal)grid.insertBefore(button,heal);else grid.append(button);
 }
 if(!grid.querySelector('[data-tipsy-alder-enter]')){
  const button=document.createElement('button');
  button.dataset.tipsyAlderEnter='1';
  button.textContent='Enter · Tipsy Alder';
  button.title='Enter the real tavern interior immediately for visual acceptance testing';
  button.onclick=()=>{
   const ok=enter();
   if(ok){button.textContent='Inside · Tipsy Alder';return;}
   button.textContent='ENTRY FAILED · click Jump first';
   button.classList.add('aw-dev-danger');
   setTimeout(()=>{button.textContent='Enter · Tipsy Alder';button.classList.remove('aw-dev-danger');},1800);
  };
  const jumpButton=grid.querySelector('[data-tipsy-alder-jump]');
  if(jumpButton?.nextSibling)grid.insertBefore(button,jumpButton.nextSibling);else grid.append(button);
 }
 return true;
}

if(typeof window!=='undefined')installTipsyAlderDevTransport();
