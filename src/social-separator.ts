export const SOCIAL_CHANNELS=['kin','market','watch','guild'] as const;
export type SocialChannel=typeof SOCIAL_CHANNELS[number];
export type SignalLevel=0|1|2|3;
export type SocialSignal=Record<SocialChannel,SignalLevel>;
export interface SocialDelta{tales:number;warnings:number;contracts:number;feuds:number}
export interface SocialBoundaryTransition{signal:SocialSignal;delta:SocialDelta}
export interface SocialBoundaryCertificate{table:SocialBoundaryTransition[];segmentCount:number}

export const SOCIAL_SIGNAL_BASE=4;
export const SOCIAL_BOUNDARY_STATE_COUNT=SOCIAL_SIGNAL_BASE**SOCIAL_CHANNELS.length;

export const zeroSocialDelta=():SocialDelta=>({tales:0,warnings:0,contracts:0,feuds:0});
export function addSocialDelta(a:SocialDelta,b:SocialDelta):SocialDelta{return {tales:a.tales+b.tales,warnings:a.warnings+b.warnings,contracts:a.contracts+b.contracts,feuds:a.feuds+b.feuds};}
const level=(n:number):SignalLevel=>Math.max(0,Math.min(3,Math.trunc(n))) as SignalLevel;
export const zeroSocialSignal=():SocialSignal=>({kin:0,market:0,watch:0,guild:0});

export function socialSignalIndex(signal:SocialSignal):number{let value=0,mul=1;for(const channel of SOCIAL_CHANNELS){value+=signal[channel]*mul;mul*=SOCIAL_SIGNAL_BASE;}return value;}
export function socialSignalFromIndex(index:number):SocialSignal{if(!Number.isInteger(index)||index<0||index>=SOCIAL_BOUNDARY_STATE_COUNT)throw new Error('social signal index outside separator state space');const out=zeroSocialSignal();let n=index;for(const channel of SOCIAL_CHANNELS){out[channel]=(n%SOCIAL_SIGNAL_BASE) as SignalLevel;n=Math.floor(n/SOCIAL_SIGNAL_BASE);}return out;}
export function socialSignalKey(signal:SocialSignal):string{return SOCIAL_CHANNELS.map(channel=>signal[channel]).join(',');}
export function socialDeltaKey(delta:SocialDelta):string{return [delta.tales,delta.warnings,delta.contracts,delta.feuds].join(',');}

export function wardBoundaryStep(signature:SocialSignal,input:SocialSignal):SocialBoundaryTransition{
 const kin=level(input.kin+(signature.kin>=2?1:0)-(input.watch===3&&signature.kin===0?1:0));
 const market=level(input.market+(signature.market>=2?1:0)+(input.guild>=2?1:0));
 const watch=level(input.watch+(signature.watch>=2?1:0)+(input.kin===0&&signature.watch===3?1:0));
 const guild=level(input.guild+(signature.guild>=2?1:0)+(input.market>=2?1:0));
 const signal={kin,market,watch,guild};
 const delta:SocialDelta={tales:(kin>=2?1:0)+(guild===3?1:0),warnings:watch>=2?1:0,contracts:(market>=2?1:0)+(guild>=2&&market>=1?1:0),feuds:kin===0&&watch===3?1:0};
 return {signal,delta};
}
export function wardBoundaryCertificate(signature:SocialSignal):SocialBoundaryCertificate{const table:Array<SocialBoundaryTransition>=[];for(let i=0;i<SOCIAL_BOUNDARY_STATE_COUNT;i++)table.push(wardBoundaryStep(signature,socialSignalFromIndex(i)));return {table,segmentCount:1};}
export function identitySocialCertificate():SocialBoundaryCertificate{const table:Array<SocialBoundaryTransition>=[];for(let i=0;i<SOCIAL_BOUNDARY_STATE_COUNT;i++)table.push({signal:socialSignalFromIndex(i),delta:zeroSocialDelta()});return {table,segmentCount:0};}
export function composeSocialCertificates(a:SocialBoundaryCertificate,b:SocialBoundaryCertificate):SocialBoundaryCertificate{const table:Array<SocialBoundaryTransition>=new Array(SOCIAL_BOUNDARY_STATE_COUNT);for(let i=0;i<SOCIAL_BOUNDARY_STATE_COUNT;i++){const first=a.table[i],second=b.table[socialSignalIndex(first.signal)];table[i]={signal:second.signal,delta:addSocialDelta(first.delta,second.delta)};}return {table,segmentCount:a.segmentCount+b.segmentCount};}
export function summarizeSocialCertificates(certificates:readonly SocialBoundaryCertificate[]):SocialBoundaryCertificate{return certificates.reduce((acc,next)=>composeSocialCertificates(acc,next),identitySocialCertificate());}
export function applySocialCertificate(certificate:SocialBoundaryCertificate,input:SocialSignal):SocialBoundaryTransition{return certificate.table[socialSignalIndex(input)];}
export function sequentialWardBoundary(signatures:readonly SocialSignal[],input:SocialSignal):SocialBoundaryTransition{let signal={...input},delta=zeroSocialDelta();for(const signature of signatures){const step=wardBoundaryStep(signature,signal);signal=step.signal;delta=addSocialDelta(delta,step.delta);}return {signal,delta};}

export class SocialSeparatorTree{
 readonly leafCount:number;readonly nodes:SocialBoundaryCertificate[];recomputedNodes=0;
 constructor(certificates:readonly SocialBoundaryCertificate[]){if(certificates.length<1)throw new Error('social separator tree requires at least one ward');let leafCount=1;while(leafCount<certificates.length)leafCount*=2;this.leafCount=leafCount;this.nodes=Array.from({length:leafCount*2},()=>identitySocialCertificate());for(let i=0;i<certificates.length;i++)this.nodes[leafCount+i]=certificates[i];for(let i=leafCount-1;i>0;i--)this.nodes[i]=composeSocialCertificates(this.nodes[i*2],this.nodes[i*2+1]);}
 get root(){return this.nodes[1];}
 apply(input:SocialSignal){return applySocialCertificate(this.root,input);}
 update(index:number,certificate:SocialBoundaryCertificate):number{if(!Number.isInteger(index)||index<0||index>=this.leafCount)throw new Error('social ward index outside separator tree');let node=this.leafCount+index;this.nodes[node]=certificate;this.recomputedNodes=0;while(node>1){node=Math.floor(node/2);this.nodes[node]=composeSocialCertificates(this.nodes[node*2],this.nodes[node*2+1]);this.recomputedNodes++;}return this.recomputedNodes;}
}
