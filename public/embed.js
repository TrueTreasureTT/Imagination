export function mountFrame(container,frame){
 if(!container||!frame)throw new Error("Missing browser container or frame");
 container.replaceChildren(frame);
 frame.classList.add("proxy-frame");
 frame.setAttribute("title","Imagination Browser");
 return frame;
}
export function resizeFrame(frame,height="75vh"){
 frame.style.width="100%";frame.style.height=height;return frame;
}
window.embedProxyFrame=mountFrame;
