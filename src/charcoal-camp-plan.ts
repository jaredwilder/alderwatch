import {SettlementCompiler,faceToward,type SettlementCharter,type SettlementPlan} from './settlement-compiler';

export const CHARCOAL_CAMP_ORIGIN={x:0,z:-48} as const;

export const CHARCOAL_CAMP_CHARTER:SettlementCharter={
 id:'wolfpine-charcoal-camp',kind:'camp',purpose:'harvest timber, burn charcoal, load carts and shelter a small permanent crew',seed:0x574f4c46,
 footprint:{width:62,depth:48},functions:['arrival','social','shelter','storage','work','yard','service','water'],
 anchors:[
  {id:'charcoal-track',position:{x:0,z:-23},kind:'road'},
  {id:'timber-edge',position:{x:29,z:-49},kind:'resource'},
  {id:'water-run',position:{x:-29,z:-62},kind:'water'},
 ],plannedness:.28,compactness:.63,defense:.16,wealth:.22,
};

export function compileCharcoalCamp():SettlementPlan{
 const c=new SettlementCompiler(CHARCOAL_CAMP_CHARTER),fire={x:0,z:-45};
 const arrival=c.zone('arrival','arrival',{x:0,z:-25},4,Math.PI,['fire-court']);
 const social=c.zone('fire-court','social',fire,7,0,['arrival','sleep-shelter','charcoal-work']);
 const shelter=c.zone('sleep-shelter','shelter',{x:-15,z:-53},6,faceToward({x:-15,z:-53},fire),['fire-court']);
 const storage=c.zone('covered-store','storage',{x:-18,z:-41},6,faceToward({x:-18,z:-41},{x:0,z:-33}),['fire-court','loading-yard']);
 const work=c.zone('charcoal-work','work',{x:13,z:-49},7,faceToward({x:13,z:-49},{x:23,z:-44}),['fire-court','loading-yard']);
 const yard=c.zone('loading-yard','yard',{x:12,z:-35},6,faceToward({x:12,z:-35},{x:0,z:-25}),['arrival','charcoal-work','covered-store','cart-service']);
 const service=c.zone('cart-service','service',{x:26,z:-34},5,faceToward({x:26,z:-34},{x:12,z:-35}),['loading-yard']);
 const water=c.zone('water-run','water',{x:-27,z:-61},5,faceToward({x:-27,z:-61},{x:-15,z:-53}),['sleep-shelter']);
 const zones=[arrival,social,shelter,storage,work,yard,service,water];
 const paths=[
  c.path('track-to-fire',arrival,social,2.7,c.jitter('track-bend',1.2)),
  c.path('fire-to-shelter',social,shelter,1.65,c.jitter('shelter-path-bend',.65)),
  c.path('fire-to-store',social,storage,1.75,c.jitter('store-path-bend',.55)),
  c.path('fire-to-work',social,work,2.15,c.jitter('work-path-bend',.7)),
  c.path('work-to-yard',work,yard,2.8,c.jitter('yard-path-bend',.75)),
  c.path('store-to-yard',storage,yard,2.25,c.jitter('store-yard-bend',.7)),
  c.path('yard-to-cart',yard,service,3.2,c.jitter('cart-path-bend',.45)),
  c.path('shelter-to-water',shelter,water,1.2,c.jitter('water-path-bend',.55)),
 ];
 const j=(key:string,x:number,z:number,amp=.35)=>({x:x+c.jitter(key+'-x',amp),z:z+c.jitter(key+'-z',amp)});
 const placements=[
  // Real enclosed crew mass replaces the screenshot-failed skeletal X shelter.
  c.placement('crew-shelter','hut_c',shelter,j('shelter',-16,-54,.18),'crew-shelter',.64,faceToward({x:-16,z:-54},fire),{hx:2.7,hz:2.7,hy:2.3}),
  c.placement('crew-tool-shed','hut_d',shelter,j('crew-tool-shed',-8.5,-57,.16),'crew-shelter',.48,faceToward({x:-8.5,z:-57},fire),{hx:2.1,hz:2.1,hy:2}),
  c.placement('bed-hay','hay',shelter,j('bed-hay',-11,-51,.16),'crew-shelter',.78,faceToward({x:-11,z:-51},fire)),
  c.placement('shelter-crate','crate',shelter,j('shelter-crate',-12.7,-50,.12),'crew-shelter',.66,.2),
  c.placement('shelter-lantern','lantern',shelter,j('shelter-lantern',-11.5,-49.5,.12),'crew-shelter',.75,0),

  c.placement('social-fire','campfire_burning_q',social,j('social-fire',0,-45,.18),'social-fire',1,0),
  c.placement('cook-cauldron','cauldron',social,j('cook-cauldron',2.7,-44,.12),'social-fire',.82,-.3),
  c.placement('fire-seat-a','crate',social,j('fire-seat-a',-3.8,-43,.2),'social-fire',.7,2.2),
  c.placement('fire-seat-b','crate',social,j('fire-seat-b',3.8,-48,.2),'social-fire',.65,-.7),
  c.placement('fire-hay','hay',social,j('fire-hay',-4.8,-47.2,.16),'social-fire',.62,.45),

  c.placement('covered-store','storage',storage,j('covered-store',-19,-41,.22),'covered-storage',.82,faceToward({x:-19,z:-41},{x:0,z:-33}),{hx:3,hz:3,hy:2}),
  c.placement('store-crate-a','crate',storage,j('store-crate-a',-13.5,-39,.18),'covered-storage',.76,.15),
  c.placement('store-crate-b','crate',storage,j('store-crate-b',-15.3,-37.8,.18),'covered-storage',.67,-.12),
  c.placement('store-barrel','barrel',storage,j('store-barrel',-21.5,-36.8,.18),'covered-storage',.72,.2),
  c.placement('store-wood','wood_pile',storage,j('store-wood',-22.5,-44.8,.15),'covered-storage',.74,-.2),

  c.placement('raw-timber-a','wood_pile',work,j('raw-timber-a',9,-50,.22),'charcoal-work',.92,.18),
  c.placement('raw-timber-b','wood_pile',work,j('raw-timber-b',12.5,-52,.22),'charcoal-work',.86,-.16),
  c.placement('raw-timber-c','wood_pile',work,j('raw-timber-c',16,-50.5,.22),'charcoal-work',.82,.08),
  c.placement('raw-timber-d','wood_pile',work,j('raw-timber-d',18,-53.7,.18),'charcoal-work',.74,.22),
  c.placement('burn-fire','campfire_burning_q',work,j('burn-fire',14,-45,.12),'charcoal-work',.82,0),
  c.placement('work-cauldron','cauldron',work,j('work-cauldron',17.2,-44.2,.12),'charcoal-work',.7,.4),
  c.placement('work-fence-a','fence_wood_single',work,j('work-fence-a',21.4,-47,.12),'charcoal-work',.88,Math.PI/2),
  c.placement('work-fence-b','fence_wood_single',work,j('work-fence-b',21.4,-50,.12),'charcoal-work',.88,Math.PI/2),
  c.placement('work-fence-c','fence_wood_single',work,j('work-fence-c',21.4,-53,.12),'charcoal-work',.88,Math.PI/2),
  c.placement('work-fence-d','fence_wood_single',work,j('work-fence-d',21.4,-56,.12),'charcoal-work',.88,Math.PI/2),

  c.placement('loading-wagon','wagon',yard,j('loading-wagon',12,-33,.2),'loading-yard',.76,faceToward({x:12,z:-33},{x:0,z:-25})),
  c.placement('loading-barrel-a','barrel',yard,j('loading-barrel-a',7.8,-36,.15),'loading-yard',.72,.1),
  c.placement('loading-barrel-b','barrel',yard,j('loading-barrel-b',9.3,-36.5,.15),'loading-yard',.68,-.1),
  c.placement('loading-crate','crate',yard,j('loading-crate',16.5,-37,.15),'loading-yard',.72,.25),
  c.placement('yard-fence-a','fence_wood_single',yard,j('yard-fence-a',7,-28.8,.1),'loading-yard',.82,0),
  c.placement('yard-fence-b','fence_wood_single',yard,j('yard-fence-b',10,-28.8,.1),'loading-yard',.82,0),
  c.placement('yard-fence-c','fence_wood_single',yard,j('yard-fence-c',18,-30.2,.1),'loading-yard',.82,.08),

  c.placement('roadside-timber-a','wood_pile',service,j('roadside-timber-a',25,-39,.2),'cart-service',.82,0),
  c.placement('roadside-timber-b','wood_pile',service,j('roadside-timber-b',28,-41,.2),'cart-service',.76,.15),
  c.placement('roadside-crate','crate',service,j('roadside-crate',28,-36.5,.12),'cart-service',.62,-.1),
  c.placement('roadside-marker','torch',service,j('roadside-marker',24,-29,.1),'cart-service',.78,0),

  c.placement('water-barrel-a','barrel',water,j('water-barrel-a',-25,-58.5,.12),'water-run',.72,.15),
  c.placement('water-barrel-b','barrel',water,j('water-barrel-b',-27,-59.3,.12),'water-run',.68,-.15),
  c.placement('water-crate','crate',water,j('water-crate',-23,-61.5,.12),'water-run',.62,.2),
  c.placement('shelter-edge-a','fence_wood_single',shelter,j('shelter-edge-a',-23.5,-50,.1),'crew-shelter',.82,Math.PI/2),
  c.placement('shelter-edge-b','fence_wood_single',shelter,j('shelter-edge-b',-23.5,-53,.1),'crew-shelter',.82,Math.PI/2),
 ];
 const score=c.score(zones,paths,placements);
 return c.validate({charter:CHARCOAL_CAMP_CHARTER,zones,paths,placements,score});
}

export const CHARCOAL_CAMP_PLAN=compileCharcoalCamp();