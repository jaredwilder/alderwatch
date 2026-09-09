import {IRONWARD_CROSSING,requestAreaTravel} from './realm-save';
import {isNearIronwardCrossing,parseFarMarchHudPosition} from './far-march-realm-gates';
import './realm-travel.css';

let travelling=false;

function gateState(){
  const hud=document.querySelector<HTMLElement>('#ui');
  const place=hud?.querySelector('.location span')?.textContent??'';
  const position=parseFarMarchHudPosition(place);
  const playing=!!hud?.querySelector('.hotbar');
  // The map's Eastern Road pin is a real world-space gate at X350 Z35.
  // Keep the old region fallback only for legacy HUD layouts that do not expose coordinates.
  const eligible=playing&&(position?isNearIronwardCrossing(position.x,position.z):place.includes('Ironward Heights'));
  return {hud,eligible};
}

function beginTravel(){
  if(travelling)return;
  travelling=true;
  requestAreaTravel(IRONWARD_CROSSING);
  const el=document.createElement('div');
  el.className='realm-transition-loader';
  el.innerHTML='<div class="realm-loader-card"><div class="sigil"><span>A</span></div><small>THE IRONWARD ROAD</small><h2>LEAVING THE FAR MARCH</h2><div class="realm-loader-status">Following the mountain road beyond the March…</div><div class="realm-loader-track"><i></i></div></div>';
  document.body.append(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>location.reload()));
}

function update(){
  const {hud,eligible}=gateState();
  let button=document.querySelector<HTMLButtonElement>('#realm-road-forward');
  if(!eligible){button?.remove();return;}
  if(!button&&hud){
    button=document.createElement('button');
    button.id='realm-road-forward';
    button.className='realm-road-button realm-road-forward';
    button.setAttribute('aria-label','Enter Ironward Crossing');
    button.innerHTML='<small>EASTERN ROAD · CROSSING GATE</small><strong>E · Enter Ironward Crossing</strong><span>The map route continues beyond this hill</span>';
    button.onclick=beginTravel;
    hud.append(button);
  }
}

window.addEventListener('keydown',event=>{
  if(event.code!=='KeyE'||event.repeat||travelling)return;
  if(!gateState().eligible)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  beginTravel();
},true);

const observer=new MutationObserver(update);
observer.observe(document.body,{subtree:true,childList:true,characterData:true});
update();
