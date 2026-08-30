export async function panic(){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));location.replace("https://www.google.com/");}
