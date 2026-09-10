import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from './assets';
import {height} from './terrain';
import {weatheredCloth} from './character-material';
import type {PlayerState,Vec3} from './state';
import {TAVERN_DRINKS,addIntoxication,intoxicationLabel,resolveAlderbones,sober,tavernCameraSway,tavernMoveScale,type TavernDrinkId} from './tavern-rules';
import './alderbrook-tavern.css';

export const TIPSY_ALDER_NAME='The Tipsy Alder';
const EXTERIOR_X=-9.3,EXTERIOR_Z=-29.4;
const INTERIOR=new T.Vector3(620,20,620);
const SPAWN_LOCAL=new T.Vector3(0,.12,6.15);
const EXIT_LOCAL=new T.Vector3(0,.12,7.15);
const BAR_LOCAL=new T.Vector3(0,0,-5.45);
const BONES_LOCAL=new T.Vector3(-3.7,0,.9);
const PIPE_LOCAL=new T.Vector3(4.65,0,-1.6);

export type TavernInteraction=
 |{kind:'enter'}|{kind:'exit'}|{kind:'bartender'}|{kind:'bones'}|{kind:'pipe'}|{kind:'patron';id:string};

interface TavernActor{id:string;name:string;root:T.Group;mixer:T.AnimationMixer;baseYaw:number;local:T.Vector3;lines:string[];line:number}
const PATRONS=[
 {id:'pell',name:'Pell “Three Mugs” Dorr',at:[-3.3,0,-.8] as const,yaw:.2,hair:'#4a3729',cloth:'#74624c',lines:["Pell squints into his cup. ‘They call me Three Mugs because Four Mugs Dorr died. Respect the lineage.’","‘Rowan says iron remembers every hammer blow. Mine mostly remembers falling off the cart.’","‘If Hallis asks, I was here all night. If my wife asks, I was repairing the north fence.’"]},
 {id:'sella',name:'Sella Reed',at:[3.35,0,1.8] as const,yaw:-2.5,hair:'#35291f',cloth:'#536150',lines:["Sella lowers her voice. ‘Something big has been moving beyond the south road. Big enough that the deer have opinions.’","‘Never play bones with Brinna after midnight. The dice become devoutly loyal to the house.’","‘A warm fire, dry boots, and nobody screaming. Luxury.’"]},
 {id:'jorren',name:'Jorren Pike',at:[-.4,0,3.3] as const,yaw:3.0,hair:'#6a513c',cloth:'#625868',lines:["Jorren raises a cup. ‘To Alderbrook: where every roof leaks in a different place.’","‘Crow’s Regret is not technically poison. Brinna has a parchment saying so.’","‘I came in for one. Then Pell explained arithmetic.’"]},
] as const;

function d2(a:Vec3,b:T.Vector3){return Math.hypot(a[0]-b.x,a[2]-b.z);}
function localWorld(local:T.Vector3){return local.clone().add(INTERIOR);}
function canvasSign(){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=384;const c=canvas.getContext('2d')!;
 c.fillStyle='#2b1c12';c.fillRect(0,0,768,384);c.strokeStyle='#b79854';c.lineWidth=18;c.strokeRect(20,20,728,344);c.strokeStyle='#6d542d';c.lineWidth=5;c.strokeRect(42,42,684,300);
 c.fillStyle='#d8bd75';c.textAlign='center';c.font='700 64px Georgia';c.fillText('THE TIPSY',384,142);c.font='700 86px Georgia';c.fillText('ALDER',384,230);
 c.font='italic 30px Georgia';c.fillStyle='#c7aa68';c.fillText('ALE · BONES · BAD COUNSEL',384,301);
 c.strokeStyle='#d2b76d';c.lineWidth=12;c.beginPath();c.arc(104,188,38,.4,Math.PI*1.7);c.stroke();c.fillStyle='#d2b76d';c.fillRect(78,151,54,73);c.strokeRect(127,167,30,39);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return texture;
}

export class AlderbrookTavern{
 inside=false;intoxication=0;smoke=0;private actors:TavernActor[]=[];private warmLights:T.PointLight[]=[];private bonesWins=0;private bonesLosses=0;private pipePulls=0;
 readonly exteriorReturn:Vec3=[EXTERIOR_X,height(EXTERIOR_X,EXTERIOR_Z)+.04,-27.15];
 readonly exteriorDoor:Vec3=[EXTERIOR_X,height(EXTERIOR_X,EXTERIOR_Z)+.04,EXTERIOR_Z];
 readonly interiorSpawn:Vec3=[INTERIOR.x+SPAWN_LOCAL.x,INTERIOR.y+SPAWN_LOCAL.y,INTERIOR.z+SPAWN_LOCAL.z];
 constructor(private scene:T.Group,private assets:Assets,private physics:RAPIER.World){this.buildStreetIdentity();this.buildInterior();}
 private authored(parent:T.Group,name:string,x:number,y:number,z:number,yaw=0,scale=1){const source=this.assets.medieval[name];if(!source)return;const o=source.clone(true);o.position.set(x,y,z);o.rotation.y=yaw;o.scale.setScalar(scale);parent.add(o);return o;}
 private buildStreetIdentity(){
  const root=new T.Group();root.name='The Tipsy Alder · street identity';root.position.set(EXTERIOR_X,height(EXTERIOR_X,EXTERIOR_Z),EXTERIOR_Z);root.rotation.y=.1;this.scene.add(root);
  const board=new T.Mesh(new RoundedBoxGeometry(2.85,1.25,.12,3,.07),new T.MeshStandardMaterial({map:canvasSign(),roughness:.84,metalness:.03}));board.position.set(0,2.55,.82);board.rotation.y=Math.PI;board.castShadow=true;root.add(board);
  const bracketMat=new T.MeshStandardMaterial({color:'#2d2924',roughness:.52,metalness:.62});const arm=new T.Mesh(new RoundedBoxGeometry(.11,.11,1.0,2,.025),bracketMat);arm.position.set(0,3.13,.34);root.add(arm);
  this.authored(root,'lantern',-1.65,1.7,.45,Math.PI,.7);const light=new T.PointLight('#ffab58',2.6,7,2);light.position.set(-1.65,2.05,.55);root.add(light);
 }
 private timberMaterial(){const map=this.assets.textures.timber;return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.018,color:'#9b805d',roughness:.93,metalness:0});}
 private darkTimberMaterial(){const map=this.assets.textures.timber;return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.02,color:'#55412f',roughness:.95,metalness:0});}
 private box(parent:T.Group,size:[number,number,number],at:[number,number,number],material:T.Material,radius=.04){const m=new T.Mesh(new RoundedBoxGeometry(size[0],size[1],size[2],2,Math.min(radius,Math.min(...size)/3)),material);m.position.set(...at);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 private collider(x:number,y:number,z:number,hx:number,hy:number,hz:number){this.physics.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(INTERIOR.x+x,INTERIOR.y+y,INTERIOR.z+z));}
 private table(parent:T.Group,x:number,z:number,yaw=0,dice=false){const wood=this.timberMaterial(),g=new T.Group();g.position.set(x,0,z);g.rotation.y=yaw;parent.add(g);this.box(g,[2.6,.16,1.35],[0,.91,0],wood,.07);for(const sx of [-1,1])for(const sz of [-.45,.45])this.box(g,[.17,.86,.17],[sx,.43,sz],wood,.045);for(const side of [-1,1]){this.box(g,[2.25,.14,.38],[0,.53,side*1.02],wood,.05);for(const lx of [-.82,.82])this.box(g,[.15,.48,.15],[lx,.24,side*1.02],wood,.035);}this.collider(x,.72,z,1.42,.72,1.45);if(dice){const felt=new T.MeshStandardMaterial({color:'#354c39',roughness:1});this.box(g,[1.4,.025,.72],[0,1.005,0],felt,.02);for(const dx of [-.27,.27]){const die=this.box(g,[.16,.16,.16],[dx,1.12,.02],new T.MeshStandardMaterial({color:'#d7c79e',roughness:.78}),.035);die.rotation.set(.3+dx,.2-dx,.5);}}}
 private counter(parent:T.Group){const wood=this.darkTimberMaterial();this.box(parent,[8.4,.18,1.05],[0,1.08,-5.25],wood,.08);this.box(parent,[8.15,1.0,.18],[0,.53,-5.62],wood,.045);for(const x of [-3.7,-2.2,-.7,.8,2.3,3.8])this.box(parent,[.14,1.0,.8],[x,.53,-5.28],wood,.035);this.collider(0,.65,-5.25,4.3,.65,.58);}
 private actor(id:string,name:string,local:[number,number,number],yaw:number,hair:string,cloth:string,lines:string[]){
  const root=new T.Group(),model=this.assets.human();root.position.copy(localWorld(new T.Vector3(...local)));root.rotation.y=yaw;root.add(model);this.scene.add(root);model.traverse(o=>{if(o.name.includes('Hood'))o.visible=false;if(o.name.includes('Hair_Simple'))o.visible=true;if(!(o instanceof T.Mesh))return;const mats=Array.isArray(o.material)?o.material:[o.material];const dressed=mats.map(old=>{const m=(old as T.MeshStandardMaterial).clone();weatheredCloth(m,this.assets.textures,o.name);if(m.name.includes('Hair'))m.color.set(hair);if(m.name.includes('Ranger'))m.color.set(cloth);return m;});o.material=Array.isArray(o.material)?dressed:dressed[0];});const mixer=new T.AnimationMixer(model),idle=this.assets.survivor.animations.find(a=>a.name==='idle');if(!idle)throw new Error('Tavern actor requires idle animation');mixer.clipAction(idle).play().time=(id.length*.71)%Math.max(.1,idle.duration);const actor={id,name,root,mixer,baseYaw:yaw,local:new T.Vector3(...local),lines,line:0};this.actors.push(actor);return actor;
 }
 private buildInterior(){
  const root=new T.Group();root.name='The Tipsy Alder · interior capsule';root.position.copy(INTERIOR);this.scene.add(root);const timber=this.darkTimberMaterial();
  const floor=this.box(root,[14.4,.18,16.4],[0,-.09,0],this.timberMaterial(),.03);floor.receiveShadow=true;this.collider(0,-.12,0,7.2,.12,8.2);
  const wall=(name:string,x:number,z:number,yaw:number)=>this.authored(root,name,x,0,z,yaw,1);
  for(const x of [-6,-4,-2,0,2,4,6]){wall(x===0?'wall_arch':'wall_plaster_straight',x,-7.85,0);wall(x===0?'wall_plaster_door_flat':'wall_plaster_straight',x,7.85,Math.PI);}
  for(const z of [-6,-4,-2,0,2,4,6]){wall('wall_plaster_straight',-6.95,z,Math.PI/2);wall('wall_plaster_straight',6.95,z,-Math.PI/2);}
  for(const x of [-6.85,6.85])for(const z of [-7.7,7.7])this.authored(root,'support',x,0,z,0,1.05);
  for(const z of [-6,-3,0,3,6])this.box(root,[14.0,.18,.24],[0,3.42,z],timber,.04);
  this.box(root,[14.2,.12,16.2],[0,3.62,0],timber,.03);
  this.collider(0,1.7,-8.0,7.15,1.7,.16);this.collider(-7.05,1.7,0,.16,1.7,8);this.collider(7.05,1.7,0,.16,1.7,8);
  // The front wall leaves a real 2.2 m doorway around x=0; two colliders preserve it.
  this.collider(-4.55,1.7,8.0,2.45,1.7,.16);this.collider(4.55,1.7,8.0,2.45,1.7,.16);
  this.counter(root);this.table(root,-3.7,.9,.08,true);this.table(root,3.45,1.75,-.18);this.table(root,-.2,3.6,.04);
  this.authored(root,'barrel',-4.9,0,-6.45,.2,.8);this.authored(root,'barrel',4.9,0,-6.4,-.1,.82);this.authored(root,'barrel',5.6,0,-5.8,.15,.72);this.authored(root,'crate',-5.55,0,-5.8,.1,.7);this.authored(root,'cauldron',5.1,0,-2.8,.1,.85);this.authored(root,'campfire_burning_q',5.05,0,-3.0,0,.72);this.collider(5.05,.38,-3.0,.72,.38,.72);
  for(const [x,z] of [[-5.55,-1.7],[5.55,3.9],[-5.5,5.8]] as const){this.authored(root,'lantern',x,1.65,z,0,.62);const l=new T.PointLight('#ffa14e',3.2,9,2);l.position.set(x,2.05,z);root.add(l);this.warmLights.push(l);}const hearth=new T.PointLight('#ff7a32',5.2,10,2);hearth.position.set(5.05,1.15,-3);root.add(hearth);this.warmLights.push(hearth);
  // Small mugs share one geometry/material and one draw call.
  const mugGeo=new T.CylinderGeometry(.09,.075,.22,10),mugMat=new T.MeshStandardMaterial({color:'#a98b5f',roughness:.9}),mugs=new T.InstancedMesh(mugGeo,mugMat,10),dummy=new T.Object3D();const mugSpots=[[-3.3,1.08,.7],[-4.0,1.08,1.0],[3.1,1.08,1.55],[3.8,1.08,1.9],[-.5,1.08,3.4],[.2,1.08,3.8],[-2.2,1.22,-5.15],[-1.3,1.22,-5.15],[1.2,1.22,-5.15],[2.1,1.22,-5.15]];mugSpots.forEach((p,i)=>{dummy.position.set(p[0],p[1],p[2]);dummy.rotation.y=i*.73;dummy.updateMatrix();mugs.setMatrixAt(i,dummy.matrix);});mugs.castShadow=true;root.add(mugs);
  this.actor('brinna','Brinna Keggs',[0,0,-6.45],0,'#5b3824','#795843',["‘Drink first. Confess later. I charge less for the first part.’"]);
  for(const p of PATRONS)this.actor(p.id,p.name,[p.at[0],p.at[1],p.at[2]],p.yaw,p.hair,p.cloth,[...p.lines]);
  // Pipe nook: a chair-height crate, bowl, and a tiny smoke plume when used.
  this.authored(root,'crate',4.65,0,-1.6,.25,.72);this.authored(root,'lantern',5.4,1.25,-1.55,0,.52);
 }
 private nearestActor(position:Vec3){let best:{actor:TavernActor;d:number}|undefined;for(const actor of this.actors){const w=localWorld(actor.local),d=d2(position,w);if(d<2.55&&(!best||d<best.d))best={actor,d};}return best?.actor;}
 prompt(position:Vec3){if(!this.inside)return Math.hypot(position[0]-this.exteriorDoor[0],position[2]-this.exteriorDoor[2])<3.15?`E · Enter ${TIPSY_ALDER_NAME}`:'';const exit=localWorld(EXIT_LOCAL);if(d2(position,exit)<1.9)return`E · Leave ${TIPSY_ALDER_NAME}`;const actor=this.nearestActor(position);if(actor?.id==='brinna')return'E · Brinna Keggs · drinks & gossip';if(actor)return`E · Speak to ${actor.name}`;if(d2(position,localWorld(BONES_LOCAL))<2.15)return'E · Play Alderbones';if(d2(position,localWorld(PIPE_LOCAL))<1.9)return'E · House pipe · one pull';return'';}
 interactionAt(position:Vec3):TavernInteraction|undefined{if(!this.inside)return this.prompt(position)?{kind:'enter'}:undefined;const exit=localWorld(EXIT_LOCAL);if(d2(position,exit)<1.9)return{kind:'exit'};const actor=this.nearestActor(position);if(actor?.id==='brinna')return{kind:'bartender'};if(actor)return{kind:'patron',id:actor.id};if(d2(position,localWorld(BONES_LOCAL))<2.15)return{kind:'bones'};if(d2(position,localWorld(PIPE_LOCAL))<1.9)return{kind:'pipe'};}
 enter(){this.inside=true;return{position:[...this.interiorSpawn] as Vec3,yaw:Math.PI};}
 leave(){this.inside=false;return{position:[...this.exteriorReturn] as Vec3,yaw:Math.PI};}
 safeSavePosition(){return this.inside?{position:[...this.exteriorReturn] as Vec3,yaw:Math.PI}:undefined;}
 movementScale(){return tavernMoveScale(this.intoxication);}
 cameraSway(seconds:number){const sway=tavernCameraSway(this.intoxication,seconds),haze=Math.min(1,this.smoke/2.5);return{yaw:sway.yaw+Math.sin(seconds*.77)*.008*haze,pitch:sway.pitch+Math.sin(seconds*.61)*.005*haze};}
 status(){const label=intoxicationLabel(this.intoxication),parts=[] as string[];if(label)parts.push(`${label} ${Math.round(this.intoxication/MAX_INTOXICATION*100)}%`);if(this.smoke>.15)parts.push('PIPE HAZE');return parts.join(' · ');}
 drink(id:TavernDrinkId,player:PlayerState,maxStamina:number){const d=TAVERN_DRINKS.find(x=>x.id===id)!;this.intoxication=addIntoxication(this.intoxication,id);player.stamina=Math.min(maxStamina,player.stamina+d.stamina);return d.toast;}
 smokePipe(){this.pipePulls++;this.smoke=Math.min(3,this.smoke+1.3);return ["The house pipe tastes of applewood and questionable decisions.","Brinna: ‘Easy. That pipe has defeated men with mortgages.’","Pell applauds. Nobody knows why."][this.pipePulls%3];}
 patronLine(id:string){const actor=this.actors.find(a=>a.id===id);if(!actor)return'The patron studies the bottom of a cup with professional intensity.';const line=actor.lines[actor.line%actor.lines.length];actor.line++;return`${actor.name} · ${line}`;}
 update(dt:number,seconds:number,playerPosition:Vec3){this.intoxication=sober(this.intoxication,dt);this.smoke=Math.max(0,this.smoke-dt*.085);if(!this.inside)return;for(const actor of this.actors){actor.mixer.update(dt);const w=localWorld(actor.local),dx=playerPosition[0]-w.x,dz=playerPosition[2]-w.z,desired=Math.hypot(dx,dz)<5.5?Math.atan2(dx,dz):actor.baseYaw,delta=T.MathUtils.euclideanModulo(desired-actor.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;actor.root.rotation.y+=delta*(1-Math.exp(-dt*3.2));}for(let i=0;i<this.warmLights.length;i++)this.warmLights[i].intensity=(i===this.warmLights.length-1?5.0:3.05)*(1+.045*Math.sin(seconds*(7.1+i*.77)+i));}
 private panel(ui:HTMLElement,title:string,eyebrow:string,onClose:()=>void){document.exitPointerLock?.();ui.innerHTML='<section class="menu-card game-panel tavern-panel"><button class="back">← Back to the room</button><div class="eyebrow"></div><h2></h2><div class="tavern-content"></div></section>';ui.querySelector<HTMLButtonElement>('.back')!.onclick=onClose;ui.querySelector('.eyebrow')!.textContent=eyebrow;ui.querySelector('h2')!.textContent=title;return ui.querySelector<HTMLElement>('.tavern-content')!;}
 openBar(ui:HTMLElement,player:PlayerState,maxStamina:number,onClose:()=>void){const content=this.panel(ui,'Brinna Keggs',`${TIPSY_ALDER_NAME.toUpperCase()} · PROPRIETOR`,onClose);content.innerHTML='<p class="tavern-quote">“Drink first. Confess later. If you break a stool, you buy the stool.”</p><div class="tavern-drinks"></div><div class="tavern-meter"><span>SOBRIETY IS A RESOURCE</span><i></i></div><output class="tavern-result" aria-live="polite">Brinna wipes a cup and waits.</output><button class="tavern-rumour">Ask what people are saying</button>';const drinks=content.querySelector('.tavern-drinks')!;const meter=content.querySelector<HTMLElement>('.tavern-meter i')!,result=content.querySelector<HTMLOutputElement>('.tavern-result')!;const refresh=()=>{meter.style.width=`${Math.min(100,this.intoxication/MAX_INTOXICATION*100)}%`;};for(const d of TAVERN_DRINKS){const b=document.createElement('button');b.className='tavern-drink';b.innerHTML=`<strong>${d.name}</strong><span>${d.subtitle}</span>`;b.onclick=()=>{result.textContent=this.drink(d.id,player,maxStamina);refresh();};drinks.append(b);}content.querySelector<HTMLButtonElement>('.tavern-rumour')!.onclick=()=>{result.textContent=["Brinna: ‘Southroad travellers keep paying for drinks with stories about things too large to be deer.’","Brinna: ‘The road makes liars of maps. If you find a cache nobody marked, take the victory.’","Brinna: ‘Hallis hears everything by noon. I hear it by breakfast.’"][Math.floor(performance.now()/1000)%3];};refresh();}
 openBones(ui:HTMLElement,onClose:()=>void){const content=this.panel(ui,'Alderbones',`${TIPSY_ALDER_NAME.toUpperCase()} · HOUSE TABLE`,onClose);content.innerHTML='<p class="tavern-quote">Two bones each. Highest pips win. A pair is worth seven extra. House takes ties because Brinna wrote the rules.</p><div class="bones-table"><div><small>YOU</small><strong class="bones-player">— —</strong></div><b>VS</b><div><small>HOUSE</small><strong class="bones-house">— —</strong></div></div><button class="bones-roll primary">THROW THE BONES</button><output class="tavern-result">Bragging rights only. For now.</output><small class="bones-record"></small>';const roll=()=>[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)] as [number,number],p=content.querySelector<HTMLElement>('.bones-player')!,h=content.querySelector<HTMLElement>('.bones-house')!,result=content.querySelector<HTMLOutputElement>('.tavern-result')!,record=content.querySelector<HTMLElement>('.bones-record')!;content.querySelector<HTMLButtonElement>('.bones-roll')!.onclick=()=>{const pr=roll(),hr=roll(),out=resolveAlderbones(pr,hr);p.textContent=pr.join(' + ');h.textContent=hr.join(' + ');result.textContent=out.copy;if(out.winner==='player')this.bonesWins++;else this.bonesLosses++;record.textContent=`Tonight: ${this.bonesWins} wins · ${this.bonesLosses} losses`;};}
 read(){return{name:TIPSY_ALDER_NAME,inside:this.inside,intoxication:this.intoxication,smoke:this.smoke,bones:{wins:this.bonesWins,losses:this.bonesLosses},exteriorDoor:[...this.exteriorDoor],interiorSpawn:[...this.interiorSpawn]};}
}
