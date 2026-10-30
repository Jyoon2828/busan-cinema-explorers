(() => {
  'use strict';
  const DATA = window.CINEMA_DATA;
  const KEY = 'busan-cinema-explorers-v1';
  const STEPS = ['경험 나누기', '영화관 조사', '나란히 비교', '의미 찾기', '나의 기록'];
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const blankNote = () => ({feature:'', evidence:[], help:'', question:''});
  const fresh = () => ({version:1, step:0, cinema:'lotte', identity:'', group:'', memory:{together:'', dureraum:''}, notes:Object.fromEntries(DATA.map(c => [c.id,blankNote()])), compare:{same:'', different:''}, meaning:{missing:'', final:''}, visit:{observed:'', changed:''}, settings:{tripDate:'2026-11-26', className:'4학년 3반', movie:''}});
  function sanitize(input) {
    const out = fresh();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
    const str = (v, n=1000) => typeof v === 'string' ? v.slice(0,n) : '';
    out.identity=str(input.identity,60); out.group=str(input.group,2);
    for (const section of ['memory','compare','meaning','visit']) for (const key of Object.keys(out[section])) out[section][key]=str(input[section]?.[key]);
    if (input.settings && typeof input.settings==='object') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input.settings.tripDate || '') && !Number.isNaN(new Date(input.settings.tripDate+'T12:00:00').getTime())) out.settings.tripDate=input.settings.tripDate;
      out.settings.className=str(input.settings.className ?? out.settings.className,40);
      out.settings.movie=str(input.settings.movie,80);
    }
    for (const c of DATA) {
      const n = input.notes?.[c.id];
      if (!n || typeof n !== 'object') continue;
      for (const key of ['feature','help','question']) out.notes[c.id][key]=str(n[key]);
      if (Array.isArray(n.evidence)) out.notes[c.id].evidence=[...new Set(n.evidence.filter(id=>c.evidence.some(e=>e.id===id)))];
    }
    if (Number.isInteger(input.step) && input.step>=0 && input.step<STEPS.length) out.step=input.step;
    if (DATA.some(c=>c.id===input.cinema)) out.cinema=input.cinema;
    return out;
  }
  let storageOK=true, state=fresh(), currentEvidence=0, projection=false, hintOpen=false, savedTimer, toastTimer, lastFocus;
  try {const raw=localStorage.getItem(KEY); if(raw) state=sanitize(JSON.parse(raw));} catch {storageOK=false;}
  const getPath = path => path.split('.').reduce((o,k)=>o?.[k],state) ?? '';
  function setPath(path,value) {const parts=path.split('.');let obj=state;for(const key of parts.slice(0,-1))obj=obj[key];obj[parts.at(-1)]=value;}
  function save() {
    try {localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;} catch {storageOK=false;}
    const el=$('#saveState');
    el.textContent=storageOK?'이 기기에 저장됨':'임시 기록 · 파일로 저장하세요';
    clearTimeout(savedTimer);
    if(storageOK) savedTimer=setTimeout(()=>{el.textContent='이 기기에 저장';},1600);
  }
  const dateLabel = (long=false) => {
    const d=new Date(state.settings.tripDate+'T12:00:00');
    return long ? `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일(${['일','월','화','수','목','금','토'][d.getDay()]})` : `${d.getMonth()+1}월 ${d.getDate()}일`;
  };
  const cinema = id => DATA.find(c=>c.id===id);
  const progress = c => {const n=state.notes[c.id];return [!!n.feature.trim(),!!n.evidence.length,!!n.help.trim()].filter(Boolean).length;};
  const noteValue = (text,empty='아직 기록하지 않았어요.') => text.trim()?esc(text):`<span class="record-empty">${empty}</span>`;
  const tagClass = id => id==='lotte'?' warm':id==='corner'?' lilac':'';
  const field = (path,label,placeholder='',opts={}) => `<div class="field"><label class="prompt-label" for="field-${path.replaceAll('.','-')}">${label}</label><textarea id="field-${path.replaceAll('.','-')}" data-field="${path}" maxlength="${opts.max||700}" placeholder="${esc(placeholder)}"${opts.rows?` rows="${opts.rows}"`:''}>${esc(getPath(path))}</textarea>${opts.help?`<p class="help">${opts.help}</p>`:''}</div>`;
  const pageTop = (num,title,sub,actions='') => `<div class="page-top"><div><div class="eyebrow">OUR CINEMA JOURNEY · ${num}</div><h1>${title}</h1><p>${sub}</p></div>${actions}</div>`;
  function photo(src,alt,cls='') {return `<img class="${cls}" src="${src}" alt="${esc(alt)}" decoding="async">`;}
  function isComplete(i) {
    return [!!(state.memory.together.trim()||state.memory.dureraum.trim()),DATA.some(c=>progress(c)===3),!!(state.compare.same.trim()&&state.compare.different.trim()),!!state.meaning.final.trim(),false][i];
  }
  function render() {
    document.body.dataset.step=String(state.step);
    $('#tripChip').textContent=`${dateLabel()} · 롯데시네마 동래점`;
    $('#stepNav').innerHTML=STEPS.map((title,i)=>`<button class="step${state.step===i?' active':''}${isComplete(i)?' complete':''}" data-action="step" data-step="${i}" ${state.step===i?'aria-current="step"':''}><span class="step-number">${isComplete(i)&&state.step!==i?'✓':`0${i+1}`}</span><span>${title}</span></button>`).join('');
    $('#main').innerHTML=[memoryPage,researchPage,comparePage,meaningPage,reportPage][state.step]();
    $('#bottomBar').innerHTML=`<div class="bottom-left">${state.step>0?`<button class="btn secondary" data-action="step" data-step="${state.step-1}">← ${STEPS[state.step-1]}</button>`:'<span class="pill-note">우리의 경험에서 출발해요</span>'}<span class="bottom-hint">${['떠오르는 경험을 자유롭게 적어 보세요.','근거는 자료 아래의 ‘근거 담기’를 눌러 모아요.','서로 다른 영화관의 역할을 비교해요.','자료에서 찾은 사실과 나의 생각을 연결해요.','기록을 저장해 선생님이나 친구와 나눠요.'][state.step]}</span></div><div class="button-row">${state.step<4?`<button class="btn" data-action="step" data-step="${state.step+1}">${STEPS[state.step+1]} <span aria-hidden="true">→</span></button>`:'<button class="btn" data-action="download-png">기록 이미지 저장 ↓</button>'}</div>`;
    document.body.classList.toggle('projection',projection);
    $('#saveState').textContent=storageOK?'이 기기에 저장':'임시 기록 · 파일로 저장하세요';
  }
  function memoryPage() {
    const a=cinema('dureraum'),b=cinema('lotte');
    return pageTop('01','우리가 다녀온 곳, 함께 가 볼 곳','영화관에서 보낸 시간을 떠올리며 우리 지역의 영화관을 탐험해요.')+
      `<div class="memory-grid"><section class="journey-card surface"><div class="journey-title">우리 반의 영화관 여정</div><div class="journey-pair"><article class="journey-item">${photo(a.cover,a.coverAlt,'journey-image')}<div class="journey-body"><span class="tag">1학기에 다녀왔어요</span><h3>영화의전당</h3><p>어떤 모습과 활동이<br>기억에 남아 있나요?</p></div></article><article class="journey-item">${photo(b.cover,b.coverAlt,'journey-image')}<div class="journey-body"><span class="tag warm">${dateLabel()} 방문 예정</span><h3>롯데시네마 동래점</h3><p>친구들과 함께 갈 곳을<br>미리 살펴볼까요?</p></div></article></div><p class="photo-note">자료 사진으로 살펴보는 장소예요. 우리 반의 방문 당일 사진은 아니에요.</p></section><section class="memory-form surface" aria-label="경험 기록">${field('memory.together','<span class="n">01</span>함께 영화를 본 기억','누구와 무엇을 했나요? 함께 웃거나 이야기를 나눈 순간을 떠올려 보세요.',{help:'영화관에 가 본 적이 없다면 집이나 학교에서 함께 본 경험도 좋아요.'})}${field('memory.dureraum','<span class="n">02</span>1학기 영화의전당에서의 기억','직접 보았던 모습이나 해 보았던 활동은 무엇인가요?',{help:'기억이 잘 나지 않으면 친구의 이야기를 듣거나 사진을 살펴보세요.'})}</section></div><section class="big-question"><div><small>오늘 함께 생각할 질문</small><p>집에서도 영화를 볼 수 있는데,<br>우리 지역에는 왜 영화관이 있을까요?</p></div><span class="q" aria-hidden="true">?</span><button class="btn warm" data-action="step" data-step="1">조사하러 가기 →</button></section>`;
  }
  function researchPage() {
    const c=cinema(state.cinema),n=state.notes[c.id],e=c.evidence[currentEvidence];
    return pageTop('02','사진과 자료에서 특징을 찾아요','한 곳을 깊이 살펴본 뒤 다른 영화관과 비교해 보세요.',`<button class="btn secondary" data-action="sources">자료 출처 보기 ↗</button>`).replace('class="page-top"','class="page-top research-header"')+
      `<div class="research-layout"><aside class="cinema-list" aria-label="조사할 영화관">${DATA.map(t=>`<button class="cinema-button${t.id===c.id?' active':''}" data-action="cinema" data-cinema="${t.id}" ${t.id===c.id?'aria-pressed="true"':'aria-pressed="false"'}>${photo(t.cover,t.coverAlt)}<span class="body"><span class="tag${tagClass(t.id)}">${t.id==='lotte'?dateLabel()+' 방문 예정':t.badge}</span><strong>${t.short}</strong><span class="status" id="progress-${t.id}">${progress(t)===3?'✓ 조사 기록 완료':`기록 ${progress(t)} / 3`}</span></span></button>`).join('')}<p class="list-hint">같은 영화관을 조사해도<br>발견한 특징은 다를 수 있어요.</p></aside><section class="source-panel surface" aria-label="조사 자료"><div class="source-top"><div><span class="area">BUSAN · ${c.area}</span><h2>${c.name}</h2></div><button class="btn secondary" data-action="location">위치 보기 ↗</button></div><div class="evidence-tabs" role="tablist" aria-label="살펴볼 자료">${c.evidence.map((t,i)=>`<button class="evidence-tab${i===currentEvidence?' active':''}" role="tab" id="evidence-tab-${i}" aria-controls="evidence-panel" aria-selected="${i===currentEvidence}" data-action="evidence" data-index="${i}">자료 ${i+1} · ${t.kind==='photo'?'사진':t.kind==='location'?'교통':t.kind==='facts'?'안내':'읽기'}</button>`).join('')}</div><div role="tabpanel" id="evidence-panel" aria-labelledby="evidence-tab-${currentEvidence}">${evidenceMedia(e)}<div class="source-reading"><h3>${e.title}</h3><p>${e.text}</p>${e.word?`<p class="word-help">${e.word}</p>`:''}<div class="evidence-prompt">생각해 보기 · ${e.question}</div><div class="source-bottom"><span class="source-counter">${currentEvidence+1} / ${c.evidence.length}번째 자료</span><button class="btn ${n.evidence.includes(e.id)?'soft':''}" data-action="collect" data-evidence="${e.id}">${n.evidence.includes(e.id)?'✓ 근거에 담았어요':'＋ 이 자료를 근거로 담기'}</button></div><p class="source-credit">${e.credit?esc(e.credit)+'<br>':''}<a href="${c.sources[e.source].url}" target="_blank" rel="noopener noreferrer">자료 원문 · ${c.sources[e.source].name} ↗</a></p></div></div></section><aside class="notebook surface" aria-label="조사 기록장"><h3>나의 조사 기록장</h3><p class="notebook-intro">자료를 보고 찾은 것을 내 말로 적어요.</p>${field('notes.'+c.id+'.feature','① 내가 찾은 특징','어떤 공간이나 활동이 눈에 띄나요?') }<div class="field"><span class="prompt-label" id="evidenceLabel">② 특징을 확인한 근거</span><div class="evidence-selected" aria-labelledby="evidenceLabel">${evidenceTokens(c)}</div></div>${field('notes.'+c.id+'.help','③ 사람들에게 주는 도움','이 특징 덕분에 사람들은 무엇을 할 수 있나요?')}<div class="note-count" id="noteCount">${progress(c)} / 3 기록 · ${c.lookFor}</div></aside></div>`;
  }
  function evidenceMedia(e) {
    if(e.kind==='photo')return `<div class="media-frame" data-action="zoom">${photo(e.image,e.alt,'evidence-image')}<button class="zoom-button" data-action="zoom">사진 크게 보기 ⤢</button></div>`;
    if(e.kind==='facts')return `<div class="facts-media"><span class="number">${e.number}</span><div><strong>${e.unit}</strong><small>${e.sub}</small><div class="mini-screens" aria-hidden="true">▣ ▣ ▣</div></div></div>`;
    if(e.kind==='location')return `<div class="location-media"><span class="station-bubble" aria-hidden="true">1</span><div><p>${e.line}</p><h3>${e.station}</h3><p>롯데백화점 방향 연결 육교</p></div></div>`;
    return `<div class="reading-media"><span class="symbol" aria-hidden="true">${e.symbol}</span><div><small>공식 소개에서 읽어 봐요</small><h3>${e.title}</h3></div></div>`;
  }
  function evidenceTokens(c) {
    const ids=state.notes[c.id].evidence;
    return ids.length?ids.map(id=>`<span class="evidence-token"><span>${c.evidence.find(e=>e.id===id).title}</span><button data-action="remove-evidence" data-evidence="${id}" aria-label="${esc(c.evidence.find(e=>e.id===id).title)} 근거에서 빼기">×</button></span>`).join(''):'<span class="empty-evidence">자료 아래의 ‘근거 담기’를 누르세요.</span>';
  }
  function comparePage() {
    return pageTop('03','세 영화관을 나란히 살펴봐요','조사한 내용을 친구와 나누고, 공통점과 차이점을 찾아요.',`<button class="btn secondary" data-action="projection">${projection?'보통 크기로':'발표 화면 크게'} ⤢</button>`)+
      `<div class="compare-grid">${DATA.map(c=>{const n=state.notes[c.id];return `<article class="compare-card surface">${photo(c.cover,c.coverAlt)}<div class="body"><span class="tag${tagClass(c.id)}">${c.id==='lotte'?dateLabel()+' 방문 예정':c.badge}</span><h2>${c.name}</h2><div class="record-block"><span class="label">내가 찾은 특징</span><p>${noteValue(n.feature)}</p></div><div class="record-block"><span class="label">자료에서 확인한 근거</span><p>${n.evidence.length?n.evidence.map(id=>esc(c.evidence.find(e=>e.id===id).title)).join('<br>'):'<span class="record-empty">아직 담은 근거가 없어요.</span>'}</p></div><div class="record-block"><span class="label">사람들에게 주는 도움</span><p>${noteValue(n.help)}</p></div><button class="btn secondary" data-action="cinema" data-cinema="${c.id}">조사 기록 이어 쓰기 →</button></div></article>`;}).join('')}</div><div class="compare-questions"><section class="surface">${field('compare.same','영화관들의 공통점은 무엇인가요?','여러 영화관에서 사람들이 함께 할 수 있는 일을 생각해 보세요.')}</section><section class="surface">${field('compare.different','서로 다른 특징은 무엇인가요?','만날 수 있는 작품, 공간, 활동 등을 비교해 보세요.')}</section></div>`;
  }
  function meaningPage() {
    const picked=DATA.find(c=>progress(c)===3)||DATA.find(c=>state.notes[c.id].feature.trim());
    return pageTop('04','영화관이 우리 지역에 주는 것은?','자료에서 찾은 사실을 지역 사람들의 생활과 연결해 보세요.')+
      `<div class="meaning-layout"><section class="meaning-question"><div><span class="qmark" aria-hidden="true">“</span><span class="tag">생각을 넓히는 질문</span><h2 style="margin-top:16px">우리 지역에서<br>영화관이 사라진다면,<br>어떤 활동이 줄어들까요?</h2><p>영화를 보는 일, 함께하는 사람, 나누는 이야기를 떠올려 보세요.</p></div>${picked?`<div class="meaning-bridge"><span class="small">내가 찾은 사실에서 출발해요 · ${picked.name}</span><p>${esc(state.notes[picked.id].feature)}</p></div>`:''}</section><section class="meaning-form surface">${field('meaning.missing','① 영화관이 사라지면 달라질 일','누구에게 어떤 경험이나 기회가 줄어들까요?')}<div class="sentence-frame">문장 도움말<br>______에서는 ______을 할 수 있습니다.<br>그래서 지역 사람들이 ______하는 데 도움이 된다고 생각합니다.</div>${field('meaning.final','② 우리 지역 영화관의 의미','조사한 특징과 근거를 넣어 내 생각을 써 보세요.',{rows:4})}<button class="hint-toggle" data-action="hint" aria-expanded="${hintOpen}">${hintOpen?'생각 도움말 닫기 −':'생각이 잘 떠오르지 않을 때 ＋'}</button>${hintOpen?`<div class="hint-box"><ul><li>누구와 함께 시간을 보내고 추억을 만들 수 있나요?</li><li>어떤 새로운 이야기와 사람들의 삶을 만나나요?</li><li>서로의 느낌과 생각을 어떻게 나누나요?</li><li>영화와 관련해 무엇을 더 배우거나 경험하나요?</li></ul></div>`:''}</section></div><div class="meaning-definition"><strong>문화 공간이란?</strong><p>사람들이 함께 작품을 즐기고, 생각을 나누며, 새로운 것을 경험하는 곳이라고 생각해 볼 수 있어요.</p></div>`;
  }
  function reportPage() {
    const count=DATA.filter(c=>progress(c)===3).length;
    return pageTop('05','나의 영화관 탐험 기록','기록을 읽고 다듬은 뒤 파일로 저장해 나눠 보세요.',`<button class="btn secondary" data-action="identity">번호 · 이름 · 모둠 쓰기</button>`)+
      `<div class="report-layout"><div><article class="report-sheet surface">${reportHTML(false)}</article><section class="visit-box"><h3>${dateLabel()} 체험 뒤에도 이어 써요</h3><p>롯데시네마 동래점에 다녀온 뒤 실제로 관찰한 모습과 달라진 생각을 남겨 보세요.</p>${field('visit.observed','실제로 보거나 경험한 것','미리 조사했던 내용과 비교하며, 현장에서 직접 본 것을 써 보세요.')}${field('visit.changed','다녀온 뒤 새롭게 알게 된 영화관의 의미','친구들과 함께 영화를 보고 나니 어떤 생각이 드나요?')}</section></div><aside class="report-actions surface"><h3>나의 기록 저장하기</h3><span class="completion">영화관 ${count}곳 조사 완료 · 내 생각 ${state.meaning.final.trim()?'작성함':'작성 전'}</span><div class="button-row"><button class="btn" data-action="download-png">기록 이미지 저장 ↓</button><button class="btn secondary" data-action="print">인쇄 · PDF 저장</button><button class="btn secondary" data-action="copy">기록 글 복사</button></div><hr><p>작성한 내용은 이 기기의 이 브라우저에 저장돼요. 선생님께는 저장한 파일이나 복사한 글로 전달해요.</p><button class="btn soft" data-action="backup">이어 쓰기 파일 저장</button><button class="btn secondary" data-action="import">이어 쓰기 파일 열기</button><p class="small">다른 기기에서는 ‘이어 쓰기 파일’을 열어 계속 작성할 수 있어요.</p></aside></div>`;
  }
  function reportHTML(print=false) {
    const meta=[state.settings.className,state.group?state.group+'모둠':'',state.identity||'이름 미입력'].filter(Boolean).join(' · ');
    return `<p class="report-kicker">BUSAN CINEMA EXPLORERS</p><h2>우리 지역 영화관, 함께 발견한 의미</h2><div class="report-meta">${esc(meta)}<br>1학기 · 영화의전당 방문 &nbsp; / &nbsp; ${esc(dateLabel(true))} · 롯데시네마 동래점 체험${state.settings.movie?'<br>관람 영화 · '+esc(state.settings.movie):''}</div><section class="report-section"><h3>01 · 나의 경험</h3><span class="report-label">함께 영화를 본 기억</span><p>${noteValue(state.memory.together)}</p><span class="report-label">영화의전당에서의 기억</span><p>${noteValue(state.memory.dureraum)}</p></section><section class="report-section"><h3>02 · 자료로 알아본 영화관</h3><div class="report-cinemas">${DATA.map(c=>{const n=state.notes[c.id];return `<div class="report-cinema"><h4>${c.name}</h4><span class="report-label">특징</span><p>${noteValue(n.feature)}</p><span class="report-label">선택한 근거</span><p class="report-evidence">${n.evidence.length?n.evidence.map(id=>esc(c.evidence.find(e=>e.id===id).title)).join(' / '):'아직 선택하지 않았어요.'}</p><span class="report-label">사람들에게 주는 도움</span><p>${noteValue(n.help)}</p></div>`;}).join('')}</div></section><section class="report-section"><h3>03 · 나란히 비교하기</h3><span class="report-label">공통점</span><p>${noteValue(state.compare.same)}</p><span class="report-label">서로 다른 특징</span><p>${noteValue(state.compare.different)}</p></section><section class="report-section"><h3>04 · 우리 지역 영화관의 의미</h3><span class="report-label">영화관이 사라지면 달라질 일</span><p>${noteValue(state.meaning.missing)}</p><div class="report-note"><p>${noteValue(state.meaning.final,'나의 생각을 아직 기록하지 않았어요.')}</p></div></section>${state.visit.observed.trim()||state.visit.changed.trim()?`<section class="report-section"><h3>05 · ${dateLabel()} 현장 체험 뒤의 기록</h3><span class="report-label">실제로 보거나 경험한 것</span><p>${noteValue(state.visit.observed)}</p><span class="report-label">새롭게 알게 된 영화관의 의미</span><p>${noteValue(state.visit.changed)}</p></section>`:''}${print?`<section class="report-section source-print"><strong>조사에 사용한 원자료 · 2026.10.30 확인</strong><br>${DATA.map(c=>`${c.name}: ${c.sources.map(s=>`${s.name} — ${s.url}`).join('<br>')}`).join('<br>')}</section>`:'<p class="small" style="margin-top:20px">자료: 롯데시네마 · 롯데백화점 · 부산관광공사 · 부산광역시 · 한국관광공사 · 부산문화재단. 자세한 출처는 ‘안내 · 설정 → 자료 출처’에서 확인해요.</p>'}`;
  }
  function goStep(i) {
    if(i<0||i>=STEPS.length)return;
    state.step=i;save();render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});
  }
  function showToast(msg) {clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
  function modal(title,body,wide=false) {
    const d=$('#modal');lastFocus=document.activeElement;d.classList.toggle('modal-image',wide);
    $('#modalContent').innerHTML=`<div class="modal-inner"><div class="modal-heading"><h2 id="modalTitle">${title}</h2><button class="modal-close" data-action="close" aria-label="닫기">×</button></div>${body}</div>`;
    if(!d.open)d.showModal();
  }
  function identityModal() {
    modal('나의 정보',`<p>빈칸으로 두어도 모든 활동을 할 수 있어요. 저장할 기록에 표시됩니다.</p><div class="modal-grid"><div class="field"><label class="prompt-label" for="identityName">번호 · 이름 또는 별명</label><input type="text" id="identityName" data-field="identity" value="${esc(state.identity)}" maxlength="60" placeholder="예: 12번 김○○"></div><div class="field"><label class="prompt-label" for="identityGroup">모둠</label><select id="identityGroup" data-field="group"><option value="">선택하지 않음</option>${[1,2,3,4,5,6].map(i=>`<option value="${i}" ${state.group===String(i)?'selected':''}>${i}모둠</option>`).join('')}</select></div></div><button class="btn" data-action="close">기록 계속하기</button>`);
  }
  function menuModal() {
    modal('이용 안내와 설정',`<p><strong>경험 나누기 → 영화관 조사 → 비교 → 의미 찾기 → 기록 저장</strong></p><p>세 영화관을 모두 살펴보거나, 모둠별로 한 곳을 맡아 조사할 수 있어요. 같은 모둠을 골라도 기록은 기기마다 따로 저장돼요.</p><div class="button-row"><button class="btn soft" data-action="sources">사진 · 자료 출처</button><button class="btn secondary" data-action="projection">${projection?'보통 화면으로':'발표 화면 크게'}</button><button class="btn secondary" data-action="fullscreen">전체 화면</button></div><hr><h3>선생님 수업 안내</h3><p>경험 나누기 5분 → 자료 조사 15분 → 비교·의미 나누기 15분 → 정리 5분. 6모둠이라면 영화관 한 곳을 두 모둠씩 조사해 서로 다른 발견을 나눌 수 있어요.</p><p>학생이 자료에서 특징과 근거를 찾은 뒤, 그 특징이 사람들의 생활에 주는 도움을 설명하도록 해 주세요. 방문 당시 이용한 공간과 자료로 새롭게 알게 된 공간을 구분합니다.</p><h3>우리 반 체험 정보</h3><p class="small">체험 정보는 현재 기기에만 적용됩니다. 다른 기기의 기록에는 영향을 주지 않아요.</p><div class="modal-grid"><div class="field"><label class="prompt-label" for="tripDate">롯데시네마 동래점 체험일</label><input id="tripDate" type="date" value="${state.settings.tripDate}" data-field="settings.tripDate"></div><div class="field"><label class="prompt-label" for="className">학급</label><input id="className" type="text" maxlength="40" value="${esc(state.settings.className)}" data-field="settings.className"></div></div><div class="field"><label class="prompt-label" for="movieTitle">관람 영화 (정해진 뒤 입력)</label><input id="movieTitle" type="text" maxlength="80" value="${esc(state.settings.movie)}" data-field="settings.movie" placeholder="아직 정해지지 않았다면 비워 두세요."></div><hr><h3>기록 보관</h3><p>로그인 없이 사용합니다. 기록은 서버로 전송되지 않고 현재 브라우저에 저장돼요. 브라우저 데이터를 지우기 전에는 ‘이어 쓰기 파일’을 저장해 주세요.</p><div class="button-row"><button class="btn secondary" data-action="backup">이어 쓰기 파일 저장</button><button class="btn secondary" data-action="import">파일 열기</button><button class="btn secondary" data-action="reset-question">나의 기록 지우기</button></div>`);
  }
  function sourcesModal() {
    modal('사진과 조사자료의 출처',`<p>2026년 10월 30일 공식 안내를 확인하고, 4학년이 읽기 쉽게 요약했어요. 상영 영화·시간·요금은 고정된 조사자료에 넣지 않았어요.</p>${DATA.map(c=>`<div class="modal-source"><h3>${c.name}</h3>${c.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name} ↗</a>`).join('')}</div>`).join('')}<hr><p class="small">사진은 장소를 살펴보기 위한 자료 사진이며 우리 반 방문 사진이 아닙니다. 영화의전당 사진: 부산관광공사 부산 관광 아카이브(공공누리 이용 조건은 원자료에 표시). 그 밖의 사진별 출처는 각 자료 아래에 표시했습니다. 사진의 원저작권은 제공 기관에 있습니다.</p><p class="small">지도는 위치 확인을 위해 외부 지도 검색으로 열립니다. 앱 안의 ‘위치 자료’는 교통 안내를 요약한 것으로 실제 지도가 아닙니다.</p>`);
  }
  function downloadBlob(blob,name) {const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  const filename = ext => `영화관_탐험기록_${(state.identity||state.group&&state.group+'모둠'||'나의기록').replace(/[\\/:*?"<>|]/g,'_')}.${ext}`;
  function backup() {save();downloadBlob(new Blob([JSON.stringify({app:'busan-cinema-explorers',schema:1,savedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json;charset=utf-8'}),filename('json'));showToast('이어 쓰기 파일을 저장했어요.');}
  function importFile() {
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(file.size>2000000){showToast('파일이 너무 커요. 탐험대에서 저장한 파일을 골라 주세요.');return;}
      try {const raw=JSON.parse(await file.text());if(raw.app!=='busan-cinema-explorers'||raw.schema!==1||!raw.data||typeof raw.data!=='object')throw new Error('format');const next=sanitize(raw.data);
        modal('이 기록을 열까요?',`<p><strong>${esc(next.identity||'이름 없는 기록')}</strong>의 이어 쓰기 파일입니다. 현재 기기의 기록이 이 파일의 내용으로 바뀝니다.</p><p>현재 기록을 보관하려면 먼저 아래에서 저장하세요.</p><div class="button-row"><button class="btn secondary" id="backupBeforeImport">현재 기록 저장</button><button class="btn" id="confirmImport">파일의 기록 열기</button></div>`);
        $('#backupBeforeImport').onclick=backup;$('#confirmImport').onclick=()=>{state=next;currentEvidence=0;save();$('#modal').close();render();showToast('기록을 불러왔어요.');};
      }catch {showToast('탐험대에서 저장한 이어 쓰기 파일인지 확인해 주세요.');}
    }; input.click();
  }
  function reportText() {
    const lines=['우리 지역 영화관 탐험 기록',[state.settings.className,state.group&&state.group+'모둠',state.identity].filter(Boolean).join(' · '),`${dateLabel(true)} 롯데시네마 동래점 체험`,'','[나의 경험]',state.memory.together||'(미작성)','영화의전당에서의 기억: '+(state.memory.dureraum||'(미작성)')];
    for(const c of DATA){const n=state.notes[c.id];lines.push('',`[${c.name}]`,'특징: '+(n.feature||'(미작성)'),'근거: '+(n.evidence.map(id=>c.evidence.find(e=>e.id===id).title).join(', ')||'(미선택)'),'사람들에게 주는 도움: '+(n.help||'(미작성)'));}
    lines.push('','[비교]','공통점: '+state.compare.same,'서로 다른 특징: '+state.compare.different,'','[영화관의 의미]','영화관이 사라지면: '+state.meaning.missing,state.meaning.final);
    if(state.visit.observed||state.visit.changed)lines.push('','[체험 뒤의 기록]',state.visit.observed,state.visit.changed);
    lines.push('','자료: '+DATA.flatMap(c=>c.sources.map(s=>s.name+' '+s.url)).join('\n'));return lines.join('\n');
  }
  async function copyReport() {
    const text=reportText();try{await navigator.clipboard.writeText(text);showToast('기록 글을 복사했어요.');}catch{modal('기록 글 복사',`<p>아래 글을 길게 누르거나 전체 선택해 복사해 주세요.</p><textarea id="copyText" rows="12" readonly>${esc(text)}</textarea>`);$('#copyText').select();}
  }
  async function downloadPNG() {
    const buttons=[...document.querySelectorAll('[data-action="download-png"]')];buttons.forEach(b=>b.disabled=true);
    try {
      if(document.fonts?.ready)await document.fonts.ready;
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');
      const width=1400,pad=86,inner=width-pad*2;let y=0;const commands=[];
      const font=(size,weight=400)=>`${weight} ${size}px "Noto Sans KR","Malgun Gothic",sans-serif`;
      function wrap(text,max,size,weight=400){ctx.font=font(size,weight);const result=[];for(const part of String(text||'아직 기록하지 않았어요.').split('\n')){let line='';for(const ch of part){if(ctx.measureText(line+ch).width>max&&line){result.push(line);line=ch;}else line+=ch;}result.push(line);}return result;}
      function text(str,size=23,color='#304d4e',weight=400,space=15){const lines=wrap(str,inner,size,weight),lineHeight=Math.ceil(size*1.65);commands.push({kind:'text',lines,y,size,lineHeight,color,weight});y+=lines.length*lineHeight+space;}
      function section(title){y+=20;commands.push({kind:'rule',y});y+=30;text(title,27,'#174d50',700,17);}
      y=77;text('BUSAN CINEMA EXPLORERS',17,'#6e887c',700,20);text('우리 지역 영화관 탐험 기록',43,'#174d50',800,18);
      text([state.settings.className,state.group&&state.group+'모둠',state.identity||'이름 미입력'].filter(Boolean).join(' · '),22,'#6a7d73',400,10);text(`1학기 영화의전당 방문 / ${dateLabel(true)} 롯데시네마 동래점 체험`,20,'#6a7d73',400,18);
      if(state.settings.movie)text('관람 영화 · '+state.settings.movie,21);
      section('01  나의 경험');text('함께 영화를 본 기억',19,'#6e887c',700,5);text(state.memory.together);text('영화의전당에서의 기억',19,'#6e887c',700,5);text(state.memory.dureraum);
      section('02  자료로 알아본 영화관');for(const c of DATA){const n=state.notes[c.id];text(c.name,26,c.color,700,10);text('특징 · '+(n.feature||'아직 기록하지 않았어요.'));text('근거 · '+(n.evidence.map(id=>c.evidence.find(e=>e.id===id).title).join(' / ')||'아직 담지 않았어요.'),19,'#6e887c');text('사람들에게 주는 도움 · '+(n.help||'아직 기록하지 않았어요.'));y+=8;}
      section('03  나란히 비교하기');text('공통점 · '+(state.compare.same||'아직 기록하지 않았어요.'));text('서로 다른 특징 · '+(state.compare.different||'아직 기록하지 않았어요.'));
      section('04  우리 지역 영화관의 의미');text('영화관이 사라지면 · '+(state.meaning.missing||'아직 기록하지 않았어요.'));text(state.meaning.final,26,'#174d50',700,20);
      if(state.visit.observed||state.visit.changed){section('05  현장 체험 뒤의 기록');text('직접 관찰한 것 · '+(state.visit.observed||'아직 기록하지 않았어요.'));text('새롭게 알게 된 의미 · '+(state.visit.changed||'아직 기록하지 않았어요.'));}
      section('조사자료 출처 · 2026.10.30 확인');text(DATA.flatMap(c=>c.sources.map(s=>s.name+' · '+s.url)).join('\n'),16,'#7b8a80',400,0);
      canvas.width=width;canvas.height=y+85;ctx.fillStyle='#faf9f1';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#174d50';ctx.fillRect(0,0,width,16);
      for(const cmd of commands){if(cmd.kind==='rule'){ctx.strokeStyle='#d8e1d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad,cmd.y);ctx.lineTo(width-pad,cmd.y);ctx.stroke();}else{ctx.font=font(cmd.size,cmd.weight);ctx.fillStyle=cmd.color;ctx.textBaseline='top';cmd.lines.forEach((line,i)=>ctx.fillText(line,pad,cmd.y+i*cmd.lineHeight));}}
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('blob');downloadBlob(blob,filename('png'));showToast('기록 이미지를 저장했어요.');
    } catch {showToast('이미지 저장이 어려워요. 인쇄 · PDF 저장을 이용해 주세요.');}
    finally {buttons.forEach(b=>b.disabled=false);}
  }
  document.addEventListener('input',event=>{
    const el=event.target,path=el.dataset.field;if(!path)return;
    if(path==='settings.tripDate'&&(!el.value||!/^\d{4}-\d{2}-\d{2}$/.test(el.value)))return;
    setPath(path,el.value);save();
    if(path.startsWith('notes.')){const c=cinema(state.cinema);const p=$('#progress-'+c.id);if(p)p.textContent=progress(c)===3?'✓ 조사 기록 완료':`기록 ${progress(c)} / 3`;if($('#noteCount'))$('#noteCount').textContent=`${progress(c)} / 3 기록 · ${c.lookFor}`;}
    if(state.step===4 && path.startsWith('visit.'))$('.report-sheet').innerHTML=reportHTML(false);
  });
  document.addEventListener('change',event=>{const el=event.target;if(el.matches('select[data-field]')){setPath(el.dataset.field,el.value);save();}});
  document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&!event.target.dataset.fallback){event.target.dataset.fallback='true';event.target.src='assets/photo-unavailable.svg';event.target.alt+=' · 사진을 불러오지 못했어요. 자료 원문에서 확인하세요.';}},true);
  document.addEventListener('keydown',event=>{if(event.target.matches('.evidence-tab')&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();currentEvidence=(currentEvidence+(event.key==='ArrowRight'?1:2))%3;render();$('#evidence-tab-'+currentEvidence).focus();}});
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action;
    if(action==='step')return goStep(Number(button.dataset.step));
    if(action==='cinema'){state.cinema=button.dataset.cinema;state.step=1;currentEvidence=0;save();render();window.scrollTo({top:0,behavior:'instant'});return;}
    if(action==='evidence'){currentEvidence=Number(button.dataset.index);render();return;}
    if(action==='collect'||action==='remove-evidence'){
      const n=state.notes[state.cinema],id=button.dataset.evidence;
      if(action==='collect'){if(!n.evidence.includes(id))n.evidence.push(id);showToast('조사 기록장에 근거를 담았어요.');}
      else n.evidence=n.evidence.filter(e=>e!==id);
      save();render();return;
    }
    if(action==='identity')return identityModal();
    if(action==='menu')return menuModal();
    if(action==='close')return $('#modal').close();
    if(action==='sources')return sourcesModal();
    if(action==='zoom'){const e=cinema(state.cinema).evidence[currentEvidence];return modal(e.title,`${photo(e.image,e.alt)}<p style="margin-top:12px">${esc(e.credit)}<br>${esc(e.text)}</p>`,true);}
    if(action==='location'){const c=cinema(state.cinema);return modal(c.name+'의 위치',`<span class="tag">부산 ${c.area}</span><h3>${c.address}</h3><p>${c.location}</p><a class="btn" href="https://map.kakao.com/link/search/${encodeURIComponent(c.name)}" target="_blank" rel="noopener noreferrer">지도에서 위치 확인 ↗</a><p class="small" style="margin-top:15px">새 탭에서 지도가 열려요. 자세한 교통 안내는 영화관 공식 안내를 확인해요.</p>`);}
    if(action==='hint'){hintOpen=!hintOpen;render();return;}
    if(action==='projection'){projection=!projection;if($('#modal').open)$('#modal').close();render();showToast(projection?'발표 화면을 크게 표시해요.':'보통 크기로 돌아왔어요.');return;}
    if(action==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();$('#modal').close();}catch{showToast('이 브라우저에서는 전체 화면을 지원하지 않아요.');}return;}
    if(action==='download-png')return downloadPNG();
    if(action==='backup')return backup();
    if(action==='import')return importFile();
    if(action==='copy')return copyReport();
    if(action==='print'){$('#printRoot').innerHTML=`<article class="report-sheet">${reportHTML(true)}</article>`;window.print();return;}
    if(action==='reset-question'){modal('나의 기록을 지울까요?',`<p>이 브라우저에 작성한 경험과 조사 기록이 지워집니다. 이어 쓰기 파일로 저장해 두면 나중에 다시 열 수 있어요.</p><div class="button-row"><button class="btn secondary" data-action="backup">먼저 파일로 저장</button><button class="btn danger" data-action="reset">기록 지우기</button></div>`);return;}
    if(action==='reset'){const settings={...state.settings};state=fresh();state.settings=settings;currentEvidence=0;save();$('#modal').close();render();showToast('나의 기록을 지웠어요.');}
  });
  $('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
    $('#modal').addEventListener('close',()=>{render();if(lastFocus?.isConnected)lastFocus.focus();});
  window.addEventListener('beforeprint',()=>{$('#printRoot').innerHTML=`<article class="report-sheet">${reportHTML(true)}</article>`;});
  window.addEventListener('pagehide',save);
  window.addEventListener('storage',event=>{if(event.key===KEY)showToast('다른 탭에서 기록이 바뀌었어요. 파일로 보관한 뒤 새로고침해 주세요.');});
  render();
})();
