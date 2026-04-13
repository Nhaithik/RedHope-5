// ════════════════════════════════════════
// RED HOPE - Shared Data & Utilities
// ════════════════════════════════════════

const DB = {
  get: k => { try { return JSON.parse(localStorage.getItem('rh_'+k)); } catch(e){ return null; } },
  set: (k,v) => localStorage.setItem('rh_'+k, JSON.stringify(v)),
  del: k => localStorage.removeItem('rh_'+k)
};

function initDB() {
  if (!DB.get('users')) DB.set('users', [
    { id:1, email:'admin@redhope.com', password:'Admin@1234', phone:'9999999999', age:30, gender:'Other', blood_group:'O+', available_blood:true, available_organ:true, points:9999, streak:12, medical:'', allergies:'' }
  ]);
  if (!DB.get('blood_avail')) DB.set('blood_avail', [
    {blood_group:'A+',units_available:45,units_needed:80},
    {blood_group:'A-',units_available:12,units_needed:40},
    {blood_group:'B+',units_available:60,units_needed:70},
    {blood_group:'B-',units_available:8,units_needed:35},
    {blood_group:'AB+',units_available:30,units_needed:30},
    {blood_group:'AB-',units_available:5,units_needed:20},
    {blood_group:'O+',units_available:90,units_needed:100},
    {blood_group:'O-',units_available:10,units_needed:60},
  ]);
  if (!DB.get('urgent_requests')) DB.set('urgent_requests', [
    {id:1,user_id:1,blood_group:'O-',hospital:'City Medical Center',city:'Mumbai',urgency:'critical',description:'Emergency surgery patient needs O- urgently.',active:true,created:Date.now()-3600000},
    {id:2,user_id:1,blood_group:'B+',hospital:'Apollo Hospital',city:'Delhi',urgency:'high',description:'Post-surgery patient needs B+ blood.',active:true,created:Date.now()-7200000},
  ]);
  if (!DB.get('donations')) DB.set('donations', []);
  if (!DB.get('messages')) DB.set('messages', []);
  if (!DB.get('next_uid')) DB.set('next_uid', 2);
  if (!DB.get('next_rid')) DB.set('next_rid', 3);
}

function getCurrentUser() {
  const sid = DB.get('session');
  if (!sid) return null;
  const users = DB.get('users') || [];
  return users.find(u => u.id === sid) || null;
}

function updateUser(updated) {
  const users = DB.get('users') || [];
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx > -1) { users[idx] = updated; DB.set('users', users); }
}

function addPoints(uid, pts) {
  const users = DB.get('users') || [];
  const u = users.find(x => x.id === uid);
  if (u) { u.points = (u.points || 0) + pts; DB.set('users', users); }
}

function requireAuth() {
  initDB();
  const user = getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}

function doLogout() {
  DB.del('session');
  window.location.href = 'login.html';
}

function updateTopbar(user) {
  const name = user.email.split('@')[0];
  const el = document.getElementById('topbar-name');
  const av = document.getElementById('topbar-avatar');
  const pts = document.getElementById('topbar-pts');
  if (el) el.textContent = name;
  if (av) av.textContent = name[0].toUpperCase();
  if (pts) pts.textContent = (user.points || 0).toLocaleString();
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    if (n.getAttribute('href') === page) n.classList.add('active');
  });
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Notification helpers called from pages ──

function notifyNewUrgentRequest(req) {
  // Broadcast to all users except poster
  if (typeof Notif === 'undefined') return;
  const urgLabel = req.urgency === 'critical' ? '🔴 CRITICAL' : req.urgency === 'high' ? '🟠 HIGH' : '🟡 MODERATE';
  Notif.broadcast(
    'urgent_request',
    `${urgLabel}: ${req.blood_group} Blood Needed`,
    `${req.hospital}, ${req.city} — Can you help?`,
    'urgent_requests.html',
    req.user_id
  );
}

function notifyDonationLogged(uid, type, bloodGroup) {
  if (typeof Notif === 'undefined') return;
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  Notif.push(uid, 'donation_logged',
    `✅ ${typeLabel} Donation Logged!`,
    `Your ${bloodGroup} ${type} donation has been recorded. You earned +500 points!`,
    'donation_history.html'
  );
  Notif.push(uid, 'points_earned',
    '⭐ +500 Points Earned',
    `Keep it up! Check the leaderboard to see your rank.`,
    'leaderboard.html'
  );
}

function notifyNewMessage(toUid, fromName) {
  if (typeof Notif === 'undefined') return;
  Notif.push(toUid, 'message',
    `💬 New Message from ${fromName}`,
    'You have a new message. Tap to read and reply.',
    'messages.html'
  );
}

// ── Apply saved settings on every page load ──
function applyUserSettings() {
  const sid = DB.get('session');
  if (!sid) return;
  const s = DB.get('settings_' + sid);
  if (!s) return;
  // Theme color
  if (s['theme-color']) {
    document.documentElement.style.setProperty('--red', s['theme-color']);
    document.documentElement.style.setProperty('--red-dark', s['theme-dark'] || s['theme-color']);
    document.documentElement.style.setProperty('--red-light', s['theme-color'] + '20');
    document.documentElement.style.setProperty('--red-mid', s['theme-color']);
    document.documentElement.style.setProperty('--border', s['theme-color'] + '40');
  }
  // Font size
  if (s['font-size']) document.documentElement.style.fontSize = s['font-size'] + 'px';
  // Compact mode
  if (s['compact-mode']) document.documentElement.style.setProperty('--content-padding', '16px');
}

// Call immediately when shared.js is loaded
applyUserSettings();
