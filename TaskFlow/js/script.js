(() => {
  // Auth-aware nav controls
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const session = window.auth && window.auth.getSession ? window.auth.getSession() : null;
      const loginLink = document.getElementById('login-link');
      const logoutBtn = document.getElementById('logout-btn');
      if (session) {
        if (loginLink) loginLink.style.display = 'none';
        if (logoutBtn) {
          logoutBtn.style.display = 'inline-flex';
          logoutBtn.addEventListener('click', () => {
            window.auth && window.auth.clearSession && window.auth.clearSession();
            window.location.href = 'login.html';
          });
        }
      }
    } catch (_) {}
  });
  const STORAGE_KEY = 'taskflow.tasks.v1';

  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('task-list');
  const clearAllBtn = document.getElementById('clear-all');
  const emptyState = document.getElementById('empty-state');
  const counterTotal = document.getElementById('counter-total');
  const counterDone = document.getElementById('counter-done');

  /** @type {{id:string, title:string, done:boolean}[]} */
  let tasks = [];

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(tasks)) tasks = [];
    } catch (_) {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function updateCounters() {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    counterTotal.textContent = String(total);
    counterDone.textContent = String(done);
  }

  function syncEmptyState() {
    emptyState.style.display = tasks.length === 0 ? 'block' : 'none';
  }

  function createTaskItem(task) {
    const li = document.createElement('li');
    li.className = `task${task.done ? ' task--done' : ''}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task__checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Mark as completed');

    const title = document.createElement('p');
    title.className = 'task__title';
    title.textContent = task.title;

    const del = document.createElement('button');
    del.className = 'btn task__delete';
    del.type = 'button';
    del.setAttribute('aria-label', 'Delete task');
    del.textContent = 'Delete';

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(del);
    return li;
  }

  function render() {
    list.innerHTML = '';
    const frag = document.createDocumentFragment();
    tasks.forEach(task => frag.appendChild(createTaskItem(task)));
    list.appendChild(frag);
    updateCounters();
    syncEmptyState();
  }

  function addTask(title) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      done: false,
    };
    tasks.unshift(task);
    saveTasks();
    render();
  }

  function toggleTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(x => x.id !== id);
    saveTasks();
    render();
  }

  function clearAll() {
    if (tasks.length === 0) return;
    tasks = [];
    saveTasks();
    render();
  }

  // Events
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  list.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const li = target.closest('li.task');
    if (!li) return;
    const id = li.dataset.id;
    if (!id) return;

    if (target.classList.contains('task__delete')) {
      deleteTask(id);
      return;
    }
  });

  list.addEventListener('change', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target && target.classList.contains('task__checkbox')) {
      const li = target.closest('li.task');
      if (!li) return;
      const id = li.dataset.id;
      if (!id) return;
      toggleTask(id);
    }
  });

  clearAllBtn.addEventListener('click', () => {
    clearAll();
    input.focus();
  });

  // Init
  loadTasks();
  render();
})();


