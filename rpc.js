// Sends your status to the local Discord bridge (see rpc-bridge/). Does nothing if the bridge isn't running.
window.FDRPC=(()=>{
  const URL='http://127.0.0.1:3737/presence';let ok=true;
  return{set(a){
    if(!ok)return;
    fetch(URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(a)})
      .catch(()=>{ok=false;setTimeout(()=>{ok=true},30000)})}}
})();
