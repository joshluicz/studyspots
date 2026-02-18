// Custom select that opens downward (avoids native select opening upward)
export function initCustomSelect(nativeSelect) {
  if (!nativeSelect || nativeSelect.tagName !== 'SELECT') return;
  const parent = nativeSelect.parentElement;
  if (!parent) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select-wrap';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', nativeSelect.getAttribute('aria-label') || 'Area');
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-select-dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.hidden = true;
  parent.replaceChild(wrapper, nativeSelect);
  wrapper.appendChild(nativeSelect);
  nativeSelect.hidden = true;
  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);
  function updateTrigger() {
    const sel = nativeSelect.options[nativeSelect.selectedIndex];
    trigger.textContent = (sel ? sel.textContent : 'Select');
    dropdown.querySelectorAll('.custom-select-option').forEach((d) => {
      d.classList.toggle('selected', d.dataset.value === nativeSelect.value);
    });
  }
  updateTrigger();
  function close() {
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', close);
  }
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.hidden) {
      dropdown.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      setTimeout(() => document.addEventListener('click', close), 0);
    } else {
      close();
    }
  });
  nativeSelect.addEventListener('change', updateTrigger);

  function refresh() {
    dropdown.innerHTML = '';
    Array.from(nativeSelect.options).forEach((opt) => {
      const div = document.createElement('div');
      div.className = 'custom-select-option';
      div.setAttribute('role', 'option');
      div.dataset.value = opt.value;
      div.textContent = opt.textContent;
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        nativeSelect.value = opt.value;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        updateTrigger();
        close();
      });
      dropdown.appendChild(div);
    });
    updateTrigger();
  }

  return { updateTrigger, close, refresh };
}
