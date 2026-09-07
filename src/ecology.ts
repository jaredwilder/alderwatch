// Visual ecology is independent of saved resources and the playable heightfield.
// Keep highlandHeight in sync with the Blender-authored backdrop for tree placement.
export function noise2(x:number,y:number){
 const hash=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
 return (hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx)*(1-fy)+(hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx)*fy;
}
export function highlandHeight(x:number,north:number){
 let apron=Math.max(0,Math.min(1,(north-115)/85));apron=apron*apron*(3-2*apron);
 const peaks=[[-85,470,178,130,140],[73,490,132,95,125],[-230,390,93,135,125],[235,455,114,150,175],[-390,535,150,150,190],[415,575,154,190,175],[-20,690,195,165,150]];
 const h=Math.max(...peaks.map(([cx,cy,amp,wx,wy])=>{const dx=(x-cx)/wx,dy=(north-cy)/wy,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);return amp*(.3*Math.exp(-r*r*.6)+.7*Math.max(0,1-r*(1+.09*Math.cos(a*7+cx)))**1.18);}));
 const ridge=1-Math.abs(noise2(x*.029,north*.029)*2-1);
 return -6+apron*(h+(ridge-.55)*h*.19+(noise2(x*.095,north*.095)-.5)*h*.035+18*noise2(x*.009+8,north*.012)+10*noise2(x*.025,north*.024));
}
export function meadowDensity(x:number,z:number){return .25+.75*noise2(x*.16+11,z*.16+7)*(.45+.55*noise2(x*.045,z*.045));}
export function distantGround(x:number,z:number,playableHeight:(x:number,z:number)=>number){
 const playable=Math.abs(x)<=258&&Math.abs(z)<=258?playableHeight(x,z):-Infinity;
 const authored=z<=-115?highlandHeight(x,-z):-Infinity;
 return Math.max(playable,authored);
}
