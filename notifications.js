// ════════════════════════════════════════
// RED HOPE — Notification System
// ════════════════════════════════════════
function sendEmailNotification(message, toEmail) {
  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
    to_email: toEmail,
    message: message
  })
  .then(function() {
    console.log("✅ Email sent to " + toEmail);
  })
  .catch(function(err) {
    console.log("❌ Email failed", err);
  });
}
const Notif = {

  // ── Types ──────────────────────────────
  TYPES: {
    URGENT_REQUEST : 'urgent_request',
    MESSAGE        : 'message',
    DONATION_LOGGED: 'donation_logged',
    POINTS_EARNED  : 'points_earned',
    BLOOD_CRITICAL : 'blood_critical',
    WELCOME        : 'welcome',
    LEADERBOARD    : 'leaderboard',
    SYSTEM         : 'system',
  },

  ICONS: {
    urgent_request : { icon: 'fa-triangle-exclamation', color: '#DC2626', bg: '#FEE2E2' },
    message        : { icon: 'fa-message',              color: '#3B82F6', bg: '#DBEAFE' },
    donation_logged: { icon: 'fa-heart',                color: '#10B981', bg: '#D1FAE5' },
    points_earned  : { icon: 'fa-star',                 color: '#F59E0B', bg: '#FEF3C7' },
    blood_critical : { icon: 'fa-droplet',              color: '#DC2626', bg: '#FEE2E2' },
    welcome        : { icon: 'fa-hand-wave',            color: '#8B5CF6', bg: '#EDE9FE' },
    leaderboard    : { icon: 'fa-trophy',               color: '#F59E0B', bg: '#FEF3C7' },
    system         : { icon: 'fa-bell',                 color: '#6B7280', bg: '#F3F4F6' },
  },

  // ── Core Storage ───────────────────────
  getAll(uid) {
    return (DB.get('notifs_' + uid) || []).sort((a, b) => b.ts - a.ts);
  },

  save(uid, notifs) {
    DB.set('notifs_' + uid, notifs);
  },

  getUnreadCount(uid) {
    return this.getAll(uid).filter(n => !n.read).length;
  },

  // ── Push a notification ─────────────────
  push(uid, type, title, body, link = null) {
    const notifs = this.getAll(uid);
    notifs.unshift({
      id    : Date.now() + Math.random(),
      uid,
      type,
      title,
      body,
      link,
      read  : false,
      ts    : Date.now(),
    });
    // Keep max 50 per user
    this.save(uid, notifs.slice(0, 50));
    // Refresh badge if on page
    Notif.refreshBadge(uid);
    // Show toast if on same page
    Notif.showToast(type, title, body);
  },

  // ── Broadcast to all users ──────────────
  broadcast(type, title, body, link = null, excludeUid = null) {
    const users = DB.get('users') || [];
    users.forEach(u => {
      if (u.id !== excludeUid) {
        this.push(u.id, type, title, body, link);
      }
    });
  },

  // ── Mark read ──────────────────────────
  markRead(uid, id) {
    const notifs = this.getAll(uid);
    const n = notifs.find(x => x.id === id);
    if (n) { n.read = true; this.save(uid, notifs); }
    this.refreshBadge(uid);
  },

  markAllRead(uid) {
    const notifs = this.getAll(uid).map(n => ({ ...n, read: true }));
    this.save(uid, notifs);
    this.refreshBadge(uid);
  },

  delete(uid, id) {
    const notifs = this.getAll(uid).filter(n => n.id !== id);
    this.save(uid, notifs);
    this.refreshBadge(uid);
  },

  clearAll(uid) {
    this.save(uid, []);
    this.refreshBadge(uid);
  },

  // ── Update badge count in topbar ────────
  refreshBadge(uid) {
    const count = this.getUnreadCount(uid);
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    // Also update panel if open
    if (document.getElementById('notif-panel')?.classList.contains('open')) {
      Notif.renderPanel(uid);
    }
  },

  // ── Toast notification ──────────────────
  showToast(type, title, body) {
    const meta = this.ICONS[type] || this.ICONS.system;
    const toast = document.createElement('div');
    toast.className = 'rh-toast';
    toast.innerHTML = `
      <div class="rh-toast-icon" style="background:${meta.bg};color:${meta.color};">
        <i class="fa-solid ${meta.icon}"></i>
      </div>
      <div class="rh-toast-text">
        <div class="rh-toast-title">${title}</div>
        <div class="rh-toast-body">${body}</div>
      </div>
      <button class="rh-toast-close" onclick="this.parentElement.remove()">×</button>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4500);
  },

  // ── Render dropdown panel ───────────────
  renderPanel(uid) {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const notifs = this.getAll(uid);
    const unread = notifs.filter(n => !n.read).length;

    panel.innerHTML = `
      <div class="np-header">
        <div>
          <div class="np-title"><i class="fa-solid fa-bell"></i> Notifications</div>
          ${unread > 0 ? `<div class="np-sub">${unread} unread</div>` : '<div class="np-sub">All caught up!</div>'}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${unread > 0 ? `<button class="np-btn" onclick="Notif.markAllRead(${uid});Notif.renderPanel(${uid})">Mark all read</button>` : ''}
          <button class="np-btn" onclick="Notif.clearAll(${uid});Notif.renderPanel(${uid})">Clear all</button>
        </div>
      </div>
      <div class="np-list" id="np-list">
        ${notifs.length === 0
          ? `<div class="np-empty"><i class="fa-solid fa-bell-slash"></i><p>No notifications yet</p></div>`
          : notifs.map(n => this._renderItem(n, uid)).join('')
        }
      </div>`;
  },

  _renderItem(n, uid) {
    const meta = this.ICONS[n.type] || this.ICONS.system;
    const ago = this._timeAgo(n.ts);
    return `
      <div class="np-item ${n.read ? '' : 'unread'}" onclick="Notif.markRead(${uid},${n.id});${n.link ? `window.location.href='${n.link}'` : 'Notif.renderPanel(' + uid + ')'}">
        <div class="np-item-icon" style="background:${meta.bg};color:${meta.color};">
          <i class="fa-solid ${meta.icon}"></i>
        </div>
        <div class="np-item-body">
          <div class="np-item-title">${n.title}</div>
          <div class="np-item-text">${n.body}</div>
          <div class="np-item-time">${ago}</div>
        </div>
        ${!n.read ? '<div class="np-dot"></div>' : ''}
        <button class="np-del" onclick="event.stopPropagation();Notif.delete(${uid},${n.id});Notif.renderPanel(${uid})">×</button>
      </div>`;
  },

  _timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  },

  // ── Auto-generate system notifications ──
  checkAndGenerateSystemNotifs(uid) {
    const key = 'notif_sys_checked_' + uid;
    const today = new Date().toDateString();
    if (DB.get(key) === today) return;
    DB.set(key, today);

    const user = (DB.get('users') || []).find(u => u.id === uid);
    if (!user) return;

    // 1. Critical blood levels
    const avail = DB.get('blood_avail') || [];
    const critical = avail.filter(a => (a.units_available / Math.max(1, a.units_needed)) < 0.3);
    if (critical.length > 0) {
      const groups = critical.map(c => c.blood_group).join(', ');
      this.push(uid, 'blood_critical',
        '🩸 Critical Blood Shortage',
        `${groups} blood stock is critically low. Donations urgently needed!`,
        'blood_availability.html'
      );
    }

    // 2. Unread messages
    const msgs = DB.get('messages') || [];
    const unreadMsgs = msgs.filter(m => m.to === uid && !m.read);
    if (unreadMsgs.length > 0) {
      this.push(uid, 'message',
        `💬 ${unreadMsgs.length} Unread Message${unreadMsgs.length > 1 ? 's' : ''}`,
        'You have unread messages from donors.',
        'messages.html'
      );
    }

    // 3. Active urgent requests
    const reqs = (DB.get('urgent_requests') || []).filter(r => r.active);
    if (reqs.length > 0 && user.available_blood) {
      this.push(uid, 'urgent_request',
        `⚠️ ${reqs.length} Active Urgent Request${reqs.length > 1 ? 's' : ''}`,
        `Your blood type (${user.blood_group}) may be needed. Check urgent requests.`,
        'urgent_requests.html'
      );
    }

    // 4. Leaderboard rank
    const users = (DB.get('users') || []).sort((a, b) => b.points - a.points);
    const rank = users.findIndex(u => u.id === uid) + 1;
    if (rank > 0 && rank <= 10) {
      this.push(uid, 'leaderboard',
        `🏆 You're Ranked #${rank}`,
        `You're in the top 10 donors! Keep donating to climb higher.`,
        'leaderboard.html'
      );
    }
  },

  // ── Welcome notification for new users ──
  sendWelcome(uid, email) {
    this.push(uid, 'welcome',
      '👋 Welcome to Red Hope!',
      `Hello ${email.split('@')[0]}! Complete your profile and log your first donation to earn 500 points.`,
      'profile.html'
    );
  },
};
