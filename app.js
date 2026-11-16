/* 인스타 저장 레시피 — 화면 */
(function () {
  'use strict';

  var RECIPES = (window.RECIPES || []).map(function (r) {
    return {
      key: r.k, author: r.a, type: r.t || 'reel',
      url: 'https://www.instagram.com/' + (r.t || 'reel') + '/' + r.k + '/',
      caption: r.cap || '',
      title: r.title || '레시피',
      cat: r.cat || '한식',
      ing: r.ing || [],
      steps: r.steps || [],
      hay: ((r.title || '') + ' ' + (r.ing || []).join(' ') + ' ' + (r.cap || '')).toLowerCase()
    };
  });

  var LS_KEY = 'recipes.favs.v1';
  var favs = {};
  try { favs = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { favs = {}; }
  function saveFavs() { try { localStorage.setItem(LS_KEY, JSON.stringify(favs)); } catch (e) {} }
  function loadChecks(k) { try { return JSON.parse(localStorage.getItem('recipes.check.' + k) || '{}') || {}; } catch (e) { return {}; } }
  function saveChecks(k, o) { try { localStorage.setItem('recipes.check.' + k, JSON.stringify(o)); } catch (e) {} }

  var CAT_LIST = ['전체', '한식', '양식', '중식·일식', '디저트·베이킹', '다이어트·초간단'];
  var state = { q: '', cat: '전체', tab: 'all' };

  var $ = function (s) { return document.querySelector(s); };
  var listEl = $('#list'), emptyEl = $('#empty'), catsEl = $('#cats'), qEl = $('#q');
  var sheet = $('#sheet'), body = $('#sheetBody'), current = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function favCount() { return Object.keys(favs).length; }

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
    $('#favCount').textContent = favCount() || '';
    $('#sub').textContent = '인스타 저장함에서 모은 레시피 ' + RECIPES.length + '개';
    catsEl.innerHTML = CAT_LIST.map(function (c) {
      return '<button class="cat ' + (state.cat === c ? 'on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }

  function openDetail(k) {
    var r = null;
    for (var i = 0; i < RECIPES.length; i++) if (RECIPES[i].key === k) { r = RECIPES[i]; break; }
    if (!r) return;
    current = r;
    var checks = loadChecks(r.key);

    var ingHTML = r.ing.length
      ? '<div class="ings">' + r.ing.map(function (x, i) {
          var on = !!checks[i];
          return '<label class="ing ' + (on ? 'done' : '') + '"><input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + '><span>' + esc(x) + '</span></label>';
        }).join('') + '</div>'
      : '<p class="note">재료가 캡션에서 자동으로 잡히지 않았어요. 아래 원문 캡션에서 확인해 주세요.</p>';

    var stepsHTML = r.steps.length
      ? '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'
      : '<p class="note">조리 순서가 캡션에 짧게 적혀 있어요. 원문 캡션과 릴스를 함께 봐 주세요.</p>';

    body.innerHTML =
      '<h1 class="d-title">' + esc(r.title) + '</h1>' +
      '<div class="d-meta"><span class="pill">' + esc(r.cat) + '</span><span>@' + esc(r.author) + '</span></div>' +
      '<section class="sec"><h2><span>재료</span><span class="progress" id="prog"></span></h2>' + ingHTML + '</section>' +
      '<section class="sec"><h2><span>조리 순서</span></h2>' + stepsHTML + '</section>' +
      '<section class="sec"><h2><span>원문 캡션</span></h2><details class="caption"><summary>캡션 펼치기</summary><pre>' + esc(r.caption) + '</pre></details></section>' +
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
    var p = $('#prog');
    if (!p) return;
    if (!boxes.length) { p.textContent = ''; return; }
    var done = 0;
    for (var i = 0; i < boxes.length; i++) if (boxes[i].checked) done++;
    p.textContent = done + '/' + boxes.length;
  }

  function closeDetail() {
    sheet.hidden = true;
    document.body.style.overflow = '';
    current = null;
    render();
  }

  document.addEventListener('click', function (e) {
    var favEl = e.target.closest('[data-fav]');
    if (favEl) {
      e.stopPropagation();
      var k = favEl.getAttribute('data-fav');
      if (favs[k]) delete favs[k]; else favs[k] = 1;
      saveFavs();
      favEl.classList.toggle('on', !!favs[k]);
      favEl.textContent = favs[k] ? '♥' : '♡';
      $('#favCount').textContent = favCount() || '';
      if (state.tab === 'fav') render();
      return;
    }
    var catBtn = e.target.closest('[data-cat]');
    if (catBtn) { state.cat = catBtn.getAttribute('data-cat'); render(); return; }

    var tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      state.tab = tabBtn.getAttribute('data-tab');
      var tabs = document.querySelectorAll('.tab');
      for (var t = 0; t < tabs.length; t++) tabs[t].classList.toggle('on', tabs[t] === tabBtn);
      render();
      return;
    }
    var card = e.target.closest('.card');
    if (card) { openDetail(card.getAttribute('data-k')); return; }
  });

  document.addEventListener('change', function (e) {
    var ing = e.target.closest('.ing input');
    if (!ing || !current) return;
    var idx = ing.getAttribute('data-i');
    var c = loadChecks(current.key);
    if (ing.checked) c[idx] = 1; else delete c[idx];
    saveChecks(current.key, c);
    ing.parentElement.classList.toggle('done', ing.checked);
    updateProgress();
  });

  qEl.addEventListener('input', function () {
    state.q = qEl.value;
    $('#clear').classList.toggle('on', !!state.q);
    render();
  });
  $('#clear').addEventListener('click', function () {
    qEl.value = ''; state.q = '';
    $('#clear').classList.remove('on');
    render(); qEl.focus();
  });
  $('#back').addEventListener('click', closeDetail);
  $('#favBtn').addEventListener('click', function () {
    if (!current) return;
    if (favs[current.key]) delete favs[current.key]; else favs[current.key] = 1;
    saveFavs();
    this.classList.toggle('on', !!favs[current.key]);
    this.textContent = favs[current.key] ? '♥' : '♡';
    $('#favCount').textContent = favCount() || '';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheet.hidden) closeDetail();
  });

  try { render(); } catch (err) {
    listEl.innerHTML = '<p class="note">레시피를 불러오지 못했어요: ' + esc(err && err.message ? err.message : err) + '</p>';
  }
})();
