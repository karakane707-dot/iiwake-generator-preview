(function(root){
'use strict';
const config=root.IiwakeSite,$=id=>document.getElementById(id);
let blob=null,number='',imageUrl='',busy=false;
function message(text){$('share-status').textContent=text;}
function clear(){blob=null;if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl='';$('share-preview').removeAttribute('src');$('share-download').removeAttribute('href');$('share-native').disabled=true;}
function prepare(source){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const c=canvas.getContext('2d');c.drawImage(source,0,0);
 // 共有専用コピーの最下部余白にURLを追加。元のプレビュー・保存用canvasは変更しない。
 c.fillStyle='#faf9f4';c.fillRect(48,1895,984,23);c.fillStyle='#18274f';c.textAlign='center';c.textBaseline='middle';
 let size=18;c.font=size+'px sans-serif';while(c.measureText(config.url).width>960&&size>10)c.font=(--size)+'px sans-serif';c.fillText(config.url,540,1906);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('共有用PNGを作成できませんでした。')),'image/png'));
}
function set(value,id){clear();$('share-text-only').hidden=true;blob=value;number=id;imageUrl=URL.createObjectURL(blob);$('share-preview').src=imageUrl;$('share-download').href=imageUrl;$('share-download').download='purchase-certificate-'+number+'-share.png';$('share-native').disabled=false;}
function open(){if(!blob)return;message('共有先によって画像・文章・URLの一部が省略されます。送信前に内容をご確認ください。');$('share-dialog').showModal();}
function close(){$('share-dialog').close();$('share-png').focus();}
async function nativeShare(){
 if(!blob||busy)return;
 if(!navigator.share){message('端末標準共有は利用できません。「画像を保存」と「サイトURLをコピー」をご利用ください。');return;}
 const data={title:'購入正当化認定書',text:config.shareText+'\n'+config.url};
 if($('share-url-field').checked)data.url=config.url;
 let file,supported=false;
 try{file=new File([blob],'purchase-certificate-'+number+'.png',{type:'image/png'});supported=navigator.canShare? navigator.canShare({files:[file]}):true;}catch(_){}
 if(supported){data.files=[file];try{if(navigator.canShare&&!navigator.canShare(data))delete data.files;}catch(_){delete data.files;}}
 busy=true;$('share-native').disabled=true;
 try{
  // タップからshare()までawaitを挟まず、端末のユーザー操作権限を維持。
  await navigator.share(data);
  message(data.files?'共有メニューでの操作が終了しました。共有先で画像とURLをご確認ください。':'この環境では画像を添付できないため、文章とURLを共有しました。画像は別途保存できます。');
 }catch(error){
  if(error.name==='AbortError')message('共有をキャンセルしました。');
  else if(data.files){message('画像付き共有を開始できませんでした。下の「文章とURLのみを共有」、または画像保存をご利用ください。');$('share-text-only').hidden=false;}
  else message('共有できませんでした。サイトURLのコピーをご利用ください。');
 }finally{busy=false;$('share-native').disabled=!blob;}
}
$('share-png').addEventListener('click',open);
$('share-close').addEventListener('click',close);
$('share-native').addEventListener('click',nativeShare);
$('share-text-only').addEventListener('click',async()=>{
 if(busy||!navigator.share)return;busy=true;
 try{const data={text:config.shareText+'\n'+config.url};if($('share-url-field').checked)data.url=config.url;await navigator.share(data);message('文章とURLの共有メニューでの操作が終了しました。');}
 catch(e){message(e.name==='AbortError'?'共有をキャンセルしました。':'共有できませんでした。サイトURLをコピーしてください。');}finally{busy=false;}
});
$('share-copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(config.url);message('サイトURLをコピーしました。');}
 catch(_){$('share-url-copy').hidden=false;$('share-url-copy').focus();$('share-url-copy').select();message('URLを長押ししてコピーしてください。');}
});
$('share-url-copy').value=config.url;
root.IiwakeShare={prepare,set,clear,open};
})(globalThis);
