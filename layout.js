// Renders sidebar + topbar into the page
function renderLayout(pageTitle, activePage) {
  const user = requireAuth();
  if (!user) return null;

  const nav = [
    { href:'dashboard.html',         icon:'fa-gauge',                label:'Dashboard' },
    { href:'blood_availability.html', icon:'fa-droplet',             label:'Blood Availability' },
    { href:'donor_search.html',       icon:'fa-magnifying-glass',    label:'Find Donors' },
    { href:'urgent_requests.html',    icon:'fa-triangle-exclamation',label:'Urgent Requests' },
    { href:'donation_history.html',   icon:'fa-timeline',            label:'Donation History' },
    { href:'leaderboard.html',        icon:'fa-trophy',              label:'Leaderboard' },
    { href:'messages.html',           icon:'fa-comments',            label:'Messages' },
    { href:'map_view.html',           icon:'fa-map-location-dot',    label:'Donation Map' },
    { href:'chatbot.html',            icon:'fa-robot',               label:'AI Assistant' },
    { href:'notifications.html',      icon:'fa-bell',                label:'Notifications' },
    { href:'donation_camps.html',      icon:'fa-campground',          label:'Donation Camps' },
    { href:'profile.html',            icon:'fa-user',                label:'My Profile' },
  ];

  const navHTML = nav.map(n => `
    <a href="${n.href}" class="nav-item ${n.href === activePage ? 'active' : ''}">
      <i class="fa-solid ${n.icon}"></i> ${n.label}
      ${n.href === 'notifications.html' ? '<span id="nav-notif-badge" style="margin-left:auto;background:var(--red);color:white;font-size:.65rem;font-weight:800;min-width:16px;height:16px;border-radius:50%;display:none;align-items:center;justify-content:center;padding:0 3px;"></span>' : ''}
    </a>`).join('');

  const name = user.email.split('@')[0];

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="app-layout">
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <h2><i class="fa-solid fa-droplet" style="color:#EF4444;"></i> Red Hope</h2>
          <span>Blood Donation Network</span>
        </div>
        <div class="sidebar-nav">${navHTML}</div>
        <div class="sidebar-footer">
          <a class="nav-item" onclick="doLogout()" style="color:rgba(255,100,100,.7);cursor:pointer;">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </a>
        </div>
      </nav>
      <div class="main-area">
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:14px;">
            <button id="mob-menu-btn" onclick="document.getElementById('sidebar').classList.toggle('open')" style="display:none;background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text);"><i class="fa-solid fa-bars"></i></button>
            <h2>${pageTitle}</h2>
          </div>
          <div class="topbar-right">
            <div class="pts-badge"><i class="fa-solid fa-star"></i> <span id="topbar-pts">${(user.points||0).toLocaleString()}</span> Pts</div>
            <div class="notif-wrapper">
              <button class="notif-btn" id="notif-bell-btn" onclick="toggleNotifPanel()" title="Notifications">
                <i class="fa-solid fa-bell"></i>
                <span id="notif-badge"></span>
              </button>
              <div id="notif-panel"></div>
            </div>
            <div class="user-chip" onclick="window.location.href='profile.html'" style="cursor:pointer;">
              <div class="avatar" id="topbar-avatar">${name[0].toUpperCase()}</div>
              <span id="topbar-name">${name}</span>
            </div>
          </div>
        </div>
        <div class="content" id="main-content">
  `);

  if (window.innerWidth <= 768) {
    const btn = document.getElementById('mob-menu-btn');
    if (btn) btn.style.display = 'block';
  }

  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.notif-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      document.getElementById('notif-panel')?.classList.remove('open');
    }
  });

  return user;
}

function closeLayout() {
  document.getElementById('main-content').insertAdjacentHTML('afterend', '</div></div>');
}

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  if (isOpen) {
    const u = getCurrentUser();
    if (u) Notif.renderPanel(u.id);
  }
}

function initNotifications() {
  const u = getCurrentUser();
  if (!u) return;
  Notif.checkAndGenerateSystemNotifs(u.id);
  Notif.refreshBadge(u.id);
  const navBadge = document.getElementById('nav-notif-badge');
  const count = Notif.getUnreadCount(u.id);
  if (navBadge && count > 0) {
    navBadge.textContent = count > 9 ? '9+' : count;
    navBadge.style.display = 'flex';
  }
}
