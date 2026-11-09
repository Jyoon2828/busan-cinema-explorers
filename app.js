(() => {
  'use strict';
  const DATA = window.CINEMA_DATA;
  const REPORT_SOURCE_NOTE = '자료 출처: 영화관 공식 안내 및 공공기관 자료 참고';
  const KEY = 'busan-cinema-explorers-v1';
  const STEPS = ['경험 나누기', '영화관 조사', '의미 찾기', '나의 기록'];
  const MEANING_TOPICS = [{"id": "joy", "label": "사람들에게 주는 즐거움", "tab": "즐거움 찾기", "questions": [{"id": "screen", "text": "큰 화면과 좋은 소리로 영화를 보면 어떤 즐거움을 느낄 수 있을까요?", "hint": "사진에서 본 상영관의 특징이나 인상 깊었던 장면을 떠올려요."}, {"id": "special", "text": "영화관에서 가족이나 친구와 보내는 시간은 왜 특별할까요?", "hint": "함께 영화를 보러 간 경험과 그때의 기분을 떠올려요."}, {"id": "story", "text": "영화 속 새로운 이야기나 인물의 삶을 만나면 무엇을 느끼거나 배울 수 있을까요?", "hint": "영화를 보며 처음 알게 된 일이나 마음에 남은 인물을 떠올려요."}]}, {"id": "together", "label": "함께 보는 경험의 가치", "tab": "함께 보는 가치", "questions": [{"id": "emotion", "text": "같은 장면을 함께 보며 웃거나 감동하면 어떤 점이 좋을까요?", "hint": "혼자 볼 때와 함께 볼 때의 느낌을 떠올려요."}, {"id": "thoughts", "text": "영화가 끝난 뒤 서로 다른 생각과 감상을 나누면 무엇을 알 수 있을까요?", "hint": "친구의 이야기를 듣고 새롭게 생각한 일이 있나요?"}, {"id": "consideration", "text": "여러 사람이 함께 영화를 즐기려면 어떤 배려가 필요할까요? 그 배려는 왜 중요할까요?", "hint": "나와 다른 관객이 모두 즐겁게 영화를 보는 모습을 떠올려요."}]}, {"id": "local", "label": "우리 지역의 문화 공간", "tab": "지역의 문화 공간", "questions": [{"id": "neighbours", "text": "영화관이 우리 지역 사람들이 함께 문화를 즐기는 장소가 되면 어떤 점이 좋을까요?", "hint": "영화관에서 어떤 사람들이 만나고 무엇을 함께 할 수 있을까요?"}, {"id": "opportunity", "text": "우리 지역에 영화관이 있으면 사람들이 어떤 문화 활동을 더 쉽게 경험할 수 있을까요?", "hint": "조사한 영화관의 공간과 프로그램에서 근거를 찾아요."}, {"id": "missing", "text": "우리 지역에서 영화관이 사라진다면, 어떤 즐거움과 함께하는 경험이 줄어들까요?", "hint": "사람들이 하던 활동과 함께 보내던 시간을 떠올려요."}]}];
  const MEANING_QUESTIONS = MEANING_TOPICS.flatMap(t=>t.questions.map(q=>({...q,topic:t.label})));
  const SENTENCE_FRAME = '우리 지역 영화관은 ______을/를 함께 경험하는 문화 공간입니다.';
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const blankNote = () => ({feature:'', evidence:[], help:'', question:''});
  const fresh = () => ({version:3, step:0, cinema:'lotte', identity:'', memory:{together:'', impression:''}, notes:Object.fromEntries(DATA.map(c=>[c.id,blankNote()])), meaning:{...Object.fromEntries(MEANING_QUESTIONS.map(q=>[q.id,''])),final:''}, visit:{observed:'', changed:''}, settings:{movie:''}});
  function sanitize(input) {
    const out = fresh();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
    const str = (v, n=1000) => typeof v === 'string' ? v.slice(0,n) : '';
    out.identity=str(input.identity,60);
    for (const section of ['memory','meaning','visit']) for (const key of Object.keys(out[section])) out[section][key]=str(input[section]?.[key]);
    if (!out.memory.impression && input.memory?.dureraum) out.memory.impression=str(input.memory.dureraum);
    out.settings.movie=str(input.settings?.movie,80);
    for (const c of DATA) {
      const n = input.notes?.[c.id];
      if (!n || typeof n !== 'object') continue;
      for (const key of ['feature','help','question']) out.notes[c.id][key]=str(n[key]);
      if (Array.isArray(n.evidence)) out.notes[c.id].evidence=[...new Set(n.evidence.filter(id=>c.evidence.some(e=>e.id===id)))];
    }
    if(Number.isInteger(input.step)){const step=Number(input.version)>=2?input.step:[0,1,2,2,3][input.step];if(step>=0&&step<STEPS.length)out.step=step;}
    if (DATA.some(c=>c.id===input.cinema)) out.cinema=input.cinema;
    return out;
  }
  let storageOK=true, state=fresh(), currentEvidence=0, projection=false, hintOpen=false, memoryTab='together', researchMode='photos', meaningTopic='joy', meaningQuestion='screen', savedTimer, toastTimer, lastFocus;
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
  const cinema = id => DATA.find(c=>c.id===id);
  const reportCinemas = () => { const written=DATA.filter(c=>{const n=state.notes[c.id];return n.feature.trim()||n.help.trim()||n.question.trim()||n.evidence.length;});return written.length?written:[cinema(state.cinema)]; };
  const meaningEntries = () => MEANING_QUESTIONS.filter(q=>state.meaning[q.id].trim());
  const progress = c => {const n=state.notes[c.id];return [!!n.feature.trim(),!!n.evidence.length,!!n.help.trim()].filter(Boolean).length;};
  const noteValue = (text,empty='아직 기록하지 않았어요.') => text.trim()?esc(text):`<span class="record-empty">${empty}</span>`;
  const tagClass = id => id==='lotte'?' warm':id==='corner'?' lilac':'';
  const field = (path,label,placeholder='',opts={}) => `<div class="field"><label class="prompt-label" for="field-${path.replaceAll('.','-')}">${label}</label><textarea id="field-${path.replaceAll('.','-')}" data-field="${path}" maxlength="${opts.max||700}" placeholder="${esc(placeholder)}"${opts.rows?` rows="${opts.rows}"`:''}>${esc(getPath(path))}</textarea>${opts.help?`<p class="help">${opts.help}</p>`:''}</div>`;
  const pageTop = (num,title,sub,actions='') => `<div class="page-top"><div><div class="eyebrow">OUR CINEMA JOURNEY · ${num}</div><h1>${title}</h1><p>${sub}</p></div>${actions}</div>`;
  function photo(src,alt,cls='') {return `<img class="${cls}" src="${src}" alt="${esc(alt)}" decoding="async">`;}
  function isComplete(i) {
    return [!!(state.memory.together.trim()||state.memory.impression.trim()),DATA.some(c=>progress(c)===3),!!state.meaning.final.trim(),false][i];
  }
  function render() {
    document.body.dataset.step=String(state.step);
    $('#tripChip').textContent='부산의 초등학생 누구나';
    $('#stepNav').innerHTML=STEPS.map((title,i)=>`<button class="step${state.step===i?' active':''}${isComplete(i)?' complete':''}" data-action="step" data-step="${i}" ${state.step===i?'aria-current="step"':''}><span class="step-number">${isComplete(i)&&state.step!==i?'✓':`0${i+1}`}</span><span>${title}</span></button>`).join('');
    $('#main').innerHTML=[memoryPage,researchPage,meaningPage,reportPage][state.step]();
    $('#bottomBar').innerHTML=`<div class="bottom-left">${state.step>0?`<button class="btn secondary" data-action="step" data-step="${state.step-1}">← ${STEPS[state.step-1]}</button>`:'<span class="pill-note">우리의 경험에서 출발해요</span>'}<span class="bottom-hint">${['떠오르는 경험을 자유롭게 적어 보세요.','근거는 자료 아래의 ‘근거 담기’를 눌러 모아요.','자료에서 찾은 사실과 나의 생각을 연결해요.','기록을 저장해 선생님이나 친구와 나눠요.'][state.step]}</span></div><div class="button-row">${state.step<3?`<button class="btn" data-action="step" data-step="${state.step+1}">${STEPS[state.step+1]} <span aria-hidden="true">→</span></button>`:'<button class="btn" data-action="download-png">사진과 기록 저장 ↓</button>'}</div>`;
    document.body.classList.toggle('projection',projection);
    if(state.step===1)$('#bottomBar').innerHTML=`<button class="btn secondary" data-action="step" data-step="0">← 경험</button><button class="btn soft record-toggle" data-action="record">나의 기록장 <span data-note-progress>${progress(cinema(state.cinema))} / 3</span></button><button class="btn" data-action="step" data-step="2">의미 찾기 →</button>`;
    $('#saveState').textContent=storageOK?'이 기기에 저장':'임시 기록 · 파일로 저장하세요';
  }

  function memoryPage() {
    const remembered=memoryTab==='impression';
    return `<section class="memory-view"><section class="adventure-hero"><img class="hero-art" src="assets/geohaki.png" alt="확성기를 들고 영화관 탐험을 안내하는 거학이 캐릭터"><div class="hero-copy"><span class="hero-kicker">부산의 초등학생 누구나!</span><h1>우리 동네 영화관,<br><em>거학이와 탐험해요!</em></h1><p>사진 속 여섯 영화관을 둘러보고<br>우리 지역의 문화 공간을 탐험해요.</p><button class="btn warm" data-action="step" data-step="1">탐험하러 가기 →</button></div></section><div class="memory-grid"><section class="journey-card surface"><span class="tag">탐험의 첫 장</span><h2>나의 영화 이야기를 꺼내요</h2><p>누구와 어디에서 영화를 보았나요?<br>함께 웃거나 감동했던 순간을 떠올려요.</p><p class="photo-note">영화관에 가 본 적이 없어도 괜찮아요.<br>집이나 학교에서 함께 영화를 본 경험도 좋아요.</p></section><section class="memory-form surface"><div class="large-tabs" aria-label="기록할 경험"><button data-action="memory-tab" data-value="together" aria-pressed="${!remembered}" class="${!remembered?'active':''}">함께 본 기억</button><button data-action="memory-tab" data-value="impression" aria-pressed="${remembered}" class="${remembered?'active':''}">마음에 남은 순간</button></div>${remembered?field('memory.impression','영화를 보며 마음에 남은 순간','어떤 장면이나 활동이 기억에 남나요? 그때의 기분도 써 보세요.',{rows:4,help:'본 영화나 영화를 보았던 장소는 어디든 좋아요.'}):field('memory.together','함께 영화를 본 기억','누구와 어디에서 무엇을 보았나요? 함께 웃거나 이야기를 나눈 순간을 써 보세요.',{rows:4,help:'떠오르는 경험이 없다면 함께 보고 싶은 영화를 써도 좋아요.'})}</section></div><section class="big-question"><p>우리 지역의 영화관은<br>사람들에게 어떤 즐거움과 가치를 줄까요?</p><button class="btn warm" data-action="step" data-step="1">여섯 영화관 살펴보기 →</button></section></section>`;
  }
  function evidenceEntries(mode=researchMode) {
    return cinema(state.cinema).evidence.map((item,index)=>({item,index})).filter(({item})=>mode==='photos'?item.kind==='photo':item.kind!=='photo');
  }
  function activeEvidence() {
    let entries=evidenceEntries();
    if(!entries.length){researchMode=researchMode==='photos'?'reading':'photos';entries=evidenceEntries();}
    if(!entries.some(e=>e.index===currentEvidence))currentEvidence=entries[0]?.index??0;
    return {entries,entry:entries.find(e=>e.index===currentEvidence),position:entries.findIndex(e=>e.index===currentEvidence)};
  }
  function moveEvidence(delta) {
    const {entries,position}=activeEvidence();
    currentEvidence=entries[(position+delta+entries.length)%entries.length].index;
    render();
  }

  function researchPage() {
    const c=cinema(state.cinema), n=state.notes[c.id], {entries,entry,position}=activeEvidence(), e=entry.item;
    const photos=c.evidence.filter(t=>t.kind==='photo').length, readings=c.evidence.length-photos;
    return `<section class="research-view"><nav class="cinema-strip" aria-label="조사할 영화관">${DATA.map(t=>`<button class="cinema-choice ${t.id===c.id?'active':''}" data-action="cinema" data-cinema="${t.id}" aria-pressed="${t.id===c.id}">${photo(t.cover,t.coverAlt)}<span><strong>${t.short}</strong><small>${t.area} · ${t.type}</small></span><span class="strip-progress" id="progress-${t.id}">${progress(t)===3?'✓':progress(t)+'/3'}</span></button>`).join('')}</nav><section class="explore-panel surface" aria-label="영화관 조사 자료"><header class="explore-head"><h1>${c.name}<span class="cinema-area">${c.area} · ${c.type}</span></h1><div class="large-tabs" aria-label="자료 종류"><button class="${researchMode==='photos'?'active':''}" data-action="research-mode" data-value="photos" aria-pressed="${researchMode==='photos'}">사진 <span>${photos}</span></button><button class="${researchMode==='reading'?'active':''}" data-action="research-mode" data-value="reading" aria-pressed="${researchMode==='reading'}">읽기 자료 <span>${readings}</span></button></div><button class="btn secondary compact-action" data-action="location">위치</button><button class="btn secondary compact-action" data-action="sources">출처</button></header><div class="explore-body"><div class="visual-column">${evidenceMedia(e)}<div class="visual-index" aria-label="${researchMode==='photos'?'사진':'읽기 자료'} 선택">${entries.map(({item,index},i)=>`<button class="${researchMode==='photos'?'photo-thumb':'reading-thumb'} ${index===currentEvidence?'active':''}" data-action="evidence" data-index="${index}" aria-label="${i+1}. ${esc(item.title)}" aria-pressed="${index===currentEvidence}">${item.kind==='photo'?photo(item.image,item.alt):`<span>${i+1}</span><strong>${item.title}</strong>`}</button>`).join('')}</div></div><article class="research-reading" aria-live="polite"><div><span class="reading-position">${researchMode==='photos'?'사진':'읽기 자료'} ${position+1} / ${entries.length}</span><h2>${e.title}</h2><p>${e.text}</p></div><div class="reading-tools"><button class="btn soft" data-action="question-help">생각해 보기</button>${e.word?'<button class="btn secondary" data-action="word-help">낱말 도움</button>':''}<a class="source-link" href="${c.sources[e.source].url}" target="_blank" rel="noopener noreferrer">자료 원문 ↗</a></div></article></div><footer class="explore-footer"><div class="picture-navigation"><button class="btn secondary" data-action="previous-evidence" aria-label="이전 ${researchMode==='photos'?'사진':'자료'}">← 이전</button><span>${position+1} / ${entries.length}</span><button class="btn secondary" data-action="next-evidence" aria-label="다음 ${researchMode==='photos'?'사진':'자료'}">다음 →</button></div><button class="btn ${n.evidence.includes(e.id)?'soft':''}" data-action="collect" data-evidence="${e.id}">${n.evidence.includes(e.id)?'✓ 근거에 담았어요':'＋ 이 자료를 근거로 담기'}</button></footer></section></section>`;
  }

  function evidenceMedia(e) {
    if(e.kind==='photo')return `<button class="photo-stage" data-action="zoom" aria-label="${esc(e.title)} 사진 크게 보기">${photo(e.image,e.alt)}<span class="zoom-caption">사진 크게 보기 ⤢</span></button>`;
    if(e.kind==='facts')return `<div class="fact-stage"><small>공식 안내에서 확인해요</small><div><strong>${e.number}</strong><span>${e.unit}</span></div><p>${e.sub}</p></div>`;
    if(e.kind==='location')return `<div class="fact-stage location-stage"><small>${e.line}</small><h2>${e.station}</h2><p>롯데백화점 방향<br>연결 육교 이용</p><button class="btn secondary" data-action="location">지도에서 위치 보기 ↗</button></div>`;
    return `<div class="reading-stage">${photo(cinema(state.cinema).cover,cinema(state.cinema).coverAlt)}<span>사진과 함께 소개 글을 읽어 봐요</span></div>`;
  }
  function recordModal() {
    const c=cinema(state.cinema);
    modal(c.name+' 조사 기록장',`<p class="record-intro">자료에서 찾은 특징과 사람들에게 주는 도움을 내 말로 적어요.</p><div class="record-writing-grid">${field('notes.'+c.id+'.feature','① 내가 찾은 특징','어떤 공간이나 활동이 눈에 띄나요?',{rows:5})}${field('notes.'+c.id+'.help','③ 사람들에게 주는 도움','이 특징 덕분에 사람들은 무엇을 할 수 있나요?',{rows:5})}</div><section class="record-evidence"><h3>② 특징을 확인한 근거</h3><div class="evidence-selected">${evidenceTokens(c)}</div></section><div class="record-modal-footer"><span id="noteCount">${progress(c)} / 3 기록 완료</span><button class="btn" data-action="close">자료로 돌아가기</button></div>`);
    $('#modal').classList.add('record-dialog');
  }
  function galleryModal() {
    const c=cinema(state.cinema), photos=c.evidence.map((item,index)=>({item,index})).filter(e=>e.item.kind==='photo');
    let at=photos.findIndex(e=>e.index===currentEvidence);if(at<0)at=0;const e=photos[at].item;
    modal(e.title,`<div class="gallery-photo">${photo(e.image,e.alt)}</div><div class="gallery-caption"><p>${esc(e.credit||c.coverCredit)}</p><span>${at+1} / ${photos.length}</span></div><div class="gallery-controls"><button class="btn secondary" data-action="gallery-prev">← 이전 사진</button><button class="btn" data-action="collect" data-evidence="${e.id}">${state.notes[c.id].evidence.includes(e.id)?'✓ 근거에 담았어요':'＋ 근거로 담기'}</button><button class="btn secondary" data-action="gallery-next">다음 사진 →</button></div>`,true);
    $('#modal').classList.add('gallery-dialog');
  }
  function moveGallery(delta) {
    const photos=cinema(state.cinema).evidence.map((item,index)=>({item,index})).filter(e=>e.item.kind==='photo');
    const at=Math.max(0,photos.findIndex(e=>e.index===currentEvidence));currentEvidence=photos[(at+delta+photos.length)%photos.length].index;
    galleryModal();
  }
  function evidenceTokens(c) {
    const ids=state.notes[c.id].evidence;
    return ids.length?ids.map(id=>`<span class="evidence-token"><span>${c.evidence.find(e=>e.id===id).title}</span><button data-action="remove-evidence" data-evidence="${id}" aria-label="${esc(c.evidence.find(e=>e.id===id).title)} 근거에서 빼기">×</button></span>`).join(''):'<span class="empty-evidence">자료 아래의 ‘근거 담기’를 누르세요.</span>';
  }

  function meaningPage() {
    const final=meaningTopic==='final', topic=MEANING_TOPICS.find(t=>t.id===meaningTopic)||MEANING_TOPICS[0];
    const q=topic.questions.find(q=>q.id===meaningQuestion)||topic.questions[0];
    const current=cinema(state.cinema), picked=state.notes[current.id].feature.trim()?current:DATA.find(c=>state.notes[c.id].feature.trim());
    const tabs=MEANING_TOPICS.map(t=>`<button data-action="meaning-topic" data-topic="${t.id}" class="${meaningTopic===t.id?'active':''}" aria-pressed="${meaningTopic===t.id}">${t.tab}</button>`).join('')+`<button data-action="meaning-topic" data-topic="final" class="${final?'active':''}" aria-pressed="${final}">한 문장 정리</button>`;
    const left=final?`<section class="meaning-panel meaning-final-guide surface"><span class="meaning-kicker">즐거움과 가치를 연결해요</span><h2>내가 생각하는<br>지역 영화관의 의미는?</h2><p class="sentence-frame">우리 지역 영화관은<br><strong>______을/를 함께 경험하는</strong><br>문화 공간입니다.</p>${picked?`<div class="meaning-bridge"><span>${picked.name}에서 내가 찾은 특징</span><p>${esc(state.notes[picked.id].feature)}</p></div>`:'<p>영화관에서 느끼는 즐거움과 다른 사람과 함께하는 경험을 떠올려요.</p>'}</section>`:`<section class="meaning-panel surface"><h2>${topic.label}</h2><p class="meaning-panel-intro">생각해 보고 싶은 질문을 골라요.</p><div class="meaning-question-list">${topic.questions.map((item,i)=>`<button class="meaning-question-choice ${q.id===item.id?'active':''}" data-action="meaning-question" data-question="${item.id}" aria-pressed="${q.id===item.id}"><span class="meaning-question-number">${i+1}</span><span>${item.text}</span><span class="meaning-answer-mark" data-meaning-mark="${item.id}" aria-label="${state.meaning[item.id].trim()?'생각 기록함':'생각 기록 전'}">${state.meaning[item.id].trim()?'✓':''}</span></button>`).join('')}</div></section>`;
    const last=q.id===MEANING_QUESTIONS.at(-1).id;
    return `<section class="meaning-view">${pageTop('03','지역 영화관의 의미를 생각해요','필요한 질문을 골라 생각을 쓰고, 마지막에 한 문장으로 정리해요.')}<div class="large-tabs meaning-tabs" aria-label="영화관의 의미를 생각할 주제">${tabs}</div><div class="meaning-layout meaning-inquiry-layout">${left}<section class="meaning-form surface">${final?field('meaning.final','내가 생각한 지역 영화관의 의미',SENTENCE_FRAME,{rows:6,help:'앞에서 쓴 생각과 조사한 영화관의 특징을 연결해 내 말로 정리해요.'}):field('meaning.'+q.id,q.text,'내 생각과 그렇게 생각한 까닭을 써 보세요.',{rows:6,help:q.hint})}<div class="meaning-form-actions"><button class="btn secondary" data-action="meaning-help">문장 도움</button>${final?'<button class="btn" data-action="step" data-step="3">나의 기록 →</button>':`<button class="btn" data-action="meaning-next">${last?'한 문장 정리 →':'다음 질문 →'}</button>`}</div><p class="meaning-optional" data-meaning-count>질문 ${meaningEntries().length}개에 생각을 썼어요. 필요한 질문만 골라도 좋아요.</p></section></div></section>`;
  }
  function meaningHelp() {
    modal('생각을 연결하는 문장 도움',`<p class="sentence-frame">${SENTENCE_FRAME}</p><p class="sentence-frame">______에서는 ______을 할 수 있습니다.<br>그래서 지역 사람들이 ______하는 데 도움이 된다고 생각합니다.</p><ul><li>사람들에게 주는 즐거움은 무엇인가요?</li><li>다른 사람과 함께 보는 경험에는 어떤 가치가 있나요?</li><li>그 즐거움과 가치를 조사한 자료나 경험에서 확인할 수 있나요?</li></ul><button class="btn" data-action="close">내 생각 쓰기</button>`);
  }
  function reportPhotos(c) {
    const selected=c.evidence.filter(e=>e.kind==='photo'&&state.notes[c.id].evidence.includes(e.id));
    return selected.length?selected.map(e=>({src:e.image,alt:e.alt,title:e.title})):[{src:c.cover,alt:c.coverAlt,title:c.name+' 대표 사진'}];
  }
  function reportGallery(c) {
    return `<div class="report-gallery">${reportPhotos(c).map(p=>`<figure><img class="report-photo" src="${p.src}" alt="${esc(p.alt)}"><figcaption>${esc(p.title)}</figcaption></figure>`).join('')}</div>`;
  }
  function reportPage() {
    const count=DATA.filter(c=>progress(c)===3).length;
    return pageTop('04','나의 영화관 탐험 기록','나의 생각과 영화관 사진을 함께 저장해요.',`<button class="btn secondary" data-action="identity">이름 쓰기</button>`)+
      `<div class="report-layout"><div><article class="report-sheet surface">${reportHTML(false)}</article><section class="visit-box"><h3>직접 다녀왔다면, 더 써 볼까요? <small>선택</small></h3><p>어느 영화관이든 직접 방문한 경험이 있다면 이어서 적어 보세요.</p>${field('visit.observed','실제로 보거나 경험한 것','어느 영화관에서 어떤 모습이나 활동을 직접 보았나요?')}${field('visit.changed','다녀온 뒤 새롭게 알게 된 영화관의 의미','함께 영화를 보니 어떤 생각이 들었나요?')}</section></div><aside class="report-actions surface"><h3>나의 기록 저장하기</h3><span class="completion">여섯 곳 중 ${count}곳 조사 완료 · 내 생각 ${state.meaning.final.trim()?'작성함':'작성 전'}</span><p class="small">근거로 담은 사진도 함께 저장돼요. 사진을 담지 않았다면 대표 사진이 들어가요.</p><div class="button-row"><button class="btn" data-action="download-png">사진과 기록 저장 ↓</button><button class="btn secondary" data-action="print">인쇄 · PDF 저장</button><button class="btn secondary" data-action="copy">기록 글 복사</button></div><hr><p>쓴 내용은 이 기기의 브라우저에 자동 저장돼요. 저장한 파일로 나의 탐험을 나눠 보세요.</p><button class="btn soft" data-action="backup">이어 쓰기 파일 저장</button><button class="btn secondary" data-action="import">이어 쓰기 파일 열기</button><p class="small">다른 기기에서는 ‘이어 쓰기 파일’을 열어 계속 작성할 수 있어요.</p></aside></div>`;
  }
  function reportHTML(print=false) {
    const meta=state.identity||'이름 미입력';
    return `<p class="report-kicker">부산 영화관 탐험대 · 나의 발견 노트</p><h2>우리 지역 영화관, 함께 발견한 의미</h2><div class="report-meta">${esc(meta)}${state.settings.movie?'<br>기억에 남는 영화 · '+esc(state.settings.movie):''}</div><section class="report-section"><h3>01 · 나의 경험</h3><span class="report-label">함께 영화를 본 기억</span><p>${noteValue(state.memory.together)}</p><span class="report-label">마음에 남은 순간</span><p>${noteValue(state.memory.impression)}</p></section><section class="report-section"><h3>02 · 자료로 알아본 영화관</h3><div class="report-cinemas">${reportCinemas().map(c=>{const n=state.notes[c.id];return `<div class="report-cinema"><h4>${c.name}</h4>${reportGallery(c)}<span class="report-label">내가 찾은 특징</span><p>${noteValue(n.feature)}</p><span class="report-label">선택한 근거</span><p class="report-evidence">${n.evidence.length?n.evidence.map(id=>esc(c.evidence.find(e=>e.id===id).title)).join(' / '):'아직 선택하지 않았어요.'}</p><span class="report-label">사람들에게 주는 도움</span><p>${noteValue(n.help)}</p>${n.question?`<span class="report-label">더 궁금한 점</span><p>${noteValue(n.question)}</p>`:''}</div>`;}).join('')}</div></section><section class="report-section"><h3>03 · 우리 지역 영화관의 의미</h3>${meaningEntries().map(q=>`<div class="report-meaning-answer"><span class="report-label">${esc(q.topic)} · ${esc(q.text)}</span><p>${noteValue(state.meaning[q.id])}</p></div>`).join('')}<div class="report-note"><span class="report-label">한 문장으로 정리한 의미</span><p>${noteValue(state.meaning.final,'나의 생각을 아직 기록하지 않았어요.')}</p></div></section>${state.visit.observed.trim()||state.visit.changed.trim()?`<section class="report-section"><h3>04 · 직접 다녀온 뒤의 발견</h3><span class="report-label">실제로 보거나 경험한 것</span><p>${noteValue(state.visit.observed)}</p><span class="report-label">새롭게 알게 된 영화관의 의미</span><p>${noteValue(state.visit.changed)}</p></section>`:''}<p class="small report-source-note" style="margin-top:20px">${esc(REPORT_SOURCE_NOTE)}</p>`;
  }
  function goStep(i) {
    if(i<0||i>=STEPS.length)return;
    state.step=i;save();render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});
  }
  function showToast(msg) {clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
  function modal(title,body,wide=false) {
    const d=$('#modal');lastFocus=document.activeElement;d.classList.remove('record-dialog','gallery-dialog');d.classList.toggle('modal-image',wide);
    $('#modalContent').innerHTML=`<div class="modal-inner"><div class="modal-heading"><h2 id="modalTitle">${title}</h2><button class="modal-close" data-action="close" aria-label="닫기">×</button></div>${body}</div>`;
    if(!d.open)d.showModal();
  }
  function identityModal() {
    modal('나의 정보',`<p>빈칸으로 두어도 모든 활동을 할 수 있어요. 저장할 기록에 표시됩니다.</p><div class="field"><label class="prompt-label" for="identityName">이름 또는 별명</label><input type="text" id="identityName" data-field="identity" value="${esc(state.identity)}" maxlength="60" placeholder="예: 김○○ 또는 영화탐정"></div><div class="field"><label class="prompt-label" for="movieTitle">기억에 남는 영화 <small>선택</small></label><input id="movieTitle" type="text" maxlength="80" data-field="settings.movie" value="${esc(state.settings.movie)}" placeholder="자유롭게 적어 보세요."></div><button class="btn" data-action="close">기록 계속하기</button>`);
  }
  function menuModal() {
    modal('이용 안내와 설정',`<p><strong>경험 나누기 → 영화관 조사 → 의미 찾기 → 기록 저장</strong></p><p>여섯 영화관 중 관심 있는 곳을 자유롭게 골라 조사해요. 다른 영화관도 언제든 살펴볼 수 있어요. 기록은 기기마다 따로 저장돼요.</p><div class="button-row"><button class="btn soft" data-action="sources">사진 · 자료 출처</button><button class="btn secondary" data-action="projection">${projection?'보통 화면으로':'발표 화면 크게'}</button><button class="btn secondary" data-action="fullscreen">전체 화면</button></div><hr><h3>선생님 수업 안내</h3><p>경험 나누기 5분 → 자료 조사 15분 → 의미 생각하기·나누기 15분 → 정리 5분. 학생이 관심 있는 영화관을 골라 조사합니다. 같은 영화관을 여러 학생이 선택해도 됩니다. 의미 찾기에서는 세 주제의 질문 9개 중 필요한 질문을 골라 기록한 뒤 한 문장으로 정리합니다.</p><p>학생이 자료에서 특징과 근거를 찾은 뒤, 그 특징이 사람들의 생활에 주는 도움을 설명하도록 해 주세요. 방문 당시 이용한 공간과 자료로 새롭게 알게 된 공간을 구분합니다.</p><hr><h3>기록 보관</h3><p>로그인 없이 사용합니다. 기록은 서버로 전송되지 않고 현재 브라우저에 저장돼요. 브라우저 데이터를 지우기 전에는 ‘이어 쓰기 파일’을 저장해 주세요.</p><div class="button-row"><button class="btn secondary" data-action="backup">이어 쓰기 파일 저장</button><button class="btn secondary" data-action="import">파일 열기</button><button class="btn secondary" data-action="reset-question">나의 기록 지우기</button></div>`);
  }
  function sourcesModal() {
    modal('사진과 조사자료의 출처',`<p>기존 세 영화관은 2026년 10월 30일, 추가 세 영화관은 11월 4일 공식 안내를 확인해 요약했어요. 상영 영화·시간·요금은 고정된 조사자료에 넣지 않았어요.</p>${DATA.map(c=>`<div class="modal-source"><h3>${c.name} <small>${c.verifiedOn} 확인</small></h3>${c.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name} ↗</a>`).join('')}<ul class="photo-source-list">${c.evidence.filter(e=>e.kind==='photo').map(e=>`<li><strong>${esc(e.title)}</strong><br>${esc(e.credit||c.coverCredit)}</li>`).join('')}</ul></div>`).join('')}<hr><p class="small">사진은 장소를 살펴보기 위한 자료 사진이며 촬영·게시 당시의 자료 사진입니다. 영화의전당 사진: 부산관광공사 부산 관광 아카이브(공공누리 이용 조건은 원자료에 표시). 사진별 출처는 큰 사진 보기에서 확인할 수 있어요. 사진의 원저작권은 제공 기관에 있습니다.</p><p class="small">거학이 캐릭터는 제공된 원본 이미지를 활용했습니다.</p><p class="small">지도는 위치 확인을 위해 외부 지도 검색으로 열립니다. 앱 안의 ‘위치 자료’는 교통 안내를 요약한 것으로 실제 지도가 아닙니다.</p>`);
  }
  function downloadBlob(blob,name) {const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  const filename = ext => `영화관_탐험기록_${(state.identity||'나의기록').replace(/[\\/:*?"<>|]/g,'_')}.${ext}`;
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
    const lines=['우리 지역 영화관 탐험 기록',state.identity||'이름 미입력',state.settings.movie?'기억에 남는 영화: '+state.settings.movie:'','','[나의 경험]','함께 영화를 본 기억: '+(state.memory.together||'(미작성)'),'마음에 남은 순간: '+(state.memory.impression||'(미작성)')];
    for(const c of reportCinemas()){const n=state.notes[c.id];lines.push('',`[${c.name}]`,'특징: '+(n.feature||'(미작성)'),'근거: '+(n.evidence.map(id=>c.evidence.find(e=>e.id===id).title).join(', ')||'(미선택)'),'사람들에게 주는 도움: '+(n.help||'(미작성)'));if(n.question)lines.push('더 궁금한 점: '+n.question);}
    lines.push('','[영화관의 의미]');for(const q of meaningEntries())lines.push(q.text,state.meaning[q.id]);lines.push('한 문장 정리: '+(state.meaning.final||'(미작성)'));
    if(state.visit.observed||state.visit.changed)lines.push('','[체험 뒤의 기록]',state.visit.observed,state.visit.changed);
    lines.push('',REPORT_SOURCE_NOTE);return lines.join('\n');
  }
  async function copyReport() {
    const text=reportText();try{await navigator.clipboard.writeText(text);showToast('기록 글을 복사했어요.');}catch{modal('기록 글 복사',`<p>아래 글을 길게 누르거나 전체 선택해 복사해 주세요.</p><textarea id="copyText" rows="12" readonly>${esc(text)}</textarea>`);$('#copyText').select();}
  }
  async function downloadPNG() {
    const buttons=[...document.querySelectorAll('[data-action="download-png"]')];buttons.forEach(b=>b.disabled=true);
    showToast('사진과 기록을 한 장에 담고 있어요…');
    try {
      if(document.fonts?.ready)await document.fonts.ready;
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');
      const width=1400,pad=86,inner=width-pad*2;let y=0;const commands=[], photosByCinema=new Map();
      await Promise.all(reportCinemas().map(async c=>{
        const photos=await Promise.all(reportPhotos(c).map(async p=>{
          const img=new Image();img.src=p.src;await img.decode();return {...p,img};
        }));photosByCinema.set(c.id,photos);
      }));
      const font=(size,weight=400)=>`${weight} ${size}px "Noto Sans KR","Malgun Gothic",sans-serif`;
      function wrap(value,max,size,weight=400){ctx.font=font(size,weight);const result=[];for(const part of String(value||'아직 기록하지 않았어요.').split('\n')){let line='';for(const ch of part){if(ctx.measureText(line+ch).width>max&&line){result.push(line);line=ch;}else line+=ch;}result.push(line);}return result;}
      function text(str,size=23,color='#203e5d',weight=400,space=15){const lines=wrap(str,inner,size,weight),lineHeight=Math.ceil(size*1.65);commands.push({kind:'text',lines,y,size,lineHeight,color,weight});y+=lines.length*lineHeight+space;}
      function section(title){y+=24;commands.push({kind:'section',title,y});y+=86;}
      function gallery(c){
        const photos=photosByCinema.get(c.id),cols=photos.length===1?1:2,gap=22,w=(inner-(cols-1)*gap)/cols,h=cols===1?470:350;
        for(let i=0;i<photos.length;i+=cols){const row=photos.slice(i,i+cols);let captionHeight=0;
          row.forEach((p,j)=>{const lines=wrap(p.title,w-24,18,500);captionHeight=Math.max(captionHeight,lines.length*29);commands.push({kind:'image',photo:p,x:pad+j*(w+gap),y,w,h,lines});});
          y+=h+captionHeight+42;
        }
      }
      y=67;text('부산 영화관 탐험대 · 나의 발견 노트',20,'#567999',700,17);text('우리 지역 영화관 탐험 기록',43,'#153d66',800,17);
      text(state.identity||'이름 미입력',23,'#567999',600,15);
      if(state.settings.movie)text('기억에 남는 영화 · '+state.settings.movie,21);
      section('01  나의 경험');text('함께 영화를 본 기억',20,'#416e98',700,5);text(state.memory.together);text('마음에 남은 순간',20,'#416e98',700,5);text(state.memory.impression);
      section('02  자료로 알아본 영화관');for(const c of reportCinemas()){const n=state.notes[c.id];text(c.name,29,'#1b4e79',800,15);gallery(c);text('내가 찾은 특징',20,'#416e98',700,5);text(n.feature);text('선택한 근거 · '+(n.evidence.map(id=>c.evidence.find(e=>e.id===id).title).join(' / ')||'아직 담지 않았어요.'),19,'#60809b');text('사람들에게 주는 도움',20,'#416e98',700,5);text(n.help);if(n.question){text('더 궁금한 점',20,'#416e98',700,5);text(n.question);}y+=12;}
      section('03  우리 지역 영화관의 의미');for(const q of meaningEntries()){text(q.topic+' · '+q.text,20,'#416e98',700,5);text(state.meaning[q.id]);}text('한 문장으로 정리한 의미',20,'#416e98',700,5);text(state.meaning.final,27,'#1b4e79',700,20);
      if(state.visit.observed||state.visit.changed){section('04  직접 다녀온 뒤의 발견');text('직접 관찰한 것 · '+(state.visit.observed||'아직 기록하지 않았어요.'));text('새롭게 알게 된 의미 · '+(state.visit.changed||'아직 기록하지 않았어요.'));}
      y+=20;text(REPORT_SOURCE_NOTE,16,'#6886a0',400,0);
      const height=y+75,scale=Math.min(1,28800/height);canvas.width=Math.round(width*scale);canvas.height=Math.ceil(height*scale);ctx.scale(scale,scale);
      ctx.fillStyle='#f8fcff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#8dcefa';ctx.fillRect(0,0,width,21);
      ctx.strokeStyle='#deedf9';ctx.lineWidth=1;for(let x=18;x<width;x+=34){ctx.beginPath();ctx.moveTo(x,28);ctx.lineTo(x,height);ctx.stroke();}
      ctx.fillStyle='#f8fcff';ctx.fillRect(pad-22,45,inner+44,height-78);
      for(const cmd of commands){
        if(cmd.kind==='section'){
          ctx.fillStyle='#c0e5ff';ctx.strokeStyle='#1b4e79';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(pad-15,cmd.y,inner+30,59,12);ctx.fill();ctx.stroke();ctx.font=font(27,800);ctx.fillStyle='#1b4e79';ctx.textBaseline='top';ctx.fillText(cmd.title,pad+8,cmd.y+10);
        }else if(cmd.kind==='image'){
          const {photo:p,x,y,w,h,lines}=cmd;ctx.fillStyle='#eaf4fc';ctx.strokeStyle='#4b7ba3';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();ctx.stroke();
          const fit=Math.min((w-20)/p.img.naturalWidth,(h-20)/p.img.naturalHeight),iw=p.img.naturalWidth*fit,ih=p.img.naturalHeight*fit;
          ctx.drawImage(p.img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);ctx.font=font(18,500);ctx.fillStyle='#547998';ctx.textBaseline='top';lines.forEach((line,i)=>ctx.fillText(line,x+12,y+h+10+i*29));
        }else{ctx.font=font(cmd.size,cmd.weight);ctx.fillStyle=cmd.color;ctx.textBaseline='top';cmd.lines.forEach((line,i)=>ctx.fillText(line,pad,cmd.y+i*cmd.lineHeight));}
      }
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('blob');downloadBlob(blob,filename('png'));showToast('사진과 나의 기록을 함께 저장했어요.');
    } catch {showToast('사진과 기록을 저장하지 못했어요. 다시 시도하거나 인쇄 · PDF 저장을 이용해 주세요.');}
    finally {buttons.forEach(b=>b.disabled=false);}
  }
  document.addEventListener('input',event=>{
    const el=event.target,path=el.dataset.field;if(!path)return;
    setPath(path,el.value);save();
    if(path.startsWith('notes.')){const c=cinema(state.cinema);const p=$('#progress-'+c.id);if(p)p.textContent=progress(c)===3?'✓':`${progress(c)}/3`;if($('#noteCount'))$('#noteCount').textContent=`${progress(c)} / 3 기록 완료`;document.querySelectorAll('[data-note-progress]').forEach(el=>el.textContent=progress(c)+' / 3');}
    if(path.startsWith('meaning.')){const id=path.split('.')[1],mark=document.querySelector('[data-meaning-mark="'+id+'"]');if(mark){mark.textContent=state.meaning[id].trim()?'✓':'';mark.setAttribute('aria-label',state.meaning[id].trim()?'생각 기록함':'생각 기록 전');}const count=document.querySelector('[data-meaning-count]');if(count)count.textContent='질문 '+meaningEntries().length+'개에 생각을 썼어요. 필요한 질문만 골라도 좋아요.';}
    if(state.step===3 && path.startsWith('visit.'))$('.report-sheet').innerHTML=reportHTML(false);
  });
  document.addEventListener('change',event=>{const el=event.target;if(el.matches('select[data-field]')){setPath(el.dataset.field,el.value);save();}});
  document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&!event.target.dataset.fallback){event.target.dataset.fallback='true';event.target.src='assets/photo-unavailable.svg';event.target.alt+=' · 사진을 불러오지 못했어요. 자료 원문에서 확인하세요.';}},true);
  document.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.matches('input,textarea,select'))return;if($('#modal').open&&$('#modal').classList.contains('gallery-dialog')){event.preventDefault();moveGallery(event.key==='ArrowRight'?1:-1);}else if(state.step===1&&!$('#modal').open&&event.target.matches('.photo-thumb,.reading-thumb,.photo-stage')){event.preventDefault();moveEvidence(event.key==='ArrowRight'?1:-1);}});
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action;
    if(action==='step')return goStep(Number(button.dataset.step));
    if(action==='cinema'){state.cinema=button.dataset.cinema;state.step=1;currentEvidence=0;researchMode='photos';save();render();window.scrollTo({top:0,behavior:'instant'});return;}
    if(action==='evidence'){currentEvidence=Number(button.dataset.index);render();return;}
    if(action==='collect'||action==='remove-evidence'){
      const n=state.notes[state.cinema],id=button.dataset.evidence;
      if(action==='collect'){if(!n.evidence.includes(id))n.evidence.push(id);showToast('조사 기록장에 근거를 담았어요.');}
      else n.evidence=n.evidence.filter(e=>e!==id);
      const galleryOpen=$('#modal').open&&$('#modal').classList.contains('gallery-dialog');
      const recordOpen=$('#modal').open&&$('#modal').classList.contains('record-dialog');
      save();render();
      if(galleryOpen)galleryModal();
      else if(recordOpen){$('.record-evidence .evidence-selected').innerHTML=evidenceTokens(cinema(state.cinema));$('#noteCount').textContent=progress(cinema(state.cinema))+' / 3 기록 완료';}
      return;
    }

    if(action==='memory-tab'){memoryTab=button.dataset.value;render();return;}
    if(action==='research-mode'){researchMode=button.dataset.value;activeEvidence();render();return;}
    if(action==='previous-evidence')return moveEvidence(-1);
    if(action==='next-evidence')return moveEvidence(1);
    if(action==='record')return recordModal();
    if(action==='question-help'){const e=activeEvidence().entry.item;return modal('사진과 자료를 보고 생각해 봐요',`<p class="question-large">${esc(e.question)}</p><button class="btn" data-action="close">자료로 돌아가기</button>`);}
    if(action==='word-help'){const e=activeEvidence().entry.item;return modal('낱말 도움',`<p>${esc(e.word)}</p>`);}
    if(action==='gallery-prev')return moveGallery(-1);
    if(action==='gallery-next')return moveGallery(1);
    if(action==='meaning-topic'){meaningTopic=button.dataset.topic;if(meaningTopic!=='final')meaningQuestion=MEANING_TOPICS.find(t=>t.id===meaningTopic).questions[0].id;render();return;}
    if(action==='meaning-question'){meaningQuestion=button.dataset.question;render();return;}
    if(action==='meaning-next'){const at=MEANING_QUESTIONS.findIndex(q=>q.id===meaningQuestion);if(at===MEANING_QUESTIONS.length-1)meaningTopic='final';else{meaningQuestion=MEANING_QUESTIONS[at+1].id;meaningTopic=MEANING_TOPICS.find(t=>t.questions.some(q=>q.id===meaningQuestion)).id;}render();return;}
    if(action==='meaning-help')return meaningHelp();
    if(action==='identity')return identityModal();
    if(action==='menu')return menuModal();
    if(action==='close')return $('#modal').close();
    if(action==='sources')return sourcesModal();
    if(action==='zoom')return galleryModal();
    if(action==='location'){const c=cinema(state.cinema);return modal(c.name+'의 위치',`<span class="tag">부산 ${c.area}</span><h3>${c.address}</h3><p>${c.location}</p><a class="btn" href="https://map.kakao.com/link/search/${encodeURIComponent(c.name)}" target="_blank" rel="noopener noreferrer">지도에서 위치 확인 ↗</a><p class="small" style="margin-top:15px">새 탭에서 지도가 열려요. 자세한 교통 안내는 영화관 공식 안내를 확인해요.</p>`);}
    if(action==='hint'){hintOpen=!hintOpen;render();return;}
    if(action==='projection'){projection=!projection;if($('#modal').open)$('#modal').close();render();showToast(projection?'발표 화면을 크게 표시해요.':'보통 크기로 돌아왔어요.');return;}
    if(action==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();$('#modal').close();}catch{showToast('이 브라우저에서는 전체 화면을 지원하지 않아요.');}return;}
    if(action==='download-png')return downloadPNG();
    if(action==='backup')return backup();
    if(action==='import')return importFile();
    if(action==='copy')return copyReport();
    if(action==='print'){$('#printRoot').innerHTML=`<article class="report-sheet">${reportHTML(true)}</article>`;await Promise.all([...$('#printRoot').querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));window.print();return;}
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
