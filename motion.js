/* 画面演出専用。文章・認定書の描画データには触れない。 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),media=window.matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set();let cycle=0,started=0,wait=0,frame=0,observer,awaiting=false,previewReady=null,navigate=true;
function play(el,frames,options,done){
 if(media.matches||!el?.animate){done?.();return null;}
 const animation=el.animate(frames,options);active.add(animation);
 const finish=()=>{active.delete(animation);done?.();};
 animation.onfinish=finish;animation.oncancel=()=>active.delete(animation);return animation;
}
function stop(){awaiting=false;previewReady=null;cycle++;clearTimeout(wait);cancelAnimationFrame(frame);for(const a of active)a.cancel();active.clear();$('review-effect').hidden=true;}
function intro(){
 if(media.matches)return;
 document.querySelectorAll('.hero-line > span').forEach((el,i)=>play(el,[{transform:'translateY(100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:1100,delay:100+i*220,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'}));
 play($('hero-brush'),[{transform:'scaleX(0) rotate(-8deg)'},{transform:'scaleX(1) rotate(-8deg)'}],{duration:1100,delay:350,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
 const headings=document.querySelectorAll('.section-title');
 if('IntersectionObserver' in root){observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){revealHeading(entry.target);observer.unobserve(entry.target);}}, {threshold:0.25});headings.forEach(el=>observer.observe(el));}
 else headings.forEach(revealHeading);
}
function revealHeading(el){
 const line=el.querySelector('.section-reveal-line');
 play(line,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:550,easing:'cubic-bezier(.22,.61,.36,1)'});
}
function chip(el){play(el,[{transform:'translateY(6px) scale(.97)',opacity:0},{transform:'translateY(-1px) scale(1.01)',opacity:1,offset:.8},{transform:'translateY(0) scale(1)',opacity:1}],{duration:380,easing:'cubic-bezier(.22,.61,.36,1)'});}
function begin(){
 stop();awaiting=true;navigate=true;started=performance.now();
 $('review-effect').hidden=false;
 progress(0);if(!media.matches)wait=setTimeout(tick,100);
}
function progress(value){
 $('review-percent').textContent=value+'%';$('review-progress').value=value;
 const detail=value===100?'認定書を発行しました':value<35?'申告内容を確認中':value<70?'購入理由を照合中':'認定書を発行中';
 if($('review-detail').textContent!==detail)$('review-detail').textContent=detail;
}
// 段階表示用の目安。実際の描画・PNG準備が終わるまで100%にしない。
function tick(){
 if(!awaiting)return;
 const elapsed=performance.now()-started;
 if(previewReady&&(media.matches||elapsed>=2500)){
  progress(100);const token=cycle;wait=setTimeout(()=>{if(token!==cycle)return;const preview=previewReady;awaiting=false;previewReady=null;$('review-effect').hidden=true;if(navigate)showPreview(preview);},media.matches?0:200);return;
 }
 progress(media.matches?0:Math.min(95,Math.floor(elapsed/2500*100)));
 if(!media.matches)wait=setTimeout(tick,100);
}
function present(preview){if(!awaiting)return;previewReady=preview;clearTimeout(wait);tick();}
function showPreview(preview){
 const token=cycle;
 function arrive(){if(token!==cycle)return;awaiting=false;previewReady=null;preview.focus({preventScroll:true});play(preview,[{transform:'translateY(16px) rotate(-.4deg) scale(.99)',opacity:.2},{transform:'translateY(0) rotate(0) scale(1)',opacity:1}],{duration:850,easing:'cubic-bezier(.22,.61,.36,1)'});}
 function move(){
  if(token!==cycle)return;
  $('review-effect').hidden=true;
  if(media.matches){awaiting=false;previewReady=null;preview.focus({preventScroll:true});preview.scrollIntoView({block:'start',behavior:'auto'});return;}
  // 移動は550ms、認定書の登場は850ms。審査の読める時間とは分ける。
  const from=window.scrollY,to=Math.max(0,Math.min(from+preview.getBoundingClientRect().top-68,document.documentElement.scrollHeight-window.innerHeight)),start=performance.now();
  const step=now=>{if(token!==cycle)return;const t=Math.min(1,(now-start)/550),ease=t*t*(3-2*t);window.scrollTo(0,from+(to-from)*ease);if(t<1)frame=requestAnimationFrame(step);else arrive();};frame=requestAnimationFrame(step);
 }
 move();
}
// 手動操作中は自動スクロールだけ中止し、進行表示は完了まで継続する。
for(const type of ['touchstart','wheel','keydown'])window.addEventListener(type,()=>{if(awaiting)navigate=false;else stop();},{passive:true});
media.addEventListener?.('change',()=>{if(media.matches){observer?.disconnect();for(const a of active)a.cancel();active.clear();cancelAnimationFrame(frame);clearTimeout(wait);if(awaiting)tick();}else if(awaiting){clearTimeout(wait);tick();}});
document.querySelectorAll('input:not([type=checkbox]):not([type=file]),select,textarea').forEach(el=>el.addEventListener('focus',()=>play(el,[{backgroundSize:'0% 3px',backgroundPosition:'50% 100%'},{backgroundSize:'100% 3px',backgroundPosition:'50% 100%'}],{duration:500,easing:'cubic-bezier(.16,1,.3,1)'})));
root.IiwakeMotion={begin,present,chip,stop};intro();
})(globalThis);
