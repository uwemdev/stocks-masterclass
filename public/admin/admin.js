'use strict';

// ─── Auth Guard ───────────────────────────────────────────────────────────────
const token = localStorage.getItem('admin_token');
const adminUser = localStorage.getItem('admin_user') || 'Admin';
if (!token) window.location.href = 'index.html';

// ─── State ────────────────────────────────────────────────────────────────────
let allSettings = {}; // key -> current value in DB
let pendingChanges = {}; // key -> new value

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-panel]');
const saveAllBtn = document.getElementById('saveAllBtn');
const topbarTitle = document.getElementById('topbarTitle');
const topbarSub = document.getElementById('topbarSubtitle');
const toastWrap = document.getElementById('toastWrap');

const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarAvatar = document.getElementById('sidebarAvatar');
if (sidebarUsername) sidebarUsername.textContent = adminUser;
if (sidebarAvatar) sidebarAvatar.textContent = adminUser.charAt(0).toUpperCase();

// ─── Mobile Sidebar Toggle ────────────────────────────────────────────────────
const mobileToggle = document.getElementById('mobileToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
}

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('show');
    });
}
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
}

// ─── Toast System ─────────────────────────────────────────────────────────────
function toast(message, type = 'success', duration = 3500) {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    el.innerHTML = `<strong>${icon}</strong> ${message}`;
    toastWrap.appendChild(el);
    setTimeout(() => { el.remove(); }, duration);
}

// ─── API Helpers ──────────────────────────────────────────────────────────────
async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(opts.headers || {})
        }
    });
    if (res.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = 'index.html';
        return null;
    }
    return res.json();
}

// ─── Load Settings ────────────────────────────────────────────────────────────
async function loadSettings() {
    const data = await apiFetch('/api/admin/settings');
    if (!data || !data.settings) return;

    allSettings = {};
    for (const s of data.settings) allSettings[s.key] = s.value;

    // Populate all inputs
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (key in allSettings) {
            if (el.tagName === 'INPUT' && el.type === 'file') {
                const preview = document.getElementById(`preview_${key}`);
                if (preview && allSettings[key]) preview.src = allSettings[key];
            } else {
                el.value = allSettings[key];
            }
        }

        // Track changes
        if (el.tagName === 'INPUT' && el.type === 'file') {
            el.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('image', file);

                const preview = document.getElementById(`preview_${key}`);
                if (preview) preview.style.opacity = '0.5';

                try {
                    const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                    });
                    const data = await res.json();

                    if (data.success) {
                        pendingChanges[key] = data.url;
                        if (preview) {
                            preview.src = data.url;
                            preview.style.opacity = '1';
                        }
                        toast('Image uploaded temporarily (click Save All to apply to site)', 'success');
                    } else {
                        if (preview) preview.style.opacity = '1';
                        toast(data.message || 'Image upload failed', 'error');
                    }
                } catch (err) {
                    if (preview) preview.style.opacity = '1';
                    toast('Upload error', 'error');
                }
            });
        } else {
            const evtName = el.tagName === 'TEXTAREA' ? 'input' : 'input';
            el.addEventListener(evtName, () => {
                pendingChanges[key] = el.value;
            });
        }
    });

    // Update overview counter
    const ovSettings = document.getElementById('ov-settings');
    if (ovSettings) ovSettings.textContent = data.settings.length;
}

// ─── Save All ─────────────────────────────────────────────────────────────────
saveAllBtn.addEventListener('click', async () => {
    if (Object.keys(pendingChanges).length === 0) {
        toast('No changes to save.', 'info');
        return;
    }

    saveAllBtn.disabled = true;
    saveAllBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Saving…';

    const data = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ updates: pendingChanges })
    });

    saveAllBtn.disabled = false;
    saveAllBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg> Save All Changes`;

    if (data && data.success) {
        toast(`${data.count} setting(s) saved successfully.`, 'success');
        // Merge into allSettings, clear pending
        Object.assign(allSettings, pendingChanges);
        pendingChanges = {};
    } else {
        toast(data?.message || 'Save failed.', 'error');
    }
});

// ─── Load Sign-ups ────────────────────────────────────────────────────────────
async function loadSignups() {
    const data = await apiFetch('/api/admin/signups');
    const body = document.getElementById('signupsBody');
    const ov = document.getElementById('ov-signups');
    if (!data || !body) return;
    if (ov) ov.textContent = data.count;
    if (!data.signups.length) {
        body.innerHTML = '<tr><td colspan="6" style="color:var(--text-dim);text-align:center;padding:24px">No sign-ups yet.</td></tr>';
        return;
    }
    body.innerHTML = data.signups.map(s => `
    <tr>
      <td>${escHtml(s.name || '—')}</td>
      <td>${escHtml(s.email)}</td>
      <td>${escHtml(s.phone || '—')}</td>
      <td>${new Date(s.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
      <td><code style="background: rgba(255,255,255,0.05); padding: 3px 6px; border-radius: 4px; font-size: 11px;">${s.tx_ref ? escHtml(s.tx_ref) : '—'}</code></td>
      <td><span class="badge-status badge-status--${s.paymentStatus === 'paid' ? 'paid' : 'pending'}">${s.paymentStatus || 'pending'}</span></td>
    </tr>
  `).join('');
}

// ─── Load Subscribers ─────────────────────────────────────────────────────────
async function loadSubscribers() {
    const data = await apiFetch('/api/admin/subscribers');
    const body = document.getElementById('subscribersBody');
    const ov = document.getElementById('ov-subs');
    if (!data || !body) return;
    if (ov) ov.textContent = data.count;
    if (!data.subscribers.length) {
        body.innerHTML = '<tr><td colspan="3" style="color:var(--text-dim);text-align:center;padding:24px">No subscribers yet.</td></tr>';
        return;
    }
    body.innerHTML = data.subscribers.map(s => `
    <tr>
      <td>${escHtml(s.name || '—')}</td>
      <td>${escHtml(s.email)}</td>
      <td>${new Date(s.subscribedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
    </tr>
  `).join('');
}

async function exportCSV(endpoint, filename) {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
        const response = await fetch(endpoint, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        toast('Failed to export CSV.', 'error');
    }
}

document.getElementById('exportSignupsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    exportCSV('/api/admin/signups/export', 'masterclass_registrations.csv');
});

document.getElementById('exportSubsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    exportCSV('/api/admin/subscribers/export', 'newsletter_subscribers.csv');
});

function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─── Panel Navigation ─────────────────────────────────────────────────────────
const panelTitles = {
    overview: ['Overview', 'Manage your website content'],
    hero: ['Hero Section', 'Badge, headline, bullets, buttons & countdown'],
    event: ['Event Details', 'Date, time, pricing & contact information'],
    stats: ['Stats Bar', 'The four metric cards below the hero'],
    curriculum: ['Curriculum', '"What You Will Learn" section header'],
    about: ['About Instructor', 'Bio, profile, and floating stat cards'],
    newsletter: ['Newsletter', 'Email subscription section'],
    nav: ['Nav & Footer', 'Navigation and footer text'],
    socials: ['Socials & Links', 'Social media URLs — leave blank to hide'],
    theme: ['Theme & Colors', 'Customize the main colors of the website'],
    payments: ['Payment Integration', 'Configure Flutterwave API keys and Masterclass cost'],
    seo: ['SEO / Meta Tags', 'Page title, description, and OG tags'],
    signups: ['Sign-ups', 'Everyone who registered for the masterclass'],
    subscribers: ['Newsletter Subscribers', 'Free stock updates subscriber list'],
    password: ['Change Password', 'Update your admin panel password'],
};

function switchPanel(panelId) {
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    sidebarLinks.forEach(l => l.classList.remove('active'));

    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) panel.classList.add('active');

    const activeLink = document.querySelector(`.sidebar-link[data-panel="${panelId}"]`);
    if (activeLink) activeLink.classList.add('active');

    const [title, sub] = panelTitles[panelId] || ['Admin', ''];
    topbarTitle.textContent = title;
    topbarSub.textContent = sub;

    // Load data panels lazily
    if (panelId === 'signups') loadSignups();
    if (panelId === 'subscribers') loadSubscribers();

    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 992) {
        closeMobileSidebar();
    }
}

sidebarLinks.forEach(link => {
    link.addEventListener('click', () => switchPanel(link.dataset.panel));
});

// ─── Logout ───────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'index.html';
});

// ─── Change Password ──────────────────────────────────────────────────────────
document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const currentPassword = document.getElementById('pwCurrent').value;
    const newPassword = document.getElementById('pwNew').value;
    const confirm = document.getElementById('pwConfirm').value;

    if (!currentPassword || !newPassword || !confirm) {
        toast('Please fill in all password fields.', 'error');
        return;
    }
    if (newPassword !== confirm) {
        toast('New passwords do not match.', 'error');
        return;
    }
    if (newPassword.length < 6) {
        toast('Password must be at least 6 characters.', 'error');
        return;
    }

    const data = await apiFetch('/api/admin/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
    });

    if (data && data.success) {
        toast('Password changed successfully!', 'success');
        document.getElementById('pwCurrent').value = '';
        document.getElementById('pwNew').value = '';
        document.getElementById('pwConfirm').value = '';
    } else {
        toast(data?.message || 'Password change failed.', 'error');
    }
});

// ─── Initial Load ─────────────────────────────────────────────────────────────
(async () => {
    await loadSettings();
    // Preload overview counts
    loadSignups();
    loadSubscribers();
})();
