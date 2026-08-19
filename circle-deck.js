(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const chapterLabel = document.getElementById('chapterLabel');
  const count = document.getElementById('slideCount');
  const progress = document.getElementById('progressBar');
  const notesPanel = document.getElementById('notesPanel');
  const notesText = document.getElementById('notesText');
  const displayPanel = document.getElementById('displayPanel');
  let index = Math.max(0, Number(location.hash.replace('#', '')) - 1 || 0);
  let touchStart = null;
  let visualDensity = Math.max(0, Math.min(2, Number(document.body.dataset.visuals ?? 1)));

  const decoration = document.body.classList.contains('monster') ? ['🕸️','🦇','🕯️','🦴'] : ['🎟️','🎈','⭐','🍿'];
  slides.forEach(slide => {
    const figures = document.createElement('div');
    figures.className = 'density-figures';
    figures.setAttribute('aria-hidden', 'true');
    figures.innerHTML = decoration.map(item => `<span>${item}</span>`).join('');
    slide.append(figures);
  });

  function renderVisualDensity() {
    document.body.dataset.visuals = String(visualDensity);
    const label = document.getElementById('visualsLabel');
    if (label) label.textContent = ['Fewer', 'Current', 'More'][visualDensity];
  }

  function render(next, push = true) {
    index = Math.max(0, Math.min(slides.length - 1, next));
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    const slide = slides[index];
    chapterLabel.textContent = slide.dataset.chapter || document.title;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    notesText.textContent = slide.dataset.notes || 'No facilitator notes for this slide.';
    if (push) history.replaceState(null, '', `#${index + 1}`);
    document.dispatchEvent(new CustomEvent('deck:slidechange', { detail: { index, slide } }));
  }

  function toggleHidden(panel) {
    if (!panel) return;
    panel.hidden = !panel.hidden;
  }

  function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  const timerState = new WeakMap();
  function timerToggle(el) {
    if (!el) return;
    let state = timerState.get(el) || { left: Number(el.dataset.duration || 300), id: null };
    if (state.id) {
      clearInterval(state.id);
      state.id = null;
    } else {
      el.classList.remove('done');
      state.id = setInterval(() => {
        state.left = Math.max(0, state.left - 1);
        el.textContent = formatTime(state.left);
        if (state.left === 0) {
          clearInterval(state.id);
          state.id = null;
          el.classList.add('done');
        }
      }, 1000);
    }
    timerState.set(el, state);
  }

  function timerReset(el) {
    if (!el) return;
    const state = timerState.get(el);
    if (state?.id) clearInterval(state.id);
    const left = Number(el.dataset.duration || 300);
    timerState.set(el, { left, id: null });
    el.textContent = formatTime(left);
    el.classList.remove('done');
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'next') render(index + 1);
    if (action === 'prev') render(index - 1);
    if (action === 'go-home') render(0);
    if (action === 'notes') toggleHidden(notesPanel);
    if (action === 'display') toggleHidden(displayPanel);
    if (action === 'close-panel') button.closest('.notes-panel,.display-panel').hidden = true;
    if (action === 'theme') document.body.classList.toggle('projector-light');
    if (action === 'visuals-less') { visualDensity = Math.max(0, visualDensity - 1); renderVisualDensity(); }
    if (action === 'visuals-more') { visualDensity = Math.min(2, visualDensity + 1); renderVisualDensity(); }
    if (action === 'fullscreen') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
    if (action === 'timer-toggle') timerToggle(document.getElementById(button.dataset.target));
    if (action === 'timer-reset') timerReset(document.getElementById(button.dataset.target));
    if (action === 'reveal') {
      const target = document.getElementById(button.dataset.target);
      if (target) target.classList.remove('covered');
    }
  });

  document.addEventListener('keydown', event => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    if (typing) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); render(index + 1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); render(index - 1); }
    if (event.key === 'Home') render(0);
    if (event.key === 'End') render(slides.length - 1);
    if (event.key.toLowerCase() === 'n') toggleHidden(notesPanel);
    if (event.key.toLowerCase() === 'd') toggleHidden(displayPanel);
    if (event.key.toLowerCase() === 'c') document.body.classList.toggle('projector-light');
    if (event.key.toLowerCase() === 'f') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  });

  document.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (touchStart == null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 70) render(index + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  window.addEventListener('hashchange', () => render(Number(location.hash.replace('#', '')) - 1 || 0, false));
  window.CircleDeck = { go: render, get index() { return index; }, slides };
  renderVisualDensity();
  render(index, false);
})();
