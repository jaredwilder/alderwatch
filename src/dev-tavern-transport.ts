const PORCH_X=-9.3;
const PORCH_Z=-27.15;
const PORCH_YAW=Math.PI;

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
 button.title='Jump straight to The Tipsy Alder porch in Alderbrook';
 button.onclick=jump;
 const heal=grid.querySelector('[data-cmd="heal"]');
 if(heal)grid.insertBefore(button,heal);else grid.append(button);
 return true;
}

if(typeof window!=='undefined')installTipsyAlderDevTransport();
