export async function panic(options={}){
 const target=options.target||"https://www.google.com/";
 try{
   if("serviceWorker" in navigator){
     const regs=await navigator.serviceWorker.getRegistrations();
     await Promise.all(regs.map(r=>r.unregister()));
   }
   localStorage.removeItem("imagination.history");
   sessionStorage.clear();
 }finally{location.replace(target)}
}
window.panic=panic;
