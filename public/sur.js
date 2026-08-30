const history=[];
export function setStatus(message="",kind="info"){
 const el=document.querySelector("#status");
 if(el){el.textContent=message;el.dataset.kind=kind;}
}
export function addHistory(url,title=url){
 if(!url)return;
 history.unshift({url,title,time:Date.now()});
 if(history.length>50)history.length=50;
 try{localStorage.setItem("imagination.history",JSON.stringify(history));}catch{}
}
export function getHistory(){
 try{return JSON.parse(localStorage.getItem("imagination.history")||"[]")}catch{return []}
}
window.proxyUI={setStatus,addHistory,getHistory};
