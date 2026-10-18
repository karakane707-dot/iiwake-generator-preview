(function(root){
'use strict';
const C=root.IiwakeCertificate,$=id=>document.getElementById(id);
let revision=0,timer=0,png=null,pngUrl='',model=null,renderedPhoto='',image=null,selectedTemplate='drawing';
function status(message){$('export-status').textContent=message;}
function invalidate(){root.IiwakeShare.clear();png=null;$('save-png').disabled=true;$('share-png').disabled=true;$('download-png').removeAttribute('href');$('save-panel').hidden=true;$('saved-image').removeAttribute('src');if(pngUrl){URL.revokeObjectURL(pngUrl);pngUrl='';}}
function loadPhoto(url){return new Promise((resolve,reject)=>{if(!url)return resolve(null);const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('写真を読み込めません。写真を選び直してください。'));img.src=url;});}
async function draw(version){
 try{
  if(document.fonts)await document.fonts.ready;
  const current=model;if(!current||version!==revision)return;
  let nextImage=image;
  if(current.photoUrl!==renderedPhoto)nextImage=await loadPhoto(current.photoUrl);
  if(version!==revision)return;image=nextImage;renderedPhoto=current.photoUrl;
  C.render($('certificate-canvas'),current,image);
  $('certificate-canvas').hidden=false;$('layout-warning').hidden=true;
  // 同一canvasのPNGを事前生成。共有タップ後に非同期変換を挟まない。
  const blob=await new Promise((resolve,reject)=>$('certificate-canvas').toBlob(b=>b?resolve(b):reject(Error('PNGを作成できませんでした。文章や写真を短く・小さくして再度お試しください。')),'image/png'));
  if(version!==revision)return;
  png=blob;pngUrl=URL.createObjectURL(blob);$('save-png').disabled=false;
  try{const shared=await root.IiwakeShare.prepare($('certificate-canvas'));if(version!==revision)return;root.IiwakeShare.set(shared,current.number);$('share-png').disabled=false;}catch(_){if(version!==revision)return;status('共有用画像を作成できませんでした。通常のPNG保存は利用できます。');}
  if(version!==revision)return;
  $('certificate-canvas').removeAttribute('aria-busy');if(!$('share-png').disabled)status('認定書を更新しました。PNG保存・共有ができます。');
  root.IiwakeCertificateUI.onReady?.();
 }catch(error){if(version!==revision)return;root.IiwakeMotion?.stop();$('certificate-canvas').hidden=true;$('certificate-canvas').removeAttribute('aria-busy');status(error.message||'画像を作成できませんでした。');$('layout-message').textContent=error.message||'画像を作成できませんでした。';$('layout-warning').hidden=false;}
}
function update(data,delay=80){model={...data,template:selectedTemplate};revision++;invalidate();$('certificate-canvas').setAttribute('aria-busy','true');status('認定書を作成しています…');clearTimeout(timer);const version=revision;timer=setTimeout(()=>draw(version),delay);}
function showSave(){if(!png)return;$('saved-image').src=pngUrl;$('download-png').href=pngUrl;$('download-png').download='purchase-certificate-'+model.number+'.png';$('save-panel').hidden=false;$('save-panel').scrollIntoView({block:'nearest',behavior:'auto'});status('PNGを用意しました。ダウンロード、または下の画像を長押しして保存してください。');}
C.templates.forEach(t=>{
 const button=$('template-'+t.id);
 button.setAttribute('aria-pressed',String(t.id===selectedTemplate));
 button.addEventListener('click',()=>{
  if(selectedTemplate===t.id)return;
  selectedTemplate=t.id;
  C.templates.forEach(option=>$('template-'+option.id).setAttribute('aria-pressed',String(option.id===selectedTemplate)));
  if(model)update(model,0);
 });
});
const hero=$('hero-brush');if(hero?.getContext)C.renderHeroBrush(hero);
$('save-png').addEventListener('click',showSave);
$('close-save').addEventListener('click',()=>{$('save-panel').hidden=true;$('save-png').focus();});
root.IiwakeCertificateUI={update};
})(globalThis);
