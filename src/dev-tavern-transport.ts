// Dev jump is a visual acceptance jump, not merely a coordinate shortcut.
// Spawn just inside the porch affordance and face north-to-south toward the tavern.
// Character yaw 0 faces -Z; the previous PI yaw literally turned the camera away.
const PORCH_X=-9.8;
const PORCH_Z=-25.8;
const PORCH_YAW=0;

type AlderwatchDevAPI={
 enabled?:boolean;
 teleport?:(x:number,z:number,yaw?:number)=>void;
 tavern?:()=>void;
};

export function installTipsyAlderDevTransport(){
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 const dev=(window as typeof window&{AlderwatchDev?:AlderwatchDevAPI}).AlderwatchDev;
 if(!dev?.enabled||typeof dev.teleport!=='function')return false;
 const grid=document.querySelector<HTMLElement>('.aw-dev-panel .aw-dev-grid');
 if(!grid)return false;
 const jump=()=>dev.teleport!(PORCH_X,PORCH_Z,PORCH_YAW);
 dev.tavern=jump;
 if(grid.querySelector('[data-tipsy-alder-jump]'))return true;
 const button=document.createElement('button');
 button.dataset.tipsyAlderJump='1';
 button.textContent='Jump · Tipsy Alder';
 button.title='Jump onto The Tipsy Alder porch, facing the sign and entrance';
 button.onclick=jump;
 const heal=grid.querySelector('[data-cmd="heal"]');
 if(heal)grid.insertBefore(button,heal);else grid.append(button);
 return true;
}

if(typeof window!=='undefined')installTipsyAlderDevTransport();
