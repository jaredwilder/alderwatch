// Browser-only feature bootstrap. Keep this separate from main so Node tests can
// import gameplay modules without executing DOM/CSS presentation side effects.
import './canon-authority-bridge';
import './fun-systems';
import './simulated-players';
import './chat-bank-expansion';
import './chat-bank-chaos-addendum';
import './simulated-player-society';
import './realm-chat-network';
import './realm-conversation-director';
import './canon-social-bridge';
import './realm-chat-folklore';
import './loading-experience';
import './ui-stack';
import './backpack-ui';
import './item-icons';
import './overnight-overdrive';
import './profile-paperdoll-install';
import './realm-travel-ui';
import './realm-route-surfacing';
import './world-boss-runtime';

// Performance closure touches core runtime prototypes, so it must never sit on
// bootstrap's startup-critical import graph. Wait until main has removed its
// loading screen, then import and explicitly install it. This restores the
// no-quality-loss instance compaction from #140 without recreating #141's loader
// cycle. MutationObserver avoids polling and disconnects immediately after boot.
function installPerformanceClosureAfterBoot(){
 let started=false;
 const start=()=>{
  if(started||document.querySelector('#loading'))return false;
  started=true;
  void import('./performance-closure-runtime')
   .then(module=>module.installPerformanceClosure())
   .catch(error=>console.error('Alderwatch post-boot performance closure failed to install',error));
  return true;
 };
 if(start())return;
 const observer=new MutationObserver(()=>{if(start())observer.disconnect();});
 observer.observe(document.documentElement,{childList:true,subtree:true});
}
installPerformanceClosureAfterBoot();