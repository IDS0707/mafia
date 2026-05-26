/* ============================================================
   MAFIA — Single-page game app
   No backend. Bots simulate other players. localStorage for user.
   ============================================================ */

(() => {
'use strict';

/* ============================================================
   STATE
   ============================================================ */
const STORAGE_KEY = 'mafia_user_v1';
const PUBLIC_ROOMS_KEY = 'mafia_public_rooms_v1';

const BOT_NAMES = [
  'Don_Carlo','Joker_13','Azik_05','Samurai','Little_Cherry','Queen','Umidjon_',
  'Shadow','Black_Rose','MrNobody','VinDiesel','Ghost','Boss','Phantom','Vegas',
  'Snake','Frost','Bullet','Ace','Raven','Wolf','Lex','Hawk','Crimson','Reaper'
];
const AVATARS = ['a-don','a-joker','a-azik','a-samurai','a-cherry','a-queen','a-umid','a-shadow','a-black','a-mrn'];

// ROLE_DEFS: i18n keys are read live so language changes apply immediately
const ROLE_DEFS = {
  mafia:    { key: 'role.mafia',    team: 'mafia', color: 'red',    descKeys: ['role.mafia.d1', 'role.mafia.d2'] },
  doctor:   { key: 'role.doctor',   team: 'town',  color: 'blue',   descKeys: ['role.doctor.d1', 'role.doctor.d2'] },
  sheriff:  { key: 'role.sheriff',  team: 'town',  color: 'gold',   descKeys: ['role.sheriff.d1', 'role.sheriff.d2'] },
  civilian: { key: 'role.civilian', team: 'town',  color: 'gray',   descKeys: ['role.civilian.d1', 'role.civilian.d2'] },
  maniac:   { key: 'role.maniac',   team: 'solo',  color: 'violet', descKeys: ['role.maniac.d1', 'role.maniac.d2'] },
  jester:   { key: 'role.jester',   team: 'solo',  color: 'pink',   descKeys: ['role.jester.d1', 'role.jester.d2'] },
};
const roleName = (k) => t(ROLE_DEFS[k].key);

let user = null;     // {name, email, gold, gems, level, xp, games, wins}
let room = null;     // see makeRoom()
let game = null;     // see startGame()
let timers = [];     // active timeouts/intervals to cleanup
let authMode = 'login'; // 'login' | 'register'
let createOpts = { vis: 'public', mode: 'classic', max: 8, time: 60, autoFill: true };

/* ============================================================
   UTILS
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const wait = (ms) => new Promise((r) => { const t = setTimeout(r, ms); timers.push(t); });
const clearTimers = () => { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; };

const fmtTime = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const showToast = (msg, ms = 2200) => {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.hidden = true, 200); }, ms);
};

/* ============================================================
   STORAGE / USER
   ============================================================ */
function loadUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function saveUser() {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}
function makeNewUser({ name, email }) {
  return {
    name: name || (email && email.split('@')[0]) || 'Player',
    email: email || `${name}@local`,
    gold: 12450, gems: 890,
    level: 1, xp: 0, xpNeeded: 1000,
    games: 0, wins: 0,
    avatar: pick(AVATARS),
  };
}

/* ============================================================
   ROUTER
   ============================================================ */
function showView(name) {
  $$('.view').forEach(v => v.hidden = (v.dataset.view !== name));
  $$('.topnav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
  window.scrollTo(0, 0);
  if (name === 'menu') refreshMenu();
  if (name === 'profile') refreshProfile();
  if (name === 'leaderboard') refreshLeaderboard();
  if (name === 'join') refreshPublicRooms();
  if (name === 'shop') refreshShop();
  // Music context — calm for non-game views
  if (['menu','profile','shop','leaderboard','create','join','lobby','auth','splash'].includes(name)) {
    setMusicMode('calm');
  }
}

/* ============================================================
   SPLASH
   ============================================================ */
function bootSplash() {
  const fill = $('#splashFill');
  const pct = $('#splashPct');
  let p = 0;
  fill.style.transform = 'scaleX(0)';
  const iv = setInterval(() => {
    p = Math.min(100, p + (3 + Math.random() * 8));
    fill.style.transform = `scaleX(${p / 100})`;
    pct.textContent = Math.round(p) + '%';
    if (p >= 100) {
      clearInterval(iv);
      setTimeout(afterSplash, 500);
    }
  }, 130);
  timers.push(iv);
}
function afterSplash() {
  $('.view-splash').hidden = true;
  if (user) {
    $('#appShell').hidden = false;
    showView('menu');
  } else {
    $('.view-auth').hidden = false;
  }
}

/* ============================================================
   AUTH
   ============================================================ */
function syncAuthMode() {
  $('#authTitle').setAttribute('data-i18n', authMode === 'login' ? 'auth.welcome' : 'auth.createAcc');
  $('#authSub').setAttribute('data-i18n', authMode === 'login' ? 'auth.loginSub' : 'auth.registerSub');
  $('#authSubmit').setAttribute('data-i18n', authMode === 'login' ? 'auth.login' : 'auth.register');
  $('#authToggleText').setAttribute('data-i18n', authMode === 'login' ? 'auth.noAccount' : 'auth.haveAccount');
  $('#authToggle').setAttribute('data-i18n', authMode === 'login' ? 'auth.toggleReg' : 'auth.toggleLog');
  // re-apply translations
  $('#authTitle').textContent = t(authMode === 'login' ? 'auth.welcome' : 'auth.createAcc');
  $('#authSub').textContent = t(authMode === 'login' ? 'auth.loginSub' : 'auth.registerSub');
  $('#authSubmit').textContent = t(authMode === 'login' ? 'auth.login' : 'auth.register');
  $('#authToggleText').textContent = t(authMode === 'login' ? 'auth.noAccount' : 'auth.haveAccount');
  $('#authToggle').textContent = t(authMode === 'login' ? 'auth.toggleReg' : 'auth.toggleLog');
  $('#fieldName').hidden = (authMode === 'login');
  $('#authError').textContent = '';
}

function setupAuth() {
  $('#authToggle').addEventListener('click', () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    syncAuthMode();
  });

  $('#authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#iEmail').value.trim();
    const pass = $('#iPass').value.trim();
    const name = $('#iName').value.trim();
    if (!email || !pass) { $('#authError').textContent = t('auth.errReq'); return; }
    if (authMode === 'register' && !name) { $('#authError').textContent = t('auth.errName'); return; }
    user = makeNewUser({ name: name || email.split('@')[0], email });
    saveUser();
    enterApp();
  });

  $$('.oauth').forEach(b => b.addEventListener('click', () => {
    const provider = b.dataset.oauth;
    user = makeNewUser({ name: provider === 'google' ? 'Google_Player' : 'TG_Player', email: `${provider}@oauth` });
    saveUser();
    enterApp();
  }));
}
function enterApp() {
  $('.view-auth').hidden = true;
  $('#appShell').hidden = false;
  showView('menu');
}
function logout() {
  localStorage.removeItem(STORAGE_KEY);
  user = null; room = null; game = null;
  clearTimers();
  $('#appShell').hidden = true;
  $('.view-auth').hidden = false;
}

/* ============================================================
   MAIN MENU
   ============================================================ */
function refreshMenu() {
  $('#heroName').textContent = (user.name || 'PLAYER').toUpperCase();
  $('#topGold').textContent = user.gold.toLocaleString();
  $('#topGems').textContent = user.gems.toLocaleString();
  $('#statGames').textContent = user.games;
  $('#statWins').textContent = user.wins;
  $('#statRate').textContent = (user.games ? Math.round(user.wins / user.games * 100) : 0) + '%';
  $('#statLvl').textContent = user.level;
  // Top profile
  const topName = $('#topName'); if (topName) topName.textContent = user.name;
  const topLvl = $('#topLvl'); if (topLvl) topLvl.textContent = 'LEVEL ' + user.level;
  const topXp = $('#topXp');
  if (topXp) topXp.style.width = Math.round(user.xp / user.xpNeeded * 100) + '%';
  const topXpText = $('#topXpText'); if (topXpText) topXpText.textContent = `${user.xp} / ${user.xpNeeded}`;
  const topAvatar = $('#topAvatar');
  if (topAvatar) topAvatar.className = 'avatar avatar-sm ' + (user.avatar || 'a-don');
  startRewardTimer();
}

/* ============================================================
   DAILY REWARD — 24h cooldown, persistent
   ============================================================ */
const REWARD_KEY = 'mafia_daily_v1';
let rewardIv = null;

function lastClaimDay() {
  try {
    const v = localStorage.getItem(REWARD_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}
function todayDay() {
  return Math.floor(Date.now() / 86400000);
}
function canClaimReward() {
  return lastClaimDay() < todayDay();
}

function startRewardTimer() {
  if (rewardIv) clearInterval(rewardIv);
  const el = $('#rewardTimer');
  const btn = $('#btnClaimReward');
  if (!el || !btn) return;
  const tick = () => {
    if (canClaimReward()) {
      el.textContent = 'READY';
      el.classList.add('ready');
      btn.disabled = false;
      btn.textContent = t('reward.claim');
    } else {
      el.classList.remove('ready');
      btn.disabled = true;
      btn.textContent = t('reward.claimed') || 'CLAIMED';
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const diff = Math.max(0, next - now);
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      el.textContent = `${h}:${m}:${s}`;
    }
  };
  tick();
  rewardIv = setInterval(tick, 1000);

  if (!btn._wired) {
    btn._wired = true;
    btn.addEventListener('click', () => {
      if (!canClaimReward()) return;
      const goldReward = 500;
      const gemReward = 25;
      user.gold += goldReward;
      user.gems += gemReward;
      saveUser();
      localStorage.setItem(REWARD_KEY, String(todayDay()));
      SFX.notify();
      launchGoldParticles();
      showToast(`+${goldReward} ⬢   +${gemReward} ◆`, 3000);
      refreshMenu();
    });
  }
}

/* ============================================================
   ROOM CONSTRUCTION
   ============================================================ */
function makeRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function makeBotPlayer() {
  return {
    id: 'b' + Math.random().toString(36).slice(2, 8),
    name: pick(BOT_NAMES.filter(n => !room || !room.players.find(p => p.name === n))) || ('Bot_' + rand(99)),
    avatar: pick(AVATARS),
    isBot: true,
    ready: false,
    alive: true,
    role: null,
  };
}
function makeRoom({ vis, mode, max, time, host, code }) {
  return {
    code: code || makeRoomCode(),
    vis, mode, max, time,
    host,
    players: [{
      id: 'me',
      name: user.name,
      avatar: user.avatar || 'a-don',
      isBot: false,
      ready: false,
      alive: true,
      role: null,
      isHost: true,
    }],
    created: Date.now(),
  };
}

/* ============================================================
   CREATE ROOM
   ============================================================ */
function setupCreate() {
  // Segmented controls (visibility / mode / max / autoFill)
  const segs = [
    { sel: '#segVis',      key: 'vis',      coerce: (v) => v },
    { sel: '#segMode',     key: 'mode',     coerce: (v) => v },
    { sel: '#segMax',      key: 'max',      coerce: Number },
    { sel: '#segAutoFill', key: 'autoFill', coerce: (v) => v === 'true' },
  ];
  segs.forEach(({ sel, key, coerce }) => {
    const root = $(sel);
    if (!root) return;
    $$(`${sel} button`).forEach((b) => b.addEventListener('click', () => {
      $$(`${sel} button`).forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      createOpts[key] = coerce(b.dataset.val);
      updateCreateSummary();
    }));
  });

  // Day timer slider
  const range = $('#rangeTime');
  const rangeVal = $('#rangeTimeVal');
  if (range && rangeVal) {
    range.value = String(createOpts.time);
    rangeVal.textContent = String(createOpts.time);
    range.addEventListener('input', () => {
      createOpts.time = Number(range.value);
      rangeVal.textContent = range.value;
      updateCreateSummary();
    });
  }

  updateCreateSummary();

  $('#btnCreate').addEventListener('click', () => {
    room = makeRoom({ ...createOpts, host: 'me' });
    room.autoFill = createOpts.autoFill;
    enterLobby();
  });
}
function updateCreateSummary() {
  const hint = createOpts.autoFill ? t('create.botsHint') : t('create.noBotsHint');
  $('#createSummary').innerHTML = `
    <span>${t('create.summary', {
      vis: t('create.' + createOpts.vis),
      mode: t('create.' + createOpts.mode),
      max: createOpts.max,
      time: createOpts.time,
    })}</span>
    <span style="color:var(--text-3);font-size:11px;">${hint}</span>
  `;
}

/* ============================================================
   JOIN ROOM
   ============================================================ */
function setupJoin() {
  $('#btnJoinCode').addEventListener('click', () => tryJoinByCode());
  $('#iCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryJoinByCode(); });
  $('#btnRefreshRooms').addEventListener('click', () => refreshPublicRooms(true));
}
function tryJoinByCode() {
  const code = $('#iCode').value.trim();
  $('#joinError').textContent = '';
  if (!/^\d{6}$/.test(code)) {
    $('#joinError').textContent = t('join.errCode');
    return;
  }
  // Simulate finding a private room with this code
  room = makeRoom({
    vis: 'private', mode: 'classic', max: 8, time: 60, host: 'bot-host', code,
  });
  // make the joiner not the host
  room.players[0].isHost = false;
  // add a fake host bot
  const hostBot = makeBotPlayer();
  hostBot.isHost = true;
  hostBot.ready = true;
  room.players.unshift(hostBot);
  enterLobby();
}
function refreshPublicRooms(forceNew) {
  // Generate a few synthetic public rooms each time
  const list = $('#publicList');
  list.innerHTML = '';
  const modes = ['classic', 'rapid', 'ranked'];
  const count = 4 + rand(3);
  for (let i = 0; i < count; i++) {
    const max = pick([6, 8, 8, 10, 12]);
    const players = 2 + rand(max - 2);
    const mode = pick(modes);
    const time = pick([45, 60, 90]);
    const code = makeRoomCode();
    const row = document.createElement('button');
    row.className = 'public-row';
    row.innerHTML = `
      <span class="pr-mode mode-${mode}">${t('create.' + mode).toUpperCase()}</span>
      <span class="pr-name">${pick(['Late Night', 'Cold Streets', 'The Family', 'Trust None', 'Vendetta', 'Silent Vow', 'Velvet Night', 'Black Rose'])}</span>
      <span class="pr-fill">${players}/${max}</span>
      <span class="pr-time">${time}s</span>
      <span class="pr-go">${t('join.go')}</span>
    `;
    row.addEventListener('click', () => {
      room = makeRoom({ vis: 'public', mode, max, time, host: 'bot-host', code });
      room.players[0].isHost = false;
      // pre-fill bots up to current count
      const hostBot = makeBotPlayer();
      hostBot.isHost = true;
      hostBot.ready = true;
      room.players.unshift(hostBot);
      for (let k = 0; k < players - 1; k++) {
        const b = makeBotPlayer();
        b.ready = Math.random() > 0.4;
        room.players.push(b);
      }
      enterLobby();
    });
    list.appendChild(row);
  }
}

/* ============================================================
   LOBBY
   ============================================================ */
function enterLobby() {
  showView('lobby');
  $('#lobbyCode').textContent = room.code;
  $('#lobbyMax').textContent = room.max;
  $('#lobbyMode').textContent = t('create.' + room.mode);
  $('#lobbyTime').textContent = room.time + 's';
  $('#lobbyVis').textContent = t('create.' + room.vis);
  renderLobby();
  // Auto-fill bots over time only if room.autoFill is enabled (default true)
  if (room.autoFill !== false) {
    scheduleBotJoins();
  }
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function scheduleBotJoins() {
  // Every 1.2 - 2.5s, add a bot until full
  const iv = setInterval(() => {
    if (!room || room.players.length >= room.max) {
      clearInterval(iv);
      return;
    }
    const bot = makeBotPlayer();
    bot.ready = Math.random() > 0.5;
    room.players.push(bot);
    renderLobby();
    // Bots toggle ready over time
    setTimeout(() => {
      if (room && room.players.includes(bot)) {
        bot.ready = true;
        renderLobby();
      }
    }, 1500 + rand(2500));
  }, 1200 + rand(1300));
  timers.push(iv);
}

function renderLobby() {
  const grid = $('#lobbyGrid');
  grid.innerHTML = '';
  // Build slots up to max
  for (let i = 0; i < room.max; i++) {
    const p = room.players[i];
    const cell = document.createElement('div');
    if (p) {
      cell.className = 'lobby-row' + (p.id === 'me' ? ' me' : '');
      cell.innerHTML = `
        <div class="avatar avatar-sm ${p.avatar}"></div>
        <div class="lob-info">
          <div class="lob-name">${escapeHtml(p.name)} ${p.isHost ? `<span class="host">${t('lobby.host')}</span>` : ''}</div>
          <div class="lob-st ${p.ready ? 'ready' : 'not'}">${p.ready ? t('lobby.statusReady') : t('lobby.statusNot')}</div>
        </div>
        ${p.id === 'me' ? `<span class="lob-flag violet">${t('lobby.you')}</span>` : ''}
      `;
    } else {
      cell.className = 'lobby-row empty';
      cell.innerHTML = `
        <div class="empty-slot"></div>
        <div class="lob-info">
          <div class="lob-name muted">${t('lobby.waitingPlayer')}</div>
          <div class="lob-st muted">${t('lobby.empty')}</div>
        </div>
      `;
    }
    grid.appendChild(cell);
  }

  $('#lobbyCount').textContent = room.players.length;

  const me = room.players.find(p => p.id === 'me');
  if (me) {
    $('#btnReady').textContent = me.ready ? t('lobby.cancel') : t('lobby.ready');
    $('#btnReady').classList.toggle('on', me.ready);
  }

  const allReady = room.players.length >= Math.max(4, Math.floor(room.max * 0.5)) && room.players.every(p => p.ready);
  const isHost = me && me.isHost;
  $('#btnStart').disabled = !(isHost && allReady);
  if (!isHost) {
    $('#lobbyHint').textContent = allReady ? t('lobby.allReady') : t('lobby.waiting');
  } else {
    $('#lobbyHint').textContent = allReady ? t('lobby.startReady') : t('lobby.needMore', { n: Math.max(0, Math.max(4, Math.floor(room.max * 0.5)) - room.players.length) });
  }
}

function setupLobby() {
  $('#btnReady').addEventListener('click', () => {
    const me = room.players.find(p => p.id === 'me');
    me.ready = !me.ready;
    renderLobby();
  });
  $('#btnStart').addEventListener('click', () => {
    if ($('#btnStart').disabled) return;
    startGame();
  });
  $('#btnCopyCode').addEventListener('click', () => {
    navigator.clipboard?.writeText(room.code);
    showToast(t('lobby.copied'));
  });
  $('#btnLeaveLobby').addEventListener('click', () => {
    if (confirm(t('lobby.confirmLeave'))) {
      clearTimers();
      room = null;
      showView('menu');
    }
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ============================================================
   GAME — start / role assignment
   ============================================================ */
function rolesForCount(n) {
  // Returns array of role keys, length n
  // Mafia ≈ 25% (rounded). Always 1 sheriff + 1 doctor when n>=6. Maniac for n>=8. Jester for n>=10.
  const mafiaCount = Math.max(1, Math.round(n * 0.25));
  const roles = [];
  for (let i = 0; i < mafiaCount; i++) roles.push('mafia');
  roles.push('sheriff');
  if (n >= 6) roles.push('doctor');
  if (n >= 8) roles.push('maniac');
  if (n >= 10) roles.push('jester');
  while (roles.length < n) roles.push('civilian');
  return shuffle(roles).slice(0, n);
}

function startGame() {
  clearTimers();
  const players = room.players;
  const roles = rolesForCount(players.length);
  players.forEach((p, i) => {
    p.role = roles[i];
    p.alive = true;
    p.lastSavedBy = null;
    p.investigated = false;
  });

  game = {
    day: 1,
    phase: 'role-reveal',
    log: [],
    chat: [],
    nightActions: {}, // {mafiaTarget, doctorSave, sheriffCheck, maniacTarget}
    votes: {},
    timer: 0,
    hostBotAuto: !players.find(p => p.id === 'me')?.isHost, // if not host, auto-progresses
  };

  showView('game');
  showRoleReveal();
}

/* ============================================================
   ROLE REVEAL MODAL
   ============================================================ */
function showRoleReveal() {
  const me = room.players.find(p => p.id === 'me');
  const def = ROLE_DEFS[me.role];
  $('#roleName').textContent = t(def.key);
  $('#roleName').className = 'role-title role-color-' + def.color;
  $('#roleActions').innerHTML = def.descKeys.map(k => `<div>${t(k)}</div>`).join('');

  // Show team for mafia
  const teamWrap = $('#roleTeam');
  if (me.role === 'mafia') {
    const mates = room.players.filter(p => p.role === 'mafia' && p.id !== me.id);
    if (mates.length) {
      teamWrap.hidden = false;
      $('#roleTeamAvs').innerHTML = mates.map(p => `<div class="rt-av"><div class="avatar avatar-xs ${p.avatar}"></div><span>${escapeHtml(p.name)}</span></div>`).join('');
    } else {
      teamWrap.hidden = true;
    }
  } else {
    teamWrap.hidden = true;
  }

  // Figure (silhouette) — simple variant by team color
  $('#roleFigure').innerHTML = `
    <svg viewBox="0 0 100 140">
      <path d="M50 20c-12 0-22 8-22 18l-6 2c-2 1-3 3-2 5l4 7-4 9v75h60V61l-4-9 4-7c1-2 0-4-2-5l-6-2c0-10-10-18-22-18z" fill="#0a0205" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `;

  $('#modalRole').hidden = false;
  SFX.roleReveal(me.role);
  $('#btnRoleOk').onclick = () => {
    SFX.click();
    $('#modalRole').hidden = true;
    enterNight();
  };
}

/* ============================================================
   PHASES
   ============================================================ */
function setPhase(phaseName, label) {
  game.phase = phaseName;
  $('#gamePhase').textContent = label;
  $('#gameDay').textContent = game.day;
  $('#aliveCount').textContent = room.players.filter(p => p.alive).length;
  renderPlayersList();
}

function renderPlayersList() {
  const me = room.players.find(p => p.id === 'me');
  const list = $('#playersList');
  list.innerHTML = '';
  room.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'pl-row' + (!p.alive ? ' dead' : '') + (p.id === 'me' ? ' me' : '');
    row.dataset.pid = p.id;

    let badge = '';
    if (!p.alive) badge = `<span class="pl-badge dead">${roleName(p.role)}</span>`;
    else if (p.id === me.id) badge = `<span class="pl-badge you">${t('lobby.you')} · ${roleName(p.role)}</span>`;
    else if (me.role === 'mafia' && p.role === 'mafia') badge = `<span class="pl-badge mate">${t('role.mafia')}</span>`;

    row.innerHTML = `
      <div class="avatar avatar-sm ${p.avatar}"></div>
      <div class="pl-row-info">
        <div class="pl-row-name">${escapeHtml(p.name)}</div>
        ${badge}
      </div>
    `;
    list.appendChild(row);
  });
}

/* ----------- NIGHT ----------- */
async function enterNight() {
  setMusicMode('mystery');
  setPhase('night', t('phase.night'));
  $('#rightHead').textContent = t('phase.nightShort');
  $('#chat').innerHTML = '';
  pushSystemKey('night.fall', { n: game.day });
  game.nightActions = {};

  const me = room.players.find(p => p.id === 'me');
  const stage = $('#gameStage');
  stage.className = 'game-stage stage-night';

  // Prompt me based on role (only if alive)
  if (!me.alive) {
    stage.innerHTML = nightWaitView(t('night.deadWatch'));
  } else if (me.role === 'mafia') {
    stage.innerHTML = nightChooseView(t('night.mafiaTitle'), t('night.mafiaSub'));
    bindNightChoice('mafia');
  } else if (me.role === 'doctor') {
    stage.innerHTML = nightChooseView(t('night.docTitle'), t('night.docSub'));
    bindNightChoice('doctor');
  } else if (me.role === 'sheriff') {
    stage.innerHTML = nightChooseView(t('night.shTitle'), t('night.shSub'));
    bindNightChoice('sheriff');
  } else if (me.role === 'maniac') {
    stage.innerHTML = nightChooseView(t('night.mnTitle'), t('night.mnSub'));
    bindNightChoice('maniac');
  } else {
    stage.innerHTML = nightWaitView(t('night.civSleep'));
  }

  // Run timer (30s for night) — when it ends or all decisions in, resolve
  await runTimer(30, () => {
    // Check if all required choices made
    return allNightActionsIn();
  });

  resolveNight();
}

function allNightActionsIn() {
  const need = {};
  if (room.players.some(p => p.alive && p.role === 'mafia')) need.mafia = true;
  if (room.players.some(p => p.alive && p.role === 'doctor')) need.doctor = true;
  if (room.players.some(p => p.alive && p.role === 'sheriff')) need.sheriff = true;
  if (room.players.some(p => p.alive && p.role === 'maniac')) need.maniac = true;
  for (const k in need) {
    if (!game.nightActions[k]) return false;
  }
  return true;
}

function nightChooseView(title, sub) {
  const me = room.players.find(p => p.id === 'me');
  const choices = room.players.filter(p => p.alive && p.id !== me.id);
  return `
    <div class="stage-card">
      <h2 class="stage-title">${title}</h2>
      <p class="stage-sub">${sub}</p>
      <div class="choice-grid" id="choiceGrid">
        ${choices.map(p => `
          <button class="choice" data-pid="${p.id}">
            <div class="avatar avatar-md ${p.avatar}"></div>
            <span>${escapeHtml(p.name)}</span>
          </button>
        `).join('')}
      </div>
      <div class="stage-confirm" id="stageConfirm" hidden>
        <span>${t('night.selected')} <b id="confirmName"></b></span>
        <button class="btn-primary" id="btnConfirmNight">${t('night.confirm')}</button>
      </div>
    </div>
  `;
}
function nightWaitView(msg) {
  return `
    <div class="stage-card">
      <h2 class="stage-title">${t('night.title', { n: game.day })}</h2>
      <p class="stage-sub">${msg}</p>
      <div class="moon-vis"></div>
    </div>
  `;
}
function bindNightChoice(role) {
  let pickedId = null;
  $$('#choiceGrid .choice').forEach(b => b.addEventListener('click', () => {
    $$('#choiceGrid .choice').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    pickedId = b.dataset.pid;
    $('#stageConfirm').hidden = false;
    $('#confirmName').textContent = room.players.find(p => p.id === pickedId).name;
  }));
  $('#btnConfirmNight').onclick = () => {
    if (!pickedId) return;
    SFX.voteConfirm();
    submitNightAction(role, pickedId);
    $('#gameStage').innerHTML = nightWaitView(roleAckMsg(role, pickedId));
  };
}
function roleAckMsg(role, pid) {
  const tgt = room.players.find(p => p.id === pid);
  if (role === 'mafia')   return t('night.ackMafia', { n: tgt.name });
  if (role === 'doctor')  return t('night.ackDoc',   { n: tgt.name });
  if (role === 'sheriff') return t('night.ackSh',    { n: tgt.name });
  if (role === 'maniac')  return t('night.ackMn',    { n: tgt.name });
  return t('night.ackWait');
}
function submitNightAction(role, pid) {
  if (role === 'mafia')   game.nightActions.mafia = pid;
  if (role === 'doctor')  game.nightActions.doctor = pid;
  if (role === 'sheriff') { game.nightActions.sheriff = pid; }
  if (role === 'maniac')  game.nightActions.maniac = pid;
}

/* Bot night decisions (made at night start, but applied when needed) */
function botNightActions() {
  // Bots make decisions independently — pick one per role group
  const aliveMafia = room.players.filter(p => p.alive && p.role === 'mafia' && p.isBot);
  const allMafia = room.players.filter(p => p.alive && p.role === 'mafia');
  // Mafia votes — pick a town target
  if (allMafia.length && !game.nightActions.mafia) {
    const mafiaIs = (p) => p.role === 'mafia';
    const targets = room.players.filter(p => p.alive && !mafiaIs(p));
    if (targets.length) game.nightActions.mafia = pick(targets).id;
  }
  // Doctor (bot)
  const doc = room.players.find(p => p.alive && p.role === 'doctor');
  if (doc && doc.isBot && !game.nightActions.doctor) {
    // Doctor often saves themselves or random town
    const town = room.players.filter(p => p.alive);
    game.nightActions.doctor = pick(town).id;
  }
  // Sheriff (bot)
  const sh = room.players.find(p => p.alive && p.role === 'sheriff');
  if (sh && sh.isBot && !game.nightActions.sheriff) {
    const others = room.players.filter(p => p.alive && p.id !== sh.id);
    if (others.length) game.nightActions.sheriff = pick(others).id;
  }
  // Maniac (bot)
  const mn = room.players.find(p => p.alive && p.role === 'maniac');
  if (mn && mn.isBot && !game.nightActions.maniac) {
    const others = room.players.filter(p => p.alive && p.id !== mn.id);
    if (others.length) game.nightActions.maniac = pick(others).id;
  }
}

function resolveNight() {
  botNightActions();
  const me = room.players.find(p => p.id === 'me');

  // Compute kills
  const killed = new Set();
  if (game.nightActions.mafia && game.nightActions.mafia !== game.nightActions.doctor) {
    killed.add(game.nightActions.mafia);
  }
  if (game.nightActions.maniac && game.nightActions.maniac !== game.nightActions.doctor) {
    // Maniac and mafia could target the same person; doctor only saves once
    killed.add(game.nightActions.maniac);
  }

  // Apply
  const dead = [];
  killed.forEach(pid => {
    const p = room.players.find(x => x.id === pid);
    if (p && p.alive) {
      p.alive = false;
      dead.push(p);
    }
  });

  // Sheriff result (private to sheriff)
  if (me.role === 'sheriff' && game.nightActions.sheriff) {
    const target = room.players.find(p => p.id === game.nightActions.sheriff);
    if (target) {
      const isMafia = target.role === 'mafia';
      const verdict = isMafia ? `<span class="bad">${t('night.isMafia')}</span>` : `<span class="good">${t('night.notMafia')}</span>`;
      pushSystem(t('night.shResult', { n: target.name, x: verdict }));
    }
  }

  // Show summary, then go to day
  enterDawn(dead);
}

/* ----------- DAWN summary ----------- */
async function enterDawn(dead) {
  setMusicMode(dead.length ? 'tense' : 'mystery');
  setPhase('dawn', t('phase.dawn'));
  const stage = $('#gameStage');
  stage.className = 'game-stage stage-dawn';

  if (dead.length === 0) {
    stage.innerHTML = `
      <div class="stage-card">
        <h2 class="stage-title">${t('dawn.title')}</h2>
        <p class="stage-sub big">${t('dawn.noDeath')}</p>
        <div class="dawn-vis safe"></div>
      </div>
    `;
    pushSystemKey('dawn.noDeathSys');
  } else {
    const bodyMsg = dead.length === 1 ? t('dawn.body') : t('dawn.bodies', { n: dead.length });
    stage.innerHTML = `
      <div class="stage-card">
        <h2 class="stage-title">${t('dawn.title')}</h2>
        <p class="stage-sub big">${bodyMsg}</p>
        <div class="dead-list">
          ${dead.map(p => `
            <div class="dead-card">
              <div class="avatar avatar-lg ${p.avatar}"></div>
              <div class="dead-name">${escapeHtml(p.name)}</div>
              <div class="dead-role">${t('dawn.was')} ${roleName(p.role)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    dead.forEach(p => pushSystem(t('dawn.killed', { n: p.name, r: roleName(p.role) })));
    // Re-translatable version is harder here (role name interpolated); we keep both for now.
  }

  await wait(4500);

  if (checkGameOver()) return;
  enterDay();
}

/* ----------- DAY (Discussion) ----------- */
async function enterDay() {
  setMusicMode('calm');
  setPhase('day', t('phase.discussion'));
  $('#rightHead').textContent = t('phase.discussion');
  const me = room.players.find(p => p.id === 'me');
  const stage = $('#gameStage');
  stage.className = 'game-stage stage-day';
  stage.innerHTML = `
    <div class="stage-card">
      <h2 class="stage-title">${t('day.title', { n: game.day })}</h2>
      <p class="stage-sub">${t('day.sub')}</p>
      <div class="day-strip" id="dayStrip"></div>
    </div>
  `;
  // Show alive avatars in strip
  $('#dayStrip').innerHTML = room.players.filter(p => p.alive).map(p => `
    <div class="ds-cell">
      <div class="avatar avatar-md ${p.avatar}"></div>
      <span>${escapeHtml(p.name)}</span>
    </div>
  `).join('');

  pushSystemKey('day.sys', { n: game.day, s: room.time });

  // Schedule bot chat throughout discussion
  scheduleBotChat(room.time);

  await runTimer(room.time, () => false);
  if (checkGameOver()) return;
  enterVote();
}

function scheduleBotChat(seconds) {
  const aliveBots = room.players.filter(p => p.alive && p.isBot);
  // 13 chat lines from i18n; some take {n} (a player name), some don't.
  const chatKeys = ['chat.bot1','chat.bot2','chat.bot3','chat.bot4','chat.bot5','chat.bot6','chat.bot7','chat.bot8','chat.bot9','chat.bot10','chat.bot11','chat.bot12','chat.bot13'];
  const total = Math.max(2, Math.min(aliveBots.length * 2, Math.floor(seconds / 4)));
  for (let i = 0; i < total; i++) {
    const tm = setTimeout(() => {
      const speaker = pick(aliveBots);
      const others = room.players.filter(p => p.alive && p.id !== speaker.id);
      const targetName = others.length ? pick(others).name : '';
      pushChatKey(speaker, pick(chatKeys), { n: targetName });
    }, 1500 + (seconds * 1000 / (total + 1)) * i + rand(800));
    timers.push(tm);
  }
}

/* ----------- VOTE ----------- */
async function enterVote() {
  setMusicMode('tense');
  setPhase('vote', t('phase.voting'));
  $('#rightHead').textContent = t('phase.voting');
  const me = room.players.find(p => p.id === 'me');
  const stage = $('#gameStage');
  stage.className = 'game-stage stage-vote';

  game.votes = {};
  const candidates = room.players.filter(p => p.alive);

  stage.innerHTML = `
    <div class="stage-card">
      <h2 class="stage-title">${t('vote.title')}</h2>
      <p class="stage-sub">${t('vote.sub')}</p>
      <div class="vote-grid" id="voteGrid">
        ${candidates.map(p => `
          <button class="vote-cell ${p.id === me.id ? 'self' : ''}" data-pid="${p.id}" ${p.id === me.id ? 'disabled' : ''}>
            <div class="avatar avatar-md ${p.avatar}"></div>
            <span>${escapeHtml(p.name)}</span>
            <span class="vc-count" data-c="${p.id}">0</span>
          </button>
        `).join('')}
      </div>
      <button class="btn-ghost" id="btnSkipVote">${t('vote.skip')}</button>
    </div>
  `;

  if (me.alive) {
    $$('#voteGrid .vote-cell').forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      SFX.voteConfirm();
      $$('#voteGrid .vote-cell').forEach(x => x.classList.remove('mine'));
      b.classList.add('mine');
      game.votes[me.id] = b.dataset.pid;
      updateVoteCounts();
    }));
    $('#btnSkipVote').onclick = () => {
      SFX.click();
      $$('#voteGrid .vote-cell').forEach(x => x.classList.remove('mine'));
      delete game.votes[me.id];
      updateVoteCounts();
    };
  } else {
    $('#btnSkipVote').disabled = true;
  }

  // Bots vote during the timer
  scheduleBotVotes(20);

  await runTimer(20, () => false);
  resolveVote();
}

function scheduleBotVotes(seconds) {
  const aliveBots = room.players.filter(p => p.alive && p.isBot);
  aliveBots.forEach(bot => {
    const t = setTimeout(() => {
      // Bot heuristic: mafia bots vote against a town player; town bots vote against random non-self
      const candidates = room.players.filter(p => p.alive && p.id !== bot.id);
      let target;
      if (bot.role === 'mafia') {
        const town = candidates.filter(p => p.role !== 'mafia');
        target = town.length ? pick(town) : pick(candidates);
      } else {
        // Town bots have a small chance to be right
        if (Math.random() < 0.35) {
          const mafia = candidates.filter(p => p.role === 'mafia');
          target = mafia.length ? pick(mafia) : pick(candidates);
        } else {
          target = pick(candidates);
        }
      }
      // 15% chance to skip
      if (Math.random() < 0.15) {
        delete game.votes[bot.id];
      } else {
        game.votes[bot.id] = target.id;
      }
      updateVoteCounts();
    }, 1500 + rand(seconds * 1000 - 2000));
    timers.push(t);
  });
}

function updateVoteCounts() {
  const counts = {};
  Object.values(game.votes).forEach(pid => { counts[pid] = (counts[pid] || 0) + 1; });
  $$('.vc-count').forEach(el => {
    const pid = el.dataset.c;
    el.textContent = counts[pid] || 0;
    el.classList.toggle('has', !!counts[pid]);
  });
}

function resolveVote() {
  // tally
  const counts = {};
  Object.values(game.votes).forEach(pid => { counts[pid] = (counts[pid] || 0) + 1; });
  let max = 0, lead = null, tie = false;
  for (const pid in counts) {
    if (counts[pid] > max) { max = counts[pid]; lead = pid; tie = false; }
    else if (counts[pid] === max) tie = true;
  }
  let eliminated = null;
  if (lead && !tie) {
    eliminated = room.players.find(p => p.id === lead);
    if (eliminated) eliminated.alive = false;
  }

  enterResult(eliminated, tie);
}

/* ----------- RESULT (after vote) ----------- */
async function enterResult(eliminated, tie) {
  setMusicMode('climax');
  setPhase('result', t('phase.result'));
  const stage = $('#gameStage');
  stage.className = 'game-stage stage-result';

  if (!eliminated) {
    stage.innerHTML = `
      <div class="stage-card">
        <h2 class="stage-title">${tie ? t('result.tie') : t('result.noVote')}</h2>
        <p class="stage-sub big">${t('result.noOne')}</p>
      </div>
    `;
    pushSystem(tie ? t('result.tieSys') : t('result.noVoteSys'));
  } else {
    SFX.elimination();
    const rname = roleName(eliminated.role);
    stage.innerHTML = `
      <div class="stage-card result-card">
        <div class="result-portrait"><div class="rp ${eliminated.avatar}"></div><div class="rp-fade"></div></div>
        <div class="result-name">${escapeHtml(eliminated.name)}</div>
        <div class="result-sub">${t('result.eliminated')}</div>
        <div class="stamp">
          <span class="stamp-was">${t('result.was')}</span>
          <span class="stamp-mafia">${rname}</span>
        </div>
      </div>
    `;
    pushSystem(t('result.votedSys', { n: eliminated.name, r: rname }));

    // Jester win condition
    if (eliminated.role === 'jester') {
      await wait(3500);
      gameOver('jester', eliminated);
      return;
    }
  }

  await wait(4500);

  if (checkGameOver()) return;
  game.day += 1;
  enterNight();
}

/* ============================================================
   GAME OVER
   ============================================================ */
function checkGameOver() {
  const alive = room.players.filter(p => p.alive);
  const mafia = alive.filter(p => p.role === 'mafia');
  const maniac = alive.filter(p => p.role === 'maniac');
  const town = alive.filter(p => p.role !== 'mafia' && p.role !== 'maniac' && p.role !== 'jester');

  if (mafia.length === 0 && maniac.length === 0) {
    gameOver('town');
    return true;
  }
  if (maniac.length >= 1 && alive.length === 1) {
    gameOver('maniac', maniac[0]);
    return true;
  }
  if (mafia.length >= town.length + maniac.length && maniac.length === 0) {
    gameOver('mafia');
    return true;
  }
  return false;
}

function gameOver(winner, who) {
  setMusicMode('climax');
  clearTimers();
  // Visual sync: defeat desaturate
  setTimeout(() => {
    const me = room.players.find(p => p.id === 'me');
    const meWon =
      (winner === 'town' && (me.role === 'doctor' || me.role === 'sheriff' || me.role === 'civilian')) ||
      (winner === 'mafia' && me.role === 'mafia') ||
      (winner === 'maniac' && me.role === 'maniac' && who && who.id === me.id) ||
      (winner === 'jester' && me.role === 'jester' && who && who.id === me.id);
    if (meWon) {
      SFX.victory();
      launchGoldParticles();
    } else {
      SFX.defeat();
      document.body.classList.add('desaturated');
      setTimeout(() => document.body.classList.remove('desaturated'), 4500);
    }
  }, 200);
  const me = room.players.find(p => p.id === 'me');
  const meWon =
    (winner === 'town' && (me.role === 'doctor' || me.role === 'sheriff' || me.role === 'civilian')) ||
    (winner === 'mafia' && me.role === 'mafia') ||
    (winner === 'maniac' && me.role === 'maniac' && who && who.id === me.id) ||
    (winner === 'jester' && me.role === 'jester' && who && who.id === me.id);

  $('#overEyebrow').textContent = meWon ? t('over.victory') : t('over.defeat');
  $('#overEyebrow').className = 'over-eyebrow ' + (meWon ? 'win' : 'lose');

  const titleKey = { town: 'over.townWin', mafia: 'over.mafiaWin', maniac: 'over.maniacWin', jester: 'over.jesterWin' }[winner];
  $('#overTitle').textContent = t(titleKey);
  if (winner === 'jester') {
    $('#overSub').textContent = t('over.jesterSub', { n: who?.name || t('role.jester') });
  } else {
    const subKey = { town: 'over.townSub', mafia: 'over.mafiaSub', maniac: 'over.maniacSub' }[winner];
    $('#overSub').textContent = t(subKey);
  }

  const xpGain = meWon ? 120 : 40;
  const coinGain = meWon ? 250 : 60;
  $('#rewardXp').textContent = '+' + xpGain;
  $('#rewardCoins').textContent = '+' + coinGain;

  // Apply rewards
  user.games += 1;
  if (meWon) user.wins += 1;
  user.xp += xpGain;
  user.gold += coinGain;
  while (user.xp >= user.xpNeeded) {
    user.xp -= user.xpNeeded;
    user.level += 1;
    user.xpNeeded = Math.round(user.xpNeeded * 1.25);
  }
  saveUser();

  $('#modalOver').hidden = false;
  $('#btnOverMenu').onclick = () => {
    $('#modalOver').hidden = true;
    room = null; game = null;
    showView('menu');
  };
  $('#btnOverAgain').onclick = () => {
    $('#modalOver').hidden = true;
    // Reset same room with same players, reset alive, new roles
    room.players.forEach(p => { p.alive = true; p.role = null; p.ready = true; });
    startGame();
  };
}

/* ============================================================
   CHAT
   ============================================================ */
function pushSystem(html) {
  game.chat.push({ system: true, html });
  renderChat();
}
// Like pushSystem but stores i18n key+vars so messages re-translate on language change
function pushSystemKey(key, vars) {
  game.chat.push({ system: true, i18nKey: key, vars: vars || null });
  renderChat();
}
function pushChat(player, text) {
  const me = room.players.find(p => p.id === 'me');
  // During night, only fellow mafia chat is visible to mafia
  if (game.phase === 'night') {
    if (player.role === 'mafia' && me.role !== 'mafia') return;
  }
  game.chat.push({ player, text });
  renderChat();
}
// Bot chat that can be re-translated on language change
function pushChatKey(player, key, vars) {
  const me = room.players.find(p => p.id === 'me');
  if (game.phase === 'night') {
    if (player.role === 'mafia' && me.role !== 'mafia') return;
  }
  game.chat.push({ player, i18nKey: key, vars: vars || null });
  renderChat();
}
function renderChat() {
  const c = $('#chat');
  c.innerHTML = game.chat.map(entry => {
    if (entry.system) {
      const html = entry.i18nKey ? t(entry.i18nKey, entry.vars || {}) : entry.html;
      return `<div class="chat-sys">${html}</div>`;
    }
    // Player chat: bot lines are stored as i18nKey for re-translation; user typed text is raw
    const text = entry.i18nKey ? t(entry.i18nKey, entry.vars || {}) : entry.text;
    return `
      <div class="chat-msg">
        <div class="avatar avatar-xs ${entry.player.avatar}"></div>
        <div>
          <div class="cm-name">${escapeHtml(entry.player.name)}</div>
          <div class="cm-text">${escapeHtml(text)}</div>
        </div>
      </div>
    `;
  }).join('');
  c.scrollTop = c.scrollHeight;
}

function setupChatForm() {
  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#chatInput').value.trim();
    if (!v || !game) return;
    const me = room.players.find(p => p.id === 'me');
    if (!me.alive) { showToast(t('game.dead')); return; }
    if (game.phase === 'night' && me.role !== 'mafia') {
      showToast(t('game.cantSpeak')); return;
    }
    pushChat(me, v);
    $('#chatInput').value = '';
  });
}

/* ============================================================
   TIMER
   ============================================================ */
function runTimer(seconds, earlyEndCheck) {
  return new Promise((resolve) => {
    let remaining = seconds;
    let riserStarted = false;
    $('#gameTimer').textContent = fmtTime(remaining);
    $('#gameTimer').classList.toggle('low', remaining <= 5);
    const iv = setInterval(() => {
      remaining -= 1;
      $('#gameTimer').textContent = fmtTime(Math.max(0, remaining));
      $('#gameTimer').classList.toggle('low', remaining <= 5);
      // Last 10s riser
      if (!riserStarted && remaining === 10) {
        riserStarted = true;
        startRiser(10);
      }
      // Tick last 5s
      if (remaining > 0 && remaining <= 5) {
        SFX.tick();
      }
      if (remaining <= 0 || (earlyEndCheck && earlyEndCheck())) {
        clearInterval(iv);
        stopRiser();
        resolve();
      }
    }, 1000);
    timers.push(iv);
  });
}

/* ============================================================
   SHOP — catalog + tabs + buy
   ============================================================ */
const SHOP_OWNED_KEY = 'mafia_owned_v1';

const SHOP_CATALOG = [
  // category, id, nameKey, rarity, art, currency, price
  { cat: 'frames', id: 'gold_frame',   nameKey: 'item.gold',    rar: 'legendary', art: 'sc-gold-frame',  ccy: 'gold',   price: 1500, featured: true },
  { cat: 'frames', id: 'neon_frame',   nameKey: 'item.neon',    rar: 'rare',      art: 'sc-neon-frame',  ccy: 'gems',   price: 500,  featured: true },
  { cat: 'frames', id: 'silver_frame', nameKey: 'item.silver',  rar: 'rare',      art: 'sc-silver-frame',ccy: 'gold',   price: 800 },
  { cat: 'frames', id: 'blood_frame',  nameKey: 'item.blood',   rar: 'epic',      art: 'sc-blood-frame', ccy: 'gold',   price: 1200 },

  { cat: 'skins',  id: 'shadow_skin',  nameKey: 'item.shadow',  rar: 'epic',      art: 'sc-shadow-skin', ccy: 'gold',   price: 1200, featured: true },
  { cat: 'skins',  id: 'crimson_skin', nameKey: 'item.crimson', rar: 'epic',      art: 'sc-crimson-skin',ccy: 'gold',   price: 1400 },
  { cat: 'skins',  id: 'phantom_skin', nameKey: 'item.phantom', rar: 'legendary', art: 'sc-phantom-skin',ccy: 'gems',   price: 1200 },
  { cat: 'skins',  id: 'noir_skin',    nameKey: 'item.noir',    rar: 'rare',      art: 'sc-noir-skin',   ccy: 'gold',   price: 600 },

  { cat: 'items',  id: 'devil_mask',   nameKey: 'item.devil',   rar: 'epic',      art: 'sc-devil',       ccy: 'gems',   price: 800, featured: true },
  { cat: 'items',  id: 'angel_mask',   nameKey: 'item.angel',   rar: 'epic',      art: 'sc-angel',       ccy: 'gems',   price: 800 },
  { cat: 'items',  id: 'skull_mask',   nameKey: 'item.skull',   rar: 'legendary', art: 'sc-skull',       ccy: 'gems',   price: 1500 },

  { cat: 'voice',  id: 'voice_low',    nameKey: 'item.voiceLow',rar: 'rare',      art: 'sc-voice',       ccy: 'gold',   price: 500 },
  { cat: 'voice',  id: 'voice_high',   nameKey: 'item.voiceHigh',rar: 'rare',     art: 'sc-voice',       ccy: 'gold',   price: 500 },
  { cat: 'voice',  id: 'voice_robot',  nameKey: 'item.voiceRobot',rar: 'epic',    art: 'sc-voice',       ccy: 'gems',   price: 700 },
];

let activeShopCat = 'featured';

function loadOwned() {
  try { return JSON.parse(localStorage.getItem(SHOP_OWNED_KEY) || '[]'); } catch { return []; }
}
function saveOwned(arr) { localStorage.setItem(SHOP_OWNED_KEY, JSON.stringify(arr)); }
function isOwned(id) { return loadOwned().includes(id); }

function refreshShop() {
  const grid = $('#shopGrid');
  if (!grid) return;
  const owned = loadOwned();
  const items = activeShopCat === 'featured'
    ? SHOP_CATALOG.filter((i) => i.featured)
    : SHOP_CATALOG.filter((i) => i.cat === activeShopCat);

  if (!items.length) {
    grid.innerHTML = `<div class="sc-empty">—</div>`;
    return;
  }

  grid.innerHTML = items.map((i) => {
    const has = owned.includes(i.id);
    const ccyClass = i.ccy === 'gold' ? 'gold' : 'violet';
    const itemName = t(i.nameKey);
    const rarKey = `rar.${i.rar}`;
    return `
      <div class="shop-card" data-id="${i.id}">
        <div class="sc-art ${i.art}"></div>
        <div class="sc-info">
          <div class="sc-name">${itemName}</div>
          <div class="rar ${i.rar}">${t(rarKey)}</div>
          <div class="sc-price"><span class="ic-dot ${ccyClass}"></span> ${i.price.toLocaleString()}</div>
          <button class="sc-buy ${has ? 'owned' : ''}" data-buy="${i.id}" ${has ? 'disabled' : ''}>
            ${has ? t('shop.owned') : t('shop.buy')}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function setupShop() {
  // Tab clicks
  $$('#shopTabs .stab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('#shopTabs .stab').forEach((x) => x.classList.remove('active'));
      tab.classList.add('active');
      activeShopCat = tab.dataset.cat;
      refreshShop();
    });
  });

  // Buy delegation
  const grid = $('#shopGrid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-buy]');
    if (!btn) return;
    const id = btn.dataset.buy;
    const item = SHOP_CATALOG.find((i) => i.id === id);
    if (!item) return;
    if (isOwned(id)) return;

    const cost = item.price;
    const have = item.ccy === 'gold' ? user.gold : user.gems;
    if (have < cost) {
      showToast(t('shop.notEnough'));
      SFX.defeat();
      return;
    }
    if (item.ccy === 'gold') user.gold -= cost;
    else user.gems -= cost;

    const owned = loadOwned();
    owned.push(id);
    saveOwned(owned);
    saveUser();
    refreshMenu();
    refreshShop();
    SFX.notify();
    showToast(t('shop.bought'));
  });
}

/* ============================================================
   PROFILE / LEADERBOARD
   ============================================================ */
function refreshProfile() {
  $('#profName').textContent = user.name;
  $('#profLvl').textContent = 'Lv.' + user.level;
  $('#pStatGames').textContent = user.games;
  $('#pStatWins').textContent = user.wins;
  $('#pStatRate').textContent = (user.games ? Math.round(user.wins / user.games * 100) : 0) + '%';
  const pct = Math.round(user.xp / user.xpNeeded * 100);
  $('#profXp').style.width = pct + '%';
  $('#profXpText').textContent = `${user.xp} / ${user.xpNeeded}`;
}
function refreshLeaderboard() {
  const list = $('#lbList');
  // Synthetic leaderboard with the user mixed in
  const entries = BOT_NAMES.slice(0, 9).map((n) => ({
    name: n, avatar: pick(AVATARS), pts: 1500 + rand(1500),
  }));
  entries.push({ name: user.name + ' ' + t('lb.you'), avatar: user.avatar || 'a-don', pts: 800 + user.wins * 80, me: true });
  entries.sort((a, b) => b.pts - a.pts);
  list.innerHTML = entries.map((e, i) => `
    <div class="lb-row ${i === 0 ? 'top1' : ''} ${e.me ? 'me' : ''}">
      <span class="lb-rank">${i === 0 ? '♛' : (i + 1)}</span>
      <div class="avatar avatar-xs ${e.avatar}"></div>
      <span class="lb-name">${escapeHtml(e.name)}</span>
      <span class="lb-pts">${e.pts.toLocaleString()}</span>
    </div>
  `).join('');
}

/* ============================================================
   QUICK PLAY
   ============================================================ */
function quickPlay() {
  // Make a public room and auto-fill bots quickly
  room = makeRoom({ vis: 'public', mode: 'classic', max: 8, time: 60, host: 'me' });
  room.players[0].ready = true;
  for (let k = 0; k < room.max - 1; k++) {
    const b = makeBotPlayer();
    b.ready = true;
    room.players.push(b);
  }
  enterLobby();
  // Auto-start after a brief moment
  setTimeout(() => {
    if (room && room.players.length === room.max && room.players.every(p => p.ready)) {
      startGame();
    }
  }, 1800);
}

/* ============================================================
   AUDIO ENGINE — professional adaptive sound system
   Buses: master → { music, ambient, sfx }
   Music: crossfaded mode switching, 4 contextual presets
   SFX: synthesized one-shots (no external assets)
   Riser: last-10s intensification overlay
   Settings: persistent volumes per bus
   ============================================================ */
const AUDIO_KEY = 'mafia_audio_v2';

const AudioEngine = {
  ctx: null,
  buses: { master: null, music: null, ambient: null, sfx: null },
  settings: {
    masterEnabled: true,
    musicEnabled: true,
    sfxEnabled: true,
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.85,
  },

  // Currently-playing music drone group (allows two for crossfade)
  activeMusic: null,
  fadingMusic: null,
  currentMode: null,
  riserNodes: null,

  // Loop timers per mode
  heartTimer: null,
  creakTimer: null,
  whisperTimer: null,
  pulseTimer: null,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    this.buses.master = this.ctx.createGain();
    const shelf = this.ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 5200;
    shelf.gain.value = -5;
    this.buses.master.connect(shelf);
    shelf.connect(this.ctx.destination);

    this.buses.music   = this.ctx.createGain();
    this.buses.ambient = this.ctx.createGain();
    this.buses.sfx     = this.ctx.createGain();
    this.buses.music.connect(this.buses.master);
    this.buses.ambient.connect(this.buses.master);
    this.buses.sfx.connect(this.buses.master);

    this.applyVolumes();
  },

  loadSettings() {
    try {
      const raw = localStorage.getItem(AUDIO_KEY);
      if (raw) Object.assign(this.settings, JSON.parse(raw));
    } catch {}
  },
  saveSettings() {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(this.settings));
  },

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings;
    const master = s.masterEnabled ? s.masterVolume : 0;
    const music = s.musicEnabled ? s.musicVolume : 0;
    const sfx = s.sfxEnabled ? s.sfxVolume : 0;
    const t = this.ctx.currentTime;
    this.buses.master.gain.cancelScheduledValues(t);
    this.buses.master.gain.linearRampToValueAtTime(master, t + 0.25);
    this.buses.music.gain.linearRampToValueAtTime(music, t + 0.25);
    this.buses.ambient.gain.linearRampToValueAtTime(master, t + 0.25);
    this.buses.sfx.gain.linearRampToValueAtTime(sfx, t + 0.25);
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
};

// Backwards-compat aliases (old code uses these)
const MUSIC_KEY = AUDIO_KEY;
let audioCtx = null;        // legacy
let masterGain = null;       // legacy
let musicEnabled = false;    // legacy mirror

function ensureAudio() {
  AudioEngine.init();
  audioCtx = AudioEngine.ctx;
  masterGain = AudioEngine.buses.music; // legacy code routes here
}

function makeNoiseBuffer(seconds) {
  const sr = AudioEngine.ctx.sampleRate;
  const buf = AudioEngine.ctx.createBuffer(1, sr * seconds, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function startMusic(mode) {
  mode = mode || currentMode || 'calm';
  ensureAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  stopMusic(); // safety
  const now = audioCtx.currentTime;

  // Mode presets
  const PRESET = {
    calm: {
      master: 0.22,
      freqs: [
        { f: 65.4, type: 'sine',     gain: 0.45, filter: 220 },
        { f: 98.0, type: 'sine',     gain: 0.28, filter: 280 },
        { f: 130.8, type: 'triangle', gain: 0.18, filter: 360 },
      ],
      lfoSpeed: 0.05,
      lfoDepth: 60,
      windGain: 0.04,
      heartbeat: false,
      creaks: false,
      whispers: false,
      pulse: false,
    },
    mystery: {
      master: 0.36,
      freqs: [
        { f: 55,   type: 'sine',     gain: 0.6,  filter: 160 },
        { f: 65.4, type: 'sawtooth', gain: 0.18, filter: 240 },
        { f: 82.4, type: 'sawtooth', gain: 0.14, filter: 280 },
        { f: 110,  type: 'triangle', gain: 0.10, filter: 340 },
      ],
      lfoSpeed: 0.06,
      lfoDepth: 80,
      windGain: 0.08,
      heartbeat: { bpmMin: 50, bpmMax: 60 },
      creaks: true,
      whispers: true,
      pulse: false,
    },
    tense: {
      master: 0.42,
      freqs: [
        { f: 49,   type: 'sawtooth', gain: 0.55, filter: 220 }, // G1 — sub
        { f: 73.4, type: 'sawtooth', gain: 0.22, filter: 320 }, // D2
        { f: 87.3, type: 'square',   gain: 0.12, filter: 400 }, // F2 — dissonant
      ],
      lfoSpeed: 0.18,
      lfoDepth: 140,
      windGain: 0.12,
      heartbeat: { bpmMin: 95, bpmMax: 115 },
      creaks: true,
      whispers: false,
      pulse: { bpm: 110 },
    },
    climax: {
      master: 0.45,
      freqs: [
        { f: 41,   type: 'sawtooth', gain: 0.7,  filter: 200 }, // E1 deep
        { f: 61.7, type: 'sawtooth', gain: 0.3,  filter: 320 }, // B1
        { f: 82.4, type: 'square',   gain: 0.18, filter: 420 }, // E2
        { f: 165,  type: 'sawtooth', gain: 0.08, filter: 600 }, // E3 brass
      ],
      lfoSpeed: 0.25,
      lfoDepth: 200,
      windGain: 0.18,
      heartbeat: { bpmMin: 110, bpmMax: 130 },
      creaks: true,
      whispers: true,
      pulse: { bpm: 130 },
    },
  };
  const cfg = PRESET[mode] || PRESET.calm;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.linearRampToValueAtTime(cfg.master, now + 1.5);

  // ---- Drone layers ----
  cfg.freqs.forEach((f) => {
    [-7, 0, 7].forEach((detune) => {
      const osc = audioCtx.createOscillator();
      osc.type = f.type;
      osc.frequency.value = f.f;
      osc.detune.value = detune;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = f.filter;
      filter.Q.value = 1.4;
      const g = audioCtx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(f.gain / 3, now + 2.5);
      osc.connect(filter); filter.connect(g); g.connect(masterGain);
      osc.start(now);
      droneNodes.push({ osc, filter, g });
    });
  });

  // ---- LFO sweeping filter ----
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = cfg.lfoSpeed;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = cfg.lfoDepth;
  lfo.connect(lfoGain);
  droneNodes.forEach(d => { if (d.filter) lfoGain.connect(d.filter.frequency); });
  lfo.start(now);
  droneNodes.push({ osc: lfo });

  // ---- Wind ----
  if (cfg.windGain > 0) {
    const noise = audioCtx.createBufferSource();
    noise.buffer = makeNoiseBuffer(4);
    noise.loop = true;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 380;
    noiseFilter.Q.value = 0.8;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0;
    noiseGain.gain.linearRampToValueAtTime(cfg.windGain, now + 4);
    const windLfo = audioCtx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.13;
    const windLfoGain = audioCtx.createGain();
    windLfoGain.gain.value = 220;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(noiseFilter.frequency);
    windLfo.start(now);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(masterGain);
    noise.start(now);
    noiseNode = { noise, filter: noiseFilter, gain: noiseGain, lfo: windLfo };
    droneNodes.push({ osc: windLfo });
  }

  // ---- Conditional layers ----
  if (cfg.heartbeat) scheduleHeartbeat(cfg.heartbeat);
  if (cfg.creaks) scheduleCreak();
  if (cfg.whispers) scheduleWhisper();
  if (cfg.pulse) schedulePulse(cfg.pulse);
}

let pulseTimer = null;
let droneNodes = [];
let noiseNode = null;
let heartTimer = null;
let creakTimer = null;
let whisperTimer = null;
function schedulePulse(opts) {
  if (!musicEnabled || !audioCtx) return;
  const beatMs = 60000 / (opts.bpm || 110);
  pulseTimer = setInterval(() => {
    if (!musicEnabled || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 41;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    osc.connect(filter); filter.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + 0.15);
  }, beatMs);
  timers.push(pulseTimer);
}

function scheduleHeartbeat(opts) {
  if (!musicEnabled || !audioCtx) return;
  const lo = opts?.bpmMin ?? 50;
  const hi = opts?.bpmMax ?? 64;
  const bpm = lo + Math.random() * (hi - lo);
  const beatMs = 60000 / bpm;
  heartTimer = setTimeout(() => {
    if (!musicEnabled || !audioCtx) return;
    playThump(0);
    setTimeout(() => playThump(1), Math.max(160, 360 - bpm * 2));
    scheduleHeartbeat(opts);
  }, beatMs);
  timers.push(heartTimer);
}

function playThump(idx) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(70, t0);
  osc.frequency.exponentialRampToValueAtTime(35, t0 + 0.25);
  const g = audioCtx.createGain();
  const peak = idx === 0 ? 0.45 : 0.28;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
  osc.connect(g); g.connect(masterGain);
  osc.start(t0); osc.stop(t0 + 0.4);
}

function scheduleCreak() {
  if (!musicEnabled || !audioCtx) return;
  const delay = 4000 + Math.random() * 8000;
  creakTimer = setTimeout(() => {
    if (!musicEnabled || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = Math.random() < 0.5 ? 'sawtooth' : 'triangle';
    const baseHz = 140 + Math.random() * 320;
    osc.frequency.setValueAtTime(baseHz, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, baseHz * 0.35), t0 + 2.8);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + 0.7);
    g.gain.linearRampToValueAtTime(0, t0 + 3.2);
    osc.connect(filter); filter.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + 3.5);
    scheduleCreak();
  }, delay);
  timers.push(creakTimer);
}

function scheduleWhisper() {
  if (!musicEnabled || !audioCtx) return;
  const delay = 9000 + Math.random() * 14000;
  whisperTimer = setTimeout(() => {
    if (!musicEnabled || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    // Three brief high notes — eerie minor cluster
    [880, 932, 988].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = audioCtx.createGain();
      const start = t0 + i * 0.15;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.05, start + 0.4);
      g.gain.linearRampToValueAtTime(0, start + 1.6);
      osc.connect(g); g.connect(masterGain);
      osc.start(start); osc.stop(start + 1.7);
    });
    scheduleWhisper();
  }, delay);
  timers.push(whisperTimer);
}

function stopMusic() {
  droneNodes.forEach(d => { try { d.osc.stop(); } catch {} });
  droneNodes = [];
  if (noiseNode) {
    try { noiseNode.noise.stop(); } catch {}
    noiseNode = null;
  }
  if (heartTimer) { clearTimeout(heartTimer); heartTimer = null; }
  if (creakTimer) { clearTimeout(creakTimer); creakTimer = null; }
  if (whisperTimer) { clearTimeout(whisperTimer); whisperTimer = null; }
  if (pulseTimer) { clearInterval(pulseTimer); pulseTimer = null; }
}

function setMusic(on) {
  musicEnabled = !!on;
  AudioEngine.settings.musicEnabled = musicEnabled;
  AudioEngine.saveSettings();
  if (musicEnabled) {
    AudioEngine.applyVolumes();
    startMusic(currentMode);
  } else {
    stopMusic();
  }
  $$('.music-btn').forEach(b => {
    b.classList.toggle('on', musicEnabled);
    b.setAttribute('aria-pressed', musicEnabled ? 'true' : 'false');
  });
}

/* ============================================================
   MUSIC MODES — contextual tracks
   calm    : main menu / lobby / shop / profile  (low ambient pad)
   mystery : night phase                          (deep drone + heart + creaks)
   tense   : voting + dawn body reveal            (driving pulse + dissonance)
   climax  : result reveal + game over            (swell + brass stab)
   ============================================================ */
let currentMode = 'calm';

function setMusicMode(mode) {
  if (mode === currentMode && musicEnabled) return;
  currentMode = mode;
  if (musicEnabled) {
    // Smooth crossfade: fade out current music bus, swap, fade in
    const ae = AudioEngine;
    if (!ae.ctx) { startMusic(mode); return; }
    const now = ae.ctx.currentTime;
    const targetVol = ae.settings.musicEnabled ? ae.settings.musicVolume : 0;
    ae.buses.music.gain.cancelScheduledValues(now);
    ae.buses.music.gain.linearRampToValueAtTime(0, now + 0.8);
    setTimeout(() => {
      stopMusic();
      startMusic(mode);
      const t2 = ae.ctx.currentTime;
      ae.buses.music.gain.cancelScheduledValues(t2);
      ae.buses.music.gain.setValueAtTime(0, t2);
      ae.buses.music.gain.linearRampToValueAtTime(targetVol, t2 + 1.2);
    }, 900);
  }
}

function setupMusic() {
  AudioEngine.loadSettings();
  musicEnabled = AudioEngine.settings.musicEnabled;

  $$('.music-btn').forEach(b => {
    b.classList.toggle('on', musicEnabled);
    b.setAttribute('aria-pressed', musicEnabled ? 'true' : 'false');
    b.addEventListener('click', () => setMusic(!musicEnabled));
  });

  if (musicEnabled) {
    const onFirstClick = () => {
      AudioEngine.init();
      AudioEngine.resume();
      if (!AudioEngine.activeMusic) startMusic(currentMode);
      window.removeEventListener('click', onFirstClick, true);
      window.removeEventListener('keydown', onFirstClick, true);
      window.removeEventListener('touchstart', onFirstClick, true);
    };
    window.addEventListener('click', onFirstClick, true);
    window.addEventListener('keydown', onFirstClick, true);
    window.addEventListener('touchstart', onFirstClick, true);
  }
}

/* ============================================================
   SFX LIBRARY — synthesized one-shots (no external assets)
   All SFX route through AudioEngine.buses.sfx
   ============================================================ */
const SFX = {
  _envelope(osc, gain, t0, dur, peak) {
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },

  click() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    const osc = ae.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, t0);
    osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.04);
    const g = ae.ctx.createGain();
    osc.connect(g); g.connect(ae.buses.sfx);
    this._envelope(osc, g, t0, 0.06, 0.18);
  },

  hover() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    const osc = ae.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2200;
    const g = ae.ctx.createGain();
    osc.connect(g); g.connect(ae.buses.sfx);
    this._envelope(osc, g, t0, 0.05, 0.05);
  },

  tick() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    const osc = ae.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 1200;
    const g = ae.ctx.createGain();
    osc.connect(g); g.connect(ae.buses.sfx);
    this._envelope(osc, g, t0, 0.05, 0.12);
  },

  voteConfirm() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    // Two-note "dunk"
    [{f: 392, d: 0.0}, {f: 587, d: 0.08}].forEach(({f, d}) => {
      const osc = ae.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = ae.ctx.createGain();
      osc.connect(g); g.connect(ae.buses.sfx);
      this._envelope(osc, g, t0 + d, 0.18, 0.22);
    });
  },

  cardSelect() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    const osc = ae.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t0);
    osc.frequency.linearRampToValueAtTime(660, t0 + 0.08);
    const g = ae.ctx.createGain();
    osc.connect(g); g.connect(ae.buses.sfx);
    this._envelope(osc, g, t0, 0.12, 0.16);
  },

  roleReveal(role) {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    // Dramatic stinger: low boom + rising tone
    const boom = ae.ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, t0);
    boom.frequency.exponentialRampToValueAtTime(35, t0 + 1.2);
    const bg = ae.ctx.createGain();
    boom.connect(bg); bg.connect(ae.buses.sfx);
    bg.gain.setValueAtTime(0, t0);
    bg.gain.linearRampToValueAtTime(0.5, t0 + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.001, t0 + 1.3);
    boom.start(t0); boom.stop(t0 + 1.4);

    // Color: mafia=red discord, town=resolved minor, jester=playful, maniac=horror
    const isEvil = role === 'mafia' || role === 'maniac';
    const tones = isEvil ? [277, 311, 415] : [261, 329, 392]; // C#m vs C
    tones.forEach((f, i) => {
      const osc = ae.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const filter = ae.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      const g = ae.ctx.createGain();
      osc.connect(filter); filter.connect(g); g.connect(ae.buses.sfx);
      const start = t0 + 0.3 + i * 0.05;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.18, start + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, start + 1.6);
      osc.start(start); osc.stop(start + 1.7);
    });
  },

  elimination() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    // Heavy bass thud + metallic crack
    const thud = ae.ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, t0);
    thud.frequency.exponentialRampToValueAtTime(40, t0 + 0.4);
    const tg = ae.ctx.createGain();
    thud.connect(tg); tg.connect(ae.buses.sfx);
    tg.gain.setValueAtTime(0, t0);
    tg.gain.linearRampToValueAtTime(0.55, t0 + 0.01);
    tg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
    thud.start(t0); thud.stop(t0 + 0.7);

    // Metallic shimmer
    const noise = ae.ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(0.4);
    const filter = ae.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 4;
    const ng = ae.ctx.createGain();
    noise.connect(filter); filter.connect(ng); ng.connect(ae.buses.sfx);
    ng.gain.setValueAtTime(0.4, t0);
    ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    noise.start(t0); noise.stop(t0 + 0.35);
  },

  victory() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    // Heroic major chord arpeggio
    [261, 329, 392, 523].forEach((f, i) => {
      const osc = ae.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = ae.ctx.createGain();
      osc.connect(g); g.connect(ae.buses.sfx);
      const start = t0 + i * 0.08;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.25, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
      osc.start(start); osc.stop(start + 1.3);
    });
  },

  defeat() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    // Descending minor — gloom
    [392, 311, 233].forEach((f, i) => {
      const osc = ae.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ae.ctx.createGain();
      osc.connect(g); g.connect(ae.buses.sfx);
      const start = t0 + i * 0.18;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.2, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
      osc.start(start); osc.stop(start + 1.5);
    });
  },

  notify() {
    const ae = AudioEngine; if (!ae.ctx || !ae.settings.sfxEnabled) return;
    const t0 = ae.ctx.currentTime;
    [880, 1318].forEach((f, i) => {
      const osc = ae.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ae.ctx.createGain();
      osc.connect(g); g.connect(ae.buses.sfx);
      const start = t0 + i * 0.08;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.12, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start); osc.stop(start + 0.35);
    });
  },
};

/* ============================================================
   COUNTDOWN RISER — gradually rising whoosh for last seconds
   ============================================================ */
let riserNode = null;
function startRiser(durationSec) {
  const ae = AudioEngine;
  if (!ae.ctx || !ae.settings.musicEnabled) return;
  stopRiser();
  const t0 = ae.ctx.currentTime;
  const osc = ae.ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, t0);
  osc.frequency.exponentialRampToValueAtTime(900, t0 + durationSec);

  const filter = ae.ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, t0);
  filter.frequency.exponentialRampToValueAtTime(2500, t0 + durationSec);
  filter.Q.value = 2.5;

  const g = ae.ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.18, t0 + durationSec * 0.7);
  g.gain.linearRampToValueAtTime(0.3, t0 + durationSec);

  osc.connect(filter); filter.connect(g); g.connect(ae.buses.music);
  osc.start(t0);
  osc.stop(t0 + durationSec + 0.1);
  riserNode = { osc, g };
}
function stopRiser() {
  if (riserNode) {
    try { riserNode.osc.stop(); } catch {}
    riserNode = null;
  }
}

/* ============================================================
   VICTORY PARTICLES — gold confetti
   ============================================================ */
function launchGoldParticles() {
  const layer = document.createElement('div');
  layer.className = 'particle-layer';
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('span');
    p.className = 'gold-particle';
    p.style.left = (50 + (Math.random() - 0.5) * 20) + '%';
    p.style.setProperty('--tx', ((Math.random() - 0.5) * 700) + 'px');
    p.style.setProperty('--ty', (200 + Math.random() * 400) + 'px');
    p.style.setProperty('--rot', (Math.random() * 720) + 'deg');
    p.style.setProperty('--dur', (1.6 + Math.random() * 1.2) + 's');
    p.style.background = Math.random() < 0.5 ? '#fde08a' : '#d4a017';
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3500);
}

/* ============================================================
   GLOBAL SFX DELEGATION — buttons, hover
   ============================================================ */
function setupSfxDelegation() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .lang-pill, .tile, .hex-btn, .side-nav a, .topnav a, .vote-cell, .choice, .public-row');
    if (!btn) return;
    if (btn.classList.contains('music-btn')) return; // its own toggle sound handled internally
    if (btn.disabled) return;
    SFX.click();
  }, true);

  // Hover sound on key interactive surfaces (throttled)
  let lastHover = 0;
  document.addEventListener('mouseenter', (e) => {
    const t = e.target;
    if (!t || !t.matches) return;
    if (!t.matches('.hex-btn, .side-nav a, .tile, .pl, .lb-row, .vote-cell, .choice')) return;
    const now = performance.now();
    if (now - lastHover < 80) return;
    lastHover = now;
    SFX.hover();
  }, true);
}

/* ============================================================
   SETTINGS MODAL — volume sliders
   ============================================================ */
function setupSettingsModal() {
  const btn = $('#btnSettings');
  if (!btn) return;
  btn.addEventListener('click', openSettings);
}

function openSettings() {
  const s = AudioEngine.settings;
  let modal = $('#modalSettings');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalSettings';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-bg" data-close></div>
      <div class="modal-card settings-modal">
        <h3 class="settings-title">${t('settings.title')}</h3>
        <div class="settings-section">
          <div class="settings-row">
            <label>${t('settings.master')}</label>
            <div class="row-controls">
              <input type="range" id="volMaster" min="0" max="100" />
              <button class="mute-toggle" data-bus="master"></button>
            </div>
          </div>
          <div class="settings-row">
            <label>${t('settings.music')}</label>
            <div class="row-controls">
              <input type="range" id="volMusic" min="0" max="100" />
              <button class="mute-toggle" data-bus="music"></button>
            </div>
          </div>
          <div class="settings-row">
            <label>${t('settings.sfx')}</label>
            <div class="row-controls">
              <input type="range" id="volSfx" min="0" max="100" />
              <button class="mute-toggle" data-bus="sfx"></button>
            </div>
          </div>
          <div class="settings-row" id="rowDayTimer" hidden>
            <label>${t('settings.timer')}</label>
            <div class="row-controls">
              <input type="range" id="settingsTime" min="15" max="180" step="5" />
              <span class="slider-val" style="min-width:54px;"><span id="settingsTimeVal">60</span>s</span>
            </div>
            <div class="settings-hint">${t('settings.timerHint')}</div>
          </div>
        </div>
        <div class="over-actions">
          <button class="btn-primary big" data-close>${t('settings.close')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]')) modal.hidden = true;
    });
    modal.querySelector('#volMaster').addEventListener('input', (e) => {
      AudioEngine.settings.masterVolume = e.target.value / 100;
      AudioEngine.applyVolumes(); AudioEngine.saveSettings();
    });

    // Day timer slider — live updates room.time so next discussion uses it
    const timeRange = modal.querySelector('#settingsTime');
    const timeVal = modal.querySelector('#settingsTimeVal');
    timeRange.addEventListener('input', () => {
      timeVal.textContent = timeRange.value;
      if (room) {
        room.time = Number(timeRange.value);
        // Reflect in lobby header if visible
        const lt = $('#lobbyTime'); if (lt) lt.textContent = room.time + 's';
      }
    });
    modal.querySelector('#volMusic').addEventListener('input', (e) => {
      AudioEngine.settings.musicVolume = e.target.value / 100;
      AudioEngine.applyVolumes(); AudioEngine.saveSettings();
    });
    modal.querySelector('#volSfx').addEventListener('input', (e) => {
      AudioEngine.settings.sfxVolume = e.target.value / 100;
      AudioEngine.applyVolumes(); AudioEngine.saveSettings();
    });
    modal.querySelectorAll('.mute-toggle').forEach(b => {
      b.addEventListener('click', () => {
        const bus = b.dataset.bus;
        const key = bus + 'Enabled';
        AudioEngine.settings[key] = !AudioEngine.settings[key];
        if (bus === 'music') {
          musicEnabled = AudioEngine.settings.musicEnabled;
          if (!musicEnabled) stopMusic();
          else startMusic(currentMode);
          $$('.music-btn').forEach(x => x.classList.toggle('on', musicEnabled));
        }
        AudioEngine.applyVolumes(); AudioEngine.saveSettings();
        refreshSettingsUI();
      });
    });
  }
  modal.hidden = false;
  refreshSettingsUI();
}
function refreshSettingsUI() {
  const m = $('#modalSettings'); if (!m) return;
  const s = AudioEngine.settings;
  m.querySelector('#volMaster').value = Math.round(s.masterVolume * 100);
  m.querySelector('#volMusic').value = Math.round(s.musicVolume * 100);
  m.querySelector('#volSfx').value = Math.round(s.sfxVolume * 100);
  m.querySelectorAll('.mute-toggle').forEach(b => {
    const on = s[b.dataset.bus + 'Enabled'];
    b.classList.toggle('muted', !on);
    b.textContent = on ? '🔊' : '🔇';
  });
  // Day-timer row visible only when a room exists (lobby/in-game)
  const row = m.querySelector('#rowDayTimer');
  if (row) {
    if (room) {
      row.hidden = false;
      m.querySelector('#settingsTime').value = String(room.time);
      m.querySelector('#settingsTimeVal').textContent = String(room.time);
    } else {
      row.hidden = true;
    }
  }
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  user = loadUser();
  setupAuth();
  syncAuthMode();
  setupCreate();
  setupJoin();
  setupLobby();
  setupChatForm();
  setupShop();
  setupMusic();
  setupSfxDelegation();
  setupSettingsModal();

  // Top nav (sidebar / topbar)
  $$('.topnav a, .side-nav a').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (game) { showToast(t('nav.busy')); return; }
    showView(a.dataset.nav);
  }));
  $$('#brandHome, #brandHome2').forEach(el => el && el.addEventListener('click', (e) => {
    e.preventDefault();
    if (game) return;
    showView('menu');
  }));
  $('#btnLogout').addEventListener('click', () => {
    if (confirm(t('nav.logout'))) logout();
  });

  // Menu actions (data-action and data-nav buttons)
  document.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const a = actionBtn.dataset.action;
      if (a === 'quickplay') quickPlay();
      if (a === 'create')    showView('create');
      if (a === 'join')      showView('join');
    }
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && !navBtn.matches('a')) {
      e.preventDefault();
      if (game) { showToast(t('nav.busy')); return; }
      showView(navBtn.dataset.nav);
    }
  });

  // Re-render dynamic content when language changes mid-session
  document.addEventListener('langchange', () => {
    if (room && document.querySelector('[data-view="lobby"]:not([hidden])')) {
      // Lobby visible — re-render player rows + meta
      $('#lobbyMode').textContent = t('create.' + room.mode);
      $('#lobbyVis').textContent  = t('create.' + room.vis);
      renderLobby();
    }
    if (game && document.querySelector('[data-view="game"]:not([hidden])')) {
      // Re-render players list (badges contain role names)
      renderPlayersList();
    }
    // Re-show create summary if visible
    if (document.querySelector('[data-view="create"]:not([hidden])')) {
      updateCreateSummary();
    }
    // Refresh public rooms list (translates mode names)
    if (document.querySelector('[data-view="join"]:not([hidden])')) {
      refreshPublicRooms();
    }
  });

  // Re-render dynamic views when language changes
  document.addEventListener('langchange', () => {
    // Auth screen current mode
    if (!$('.view-auth').hidden) syncAuthMode();
    // App shell — re-render whichever view is visible
    if (user && !$('#appShell').hidden) {
      const visible = $$('.view').find(v => !v.hidden && v.dataset.view !== 'splash' && v.dataset.view !== 'auth');
      const name = visible ? visible.dataset.view : null;
      if (name === 'menu') refreshMenu();
      if (name === 'profile') refreshProfile();
      if (name === 'leaderboard') refreshLeaderboard();
      if (name === 'join') refreshPublicRooms();
      if (name === 'create') updateCreateSummary();
      if (name === 'lobby' && room) {
        $('#lobbyMode').textContent = t('create.' + room.mode);
        $('#lobbyVis').textContent = t('create.' + room.vis);
        renderLobby();
      }
      // In-game phase labels + chat + right-side header
      if (name === 'game' && game) {
        const phaseMap = { night: 'phase.night', dawn: 'phase.dawn', day: 'phase.discussion', vote: 'phase.voting', result: 'phase.result' };
        const rightMap = { night: 'phase.nightShort', dawn: 'phase.dawn', day: 'phase.discussion', vote: 'phase.voting', result: 'phase.result' };
        if (phaseMap[game.phase]) $('#gamePhase').textContent = t(phaseMap[game.phase]);
        if (rightMap[game.phase]) $('#rightHead').textContent = t(rightMap[game.phase]);
        renderPlayersList();
        renderChat();
      }
    }
  });

  // Splash anim
  bootSplash();
}

document.addEventListener('DOMContentLoaded', init);

})();
