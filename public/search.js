export function resolveAddress(value){
  const input=(value||"").trim();
  if(!input) return "";
  try{return new URL(input).href}catch{}
  if(!/\s/.test(input)&&(/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?(\/|$)/.test(input)||input.includes("."))){
    return new URL("https://"+input).href;
  }
  return "https://www.google.com/search?q="+encodeURIComponent(input);
}
window.resolveAddress=resolveAddress;
