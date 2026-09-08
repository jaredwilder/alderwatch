const OVERLAY_SELECTORS=['.npc-conversation','.fun-market','.fun-profile'] as const;

function visible(el:HTMLElement){const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0';}
function z(el:HTMLElement){const value=Number.parseInt(getComputedStyle(el).zIndex||'0',10);return Number.isFinite(value)?value:0;}
export function topmostAlderwatchOverlay(){
 const candidates=OVERLAY_SELECTORS.flatMap(selector=>Array.from(document.querySelectorAll<HTMLElement>(selector))).filter(visible);
 return candidates.sort((a,b)=>z(a)-z(b)||((a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)?-1:1)).at(-1);
}
export function closeTopmostAlderwatchOverlay(){const top=topmostAlderwatchOverlay();if(!top)return false;const close=top.querySelector<HTMLButtonElement>('.npc-close,.fun-close,[data-close]');if(close)close.click();else top.remove();return true;}

if(typeof window!=='undefined')window.addEventListener('keydown',event=>{
 if(event.code!=='Escape'||event.repeat)return;
 if(!closeTopmostAlderwatchOverlay())return;
 event.preventDefault();event.stopImmediatePropagation();
},true);
