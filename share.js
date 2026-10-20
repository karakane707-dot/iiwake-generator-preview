(function(root){
'use strict';
const config=root.IiwakeSite,$=id=>document.getElementById(id);
let blob=null,number='',imageUrl='',busy=false,scrollState=null,demoPage=0;
function message(text){$('share-status').textContent=text;}
function clear(){blob=null;if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl='';$('share-preview').removeAttribute('src');$('ig-demo-image').removeAttribute('src');$('share-download').removeAttribute('href');$('share-native').disabled=true;}
function prepare(source){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const c=canvas.getContext('2d');c.drawImage(source,0,0);
 // 共有専用コピーの最下部余白にURLを追加。元のプレビュー・保存用canvasは変更しない。
 c.fillStyle='#faf9f4';c.fillRect(48,1895,984,23);c.fillStyle='#18274f';c.textAlign='center';c.textBaseline='middle';
 const credit=config.name+'  |  '+config.url;let size=18;c.font=size+'px sans-serif';while(c.measureText(credit).width>960&&size>10)c.font=(--size)+'px sans-serif';c.fillText(credit,540,1906);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('共有用PNGを作成できませんでした。')),'image/png'));
}
function set(value,id){clear();$('share-text-only').hidden=true;blob=value;number=id;imageUrl=URL.createObjectURL(blob);$('share-preview').src=imageUrl;$('ig-demo-image').src=imageUrl;$('share-download').href=imageUrl;$('share-download').download='purchase-certificate-'+number+'-share.png';$('share-native').disabled=false;}
function unlock(){if(!scrollState)return;const state=scrollState;scrollState=null;document.body.style.cssText=state.css;const style=document.documentElement.style,old=style.scrollBehavior;style.scrollBehavior='auto';root.scrollTo(state.x,state.y);$('share-png').focus({preventScroll:true});style.scrollBehavior=old;}
function open(){
 if(!blob||$('share-dialog').open)return;
 resetInstagram();$('share-save-area').hidden=true;$('share-url-copy').hidden=true;$('share-text-only').hidden=true;$('share-guide').textContent='共有先によって画像・文章・URLの一部が省略されます。送信前に内容をご確認ください。';message('');
 scrollState={x:root.scrollX,y:root.scrollY,css:document.body.style.cssText};Object.assign(document.body.style,{position:'fixed',top:-scrollState.y+'px',left:-scrollState.x+'px',width:'100%',overflow:'hidden'});
 try{$('share-dialog').showModal();$('share-dialog').scrollTop=0;}catch(e){unlock();message('共有画面を開けませんでした。もう一度お試しください。');}
}
function close(){$('share-dialog').close();unlock();}
function textData(){return {title:'購入正当化認定書',text:config.shareText+'\n'+config.url,url:config.url};}
async function nativeShare(target='other'){
 if(!blob||busy)return;
 if(!navigator.share){message('端末標準共有は利用できません。「画像を保存」と「URLをコピー」をご利用ください。');return;}
 const data=textData();
 let file,supported=false;
 try{file=new File([blob],'purchase-certificate-'+number+'.png',{type:'image/png'});supported=navigator.canShare? navigator.canShare({files:[file]}):true;}catch(_){}
 if(supported){data.files=[file];try{if(navigator.canShare&&!navigator.canShare(data))delete data.files;}catch(_){delete data.files;}}
 if(target==='instagram'&&!data.files){message('画像を保存して、Instagramのストーリーズで選択してください。URLはコピーしてリンクスタンプに手動で設定できます。');return;}
 busy=true;$('share-native').disabled=true;
 try{
  // タップからshare()までawaitを挟まず、端末のユーザー操作権限を維持。
  await navigator.share(data);
  message(data.files?'共有メニューでの操作が終了しました。共有先で画像とURLをご確認ください。':'この環境では画像を添付できないため、文章とURLを共有しました。画像は別途保存できます。');
 }catch(error){
  if(error.name==='AbortError'){message('');$('share-text-only').hidden=true;}
  else if(data.files){message('画像付き共有を開始できませんでした。下の「文章とURLのみを共有」、または画像保存をご利用ください。');$('share-text-only').hidden=false;}
  else message('共有できませんでした。サイトURLのコピーをご利用ください。');
 }finally{busy=false;$('share-native').disabled=!blob;}
}
$('share-png').addEventListener('click',open);
$('share-close').addEventListener('click',close);
$('share-native').addEventListener('click',()=>nativeShare());
$('share-dialog').addEventListener('close',()=>{if(!$('share-dialog').open)unlock();});
$('share-dialog').addEventListener('cancel',e=>{e.preventDefault();close();});
function resetInstagram(){
 $('share-menu').hidden=false;$('instagram-guide').hidden=true;$('share-title').textContent='認定書を共有';$('ig-copy-status').textContent='';
}
function preparation(){
 $('ig-preparation').hidden=false;$('ig-posting').hidden=true;$('share-save-area').hidden=true;$('share-url-copy').hidden=true;message('');$('share-dialog').scrollTop=0;$('ig-save').focus({preventScroll:true});
}
function demo(page){
 demoPage=Math.max(0,Math.min(2,page));
 for(let i=0;i<3;i++)$('ig-demo-'+i).hidden=i!==demoPage;
 $('ig-page').textContent=(demoPage+1)+' / 3';$('ig-prev').disabled=demoPage===0;$('ig-next').disabled=demoPage===2;
}
$('share-instagram').addEventListener('click',()=>{
 $('share-menu').hidden=true;$('instagram-guide').hidden=false;$('share-title').textContent='Instagram共有ガイド';$('share-text-only').hidden=true;preparation();
});
$('ig-back').addEventListener('click',()=>{resetInstagram();$('share-save-area').hidden=true;$('share-url-copy').hidden=true;message('');$('share-dialog').scrollTop=0;$('share-instagram').focus({preventScroll:true});});
$('ig-start-demo').addEventListener('click',()=>{
 $('ig-preparation').hidden=true;$('ig-posting').hidden=false;$('share-save-area').hidden=true;$('share-url-copy').hidden=true;message('');demo(0);$('share-dialog').scrollTop=0;$('ig-next').focus({preventScroll:true});
});
$('ig-prev').addEventListener('click',()=>demo(demoPage-1));
$('ig-next').addEventListener('click',()=>demo(demoPage+1));
$('ig-return-prep').addEventListener('click',preparation);
$('ig-demo-url').textContent=config.url;
function social(url,guide){message('');$('share-guide').textContent=guide;root.open(url,'_blank','noopener,noreferrer');}
$('share-facebook').addEventListener('click',()=>social('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(config.url),'FacebookでサイトURLを共有します。画像は自動添付されません。画像を保存して追加するか「その他のアプリで共有」をご利用ください。'));
$('share-x').addEventListener('click',()=>social('https://twitter.com/intent/tweet?text='+encodeURIComponent(config.shareText+'\n'+config.url),'Xの投稿画面に紹介文とURLを渡します。画像は保存して投稿画面に追加してください。'));
$('share-line').addEventListener('click',()=>social('https://line.me/R/share?text='+encodeURIComponent(config.shareText+'\n'+config.url),'LINEに紹介文とURLを渡します。画像も送る場合は「その他のアプリで共有」でLINEを選ぶか、保存した画像をトークに追加してください。'));
function showSave(){if(!blob)return;$('share-save-area').hidden=false;message('下のダウンロード、または画像の長押しで保存してください。保存後はサイトURLもコピーしてください。');$('share-download').focus();}
$('share-save').addEventListener('click',showSave);
$('ig-save').addEventListener('click',showSave);
$('share-text-only').addEventListener('click',async()=>{
 if(busy||!navigator.share)return;busy=true;
 try{const data=textData();await navigator.share(data);message('文章とURLの共有メニューでの操作が終了しました。');}
 catch(e){message(e.name==='AbortError'?'共有をキャンセルしました。':'共有できませんでした。サイトURLをコピーしてください。');}finally{busy=false;}
});
async function copyUrl(){
 try{await navigator.clipboard.writeText(config.url);message('URLをコピーしました');$('ig-copy-status').textContent='URLをコピーしました';$('share-url-copy').hidden=true;}
 catch(_){$('ig-copy-status').textContent='URLを長押ししてコピーしてください。';$('share-url-copy').hidden=false;$('share-url-copy').focus();$('share-url-copy').select();message('URLを長押ししてコピーしてください。');}
}
$('share-copy').addEventListener('click',copyUrl);
$('ig-copy').addEventListener('click',copyUrl);
$('share-url-copy').value=config.url;
root.IiwakeShare={prepare,set,clear,open};
})(globalThis);
