export interface BoundaryStep<S,O>{state:S;output:O}
export interface BoundaryMachine<S,I,O>{
  states:readonly S[];
  inputs:readonly I[];
  stateKey:(state:S)=>string;
  outputKey:(output:O)=>string;
  step:(state:S,input:I)=>BoundaryStep<S,O>;
}

export interface BoundaryQuotient<S>{
  classOf:Map<string,number>;
  classes:S[][];
  iterations:number;
}

/**
 * Computes the coarsest stable observational quotient of a finite deterministic
 * boundary machine. States remain equivalent iff every admissible boundary input
 * yields the same immediate observation and enters the same equivalence class.
 * Once stable, induction gives equality of all future observable traces.
 */
export function buildBoundaryQuotient<S,I,O>(machine:BoundaryMachine<S,I,O>):BoundaryQuotient<S>{
  if(!machine.states.length)throw new Error('Boundary machine must contain states');
  if(!machine.inputs.length)throw new Error('Boundary machine must contain inputs');
  const byKey=new Map(machine.states.map(state=>[machine.stateKey(state),state]));
  if(byKey.size!==machine.states.length)throw new Error('Boundary machine state keys must be unique');
  let classOf=new Map<string,number>();
  const regroup=(signature:(state:S)=>string)=>{
    const signatureClass=new Map<string,number>(),next=new Map<string,number>();let id=0;
    for(const state of machine.states){const sig=signature(state);if(!signatureClass.has(sig))signatureClass.set(sig,id++);next.set(machine.stateKey(state),signatureClass.get(sig)!);}
    return next;
  };
  classOf=regroup(state=>machine.inputs.map(input=>machine.outputKey(machine.step(state,input).output)).join('|'));
  let iterations=1;
  for(;;){
    const next=regroup(state=>machine.inputs.map(input=>{const step=machine.step(state,input),successor=classOf.get(machine.stateKey(step.state));if(successor===undefined)throw new Error('Boundary transition left finite state set');return machine.outputKey(step.output)+'>'+successor;}).join('|'));
    let changed=false;for(const state of machine.states){const key=machine.stateKey(state);if(next.get(key)!==classOf.get(key)){changed=true;break;}}
    classOf=next;iterations++;
    if(!changed)break;
  }
  const classes:S[][]=[];for(const state of machine.states){const id=classOf.get(machine.stateKey(state))!;(classes[id]??=[]).push(state);}
  return {classOf,classes,iterations};
}

export function verifyBoundaryCongruence<S,I,O>(machine:BoundaryMachine<S,I,O>,quotient:BoundaryQuotient<S>):void{
  for(const states of quotient.classes){
    const representative=states[0];
    for(const state of states)for(const input of machine.inputs){
      const a=machine.step(representative,input),b=machine.step(state,input);
      if(machine.outputKey(a.output)!==machine.outputKey(b.output))throw new Error('Boundary quotient merged observably distinct states');
      const ca=quotient.classOf.get(machine.stateKey(a.state)),cb=quotient.classOf.get(machine.stateKey(b.state));
      if(ca!==cb)throw new Error('Boundary quotient is not successor-stable');
    }
  }
}

export function certificateStep<S,I,O>(machine:BoundaryMachine<S,I,O>,quotient:BoundaryQuotient<S>,certificate:number,input:I):{certificate:number;output:O}{
  const representative=quotient.classes[certificate]?.[0];if(!representative)throw new Error('Unknown boundary certificate');
  const step=machine.step(representative,input),next=quotient.classOf.get(machine.stateKey(step.state));if(next===undefined)throw new Error('Boundary transition left quotient');
  return {certificate:next,output:step.output};
}
