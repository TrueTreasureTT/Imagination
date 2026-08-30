const form=document.querySelector("#proxy-form"),address=document.querySelector("#address"),status=document.querySelector("#status"),browser=document.querySelector("#browser");
const { ScramjetController }=$scramjetLoadController();
const scramjet=new ScramjetController({files:{wasm:"/scram/scramjet.wasm.wasm",all:"/scram/scramjet.all.js",sync:"/scram/scramjet.sync.js"}});
scramjet.init();
const connection=new BareMux.BareMuxConnection("/baremux/worker.js");
let frame;
form.addEventListener("submit",async e=>{e.preventDefault();const input=address.value.trim();if(!input)return;status.textContent="Loading…";try{await registerSW();const ws=(location.protocol==="https:"?"wss":"ws")+"://"+location.host+"/wisp/";if(await connection.getTransport()!=="/libcurl/index.mjs")await connection.setTransport("/libcurl/index.mjs",[{websocket:ws}]);if(frame)frame.frame.remove();frame=scramjet.createFrame();frame.frame.className="proxy-frame";browser.append(frame.frame);frame.go(search(input));status.textContent=""}catch(err){status.textContent=err.message||String(err)}});