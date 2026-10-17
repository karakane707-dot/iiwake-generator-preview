(function(){
'use strict';
const P=globalThis.IiwakePhrases,G=globalThis.IiwakeGenerator,$=id=>document.getElementById(id);
let submitted=null,lastGenerated='',photoUrl='',photoVersion=0,certificateNumber='';
P.categories.forEach((c,i)=>$('category').add(new Option(c[0],i)));
P.recipients.forEach((c,i)=>$('recipient').add(new Option(c,i)));
// 理由IDと文言は元のまま。表示グループのみ変更する。
const groups=[
 {name:'欲望・直感',ids:[0,1,2,3,4,5]},
 {name:'希少性・タイミング',ids:[6,7,8,9,10,11]},
 {name:'価格・お得感',ids:[12,13,14,15]},
 {name:'ご褒美・気分',ids:[16,17,18,19,20]},
 {name:'趣味・その他',ids:[21,22,23,24,25,26]}
];
const reasonBoxes=new Map(),groupViews=[];
const checked=()=>Array.from(reasonBoxes.values()).filter(box=>box.checked);
const reducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// キャンセル済みの閉じる処理が、再度開いたパネルを隠さないようにする。
function disclosure(button,panel,open){
 const height=panel.hidden?0:panel.getBoundingClientRect?.().height||0;
 panel._motion?.cancel();panel._motion=null;
 button.setAttribute('aria-expanded',String(open));panel.inert=!open;
 if(open)panel.hidden=false;
 if(reducedMotion()||!panel.animate){panel.hidden=!open;return;}
 const motion=panel.animate([{height:height+'px',opacity:open?0.4:1},{height:(open?panel.scrollHeight:0)+'px',opacity:open?1:0}],{duration:500,easing:'cubic-bezier(.22,.61,.36,1)'});
 panel._motion=motion;
 motion.onfinish=()=>{if(panel._motion!==motion)return;panel.hidden=!open;panel._motion=null;};
}
function toggleGroup(index){
 const open=groupViews[index].button.getAttribute('aria-expanded')!=='true';
 groupViews.forEach((view,i)=>{const active=i===index&&open;if((view.button.getAttribute('aria-expanded')==='true')!==active)disclosure(view.button,view.panel,active);});
}
$('edit-panel').hidden=true;
$('edit-toggle').addEventListener('click',()=>disclosure($('edit-toggle'),$('edit-panel'),$('edit-toggle').getAttribute('aria-expanded')!=='true'));
$('fix-overflow').addEventListener('click',()=>{disclosure($('edit-toggle'),$('edit-panel'),true);$('editable-text').focus();$('editable-text').scrollIntoView({block:'center',behavior:reducedMotion()?'auto':'smooth'});});
let pendingPreview=false;
globalThis.IiwakeCertificateUI.onReady=()=>{
 if(!pendingPreview)return;pendingPreview=false;
 const preview=$('certificate-canvas');if(globalThis.IiwakeMotion){globalThis.IiwakeMotion.present(preview);return;}preview.focus({preventScroll:true});
 preview.scrollIntoView({block:'start',behavior:reducedMotion()?'auto':'smooth'});
};
function beginGeneration(){
 pendingPreview=true;
 globalThis.IiwakeMotion?.begin();
}
let previousSelection=new Set();
function updateSelection(){
 const selected=checked();
 $('reason-count').textContent=selected.length+' / 3';
 $('selected-reasons').replaceChildren();
 if(!selected.length){const hint=document.createElement('p');hint.className='help';hint.textContent='選択した理由がここに表示されます。';$('selected-reasons').append(hint);}
 selected.forEach(box=>{
  const id=Number(box.value),chip=document.createElement('button');
  chip.type='button';chip.className='reason-chip';chip.textContent=P.reasons[id].label+' ×';
  chip.setAttribute('aria-label',P.reasons[id].label+'を選択解除');
  chip.addEventListener('click',()=>{
   const position=checked().findIndex(item=>item===box);box.checked=false;updateSelection();
   $('reason-message').textContent=P.reasons[id].label+'を解除しました。';
   const remaining=$('selected-reasons').children;
   if(checked().length)remaining[Math.min(position,remaining.length-1)].focus();
   else groupViews[groups.findIndex(group=>group.ids.includes(id))].button.focus();
  });
  $('selected-reasons').append(chip);
  if(!previousSelection.has(id))globalThis.IiwakeMotion?.chip(chip);
 });
 previousSelection=new Set(selected.map(box=>Number(box.value)));
 groupViews.forEach((view,i)=>{const count=groups[i].ids.filter(id=>reasonBoxes.get(id).checked).length;view.count.textContent=count?'選択 '+count:'';});
}
groups.forEach((group,index)=>{
 const section=document.createElement('div');section.className='reason-group';
 const heading=document.createElement('h3');heading.className='reason-group-heading';
 const button=document.createElement('button');button.type='button';button.id='reason-toggle-'+index;button.className='reason-group-toggle';
 button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','reason-panel-'+index);
 const title=document.createElement('span');title.textContent=group.name;
 const count=document.createElement('span');count.className='reason-group-count';
 const icon=document.createElement('span');icon.className='reason-group-icon';icon.textContent='＋';icon.setAttribute('aria-hidden','true');
 button.append(title,count,icon);heading.append(button);
 const panel=document.createElement('div');panel.id='reason-panel-'+index;panel.className='reason-list reason-group-panel';panel.hidden=true;
 panel.setAttribute('role','group');panel.setAttribute('aria-labelledby',button.id);
 group.ids.forEach(id=>{const r=P.reasons[id],label=document.createElement('label');label.className='reason-option';const box=document.createElement('input');box.type='checkbox';box.value=r.id;box.name='reason';reasonBoxes.set(id,box);label.append(box,document.createTextNode(r.label));panel.append(label);});
 button.addEventListener('click',()=>toggleGroup(index));section.append(heading,panel);$('reasons').append(section);groupViews.push({button,panel,count});
});
$('reasons').addEventListener('change',event=>{
 if(checked().length>3){event.target.checked=false;$('reason-message').textContent='購入理由は最大3つまで選べます。上の選択済み理由をタップすると解除できます。';}
 else $('reason-message').textContent='';
 updateSelection();
});
updateSelection();
function dirty(){return submitted&&$('editable-text').value!==lastGenerated;}
function approveReplace(){return !dirty()||window.confirm('編集した文章を新しい文章に置き換えますか？入力内容と写真は維持されます。');}
function renderCertificate(){if(submitted){$('cert-number').textContent='認定番号 '+certificateNumber;$('cert-reasons').textContent='購入理由 '+submitted.reasons.map(id=>P.reasons[id].label).join('、');}if(submitted)globalThis.IiwakeCertificateUI.update({...submitted,number:certificateNumber,text:$('editable-text').value,reasons:submitted.reasons.map(id=>P.reasons[id].label),photoUrl});}
function renderPhoto(){for(const id of ['photo-preview','cert-photo']){$(id).hidden=!photoUrl;if(photoUrl)$(id).src=photoUrl;else $(id).removeAttribute('src');}$('photo-wrap').hidden=!photoUrl;renderCertificate();}
function setPhoto(url){const old=photoUrl;photoUrl=url;renderPhoto();if(old)URL.revokeObjectURL(old);}
globalThis.IiwakeCrop.onCommit=url=>{setPhoto(url);$('form-message').textContent='写真の構図を反映しました。';};
$('photo').addEventListener('change',()=>{
 const version=++photoVersion,file=$('photo').files[0];if(!file)return;
 if(!file.type.startsWith('image/')||file.size>20*1024*1024){$('form-message').textContent='20MB以下の画像ファイルを選択してください。';$('photo').value='';return;}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{if(version!==photoVersion){URL.revokeObjectURL(url);return;}globalThis.IiwakeCrop.open(img,url);$('photo').value='';};
 img.onerror=()=>{URL.revokeObjectURL(url);if(version!==photoVersion)return;$('photo').value='';$('form-message').textContent='この画像を読み込めませんでした。JPEG・PNGなどの画像を選び直してください。';};img.src=url;
});
$('remove-photo').addEventListener('click',()=>{photoVersion++;globalThis.IiwakeCrop.clear();setPhoto('');$('photo').value='';$('form-message').textContent='写真を取り消しました。';});
function checkAmount(){const invalid=/[^0-9]/.test($('amount').value);$('amount-message').textContent=invalid?'半角数字のみで入力してください。全角数字・カンマ・記号・小数点は使用できません。':'';$('amount').setCustomValidity?.(invalid?'半角数字のみで入力してください':'');$('amount').setAttribute('aria-invalid',String(invalid));return !invalid;}
$('amount').addEventListener('input',checkAmount);
function renderText(){$('cert-text').textContent=$('editable-text').value;$('edit-status').textContent=dirty()?'編集中':'生成した文章';renderCertificate();}
function showGenerated(){beginGeneration();lastGenerated=G.generate(submitted,lastGenerated);$('editable-text').value=lastGenerated;$('cert-category').textContent=P.categories[submitted.category][0];$('cert-product').textContent=submitted.product;$('cert-amount').textContent='申告金額　¥'+submitted.amount.toLocaleString('ja-JP');$('empty-state').hidden=true;$('result').hidden=false;renderText();renderPhoto();}
$('purchase-form').addEventListener('submit',event=>{event.preventDefault();
 if(!checkAmount()){$('form-message').textContent=$('amount-message').textContent;return;}
 const input={category:Number($('category').value),product:$('product').value.trim(),amount:G.parseAmount($('amount').value),reasons:checked().map(el=>Number(el.value)),recipient:Number($('recipient').value)};
 try{G.validate(input);}catch(error){$('form-message').textContent=error.message;return;}
 if(!approveReplace())return;submitted=input;certificateNumber='PJ-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();showGenerated();$('form-message').textContent='認定文章を生成しました。内容を確認・編集できます。';
});
$('regenerate').addEventListener('click',()=>{if(!submitted||!approveReplace())return;showGenerated();$('form-message').textContent='同じ購入内容で、別の認定文章を生成しました。';});
$('editable-text').addEventListener('input',renderText);
})();
