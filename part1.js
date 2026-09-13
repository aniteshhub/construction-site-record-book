
// ===== DATA =====
var DB={project:{companyName:'MAA SHARDA CONSTRUCTIONS',subtitle:'ENGINEERS & CONTRACTORS',projectName:'',organization:'UPPCL',financialYear:'2026-2027',siteLocation:'',subContractors:''},attendance:[],contract:[],morang:[],cement:[],bricks:[],wiring:[],plumbing:[],carpenter:[],tilesMarble:[],painting:[],expenses:[],notes:''};
var meta={morangSite:'',morangPeriod:'',cementSite:'',cementPeriod:'',bricksSite:'',bricksPeriod:'',expensesSite:'',expensesPeriod:'',attSite:''};
var API_URL='',isOnline=false,syncTimer=null;

function loadData(){try{var s=localStorage.getItem('conSiteRecordBook');if(s){var p=JSON.parse(s);DB=Object.assign(DB,p.db||{});meta=Object.assign(meta,p.meta||{});}API_URL=localStorage.getItem('conApiUrl')||'';}catch(e){}}
function saveDataLocal(){saveMeta();localStorage.setItem('conSiteRecordBook',JSON.stringify({db:DB,meta:meta}));}
function saveMeta(){meta.morangSite=val('morangSite');meta.morangPeriod=val('morangPeriod');meta.cementSite=val('cementSite');meta.cementPeriod=val('cementPeriod');meta.bricksSite=val('bricksSite');meta.bricksPeriod=val('bricksPeriod');meta.expensesSite=val('expensesSite');meta.expensesPeriod=val('expensesPeriod');meta.attSite=val('attSite');}
function saveData(){saveDataLocal();scheduleSync();}
function val(id){var el=document.getElementById(id);return el?el.value:'';}
function setVal(id,v){var el=document.getElementById(id);if(el)el.value=v||'';}
function genId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5);}
function fmtNum(n){return Number(n||0).toLocaleString('en-IN');}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function fmtDate(s){if(!s)return'';var d=new Date(s+'T00:00:00');return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
function fmtDateLong(s){if(!s)return'';var d=new Date(s+'T00:00:00');var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];return days[d.getDay()]+', '+d.getDate()+' '+m[d.getMonth()]+' '+d.getFullYear();}
function escapeHtml(t){var d=document.createElement('div');d.textContent=t||'';return d.innerHTML;}

// ===== SYNC =====
function scheduleSync(){if(syncTimer)clearTimeout(syncTimer);syncTimer=setTimeout(syncToServer,2000);}
function setSync(status,msg){var dot=document.getElementById('syncDot');var info=document.getElementById('syncInfo');dot.className='sync-dot '+status;isOnline=status==='online';if(info)info.textContent=msg||'';}
function syncToServer(){
  if(!API_URL){setSync('offline','Offline — data on phone only');return;}
  setSync('syncing','Syncing...');
  fetch(API_URL,{method:'POST',body:JSON.stringify({action:'replace',data:DB}),headers:{'Content-Type':'text/plain;charset=utf-8'}})
    .then(function(r){return r.json();})
    .then(function(r){if(r.success)setSync('online','Last synced: '+new Date().toLocaleTimeString('en-IN'));else setSync('offline','Error: '+(r.error||''));})
    .catch(function(e){setSync('offline','Will retry');});
}
function loadFromServer(cb){
  if(!API_URL){if(cb)cb(false);return;}
  setSync('syncing','Loading...');
  fetch(API_URL,{method:'GET'})
    .then(function(r){return r.json();})
    .then(function(r){
      if(r.success&&r.data){
        if(r.data.project)DB.project=Object.assign(DB.project,r.data.project);
        var tabs=['attendance','contract','morang','cement','bricks','wiring','plumbing','carpenter','tilesMarble','painting','expenses'];
        tabs.forEach(function(t){if(r.data[t]){DB[t]=r.data[t].map(function(item){if(t==='attendance'&&item.days&&typeof item.days==='string')item.days=item.days.split(',').map(function(d){return d==='true';});return item;});}});
        if(r.data.notes!==undefined)DB.notes=r.data.notes;
        saveDataLocal();setSync('online','Loaded: '+new Date().toLocaleTimeString('en-IN'));if(cb)cb(true);
      }else{setSync('offline','Load error');if(cb)cb(false);}
    })
    .catch(function(e){setSync('offline','Cannot reach server');if(cb)cb(false);});
}
function syncNow(){if(!API_URL){showToast('Set server URL in Settings');navTo('settings');return;}loadFromServer(function(ok){if(ok){syncToServer();showToast('Synced!');renderCurrent();}else showToast('Cannot reach server');});}
function forceLoadFromServer(){if(!API_URL){showToast('Set server URL in Settings');return;}loadFromServer(function(ok){if(ok){showToast('Loaded!');renderCurrent();}else showToast('Cannot reach server');});}
function renderCurrent(){renderSection(currentSection);}

// ===== SETUP =====
function connectServer(){var u=val('setupUrl').trim();if(!u){showToast('Paste the URL');return;}API_URL=u;localStorage.setItem('conApiUrl',u);document.getElementById('setupScreen').style.display='none';showToast('Connecting...');loadFromServer(function(ok){if(ok)showToast('Connected to Google!');renderDashboard();});}
function skipSetup(){document.getElementById('setupScreen').style.display='none';setSync('offline','Offline mode');renderDashboard();}
function updateApiUrl(){var u=val('settingsUrl').trim();if(!u){showToast('Enter URL');return;}API_URL=u;localStorage.setItem('conApiUrl',u);showToast('Updated!');loadFromServer(function(ok){if(ok)renderCurrent();});}

// ===== NAV =====
var currentSection='dashboard';
var navTitles={dashboard:'Dashboard',project:'Project Details',attendance:'Attendance',contract:'Contract Record',morang:'Morang & Gitti',cement:'Cement & TMT',bricks:'Bricks',wiring:'Electric Wiring',plumbing:'Plumbing',carpenter:'Carpenter',tiles:'Tiles & Marble',painting:'Painting',expenses:'Daily Expenses',summary:'Summary',notes:'Site Notes',print:'Print & Export',settings:'Settings'};
var navSubs={dashboard:'Overview',project:'Project information',attendance:'Worker attendance & wages',contract:'Contract work records',morang:'Morang & Gitti materials',cement:'Cement & TMT materials',bricks:'Bricks record',wiring:'Electrical wiring',plumbing:'Plumbing work',carpenter:'Carpentry work',tiles:'Tiles & Marble',painting:'Painting work',expenses:'Daily site expenses',summary:'Expenditure breakdown',notes:'Notes & observations',print:'Print and export',settings:'App settings'};

function navTo(s){
  currentSection=s;
  document.querySelectorAll('.section').forEach(function(x){x.classList.remove('active');});
  var el=document.getElementById('sec-'+s);if(el)el.classList.add('active');
  document.getElementById('pageTitle').textContent=navTitles[s]||'';
  document.getElementById('pageSub').textContent=navSubs[s]||'';
  document.querySelectorAll('.bn-item').forEach(function(x){x.classList.remove('active');});
  var bnMap={dashboard:0,attendance:1,summary:3};
  if(bnMap[s]!==undefined)document.querySelectorAll('.bn-item')[bnMap[s]].classList.add('active');
  renderSection(s);closeMenu();window.scrollTo(0,0);
  var fab=document.getElementById('fab');
  fab.style.display=(s==='dashboard'||s==='notes'||s==='summary'||s==='print'||s==='project'||s==='settings')?'none':'flex';
}

function renderSection(s){
  switch(s){
    case'dashboard':renderDashboard();break;
    case'project':renderProject();break;
    case'attendance':renderAttendance();break;
    case'contract':case'morang':case'cement':case'bricks':case'wiring':case'plumbing':case'carpenter':case'tiles':case'painting':case'expenses':renderTable(s);break;
    case'summary':renderSummary();break;
    case'notes':setVal('notesArea',DB.notes);break;
    case'settings':setVal('settingsUrl',API_URL);break;
  }
}

function openMenu(){document.getElementById('slideMenu').classList.add('open');document.getElementById('slideOverlay').classList.add('show');}
function closeMenu(){document.getElementById('slideMenu').classList.remove('open');document.getElementById('slideOverlay').classList.remove('show');}

// ===== DASHBOARD =====
function renderDashboard(){
  var tl=calcTotalLabour(),tb=sumArr(DB.bricks,'amount'),tm=sumArr(DB.morang,'amount'),tc=sumArr(DB.cement,'amount');
  var te=sumArr(DB.expenses,'amount'),tt=sumArr(DB.wiring,'amount')+sumArr(DB.plumbing,'amount')+sumArr(DB.carpenter,'amount')+sumArr(DB.tilesMarble,'amount')+sumArr(DB.painting,'amount');
  var tco=sumArr(DB.contract,'amount');
  var gt=tl+tb+tm+tc+te+tt+tco;
  document.getElementById('welcomeDate').textContent=fmtDateLong(todayStr());
  document.getElementById('grandTotal').textContent='₹'+fmtNum(gt);
  var cards=[
    {label:'Labour Wages',value:'₹'+fmtNum(tl),sub:DB.attendance.length+' workers',icon:'👥',cls:'green',sec:'attendance'},
    {label:'Contract Work',value:'₹'+fmtNum(tco),sub:DB.contract.length+' entries',icon:'📝',cls:'blue',sec:'contract'},
    {label:'Materials',value:'₹'+fmtNum(tb+tm+tc),sub:'Bricks+Morang+Cement',icon:'🧱',cls:'amber',sec:'morang'},
    {label:'Trade Work',value:'₹'+fmtNum(tt),sub:'5 categories',icon:'⚡',cls:'blue',sec:'wiring'},
    {label:'Expenses',value:'₹'+fmtNum(te),sub:DB.expenses.length+' entries',icon:'💵',cls:'amber',sec:'expenses'},
    {label:'Total Wages',value:'₹'+fmtNum(tl+tco),sub:'Labour+Contract',icon:'💰',cls:'green',sec:'summary'}
  ];
  document.getElementById('statGrid').innerHTML=cards.map(function(c){
    return '<div class="stat-card '+c.cls+'" onclick="navTo(\''+c.sec+'\')"><div class="sc-icon">'+c.icon+'</div><div class="sc-label">'+c.label+'</div><div class="sc-value">'+c.value+'</div><div class="sc-sub">'+c.sub+'</div></div>';
  }).join('');
}
function calcTotalLabour(){var t=0;DB.attendance.forEach(function(w){var d=w.days.filter(function(x){return x;}).length;t+=d*(w.rate||0);});return t;}
function sumArr(a,k){return a.reduce(function(s,e){return s+(parseFloat(e[k])||0);},0);}

// ===== PROJECT =====
function renderProject(){
  var p=DB.project;
  var view='<div class="pd-row"><div class="pd-key">Company</div><div class="pd-val">'+escapeHtml(p.companyName+' '+p.subtitle)+'</div></div>'+
    '<div class="pd-row"><div class="pd-key">Project</div><div class="pd-val">'+escapeHtml(p.projectName||'—')+'</div></div>'+
    '<div class="pd-row"><div class="pd-key">Organization</div><div class="pd-val">'+escapeHtml(p.organization||'—')+'</div></div>'+
    '<div class="pd-row"><div class="pd-key">Financial Year</div><div class="pd-val">'+escapeHtml(p.financialYear||'—')+'</div></div>'+
    '<div class="pd-row"><div class="pd-key">Site / Block</div><div class="pd-val">'+escapeHtml(p.siteLocation||'—')+'</div></div>'+
    '<div class="pd-row"><div class="pd-key">Sub Contractors</div><div class="pd-val">'+escapeHtml(p.subContractors||'—')+'</div></div>'+
    '<div style="margin-top:14px"><button class="btn btn-outline" onclick="editProject()">✏️ Edit Details</button></div>';
  document.getElementById('pdView').innerHTML=view;
}
function editProject(){
  var p=DB.project;
  var html='<div class="form-group"><label>Company Name</label><input type="text" id="pe-company" value="'+escapeHtml(p.companyName)+'"></div>'+
    '<div class="form-group"><label>Subtitle</label><input type="text" id="pe-subtitle" value="'+escapeHtml(p.subtitle)+'"></div>'+
    '<div class="form-group"><label>Project Name</label><textarea id="pe-project" rows="2">'+escapeHtml(p.projectName)+'</textarea></div>'+
    '<div class="form-group"><label>Organization</label><input type="text" id="pe-org" value="'+escapeHtml(p.organization)+'"></div>'+
    '<div class="form-group"><label>Financial Year</label><input type="text" id="pe-year" value="'+escapeHtml(p.financialYear)+'"></div>'+
    '<div class="form-group"><label>Site Location</label><input type="text" id="pe-site" value="'+escapeHtml(p.siteLocation)+'"></div>'+
    '<div class="form-group"><label>Sub Contractors</label><textarea id="pe-sub" rows="2">'+escapeHtml(p.subContractors)+'</textarea></div>'+
    '<div class="btn-row"><button class="btn btn-green" onclick="saveProject()">💾 Save</button><button class="btn btn-outline" onclick="renderProject();document.getElementById(\'pdView\').style.display=\'block\';document.getElementById(\'pdEdit\').style.display=\'none\'">Cancel</button></div>';
  document.getElementById('pdView').style.display='none';
  document.getElementById('pdEdit').innerHTML=html;
  document.getElementById('pdEdit').style.display='block';
}
function saveProject(){
  DB.project={companyName:val('pe-company'),subtitle:val('pe-subtitle'),projectName:val('pe-project'),organization:val('pe-org'),financialYear:val('pe-year'),siteLocation:val('pe-site'),subContractors:val('pe-sub')};
  saveData();document.getElementById('pdView').style.display='block';document.getElementById('pdEdit').style.display='none';renderProject();showToast('Saved & synced!');
}
