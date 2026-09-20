// ===== CUSTOM CODE RUNNER =====
// Yahan user apna JavaScript code paste karke app ke andar run kar sakta hai.
// AI (jaise ChatGPT/Claude/Copilot) se code likhwa ke yahan paste karo aur ▶ Run dabao.

function renderDevtools(){
  var code=document.getElementById('devCode');
  if(code&&!code.value){var saved=localStorage.getItem('conCustomCode');if(saved)code.value=saved;}
  var auto=document.getElementById('devAuto');
  if(auto)auto.checked=localStorage.getItem('conCustomAuto')==='1';
}

function devFmt(v){if(v&&typeof v==='object'){try{return JSON.stringify(v);}catch(e){return String(v);}}return String(v);}

function saveCustomCode(){
  var code=document.getElementById('devCode').value;
  localStorage.setItem('conCustomCode',code);
  var auto=document.getElementById('devAuto');
  localStorage.setItem('conCustomAuto',(auto&&auto.checked)?'1':'0');
  showToast('Code saved on this device!');
}

function runCustomCode(){
  var code=document.getElementById('devCode').value;
  var out=document.getElementById('devOutput');
  var logs=[];
  var oldLog=console.log;
  var done=false;
  console.log=function(){logs.push(Array.prototype.map.call(arguments,devFmt).join(' '));oldLog.apply(console,arguments);};
  function finish(err){
    if(done)return;done=true;
    console.log=oldLog;window.onerror=null;
    var html='<div style="padding:10px;border:1px solid '+(err?'#e74c3c':'#2ecc71')+';border-radius:8px;background:'+(err?'#fdecea':'#eafaf1')+';font-size:12px">';
    html+='<b>'+(err?'❌ Error':'✅ Ran successfully')+'</b> <span style="color:#888">— '+new Date().toLocaleTimeString('en-IN')+'</span>';
    if(logs.length){html+='<div style="margin-top:6px;font-family:monospace;white-space:pre-wrap">'+escapeHtml(logs.join('\n'))+'</div>';}
    if(err&&err!==true)html+='<div style="margin-top:6px;color:#c0392b;font-family:monospace">'+escapeHtml(err)+'</div>';
    html+='</div>';
    out.innerHTML=html;
    showToast(err?'Error — check output':'Code ran!');
  }
  window.onerror=function(m){finish(String(m));return true;};
  try{new Function(code);}catch(e){finish('⚠️ '+e.message);return;}
  try{
    var s=document.createElement('script');
    s.textContent=code;
    document.body.appendChild(s);
    setTimeout(function(){finish(false);},80);
  }catch(e){finish('⚠️ '+e.message);}
}

function devInsertExample(){
  document.getElementById('devCode').value="// Example: aaj ka chai-snacks expense add karo\nDB.expenses.push({id:genId(),date:todayStr(),description:'Chai & Snacks',amount:80});\nsaveData();\nrenderCurrent();\nshowToast('Expense added!');\nconsole.log('Total expenses ab:',sumArr(DB.expenses,'amount'));";
  showToast('Example load ho gaya — ab Run dabao');
}

// ===== AUTO-RUN SAVED CODE ON APP START =====
(function(){
  try{
    if(localStorage.getItem('conCustomAuto')==='1'){
      var c=localStorage.getItem('conCustomCode');
      if(c){var s=document.createElement('script');s.textContent=c;document.body.appendChild(s);}
    }
  }catch(e){}
})();
