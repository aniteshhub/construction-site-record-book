// ===== ATTENDANCE =====
function autoSetPeriod(){var d=new Date();var day=d.getDate();var el=document.getElementById('attPeriod');if(el)el.value=day<=15?'1':'2';}
function getAttDates(){
  var mv=val('attMonth');if(!mv){var d=new Date();mv=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');setVal('attMonth',mv);}
  var parts=mv.split('-');var y=parseInt(parts[0]);var m=parseInt(parts[1]);var period=val('attPeriod')||'1';
  var sd,ed;if(period==='1'){sd=1;ed=15;}else{sd=16;ed=new Date(y,m,0).getDate();}
  var dates=[];for(var d=sd;d<=ed;d++)dates.push(y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'));return dates;
}
function isToday(s){return s===todayStr();}
function attDays(w){return (w.days||[]).reduce(function(s,d){return s+(d===true?1:(parseFloat(d)||0));},0);}
function fmtDays(n){return String(Math.round((n||0)*100)/100);}
function renderAttendance(){
  setVal('attSite',meta.attSite);
  if(!val('attMonth')){var d=new Date();setVal('attMonth',d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
  autoSetPeriod();
  var dates=getAttDates();var todayIdx=-1;
  for(var i=0;i<dates.length;i++){if(isToday(dates[i])){todayIdx=i;break;}}
  var info='<div style="font-size:12px;color:var(--text3);margin-bottom:8px">📅 Today: <b>'+fmtDateLong(todayStr())+'</b> — blue column · Tap cell: <b>A → P → H</b> (H = Half day)</div>';
  if(todayIdx>=0)info+='<button class="btn-sm btn-blue" style="margin-bottom:10px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer" onclick="markAllToday()">✅ Mark All Present Today</button>';
  document.getElementById('attInfo').innerHTML=info;

  var html='<div class="att-grid-wrap"><table class="att-table"><thead><tr><th class="wname-h" style="min-width:90px;text-align:left">Worker</th>';
  dates.forEach(function(d,i){var day=parseInt(d.split('-')[2]);html+='<th'+(i===todayIdx?' class="today-col"':'')+'>'+day+'</th>';});
  html+='<th>Total</th><th>Rate</th><th>Wages</th><th>Adv</th><th>Bal</th></tr></thead><tbody>';

  if(DB.attendance.length===0){
    html+='<tr><td colspan="'+(dates.length+6)+'"><div class="empty"><div class="e-icon">👥</div><p>No workers yet</p><div class="e-hint">Tap "Add Worker"</div></div></td></tr>';
  }

  DB.attendance.forEach(function(w,idx){
    var pc=attDays(w);var wages=pc*(w.rate||0);var bal=wages-(w.advancePaid||0);
    html+='<tr><td class="wname">'+escapeHtml(w.name)+'</td>';
    for(var i=0;i<dates.length;i++){var v=w.days[i];v=(v===true?1:(parseFloat(v)||0));var cls=v===1?'present':(v===0.5?'half':'absent');var lbl=v===1?'P':(v===0.5?'H':'A');if(i===todayIdx)cls+=' today';html+='<td><div class="att-cell '+cls+'" onclick="toggleAtt('+idx+','+i+')">'+lbl+'</div></td>';}
    html+='<td style="font-weight:800">'+fmtDays(pc)+'</td>';
    html+='<td><input type="number" value="'+(w.rate||0)+'" style="width:50px;font-size:11px;padding:3px;border:1px solid var(--border);border-radius:4px;text-align:center" onchange="updateAtt('+idx+',\'rate\',this.value)"></td>';
    html+='<td style="font-weight:700">₹'+fmtNum(wages)+'</td>';
    html+='<td><input type="number" value="'+(w.advancePaid||0)+'" style="width:50px;font-size:11px;padding:3px;border:1px solid var(--border);border-radius:4px;text-align:center" onchange="updateAtt('+idx+',\'advancePaid\',this.value)"></td>';
    html+='<td style="font-weight:700;color:'+(bal<0?'var(--red)':'var(--green)')+'">₹'+fmtNum(bal)+'</td>';
    html+='</tr>';
  });

  if(DB.attendance.length>0){
    var td=0,tw=0,ta=0;DB.attendance.forEach(function(w){var d=attDays(w);td+=d;tw+=d*(w.rate||0);ta+=(w.advancePaid||0);});
    html+='<tr class="total-row"><td class="wname">TOTAL</td>';
    for(var i=0;i<dates.length;i++)html+='<td></td>';
    html+='<td>'+fmtDays(td)+'</td><td></td><td>₹'+fmtNum(tw)+'</td><td>₹'+fmtNum(ta)+'</td><td>₹'+fmtNum(tw-ta)+'</td></tr>';
  }
  html+='</tbody></table></div>';
  document.getElementById('attGrid').innerHTML=html;

  // Summary chips
  var sc='<div class="att-summary">';
  sc+='<div class="att-chip">👥 <b>'+DB.attendance.length+'</b> workers</div>';
  var td2=0;DB.attendance.forEach(function(w){td2+=attDays(w);});
  sc+='<div class="att-chip">✅ <b>'+fmtDays(td2)+'</b> present days</div>';
  sc+='<div class="att-chip">💰 <b>₹'+fmtNum(calcTotalLabour())+'</b> wages</div>';
  sc+='</div>';
  document.getElementById('attSummary').innerHTML=DB.attendance.length>0?sc:'';
}
function addWorker(){var name=prompt('Enter worker name:');if(!name)return;var dates=getAttDates();DB.attendance.push({id:genId(),name:name,days:new Array(dates.length).fill(0),rate:0,advancePaid:0});saveData();renderAttendance();showToast('Worker added!');}
function toggleAtt(wi,di){var c=DB.attendance[wi].days[di];c=(c===true?1:(parseFloat(c)||0));DB.attendance[wi].days[di]=(c===0)?1:(c===1?0.5:0);saveData();renderAttendance();}
function markAllToday(){var dates=getAttDates();var ti=-1;for(var i=0;i<dates.length;i++){if(isToday(dates[i])){ti=i;break;}}if(ti<0){showToast('Today not in period');return;}DB.attendance.forEach(function(w){w.days[ti]=1;});saveData();renderAttendance();showToast('All marked present!');}
function updateAtt(wi,f,v){DB.attendance[wi][f]=parseFloat(v)||0;saveData();renderAttendance();}
function deleteWorker(idx){if(!confirm('Delete '+DB.attendance[idx].name+'?'))return;DB.attendance.splice(idx,1);saveData();renderAttendance();showToast('Deleted');}

// ===== TABLES =====
var tblCfg={
  contract:{headers:['Date','Head Name','Workers','Description','Amount',''],fields:[{key:'date',type:'date'},{key:'headName',type:'text'},{key:'workers',type:'text'},{key:'description',type:'text'},{key:'amount',type:'number'}]},
  morang:{headers:['Date','Material','Qty','Rate','Amount',''],fields:[{key:'date',type:'date'},{key:'materialType',type:'text'},{key:'quantity',type:'number'},{key:'rate',type:'number'},{key:'amount',type:'number'}]},
  cement:{headers:['Date','Material','Qty','Rate','Amount','Dealer',''],fields:[{key:'date',type:'date'},{key:'materialType',type:'text'},{key:'quantity',type:'number'},{key:'rate',type:'number'},{key:'amount',type:'number'},{key:'dealerName',type:'text'}]},
  bricks:{headers:['Date','Quality','Qty','Receipt','Amount',''],fields:[{key:'date',type:'date'},{key:'quality',type:'text'},{key:'quantity',type:'text'},{key:'receiptNo',type:'text'},{key:'amount',type:'number'}]},
  wiring:{headers:['Date','Particular','Amount',''],fields:[{key:'date',type:'date'},{key:'particular',type:'text'},{key:'amount',type:'number'}]},
  plumbing:{headers:['Date','Particular','Amount',''],fields:[{key:'date',type:'date'},{key:'particular',type:'text'},{key:'amount',type:'number'}]},
  carpenter:{headers:['Date','Particular','Amount',''],fields:[{key:'date',type:'date'},{key:'particular',type:'text'},{key:'amount',type:'number'}]},
  tiles:{headers:['Date','Particular','Amount',''],fields:[{key:'date',type:'date'},{key:'particular',type:'text'},{key:'amount',type:'number'}]},
  painting:{headers:['Date','Particular','Amount',''],fields:[{key:'date',type:'date'},{key:'particular',type:'text'},{key:'amount',type:'number'}]},
  expenses:{headers:['Date','Description','Amount',''],fields:[{key:'date',type:'date'},{key:'description',type:'text'},{key:'amount',type:'number'}]}
};
var dbKeyMap={tiles:'tilesMarble'};
function getDBKey(s){return dbKeyMap[s]||s;}

function renderTable(section){
  var cfg=tblCfg[section];var data=DB[getDBKey(section)];
  if(section==='morang'){setVal('morangSite',meta.morangSite);setVal('morangPeriod',meta.morangPeriod);}
  if(section==='cement'){setVal('cementSite',meta.cementSite);setVal('cementPeriod',meta.cementPeriod);}
  if(section==='bricks'){setVal('bricksSite',meta.bricksSite);setVal('bricksPeriod',meta.bricksPeriod);}
  if(section==='expenses'){setVal('expensesSite',meta.expensesSite);setVal('expensesPeriod',meta.expensesPeriod);}
  var html='';
  html+='<button class="btn btn-green" style="margin-bottom:12px" onclick="openModal(\''+section+'\')">+ Add Entry</button>';
  if(data.length===0){html+='<div class="empty"><div class="e-icon">📋</div><p>No entries yet</p><div class="e-hint">Tap "Add Entry"</div></div>';}
  else{
    html+='<div class="tbl-scroll"><table><thead><tr>';
    cfg.headers.forEach(function(h){html+='<th>'+h+'</th>';});
    html+='</tr></thead><tbody>';
    data.forEach(function(item){
      html+='<tr>';
      cfg.fields.forEach(function(f){var v=item[f.key];if(f.type==='date')v=fmtDate(v);if(f.key==='amount')v='₹'+fmtNum(v);html+='<td>'+(v||'')+'</td>';});
      html+='<td><div class="tbl-actions"><button class="act-btn" onclick="editEntry(\''+section+'\',\''+item.id+'\')">✏️</button><button class="act-btn del" onclick="deleteEntry(\''+section+'\',\''+item.id+'\')">🗑️</button></div></td></tr>';
    });
    var total=sumArr(data,'amount');
    html+='<tr class="total-row"><td colspan="'+(cfg.fields.length-1)+'" style="text-align:right">TOTAL</td><td>₹'+fmtNum(total)+'</td><td></td></tr>';
    html+='</tbody></table></div>';
  }
  document.getElementById(section+'Table').innerHTML=html;
}

document.addEventListener('change',function(e){if(e.target.id&&meta.hasOwnProperty(e.target.id)){saveData();}});
