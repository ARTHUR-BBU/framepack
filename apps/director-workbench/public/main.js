import { hasStaleEvidence, resolvePhase } from './phase-state.js';

const $ = (selector) => document.querySelector(selector);
const phaseLabels = ['准备 Build','样片与证据','审片决定'];
const state = { project: null, assets: null, direction: null, storyboard: null, review: null, activeJob: null, activeJobName: null, previousBuild: null, events: null };

function write(value) { $('#log').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
async function get(path) { const response = await fetch(path); const value = await response.json(); if (!response.ok) throw new Error(value.error); return value; }
async function post(path, body) { const response = await fetch(path, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body) }); const value = await response.json(); if (!response.ok) throw new Error(value.error); return value; }

function render() {
  const project = state.project, spec = project?.spec;
  if (!project) return;
  $('#title').textContent = spec.title;
  $('#meta').textContent = `${spec.durationSeconds} 秒 · ${spec.aspectRatio} · ${spec.width}×${spec.height}`;
  $('#direction-copy').textContent = state.direction ? `${styleName(state.direction.primaryStyle)} × ${styleName(state.direction.supportingStyle)}。${state.direction.rationale}` : '方向仍在共创，请在当前 Codex 对话继续说明。';
  const index = resolvePhase(state);
  const area = index < 4 ? 0 : index < 7 ? 1 : 2;
  $('#phase').textContent = phaseLabels[area];
  document.querySelectorAll('.phase-nav span').forEach((node, i) => node.classList.toggle('active', i === area));
  setPrimaryAction(index);
  if (project.files.built) { $('#preview').src = '/preview/'; $('#empty-stage').hidden = true; }
  $('#stale').hidden = !hasStaleEvidence(project.currentBuild, project.decision, state.review?.subjective?.scorecard);
  $('#handoff-action').disabled = !project.decision || !$('#stale').hidden;
  renderAssets(); renderProvenance(); renderScenes(); renderReview();
}

function setPrimaryAction(index) {
  document.querySelectorAll('.primary').forEach((node) => node.classList.remove('primary'));
  const target = index < 4 ? '#build-action' : index === 4 ? '#snapshot-action' : index === 5 ? '#audit-action' : index < 8 ? '#approve' : null;
  if (target) $(target).classList.add('primary');
}

function renderScenes() {
  const scenes = state.storyboard?.scenes ?? [];
  if (!scenes.length) return;
  $('#scenes').innerHTML = scenes.map((scene, i) => `<li><span>${String(i+1).padStart(2,'0')} · ${scene.startSeconds.toFixed(1)}s</span><b>${escapeHtml(scene.title)}</b><small>${escapeHtml(scene.narrativeBeat)}</small></li>`).join('');
}

function renderAssets() {
  const assets = state.assets?.assets ?? [];
  const available = assets.filter((asset) => asset.status === 'available');
  const unconfirmed = available.filter((asset) => !asset.confirmed);
  $('#asset-copy').textContent = !available.length ? '尚无可用素材。请回到 Codex 补充产品图、视频、字体或品牌资料。' : `${available.length} 项素材可用；${unconfirmed.length ? `${unconfirmed.length} 项尚未确认场景归属。` : '全部已确认场景归属。'}`;
}

function renderProvenance() {
  const skills = state.project?.provenance?.skills?.loaded ?? [];
  const weapons = state.project?.provenance?.weapons?.selected ?? [];
  const skillLines = skills.map((item) => `技能 ${item.id} · ${item.sha256.slice(0,12)} · ${item.portablePath}`);
  const weaponLines = weapons.map((item) => `武器 ${item.weaponId} · ${item.entryHash.slice(0,12)} · 场景 ${item.sceneId}`);
  $('#provenance-copy').textContent = [...skillLines, ...weaponLines].join('\n') || '当前分镜使用经过 HyperFrames 约束的基础动作，没有额外武器调用。';
}

function renderReview() {
  const audit = state.review;
  if (!audit) { $('#review-copy').innerHTML = '<strong>等待第一版画面</strong><p>有了预览后，这里会说明技术质量、视觉口味和风险。</p>'; return; }
  const passed = audit.technical.status === 'pass';
  $('#review-copy').innerHTML = `<strong>${passed ? '技术骨架通过' : '技术问题需要处理'}</strong><p>${audit.taste.revisionNotes.map(escapeHtml).join('；')}</p>`;
  const score = audit.subjective?.scorecard?.scores;
  const coverage = audit.motionCoverage?.scenes?.map((scene) => `<div class="score-row"><span>${escapeHtml(scene.sceneId)} 动态覆盖</span><b>${Math.round(scene.coverageRatio * 100)}%</b></div>`).join('') ?? '';
  $('#scorecard').innerHTML = (score ? Object.entries(score).map(([key,value]) => `<div class="score-row"><span>${scoreName(key)}</span><b>${value}/5</b></div>`).join('') : '<div class="score-row"><span>主观口味审片</span><b>待确认</b></div>') + coverage;
}

async function refresh() {
  const [project, assets, direction, storyboard, review] = await Promise.all(['/api/project','/api/assets','/api/direction','/api/storyboard','/api/review'].map(get));
  const prior = state.project?.currentBuild;
  if (prior && project.currentBuild && prior.buildId !== project.currentBuild.buildId) state.previousBuild = { ...prior, title:state.project.spec.title, direction:state.direction };
  Object.assign(state, { project, assets:assets.data, direction:direction.data, storyboard:storyboard.data, review:review.data });
  $('#connection').classList.add('online'); $('#connection span').textContent = '本地引擎已连接'; $('#offline').hidden = true;
  render();
}

function connectEvents() {
  state.events?.close();
  const events = new EventSource('/api/events'); state.events = events;
  events.addEventListener('job.queued', (event) => { const job=JSON.parse(event.data).payload; state.activeJob = job.id; state.activeJobName = job.name; $('#cancel-job').hidden = false; write('任务已排队，可以取消。'); render(); });
  events.addEventListener('job.running', () => { $('#cancel-job').hidden = true; write('导演引擎正在工作…'); });
  for (const type of ['job.completed','job.failed','job.cancelled']) events.addEventListener(type, async (event) => { state.activeJob = null; state.activeJobName = null; $('#cancel-job').hidden = true; write(JSON.parse(event.data)); await refresh(); });
  events.onerror = () => { $('#connection').classList.remove('online'); $('#connection span').textContent = '连接已断开'; $('#offline').hidden = false; };
}

document.querySelectorAll('[data-job]').forEach((button) => button.addEventListener('click', async () => { try { const job = await post('/api/jobs', { job:button.dataset.job }); state.activeJob = job.id; write({提示:'任务已经排队',任务编号:job.id}); } catch (error) { write({错误:error.message}); } }));
$('#cancel-job').addEventListener('click', async () => { if (!state.activeJob) return; try { await post(`/api/jobs/${state.activeJob}/cancel`, {}); } catch (error) { write({错误:error.message}); } });
async function decide(stateName) { try { const proof = state.project?.currentBuild, reason=$('#reason').value.trim(); if (!proof) throw new Error('请先生成当前预览'); if (!reason) throw new Error('请写下这次决定的真实理由'); const result = await post('/api/decision', { state:stateName, reason, previewBuildId:proof.buildId, contentHash:proof.contentHash }); write(result); await refresh(); } catch (error) { write({错误:error.message}); } }
$('#approve').addEventListener('click', () => decide('approved'));
$('#waive').addEventListener('click', () => decide('waived'));
$('#retry').addEventListener('click', () => { refresh().then(connectEvents).catch((error) => write({错误:error.message})); });
$('#compare').addEventListener('click', compareBuilds);
document.querySelectorAll('[data-codex]').forEach((button) => button.addEventListener('click', () => write('请回到当前 Codex 对话，直接说出你想改变的风格、节奏或场景。')));

function scoreName(key) { return ({intentClarity:'意图清晰',productFocus:'产品聚焦',visualHierarchy:'视觉层级',materialQuality:'材质质量',motionChoreography:'动作编排',rhythm:'节奏',restraint:'克制'})[key] ?? key; }
function compareBuilds() { const current=state.project?.currentBuild, previous=state.previousBuild; write(!previous ? '当前会话还没有上一版构建。重新生成后，这里会保留前后两个真实构建编号。' : {对比:'当前版本 vs 上一版本',当前构建:current.buildId,上一构建:previous.buildId,内容是否变化:current.contentHash!==previous.contentHash}); }
function styleName(id) { return ({'swiss-pulse':'瑞士脉冲','velvet-standard':'丝绒标准','deconstructed':'解构编辑','maximalist-type':'极繁字势','data-drift':'数据漂移','soft-signal':'柔和信号','folk-frequency':'民艺频率','shadow-cut':'暗影剪辑'})[id] ?? id; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
refresh().then(connectEvents).catch((error) => { write({错误:error.message}); $('#offline').hidden = false; });
