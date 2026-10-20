(function(root){
'use strict';
const config=root.IiwakeSite,$=id=>document.getElementById(id);
let file=null,blob=null,number='',imageUrl='',busy=false,scrollState=null,socialTarget='';
function message(text){$('share-status').textContent=text;}
function clear(){file=null;blob=null;if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl='';$('share-preview').removeAttribute('src');$('ig-demo-image').removeAttribute('src');$('share-download').removeAttribute('href');$('share-native').disabled=true;}
function prepare(source){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const c=canvas.getContext('2d');c.drawImage(source,0,0);
 // 共有専用コピーの最下部余白にURLを追加。元のプレビュー・保存用canvasは変更しない。
 c.fillStyle='#faf9f4';c.fillRect(48,1895,984,23);c.fillStyle='#18274f';c.textAlign='center';c.textBaseline='middle';
 const credit=config.name+'  |  '+config.url;let size=18;c.font=size+'px sans-serif';while(c.measureText(credit).width>960&&size>10)c.font=(--size)+'px sans-serif';c.fillText(credit,540,1906);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('共有用PNGを作成できませんでした。')),'image/png'));
}
function set(value,id){clear();blob=value;number=id;try{file=new File([blob],'purchase-certificate-'+number+'.png',{type:'image/png'});}catch(_){file=null;}imageUrl=URL.createObjectURL(blob);$('share-preview').src=imageUrl;$('ig-demo-image').src=imageUrl;$('share-download').href=imageUrl;$('share-download').download='purchase-certificate-'+number+'-share.png';$('share-native').disabled=false;}
function unlock(){if(!scrollState)return;const state=scrollState;scrollState=null;document.body.style.cssText=state.css;const style=document.documentElement.style,old=style.scrollBehavior;style.scrollBehavior='auto';root.scrollTo(state.x,state.y);$('share-png').focus({preventScroll:true});style.scrollBehavior=old;}
function open(){
 if(!blob||$('share-dialog').open)return;
 resetInstagram();$('share-save-area').hidden=true;$('share-url-copy').hidden=true;$('share-guide').textContent='次の共有メニューでアプリを選択してください。画像・文章・URLの受け取り方は共有先によって異なります。';message('');
 scrollState={x:root.scrollX,y:root.scrollY,css:document.body.style.cssText};Object.assign(document.body.style,{position:'fixed',top:-scrollState.y+'px',left:-scrollState.x+'px',width:'100%',overflow:'hidden'});
 try{$('share-dialog').showModal();$('share-dialog').scrollTop=0;}catch(e){unlock();message('共有画面を開けませんでした。もう一度お試しください。');}
}
function close(){$('share-dialog').close();unlock();}
function textData(){return {title:'購入正当化認定書',text:config.shareText+'\n'+config.url,url:config.url};}
function imageData(){
 if(!file||!navigator.share||!navigator.canShare)return null;
 try{
  const files=[file];
  if(!navigator.canShare({files}))return null;
  const data={...textData(),files};
  return navigator.canShare(data)?data:{files};
 }catch(_){return null;}
}
function saveFallback(text){social(socialTarget||'other');message(text+' 画像を保存し、紹介文とURLをコピーして、投稿先で画像を選んでください。');}
async function nativeShare(target=socialTarget||'other'){
 if(!blob||busy)return;
 socialTarget=target;message('');$('share-save-area').hidden=true;$('share-url-copy').hidden=true;
 const data=imageData();
 if(!data){saveFallback('この環境では画像ファイル共有への対応を確認できません。');return;}
 busy=true;$('share-native').disabled=true;$('social-native').disabled=true;
 try{
  // ユーザーのタップからawaitを挟まず呼ぶ。画像を外した共有には切り替えない。
  await navigator.share(data);
  if(!data.text){$('share-copy').hidden=false;}
  message('共有メニューでの操作が終了しました。投稿完了は確認できません。'+(data.text?'投稿先で認定書画像・文章・URLをご確認ください。':'画像のみを渡しました。紹介文とURLはコピーして投稿先で貼り付けてください。'));
 }catch(error){
  if(error.name==='AbortError')message('');
  else saveFallback('画像共有を開始できませんでした。');
 }finally{busy=false;$('share-native').disabled=!blob;$('social-native').disabled=!blob;}
}
$('share-png').addEventListener('click',open);
$('share-close').addEventListener('click',close);
$('share-native').addEventListener('click',()=>nativeShare('other'));
$('share-dialog').addEventListener('close',()=>{if(!$('share-dialog').open)unlock();});
$('share-dialog').addEventListener('cancel',e=>{e.preventDefault();close();});
function resetInstagram(){
 socialTarget='';$('share-copy').hidden=true;$('social-guide').hidden=true;$('social-copy-status').textContent='';$('share-menu').hidden=false;$('instagram-guide').hidden=true;$('share-title').textContent='認定書を共有';$('ig-copy-status').textContent='';
}
$('share-instagram-guide').addEventListener('click',()=>{
 $('social-guide').hidden=true;
 $('share-menu').hidden=true;$('instagram-guide').hidden=false;$('share-title').textContent='Instagramで共有する';
 $('share-save-area').hidden=true;$('share-url-copy').hidden=true;message('');$('share-dialog').scrollTop=0;$('ig-save').focus({preventScroll:true});
});
$('ig-back').addEventListener('click',()=>{resetInstagram();$('share-save-area').hidden=true;$('share-url-copy').hidden=true;message('');$('share-dialog').scrollTop=0;$('share-instagram').focus({preventScroll:true});});
const socialNames={instagram:'Instagram',facebook:'Facebook',x:'X',line:'LINE',other:'アプリ'};
function social(target){
 socialTarget=target;const name=socialNames[target];
 $('share-menu').hidden=true;$('instagram-guide').hidden=true;$('social-guide').hidden=false;$('share-title').textContent=name+'で画像を共有';
 $('share-save-area').hidden=true;$('share-url-copy').hidden=true;$('social-copy-status').textContent='';message('');
 $('social-native').hidden=true;
 $('social-capability').textContent='画像の直接共有を開始できないため、保存して投稿する方法をご案内します。';
 $('social-steps').textContent=target==='line'?'③ LINEを開く → トークで保存した画像を選ぶ → 紹介文・URLを貼り付けて送信。':target==='facebook'?'③ Facebookを開く → 投稿作成で写真を選ぶ → 紹介文・URLを貼り付けて投稿。':target==='x'?'③ Xの投稿画面を開く → 保存した認定書画像を追加 → 紹介文・URLを確認して投稿。':target==='instagram'?'③ Instagramを開く → ストーリーズで保存した画像を選ぶ。詳しい操作はInstagram投稿ガイドをご覧ください。':'③ 投稿先のアプリを開き、保存した認定書画像を選択して、紹介文・URLを貼り付けてください。';
 $('social-open').hidden=!['facebook','x'].includes(target);$('social-open').textContent='準備後に'+name+(target==='x'?'の投稿画面を開く':'を開く');
 $('share-dialog').scrollTop=0;$('social-save').focus({preventScroll:true});
}
for(const target of ['instagram','facebook','x','line'])$('share-'+target).addEventListener('click',()=>nativeShare(target));
$('social-native').addEventListener('click',()=>nativeShare());
$('social-back').addEventListener('click',()=>{const target=socialTarget;resetInstagram();$('share-save-area').hidden=true;$('share-url-copy').hidden=true;message('');$(target==='other'?'share-native':'share-'+target).focus({preventScroll:true});});
$('social-open').addEventListener('click',()=>{
 if(socialTarget==='x')root.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(textData().text),'_blank','noopener,noreferrer');
 else if(socialTarget==='facebook')root.open('https://www.facebook.com/','_blank','noopener,noreferrer');
});
function showSave(){if(!blob)return;$('share-save-area').hidden=false;message('下のダウンロード、または画像の長押しで保存してください。保存完了は写真アプリ等でご確認ください。投稿前に文章・URLもコピーしてください。');$('share-download').focus();}

$('ig-save').addEventListener('click',showSave);
$('social-save').addEventListener('click',showSave);
async function copyUrl(){
 $('share-url-copy').value=config.url;
 try{await navigator.clipboard.writeText(config.url);message('URLをコピーしました');$('ig-copy-status').textContent='URLをコピーしました';$('share-url-copy').hidden=true;}
 catch(_){$('ig-copy-status').textContent='URLを長押ししてコピーしてください。';$('share-url-copy').hidden=false;$('share-url-copy').focus();$('share-url-copy').select();message('URLを長押ししてコピーしてください。');}
}
async function copyPost(){
 const text=textData().text;$('share-url-copy').value=text;
 try{await navigator.clipboard.writeText(text);message('紹介文とURLをコピーしました');$('social-copy-status').textContent='紹介文とURLをコピーしました';$('share-url-copy').hidden=true;}
 catch(_){$('social-copy-status').textContent='下の文章を選択してコピーしてください。';$('share-url-copy').hidden=false;$('share-url-copy').focus();$('share-url-copy').select();message('紹介文とURLを選択してコピーしてください。');}
}
$('share-copy').addEventListener('click',copyPost);
$('social-copy').addEventListener('click',copyPost);
$('ig-copy').addEventListener('click',copyUrl);
$('share-url-copy').value=config.url;
root.IiwakeShare={prepare,set,clear,open};
})(globalThis);
