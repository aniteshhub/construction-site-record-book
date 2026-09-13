// ===== MODAL =====
var editSec=null,editId=null;
function openModal(section,id){
  editSec=section;editId=id||null;
  var cfg=tblCfg[section];var data=id?DB[getDBKey(section)].find(function(e){return e.id===id;}):{};
  document.getElementById('sheetTitle').textContent=id?'Edit Entry':'Add '+navTitles[section];
  var body='';
  cfg.fields.forEach(function(f){
    var labels={headName:'Head Name',materialType:'Material Type',dealerName:'Dealer Name',receiptNo:'Receipt No.',particular:'Particular / Details',description:'Item / Description',quality:'Quality / Grade',quantity:'Quantity',rate:'Rate (₹)',amount:'Amount (₹)'};
    var lbl=labels[f.key]||f.key.charAt(0).toUpperCase()+f.key.slice(1);
    var v=data[f.key]||'';if(f.type==='date'&&!v)v=todayStr();
    var inpType=f.type==='date'?'date':(f.type==='number'?'number':'text');
    var extra=f.type==='number'?' step="any"':'';
    if(f.key==='amount'||f.key==='quantity'||f.key==='rate')extra+=' oninput="autoCalc()"';
    if(f.key==='description'||f.key==='particular'){body+='<div class="form-group"><label>'+lbl+'</label><textarea id="mf_'+f.key+'" rows="2">'+escapeHtml(v)+'</textarea></div>';}
    else{body+='<div class="form-group"><label>'+lbl+'</label><input type="'+inpType+'" id="mf_'+f.key+'" value="'+escapeHtml(v)+'"'+extra+'></div>';}
  });
  body+='<button class="btn btn-green" style="margin-top:8px" onclick="saveEntry()">💾 Save Entry</button>';
  document.getElementById('sheetBody').innerHTML=body;
  document.getElementById('modalBg').classList.add('show');
}
function autoCalc(){var q=parseFloat(document.getElementById('mf_quantity')?document.getElementById('mf_quantity').value:0);var r=parseFloat(document.getElementById('mf_rate')?document.getElementById('mf_rate').value:0);var a=document.getElementById('mf_amount');if(a&&q&&r)a.value=Math.round(q*r);}
function saveEntry(){
  var cfg=tblCfg[editSec];var data={};
  cfg.fields.forEach(function(f){var el=document.getElementById('mf_'+f.key);data[f.key]=el?el.value.trim():'';if(f.type==='number')data[f.key]=parseFloat(data[f.key])||0;});
  var dk=getDBKey(editSec);
  if(editId){var idx=DB[dk].findIndex(function(e){return e.id===editId;});if(idx!==-1){data.id=editId;DB[dk][idx]=data;}}
  else{data.id=genId();DB[dk].push(data);}
  saveData();closeModal();renderTable(editSec);showToast('Saved & synced!');
}
function editEntry(s,id){openModal(s,id);}
function deleteEntry(s,id){if(!confirm('Delete this entry?'))return;var dk=getDBKey(s);DB[dk]=DB[dk].filter(function(e){return e.id!==id;});saveData();renderTable(s);showToast('Deleted');}
function closeModal(){document.getElementById('modalBg').classList.remove('show');editSec=null;editId=null;}

// ===== FAB / QUICK ADD =====
function fabAction(){if(currentSection==='attendance')addWorker();else if(tblCfg[currentSection])openModal(currentSection);}
function quickAdd(){var opts=['attendance','contract','morang','cement','bricks','wiring','plumbing','carpenter','tiles','painting','expenses'];var labels=['👥 Attendance','📝 Contract','🪨 Morang & Gitti','🏗️ Cement & TMT','🧱 Bricks','⚡ Wiring','🔧 Plumbing','🪚 Carpenter','🟫 Tiles','🎨 Painting','💵 Expenses'];var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
opts.forEach(function(s,i){html+='<button class="btn btn-outline" style="font-size:13px;padding:12px 6px" onclick="navTo(\''+s+'\');closeModal()">'+labels[i]+'</button>';});
html+='</div>';
document.getElementById('sheetTitle').textContent='Add New Entry';
document.getElementById('sheetBody').innerHTML=html;
document.getElementById('modalBg').classList.add('show');
}

// ===== NOTES =====
function saveNotes(){DB.notes=val('notesArea');saveData();showToast('Notes saved!');}

// ===== SUMMARY =====
function renderSummary(){
  var mT=0,gT=0,cT=0,tT=0;
  DB.morang.forEach(function(e){var mt=(e.materialType||'').toLowerCase();if(mt.indexOf('gitti')!==-1)gT+=(e.amount||0);else mT+=(e.amount||0);});
  DB.cement.forEach(function(e){var mt=(e.materialType||'').toLowerCase();if(mt.indexOf('tmt')!==-1||mt.indexOf('sariya')!==-1)tT+=(e.amount||0);else cT+=(e.amount||0);});
  var cats=[['1. Total Labour',calcTotalLabour()],['2. Total Bricks',sumArr(DB.bricks,'amount')],['3. Total Morang',mT],['4. Gitti',gT],['5. TMT',tT],['6. Cement',cT],['7. Painting',sumArr(DB.painting,'amount')],['8. Wiring',sumArr(DB.wiring,'amount')],['9. Plumbing',sumArr(DB.plumbing,'amount')],['10. Tiles and Marble',sumArr(DB.tilesMarble,'amount')],['11. Iron (Chaukhats & Windows)',0],['12. Carpenter',sumArr(DB.carpenter,'amount')],['13. Boring',0],['14. Shuttering',0],['15. Personal Expenses',sumArr(DB.expenses,'amount')]];
  var total=cats.reduce(function(s,c){return s+c[1];},0);
  var html='<div class="tbl-scroll"><table class="sum-table"><thead><tr><th>Category</th><th style="text-align:right">Amount (₹)</th></tr></thead><tbody>';
  cats.forEach(function(c){html+='<tr><td>'+c[0]+'</td><td style="text-align:right;font-weight:700">'+fmtNum(c[1])+'</td></tr>';});
  html+='<tr class="sum-total"><td>TOTAL PROJECT COST</td><td style="text-align:right">₹'+fmtNum(total)+'</td></tr>';
  html+='</tbody></table></div>';
  document.getElementById('summaryTable').innerHTML=html;
}

// ===== EXPORT =====
function exportAllCSV(){
  var sections=['attendance','contract','morang','cement','bricks','wiring','plumbing','carpenter','tilesMarble','painting','expenses'];
  var csv='';
  sections.forEach(function(sec){var data=DB[sec];if(!data||!data.length)return;var cfg=tblCfg[sec==='tilesMarble'?'tiles':sec];if(!cfg)return;
    csv+='\n'+(navTitles[sec==='tilesMarble'?'tiles':sec]||sec)+'\n';
    csv+=cfg.fields.map(function(f){return f.key;}).join(',')+'\n';
    data.forEach(function(item){csv+=cfg.fields.map(function(f){var v=item[f.key]||'';return String(v).replace(/,/g,';').replace(/\n/g,' ');}).join(',')+'\n';});
  });
  downloadFile(csv,'construction_records_'+todayStr()+'.csv','text/csv');showToast('CSV exported!');
}
function exportJSON(){downloadFile(JSON.stringify({db:DB,meta:meta},null,2),'backup_'+todayStr()+'.json','application/json');showToast('Backup saved!');}
function importJSON(event){var f=event.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){try{var p=JSON.parse(e.target.result);if(p.db)DB=Object.assign(DB,p.db);if(p.meta)meta=Object.assign(meta,p.meta);saveData();navTo('dashboard');showToast('Imported!');}catch(err){showToast('Invalid file');}};r.readAsText(f);}
function clearAllData(){if(!confirm('Delete ALL data?'))return;if(!confirm('Are you absolutely sure?'))return;localStorage.removeItem('conSiteRecordBook');location.reload();}
function downloadFile(c,f,t){var b=new Blob([c],{type:t});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);}
