(function(root){
'use strict';
const C=root.IiwakeCertificate,$=id=>document.getElementById(id);
let revision=0,timer=0,png=null,pngUrl='',model=null,renderedPhoto='',image=null,sharing=false;
function status(message){$('export-status').textContent=message;}
function invalidate(){png=null;$('save-png').disabled=true;$('share-png').disabled=true;$('download-png').removeAttribute('href');$('save-panel').hidden=true;$('saved-image').removeAttribute('src');if(pngUrl){URL.revokeObjectURL(pngUrl);pngUrl='';}}
function loadPhoto(url){return new Promise((resolve,reject)=>{if(!url)return resolve(null);const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('写真を読み込めません。写真を選び直してください。'));img.src=url;});}
async function draw(version){
 try{
  if(document.fonts)await document.fonts.ready;
  const current=model;if(!current||version!==revision)return;
  let nextImage=image;
  if(current.photoUrl!==renderedPhoto)nextImage=await loadPhoto(current.photoUrl);
  if(version!==revision)return;image=nextImage;renderedPhoto=current.photoUrl;
  C.render($('certificate-canvas'),current,image);
  // 同一canvasのPNGを事前生成。共有タップ後に非同期変換を挟まない。
  const blob=await new Promise((resolve,reject)=>$('certificate-canvas').toBlob(b=>b?resolve(b):reject(Error('PNGを作成できませんでした。文章や写真を短く・小さくして再度お試しください。')),'image/png'));
  if(version!==revision)return;
  png=blob;pngUrl=URL.createObjectURL(blob);$('save-png').disabled=false;$('share-png').disabled=sharing;
  $('certificate-canvas').removeAttribute('aria-busy');status('認定書を更新しました。PNG保存・共有ができます。');
  root.IiwakeCertificateUI.onReady?.();
 }catch(error){if(version!==revision)return;$('certificate-canvas').removeAttribute('aria-busy');status(error.message||'画像を作成できませんでした。');}
}
function update(data){model={...data,template:$('certificate-template').value||'drawing'};revision++;invalidate();$('certificate-canvas').setAttribute('aria-busy','true');status('認定書を作成しています…');clearTimeout(timer);const version=revision;timer=setTimeout(()=>draw(version),80);}
function showSave(){if(!png)return;$('saved-image').src=pngUrl;$('download-png').href=pngUrl;$('download-png').download='purchase-certificate-'+model.number+'.png';$('save-panel').hidden=false;$('save-panel').scrollIntoView({block:'nearest',behavior:'auto'});status('PNGを用意しました。ダウンロード、または下の画像を長押しして保存してください。');}
C.templates.forEach(t=>$('certificate-template').add(new Option(t.label,t.id)));
$('certificate-template').addEventListener('change',()=>{if(model)update(model);});
$('save-png').addEventListener('click',showSave);
$('close-save').addEventListener('click',()=>{$('save-panel').hidden=true;$('save-png').focus();});
$('share-png').addEventListener('click',async()=>{
 if(!png||sharing)return;
 let file;try{file=new File([png],'purchase-certificate-'+model.number+'.png',{type:'image/png'});}catch(_){showSave();return;}
 let supported=false;try{supported=!!(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]}));}catch(_){}
 if(!supported){showSave();status('この環境では画像の直接共有に対応していません。PNGを保存し、SNSアプリから添付してください。');return;}
 sharing=true;$('share-png').disabled=true;
 try{await navigator.share({files:[file],title:'購入正当化認定書'});status('共有画面での操作が終了しました。');}
 catch(error){if(error.name==='AbortError')status('共有をキャンセルしました。');else {showSave();status('画像を共有できませんでした。PNG保存をご利用ください。');}}
 finally{sharing=false;$('share-png').disabled=!png;}
});
root.IiwakeCertificateUI={update};
})(globalThis);
