import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {WEAPONS} from '../src/combat-rules';
import {makePlayer} from '../src/state';
import {model} from './load-assets';

async function fixture(){
 await RAPIER.init();const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.createCollider(RAPIER.ColliderDesc.cuboid(20,.1,20).setTranslation(0,-.1,0));
 const scene=new T.Group(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped='axe';let tick=0;const actor=new Character(assets,physics,p,scene);actor.getTick=()=>tick;actor.equip('axe');
 const input={keys:new Set<string>(),secondary:false,take:()=>false};const step=()=>{actor.preStep(1/120,input,Math.PI,true);physics.timestep=1/120;physics.step();actor.postStep(1/120);scene.updateMatrixWorld(true);tick+=.5;};return{physics,scene,actor,step};
}
function wrappedDelta(a:number,b:number){return T.MathUtils.euclideanModulo(b-a+Math.PI,Math.PI*2)-Math.PI;}
async function measureShippingAxe(){
 const f=await fixture(),pelvis=f.actor.model.getObjectByName('pelvis');assert.ok(pelvis instanceof T.Bone);const rest=pelvis.quaternion.clone(),samples:{t:number;x:number;y:number;z:number;angle:number;speed:number;hip:number}[]=[];let previous:T.Vector3|undefined;
 assert.equal(f.actor.startAttack(),true);
 for(let i=0;i<=Math.ceil(WEAPONS.axe!.duration*120)+2;i++){
  f.step();const p=f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0)),t=f.actor.attackTime,speed=previous?p.distanceTo(previous)*120:0;samples.push({t,x:p.x-f.actor.root.position.x,y:p.y-f.actor.root.position.y,z:p.z-f.actor.root.position.z,angle:Math.atan2(p.x-f.actor.root.position.x,p.z-f.actor.root.position.z),speed,hip:rest.angleTo(pelvis.quaternion)});previous=p.clone();
 }
 const near=(t:number)=>samples.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a),contact=near(WEAPONS.axe!.impact),wind=near(WEAPONS.axe!.impact*.45),follow=near(WEAPONS.axe!.impact+(WEAPONS.axe!.duration-WEAPONS.axe!.impact)*.38),peak=samples.reduce((a,b)=>b.speed>a.speed?b:a),arc=wrappedDelta(wind.angle,follow.angle),maxHip=Math.max(...samples.map(s=>s.hip));f.physics.free();
 return {wind,contact,follow,peak,arc,maxHip};
}

test('shipping melee contacts early while recovery carries the weight',()=>{
 for(const id of ['sword','axe','pickaxe','hammer'] as const){const p=WEAPONS[id]!;assert.ok(p.impact/p.duration<.4,`${id} still lands too late in its action: ${p.impact}/${p.duration}`);}
});

test('shipping axe is a fast hip-led right-to-left combat cut on the real rig',async()=>{
 const m=await measureShippingAxe(),impact=WEAPONS.axe!.impact;
 assert.ok(m.wind.x>.35,`Axe must load on weapon side: ${JSON.stringify(m.wind)}`);
 assert.ok(m.contact.x<-.25&&m.follow.x<-.65,`Axe must cut across and finish opposite the weapon side: ${JSON.stringify({contact:m.contact,follow:m.follow})}`);
 assert.ok(m.wind.y<1.5&&m.contact.y>.85&&m.contact.y<1.25,`Side cut drifted into overhead/ground chop: ${JSON.stringify({wind:m.wind,contact:m.contact})}`);
 assert.ok(m.contact.z>.75,`Axe must reach through the target at contact: ${JSON.stringify(m.contact)}`);
 assert.ok(m.arc>1.6,`Axe lateral arc is too small: ${m.arc}`);
 assert.ok(m.maxHip>1.1,`Pelvis never develops a violent coil: ${m.maxHip}`);
 assert.ok(m.wind.hip-m.contact.hip>.55,`Pelvis did not fire substantially from coil through contact: ${JSON.stringify({wind:m.wind.hip,contact:m.contact.hip})}`);
 assert.ok(m.peak.t<impact&&m.peak.t>impact-.1,`Peak weapon speed must occur immediately before gameplay contact: ${JSON.stringify(m.peak)}`);
 assert.ok(m.contact.speed>9.5,`Axe head is still visually slow at the gameplay hit: ${m.contact.speed}`);
});
