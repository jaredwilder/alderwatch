import {buildBoundaryQuotient,certificateStep,verifyBoundaryCongruence,type BoundaryMachine,type BoundaryQuotient} from './boundary-certificate';

export type MineBoundaryInput='idle_day'|'dispatch_miners'|'dispatch_guards'|'seal_and_repair';
export interface DeepMineMicroState{support:0|1|2|3;ore:0|1|2|3;threat:0|1|2|3;rubbleMask:number}
export interface MineBoundaryOutput{oreExport:number;casualties:number;alarm:'quiet'|'amber'|'red';passage:'open'|'restricted'|'blocked'}

const LEVELS=[0,1,2,3] as const;
export const DEEP_MINE_INPUTS:readonly MineBoundaryInput[]=['idle_day','dispatch_miners','dispatch_guards','seal_and_repair'];
const clamp3=(n:number)=>Math.max(0,Math.min(3,n)) as 0|1|2|3;
export const rubbleCount=(mask:number)=>{let n=mask&255,c=0;while(n){c+=n&1;n>>>=1;}return c;};
const canonicalMask=(count:number)=>count<=0?0:count>=8?255:(1<<count)-1;
const passageFor=(support:number,rubble:number):MineBoundaryOutput['passage']=>support===0||rubble>=7?'blocked':support===1||rubble>=5?'restricted':'open';
const alarmFor=(threat:number):MineBoundaryOutput['alarm']=>threat>=3?'red':threat>=2?'amber':'quiet';

export function deepMineStep(state:DeepMineMicroState,input:MineBoundaryInput):{state:DeepMineMicroState;output:MineBoundaryOutput}{
  const rubble=rubbleCount(state.rubbleMask),passage=passageFor(state.support,rubble),alarm=alarmFor(state.threat);
  const canMine=input==='dispatch_miners'&&passage!=='blocked';
  const oreExport=canMine?Math.min(state.ore,passage==='open'?2:1):0;
  const casualties=canMine&&state.threat>=2?state.threat-1:0;
  let support=state.support,ore=state.ore,threat=state.threat,nextRubble=rubble;
  if(input==='idle_day'){
    ore=clamp3(ore+1);if(support>=2)threat=clamp3(threat-1);nextRubble=Math.min(8,rubble+(support===0?2:support===1?1:0));
  }else if(input==='dispatch_miners'){
    ore=clamp3(ore-oreExport);threat=clamp3(threat+(rubble>=6?1:0));if(rubble>=5)support=clamp3(support-1);nextRubble=Math.min(8,rubble+(support<=1?1:0));
  }else if(input==='dispatch_guards'){
    threat=clamp3(threat-2);nextRubble=Math.min(8,rubble+(support===0?1:0));
  }else{
    support=clamp3(support+1);threat=clamp3(threat-1);nextRubble=Math.max(0,rubble-2);
  }
  return {state:{support,ore,threat,rubbleMask:canonicalMask(nextRubble)},output:{oreExport,casualties,alarm,passage}};
}

export const DEEP_MINE_STATES:readonly DeepMineMicroState[]=(()=>{const out:DeepMineMicroState[]=[];for(const support of LEVELS)for(const ore of LEVELS)for(const threat of LEVELS)for(let rubbleMask=0;rubbleMask<256;rubbleMask++)out.push({support,ore,threat,rubbleMask});return out;})();
export const deepMineStateKey=(s:DeepMineMicroState)=>`${s.support},${s.ore},${s.threat},${s.rubbleMask}`;
export const deepMineOutputKey=(o:MineBoundaryOutput)=>`${o.oreExport},${o.casualties},${o.alarm},${o.passage}`;
export const DEEP_MINE_MACHINE:BoundaryMachine<DeepMineMicroState,MineBoundaryInput,MineBoundaryOutput>={states:DEEP_MINE_STATES,inputs:DEEP_MINE_INPUTS,stateKey:deepMineStateKey,outputKey:deepMineOutputKey,step:deepMineStep};
let quotient:BoundaryQuotient<DeepMineMicroState>|undefined;
export function deepMineQuotient(){if(!quotient){quotient=buildBoundaryQuotient(DEEP_MINE_MACHINE);verifyBoundaryCongruence(DEEP_MINE_MACHINE,quotient);}return quotient;}
export function deepMineCertificateFor(state:DeepMineMicroState){const id=deepMineQuotient().classOf.get(deepMineStateKey(state));if(id===undefined)throw new Error('Deep Mine state missing from quotient');return id;}
export function stepDeepMineCertificate(certificate:number,input:MineBoundaryInput){return certificateStep(DEEP_MINE_MACHINE,deepMineQuotient(),certificate,input);}
export function deepMineRepresentative(certificate:number){const state=deepMineQuotient().classes[certificate]?.[0];if(!state)throw new Error('Unknown Deep Mine certificate');return state;}
