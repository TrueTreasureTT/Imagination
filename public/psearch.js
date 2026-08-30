import {resolveAddress} from "./search.js";
export function suggestions(query){
  const q=(query||"").trim();
  if(!q)return [];
  return [
    {label:`Search Google for "${q}"`,url:resolveAddress(q),type:"search"},
    ...(!/\s/.test(q)&&q.includes(".")?[{label:`Open https://${q}`,url:resolveAddress(q),type:"url"}]:[])
  ];
}
window.proxySuggestions=suggestions;
