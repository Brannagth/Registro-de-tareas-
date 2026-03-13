'use strict';


let tasks = [];           
let currentFilter = 'all'; 
let activePriority = 'low';
let openTaskId = null;     


const taskInput     = document.getElementById('task-input');
const addBtn         = document.getElementById('add-btn');
const taskList      = document.getElementById('task-list');
const emptyState    = document.getElementById('empty-state');
const doneCount     = document.getElementById('done-count');
const totalCount    = document.getElementById('total-count');
const clearDoneBtn  = document.getElementById('clear-done');
const themeToggle   = document.getElementById('theme-toggle');
const filterBtns    = document.querySelectorAll('.f-btn');
const prioBtns      = document.querySelectorAll('.prio-btn');


const overlay       = document.getElementById('modal-overlay');
const modalTitle    = document.getElementById('modal-task-title');
const progressFill  = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const subtaskInput  = document.getElementById('subtask-input');
const subtaskAddBtn = document.getElementById('subtask-add-btn');
const subtaskList   = document.getElementById('subtask-list');
const modalClose    = document.getElementById('modal-close');

// ── INICIO DE LA APP ──
function init() {
  loadStorage();  // Cargar tareas guardadas
  loadTheme();    // Cargar el tema (luz/oscuro)
  renderTasks();  // Dibujar las tareas en pantalla
  bindEvents();   // Activar los clics y teclas
}


function bindEvents() {
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });


  prioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      prioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePriority = btn.dataset.priority;
    });
  });


  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  clearDoneBtn.addEventListener('click', clearCompleted);
  themeToggle.addEventListener('click', toggleTheme);

  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Subtareas
  subtaskAddBtn.addEventListener('click', addSubtask);
  subtaskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addSubtask(); });
}


function addTask() {
  const text = taskInput.value.trim();
  if (!text) { shake(taskInput); return; } 

  tasks.unshift({
    id: Date.now(),
    text,
    completed: false,
    priority: activePriority,
    createdAt: Date.now(),
    subtasks: []
  });

  save();
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
  toast('Tarea agregada');
}

// ── ELIMINAR TAREA ──
function deleteTask(id) {
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (!li) return;
  li.classList.add('removing'); 
  li.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    save();
    renderTasks();
  }, { once: true });
}

// ── MARCAR TAREA COMO LISTA ──
function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.completed = !t.completed;

  if (t.completed) t.subtasks.forEach(s => s.completed = true);
  save();
  renderTasks();
}

// ── EDITAR TEXTO DE TAREA ──
function editTask(id, el) {
  el.contentEditable = 'true';
  el.focus();
  moveCursorToEnd(el);

  const finish = () => {
    el.contentEditable = 'false';
    const val = el.textContent.trim();
    const t = tasks.find(t => t.id === id);
    if (t && val) { t.text = val; save(); }
    else if (t) el.textContent = t.text;
  };
  
  const keys = e => {
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') {
      const t = tasks.find(t => t.id === id);
      if (t) el.textContent = t.text;
      el.blur();
    }
  };
  
  el.addEventListener('blur', finish, { once: true });
  el.addEventListener('keydown', keys);
}

// ── LIMPIAR TAREAS TERMINADAS ──
function clearCompleted() {
  const n = tasks.filter(t => t.completed).length;
  if (!n) { toast('No hay tareas completadas'); return; }
  tasks = tasks.filter(t => !t.completed);
  save();
  renderTasks();
  toast(`${n} tarea${n > 1 ? 's' : ''} eliminada${n > 1 ? 's' : ''}`);
}

// ── MOSTRAR TAREAS EN PANTALLA ──
function renderTasks() {
  const filtered = getFiltered();
  const done = tasks.filter(t => t.completed).length;
  
  doneCount.textContent = done;
  totalCount.textContent = tasks.length;

  if (filtered.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    taskList.innerHTML = filtered.map(taskHTML).join('');
    attachTaskEvents();
  }
}


function getFiltered() {
  switch (currentFilter) {
    case 'active':    return tasks.filter(t => !t.completed);
    case 'completed': return tasks.filter(t =>  t.completed);
    default:          return tasks;
  }
}


function taskHTML(t) {
  const age = getAge(t.createdAt, t.completed);
  const { pct, done, total } = getProgress(t);
  const hasSubtasks = t.subtasks.length > 0;

  return `
    <li class="task-item ${t.completed ? 'done' : ''}" data-id="${t.id}" data-priority="${t.priority}">
      <div class="task-check ${t.completed ? 'checked' : ''}" data-action="toggle"></div>

      <div class="task-body">
        <span class="task-text" data-action="edit" title="Doble clic para editar">${escHtml(t.text)}</span>

        <div class="task-meta">
          <span class="prio-badge ${t.priority}">${priLabel(t.priority)}</span>
          ${!t.completed ? `<span class="age-badge ${age.cls}">⏱ ${age.label}</span>` : ''}
          <button class="subtask-btn" data-action="open-subtasks">
            ${hasSubtasks ? `${done}/${total} pasos` : '+ Subtareas'}
          </button>
        </div>

        ${hasSubtasks ? `
        <div class="mini-progress">
          <div class="mini-track"><div class="mini-fill" style="width:${pct}%"></div></div>
          <span class="mini-label">${pct}%</span>
        </div>` : ''}
      </div>

      <div class="task-actions">
        <button class="del-btn" data-action="delete" title="Eliminar">✕</button>
      </div>
    </li>
  `;
}

// Conectar botones de tarea
function attachTaskEvents() {
  taskList.querySelectorAll('.task-item').forEach(li => {
    const id = Number(li.dataset.id);
    li.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleTask(id));
    const textEl = li.querySelector('[data-action="edit"]');
    textEl.addEventListener('dblclick', () => editTask(id, textEl));
    li.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(id));
    li.querySelector('[data-action="open-subtasks"]').addEventListener('click', () => openSubtasks(id));
  });
}

// ── VENTANA DE SUBTAREAS  ──
function openSubtasks(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  openTaskId = id;
  modalTitle.textContent = t.text;
  renderModalSubtasks(t);
  overlay.classList.add('open');
  subtaskInput.focus();
}

function renderModalSubtasks(t) {
  const { pct } = getProgress(t);
  progressFill.style.width = pct + '%';
  progressLabel.textContent = pct + '%';

  subtaskList.innerHTML = t.subtasks.map((s, i) => `
    <li class="subtask-item" data-index="${i}">
      <div class="sub-check ${s.completed ? 'checked' : ''}" data-action="sub-toggle"></div>
      <span class="sub-text ${s.completed ? 'done' : ''}">${escHtml(s.text)}</span>
      <button class="sub-del" data-action="sub-del">✕</button>
    </li>
  `).join('');

  subtaskList.querySelectorAll('.subtask-item').forEach(item => {
    const idx = Number(item.dataset.index);
    item.querySelector('[data-action="sub-toggle"]').addEventListener('click', () => toggleSubtask(idx));
    item.querySelector('[data-action="sub-del"]').addEventListener('click', () => deleteSubtask(idx));
  });
}

function addSubtask() {
  const text = subtaskInput.value.trim();
  if (!text) return;
  const t = tasks.find(t => t.id === openTaskId);
  if (!t) return;

  t.subtasks.push({ text, completed: false });
  save();
  renderModalSubtasks(t);
  renderTasks();
  subtaskInput.value = '';
  subtaskInput.focus();
}

function toggleSubtask(idx) {
  const t = tasks.find(t => t.id === openTaskId);
  if (!t) return;
  t.subtasks[idx].completed = !t.subtasks[idx].completed;
  t.completed = t.subtasks.every(s => s.completed);
  save();
  renderModalSubtasks(t);
  renderTasks();
}

function deleteSubtask(idx) {
  const t = tasks.find(t => t.id === openTaskId);
  if (!t) return;
  t.subtasks.splice(idx, 1);
  save();
  renderModalSubtasks(t);
  renderTasks();
}

function closeModal() {
  overlay.classList.remove('open');
  openTaskId = null;
}

// ── TEMA LUZ / OSCURIDAD ──
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  themeToggle.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
  localStorage.setItem('taskflow_theme', dark ? 'light' : 'dark');
}

function loadTheme() {
  const saved = localStorage.getItem('taskflow_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggle.querySelector('.theme-icon').textContent = saved === 'dark' ? '☾' : '☀';
}


function getProgress(t) {
  const total = t.subtasks.length;
  if (!total) return { pct: 0, done: 0, total: 0 };
  const done = t.subtasks.filter(s => s.completed).length;
  return { pct: Math.round((done / total) * 100), done, total };
}

function getAge(ts, completed) {
  if (completed) return { label: '', cls: '' };
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return { label: `${mins}m`, cls: '' };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h`, cls: '' };
  const days = Math.floor(hrs / 24);
  if (days < 3) return { label: `${days}d`, cls: 'warn' };
  return { label: `${Math.floor(days)}d`, cls: 'old' };
}

function priLabel(p) {
  return p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta';
}


function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


function moveCursorToEnd(el) {
  const r = document.createRange(), s = window.getSelection();
  r.selectNodeContents(el); r.collapse(false);
  s.removeAllRanges(); s.addRange(r);
}


function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.3s ease';
}

const shakeKf = document.createElement('style');
shakeKf.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`;
document.head.appendChild(shakeKf);

let _toastT;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove('show'), 2000);
}

// ── GUARDADO (STORAGE) ──
function save() { localStorage.setItem('taskflow_v2', JSON.stringify(tasks)); }
function loadStorage() {
  const s = localStorage.getItem('taskflow_v2');
  tasks = s ? JSON.parse(s) : [];
}

init();