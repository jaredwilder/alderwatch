import {IRONWARD_CROSSING,requestAreaTravel} from './realm-save';
import {ironwardRouteArrival,isNearIronwardCrossing,parseFarMarchHudPosition} from './far-march-realm-gates';
import './realm-travel.css';

let travelling=false;

function gateState(){
  const hud=document.querySelector<HTMLElement>('#ui');
  const place=hud?.querySelector('.location span')?.textContent??'';
  const routeText=hud?.querySelector('.minimap-route')?.textContent??'';
  const position=parseFarMarchHudPosition(place);
  const playing=!!hud?.querySelector('.hotbar');
  const arrivedByRoute=ironwardRouteArrival(place,routeText);
  const arrivedByCoordinates=position?isNearIronwardCrossing(position.x,position.z):false;
  return {hud,eligible:playing&&(arrivedByRoute||arrivedByCoordinates),place,routeText};
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
  let prompt=document.querySelector<HTMLButtonElement>('#realm-road-forward');
  if(!eligible){prompt?.remove();return;}
  if(!prompt&&hud){
    prompt=document.createElement('button');
    prompt.id='realm-road-forward';
    prompt.className='realm-road-button realm-road-forward';
    prompt.setAttribute('aria-label','Enter Ironward Crossing');
    prompt.innerHTML='<small>IRONWARD CROSSING</small><strong>Press E to travel</strong><span>The Eastern Road continues beyond this hill</span>';
    prompt.onclick=beginTravel;
    hud.append(prompt);
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
