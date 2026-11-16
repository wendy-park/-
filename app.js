/* 인스타 저장 레시피 — 데이터 정리 + 화면 */
(function () {
  'use strict';

  // ── 캡션 → 구조화 ────────────────────────────────────────────
  var MARK = /^(?:[-•·*▫▪◆→▶▷○●■□※]|\d{1,2}[.)]|[①-⑳❶-➓]|✅|✔️|☑️|🔸|📍)\s*/;
  var UNIT = /(g\b|kg|ml|L\b|개\b|알\b|대\b|장\b|컵|스푼|큰술|작은술|봉|팩|줌|꼬집|T\b|t\b|모\b|마리|쪽|톨|조각|국자|인분|숟|캔|병|스틱|장|인분)/;
  var QTY = /(\d|한|두|세|네|반|약간|적당|듬뿍|넉넉|조금)/;
  var CATS = [
    ['디저트·베이킹', /(쿠키|케이크|디저트|빵|식빵|치아바타|포카치아|베이킹|마시멜로|만쥬|도넛|파이|푸딩|초콜릿|초코|스콘|마들렌|브라우니|티라미수|요거트|빼빼로|크루통|맛탕|감자떡|모찌|사브레|베이글|크루아상|잼|카스테라|와플|팬케이크|마카롱|젤리|시럽|스프레드|라떼|발효|이스트|강력분|박력분|쿠키커터)/],
    ['다이어트·초간단', /(다이어트|감량|칼로리|식단|밀프렙|저칼로리|다이어터|곤약|닭가슴살|유지어터|초간단|전자레인지|냉털|벌크업)/],
    ['중식·일식', /(짬뽕|마라|탕수육|우동|라멘|나시고랭|마제소바|샤오롱|딤섬|마파두부|짜장|돈코츠|규동|텐동|오코노미야키|가츠|쯔유|메밀|사리곰탕|깐풍|춘권|쌀국수|반미|파개장|샤브)/],
    ['양식', /(파스타|리조또|스테이크|샐러드|브리또|부리또|타코|스프|오믈렛|감바스|샌드위치|토스트|커리|크림소스|뇨끼|라자냐|햄버거|피자|퀘사디아|알리오|오일파스타|치아바타)/]
  ];

  function isStep(l) { return /^(?:\d{1,2}[.)]\s|[①-⑳❶-➓]|STEP\s*\d+|✅\s*[가-힣])/i.test(l); }
  function isIngHead(l) { var s = l.replace(/[^가-힣a-zA-Z]/g, ''); return s.length <= 14 && /(재료|준비물|주재료|부재료|양념|소스)/.test(s); }
  function isStepHead(l) { var s = l.replace(/[^가-힣a-zA-Z]/g, ''); return s.length <= 16 && /(레시피|만드는법|만들기|조리법|조리순서|조리과정|순서|방법|recipe)/i.test(s); }
  function strip(l) { return l.replace(MARK, '').replace(/\s+/g, ' ').trim(); }
  function hasQty(l) { return QTY.test(l) && UNIT.test(l); }

  function parseCaption(cap) {
    var lines = cap.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var title = '';
    for (var i = 0; i < Math.min(3, lines.length); i++) {
      var c = lines[i].replace(/^[^\w가-힣]+/, '').replace(/[^\w가-힣\s()]+$/, '').replace(/^\(광고\)\s*/, '').replace(/\s+/g, ' ').trim();
      if (c.replace(/[^\w가-힣]/g, '').length >= 4) { title = c.slice(0, 42); break; }
    }
    if (!title) title = (lines[0] || '레시피').slice(0, 42);

    var ing = [], steps = [], sec = null;
    for (var j = 0; j < lines.length; j++) {
      var l = lines[j];
      if (j <= 2 && l === title) continue;
      if (isIngHead(l)) { sec = 'ing'; continue; }
      if (isStepHead(l)) { sec = 'step'; continue; }
      if (isStep(l)) { var st = strip(l); if (st.length > 6) steps.push(st); sec = 'step'; continue; }
      var t = strip(l);
      if (!t) continue;
      if (sec === 'ing') {
        if (t.length <= 70) { var parts = /,/.test(t) && t.length < 60 ? t.split(/,\s*/) : [t]; Array.prototype.push.apply(ing, parts); }
        continue;
      }
      if (sec === 'step') { if (t.length > 6) steps.push(t); continue; }
      if (hasQty(t) && t.length <= 80) { var p2 = /,/.test(t) ? t.split(/,\s*/) : [t]; Array.prototype.push.apply(ing, p2); }
    }
    var dedupe = function (a) {
      var seen = {}, out = [];
      a.forEach(function (s) {
        s = s.replace(/^[:：]\s*/, '').replace(/\s+/g, ' ').trim();
        if (s.length > 1 && s.length < 90 && !seen[s]) { seen[s] = 1; out.push(s); }
      });
      return out;
    };
    var cat = '한식', best = 0;
    var hay = title + ' ' + cap.slice(0, 400);
    CATS.forEach(function (c) {
      var m = hay.match(new RegExp(c[1].source, 'g'));
      var n = m ? m.length : 0;
      if (n > best) { best = n; cat = c[0]; }
    });
    return { title: title, cat: cat, ing: dedupe(ing).slice(0, 18), steps: dedupe(steps).slice(0, 16) };
  }

  var RECIPES = (window.RECIPES || []).map(function (r) {
    var p = parseCaption(r.c || '');
    return {
      key: r.k, author: r.a, type: r.t,
      url: 'https://www.instagram.com/' + (r.t || 'reel') + '/' + r.k + '/',
      caption: r.c || '',
      title: p.title, cat: p.cat, ing: p.ing, steps: p.steps,
      hay: (p.title + ' ' + p.ing.join(' ') + ' ' + (r.c || '')).toLowerCase()
    };
  });

  // ── 저장소 ──────────────────────────────────────────────────
  var LS_KEY = 'recipes.favs.v1';
  var favs = {};
  try { favs = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { favs = {}; }
  function saveFavs() { try { localStorage.setItem(LS_KEY, JSON.stringify(favs)); } catch (e) {} }
  function checkKey(k) { return 'recipes.check.' + k; }
  function loadChecks(k) { try { return JSON.parse(localStorage.getItem(checkKey(k)) || '{}') || {}; } catch (e) { return {}; } }
  function saveChecks(k, o) { try { localStorage.setItem(checkKey(k), JSON.stringify(o)); } catch (e) {} }

  // ── 상태 ────────────────────────────────────────────────────
  var state = { q: '', cat: '전체', tab: 'all' };
  var CAT_LIST = ['전체', '한식', '양식', '중식·일식', '디저트·베이킹', '다이어트·초간단'];

  var $ = function (s) { return document.querySelector(s); };
  var listEl = $('#list'), emptyEl = $('#empty'), catsEl = $('#cats'), qEl = $('#q');

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function filtered() {
    var q = state.q.trim().toLowerCase().replace(/\s+/g, '');
    return RECIPES.filter(function (r) {
      if (state.tab === 'fav' && !favs[r.key]) return false;
      if (state.cat !== '전체' && r.cat !== state.cat) return false;
      if (!q) return true;
      return r.hay.replace(/\s+/g, '').indexOf(q) >= 0;
    });
  }

  function cardHTML(r) {
    var chips = r.ing.slice(0, 4).map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('');
    if (r.ing.length > 4) chips += '<span class="chip more">+' + (r.ing.length - 4) + '</span>';
    var sub = r.steps.length ? r.steps.length + '단계' : (r.caption ? '캡션으로 보기' : '영상으로 보기');
    return '<article class="card" data-k="' + r.key + '">' +
      '<button class="fav ' + (favs[r.key] ? 'on' : '') + '" data-fav="' + r.key + '" aria-label="즐겨찾기">' + (favs[r.key] ? '♥' : '♡') + '</button>' +
      '<h3>' + esc(r.title) + '</h3>' +
      '<div class="meta"><span>' + esc(r.cat) + '</span><i class="dot"></i><span>@' + esc(r.author) + '</span><i class="dot"></i><span>' + sub + '</span></div>' +
      (chips ? '<div class="chips">' + chips + '</div>' : '') +
      '</article>';
  }

  function render() {
    var rows = filtered();
    listEl.innerHTML = rows.map(cardHTML).join('');
    emptyEl.hidden = rows.length > 0;
    var n = Object.keys(favs).length;
    $('#favCount').textContent = n ? n : '';
    $('#sub').textContent = '인스타 저장함에서 모은 레시피 ' + RECIPES.length + '개';
    catsEl.innerHTML = CAT_LIST.map(function (c) {
      return '<button class="cat ' + (state.cat === c ? 'on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }

  // ── 상세 ────────────────────────────────────────────────────
  var sheet = $('#sheet'), body = $('#sheetBody'), current = null;

  function openDetail(k) {
    var r = RECIPES.filter(function (x) { return x.key === k; })[0];
    if (!r) return;
    current = r;
    var checks = loadChecks(r.key);
    var ingHTML = r.ing.length
      ? '<div class="ings">' + r.ing.map(function (x, i) {
          var on = !!checks[i];
          return '<label class="ing ' + (on ? 'done' : '') + '"><input type="checkbox" data-i="' + i + '" ' + (on ? 'checked' : '') + '><span>' + esc(x) + '</span></label>';
        }).join('') + '</div>'
      : '<p class="note">재료 목록이 캡션에서 자동으로 잡히지 않았어요. 아래 원문 캡션에서 확인해 주세요.</p>';

    var stepsHTML = r.steps.length
      ? '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'
      : '<p class="note">조리 순서가 캡션에 짧게 적혀 있어요. 원문 캡션과 릴스를 함께 봐 주세요.</p>';

    body.innerHTML =
      '<h1 class="d-title">' + esc(r.title) + '</h1>' +
      '<div class="d-meta"><span class="pill">' + esc(r.cat) + '</span><span>@' + esc(r.author) + '</span></div>' +
      '<section class="sec"><h2>재료 <span class="progress" id="prog"></span></h2>' + ingHTML + '</section>' +
      '<section class="sec"><h2>조리 순서</h2>' + stepsHTML + '</section>' +
      '<section class="sec"><h2>원문 캡션</h2><details class="caption"><summary>캡션 펼치기</summary><pre>' + esc(r.caption) + '</pre></details></section>' +
      '<a class="src" href="' + esc(r.url) + '" target="_blank" rel="noopener">인스타 릴스 열기 ↗</a>';

    var favBtn = $('#favBtn');
    favBtn.className = 'fav big ' + (favs[r.key] ? 'on' : '');
    favBtn.textContent = favs[r.key] ? '♥' : '♡';

    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    sheet.scrollTop = 0;
    updateProgress();
  }

  function updateProgress() {
    if (!current) return;
    var boxes = body.querySelectorAll('.ing input');
    if (!boxes.length) { var p = $('#prog'); if (p) p.textContent = ''; return; }
    var done = 0;
    boxes.forEach(function (b) { if (b.checked) done++; });
    var p2 = $('#prog');
    if (p2) p2.textContent = done + '/' + boxes.length;
  }

  function closeDetail() {
    sheet.hidden = true;
    document.body.style.overflow = '';
    current = null;
    render();
  }

  // ── 이벤트 ──────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var favBtn2 = e.target.closest('[data-fav]');
    if (favBtn2) {
      e.stopPropagation();
      var k = favBtn2.getAttribute('data-fav');
      if (favs[k]) delete favs[k]; else favs[k] = 1;
      saveFavs();
      favBtn2.classList.toggle('on', !!favs[k]);
      favBtn2.textContent = favs[k] ? '♥' : '♡';
      $('#favCount').textContent = Object.keys(favs).length || '';
      if (state.tab === 'fav') render();
      return;
    }
    var catBtn = e.target.closest('[data-cat]');
    if (catBtn) { state.cat = catBtn.getAttribute('data-cat'); render(); return; }
    var tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      state.tab = tabBtn.getAttribute('data-tab');
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t === tabBtn); });
      render(); return;
    }
    var card = e.target.closest('.card');
    if (card) { openDetail(card.getAttribute('data-k')); return; }
    var ing = e.target.closest('.ing input');
    if (ing && current) {
      var idx = ing.getAttribute('data-i');
      var c = loadChecks(current.key);
      if (ing.checked) c[idx] = 1; else delete c[idx];
      saveChecks(current.key, c);
      ing.parentElement.classList.toggle('done', ing.checked);
      updateProgress();
      return;
    }
  });

  qEl.addEventListener('input', function () {
    state.q = qEl.value;
    $('#clear').classList.toggle('on', !!state.q);
    render();
  });
  $('#clear').addEventListener('click', function () { qEl.value = ''; state.q = ''; $('#clear').classList.remove('on'); render(); qEl.focus(); });
  $('#back').addEventListener('click', closeDetail);
  $('#favBtn').addEventListener('click', function () {
    if (!current) return;
    if (favs[current.key]) delete favs[current.key]; else favs[current.key] = 1;
    saveFavs();
    this.classList.toggle('on', !!favs[current.key]);
    this.textContent = favs[current.key] ? '♥' : '♡';
    $('#favCount').textContent = Object.keys(favs).length || '';
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeDetail(); });
  window.addEventListener('popstate', function () { if (!sheet.hidden) { closeDetail(); } });

  render();
})();
