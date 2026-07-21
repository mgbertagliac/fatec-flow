(() => {
  'use strict';

  const APP_VERSION = '3.0.0';
  const STORAGE_KEY = 'fatecFlow.v2';
  const LEGACY_KEYS = ['fatecFlow.production.v4', 'fatecFlow.production.v3', 'fatecFlow.production.v2'];
  const TZ = 'America/Sao_Paulo';
  const OFFICIAL_CALENDAR_URL = 'https://fatecbauru.cps.sp.gov.br/calendario-academico/';
  const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar';

  const EVENT_TYPES = {
    aula: { label: 'Aula', emoji: '🎓', color: '#3b6db5' },
    transporte: { label: 'Transporte', emoji: '🚌', color: '#b56a20' },
    trabalho: { label: 'Trabalho', emoji: '💼', color: '#596276' },
    estudo: { label: 'Estudo', emoji: '📖', color: '#22815b' },
    prazo: { label: 'Prazo', emoji: '⏳', color: '#a15b17' },
    evento: { label: 'Evento', emoji: '📌', color: '#8d3fac' },
    feriado: { label: 'Feriado', emoji: '🎉', color: '#b1354b' },
    rotina: { label: 'Rotina', emoji: '☀️', color: '#687080' },
    outro: { label: 'Outro', emoji: '•', color: '#687080' }
  };

  const ACTIVITY_TYPES = {
    prova: { label: 'Prova', emoji: '📝', reminders: [10080, 2880, 120] },
    atividade: { label: 'Atividade', emoji: '✅', reminders: [2880, 120] },
    entrega: { label: 'Entrega', emoji: '📦', reminders: [10080, 2880, 240] },
    seminario: { label: 'Seminário', emoji: '🎤', reminders: [10080, 1440, 60] },
    apresentacao: { label: 'Apresentação', emoji: '🗣️', reminders: [10080, 1440, 60] },
    projeto: { label: 'Projeto', emoji: '🧩', reminders: [10080, 2880, 240] },
    lista: { label: 'Lista de exercícios', emoji: '📋', reminders: [2880, 120] },
    participacao: { label: 'Participação', emoji: '🙋', reminders: [60] },
    substitutiva: { label: 'Substitutiva', emoji: '🔁', reminders: [10080, 2880, 120] },
    exame: { label: 'Exame final', emoji: '🎯', reminders: [10080, 2880, 120] },
    bonus: { label: 'Bônus', emoji: '⭐', reminders: [1440] },
    outro: { label: 'Outra avaliação', emoji: '📎', reminders: [2880, 120] }
  };

  const REMINDER_PRESETS = {
    essential: {
      prova: [2880, 120], atividade: [1440, 120], entrega: [2880, 240], seminario: [1440, 60], apresentacao: [1440, 60], projeto: [2880, 240], lista: [1440, 120], participacao: [60], substitutiva: [2880, 120], exame: [2880, 120], bonus: [1440], outro: [1440]
    },
    reinforced: {
      prova: [10080, 2880, 1440, 120, 30], atividade: [2880, 1440, 240, 60], entrega: [10080, 2880, 1440, 240, 60], seminario: [10080, 2880, 1440, 60, 15], apresentacao: [10080, 2880, 1440, 60, 15], projeto: [10080, 2880, 1440, 240, 60], lista: [2880, 1440, 240, 60], participacao: [120, 30], substitutiva: [10080, 2880, 1440, 120, 30], exame: [10080, 2880, 1440, 120, 30], bonus: [2880, 1440], outro: [2880, 1440, 120]
    },
    event: {
      aula: [10], transporte: [30, 10], trabalho: [10], estudo: [15], prazo: [1440, 120], evento: [1440, 60], feriado: [1440], rotina: [10], outro: [60]
    }
  };

  const DEFAULT_SEMESTER = {
    id: 'semester-2026-2', name: '2026/2', startDate: '2026-08-03', endDate: '2026-12-23', status: 'active', color: '#9b1730', notes: 'Segundo semestre de 2026', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };

  const DEFAULT_SUBJECTS = [
    ['gpd','Gestão de Processos de Desenvolvimento de Software','#8f1530'],
    ['pe','Planejamento Estratégico','#bb4c29'],
    ['lati','Legislação Aplicada à Tecnologia da Informação','#6f4aa4'],
    ['fgti','Fundamentos de Gestão de Tecnologia da Informação','#3474a8'],
    ['ambd','Arquitetura e Modelagem de Banco de Dados','#176c58'],
    ['obbd','Otimização e Balanceamento de Banco de Dados','#2c7d9c'],
    ['socd','Sistemas Operacionais Centralizados e Distribuídos','#5e667a'],
    ['lab1','Laboratório de Desenvolvimento em Banco de Dados I','#8d3fac'],
    ['lab2','Laboratório de Desenvolvimento em Banco de Dados II','#a04875'],
    ['aacc','AACC','#a66b16'],
    ['estagio','Estágio Supervisionado','#31705d']
  ].map(([id,name,color]) => ({
    id: `subject-${id}`, semesterId: DEFAULT_SEMESTER.id, name, code: id.toUpperCase(), teacherId: '', color,
    kind: ['aacc','estagio'].includes(id) ? 'hours' : 'course', requiredHours: 0, completedHours: 0, passingGrade: 6, minAttendance: 75, totalPeriods: 0, periodsPerClass: 2, notes: '',
    formula: '', formulaMissingPolicy: 'block', formulaDecimals: 2, formulaRounding: 'normal', formulaUpdatedAt: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }));

  const DEFAULT_STATE = () => ({
    version: APP_VERSION,
    semesters: [{ ...DEFAULT_SEMESTER }],
    activeSemesterId: DEFAULT_SEMESTER.id,
    teachers: [],
    subjects: DEFAULT_SUBJECTS.map(item => ({ ...item })),
    activities: [],
    events: [],
    attendance: [],
    trash: [],
    settings: {
      theme: 'system', googleClientId: '', googleCalendarId: 'primary', googleTagSemester: true,
      lockTimeoutMinutes: 15, campusName: 'Fatec Bauru', campusLatitude: '', campusLongitude: '', campusRadius: 500,
      lastSyncAt: '', lastSyncReport: '', notificationPermissionAsked: false
    },
    security: { enabled: false, salt: '', hash: '', iterations: 160000, createdAt: '' },
    meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), migratedFrom: '', googleSemesterMigrationDone: false }
  });

  let state;
  let googleToken = '';
  let googleTokenClient = null;
  let deferredInstallPrompt = null;
  let currentView = 'dashboard';
  let selectedFormulaSubjectId = '';
  let pendingCheckin = null;
  let reminderDrafts = { activity: [], event: [] };
  let inactivityTimer = null;
  let lastInteraction = Date.now();
  let internalNotificationTimer = null;

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const uid = prefix => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
  const nowISO = () => new Date().toISOString();
  const todayISO = () => localDateISO(new Date());
  const clone = value => JSON.parse(JSON.stringify(value));
  const safeText = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const localDateISO = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const parseLocal = (date, time='12:00') => new Date(`${date}T${time || '00:00'}:00`);
  const formatDate = date => date ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(parseLocal(date)) : '—';
  const formatShortDate = date => date ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(parseLocal(date)) : '—';
  const formatWeekday = date => date ? new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(parseLocal(date)).replace('.','') : '';
  const formatNumber = (value, decimals=2) => Number.isFinite(Number(value)) ? Number(value).toLocaleString('pt-BR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}) : '—';
  const daysBetween = (a,b) => Math.round((parseLocal(b)-parseLocal(a))/86400000);
  const entityDateTime = item => parseLocal(item.date, item.allDay ? '00:00' : (item.start || '00:00'));
  const semesterById = id => state.semesters.find(item => item.id === id);
  const activeSemester = () => semesterById(state.activeSemesterId) || state.semesters.find(item => item.status === 'active') || state.semesters[0] || null;
  const subjectById = id => state.subjects.find(item => item.id === id);
  const teacherById = id => state.teachers.find(item => item.id === id);
  const activityById = id => state.activities.find(item => item.id === id);
  const eventById = id => state.events.find(item => item.id === id);
  const attendanceById = id => state.attendance.find(item => item.id === id);
  const semesterForDate = date => state.semesters.filter(item => date >= item.startDate && date <= item.endDate).sort((a,b) => a.startDate.localeCompare(b.startDate))[0] || null;
  const dateInsideSemester = (date, semesterId) => { const semester = semesterById(semesterId); return Boolean(semester && date && date >= semester.startDate && date <= semester.endDate); };
  const activeSubjects = () => state.subjects.filter(item => item.semesterId === state.activeSemesterId);
  const activeActivities = () => state.activities.filter(item => item.semesterId === state.activeSemesterId && !item.deletedAt);
  const activeEvents = () => state.events.filter(item => item.semesterId === state.activeSemesterId && !item.deletedAt);
  const activeAttendance = () => state.attendance.filter(item => item.semesterId === state.activeSemesterId && !item.deletedAt);

  state = loadState();

  function loadState() {
    const base = DEFAULT_STATE();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalizeState(JSON.parse(raw));
      for (const key of LEGACY_KEYS) {
        const legacy = localStorage.getItem(key);
        if (legacy) {
          const migrated = migrateLegacy(JSON.parse(legacy), key);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (error) {
      console.error('Falha ao carregar dados', error);
    }
    return base;
  }

  function normalizeState(input) {
    const base = DEFAULT_STATE();
    const out = { ...base, ...input };
    out.settings = { ...base.settings, ...(input.settings || {}) };
    out.security = { ...base.security, ...(input.security || {}) };
    out.meta = { ...base.meta, ...(input.meta || {}) };
    out.semesters = Array.isArray(input.semesters) ? input.semesters : base.semesters;
    out.teachers = Array.isArray(input.teachers) ? input.teachers : [];
    out.subjects = Array.isArray(input.subjects) ? input.subjects.map(subject => { const merged={ ...DEFAULT_SUBJECTS[0], ...subject }; if(!subject.kind)merged.kind=/aacc|est[aá]gio/i.test(subject.name||'')?'hours':'course'; merged.requiredHours=Number(subject.requiredHours||0); merged.completedHours=Number(subject.completedHours||0); return merged; }) : base.subjects;
    out.activities = Array.isArray(input.activities) ? input.activities : [];
    out.events = Array.isArray(input.events) ? input.events : [];
    out.attendance = Array.isArray(input.attendance) ? input.attendance : [];
    out.trash = Array.isArray(input.trash) ? input.trash : [];
    if (!out.activeSemesterId || !out.semesters.some(item => item.id === out.activeSemesterId)) out.activeSemesterId = out.semesters[0]?.id || '';
    out.version = APP_VERSION;
    out.meta.updatedAt = nowISO();
    return out;
  }

  function migrateLegacy(old, key) {
    const out = DEFAULT_STATE();
    out.meta.migratedFrom = key;
    out.semesters = Array.isArray(old.semesters) && old.semesters.length ? old.semesters : out.semesters;
    out.activeSemesterId = old.activeSemesterId || out.semesters[0]?.id || '';
    out.subjects = (old.subjects || out.subjects).map(subject => ({
      id: subject.id || uid('subject'), semesterId: subject.semesterId || out.activeSemesterId, name: subject.name || 'Disciplina', code: subject.code || '', teacherId: subject.teacherId || '', color: subject.color || '#9b1730',
      kind: subject.kind || (/aacc|est[aá]gio/i.test(subject.name||'') ? 'hours' : 'course'), requiredHours: Number(subject.requiredHours || 0), completedHours: Number(subject.completedHours || 0), passingGrade: Number(subject.passingGrade ?? 6), minAttendance: Number(subject.minAttendance ?? 75), totalPeriods: Number(subject.totalClasses ?? subject.totalPeriods ?? 0), periodsPerClass: Number(subject.periodsPerClass ?? 2), notes: subject.notes || '',
      formula: subject.formula || '', formulaMissingPolicy: subject.formulaMissingPolicy || 'block', formulaDecimals: Number(subject.formulaDecimals ?? 2), formulaRounding: subject.formulaRounding || 'normal', formulaUpdatedAt: subject.formulaUpdatedAt || '', createdAt: subject.createdAt || nowISO(), updatedAt: subject.updatedAt || nowISO()
    }));
    out.events = [];
    out.activities = [];
    for (const legacyEvent of (old.events || [])) {
      const semester = semesterByRangeFrom(out.semesters, legacyEvent.date) || out.semesters[0];
      const semesterId = legacyEvent.semesterId || semester?.id || '';
      const academicType = ACTIVITY_TYPES[legacyEvent.type] ? legacyEvent.type : (/prova|atividade|entrega|semin|apresent|projeto|substitut|exame|bonus/i.test(`${legacyEvent.type || ''} ${legacyEvent.title || ''}`) ? inferActivityType(legacyEvent.title || legacyEvent.type || '') : '');
      if (academicType) {
        out.activities.push({
          id: legacyEvent.id || uid('activity'), semesterId, subjectId: legacyEvent.subjectId || '', type: academicType,
          code: uniqueActivityCode(out.activities, legacyEvent.subjectId || '', legacyEvent.code || legacyEvent.title || ACTIVITY_TYPES[academicType]?.label || 'AV'),
          title: legacyEvent.title || ACTIVITY_TYPES[academicType]?.label || 'Avaliação', date: legacyEvent.date || semester?.startDate || todayISO(), allDay: Boolean(legacyEvent.allDay), start: legacyEvent.start || '', end: legacyEvent.end || '',
          maxScore: Number(legacyEvent.maxScore ?? 10), score: legacyEvent.score === '' || legacyEvent.score == null ? null : Number(legacyEvent.score), weight: Number(legacyEvent.weight || 0), simulatedScore: legacyEvent.simulatedScore ?? null,
          status: legacyEvent.status === 'concluido' ? 'graded' : legacyEvent.status === 'cancelado' ? 'cancelled' : (legacyEvent.status || 'planned'), priority: legacyEvent.priority || 'normal', location: legacyEvent.location || '', description: legacyEvent.description || '',
          reminderPreset: legacyEvent.reminderPreset || 'custom', reminders: legacyEvent.reminders || legacyEvent.alerts || [], syncWanted: legacyEvent.syncWanted !== false, dirty: Boolean(legacyEvent.dirty || legacyEvent.syncState === 'local'),
          googleEventId: legacyEvent.googleEventId || '', googleCalendarId: legacyEvent.googleCalendarId || '', googleRecurringEventId: legacyEvent.googleRecurringEventId || '', googleUpdated: legacyEvent.googleUpdated || '', needsSemesterGoogleUpdate: Boolean(legacyEvent.googleEventId),
          createdAt: legacyEvent.createdAt || nowISO(), updatedAt: legacyEvent.updatedAt || nowISO()
        });
      } else {
        out.events.push({ ...legacyEvent, semesterId, id: legacyEvent.id || uid('event'), reminders: legacyEvent.reminders || legacyEvent.alerts || [], dirty: Boolean(legacyEvent.dirty || legacyEvent.syncState === 'local'), syncWanted: legacyEvent.syncWanted !== false, needsSemesterGoogleUpdate: Boolean(legacyEvent.googleEventId), createdAt: legacyEvent.createdAt || nowISO(), updatedAt: legacyEvent.updatedAt || nowISO() });
      }
    }
    for (const grade of (old.grades || [])) {
      const subject = out.subjects.find(item => item.id === grade.subjectId); const semesterId = grade.semesterId || subject?.semesterId || out.activeSemesterId;
      const duplicate = out.activities.some(item => item.subjectId === grade.subjectId && normalize(item.title) === normalize(grade.name || '') && item.date === (grade.date || item.date));
      if (duplicate) continue;
      out.activities.push({ id: grade.id || uid('activity'), semesterId, subjectId: grade.subjectId || '', type: inferActivityType(grade.name || ''), code: uniqueActivityCode(out.activities, grade.subjectId, grade.name || 'AV'), title: grade.name || 'Avaliação', date: grade.date || semesterByRangeFrom(out.semesters, todayISO())?.startDate || todayISO(), allDay: true, start: '', end: '', maxScore: Number(grade.maxScore ?? grade.max ?? 10), score: grade.score === '' || grade.score == null ? null : Number(grade.score), weight: Number(grade.weight || 0), simulatedScore: null, status: grade.score == null ? 'planned' : 'graded', priority: 'normal', location: '', description: grade.notes || '', reminderPreset: 'recommended', reminders: [], syncWanted: false, dirty: false, googleEventId: '', googleCalendarId: '', googleUpdated: '', createdAt: grade.createdAt || nowISO(), updatedAt: grade.updatedAt || nowISO() });
    }
    out.attendance = (old.absences || []).map(absence => {
      const subject = out.subjects.find(item => item.id === absence.subjectId); const total = Number(absence.quantity || 1);
      return { id: absence.id || uid('attendance'), semesterId: absence.semesterId || subject?.semesterId || out.activeSemesterId, subjectId: absence.subjectId || '', date: absence.date || todayISO(), start: '', end: '', totalPeriods: total, presentPeriods: 0, status: absence.justified ? 'justified' : 'absent', notes: absence.reason || '', sourceEventId: '', checkin: null, createdAt: absence.createdAt || nowISO(), updatedAt: absence.updatedAt || nowISO() };
    });
    out.settings = { ...out.settings, ...(old.settings || {}) };
    out.security = old.security?.enabled ? { ...out.security, ...old.security } : out.security;
    return normalizeState(out);
  }

  function semesterByRangeFrom(semesters, date) { return semesters.find(item => date && date >= item.startDate && date <= item.endDate) || null; }

  function saveState() {
    state.version = APP_VERSION;
    state.meta.updatedAt = nowISO();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showToast(message, duration=2600) {
    const toast = $('toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function requireSemester(action='continuar') {
    if (state.semesters.length && activeSemester()) return true;
    showToast(`Cadastre um semestre antes de ${action}.`, 3500); switchView('semesters'); return false;
  }

  function downloadFile(name, content, type='application/octet-stream') {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ===== Segurança local =====
  async function derivePasswordHash(password, saltHex, iterations=160000) {
    const encoder = new TextEncoder();
    if (crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const salt = hexToBytes(saltHex);
      const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations, hash:'SHA-256' }, key, 256);
      return bytesToHex(new Uint8Array(bits));
    }
    let value = `${saltHex}:${password}`;
    for (let i=0;i<Math.min(iterations,10000);i++) value = simpleHash(value);
    return value;
  }
  const bytesToHex = bytes => [...bytes].map(value => value.toString(16).padStart(2,'0')).join('');
  const hexToBytes = hex => new Uint8Array((hex.match(/.{1,2}/g) || []).map(value => parseInt(value,16)));
  function simpleHash(text) { let hash=2166136261; for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);} return (hash>>>0).toString(16).padStart(8,'0'); }
  function randomSalt() { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return bytesToHex(bytes); }

  function showAuthGate(mode) {
    $('appShell').classList.add('hidden'); $('authGate').classList.remove('hidden');
    $('setupPasswordForm').classList.toggle('hidden', mode !== 'setup');
    $('unlockForm').classList.toggle('hidden', mode !== 'unlock');
    $('authTitle').textContent = mode === 'setup' ? 'Crie sua senha de acesso' : 'Fatec Flow bloqueado';
    $('authDescription').textContent = mode === 'setup' ? 'A senha protege os dados salvos localmente neste navegador.' : 'Digite sua senha para abrir o sistema acadêmico.';
    setTimeout(() => (mode === 'setup' ? $('setupPassword') : $('unlockPassword')).focus(), 100);
  }

  function unlockApp() {
    $('authGate').classList.add('hidden'); $('appShell').classList.remove('hidden'); lastInteraction = Date.now(); scheduleAutoLock(); renderAll();
  }

  function lockApp() {
    if (!state.security.enabled) return;
    googleToken = ''; showAuthGate('unlock');
  }

  function scheduleAutoLock() {
    clearInterval(inactivityTimer);
    const minutes = Number(state.settings.lockTimeoutMinutes || 0);
    if (!minutes) return;
    inactivityTimer = setInterval(() => { if (Date.now()-lastInteraction >= minutes*60000 && !$('authGate').classList.contains('hidden')) return; if (Date.now()-lastInteraction >= minutes*60000) lockApp(); }, 15000);
  }

  function registerActivity() { lastInteraction = Date.now(); }
  ['click','keydown','touchstart','pointerdown'].forEach(name => document.addEventListener(name, registerActivity, { passive:true }));

  $('setupPasswordForm').addEventListener('submit', async event => {
    event.preventDefault(); const password=$('setupPassword').value; const confirm=$('setupPasswordConfirm').value;
    if (password !== confirm) return showToast('As senhas não coincidem.');
    const salt=randomSalt(); const hash=await derivePasswordHash(password,salt,state.security.iterations);
    state.security={enabled:true,salt,hash,iterations:state.security.iterations,createdAt:nowISO()}; saveState(); $('setupPasswordForm').reset(); unlockApp(); showToast('Senha criada com sucesso.');
  });

  $('unlockForm').addEventListener('submit', async event => {
    event.preventDefault(); const hash=await derivePasswordHash($('unlockPassword').value,state.security.salt,state.security.iterations);
    if (hash !== state.security.hash) { $('unlockPassword').select(); return showToast('Senha incorreta.'); }
    $('unlockForm').reset(); unlockApp();
  });

  $('forgotPasswordButton').addEventListener('click', () => {
    const confirmation = prompt('Sem servidor não existe recuperação. Para apagar os dados e redefinir, digite APAGAR:');
    if (confirmation === 'APAGAR') { localStorage.removeItem(STORAGE_KEY); location.reload(); }
  });

  $('passwordForm').addEventListener('submit', async event => {
    event.preventDefault(); const current=await derivePasswordHash($('currentPassword').value,state.security.salt,state.security.iterations);
    if(current!==state.security.hash)return showToast('Senha atual incorreta.');
    if($('newPassword').value!==$('newPasswordConfirm').value)return showToast('A confirmação da nova senha não coincide.');
    const salt=randomSalt(); state.security.salt=salt; state.security.hash=await derivePasswordHash($('newPassword').value,salt,state.security.iterations); state.security.createdAt=nowISO(); saveState(); $('passwordDialog').close(); $('passwordForm').reset(); showToast('Senha alterada.');
  });

  // ===== Tema, navegação e campos =====
  function applyTheme() {
    const setting=state.settings.theme; const dark=setting==='dark'||(setting==='system'&&matchMedia('(prefers-color-scheme: dark)').matches); document.body.classList.toggle('dark',dark); $('themeSelect').value=setting;
  }

  const VIEW_META = {
    dashboard:['PAINEL ACADÊMICO','Hoje'], agenda:['COMPROMISSOS','Agenda'], semesters:['PERÍODOS','Semestres'], subjects:['GRADE','Disciplinas'], teachers:['DOCENTES','Professores'], evaluations:['DESEMPENHO','Notas e cálculos'], attendance:['FREQUÊNCIA','Presenças'], official:['INSTITUCIONAL','Calendário oficial'], settings:['PREFERÊNCIAS','Configurações']
  };

  function closeMobileMore() {
    const sheet=$('mobileMoreSheet'),backdrop=$('mobileMoreBackdrop');
    sheet?.classList.remove('open'); sheet?.setAttribute('aria-hidden','true'); backdrop?.classList.add('hidden');
  }
  function openMobileMore() {
    const sheet=$('mobileMoreSheet'),backdrop=$('mobileMoreBackdrop');
    sheet?.classList.add('open'); sheet?.setAttribute('aria-hidden','false'); backdrop?.classList.remove('hidden');
  }
  function updateMobileChrome() {
    const semester=activeSemester();
    if($('mobilePageTitle'))$('mobilePageTitle').textContent=VIEW_META[currentView]?.[1]||'Fatec Flow';
    if($('mobileSemesterLabel'))$('mobileSemesterLabel').textContent=semester?`${semester.name} · ${formatDate(semester.startDate)}–${formatDate(semester.endDate)}`:'Cadastre um semestre';
  }

  function switchView(view) {
    currentView=view; $$('.view').forEach(item=>item.classList.toggle('active',item.id===`view-${view}`)); $$('.nav-item').forEach(item=>item.classList.toggle('active',item.dataset.view===view));
    const secondaryViews=['semesters','teachers','attendance','official','settings']; const moreButton=document.querySelector('.mobile-bottom-nav [data-mobile-more]'); moreButton?.classList.toggle('active',secondaryViews.includes(view));
    $('pageEyebrow').textContent=VIEW_META[view]?.[0]||''; $('pageTitle').textContent=VIEW_META[view]?.[1]||''; updateMobileChrome(); closeMobileMore(); window.scrollTo({top:0,behavior:'smooth'}); renderCurrentView();
  }

  function openDialog(name, payload={}) {
    if (['activity','event','subject','attendance','teacher'].includes(name) && !requireSemester(`cadastrar ${name==='activity'?'uma atividade':'este item'}`)) return;
    if(name==='semester')prepareSemesterDialog(payload.id);
    if(name==='teacher')prepareTeacherDialog(payload.id);
    if(name==='subject')prepareSubjectDialog(payload.id);
    if(name==='activity')prepareActivityDialog(payload.id,payload.type);
    if(name==='event')prepareEventDialog(payload.id);
    if(name==='attendance')prepareAttendanceDialog(payload.id,payload.sourceEventId);
    const dialog=$(`${name}Dialog`); if(dialog&&!dialog.open)dialog.showModal();
  }

  function renderSelectOptions() {
    const semesters=state.semesters.map(item=>`<option value="${item.id}">${safeText(item.name)} · ${formatDate(item.startDate)}–${formatDate(item.endDate)}</option>`).join('');
    ['activeSemesterSelect','mobileSemesterSelect','subjectSemester','activitySemester','eventSemester','attendanceSemester'].forEach(id=>{const node=$(id);if(node){const current=node.value;node.innerHTML=semesters||'<option value="">Nenhum semestre cadastrado</option>';node.value=current&&state.semesters.some(item=>item.id===current)?current:(state.activeSemesterId||'');}});
    $('activeSemesterSelect').value=state.activeSemesterId||''; if($('mobileSemesterSelect'))$('mobileSemesterSelect').value=state.activeSemesterId||''; updateMobileChrome();

    const teacherOptions=state.teachers.map(item=>`<option value="${item.id}">${safeText(item.name)}</option>`).join('');
    ['subjectTeacher','subjectTeacherFilter'].forEach(id=>{const node=$(id);if(!node)return;const current=node.value;node.innerHTML=`<option value="">${id==='subjectTeacher'?'Professor não informado':'Todos os professores'}</option>${teacherOptions}`;node.value=current;});
    renderSubjectDependentSelects();

    const eventOptions=Object.entries(EVENT_TYPES).map(([key,value])=>`<option value="${key}">${value.emoji} ${value.label}</option>`).join(''); $('eventType').innerHTML=eventOptions; $('agendaTypeFilter').innerHTML=`<option value="">Todos os tipos</option>${eventOptions}<optgroup label="Avaliações">${Object.entries(ACTIVITY_TYPES).map(([key,value])=>`<option value="activity:${key}">${value.emoji} ${value.label}</option>`).join('')}</optgroup>`;
    const activityOptions=Object.entries(ACTIVITY_TYPES).map(([key,value])=>`<option value="${key}">${value.emoji} ${value.label}</option>`).join(''); $('activityType').innerHTML=activityOptions; $('activityTypeFilter').innerHTML=`<option value="">Todos os tipos</option>${activityOptions}`;
  }

  function renderSubjectDependentSelects() {
    const semesterId=state.activeSemesterId; const subjects=state.subjects.filter(item=>item.semesterId===semesterId); const courseSubjects=subjects.filter(item=>item.kind!=='hours');
    const allOptions=subjects.map(item=>`<option value="${item.id}">${safeText(item.name)}</option>`).join(''); const courseOptions=courseSubjects.map(item=>`<option value="${item.id}">${safeText(item.name)}</option>`).join('');
    ['agendaSubjectFilter'].forEach(id=>{const node=$(id);if(!node)return;const current=node.value;node.innerHTML='<option value="">Todas as disciplinas</option>'+allOptions;node.value=subjects.some(item=>item.id===current)?current:'';});
    ['activitySubjectFilter','attendanceSubjectFilter'].forEach(id=>{const node=$(id);if(!node)return;const current=node.value;node.innerHTML='<option value="">Todas as disciplinas</option>'+courseOptions;node.value=courseSubjects.some(item=>item.id===current)?current:'';});
    {const node=$('simulatorSubject');const current=node.value;node.innerHTML='<option value="">Escolha uma disciplina</option>'+courseOptions;node.value=courseSubjects.some(item=>item.id===current)?current:'';}
    ['eventSubject','activitySubject','attendanceSubject'].forEach(id=>{const node=$(id);if(!node)return;const selectedSemesterId=id==='eventSubject'?$('eventSemester').value:id==='activitySubject'?$('activitySemester').value:$('attendanceSemester').value;let list=state.subjects.filter(item=>item.semesterId===(selectedSemesterId||semesterId));if(id!=='eventSubject')list=list.filter(item=>item.kind!=='hours');const current=node.value;node.innerHTML=`<option value="">${id==='eventSubject'?'Sem disciplina':'Escolha uma disciplina'}</option>${list.map(item=>`<option value="${item.id}">${safeText(item.name)}</option>`).join('')}`;node.value=list.some(item=>item.id===current)?current:'';});
  }

  function renderAll() { applyTheme(); renderSelectOptions(); renderDashboard(); renderAgenda(); renderSemesters(); renderSubjects(); renderTeachers(); renderEvaluations(); renderAttendance(); renderSettings(); renderNotifications(); }
  function renderCurrentView(){ if(currentView==='dashboard')renderDashboard(); if(currentView==='agenda')renderAgenda(); if(currentView==='semesters')renderSemesters(); if(currentView==='subjects')renderSubjects(); if(currentView==='teachers')renderTeachers(); if(currentView==='evaluations')renderEvaluations(); if(currentView==='attendance')renderAttendance(); if(currentView==='settings')renderSettings(); }

  // ===== Fórmulas e desempenho =====
  function normalizeActivityCode(value) {
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'').slice(0,24);
  }
  function uniqueActivityCode(collection, subjectId, base) {
    let code=normalizeActivityCode(base)||'AV'; let number=2; const used=new Set(collection.filter(item=>item.subjectId===subjectId).map(item=>item.code)); while(used.has(code)){code=`${normalizeActivityCode(base)||'AV'}${number++}`;} return code;
  }
  function inferActivityType(title) { const t=normalize(title); if(t.includes('semin'))return'seminario';if(t.includes('apresent'))return'apresentacao';if(t.includes('entrega'))return'entrega';if(t.includes('projeto'))return'projeto';if(t.includes('substitut'))return'substitutiva';if(t.includes('exame'))return'exame';if(t.includes('prova')||/\bp[1-9]\b/.test(t))return'prova';if(t.includes('lista'))return'lista';return'atividade'; }

  function tokenizeFormula(formula) {
    const tokens=[]; let index=0; const source=String(formula||'');
    while(index<source.length){
      const char=source[index]; if(/\s/.test(char)){index++;continue;}
      if(/[()+\-*/]/.test(char)){tokens.push({type:'op',value:char});index++;continue;}
      const number=source.slice(index).match(/^(?:\d+(?:[.,]\d*)?|[.,]\d+)/); if(number){tokens.push({type:'number',value:Number(number[0].replace(',','.'))});index+=number[0].length;continue;}
      const identifier=source.slice(index).match(/^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_]*/); if(identifier){tokens.push({type:'variable',value:normalizeActivityCode(identifier[0])});index+=identifier[0].length;continue;}
      throw new Error(`Caractere inválido: ${char}`);
    }
    return tokens;
  }

  function toRpn(tokens) {
    const output=[], stack=[]; const precedence={'+':1,'-':1,'*':2,'/':2,'u-':3}; let previous=null;
    tokens.forEach(token=>{
      if(token.type==='number'||token.type==='variable'){output.push(token);previous=token;return;}
      if(token.value==='('){stack.push(token);previous=token;return;}
      if(token.value===')'){
        while(stack.length&&stack[stack.length-1].value!=='(')output.push(stack.pop());
        if(!stack.length)throw new Error('Parêntese de fechamento sem abertura.'); stack.pop(); previous=token;return;
      }
      let op=token.value; if(op==='-' && (!previous || (previous.type==='op' && previous.value!==')') || previous?.value==='('))op='u-'; const current={type:'op',value:op};
      while(stack.length&&stack[stack.length-1].value!=='('&&precedence[stack[stack.length-1].value]>=precedence[op])output.push(stack.pop()); stack.push(current); previous=current;
    });
    while(stack.length){const token=stack.pop();if(token.value==='(')throw new Error('Parêntese aberto sem fechamento.');output.push(token);} return output;
  }

  function evaluateRpn(rpn, variables) {
    const stack=[]; const used=new Set();
    rpn.forEach(token=>{
      if(token.type==='number'){stack.push(token.value);return;}
      if(token.type==='variable'){if(!(token.value in variables))throw new Error(`Variável ${token.value} não possui valor.`);const value=Number(variables[token.value]);if(!Number.isFinite(value))throw new Error(`Valor inválido em ${token.value}.`);stack.push(value);used.add(token.value);return;}
      if(token.value==='u-'){if(!stack.length)throw new Error('Operador negativo sem valor.');stack.push(-stack.pop());return;}
      if(stack.length<2)throw new Error('Fórmula incompleta.'); const b=stack.pop(),a=stack.pop();
      if(token.value==='+')stack.push(a+b);if(token.value==='-')stack.push(a-b);if(token.value==='*')stack.push(a*b);if(token.value==='/'){if(b===0)throw new Error('Divisão por zero.');stack.push(a/b);}
    });
    if(stack.length!==1)throw new Error('Fórmula incompleta ou ambígua.'); return {value:stack[0],used:[...used]};
  }

  function activityValue(activity, policy='block', overrides={}) {
    if(activity.code in overrides)return Number(overrides[activity.code]);
    if(activity.score!==null&&activity.score!==''&&Number.isFinite(Number(activity.score)))return Number(activity.score);
    if(policy==='zero')return 0;
    if(policy==='simulation'&&activity.simulatedScore!==null&&activity.simulatedScore!==''&&Number.isFinite(Number(activity.simulatedScore)))return Number(activity.simulatedScore);
    return undefined;
  }

  function calculateSubject(subject, overrides={}) {
    const activities=state.activities.filter(item=>item.subjectId===subject.id&&item.status!=='cancelled'&&!item.deletedAt); const variables={}; const missing=[];
    activities.forEach(item=>{const value=activityValue(item,subject.formulaMissingPolicy,overrides);if(value===undefined)missing.push(item.code);else variables[item.code]=value;});
    if(!subject.formula.trim())return{ok:false,error:'Método de cálculo não configurado.',activities,missing};
    try{
      const tokens=tokenizeFormula(subject.formula); const variablesInFormula=[...new Set(tokens.filter(item=>item.type==='variable').map(item=>item.value))]; const unknown=variablesInFormula.filter(code=>!activities.some(item=>item.code===code));if(unknown.length)throw new Error(`Atividade não cadastrada: ${unknown.join(', ')}.`);
      const relevantMissing=variablesInFormula.filter(code=>!(code in variables)); if(relevantMissing.length&&subject.formulaMissingPolicy==='block')return{ok:false,error:`Aguardando nota: ${relevantMissing.join(', ')}.`,activities,missing:relevantMissing};
      relevantMissing.forEach(code=>variables[code]=0);
      const result=evaluateRpn(toRpn(tokens),variables); let value=applyRounding(result.value,subject.formulaDecimals,subject.formulaRounding); return{ok:true,value,activities,missing:relevantMissing,used:result.used,variables};
    }catch(error){return{ok:false,error:error.message,activities,missing};}
  }

  function applyRounding(value, decimals=2, mode='normal') { const factor=10**Number(decimals||0);if(mode==='up')return Math.ceil(value*factor)/factor;if(mode==='down')return Math.floor(value*factor)/factor;return Math.round((value+Number.EPSILON)*factor)/factor; }

  function calculateNeededScore(subject) {
    const activities=state.activities.filter(item=>item.subjectId===subject.id&&item.status!=='cancelled'&&!item.deletedAt); const formulaVariables=[...new Set((subject.formula.match(/[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_]*/g)||[]).map(normalizeActivityCode))]; const pending=formulaVariables.map(code=>activities.find(item=>item.code===code)).filter(item=>item&&(item.score===null||item.score===''));
    if(pending.length!==1)return null; const target=pending[0]; const max=Number(target.maxScore||10); let found=null;
    for(let i=0;i<=1000;i++){const candidate=max*i/1000;const result=calculateSubject(subject,{[target.code]:candidate});if(result.ok&&result.value>=Number(subject.passingGrade||6)){found=candidate;break;}}
    return found===null?{code:target.code,possible:false}:{code:target.code,possible:true,value:applyRounding(found,2,'up'),max};
  }

  function subjectPerformance(subject) {
    const calculation=calculateSubject(subject); const attendance=attendanceSummary(subject.id); const passing=Number(subject.passingGrade||6); return {calculation,attendance,passing,risk:(calculation.ok&&calculation.value<passing)||(attendance.hasData&&attendance.percent<Number(subject.minAttendance||75))};
  }

  function attendanceSummary(subjectId) {
    const records=state.attendance.filter(item=>item.subjectId===subjectId&&!item.deletedAt&&item.status!=='cancelled'); const total=records.reduce((sum,item)=>sum+Number(item.totalPeriods||0),0); const present=records.reduce((sum,item)=>sum+Number(item.presentPeriods||0),0); return{records,total,present,percent:total?present/total*100:0,hasData:total>0,unverified:records.filter(item=>item.status==='unverified').length};
  }

  function semesterPerformance() {
    const subjects=activeSubjects().filter(subject=>subject.kind!=='hours'); const grades=subjects.map(subject=>calculateSubject(subject)).filter(item=>item.ok).map(item=>item.value); const attendance=subjects.map(subject=>attendanceSummary(subject.id)).filter(item=>item.hasData); return{average:grades.length?grades.reduce((a,b)=>a+b,0)/grades.length:null,attendance:attendance.length?attendance.reduce((a,b)=>a+b.percent,0)/attendance.length:null};
  }

  // ===== Renderização =====
  function unifiedAgendaItems() {
    const events=activeEvents().map(item=>({...item,entity:'event',entityType:item.type,label:EVENT_TYPES[item.type]?.label||'Evento',emoji:EVENT_TYPES[item.type]?.emoji||'📌'}));
    const activities=activeActivities().map(item=>({...item,entity:'activity',entityType:`activity:${item.type}`,label:ACTIVITY_TYPES[item.type]?.label||'Avaliação',emoji:ACTIVITY_TYPES[item.type]?.emoji||'📝',status:item.status==='graded'?'concluido':item.status==='cancelled'?'cancelado':'pendente'}));
    return [...events,...activities].sort((a,b)=>entityDateTime(a)-entityDateTime(b));
  }

  function renderDashboard() {
    const semester=activeSemester(); $('heroSemesterText').textContent=semester?`${semester.name} · ${formatDate(semester.startDate)} até ${formatDate(semester.endDate)}`:'Cadastre um semestre para começar.';
    const items=unifiedAgendaItems(); const now=new Date(); const next=items.find(item=>entityDateTime(item)>=now&&item.status!=='cancelado');
    $('metricNext').textContent=next?next.title:'—'; $('metricNextMeta').textContent=next?`${formatShortDate(next.date)} · ${next.allDay?'dia inteiro':next.start||'horário a confirmar'}`:'Nenhum compromisso futuro';
    const perf=semesterPerformance(); $('metricAverage').textContent=perf.average===null?'—':formatNumber(perf.average,2); $('metricAverageMeta').textContent=perf.average===null?'Configure as fórmulas':'Média das disciplinas calculadas';
    $('metricAttendance').textContent=perf.attendance===null?'—':`${formatNumber(perf.attendance,1)}%`; $('metricAttendanceMeta').textContent=perf.attendance===null?'Registre as presenças':'Média das disciplinas com registros';
    const overdue=activeActivities().filter(item=>item.status!=='graded'&&item.status!=='cancelled'&&item.date<todayISO()).length; const upcoming=activeActivities().filter(item=>item.status!=='graded'&&item.status!=='cancelled'&&item.date>=todayISO()).length; $('metricPending').textContent=String(overdue+upcoming); $('metricPendingMeta').textContent=overdue?`${overdue} atrasada(s)`:`${upcoming} próxima(s)`;
    const today=items.filter(item=>item.date===todayISO()); $('todayTimeline').innerHTML=today.length?today.map(timelineItemHtml).join(''):'<div class="empty-state">Nenhum compromisso acadêmico para hoje.</div>';
    const nextActivities=activeActivities().filter(item=>item.status!=='graded'&&item.status!=='cancelled'&&item.date>=todayISO()).sort((a,b)=>entityDateTime(a)-entityDateTime(b)).slice(0,5); $('upcomingActivities').innerHTML=nextActivities.length?nextActivities.map(item=>`<div class="compact-item"><strong>${ACTIVITY_TYPES[item.type]?.emoji||'📝'} ${safeText(item.title)}</strong><small>${safeText(subjectById(item.subjectId)?.name||'Sem disciplina')} · ${formatDate(item.date)}</small></div>`).join(''):'<div class="empty-state">Nenhuma avaliação próxima.</div>';
    const risks=activeSubjects().map(subject=>({subject,...subjectPerformance(subject)})).filter(item=>item.risk).slice(0,5); $('riskSubjects').innerHTML=risks.length?risks.map(item=>`<div class="compact-item"><strong>${safeText(item.subject.name)}</strong><small>${item.calculation.ok?`Média ${formatNumber(item.calculation.value,2)}`:'Média pendente'} · ${item.attendance.hasData?`Frequência ${formatNumber(item.attendance.percent,1)}%`:'Frequência sem dados'}</small></div>`).join(''):'<div class="empty-state">Nenhuma disciplina em risco pelos dados atuais.</div>';
  }

  function timelineItemHtml(item) {
    const subject=subjectById(item.subjectId); return `<div class="timeline-item"><div class="timeline-time">${item.allDay?'Dia todo':safeText(item.start||'—')}</div><span class="timeline-dot" style="background:${safeText(subject?.color||EVENT_TYPES[item.type]?.color||'#9b1730')}"></span><div class="item-main"><strong>${item.emoji||''} ${safeText(item.title)}</strong><small>${safeText(subject?.name||item.label||'Evento')}${item.location?` · ${safeText(item.location)}`:''}</small></div><div class="item-actions"><button data-edit-entity="${item.entity}" data-id="${item.id}" type="button">Editar</button></div></div>`;
  }

  function renderAgenda() {
    const query=normalize($('agendaSearch').value); const type=$('agendaTypeFilter').value; const subjectId=$('agendaSubjectFilter').value; const status=$('agendaStatusFilter').value;
    const list=unifiedAgendaItems().filter(item=>!query||normalize(`${item.title} ${item.description||''} ${subjectById(item.subjectId)?.name||''} ${item.location||''}`).includes(query)).filter(item=>!type||item.entityType===type).filter(item=>!subjectId||item.subjectId===subjectId).filter(item=>!status||item.status===status);
    $('agendaList').innerHTML=list.length?list.map(agendaItemHtml).join(''):'<div class="empty-state">Nenhum item encontrado neste semestre.</div>';
  }

  function agendaItemHtml(item) {
    const subject=subjectById(item.subjectId),semester=semesterById(item.semesterId); const sync=item.googleEventId?'Google sincronizado':item.syncWanted?'Aguardando sincronização':'Somente local';
    return `<article class="agenda-item"><div class="agenda-date"><small>${formatWeekday(item.date)}</small><strong>${item.date?.slice(8,10)||'—'}</strong><small>${formatShortDate(item.date).split(' ')[1]||''}</small></div><div><div class="agenda-title-line"><span class="tag brand">${item.emoji||''} ${safeText(item.label||'Evento')}</span><strong>${safeText(item.title)}</strong>${item.status==='cancelado'?'<span class="tag danger">Cancelado</span>':item.status==='concluido'?'<span class="tag success">Concluído</span>':''}</div><div class="meta-line">${safeText(semester?.name||'Sem semestre')} · ${safeText(subject?.name||'Sem disciplina')} · ${item.allDay?'Dia inteiro':`${safeText(item.start||'—')}–${safeText(item.end||'—')}`} · ${safeText(sync)}</div></div><div class="item-actions"><button data-edit-entity="${item.entity}" data-id="${item.id}" type="button">Editar</button><button data-toggle-entity="${item.entity}" data-id="${item.id}" type="button">${item.status==='concluido'?'Reabrir':'Concluir'}</button><button data-google-template="${item.entity}" data-id="${item.id}" type="button">Google</button><button class="delete-action" data-delete-entity="${item.entity}" data-id="${item.id}" type="button">Excluir</button></div></article>`;
  }

  function renderSemesters() {
    $('semesterList').innerHTML=state.semesters.length?state.semesters.slice().sort((a,b)=>b.startDate.localeCompare(a.startDate)).map(semester=>{
      const subjectCount=state.subjects.filter(item=>item.semesterId===semester.id).length; const eventCount=state.events.filter(item=>item.semesterId===semester.id&&!item.deletedAt).length+state.activities.filter(item=>item.semesterId===semester.id&&!item.deletedAt).length; const statusLabel={active:'Ativo',planned:'Planejado',archived:'Arquivado'}[semester.status]||semester.status;
      return `<article class="entity-card"><div class="entity-accent" style="background:${safeText(semester.color||'#9b1730')}"></div><div class="agenda-title-line"><h3>${safeText(semester.name)}</h3><span class="tag ${semester.status==='active'?'success':''}">${statusLabel}</span>${state.activeSemesterId===semester.id?'<span class="tag brand">Em uso</span>':''}</div><p>${formatDate(semester.startDate)} até ${formatDate(semester.endDate)}</p><div class="entity-stats"><div class="entity-stat"><span>Disciplinas</span><strong>${subjectCount}</strong></div><div class="entity-stat"><span>Itens de agenda</span><strong>${eventCount}</strong></div></div><p>${safeText(semester.notes||'Sem observações.')}</p><div class="card-actions"><button class="secondary" data-use-semester="${semester.id}" type="button">Usar semestre</button><button class="secondary" data-edit-semester="${semester.id}" type="button">Editar</button><button class="danger" data-delete-semester="${semester.id}" type="button">Excluir</button></div></article>`;
    }).join(''):'<div class="empty-state">Nenhum semestre cadastrado. Cadastre um período antes de criar qualquer item acadêmico.</div>';
  }

  function renderSubjects() {
    const query=normalize($('subjectSearch').value),teacherFilter=$('subjectTeacherFilter').value; const list=activeSubjects().filter(item=>!query||normalize(`${item.name} ${item.code}`).includes(query)).filter(item=>!teacherFilter||item.teacherId===teacherFilter);
    $('subjectGrid').innerHTML=list.length?list.map(subject=>{
      const teacher=teacherById(subject.teacherId); const activities=state.activities.filter(item=>item.subjectId===subject.id&&!item.deletedAt);
      if(subject.kind==='hours'){
        const required=Number(subject.requiredHours||0),completed=Number(subject.completedHours||0),percent=required?Math.min(100,completed/required*100):0,risk=required>0&&completed<required;
        return `<article class="entity-card"><div class="entity-accent" style="background:${safeText(subject.color)}"></div><div class="agenda-title-line"><h3>${safeText(subject.name)}</h3><span class="tag brand">Carga horária</span>${risk?'<span class="tag warning">Em andamento</span>':''}</div><p>${safeText(subject.code||'Sem sigla')} · ${safeText(teacher?.name||'Responsável não informado')}</p><div class="entity-stats"><div class="entity-stat"><span>Concluídas</span><strong>${formatNumber(completed,1)} h</strong></div><div class="entity-stat"><span>Exigidas</span><strong>${required?`${formatNumber(required,1)} h`:'Definir'}</strong></div><div class="entity-stat"><span>Progresso</span><strong>${required?`${formatNumber(percent,1)}%`:'—'}</strong></div><div class="entity-stat"><span>Restantes</span><strong>${required?`${formatNumber(Math.max(0,required-completed),1)} h`:'—'}</strong></div></div><div class="attendance-progress"><span style="width:${percent}%"></span></div><div class="card-actions"><button class="secondary" data-edit-subject="${subject.id}" type="button">Atualizar horas</button><button class="danger" data-delete-subject="${subject.id}" type="button">Excluir</button></div></article>`;
      }
      const perf=subjectPerformance(subject); const calcText=perf.calculation.ok?formatNumber(perf.calculation.value,subject.formulaDecimals):'—'; const attendanceText=perf.attendance.hasData?`${formatNumber(perf.attendance.percent,1)}%`:'—';
      return `<article class="entity-card"><div class="entity-accent" style="background:${safeText(subject.color)}"></div><div class="agenda-title-line"><h3>${safeText(subject.name)}</h3>${perf.risk?'<span class="tag danger">Atenção</span>':''}</div><p>${safeText(subject.code||'Sem sigla')} · ${safeText(teacher?.name||'Professor não informado')}</p><div class="entity-stats"><div class="entity-stat"><span>Média</span><strong>${calcText}</strong></div><div class="entity-stat"><span>Frequência</span><strong>${attendanceText}</strong></div><div class="entity-stat"><span>Avaliações</span><strong>${activities.length}</strong></div><div class="entity-stat"><span>Fórmula</span><strong>${subject.formula?'Configurada':'Pendente'}</strong></div></div><div class="card-actions"><button class="secondary" data-formula-subject="${subject.id}" type="button">Cálculo</button><button class="secondary" data-edit-subject="${subject.id}" type="button">Editar</button><button class="danger" data-delete-subject="${subject.id}" type="button">Excluir</button></div></article>`;
    }).join(''):'<div class="empty-state">Nenhuma disciplina encontrada no semestre selecionado.</div>';
  }

  function renderTeachers() {
    $('teacherGrid').innerHTML=state.teachers.length?state.teachers.map(teacher=>{
      const subjects=state.subjects.filter(item=>item.teacherId===teacher.id&&item.semesterId===state.activeSemesterId); return `<article class="entity-card"><div class="entity-accent" style="background:#596276"></div><h3>${safeText(teacher.name)}</h3><p>${safeText(teacher.email||'E-mail não informado')}${teacher.phone?` · ${safeText(teacher.phone)}`:''}</p><div class="entity-stats"><div class="entity-stat"><span>Disciplinas no semestre</span><strong>${subjects.length}</strong></div><div class="entity-stat"><span>Avaliações vinculadas</span><strong>${state.activities.filter(item=>subjects.some(subject=>subject.id===item.subjectId)&&!item.deletedAt).length}</strong></div></div><p>${safeText(teacher.notes||'Sem observações.')}</p><div class="card-actions"><button class="secondary" data-edit-teacher="${teacher.id}" type="button">Editar</button><button class="danger" data-delete-teacher="${teacher.id}" type="button">Excluir</button></div></article>`;
    }).join(''):'<div class="empty-state">Cadastre os professores e vincule-os às disciplinas.</div>';
  }

  function renderEvaluations() {
    renderActivityList(); renderFormulaSubjects(); renderFormulaEditor(); renderSimulator();
  }

  function renderActivityList() {
    const query=normalize($('activitySearch').value),subjectFilter=$('activitySubjectFilter').value,typeFilter=$('activityTypeFilter').value; const list=activeActivities().filter(item=>!query||normalize(`${item.title} ${item.code} ${item.description||''}`).includes(query)).filter(item=>!subjectFilter||item.subjectId===subjectFilter).filter(item=>!typeFilter||item.type===typeFilter).sort((a,b)=>entityDateTime(a)-entityDateTime(b));
    $('activityList').innerHTML=list.length?list.map(item=>{
      const subject=subjectById(item.subjectId),info=ACTIVITY_TYPES[item.type]||ACTIVITY_TYPES.outro; const score=item.score===null||item.score===''?'Aguardando nota':`${formatNumber(item.score,2)} / ${formatNumber(item.maxScore,2)}`;
      return `<article class="agenda-item"><div class="agenda-date"><small>${formatWeekday(item.date)}</small><strong>${item.date.slice(8,10)}</strong><small>${formatShortDate(item.date).split(' ')[1]||''}</small></div><div><div class="agenda-title-line"><span class="tag brand">${info.emoji} ${safeText(item.code)}</span><strong>${safeText(item.title)}</strong>${item.status==='graded'?'<span class="tag success">Corrigida</span>':item.status==='cancelled'?'<span class="tag danger">Cancelada</span>':''}</div><div class="meta-line">${safeText(subject?.name||'Sem disciplina')} · ${score}${item.weight?` · Peso ${formatNumber(item.weight,1)}%`:''}</div></div><div class="item-actions"><button data-edit-entity="activity" data-id="${item.id}" type="button">Editar</button><button data-duplicate-activity="${item.id}" type="button">Duplicar</button><button data-google-template="activity" data-id="${item.id}" type="button">Google</button><button class="delete-action" data-delete-entity="activity" data-id="${item.id}" type="button">Excluir</button></div></article>`;
    }).join(''):'<div class="empty-state">Crie as atividades da disciplina antes de montar a fórmula do professor.</div>';
  }

  function renderFormulaSubjects() {
    const subjects=activeSubjects().filter(subject=>subject.kind!=='hours'); if(!selectedFormulaSubjectId||!subjects.some(item=>item.id===selectedFormulaSubjectId))selectedFormulaSubjectId=subjects[0]?.id||'';
    $('formulaSubjectList').innerHTML=subjects.length?subjects.map(subject=>{const result=calculateSubject(subject);return `<button class="selection-item ${selectedFormulaSubjectId===subject.id?'active':''}" data-select-formula-subject="${subject.id}" type="button"><strong>${safeText(subject.name)}</strong><small>${subject.formula?(result.ok?`Média ${formatNumber(result.value,subject.formulaDecimals)}`:'Fórmula pendente'):'Sem fórmula'}</small></button>`;}).join(''):'<div class="empty-state">Nenhuma disciplina neste semestre.</div>';
  }

  function renderFormulaEditor() {
    const subject=subjectById(selectedFormulaSubjectId); $('formulaEmpty').classList.toggle('hidden',Boolean(subject)); $('formulaEditor').classList.toggle('hidden',!subject); if(!subject)return;
    $('formulaSubjectTitle').textContent=subject.name; $('formulaProfessorName').textContent=teacherById(subject.teacherId)?.name||'Professor não informado'; $('formulaStatus').textContent=subject.formula?'Configurado':'Não configurado'; $('formulaStatus').className=`tag ${subject.formula?'success':''}`;
    $('formulaInput').value=subject.formula||''; $('formulaMissingPolicy').value=subject.formulaMissingPolicy||'block'; $('formulaDecimals').value=String(subject.formulaDecimals??2); $('formulaRounding').value=subject.formulaRounding||'normal'; $('formulaPassingGrade').value=subject.passingGrade??6;
    const activities=state.activities.filter(item=>item.subjectId===subject.id&&!item.deletedAt&&item.status!=='cancelled'); $('formulaVariableButtons').innerHTML=activities.length?activities.map(item=>`<button class="variable" data-token="${safeText(item.code)}" type="button" title="${safeText(item.title)}">${safeText(item.code)}${item.score!==null&&item.score!==''?` = ${formatNumber(item.score,2)}`:''}</button>`).join(''):'<span class="muted">Cadastre avaliações primeiro.</span>';
    updateFormulaPreview();
  }

  function updateFormulaPreview() {
    const subject=subjectById(selectedFormulaSubjectId); if(!subject)return; const preview={...subject,formula:$('formulaInput').value,formulaMissingPolicy:$('formulaMissingPolicy').value,formulaDecimals:Number($('formulaDecimals').value),formulaRounding:$('formulaRounding').value,passingGrade:Number($('formulaPassingGrade').value)}; const result=calculateSubject(preview); const box=$('formulaValidation');
    if(result.ok){box.className='validation-box valid';box.textContent=`Fórmula válida. Variáveis usadas: ${result.used.join(', ')||'nenhuma'}.`; $('formulaResult').textContent=formatNumber(result.value,preview.formulaDecimals); $('formulaSituation').textContent=result.value>=preview.passingGrade?'Aprovado pela média':'Abaixo da média';}
    else{box.className=`validation-box ${preview.formula.trim()?'invalid':'neutral'}`;box.textContent=result.error||'Monte a fórmula usando as atividades cadastradas.';$('formulaResult').textContent='—';$('formulaSituation').textContent='—';}
    const needed=calculateNeededScore(preview); $('formulaNeeded').textContent=needed?(needed.possible?`${needed.code}: ${formatNumber(needed.value,2)}`:`${needed.code}: acima do máximo`):'—';
  }

  function renderSimulator() {
    const subject=subjectById($('simulatorSubject').value)||subjectById(selectedFormulaSubjectId); if(subject)$('simulatorSubject').value=subject.id; const container=$('simulatorFields');
    if(!subject){container.innerHTML='';$('simulatorResult').className='validation-box neutral';$('simulatorResult').textContent='Escolha uma disciplina com fórmula configurada.';return;}
    const activities=state.activities.filter(item=>item.subjectId===subject.id&&!item.deletedAt&&item.status!=='cancelled'); container.innerHTML=activities.map(item=>`<div class="simulation-field"><label><span>${safeText(item.code)} · ${safeText(item.title)}</span><small>máx. ${formatNumber(item.maxScore,2)}</small></label><input data-sim-code="${safeText(item.code)}" type="number" min="0" max="${Number(item.maxScore||10)}" step="0.01" value="${item.score??item.simulatedScore??''}" placeholder="Valor simulado"></div>`).join(''); updateSimulatorResult();
  }

  function updateSimulatorResult() {
    const subject=subjectById($('simulatorSubject').value); if(!subject)return; const overrides={}; $$('[data-sim-code]').forEach(input=>{if(input.value!=='')overrides[input.dataset.simCode]=Number(input.value);}); const result=calculateSubject(subject,overrides); const box=$('simulatorResult'); if(result.ok){box.className='validation-box valid';box.innerHTML=`Média simulada: <strong>${formatNumber(result.value,subject.formulaDecimals)}</strong> · ${result.value>=Number(subject.passingGrade||6)?'atinge':'não atinge'} a média mínima de ${formatNumber(subject.passingGrade,2)}.`;}else{box.className='validation-box invalid';box.textContent=result.error;}
  }

  function renderAttendance() {
    const records=activeAttendance(); const summaries=activeSubjects().map(subject=>({subject,summary:attendanceSummary(subject.id)})); const withData=summaries.filter(item=>item.summary.hasData); const overall=withData.length?withData.reduce((sum,item)=>sum+item.summary.percent,0)/withData.length:null; $('attendanceOverall').textContent=overall===null?'—':`${formatNumber(overall,1)}%`; $('attendanceOverallMeta').textContent=withData.length?`${withData.length} disciplina(s) com registros`:'Sem registros'; $('attendanceUnverified').textContent=records.filter(item=>item.status==='unverified').length; $('attendanceRisk').textContent=summaries.filter(item=>item.summary.hasData&&item.summary.percent<Number(item.subject.minAttendance||75)).length;
    $('attendanceSubjectSummary').innerHTML=summaries.filter(item=>item.subject.kind!=='hours').map(({subject,summary})=>{const planned=Number(subject.totalPeriods||0);const absences=Math.max(0,summary.total-summary.present);const allowed=planned?planned*(1-Number(subject.minAttendance||75)/100):null;const remaining=allowed===null?null:Math.max(0,allowed-absences);return `<article class="entity-card"><div class="entity-accent" style="background:${safeText(subject.color)}"></div><h3>${safeText(subject.name)}</h3><p>${summary.hasData?`${formatNumber(summary.percent,1)}% de frequência`:'Sem registros'}</p><div class="attendance-progress"><span style="width:${Math.min(100,summary.percent||0)}%"></span></div><div class="entity-stats"><div class="entity-stat"><span>Presentes</span><strong>${summary.present}</strong></div><div class="entity-stat"><span>Faltas</span><strong>${absences}</strong></div><div class="entity-stat"><span>Limite mínimo</span><strong>${formatNumber(subject.minAttendance,1)}%</strong></div><div class="entity-stat"><span>Faltas restantes</span><strong>${remaining===null?'Definir carga':formatNumber(remaining,0)}</strong></div></div></article>`;}).join('')||'<div class="empty-state">Nenhuma disciplina com controle de frequência.</div>';
    const subjectFilter=$('attendanceSubjectFilter').value,statusFilter=$('attendanceStatusFilter').value; const list=records.filter(item=>!subjectFilter||item.subjectId===subjectFilter).filter(item=>!statusFilter||item.status===statusFilter).sort((a,b)=>b.date.localeCompare(a.date));
    $('attendanceList').innerHTML=list.length?list.map(item=>{const subject=subjectById(item.subjectId);const statusLabel={unverified:'Não verificada',present:'Presente',late:'Atrasado',partial:'Parcial',absent:'Ausente',justified:'Justificada',cancelled:'Cancelada'}[item.status]||item.status;const className=item.status==='present'?'success':item.status==='unverified'?'warning':['absent','justified'].includes(item.status)?'danger':'';return `<article class="agenda-item"><div class="agenda-date"><small>${formatWeekday(item.date)}</small><strong>${item.date.slice(8,10)}</strong><small>${formatShortDate(item.date).split(' ')[1]||''}</small></div><div><div class="agenda-title-line"><span class="tag ${className}">${statusLabel}</span><strong>${safeText(subject?.name||'Disciplina')}</strong></div><div class="meta-line">${item.presentPeriods}/${item.totalPeriods} período(s) presentes${item.checkin?` · Check-in a ${Math.round(item.checkin.distance||0)} m`:''}${item.notes?` · ${safeText(item.notes)}`:''}</div></div><div class="item-actions"><button data-edit-attendance="${item.id}" type="button">Editar</button><button class="delete-action" data-delete-attendance="${item.id}" type="button">Excluir</button></div></article>`;}).join(''):'<div class="empty-state">Nenhum registro de presença neste semestre.</div>';
  }

  function renderSettings() {
    $('googleClientId').value=state.settings.googleClientId||''; $('googleTagSemester').checked=state.settings.googleTagSemester!==false; $('lockTimeout').value=String(state.settings.lockTimeoutMinutes??15); $('campusName').value=state.settings.campusName||'Fatec Bauru'; $('campusLatitude').value=state.settings.campusLatitude||''; $('campusLongitude').value=state.settings.campusLongitude||''; $('campusRadius').value=state.settings.campusRadius||500; $('themeSelect').value=state.settings.theme||'system';
    $('googleStatus').textContent=googleToken?'Conectado':state.settings.googleClientId?'Configurado':'Desconectado'; $('googleStatus').className=`tag ${googleToken?'success':''}`; $('notificationPermission').textContent=('Notification'in window)?({granted:'Autorizadas',denied:'Bloqueadas',default:'Não autorizadas'}[Notification.permission]):'Indisponíveis'; $('notificationPermission').className=`tag ${typeof Notification!=='undefined'&&Notification.permission==='granted'?'success':''}`; $('syncReport').textContent=state.settings.lastSyncReport||'Nenhuma sincronização realizada nesta sessão.';
  }

  function academicNotifications() {
    const alerts=[]; const today=todayISO(); activeActivities().forEach(item=>{if(item.status==='graded'||item.status==='cancelled')return;const days=daysBetween(today,item.date);if(days<0)alerts.push({level:'danger',title:`Atividade atrasada: ${item.title}`,detail:subjectById(item.subjectId)?.name||''});else if(days<=7)alerts.push({level:days<=2?'danger':'warning',title:`${item.title} em ${days===0?'hoje':`${days} dia(s)`}`,detail:subjectById(item.subjectId)?.name||''});}); activeSubjects().forEach(subject=>{const perf=subjectPerformance(subject);if(perf.calculation.ok&&perf.calculation.value<Number(subject.passingGrade||6))alerts.push({level:'danger',title:`Média abaixo da meta em ${subject.name}`,detail:`Atual: ${formatNumber(perf.calculation.value,2)}`});if(perf.attendance.hasData&&perf.attendance.percent<Number(subject.minAttendance||75))alerts.push({level:'danger',title:`Frequência em risco em ${subject.name}`,detail:`Atual: ${formatNumber(perf.attendance.percent,1)}%`});}); return alerts;
  }

  function renderNotifications() { const alerts=academicNotifications(); $('notificationBadge').textContent=alerts.length; $('notificationBadge').classList.toggle('hidden',!alerts.length); if($('mobileNotificationBadge')){$('mobileNotificationBadge').textContent=alerts.length;$('mobileNotificationBadge').classList.toggle('hidden',!alerts.length);} $('notificationList').innerHTML=alerts.length?alerts.map(item=>`<div class="compact-item"><span class="tag ${item.level}">${item.level==='danger'?'Atenção':'Aviso'}</span><strong>${safeText(item.title)}</strong><small>${safeText(item.detail)}</small></div>`).join(''):'<div class="empty-state">Nenhum aviso importante agora.</div>'; }

  // ===== Formulários e CRUD =====
  function prepareSemesterDialog(id='') {
    $('semesterForm').reset(); $('semesterId').value=''; $('semesterColor').value='#9b1730'; $('semesterStatus').value='active'; $('semesterStart').value=''; $('semesterEnd').value=''; $('semesterDialogTitle').textContent=id?'Editar semestre':'Cadastrar semestre';
    if(id){const item=semesterById(id);if(!item)return;$('semesterId').value=item.id;$('semesterName').value=item.name;$('semesterStart').value=item.startDate;$('semesterEnd').value=item.endDate;$('semesterStatus').value=item.status;$('semesterColor').value=item.color||'#9b1730';$('semesterNotes').value=item.notes||'';}
    validateSemesterForm();
  }
  function validateSemesterForm() {
    const id=$('semesterId').value,start=$('semesterStart').value,end=$('semesterEnd').value; const box=$('semesterValidation'); let error='';
    if(start&&end&&end<start)error='A data final não pode ser anterior à inicial.';
    if(start&&end&&state.semesters.some(item=>item.id!==id&&start<=item.endDate&&end>=item.startDate))error='Este período se sobrepõe a outro semestre. Ajuste as datas para evitar vínculos ambíguos.';
    box.className=`validation-box ${error?'invalid':'neutral'}`;box.textContent=error||'As datas não podem se sobrepor a outro semestre.';return !error;
  }
  $('semesterForm').addEventListener('submit',event=>{
    event.preventDefault();if(!validateSemesterForm())return;const id=$('semesterId').value||uid('semester');const existing=semesterById(id);const item={id,name:$('semesterName').value.trim(),startDate:$('semesterStart').value,endDate:$('semesterEnd').value,status:$('semesterStatus').value,color:$('semesterColor').value,notes:$('semesterNotes').value.trim(),createdAt:existing?.createdAt||nowISO(),updatedAt:nowISO()};
    if(item.status==='active')state.semesters.forEach(semester=>{if(semester.id!==id&&semester.status==='active')semester.status='planned';}); const index=state.semesters.findIndex(semester=>semester.id===id);if(index>=0)state.semesters[index]=item;else state.semesters.push(item);state.activeSemesterId=id;saveState();$('semesterDialog').close();renderAll();showToast('Semestre salvo.');
  });

  function deleteSemester(id) {
    const semester=semesterById(id);if(!semester)return;const linked=state.subjects.filter(item=>item.semesterId===id).length+state.activities.filter(item=>item.semesterId===id&&!item.deletedAt).length+state.events.filter(item=>item.semesterId===id&&!item.deletedAt).length+state.attendance.filter(item=>item.semesterId===id&&!item.deletedAt).length;
    if(linked)return showToast(`O semestre possui ${linked} item(ns). Exclua ou mova os dados antes.` ,4000);if(!confirm(`Excluir o semestre ${semester.name}?`))return;state.semesters=state.semesters.filter(item=>item.id!==id);if(state.activeSemesterId===id)state.activeSemesterId=state.semesters[0]?.id||'';saveState();renderAll();
  }

  function prepareTeacherDialog(id='') {
    $('teacherForm').reset();$('teacherId').value='';$('teacherDialogTitle').textContent=id?'Editar professor':'Cadastrar professor';if(id){const item=teacherById(id);if(!item)return;$('teacherId').value=item.id;$('teacherName').value=item.name;$('teacherEmail').value=item.email||'';$('teacherPhone').value=item.phone||'';$('teacherNotes').value=item.notes||'';}
  }
  $('teacherForm').addEventListener('submit',event=>{event.preventDefault();const id=$('teacherId').value||uid('teacher');const existing=teacherById(id);const item={id,name:$('teacherName').value.trim(),email:$('teacherEmail').value.trim(),phone:$('teacherPhone').value.trim(),notes:$('teacherNotes').value.trim(),createdAt:existing?.createdAt||nowISO(),updatedAt:nowISO()};const index=state.teachers.findIndex(value=>value.id===id);if(index>=0)state.teachers[index]=item;else state.teachers.push(item);saveState();$('teacherDialog').close();renderAll();showToast('Professor salvo.');});
  function deleteTeacher(id){const teacher=teacherById(id);if(!teacher)return;const linked=state.subjects.filter(item=>item.teacherId===id).length;if(linked&&!confirm(`${teacher.name} está vinculado a ${linked} disciplina(s). Remover o professor desses vínculos?`))return;state.subjects.forEach(item=>{if(item.teacherId===id)item.teacherId='';});state.teachers=state.teachers.filter(item=>item.id!==id);moveToTrash('teacher',teacher);saveState();renderAll();}


  function updateSubjectKindFields(){
    const hours=$('subjectKind').value==='hours';
    ['subjectRequiredHours','subjectCompletedHours'].forEach(id=>{const node=$(id);node.disabled=!hours;node.closest('label').classList.toggle('hidden',!hours);});
    ['subjectPassingGrade','subjectMinAttendance','subjectTotalPeriods','subjectPeriodsPerClass'].forEach(id=>{const node=$(id);node.disabled=hours;node.closest('label').classList.toggle('hidden',hours);});
  }

  function prepareSubjectDialog(id='') {
    renderSelectOptions();$('subjectForm').reset();$('subjectId').value='';$('subjectDialogTitle').textContent=id?'Editar disciplina':'Cadastrar disciplina';$('subjectSemester').value=state.activeSemesterId;$('subjectColor').value='#9b1730';$('subjectKind').value='course';$('subjectRequiredHours').value=0;$('subjectCompletedHours').value=0;$('subjectPassingGrade').value=6;$('subjectMinAttendance').value=75;$('subjectTotalPeriods').value=0;$('subjectPeriodsPerClass').value=2;
    if(id){const item=subjectById(id);if(!item)return;$('subjectId').value=item.id;$('subjectSemester').value=item.semesterId;$('subjectTeacher').value=item.teacherId||'';$('subjectName').value=item.name;$('subjectCode').value=item.code||'';$('subjectColor').value=item.color||'#9b1730';$('subjectKind').value=item.kind||'course';$('subjectRequiredHours').value=item.requiredHours??0;$('subjectCompletedHours').value=item.completedHours??0;$('subjectPassingGrade').value=item.passingGrade??6;$('subjectMinAttendance').value=item.minAttendance??75;$('subjectTotalPeriods').value=item.totalPeriods??0;$('subjectPeriodsPerClass').value=item.periodsPerClass??2;$('subjectNotes').value=item.notes||'';}updateSubjectKindFields();
  }
  $('subjectForm').addEventListener('submit',event=>{event.preventDefault();const semesterId=$('subjectSemester').value;if(!semesterById(semesterId))return showToast('Escolha um semestre válido.');const id=$('subjectId').value||uid('subject');const existing=subjectById(id);const item={id,semesterId,teacherId:$('subjectTeacher').value,name:$('subjectName').value.trim(),code:normalizeActivityCode($('subjectCode').value)||normalizeActivityCode($('subjectName').value).slice(0,12),color:$('subjectColor').value,kind:$('subjectKind').value,requiredHours:Number($('subjectRequiredHours').value||0),completedHours:Number($('subjectCompletedHours').value||0),passingGrade:Number($('subjectPassingGrade').value||6),minAttendance:Number($('subjectMinAttendance').value||75),totalPeriods:Number($('subjectTotalPeriods').value||0),periodsPerClass:Number($('subjectPeriodsPerClass').value||2),notes:$('subjectNotes').value.trim(),formula:existing?.formula||'',formulaMissingPolicy:existing?.formulaMissingPolicy||'block',formulaDecimals:existing?.formulaDecimals??2,formulaRounding:existing?.formulaRounding||'normal',formulaUpdatedAt:existing?.formulaUpdatedAt||'',createdAt:existing?.createdAt||nowISO(),updatedAt:nowISO()};const duplicate=state.subjects.find(subject=>subject.id!==id&&subject.semesterId===semesterId&&normalize(subject.name)===normalize(item.name));if(duplicate)return showToast('Já existe uma disciplina com esse nome no semestre.');const index=state.subjects.findIndex(value=>value.id===id);if(index>=0)state.subjects[index]=item;else state.subjects.push(item);saveState();$('subjectDialog').close();renderAll();showToast('Disciplina salva.');});
  function deleteSubject(id){const subject=subjectById(id);if(!subject)return;const linked=state.activities.filter(item=>item.subjectId===id&&!item.deletedAt).length+state.attendance.filter(item=>item.subjectId===id&&!item.deletedAt).length+state.events.filter(item=>item.subjectId===id&&!item.deletedAt).length;if(linked)return showToast(`A disciplina possui ${linked} item(ns) vinculados. Exclua ou mova esses itens antes.`,4000);if(!confirm(`Excluir ${subject.name}?`))return;state.subjects=state.subjects.filter(item=>item.id!==id);moveToTrash('subject',subject);saveState();renderAll();}

  function presetReminders(kind,type,preset) {
    if(preset==='none')return[];if(preset==='custom')return reminderDrafts[kind]||[];if(kind==='activity'){if(preset==='recommended')return [...(ACTIVITY_TYPES[type]?.reminders||[1440])];return [...(REMINDER_PRESETS[preset]?.[type]||ACTIVITY_TYPES[type]?.reminders||[1440])];}return [...(REMINDER_PRESETS.event[type]||[60])];
  }
  function minutesToParts(minutes){const options=[['week',10080],['day',1440],['hour',60],['minute',1]];for(const[item,factor]of options)if(minutes%factor===0)return{value:minutes/factor,unit:item};return{value:minutes,unit:'minute'};}
  function partsToMinutes(value,unit){const factor={minute:1,hour:60,day:1440,week:10080}[unit]||1;return Math.max(0,Number(value||0)*factor);}
  function reminderLabel(minutes){const{value,unit}=minutesToParts(Number(minutes));const labels={minute:['minuto','minutos'],hour:['hora','horas'],day:['dia','dias'],week:['semana','semanas']};return`${value} ${labels[unit][value===1?0:1]} antes`;}
  function renderReminderEditor(kind){const rowsId=kind==='activity'?'activityReminderRows':'eventReminderRows',previewId=kind==='activity'?'activityReminderPreview':'eventReminderPreview';const reminders=reminderDrafts[kind]||[];$(rowsId).innerHTML=reminders.map((minutes,index)=>{const parts=minutesToParts(minutes);return`<div class="reminder-row"><input data-reminder-value="${kind}" data-index="${index}" type="number" min="0" value="${parts.value}"><select data-reminder-unit="${kind}" data-index="${index}"><option value="minute" ${parts.unit==='minute'?'selected':''}>minuto(s)</option><option value="hour" ${parts.unit==='hour'?'selected':''}>hora(s)</option><option value="day" ${parts.unit==='day'?'selected':''}>dia(s)</option><option value="week" ${parts.unit==='week'?'selected':''}>semana(s)</option></select><button data-remove-reminder="${kind}" data-index="${index}" type="button">✕</button></div>`;}).join('');$(previewId).innerHTML=reminders.length?reminders.slice().sort((a,b)=>b-a).map(value=>`<span>🔔 ${reminderLabel(value)}</span>`).join(''):'<span>Sem alertas</span>';}
  function syncReminderDraftFromRows(kind){const values=$$(`[data-reminder-value="${kind}"]`);reminderDrafts[kind]=values.map(input=>{const unit=document.querySelector(`[data-reminder-unit="${kind}"][data-index="${input.dataset.index}"]`)?.value||'minute';return partsToMinutes(input.value,unit);}).filter(value=>value>=0).slice(0,5);renderReminderEditor(kind);}

  function prepareActivityDialog(id='',forcedType='') {
    renderSelectOptions();$('activityForm').reset();$('activityId').value='';$('activityDialogTitle').textContent=id?'Editar atividade':'Cadastrar atividade';$('activitySemester').value=state.activeSemesterId;renderSubjectDependentSelects();$('activityType').value=forcedType||'atividade';$('activityDate').value=activeSemester()?.startDate>todayISO()?activeSemester().startDate:todayISO();$('activityStart').value='19:00';$('activityEnd').value='20:40';$('activityAllDay').value='false';$('activityMaxScore').value=10;$('activityStatus').value='planned';$('activityPriority').value='normal';$('activitySyncWanted').checked=true;$('activityReminderPreset').value='recommended';reminderDrafts.activity=presetReminders('activity',$('activityType').value,'recommended');
    if(id){const item=activityById(id);if(!item)return;$('activityId').value=item.id;$('activitySemester').value=item.semesterId;renderSubjectDependentSelects();$('activitySubject').value=item.subjectId;$('activityType').value=item.type;$('activityCode').value=item.code;$('activityTitle').value=item.title;$('activityDate').value=item.date;$('activityAllDay').value=String(Boolean(item.allDay));$('activityStart').value=item.start||'';$('activityEnd').value=item.end||'';$('activityMaxScore').value=item.maxScore??10;$('activityScore').value=item.score??'';$('activityWeight').value=item.weight??0;$('activitySimulatedScore').value=item.simulatedScore??'';$('activityStatus').value=item.status||'planned';$('activityPriority').value=item.priority||'normal';$('activityLocation').value=item.location||'';$('activityDescription').value=item.description||'';$('activitySyncWanted').checked=item.syncWanted!==false;$('activityReminderPreset').value=item.reminderPreset||'custom';reminderDrafts.activity=[...(item.reminders||[])];}
    if(!$('activityCode').value)$('activityCode').value=uniqueActivityCode(state.activities,$('activitySubject').value,ACTIVITY_TYPES[$('activityType').value]?.label||'AV');toggleTimeInputs('activity');renderReminderEditor('activity');validateActivityForm();
  }
  function validateActivityForm(){const semesterId=$('activitySemester').value,date=$('activityDate').value,subject=subjectById($('activitySubject').value),id=$('activityId').value,code=normalizeActivityCode($('activityCode').value);let error='';if(!dateInsideSemester(date,semesterId))error='A data está fora do período do semestre selecionado.';else if(!subject||subject.semesterId!==semesterId)error='Escolha uma disciplina pertencente ao semestre.';else if(!code)error='Informe um código válido para usar na fórmula.';else if(state.activities.some(item=>item.id!==id&&item.subjectId===subject.id&&item.code===code&&!item.deletedAt))error=`O código ${code} já existe nesta disciplina.`;else if($('activityScore').value!==''&&Number($('activityScore').value)>Number($('activityMaxScore').value))error='A nota obtida não pode ultrapassar a nota máxima.';const box=$('activityValidation');box.className=`validation-box ${error?'invalid':'valid'}`;box.textContent=error||'Dados válidos. A atividade poderá ser usada automaticamente na fórmula.';return!error;}
  $('activityForm').addEventListener('submit',event=>{event.preventDefault();syncReminderDraftFromRows('activity');if(!validateActivityForm())return;const id=$('activityId').value||uid('activity');const existing=activityById(id);const item={id,semesterId:$('activitySemester').value,subjectId:$('activitySubject').value,type:$('activityType').value,code:normalizeActivityCode($('activityCode').value),title:$('activityTitle').value.trim(),date:$('activityDate').value,allDay:$('activityAllDay').value==='true',start:$('activityAllDay').value==='true'?'':$('activityStart').value,end:$('activityAllDay').value==='true'?'':$('activityEnd').value,maxScore:Number($('activityMaxScore').value||10),score:$('activityScore').value===''?null:Number($('activityScore').value),weight:Number($('activityWeight').value||0),simulatedScore:$('activitySimulatedScore').value===''?null:Number($('activitySimulatedScore').value),status:$('activityStatus').value,priority:$('activityPriority').value,location:$('activityLocation').value.trim(),description:$('activityDescription').value.trim(),reminderPreset:$('activityReminderPreset').value,reminders:[...reminderDrafts.activity],syncWanted:$('activitySyncWanted').checked,dirty:true,googleEventId:existing?.googleEventId||'',googleCalendarId:existing?.googleCalendarId||'',googleRecurringEventId:existing?.googleRecurringEventId||'',googleUpdated:existing?.googleUpdated||'',createdAt:existing?.createdAt||nowISO(),updatedAt:nowISO()};const index=state.activities.findIndex(value=>value.id===id);if(index>=0)state.activities[index]=item;else state.activities.push(item);saveState();$('activityDialog').close();renderAll();switchView('evaluations');showToast('Atividade salva e disponível no cálculo.');});

  function prepareEventDialog(id='') {
    renderSelectOptions();$('eventForm').reset();$('eventId').value='';$('eventDialogTitle').textContent=id?'Editar evento':'Cadastrar evento';$('eventSemester').value=state.activeSemesterId;renderSubjectDependentSelects();$('eventType').value='evento';$('eventDate').value=activeSemester()?.startDate>todayISO()?activeSemester().startDate:todayISO();$('eventAllDay').value='false';$('eventStart').value='19:00';$('eventEnd').value='20:40';$('eventStatus').value='pendente';$('eventPriority').value='normal';$('eventSyncWanted').checked=true;$('eventReminderPreset').value='recommended';reminderDrafts.event=presetReminders('event','evento','recommended');
    if(id){const item=eventById(id);if(!item)return;$('eventId').value=item.id;$('eventSemester').value=item.semesterId;renderSubjectDependentSelects();$('eventSubject').value=item.subjectId||'';$('eventType').value=item.type;$('eventStatus').value=item.status;$('eventTitle').value=item.title;$('eventDate').value=item.date;$('eventAllDay').value=String(Boolean(item.allDay));$('eventStart').value=item.start||'';$('eventEnd').value=item.end||'';$('eventPriority').value=item.priority||'normal';$('eventLocation').value=item.location||'';$('eventDescription').value=item.description||'';$('eventSyncWanted').checked=item.syncWanted!==false;$('eventReminderPreset').value=item.reminderPreset||'custom';reminderDrafts.event=[...(item.reminders||[])];}
    toggleTimeInputs('event');renderReminderEditor('event');validateEventForm();
  }
  function validateEventForm(){const semesterId=$('eventSemester').value,date=$('eventDate').value,subjectId=$('eventSubject').value;let error='';if(!dateInsideSemester(date,semesterId))error='A data está fora do período do semestre selecionado.';else if(subjectId&&subjectById(subjectId)?.semesterId!==semesterId)error='A disciplina não pertence ao semestre selecionado.';const box=$('eventValidation');box.className=`validation-box ${error?'invalid':'valid'}`;box.textContent=error||'Evento válido para o semestre selecionado.';return!error;}
  $('eventForm').addEventListener('submit',event=>{event.preventDefault();syncReminderDraftFromRows('event');if(!validateEventForm())return;const id=$('eventId').value||uid('event');const existing=eventById(id);const item={id,semesterId:$('eventSemester').value,subjectId:$('eventSubject').value,type:$('eventType').value,status:$('eventStatus').value,title:$('eventTitle').value.trim(),date:$('eventDate').value,allDay:$('eventAllDay').value==='true',start:$('eventAllDay').value==='true'?'':$('eventStart').value,end:$('eventAllDay').value==='true'?'':$('eventEnd').value,priority:$('eventPriority').value,location:$('eventLocation').value.trim(),description:$('eventDescription').value.trim(),reminderPreset:$('eventReminderPreset').value,reminders:[...reminderDrafts.event],syncWanted:$('eventSyncWanted').checked,dirty:true,googleEventId:existing?.googleEventId||'',googleCalendarId:existing?.googleCalendarId||'',googleRecurringEventId:existing?.googleRecurringEventId||'',googleUpdated:existing?.googleUpdated||'',needsSemesterGoogleUpdate:existing?.needsSemesterGoogleUpdate||false,createdAt:existing?.createdAt||nowISO(),updatedAt:nowISO()};const index=state.events.findIndex(value=>value.id===id);if(index>=0)state.events[index]=item;else state.events.push(item);saveState();$('eventDialog').close();renderAll();switchView('agenda');showToast('Evento salvo.');});

  function toggleTimeInputs(kind){const allDay=$(kind==='activity'?'activityAllDay':'eventAllDay').value==='true';$(kind==='activity'?'activityStart':'eventStart').disabled=allDay;$(kind==='activity'?'activityEnd':'eventEnd').disabled=allDay;}

  function prepareAttendanceDialog(id='',sourceEventId='') {
    renderSelectOptions();$('attendanceForm').reset();$('attendanceId').value='';$('attendanceDialogTitle').textContent=id?'Editar presença':'Registrar presença';$('attendanceSemester').value=state.activeSemesterId;renderSubjectDependentSelects();$('attendanceDate').value=todayISO();$('attendanceStatus').value='unverified';$('attendanceTotalPeriods').value=2;$('attendancePresentPeriods').value=0;$('attendanceCheckinResult').textContent='Nenhum check-in realizado.';pendingCheckin=null;
    if(sourceEventId){const source=eventById(sourceEventId);if(source){$('attendanceSemester').value=source.semesterId;renderSubjectDependentSelects();$('attendanceSubject').value=source.subjectId||'';$('attendanceDate').value=source.date;$('attendanceStart').value=source.start||'';$('attendanceEnd').value=source.end||'';$('attendanceTotalPeriods').value=subjectById(source.subjectId)?.periodsPerClass||2;$('attendanceId').dataset.sourceEventId=source.id;}}
    if(id){const item=attendanceById(id);if(!item)return;$('attendanceId').value=item.id;$('attendanceSemester').value=item.semesterId;renderSubjectDependentSelects();$('attendanceSubject').value=item.subjectId;$('attendanceDate').value=item.date;$('attendanceStatus').value=item.status;$('attendanceTotalPeriods').value=item.totalPeriods;$('attendancePresentPeriods').value=item.presentPeriods;$('attendanceStart').value=item.start||'';$('attendanceEnd').value=item.end||'';$('attendanceNotes').value=item.notes||'';pendingCheckin=item.checkin||null;$('attendanceCheckinResult').textContent=item.checkin?`Check-in registrado a ${Math.round(item.checkin.distance||0)} m de ${state.settings.campusName}.`:'Nenhum check-in realizado.';$('attendanceId').dataset.sourceEventId=item.sourceEventId||'';}
    updateAttendancePresentPeriods();
  }
  function updateAttendancePresentPeriods(){const status=$('attendanceStatus').value,total=Number($('attendanceTotalPeriods').value||0);if(status==='present')$('attendancePresentPeriods').value=total;if(['absent','justified','cancelled'].includes(status))$('attendancePresentPeriods').value=0;$('attendancePresentPeriods').disabled=['present','absent','justified','cancelled'].includes(status);}
  $('attendanceForm').addEventListener('submit',event=>{event.preventDefault();const semesterId=$('attendanceSemester').value,date=$('attendanceDate').value,subject=subjectById($('attendanceSubject').value);if(!dateInsideSemester(date,semesterId))return showToast('A data da presença está fora do semestre.');if(!subject||subject.semesterId!==semesterId)return showToast('Escolha uma disciplina válida.');const id=$('attendanceId').value||uid('attendance');const existing=attendanceById(id);const total=Number($('attendanceTotalPeriods').value||0),present=Number($('attendancePresentPeriods').value||0);if(present>total)return showToast('Períodos presentes não podem superar os previstos.');const item={id,semesterId,subjectId:subject.id,date,start:$('attendanceStart').value,end:$('attendanceEnd').value,totalPeriods:total,presentPeriods:present,status:$('attendanceStatus').value,notes:$('attendanceNotes').value.trim(),sourceEventId:$('attendanceId').dataset.sourceEventId||existing?.sourceEventId||'',checkin:pendingCheckin,createdAt:existing?.createdAt||nowISO(),updatedAt:nowISO()};const index=state.attendance.findIndex(value=>value.id===id);if(index>=0)state.attendance[index]=item;else state.attendance.push(item);saveState();$('attendanceDialog').close();renderAll();switchView('attendance');showToast('Presença registrada.');});

  function generateAttendanceFromClasses(){if(!requireSemester('gerar presenças'))return;const classes=activeEvents().filter(item=>item.type==='aula'&&item.subjectId);let created=0;classes.forEach(event=>{if(state.attendance.some(item=>item.sourceEventId===event.id&&!item.deletedAt))return;const subject=subjectById(event.subjectId);state.attendance.push({id:uid('attendance'),semesterId:event.semesterId,subjectId:event.subjectId,date:event.date,start:event.start||'',end:event.end||'',totalPeriods:Number(subject?.periodsPerClass||2),presentPeriods:0,status:'unverified',notes:'Gerado automaticamente pela aula da agenda.',sourceEventId:event.id,checkin:null,createdAt:nowISO(),updatedAt:nowISO()});created++;});saveState();renderAll();showToast(created?`${created} registro(s) de presença criado(s).`:'As aulas já possuem registros de presença.');}

  async function performAttendanceCheckin(){const lat=Number(state.settings.campusLatitude),lon=Number(state.settings.campusLongitude),radius=Number(state.settings.campusRadius||500);if(!Number.isFinite(lat)||!Number.isFinite(lon))return showToast('Configure a latitude e longitude da Fatec nas configurações.',4000);if(!navigator.geolocation)return showToast('Localização não suportada neste navegador.');$('attendanceCheckinResult').textContent='Consultando localização…';navigator.geolocation.getCurrentPosition(position=>{const distance=haversine(position.coords.latitude,position.coords.longitude,lat,lon);pendingCheckin={latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy,distance,inside:distance<=radius,checkedAt:nowISO()};$('attendanceCheckinResult').textContent=distance<=radius?`Localização validada: aproximadamente ${Math.round(distance)} m de ${state.settings.campusName}.`:`Você está aproximadamente ${Math.round(distance)} m de ${state.settings.campusName}, fora do raio de ${radius} m.`;if(distance<=radius&&$('attendanceStatus').value==='unverified'){$('attendanceStatus').value='present';updateAttendancePresentPeriods();}},error=>{$('attendanceCheckinResult').textContent=`Não foi possível obter a localização: ${error.message}`;},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});}
  function haversine(lat1,lon1,lat2,lon2){const R=6371000,toRad=value=>value*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}

  function saveFormula(){const subject=subjectById(selectedFormulaSubjectId);if(!subject)return;const preview={...subject,formula:$('formulaInput').value.trim(),formulaMissingPolicy:$('formulaMissingPolicy').value,formulaDecimals:Number($('formulaDecimals').value),formulaRounding:$('formulaRounding').value,passingGrade:Number($('formulaPassingGrade').value)};const result=calculateSubject(preview);if(preview.formula&&!result.ok&&!/Aguardando nota/.test(result.error||''))return showToast(`Corrija a fórmula: ${result.error}`,4000);Object.assign(subject,{formula:preview.formula,formulaMissingPolicy:preview.formulaMissingPolicy,formulaDecimals:preview.formulaDecimals,formulaRounding:preview.formulaRounding,passingGrade:preview.passingGrade,formulaUpdatedAt:nowISO(),updatedAt:nowISO()});saveState();renderAll();showToast('Método de cálculo salvo para esta disciplina e professor.');}
  function suggestFormula(){const subject=subjectById(selectedFormulaSubjectId);if(!subject)return;const activities=state.activities.filter(item=>item.subjectId===subject.id&&!item.deletedAt&&item.status!=='cancelled'&&Number(item.weight)>0);if(!activities.length)return showToast('Informe pesos nas atividades para gerar uma sugestão.');const total=activities.reduce((sum,item)=>sum+Number(item.weight),0);$('formulaInput').value=activities.map(item=>`(${item.code} * ${formatPlainNumber(Number(item.weight)/total)})`).join(' + ');updateFormulaPreview();}
  function formatPlainNumber(value){return Number(value.toFixed(6)).toString();}

  function duplicateActivity(id){const source=activityById(id);if(!source)return;const copy={...clone(source),id:uid('activity'),code:uniqueActivityCode(state.activities,source.subjectId,source.code),title:`Cópia de ${source.title}`,score:null,simulatedScore:null,status:'planned',googleEventId:'',googleRecurringEventId:'',googleUpdated:'',dirty:true,createdAt:nowISO(),updatedAt:nowISO()};state.activities.push(copy);saveState();renderAll();openDialog('activity',{id:copy.id});}
  function toggleEntity(entity,id){const item=entity==='activity'?activityById(id):eventById(id);if(!item)return;if(entity==='activity'){item.status=item.status==='graded'?'planned':'graded';}else item.status=item.status==='concluido'?'pendente':'concluido';item.dirty=true;item.updatedAt=nowISO();saveState();renderAll();}
  function moveToTrash(entityType,data){state.trash.unshift({id:uid('trash'),entityType,data:clone(data),deletedAt:nowISO()});state.trash=state.trash.slice(0,200);}
  function deleteEntity(entity,id){const list=entity==='activity'?state.activities:state.events;const item=list.find(value=>value.id===id);if(!item)return;if(entity==='activity'){const subject=subjectById(item.subjectId);const used=(subject?.formula.match(/[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_]*/g)||[]).map(normalizeActivityCode).includes(item.code);if(used&&!confirm(`A atividade ${item.code} é usada na fórmula de ${subject.name}. Excluí-la deixará o cálculo pendente até a fórmula ser corrigida. Continuar?`))return;}const message=item.googleEventId?'Excluir localmente? Na próxima sincronização você poderá escolher excluir também do Google.':'Mover este item para a lixeira?';if(!confirm(message))return;moveToTrash(entity,item);item.deletedAt=nowISO();item.deleteGoogle=Boolean(item.googleEventId&&confirm('Excluir também do Google Calendar na próxima sincronização?'));item.dirty=true;saveState();renderAll();showToast('Item movido para a lixeira.');}
  function deleteAttendance(id){const item=attendanceById(id);if(!item||!confirm('Mover este registro de presença para a lixeira?'))return;moveToTrash('attendance',item);item.deletedAt=nowISO();saveState();renderAll();}

  function renderTrash(){const container=$('trashList');container.innerHTML=state.trash.length?state.trash.map(entry=>`<article class="agenda-item"><div class="agenda-date"><strong>🗑️</strong></div><div><div class="agenda-title-line"><span class="tag">${safeText(entry.entityType)}</span><strong>${safeText(entry.data.title||entry.data.name||subjectById(entry.data.subjectId)?.name||'Item')}</strong></div><div class="meta-line">Excluído em ${new Date(entry.deletedAt).toLocaleString('pt-BR')}</div></div><div class="item-actions"><button data-restore-trash="${entry.id}" type="button">Restaurar</button><button class="delete-action" data-remove-trash="${entry.id}" type="button">Excluir definitivamente</button></div></article>`).join(''):'<div class="empty-state">A lixeira está vazia.</div>';}
  function restoreTrash(id){const entry=state.trash.find(item=>item.id===id);if(!entry)return;const data={...entry.data,deletedAt:'',deleteGoogle:false,updatedAt:nowISO()};if(entry.entityType==='activity'){const index=state.activities.findIndex(item=>item.id===data.id);if(index>=0)state.activities[index]=data;else state.activities.push(data);}else if(entry.entityType==='event'){const index=state.events.findIndex(item=>item.id===data.id);if(index>=0)state.events[index]=data;else state.events.push(data);}else if(entry.entityType==='attendance'){const index=state.attendance.findIndex(item=>item.id===data.id);if(index>=0)state.attendance[index]=data;else state.attendance.push(data);}else if(entry.entityType==='subject')state.subjects.push(data);else if(entry.entityType==='teacher')state.teachers.push(data);state.trash=state.trash.filter(item=>item.id!==id);saveState();renderAll();renderTrash();showToast('Item restaurado.');}

  // ===== Google Calendar OAuth e sincronização =====
  function loadGoogleIdentity() {
    return new Promise((resolve,reject)=>{
      if(window.google?.accounts?.oauth2)return resolve(); const existing=document.querySelector('script[data-google-identity]');if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
      const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.googleIdentity='true';script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar o Google Identity Services.'));document.head.appendChild(script);
    });
  }

  async function connectGoogle() {
    const clientId=state.settings.googleClientId?.trim();if(!clientId||!clientId.endsWith('.apps.googleusercontent.com'))return showToast('Informe e salve um Client ID OAuth válido.',4000);
    try{await loadGoogleIdentity();await new Promise((resolve,reject)=>{googleTokenClient=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:GOOGLE_SCOPE,callback:response=>{if(response.error)return reject(new Error(response.error_description||response.error));googleToken=response.access_token;resolve();}});googleTokenClient.requestAccessToken({prompt:'consent'});});renderSettings();showToast('Google Calendar conectado nesta sessão.');return true;}catch(error){console.error(error);showToast(`Falha ao conectar: ${error.message}`,5000);return false;}
  }

  async function ensureGoogleToken() { if(googleToken)return true;return connectGoogle(); }
  async function googleRequest(path,options={}) { if(!googleToken)throw new Error('Conecte sua conta Google.');const response=await fetch(`https://www.googleapis.com/calendar/v3${path}`,{...options,headers:{Authorization:`Bearer ${googleToken}`,'Content-Type':'application/json',...(options.headers||{})}});if(response.status===204)return null;const data=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401)googleToken='';throw new Error(data.error?.message||`Erro Google ${response.status}`);}return data; }

  async function loadGoogleCalendars() {
    if(!await ensureGoogleToken())return;try{const data=await googleRequest('/users/me/calendarList?minAccessRole=writer&maxResults=250');const current=state.settings.googleCalendarId||'primary';$('googleCalendarId').innerHTML=(data.items||[]).map(item=>`<option value="${safeText(item.id)}">${safeText(item.summaryOverride||item.summary)}${item.primary?' (principal)':''}</option>`).join('')||'<option value="primary">Principal</option>';$('googleCalendarId').value=[...(data.items||[])].some(item=>item.id===current)?current:(data.items?.find(item=>item.primary)?.id||'primary');showToast('Calendários carregados.');}catch(error){showToast(error.message,5000);}
  }

  function earliestSemesterStart(){return state.semesters.length?state.semesters.map(item=>item.startDate).sort()[0]:todayISO();}
  function latestSemesterEnd(){return state.semesters.length?state.semesters.map(item=>item.endDate).sort().at(-1):todayISO();}
  function isoBoundary(date,end=false){return `${date}T${end?'23:59:59':'00:00:00'}-03:00`;}
  function nextDate(date){const value=parseLocal(date);value.setDate(value.getDate()+1);return localDateISO(value);}
  function dateTimePartsInZone(value){const date=new Date(value);const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(item=>item.type!=='literal').map(item=>[item.type,item.value]));return{date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};}
  function cleanGoogleTitle(title){let text=String(title||'Evento Google');for(const semester of state.semesters)text=text.replace(new RegExp(`^\\[${escapeRegExp(semester.name)}\\]\\s*`,'i'),'');text=text.replace(/^\[(PROVA|ATIVIDADE|ENTREGA|SEMINÁRIO|SEMINARIO|APRESENTAÇÃO|APRESENTACAO|PROJETO|LISTA|SUBSTITUTIVA|EXAME FINAL|EXAME|BÔNUS|BONUS|AULA|TRANSPORTE|TRABALHO|ESTUDO|PRAZO|EVENTO|FERIADO|ROTINA|OUTRO)\]\s*/i,'');return text.trim()||'Evento Google';}
  const escapeRegExp=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function semesterFromGoogle(item,date){const privateId=item.extendedProperties?.private?.fatecFlowSemesterId;if(privateId&&semesterById(privateId))return semesterById(privateId);for(const semester of state.semesters)if(new RegExp(`^\\[${escapeRegExp(semester.name)}\\]`,'i').test(item.summary||''))return semester;return semesterForDate(date);}
  function inferSubjectFromGoogle(item,semesterId){const hay=normalize(`${item.summary||''} ${item.description||''}`);return state.subjects.filter(subject=>subject.semesterId===semesterId).sort((a,b)=>b.name.length-a.name.length).find(subject=>hay.includes(normalize(subject.name))||(subject.code&&new RegExp(`\\b${escapeRegExp(normalize(subject.code))}\\b`).test(hay)))?.id||'';}
  function detectGoogleEntity(item){const privateType=item.extendedProperties?.private?.fatecFlowEntity;if(privateType==='activity'||privateType==='event')return privateType;const title=normalize(item.summary||'');return Object.values(ACTIVITY_TYPES).some(info=>title.includes(normalize(`[${info.label}]`)))||/^\[(prova|atividade|entrega|seminario|apresentacao|projeto|lista|substitutiva|exame|bonus)\]/.test(title.replace(/^\[[^\]]+\]\s*/,''))?'activity':'event';}
  function inferActivityTypeFromGoogle(item){const title=normalize(item.summary||'');for(const[key,info]of Object.entries(ACTIVITY_TYPES))if(title.includes(normalize(`[${info.label}]`)))return key;return inferActivityType(title);}
  function inferEventType(title){const text=normalize(title);if(text.includes('onibus')||text.includes('transporte'))return'transporte';if(text.includes('trabalho'))return'trabalho';if(text.includes('aula')||state.subjects.some(subject=>text.includes(normalize(subject.name))))return'aula';if(text.includes('estudo')||text.includes('revisao')||text.includes('laboratorio'))return'estudo';if(text.includes('feriado')||text.includes('sem aula'))return'feriado';if(text.includes('prazo')||text.includes('inscricao'))return'prazo';if(text.includes('rotina')||text.includes('almoco')||text.includes('dormir'))return'rotina';return'evento';}

  function googleTimes(item){if(item.start?.date)return{date:item.start.date,allDay:true,start:'',end:''};const start=dateTimePartsInZone(item.start?.dateTime),end=dateTimePartsInZone(item.end?.dateTime);return{date:start.date,allDay:false,start:start.time,end:end.time};}
  function googleReminders(item){return(item.reminders?.overrides||[]).filter(reminder=>reminder.method==='popup').map(reminder=>Number(reminder.minutes)).filter(Number.isFinite).slice(0,5);}

  function upsertGoogleItem(item,calendarId) {
    if(item.status==='cancelled'){const local=[...state.events,...state.activities].find(value=>value.googleEventId===item.id);if(local){local.deletedAt=local.deletedAt||nowISO();local.dirty=false;}return{deleted:1};}
    const times=googleTimes(item),semester=semesterFromGoogle(item,times.date);if(!semester)return{ignored:1};const entity=detectGoogleEntity(item),subjectId=inferSubjectFromGoogle(item,semester.id),localId=item.extendedProperties?.private?.fatecFlowLocalId;const collection=entity==='activity'?state.activities:state.events;let local=collection.find(value=>value.googleEventId===item.id)||(localId?collection.find(value=>value.id===localId):null);const common={semesterId:semester.id,subjectId,title:cleanGoogleTitle(item.summary),date:times.date,allDay:times.allDay,start:times.start,end:times.end,location:item.location||'',description:String(item.description||'').split(/\r?\n/).filter(line=>!/^Semestre:/i.test(line)&&!/^Disciplina:/i.test(line)&&!/^Gerenciado pelo Fatec Flow/i.test(line)).join('\n').trim(),reminders:googleReminders(item),syncWanted:true,dirty:false,googleEventId:item.id,googleCalendarId:calendarId,googleRecurringEventId:item.recurringEventId||'',googleUpdated:item.updated||nowISO(),googleHtmlLink:item.htmlLink||'',needsSemesterGoogleUpdate:state.settings.googleTagSemester!==false&&(!String(item.summary||'').startsWith(`[${semester.name}]`)||item.extendedProperties?.private?.fatecFlowSemesterId!==semester.id),updatedAt:item.updated||nowISO()};
    if(entity==='activity'){
      const type=inferActivityTypeFromGoogle(item);const info={...common,type,code:local?.code||uniqueActivityCode(state.activities,subjectId,ACTIVITY_TYPES[type]?.label||'AV'),maxScore:local?.maxScore??10,score:local?.score??null,weight:local?.weight??0,simulatedScore:local?.simulatedScore??null,status:local?.status||'planned',priority:local?.priority||'normal',reminderPreset:'custom',createdAt:local?.createdAt||nowISO()};if(local)Object.assign(local,info);else state.activities.push({id:uid('activity'),...info});
    }else{
      const type=local?.type||inferEventType(item.summary||'');const info={...common,type,status:item.status==='cancelled'?'cancelado':local?.status||'pendente',priority:local?.priority||'normal',reminderPreset:'custom',createdAt:local?.createdAt||nowISO()};if(local)Object.assign(local,info);else state.events.push({id:uid('event'),...info});
    }
    return{imported:local?0:1,updated:local?1:0,needsTag:common.needsSemesterGoogleUpdate?1:0};
  }

  async function fetchGoogleEvents() {
    const calendarId=encodeURIComponent(state.settings.googleCalendarId||'primary');let pageToken='';const items=[];do{const params=new URLSearchParams({timeMin:isoBoundary(earliestSemesterStart()),timeMax:isoBoundary(nextDate(latestSemesterEnd())),singleEvents:'true',orderBy:'startTime',showDeleted:'true',maxResults:'2500'});if(pageToken)params.set('pageToken',pageToken);const data=await googleRequest(`/calendars/${calendarId}/events?${params}`);items.push(...(data.items||[]));pageToken=data.nextPageToken||'';}while(pageToken);return items;
  }

  function ensureSemesterPrefix(title,semester,entity,type){let clean=cleanGoogleTitle(title);const typeLabel=entity==='activity'?ACTIVITY_TYPES[type]?.label:EVENT_TYPES[type]?.label;return`[${semester.name}]${typeLabel?` [${typeLabel.toUpperCase()}]`:''} ${clean}`.replace(/\s+/g,' ').trim();}
  function managedDescription(item,semester,subject){const cleaned=String(item.description||'').split(/\r?\n/).filter(line=>!/^Semestre:/i.test(line)&&!/^Disciplina:/i.test(line)&&!/^Gerenciado pelo Fatec Flow/i.test(line)).join('\n').trim();return[`Semestre: ${semester.name}`,subject?`Disciplina: ${subject.name}`:'',item.code?`Código: ${item.code}`:'',cleaned,'Gerenciado pelo Fatec Flow'].filter(Boolean).join('\n\n');}
  function googleEventBody(item,entity) {
    const semester=semesterById(item.semesterId);if(!semester)throw new Error('Item sem semestre válido.');const subject=subjectById(item.subjectId);const type=entity==='activity'?item.type:item.type;const body={summary:ensureSemesterPrefix(item.title,semester,entity,type),description:managedDescription(item,semester,subject),location:item.location||'',extendedProperties:{private:{fatecFlowManaged:'true',fatecFlowEntity:entity,fatecFlowLocalId:item.id,fatecFlowSemesterId:semester.id,fatecFlowSemesterName:semester.name,fatecFlowSubjectId:item.subjectId||''}},reminders:{useDefault:false,overrides:(item.reminders||[]).slice(0,5).map(minutes=>({method:'popup',minutes:Number(minutes)}))}};
    if(item.allDay){body.start={date:item.date};body.end={date:nextDate(item.date)};}else{body.start={dateTime:`${item.date}T${item.start||'00:00'}:00-03:00`,timeZone:TZ};body.end={dateTime:`${item.date}T${item.end||item.start||'00:00'}:00-03:00`,timeZone:TZ};}return body;
  }

  async function pushLocalItem(item,entity) {
    if(!item.syncWanted)return{skipped:1};const calendarId=encodeURIComponent(item.googleCalendarId||state.settings.googleCalendarId||'primary');if(item.deletedAt&&item.deleteGoogle&&item.googleEventId){await googleRequest(`/calendars/${calendarId}/events/${encodeURIComponent(item.googleEventId)}`,{method:'DELETE'});item.deleteGoogle=false;item.dirty=false;return{deleted:1};}if(item.deletedAt)return{skipped:1};const body=googleEventBody(item,entity);let result;if(item.googleEventId)result=await googleRequest(`/calendars/${calendarId}/events/${encodeURIComponent(item.googleEventId)}`,{method:'PATCH',body:JSON.stringify(body)});else result=await googleRequest(`/calendars/${calendarId}/events`,{method:'POST',body:JSON.stringify(body)});item.googleEventId=result.id;item.googleCalendarId=state.settings.googleCalendarId||'primary';item.googleUpdated=result.updated||nowISO();item.googleHtmlLink=result.htmlLink||'';item.dirty=false;item.needsSemesterGoogleUpdate=false;return{pushed:1};
  }

  async function syncGoogle() {
    if(!await ensureGoogleToken())return;const report={imported:0,updated:0,pushed:0,deleted:0,ignored:0,errors:0,needsTag:0};$('syncReport').textContent='Sincronizando…';try{
      // Envia primeiro as alterações locais para que uma leitura do Google não apague uma edição ainda não enviada.
      for(const item of [...state.events,...state.activities]){if(!item.dirty)continue;try{const result=await pushLocalItem(item,state.activities.includes(item)?'activity':'event');Object.keys(result).forEach(key=>report[key]=(report[key]||0)+result[key]);}catch(error){console.error(error);report.errors++;}}
      const items=await fetchGoogleEvents();items.forEach(item=>{const result=upsertGoogleItem(item,state.settings.googleCalendarId||'primary');Object.keys(result).forEach(key=>report[key]=(report[key]||0)+result[key]);});
      state.settings.lastSyncAt=nowISO();state.settings.lastSyncReport=`Sincronização concluída: ${report.imported} importado(s), ${report.updated} atualizado(s), ${report.pushed} enviado(s), ${report.deleted} excluído(s), ${report.needsTag} aguardando identificação de semestre${report.errors?`, ${report.errors} erro(s)`:''}.`;saveState();renderAll();showToast('Sincronização concluída.');
    }catch(error){state.settings.lastSyncReport=`Falha na sincronização: ${error.message}`;saveState();renderSettings();showToast(error.message,6000);}
  }

  async function tagAllGoogleEvents() {
    if(!await ensureGoogleToken())return;if(!confirm('Atualizar no Google todos os eventos que estejam dentro dos semestres cadastrados? Séries recorrentes serão atualizadas pela série principal.'))return;const report={updated:0,ignored:0,errors:0};$('syncReport').textContent='Vinculando eventos aos semestres…';try{const items=await fetchGoogleEvents();const targets=new Map();items.forEach(item=>{if(item.status==='cancelled')return;const times=googleTimes(item),semester=semesterFromGoogle(item,times.date);if(!semester){report.ignored++;return;}const id=item.recurringEventId||item.id;if(!targets.has(id))targets.set(id,{item,semester,isRecurring:Boolean(item.recurringEventId)});});const calendarId=encodeURIComponent(state.settings.googleCalendarId||'primary');for(const[id,target]of targets){try{let googleItem=target.item;if(target.isRecurring)googleItem=await googleRequest(`/calendars/${calendarId}/events/${encodeURIComponent(id)}`);const entity=detectGoogleEntity(googleItem),type=entity==='activity'?inferActivityTypeFromGoogle(googleItem):inferEventType(googleItem.summary||''),subjectId=inferSubjectFromGoogle(googleItem,target.semester.id),subject=subjectById(subjectId);const summary=ensureSemesterPrefix(googleItem.summary||'Evento',target.semester,entity,type);const cleaned={title:cleanGoogleTitle(googleItem.summary),description:googleItem.description||'',code:'',id:googleItem.extendedProperties?.private?.fatecFlowLocalId||''};const description=managedDescription(cleaned,target.semester,subject);const extendedProperties={...(googleItem.extendedProperties||{}),private:{...(googleItem.extendedProperties?.private||{}),fatecFlowManaged:'true',fatecFlowEntity:entity,fatecFlowSemesterId:target.semester.id,fatecFlowSemesterName:target.semester.name,fatecFlowSubjectId:subjectId||''}};await googleRequest(`/calendars/${calendarId}/events/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({summary,description,extendedProperties})});report.updated++;}catch(error){console.error(error);report.errors++;}}
      [...state.events,...state.activities].forEach(item=>{if(semesterById(item.semesterId))item.needsSemesterGoogleUpdate=false;});state.meta.googleSemesterMigrationDone=true;state.settings.lastSyncReport=`Semestres aplicados no Google: ${report.updated} evento(s) ou série(s) atualizado(s), ${report.ignored} ignorado(s)${report.errors?`, ${report.errors} erro(s)`:''}.`;saveState();renderAll();showToast('Identificação de semestre atualizada no Google.');
    }catch(error){state.settings.lastSyncReport=`Falha ao atualizar semestres: ${error.message}`;saveState();renderSettings();showToast(error.message,6000);}
  }

  function googleTemplateUrl(item,entity) {const body=googleEventBody(item,entity);const params=new URLSearchParams({action:'TEMPLATE',text:body.summary,details:body.description,location:body.location||'',ctz:TZ});if(item.allDay)params.set('dates',`${item.date.replace(/-/g,'')}/${nextDate(item.date).replace(/-/g,'')}`);else params.set('dates',`${item.date.replace(/-/g,'')}T${(item.start||'0000').replace(':','')}00/${item.date.replace(/-/g,'')}T${(item.end||item.start||'0000').replace(':','')}00`);return`https://calendar.google.com/calendar/render?${params}`;}

  // ===== Importação e exportação =====
  function unfoldIcs(text){return String(text).replace(/\r?\n[ \t]/g,'').split(/\r?\n/);}
  function unescapeIcs(value){return String(value||'').replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');}
  function parseIcsDateValue(value){const raw=String(value||'').replace(/Z$/,'');if(/^\d{8}$/.test(raw))return{date:`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`,time:'',allDay:true};if(/^\d{8}T\d{6}$/.test(raw))return{date:`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`,time:`${raw.slice(9,11)}:${raw.slice(11,13)}`,allDay:false};return null;}
  function parseIcs(text){const lines=unfoldIcs(text);const events=[];let current=null;for(const line of lines){if(line==='BEGIN:VEVENT'){current={};continue;}if(line==='END:VEVENT'){if(current)events.push(current);current=null;continue;}if(!current)continue;const split=line.indexOf(':');if(split<0)continue;const head=line.slice(0,split),value=line.slice(split+1),key=head.split(';')[0].toUpperCase();if(key==='SUMMARY')current.summary=unescapeIcs(value);else if(key==='DESCRIPTION')current.description=unescapeIcs(value);else if(key==='LOCATION')current.location=unescapeIcs(value);else if(key==='UID')current.uid=value;else if(key==='DTSTART')current.start=parseIcsDateValue(value);else if(key==='DTEND')current.end=parseIcsDateValue(value);else if(key==='RRULE')current.rrule=Object.fromEntries(value.split(';').map(part=>part.split('=')));else if(key==='EXDATE')current.exdates=(current.exdates||[]).concat(value.split(',').map(parseIcsDateValue).filter(Boolean).map(item=>item.date));}return events;}
  function expandIcsEvent(item){if(!item.start)return[];const base={...item,date:item.start.date,allDay:item.start.allDay,start:item.start.time||'',end:item.end?.time||'',endDate:item.end?.date||item.start.date};if(!item.rrule)return[base];const freq=item.rrule.FREQ,interval=Number(item.rrule.INTERVAL||1),until=parseIcsDateValue(item.rrule.UNTIL||'')?.date||latestSemesterEnd();if(freq!=='WEEKLY'&&freq!=='DAILY')return[base];const byDay=(item.rrule.BYDAY||'').split(',').filter(Boolean);const dayMap={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};const results=[];let cursor=parseLocal(item.start.date),weekIndex=0;const hardEnd=parseLocal(until);while(cursor<=hardEnd&&results.length<1500){const date=localDateISO(cursor);let include=false;if(freq==='DAILY')include=Math.floor((cursor-parseLocal(item.start.date))/86400000)%interval===0;else{weekIndex=Math.floor((cursor-parseLocal(item.start.date))/604800000);include=weekIndex%interval===0&&(!byDay.length||byDay.some(code=>dayMap[code]===cursor.getDay()));}if(include&&date>=item.start.date&&!(item.exdates||[]).includes(date))results.push({...base,date});cursor.setDate(cursor.getDate()+1);}return results;}

  async function importIcsFile(file){if(!file)return;try{const parsed=parseIcs(await file.text());let imported=0,duplicates=0,ignored=0;for(const raw of parsed){for(const occurrence of expandIcsEvent(raw)){const semester=semesterForDate(occurrence.date);if(!semester){ignored++;continue;}const icsKey=`${raw.uid||raw.summary||'event'}:${occurrence.date}:${occurrence.start}`;if([...state.events,...state.activities].some(item=>item.icsKey===icsKey&&!item.deletedAt)){duplicates++;continue;}const entity=detectGoogleEntity({summary:raw.summary||'',extendedProperties:{}}),subjectId=inferSubjectFromGoogle({summary:raw.summary||'',description:raw.description||''},semester.id);if(entity==='activity'){const type=inferActivityType(raw.summary||'');state.activities.push({id:uid('activity'),semesterId:semester.id,subjectId,type,code:uniqueActivityCode(state.activities,subjectId,ACTIVITY_TYPES[type]?.label||'AV'),title:cleanGoogleTitle(raw.summary||'Atividade'),date:occurrence.date,allDay:occurrence.allDay,start:occurrence.start,end:occurrence.end,maxScore:10,score:null,weight:0,simulatedScore:null,status:'planned',priority:'normal',location:raw.location||'',description:raw.description||'',reminderPreset:'recommended',reminders:[...(ACTIVITY_TYPES[type]?.reminders||[])],syncWanted:false,dirty:false,googleEventId:'',googleCalendarId:'',googleUpdated:'',icsKey,createdAt:nowISO(),updatedAt:nowISO()});}else{state.events.push({id:uid('event'),semesterId:semester.id,subjectId,type:inferEventType(raw.summary||''),status:'pendente',title:raw.summary||'Evento importado',date:occurrence.date,allDay:occurrence.allDay,start:occurrence.start,end:occurrence.end,priority:'normal',location:raw.location||'',description:raw.description||'',reminderPreset:'custom',reminders:[],syncWanted:false,dirty:false,googleEventId:'',googleCalendarId:'',googleUpdated:'',icsKey,createdAt:nowISO(),updatedAt:nowISO()});}imported++;}}
      saveState();renderAll();showToast(`Importação concluída: ${imported} item(ns), ${duplicates} duplicado(s), ${ignored} fora dos semestres.`,5000);
    }catch(error){console.error(error);showToast(`Não foi possível importar: ${error.message}`,5000);}}

  function exportBackup(){const payload={app:'Fatec Flow',version:APP_VERSION,exportedAt:nowISO(),state};downloadFile(`fatec-flow-backup-${todayISO()}.json`,JSON.stringify(payload,null,2),'application/json');showToast('Backup exportado.');}
  async function importBackup(file){if(!file)return;try{const payload=JSON.parse(await file.text());const incoming=payload.state||payload;if(!Array.isArray(incoming.semesters))throw new Error('Backup não reconhecido.');if(!confirm('Restaurar este backup e substituir os dados atuais?'))return;state=normalizeState(incoming);saveState();location.reload();}catch(error){showToast(error.message,5000);}}
  function escapeIcs(value){return String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
  function exportIcs(){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Fatec Flow 3//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH'];for(const item of unifiedAgendaItems()){const semester=semesterById(item.semesterId),entity=item.entity;lines.push('BEGIN:VEVENT',`UID:${item.id}@fatec-flow.local`,`DTSTAMP:${nowISO().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`);const title=ensureSemesterPrefix(item.title,semester,entity,entity==='activity'?item.type:item.type);lines.push(`SUMMARY:${escapeIcs(title)}`);if(item.allDay){lines.push(`DTSTART;VALUE=DATE:${item.date.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${nextDate(item.date).replace(/-/g,'')}`);}else{lines.push(`DTSTART;TZID=${TZ}:${item.date.replace(/-/g,'')}T${(item.start||'0000').replace(':','')}00`,`DTEND;TZID=${TZ}:${item.date.replace(/-/g,'')}T${(item.end||item.start||'0000').replace(':','')}00`);}if(item.location)lines.push(`LOCATION:${escapeIcs(item.location)}`);lines.push(`DESCRIPTION:${escapeIcs(managedDescription(item,semester,subjectById(item.subjectId)))}`);(item.reminders||[]).slice(0,5).forEach(minutes=>lines.push('BEGIN:VALARM',`TRIGGER:-PT${minutes}M`,'ACTION:DISPLAY',`DESCRIPTION:${escapeIcs(item.title)}`,'END:VALARM'));lines.push('END:VEVENT');}lines.push('END:VCALENDAR');downloadFile(`fatec-flow-${activeSemester()?.name?.replace('/','-')||todayISO()}.ics`,lines.join('\r\n'),'text/calendar');showToast('Agenda .ics exportada.');}

  // ===== Interações =====
  document.addEventListener('click', event => {
    const button=event.target.closest('button,[data-open],[data-go],[data-mobile-more]');if(!button)return;
    if(button.dataset.mobileMore==='open')openMobileMore();
    if(button.dataset.mobileMore==='close')closeMobileMore();
    if(button.dataset.view)switchView(button.dataset.view);
    if(button.dataset.go)switchView(button.dataset.go);
    if(button.dataset.open)openDialog(button.dataset.open);
    if(button.dataset.quickActivity)openDialog('activity',{type:button.dataset.quickActivity});
    if(button.dataset.close){const dialog=$(button.dataset.close);if(dialog?.open)dialog.close();}
    if(button.dataset.editEntity)openDialog(button.dataset.editEntity,{id:button.dataset.id});
    if(button.dataset.toggleEntity)toggleEntity(button.dataset.toggleEntity,button.dataset.id);
    if(button.dataset.deleteEntity)deleteEntity(button.dataset.deleteEntity,button.dataset.id);
    if(button.dataset.googleTemplate){const item=button.dataset.googleTemplate==='activity'?activityById(button.dataset.id):eventById(button.dataset.id);if(item)window.open(googleTemplateUrl(item,button.dataset.googleTemplate),'_blank','noopener');}
    if(button.dataset.duplicateActivity)duplicateActivity(button.dataset.duplicateActivity);
    if(button.dataset.useSemester){state.activeSemesterId=button.dataset.useSemester;saveState();renderAll();showToast('Semestre alterado.');}
    if(button.dataset.editSemester)openDialog('semester',{id:button.dataset.editSemester});
    if(button.dataset.deleteSemester)deleteSemester(button.dataset.deleteSemester);
    if(button.dataset.editSubject)openDialog('subject',{id:button.dataset.editSubject});
    if(button.dataset.deleteSubject)deleteSubject(button.dataset.deleteSubject);
    if(button.dataset.editTeacher)openDialog('teacher',{id:button.dataset.editTeacher});
    if(button.dataset.deleteTeacher)deleteTeacher(button.dataset.deleteTeacher);
    if(button.dataset.formulaSubject){selectedFormulaSubjectId=button.dataset.formulaSubject;switchView('evaluations');activateEvaluationTab('formulas');renderEvaluations();}
    if(button.dataset.selectFormulaSubject){selectedFormulaSubjectId=button.dataset.selectFormulaSubject;renderEvaluations();}
    if(button.dataset.evalTab)activateEvaluationTab(button.dataset.evalTab);
    if(button.dataset.token!==undefined){const input=$('formulaInput'),start=input.selectionStart,end=input.selectionEnd;input.value=input.value.slice(0,start)+button.dataset.token+input.value.slice(end);input.focus();input.selectionStart=input.selectionEnd=start+button.dataset.token.length;updateFormulaPreview();}
    if(button.dataset.removeReminder){const kind=button.dataset.removeReminder;reminderDrafts[kind].splice(Number(button.dataset.index),1);renderReminderEditor(kind);const preset=$(kind==='activity'?'activityReminderPreset':'eventReminderPreset');preset.value='custom';}
    if(button.dataset.editAttendance)openDialog('attendance',{id:button.dataset.editAttendance});
    if(button.dataset.deleteAttendance)deleteAttendance(button.dataset.deleteAttendance);
    if(button.dataset.restoreTrash)restoreTrash(button.dataset.restoreTrash);
    if(button.dataset.removeTrash){state.trash=state.trash.filter(item=>item.id!==button.dataset.removeTrash);saveState();renderTrash();}
    if(button.dataset.scrollSettings){const target=$(`settings-${button.dataset.scrollSettings}`);target?.scrollIntoView({behavior:'smooth',block:'start'});}
  });

  function activateEvaluationTab(tab){$$('[data-eval-tab]').forEach(button=>button.classList.toggle('active',button.dataset.evalTab===tab));$$('.eval-tab').forEach(node=>node.classList.toggle('active',node.id===`evalTab${tab[0].toUpperCase()+tab.slice(1)}`));if(tab==='simulator')renderSimulator();}

  ['semesterStart','semesterEnd'].forEach(id=>$(id).addEventListener('input',validateSemesterForm));
  ['activityDate','activitySemester','activitySubject','activityCode','activityScore','activityMaxScore'].forEach(id=>$(id).addEventListener('input',validateActivityForm));
  ['eventDate','eventSemester','eventSubject'].forEach(id=>$(id).addEventListener('input',validateEventForm));
  ['agendaSearch','agendaTypeFilter','agendaSubjectFilter','agendaStatusFilter'].forEach(id=>$(id).addEventListener('input',renderAgenda));
  ['subjectSearch','subjectTeacherFilter'].forEach(id=>$(id).addEventListener('input',renderSubjects));
  ['activitySearch','activitySubjectFilter','activityTypeFilter'].forEach(id=>$(id).addEventListener('input',renderActivityList));
  ['attendanceSubjectFilter','attendanceStatusFilter'].forEach(id=>$(id).addEventListener('input',renderAttendance));
  ['formulaInput','formulaMissingPolicy','formulaDecimals','formulaRounding','formulaPassingGrade'].forEach(id=>$(id).addEventListener('input',updateFormulaPreview));
  $('simulatorSubject').addEventListener('change',renderSimulator);$('simulatorFields').addEventListener('input',updateSimulatorResult);
  $('activeSemesterSelect').addEventListener('change',event=>{state.activeSemesterId=event.target.value;saveState();selectedFormulaSubjectId='';renderAll();});
  if($('mobileSemesterSelect'))$('mobileSemesterSelect').addEventListener('change',event=>{state.activeSemesterId=event.target.value;saveState();selectedFormulaSubjectId='';renderAll();closeMobileMore();showToast('Semestre alterado.');});
  $('quickSemesterButton').addEventListener('click',()=>switchView('semesters'));
  if($('mobileSyncButton'))$('mobileSyncButton').addEventListener('click',syncGoogle);
  if($('mobileNotificationButton'))$('mobileNotificationButton').addEventListener('click',()=>{$('notificationCenterButton').click();});
  if($('mobileLockButton'))$('mobileLockButton').addEventListener('click',()=>{closeMobileMore();lockApp();});
  $('subjectKind').addEventListener('change',updateSubjectKindFields);
  $('subjectSemester').addEventListener('change',renderSubjectDependentSelects);$('activitySemester').addEventListener('change',()=>{renderSubjectDependentSelects();validateActivityForm();});$('eventSemester').addEventListener('change',()=>{renderSubjectDependentSelects();validateEventForm();});$('attendanceSemester').addEventListener('change',renderSubjectDependentSelects);
  $('activityType').addEventListener('change',()=>{if(!$('activityId').value){$('activityCode').value=uniqueActivityCode(state.activities,$('activitySubject').value,ACTIVITY_TYPES[$('activityType').value]?.label||'AV');$('activityTitle').value=$('activityTitle').value||ACTIVITY_TYPES[$('activityType').value]?.label||'';}if($('activityReminderPreset').value!=='custom'){reminderDrafts.activity=presetReminders('activity',$('activityType').value,$('activityReminderPreset').value);renderReminderEditor('activity');}validateActivityForm();});
  $('activitySubject').addEventListener('change',()=>{if(!$('activityId').value)$('activityCode').value=uniqueActivityCode(state.activities,$('activitySubject').value,$('activityCode').value||ACTIVITY_TYPES[$('activityType').value]?.label||'AV');validateActivityForm();});
  $('activityAllDay').addEventListener('change',()=>toggleTimeInputs('activity'));$('eventAllDay').addEventListener('change',()=>toggleTimeInputs('event'));
  $('activityReminderPreset').addEventListener('change',event=>{reminderDrafts.activity=presetReminders('activity',$('activityType').value,event.target.value);renderReminderEditor('activity');});$('eventReminderPreset').addEventListener('change',event=>{reminderDrafts.event=event.target.value==='none'?[]:event.target.value==='custom'?reminderDrafts.event:presetReminders('event',$('eventType').value,event.target.value);renderReminderEditor('event');});
  $('eventType').addEventListener('change',()=>{if($('eventReminderPreset').value!=='custom'){reminderDrafts.event=presetReminders('event',$('eventType').value,'recommended');renderReminderEditor('event');}});
  $('activityReminderRows').addEventListener('change',()=>syncReminderDraftFromRows('activity'));$('eventReminderRows').addEventListener('change',()=>syncReminderDraftFromRows('event'));
  $('addActivityReminderButton').addEventListener('click',()=>{if(reminderDrafts.activity.length>=5)return showToast('O Google aceita até 5 alertas personalizados.');reminderDrafts.activity.push(60);$('activityReminderPreset').value='custom';renderReminderEditor('activity');});
  $('addEventReminderButton').addEventListener('click',()=>{if(reminderDrafts.event.length>=5)return showToast('O Google aceita até 5 alertas personalizados.');reminderDrafts.event.push(60);$('eventReminderPreset').value='custom';renderReminderEditor('event');});
  $('activityGoogleTemplateButton').addEventListener('click',()=>{if(!validateActivityForm())return;const temp={semesterId:$('activitySemester').value,subjectId:$('activitySubject').value,type:$('activityType').value,code:normalizeActivityCode($('activityCode').value),title:$('activityTitle').value||'Atividade',date:$('activityDate').value,allDay:$('activityAllDay').value==='true',start:$('activityStart').value,end:$('activityEnd').value,location:$('activityLocation').value,description:$('activityDescription').value,reminders:reminderDrafts.activity};window.open(googleTemplateUrl(temp,'activity'),'_blank','noopener');});
  $('eventGoogleTemplateButton').addEventListener('click',()=>{if(!validateEventForm())return;const temp={semesterId:$('eventSemester').value,subjectId:$('eventSubject').value,type:$('eventType').value,title:$('eventTitle').value||'Evento',date:$('eventDate').value,allDay:$('eventAllDay').value==='true',start:$('eventStart').value,end:$('eventEnd').value,location:$('eventLocation').value,description:$('eventDescription').value,reminders:reminderDrafts.event};window.open(googleTemplateUrl(temp,'event'),'_blank','noopener');});
  $('attendanceStatus').addEventListener('change',updateAttendancePresentPeriods);$('attendanceTotalPeriods').addEventListener('input',updateAttendancePresentPeriods);$('attendanceCheckinButton').addEventListener('click',performAttendanceCheckin);$('generateAttendanceButton').addEventListener('click',generateAttendanceFromClasses);
  $('saveFormulaButton').addEventListener('click',saveFormula);$('suggestFormulaButton').addEventListener('click',suggestFormula);

  $('saveGoogleSettingsButton').addEventListener('click',()=>{state.settings.googleClientId=$('googleClientId').value.trim();state.settings.googleCalendarId=$('googleCalendarId').value||'primary';state.settings.googleTagSemester=$('googleTagSemester').checked;saveState();renderSettings();showToast('Configuração Google salva.');});
  $('connectGoogleButton').addEventListener('click',connectGoogle);$('loadCalendarsButton').addEventListener('click',loadGoogleCalendars);$('syncGoogleButton').addEventListener('click',syncGoogle);$('syncTopButton').addEventListener('click',syncGoogle);$('tagAllGoogleButton').addEventListener('click',tagAllGoogleEvents);
  $('themeSelect').addEventListener('change',event=>{state.settings.theme=event.target.value;saveState();applyTheme();});
  $('lockTimeout').addEventListener('change',event=>{state.settings.lockTimeoutMinutes=Number(event.target.value);saveState();scheduleAutoLock();showToast('Tempo de bloqueio atualizado.');});
  $('changePasswordButton').addEventListener('click',()=>$('passwordDialog').showModal());$('lockButton').addEventListener('click',lockApp);$('lockSettingsButton').addEventListener('click',lockApp);
  $('saveCampusButton').addEventListener('click',()=>{state.settings.campusName=$('campusName').value.trim()||'Fatec Bauru';state.settings.campusLatitude=$('campusLatitude').value;state.settings.campusLongitude=$('campusLongitude').value;state.settings.campusRadius=Number($('campusRadius').value||500);saveState();showToast('Local de referência salvo.');});
  $('requestNotificationButton').addEventListener('click',async()=>{if(!('Notification'in window))return showToast('Notificações não são suportadas neste navegador.');const permission=await Notification.requestPermission();state.settings.notificationPermissionAsked=true;saveState();renderSettings();if(permission==='granted')new Notification('Fatec Flow',{body:'Notificações internas autorizadas.',icon:'assets/icons/icon-192.png'});});
  $('icsImportInput').addEventListener('change',event=>{importIcsFile(event.target.files[0]);event.target.value='';});$('exportBackupButton').addEventListener('click',exportBackup);$('backupImportInput').addEventListener('change',event=>{importBackup(event.target.files[0]);event.target.value='';});$('exportIcsButton').addEventListener('click',exportIcs);$('openTrashButton').addEventListener('click',()=>{renderTrash();$('trashDialog').showModal();});$('emptyTrashButton').addEventListener('click',()=>{if(confirm('Excluir definitivamente todos os itens da lixeira?')){state.trash=[];saveState();renderTrash();}});$('resetAppButton').addEventListener('click',()=>{const answer=prompt('Para apagar todos os dados locais, digite REDEFINIR:');if(answer==='REDEFINIR'){localStorage.removeItem(STORAGE_KEY);location.reload();}});

  $('notificationCenterButton').addEventListener('click',()=>{$('notificationDrawer').classList.add('open');$('notificationDrawer').setAttribute('aria-hidden','false');$('drawerBackdrop').classList.remove('hidden');renderNotifications();});function closeDrawer(){$('notificationDrawer').classList.remove('open');$('notificationDrawer').setAttribute('aria-hidden','true');$('drawerBackdrop').classList.add('hidden');}$('closeNotificationDrawer').addEventListener('click',closeDrawer);$('drawerBackdrop').addEventListener('click',closeDrawer);

  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;$('installButton').classList.remove('hidden');});$('installButton').addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('installButton').classList.add('hidden');});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.settings.theme==='system')applyTheme();});

  function startInternalNotifications(){clearInterval(internalNotificationTimer);internalNotificationTimer=setInterval(()=>{renderNotifications();if(!('Notification'in window)||Notification.permission!=='granted')return;const now=new Date();for(const item of unifiedAgendaItems()){if(item.status==='cancelado'||item.status==='concluido')continue;const date=entityDateTime(item);for(const minutes of item.reminders||[]){const key=`fatecFlow.notified.${item.entity}.${item.id}.${minutes}.${item.date}`;if(localStorage.getItem(key))continue;const difference=(date-now)/60000;if(difference<=minutes&&difference>minutes-1.5){new Notification(item.title,{body:`${reminderLabel(minutes)} · ${subjectById(item.subjectId)?.name||semesterById(item.semesterId)?.name||'Fatec Flow'}`,icon:'assets/icons/icon-192.png'});localStorage.setItem(key,nowISO());}}}},60000);}

  function migrateSemesterLinks() {
    let changed=false;for(const collection of [state.events,state.activities,state.attendance])for(const item of collection){if(!item.semesterId||!semesterById(item.semesterId)){const semester=semesterForDate(item.date);if(semester){item.semesterId=semester.id;item.updatedAt=nowISO();if(item.googleEventId)item.needsSemesterGoogleUpdate=true;changed=true;}}}
    for(const subject of state.subjects){if(!subject.semesterId){subject.semesterId=state.activeSemesterId;changed=true;}}
    if(changed)saveState();
  }

  function bootstrap() {
    migrateSemesterLinks();renderSelectOptions();applyTheme();$('bootScreen').style.opacity='0';setTimeout(()=>$('bootScreen').classList.add('hidden'),250);
    if(new URLSearchParams(location.search).get('selftest')==='1'){runSelfTest();return;}
    if(!state.security.enabled)showAuthGate('setup');else showAuthGate('unlock');startInternalNotifications();
    if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.error));
  }

  async function runSelfTest() {
    const original=clone(state);const results=[];try{
      state=DEFAULT_STATE();state.security.enabled=false;const subject=state.subjects[0];state.activities.push({id:'test-p1',semesterId:DEFAULT_SEMESTER.id,subjectId:subject.id,type:'prova',code:'P1',title:'P1',date:'2026-09-01',allDay:true,start:'',end:'',maxScore:10,score:8,weight:40,simulatedScore:null,status:'graded',priority:'normal',location:'',description:'',reminders:[],syncWanted:false,dirty:false,createdAt:nowISO(),updatedAt:nowISO()},{id:'test-p2',semesterId:DEFAULT_SEMESTER.id,subjectId:subject.id,type:'prova',code:'P2',title:'P2',date:'2026-11-01',allDay:true,start:'',end:'',maxScore:10,score:6,weight:60,simulatedScore:null,status:'graded',priority:'normal',location:'',description:'',reminders:[],syncWanted:false,dirty:false,createdAt:nowISO(),updatedAt:nowISO()});subject.formula='(P1 * 0.4) + (P2 * 0.6)';const calculation=calculateSubject(subject);results.push(calculation.ok&&Math.abs(calculation.value-6.8)<.001?'PASS fórmula':'FAIL fórmula');results.push(dateInsideSemester('2026-08-03',DEFAULT_SEMESTER.id)&&!dateInsideSemester('2026-07-31',DEFAULT_SEMESTER.id)?'PASS semestre':'FAIL semestre');results.push(state.subjects.length===11?'PASS 11 disciplinas':'FAIL disciplinas');renderAll();$('appShell').classList.remove('hidden');$('authGate').classList.add('hidden');const output=document.createElement('pre');output.id='selfTestResult';output.textContent=results.join('\n');document.body.appendChild(output);document.body.dataset.selftest=results.every(item=>item.startsWith('PASS'))?'pass':'fail';
    }catch(error){const output=document.createElement('pre');output.id='selfTestResult';output.textContent=`FAIL exceção: ${error.stack||error.message}`;document.body.appendChild(output);document.body.dataset.selftest='fail';}finally{state=original;}
  }

  bootstrap();
})();
