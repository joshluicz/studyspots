// studyspots — progressive enhancement. Pages work without this file; it adds the area filters,
// fetches the suggestions for a spot, and submits the form without a page reload.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---- area filters -------------------------------------------------------------------------
  const filters = $('.filters');
  if (filters) {
    filters.hidden = false;
    const cards = $$('.list > li');
    const empty = $('.empty-filter');
    const apply = (key) => {
      let shown = 0;
      for (const li of cards) {
        const on = key === 'all' || (li.dataset.tags || '').split(' ').includes(key);
        li.hidden = !on;
        if (on) shown++;
      }
      if (empty) empty.hidden = shown > 0;
      for (const b of $$('.chip', filters)) b.setAttribute('aria-pressed', String(b.dataset.filter === key));
    };
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (b) apply(b.dataset.filter);
    });
  }

  // ---- suggestions --------------------------------------------------------------------------
  const sec = $('[data-suggestions]');
  if (!sec) return;
  const spot = sec.dataset.suggestions;
  const list = $('.sugg-list', sec);
  const emptyMsg = $('.empty', sec);
  const form = $('form.suggest', sec);
  const msg = $('.msg', form);
  const ta = $('textarea', form);
  const counter = $('.counter', form);
  const btn = $('button[type="submit"]', form);

  const fmt = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const item = (s, isNew) => {
    const li = document.createElement('li');
    li.className = 'sugg' + (isNew ? ' is-new' : '');
    li.innerHTML = `<p>${esc(s.text)}</p><time datetime="${esc(s.at)}">${esc(fmt(s.at))}</time>`;
    return li;
  };
  const render = (items) => {
    list.innerHTML = '';
    for (const s of items) list.appendChild(item(s, false));
    emptyMsg.hidden = items.length > 0;
    const h = $('h2', sec);
    if (h && items.length) h.textContent = `What ${items.length === 1 ? 'one person' : items.length + ' people'} added`;
  };

  fetch(`/api/suggestions/${encodeURIComponent(spot)}`, { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((d) => render(d.items || []))
    .catch(() => { /* static host without the function: the empty state stands */ });

  if (ta && counter) {
    const max = Number(ta.getAttribute('maxlength')) || 280;
    const tick = () => { counter.textContent = `${ta.value.length} / ${max}`; };
    ta.addEventListener('input', tick); tick();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    msg.className = 'msg';
    if (text.length < 10) { msg.textContent = 'Say a little more. Ten characters is the minimum.'; msg.classList.add('is-error'); ta.focus(); return; }
    btn.disabled = true; msg.textContent = 'Sending.';
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ spot, text, website: form.elements.website.value }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `The server answered ${r.status}.`);
      list.prepend(item(d.item, true));
      emptyMsg.hidden = true;
      ta.value = ''; ta.dispatchEvent(new Event('input'));
      msg.textContent = 'Added. It is on this page now.'; msg.classList.add('is-ok');
    } catch (err) {
      msg.textContent = err.message || 'That did not go through. Try again in a minute.';
      msg.classList.add('is-error');
    } finally {
      btn.disabled = false;
    }
  });
})();
