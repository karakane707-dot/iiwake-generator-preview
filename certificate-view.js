/* 表示サイズと生成後の移動のみ。PNG描画・テンプレート状態には触れない。 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),view=$('certificate-view'),stage=$('certificate-stage'),canvas=$('certificate-canvas');
let pinned=false,frame=0;
function editing(){const el=document.activeElement;return el&&(el.tagName==='TEXTAREA'||el.tagName==='INPUT'||el.isContentEditable);}
function fit(){
 if(editing()||$('result').hidden)return;
 const height=root.visualViewport?.height||root.innerHeight;
 view.style.setProperty('--certificate-viewport',Math.floor(height)+'px');
 const r=stage.getBoundingClientRect(),h=Math.max(1,Math.min(r.height,r.width*16/9));
 canvas.style.height=Math.floor(h)+'px';canvas.style.width=(Math.floor(h)*9/16)+'px';
}
function align(){
 if(editing()||!pinned)return;
 const top=root.scrollY+view.getBoundingClientRect().top-(root.visualViewport?.offsetTop||0);
 root.scrollTo({top:Math.max(0,top),left:root.scrollX,behavior:'instant'});
}
function resize(){fit();if(pinned){root.cancelAnimationFrame(frame);frame=root.requestAnimationFrame(align);}}
function present(){if(editing())return;pinned=true;fit();align();view.focus({preventScroll:true});}
// 手動操作を始めた後は追従スクロールしない。テンプレート変更もサイズ更新のみ。
for(const event of ['touchstart','pointerdown','wheel','keydown'])root.addEventListener(event,()=>{pinned=false;},{passive:true});
root.addEventListener('resize',resize);root.visualViewport?.addEventListener('resize',resize);
if(root.ResizeObserver)new root.ResizeObserver(fit).observe(stage);
root.IiwakeCertificateView={present,fit};
})(globalThis);
