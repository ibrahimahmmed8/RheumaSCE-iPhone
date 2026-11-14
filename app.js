'use strict';
let all=[],tab='home',session=null,searchTerm='';const $=id=>document.getElementById(id);const app=$('app');
const bookmarks=new Set(JSON.parse(localStorage.getItem('rheumasce_bookmarks')||'[]'));
const attempts=JSON.parse(localStorage.getItem('rheumasce_attempts')||'{}');
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeSave(){localStorage.setItem('rheumasce_bookmarks',JSON.stringify([...bookmarks]));localStorage.setItem('rheumasce_attempts',JSON.stringify(attempts));}
const itemCard=q=>`<div class="card click" data-open="${esc(q.id)}"><div class="pill">${esc(q.part)} · Question ${q.number} · ${esc(q.topic)}</div><div>${esc(q.question)}</div></div>`;
function openSession(items,mode='study'){if(!items.length)return;session={items,index:0,mode,chosen:{},revealed:{},finished:false};showSession();}
function randomList(n){const a=[...all];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n);}
function render(){if(session){showSession();return;} $('back').hidden=true;$('nav').hidden=false;document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));const answered=Object.keys(attempts).length;const correct=all.filter(q=>attempts[q.id]===q.correct).length;
 if(tab==='home'){app.innerHTML=`<h2>Learn. Practise. Improve.</h2><div class="stats"><div class="card"><div class="metric">${all.length}</div><small>Questions</small></div><div class="card"><div class="metric">${answered}</div><small>Attempted</small></div><div class="card"><div class="metric">${answered?Math.round(correct*100/answered)+'%':'—'}</div><small>Accuracy</small></div></div><h3>Start revision</h3><div class="card click" data-action="practice"><b>🩺 Quick practice · 10 questions</b><p class="muted">Random questions with immediate feedback</p></div><div class="card click" data-action="exam"><b>⏱ Mock exam · 25 questions</b><p class="muted">Answer first; see results at the end</p></div><div class="card click" data-action="all"><b>📖 Full question bank</b><p class="muted">Study every question in PDF order</p></div>`;}
 if(tab==='topics'){let t=new Map();all.forEach(q=>t.set(q.topic,(t.get(q.topic)||0)+1));app.innerHTML=`<h2>Topics</h2>${[...t].map(([x,n],i)=>`<div class="card click" data-topic="${i}"><b>${esc(x)}</b><div class="muted">${n} questions</div></div>`).join('')}`;}
 if(tab==='search'){app.innerHTML=`<h2>Search all questions</h2><input id="searchBox" placeholder="Search diseases, drugs, investigations…" autocomplete="off" value="${esc(searchTerm)}"><div id="results"></div>`;const box=$('searchBox');box.addEventListener('input',()=>{searchTerm=box.value;updateResults();});updateResults();}
 if(tab==='saved'){const list=all.filter(q=>bookmarks.has(q.id));app.innerHTML=`<h2>Saved questions (${list.length})</h2>${list.length?list.map(itemCard).join(''):'<div class="empty">Bookmark a question to save it here.</div>'}`;}
}
function updateResults(){let query=searchTerm.toLowerCase().trim();let results=query?all.filter(q=>[q.question,q.topic,q.explanation,...Object.values(q.options)].join(' ').toLowerCase().includes(query)).slice(0,150):[];$('results').innerHTML=query?`<p class="muted">${results.length}${results.length===150?'+':''} results</p>${results.map(itemCard).join('')}`:'<div class="empty">Type to find questions and explanations.</div>';}
function showSession(){const s=session; $('back').hidden=false;$('nav').hidden=true;if(s.finished){let correct=s.items.filter(q=>s.chosen[q.id]===q.correct).length;app.innerHTML=`<h2>Session complete</h2><div class="card" style="text-align:center"><div class="metric">${correct} / ${s.items.length}</div><h3>${Math.round(100*correct/s.items.length)}% correct</h3></div><div class="footer"><button data-action="review">Review answers</button><button class="primary" data-action="exit">Back to home</button></div>`;return;}
const q=s.items[s.index],picked=s.chosen[q.id],revealed=!!s.revealed[q.id],show=s.mode==='study'&&(revealed||!!picked);app.innerHTML=`<div class="row"><div class="pill">${esc(q.part)} · ${esc(q.topic)}</div><button aria-label="Bookmark" class="bookmark" data-action="bookmark">${bookmarks.has(q.id)?'★':'☆'}</button></div><p class="muted">Question ${s.index+1} of ${s.items.length} · PDF Q${q.number}</p><div class="progress"><div style="width:${100*(s.index+1)/s.items.length}%"></div></div><div class="question">${esc(q.question)}</div>${Object.entries(q.options).map(([letter,text])=>`<button class="option ${show&&letter===q.correct?'correct':''} ${show&&picked===letter&&picked!==q.correct?'wrong':''}" data-choice="${letter}" ${show?'disabled':''}><b>${letter}.</b> ${esc(text)} ${picked===letter?'●':''}</button>`).join('')}${show?`<div class="explanation"><b>Answer ${q.correct}: ${esc(q.options[q.correct])}</b><p>${esc(q.explanation)}</p></div>`:''}${!show&&s.mode==='study'?'<button data-action="reveal" class="ghost">Reveal answer</button>':''}<div class="footer"><button data-action="prev" ${s.index===0?'disabled':''}>← Previous</button><button class="primary" data-action="next">${s.index===s.items.length-1?'Finish':'Next →'}</button></div>`;}
app.addEventListener('click',e=>{const choice=e.target.closest('[data-choice]');if(choice&&session&&!session.revealed[session.items[session.index].id]){const q=session.items[session.index];session.chosen[q.id]=choice.dataset.choice;attempts[q.id]=choice.dataset.choice;safeSave();showSession();return;}
const item=e.target.closest('[data-open]');if(item){const q=all.find(q=>q.id===item.dataset.open);if(q)openSession([q]);return;}
const t=e.target.closest('[data-topic]');if(t){const topic=[...new Set(all.map(q=>q.topic))][Number(t.dataset.topic)];openSession(all.filter(q=>q.topic===topic));return;}
const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;if(a==='practice')openSession(randomList(10));if(a==='exam')openSession(randomList(25),'exam');if(a==='all')openSession(all);if(a==='exit'){session=null;tab='home';render();}if(a==='bookmark'){const id=session.items[session.index].id;if(bookmarks.has(id))bookmarks.delete(id);else bookmarks.add(id);safeSave();showSession();}if(a==='reveal'){session.revealed[session.items[session.index].id]=true;showSession();}if(a==='prev'){session.index=Math.max(0,session.index-1);showSession();}if(a==='next'){if(session.index+1===session.items.length){session.finished=true;}else session.index++;showSession();}if(a==='review'){session.finished=false;session.mode='study';session.index=0;session.items.forEach(q=>session.revealed[q.id]=true);showSession();}});
$('nav').addEventListener('click',e=>{const x=e.target.closest('[data-tab]');if(x){tab=x.dataset.tab;render();}});
$('back').addEventListener('click',()=>{session=null;render();});
fetch('questions.json').then(r=>{if(!r.ok)throw Error('Missing questions.json');return r.json();}).then(data=>{all=data;render();}).catch(err=>{app.textContent='Could not load questions. Serve this folder over HTTPS or a local development server. '+err.message;});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});

// Reading preferences are stored locally and do not alter the question bank.
(function initReaderPreferences(){
  const settings=$('reader-settings'),toggle=$('reader-toggle');
  const supported=new Set(['warm','white','dark']);
  let theme=localStorage.getItem('rheumasce_reader_theme')||'warm';
  if(!supported.has(theme))theme='warm';
  let scale=Number(localStorage.getItem('rheumasce_reader_scale')||'1');
  if(!Number.isFinite(scale))scale=1;
  scale=Math.min(1.4,Math.max(.9,scale));
  function apply(){document.body.dataset.theme=theme;document.documentElement.style.setProperty('--scale',scale.toFixed(2));localStorage.setItem('rheumasce_reader_theme',theme);localStorage.setItem('rheumasce_reader_scale',scale.toFixed(2));document.querySelectorAll('[data-reader-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readerTheme===theme)));}
  apply();
  toggle.addEventListener('click',()=>{settings.hidden=!settings.hidden;toggle.setAttribute('aria-expanded',String(!settings.hidden));});
  $('text-smaller').addEventListener('click',()=>{scale=Math.max(.9,Math.round((scale-.1)*10)/10);apply();});
  $('text-larger').addEventListener('click',()=>{scale=Math.min(1.4,Math.round((scale+.1)*10)/10);apply();});
  $('text-reset').addEventListener('click',()=>{scale=1;apply();});
  document.querySelectorAll('[data-reader-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.readerTheme;apply();settings.hidden=true;toggle.setAttribute('aria-expanded','false');}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){settings.hidden=true;toggle.setAttribute('aria-expanded','false');}});
})();
