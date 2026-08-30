export function normalizeAddress(value){
 const input=value.trim();
 if(!input) return null;
 try{return new URL(input).href}catch{}
 if(/^[^\s]+\.[^\s]+/.test(input)) return new URL("https://"+input).href;
 return "https://www.google.com/search?q="+encodeURIComponent(input);
}
