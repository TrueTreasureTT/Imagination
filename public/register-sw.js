const stockSW="/sw.js";
async function registerSW(){
 if(!("serviceWorker" in navigator)) throw new Error("Service workers are not supported.");
 if(location.protocol!=="https:" && !["localhost","127.0.0.1"].includes(location.hostname)) throw new Error("HTTPS is required for service workers.");
 const registration=await navigator.serviceWorker.register(stockSW,{scope:"/"});
 await navigator.serviceWorker.ready;
 return registration;
}