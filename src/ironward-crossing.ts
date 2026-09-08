import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Assets} from './assets';
import {Character} from './character';
import {Input} from './input';
import {LocalAuthority,loadWorld,saveWorld,tickVitals} from './state';
import {stats} from './definitions';
import {ACTION_CAMERA} from './follow-camera';
import {FAR_MARCH,IRONWARD_CROSSING,rememberCurrentArea,requestAreaTravel} from './realm-save';
import './style.css';
import './loading-experience.css';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML='<div id="loading"><div class="sigil">A</div><h1>IRONWARD CROSSING</h1><p id="load-status">Climbing beyond the old March…</p><div class="load-line"></div></div><div id="ui"></div>';
const ui=document.querySelector<HTMLDivElement>('#ui')!;

const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.domElement.id='world';app.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#9db9c7');scene.fog=new T.FogExp2('#9aaeb2',.009);
const camera=new T.PerspectiveCamera(ACTION_CAMERA.fov,innerWidth/innerHeight,.08,500);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.28;pmrem.dispose();
scene.add(new T.HemisphereLight('#d6e6ef','#4d493d',1.05));
const sun=new T.DirectionalLight('#ffe1b3',3.0);sun.position.set(-32,48,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:120});sun.shadow.camera.updateProjectionMatrix();scene.add(sun,sun.target);
const worldRoot=new T.Group();scene.add(worldRoot);
const assets=new Assets();const input=new Input(renderer.domElement);
const authority=new LocalAuthority(loadWorld()!);
const player=Object.values(authority.state.players)[0];
if(!player)location.assign('/');
player.areaId=IRONWARD_CROSSING;
let physics:RAPIER.World,character:Character;
let yaw=0,pitch=ACTION_CAMERA.pitch,distance=ACTION_CAMERA.distance,last=0,acc=0,elapsed=0,autosave=0,frames=0,fps=0,fpsClock=0;
const gatePosition=new T.Vector3(0,0,-12.5);

function addAuthored(name:string,position:[number,number,number],yaw=0,scale=1){const source=assets.medieval[name];if(!source)return;const object=source.clone(true);object.position.fromArray(position);object.rotation.y=yaw;object.scale.setScalar(scale);worldRoot.add(object);return object;}
function buildCrossing(){
 physics=new RAPIER.World({x:0,y:-9.81,z:0});
 const soil=assets.textures.soil.clone();soil.needsUpdate=true;soil.repeat.set(16,16);
 const ground=new T.Mesh(new T.PlaneGeometry(64,64),new T.MeshStandardMaterial({map:soil,color:'#b0a57a',roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.name='ironward-crossing-ground';worldRoot.add(ground);
 const roadTex=assets.textures.stone.clone();roadTex.needsUpdate=true;roadTex.repeat.set(3,16);
 const road=new T.Mesh(new T.PlaneGeometry(7,54),new T.MeshStandardMaterial({map:roadTex,color:'#a6a395',roughness:1}));road.rotation.x=-Math.PI/2;road.position.y=.018;road.receiveShadow=true;worldRoot.add(road);
 physics.createCollider(RAPIER.ColliderDesc.cuboid(32,.12,32).setTranslation(0,-.12,0));
 for(const [x,z,hx,hz] of [[-32,0,.3,32],[32,0,.3,32],[0,-32,32,.3],[0,32,32,.3]] as const)physics.createCollider(RAPIER.ColliderDesc.cuboid(hx,2.5,hz).setTranslation(x,2.5,z));
 const shelter=assets.authoredCampShelter();shelter.position.set(-7,0,1);shelter.rotation.y=.32;worldRoot.add(shelter);
 const gate=assets.authoredFortification();gate.position.copy(gatePosition);gate.rotation.y=Math.PI;gate.scale.setScalar(1.7);worldRoot.add(gate);
 const house=assets.authoredLonghouse();house.position.set(12,0,-2);house.rotation.y=-Math.PI/2;house.scale.setScalar(.8);worldRoot.add(house);
 addAuthored('watchtower',[-13,0,-8],.2,.9);addAuthored('wagon',[7,0,7],-.5,.8);addAuthored('barrel',[-5,0,4],.2,.8);addAuthored('barrel',[-4.1,0,4.4,-.1] as any);
 addAuthored('wood_pile',[8,0,-8],.4,.8);addAuthored('campfire_burning_q',[-7,0,4],0,.9);addAuthored('fence_wood_ext1',[-11,0,7],Math.PI/2,.9);addAuthored('fence_wood_ext2',[11,0,7],-Math.PI/2,.9);
 character=new Character(assets,physics,player,worldRoot);character.getTick=()=>authority.state.tick;character.onActionRequest=action=>authority.dispatch({type:'combat_action',playerId:player.id,action}).ok;character.onImpact=()=>{};
 input.active=true;input.captureCamera=true;
}

function snapshot(){player.position=character.root.position.toArray() as [number,number,number];player.yaw=character.root.rotation.y;rememberCurrentArea(player);}
function save(){snapshot();saveWorld(authority.state);}
function travelBack(){save();requestAreaTravel(FAR_MARCH);input.active=false;showTransition('RETURNING TO THE FAR MARCH','The mountain road falls away behind you…');requestAnimationFrame(()=>requestAnimationFrame(()=>location.reload()));}
function showTransition(title:string,status:string){const el=document.createElement('div');el.className='realm-transition-loader';el.innerHTML='<div class="realm-loader-card"><div class="sigil"><span>A</span></div><small>ALDERWATCH REALM</small><h2></h2><div class="realm-loader-status"></div><div class="realm-loader-track"><i></i></div></div>';el.querySelector('h2')!.textContent=title;el.querySelector<HTMLElement>('.realm-loader-status')!.textContent=status;document.body.append(el);}
function hud(){ui.innerHTML='<div class="compass">N · IRONWARD ROAD</div><div class="location"><small>IRONWARD</small><span>The Crossing</span></div><div class="quest"><small>BEYOND THE MARCH</small><p>The road north is only beginning to open.</p></div><div class="vitals"><div class="health"><i></i><span></span></div><div class="stamina"><i></i></div></div><div class="interaction" hidden></div><div class="controls">WASD Move · Shift Sprint · Space Dodge · Mouse Look · E Travel at the gate</div><output id="performance"></output><button id="return-road" class="realm-road-button">Return along the old road</button>';ui.querySelector<HTMLButtonElement>('#return-road')!.onclick=travelBack;}
function updateHud(){const max=stats(player),health=ui.querySelector<HTMLElement>('.health i'),stamina=ui.querySelector<HTMLElement>('.stamina i'),label=ui.querySelector<HTMLElement>('.health span')!;if(health)health.style.width=player.health/max.health*100+'%';if(stamina)stamina.style.width=player.stamina/max.stamina*100+'%';label.textContent=Math.ceil(player.health)+' / '+max.health;const d=character.root.position.distanceTo(gatePosition),prompt=ui.querySelector<HTMLElement>('.interaction')!;prompt.hidden=d>3.4;prompt.textContent='E · Return through the Ironward gate to the Far March';ui.querySelector<HTMLElement>('#performance')!.textContent=`${fps} FPS · ${renderer.info.render.calls} draws`;}
function frame(now:number){const frameDt=last?(now-last)/1000:.016,dt=Math.min(frameDt,.05);last=now;elapsed+=dt;frames++;fpsClock+=frameDt;if(fpsClock>1){fps=Math.round(frames/fpsClock);frames=0;fpsClock=0;}
 if(input.take('Escape'))travelBack();if(input.take('KeyE')&&character.root.position.distanceTo(gatePosition)<3.4)travelBack();
 yaw+=input.dx*.003;pitch=T.MathUtils.clamp(pitch+input.dy*.002,ACTION_CAMERA.minPitch,ACTION_CAMERA.maxPitch);distance=T.MathUtils.clamp(distance+input.wheel*.85,ACTION_CAMERA.minDistance,ACTION_CAMERA.maxDistance);
 acc+=dt;while(acc>=1/60){character.preStep(1/60,input,yaw,true);physics.step();character.postStep(1/60);tickVitals(authority.state,1/60);authority.state.tick++;acc-=1/60;}
 autosave+=dt;if(autosave>10){save();autosave=0;}updateHud();
 const p=character.root.position,aim=p.clone().add(new T.Vector3(0,1.25,0));camera.position.copy(p).add(new T.Vector3(-Math.sin(yaw)*Math.cos(pitch)*distance,1.35+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance));const rayDir=camera.position.clone().sub(aim),rayLength=rayDir.length();rayDir.normalize();const hit=physics.castRay(new RAPIER.Ray(aim,rayDir),rayLength,true,undefined,undefined,character.collider,character.body);if(hit&&hit.timeOfImpact<rayLength)camera.position.copy(aim).addScaledVector(rayDir,Math.max(.7,hit.timeOfImpact-.25));camera.lookAt(aim);sun.target.position.copy(p);sun.target.updateMatrixWorld();renderer.render(scene,camera);input.endFrame();requestAnimationFrame(frame);}

async function init(){await RAPIER.init();await assets.load(message=>document.querySelector('#load-status')!.textContent=message);buildCrossing();hud();document.querySelector('#loading')!.remove();saveWorld(authority.state);requestAnimationFrame(frame);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener('pagehide',()=>{if(character)save();});
init().catch(error=>{console.error(error);document.querySelector('#load-status')!.textContent='Ironward could not load: '+(error.message??error);});
