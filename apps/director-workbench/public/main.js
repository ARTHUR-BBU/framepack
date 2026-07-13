const log = document.querySelector('#log'), status = document.querySelector('#status'), preview = document.querySelector('#preview');
const write = (value) => { log.textContent = JSON.stringify(value, null, 2); };
async function refresh(){ const data=await (await fetch('/api/project')).json(); document.querySelector('#title').textContent=data.spec.title; document.querySelector('#meta').textContent=`${data.spec.durationSeconds}s · ${data.spec.aspectRatio} · ${data.files.built ? 'Preview ready' : 'Draft'}`; status.textContent=data.files.handedOff?'Handed off':data.files.audited?'Review ready':'Director active'; if(data.files.built) preview.src='/preview/'; }
async function post(url, body){ const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); const data=await response.json(); if(!response.ok) throw new Error(data.error); write(data); await refresh(); }
document.querySelectorAll('[data-job]').forEach((button)=>button.addEventListener('click',async()=>{ try{await post('/api/jobs',{job:button.dataset.job});}catch(error){write({error:error.message});} }));
document.querySelector('#approve').addEventListener('click',()=>post('/api/approval',{state:'approved',reason:document.querySelector('#reason').value||'Approved in Director Workbench'}));
document.querySelector('#waive').addEventListener('click',()=>post('/api/approval',{state:'waived',reason:document.querySelector('#reason').value||'Waived in Director Workbench'}));
refresh().catch((error)=>write({error:error.message}));
