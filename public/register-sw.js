let registrationPromise;
export async function registerSW(){
 if(registrationPromise)return registrationPromise;
 registrationPromise=(async()=>{
   if(!("serviceWorker" in navigator))throw new Error("This browser does not support Service Workers.");
   if(location.protocol!=="https:"&&!["localhost","127.0.0.1"].includes(location.hostname)){
     throw new Error("HTTPS is required when running outside localhost.");
   }
   const registration=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
   await navigator.serviceWorker.ready;
   return registration;
 })();
 return registrationPromise;
}
window.registerProxySW=registerSW;
