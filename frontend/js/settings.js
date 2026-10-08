// Settings, Profile & Account Management Controller
const urlParams = new URLSearchParams(window.location.search);
let currentConsumerId = urlParams.get('consumer_id') || 'CNS-849201';

const consumerSelector = document.getElementById('consumerSelector');

// Sync navigation tabs to maintain consumer_id parameter
function updateNavLinks(id) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const base = tab.getAttribute('href').split('?')[0];
    tab.setAttribute('href', `${base}?consumer_id=${encodeURIComponent(id)}`);
  });
}
updateNavLinks(currentConsumerId);

// Setup Consumer Dropdown Switcher
if (consumerSelector) {
  consumerSelector.value = currentConsumerId;
  consumerSelector.addEventListener('change', (e) => {
    currentConsumerId = e.target.value;
    window.history.pushState({}, '', `?consumer_id=${currentConsumerId}`);
    updateNavLinks(currentConsumerId);
    loadSettingsData(currentConsumerId);
  });
}

// Tab Switching Navigation Pills
const pillButtons = document.querySelectorAll('.pill-btn');
const tabPanes = document.querySelectorAll('.settings-tab-pane');

pillButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    pillButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    const targetPane = document.getElementById(targetId);
    if (targetPane) {
      targetPane.classList.add('active');
    }
  });
});

// Toggle password visibility
window.toggleFieldPw = function(fieldId) {
  const input = document.getElementById(fieldId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

// Password Strength Meter
const newPasswordInput = document.getElementById('newPassword');
const strengthBarFill = document.getElementById('strengthBarFill');
const strengthText = document.getElementById('strengthText');

if (newPasswordInput) {
  newPasswordInput.addEventListener('input', (e) => {
    const pwd = e.target.value;
    if (!pwd) {
      strengthBarFill.className = 'strength-fill';
      strengthBarFill.style.width = '0%';
      strengthText.textContent = 'Password Strength: Minimum 6 characters';
      return;
    }

    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) {
      strengthBarFill.className = 'strength-fill weak';
      strengthText.textContent = 'Password Strength: Weak (add symbols/uppercase/length)';
    } else if (score <= 3) {
      strengthBarFill.className = 'strength-fill medium';
      strengthText.textContent = 'Password Strength: Medium (good, add special characters)';
    } else {
      strengthBarFill.className = 'strength-fill strong';
      strengthText.textContent = 'Password Strength: Strong & Secure';
    }
  });
}

// Fetch & Render Settings Data
async function loadSettingsData(consumerId) {
  try {
    const res = await fetch(`/api/settings/${consumerId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    renderProfileData(data.profile);
    renderLinkedAccounts(data.linked_accounts, consumerId);
    renderSecurityData(data.security);
  } catch (err) {
    console.error('Failed to load settings data:', err);
  }
}

function renderProfileData(profile) {
  if (!profile) return;

  // Header and Navigation sync
  const displayConsumerName = document.getElementById('displayConsumerName');
  const displayConsumerId = document.getElementById('displayConsumerId');
  const quickAccountLabel = document.getElementById('quickAccountLabel');

  if (displayConsumerName) displayConsumerName.textContent = profile.name || 'Consumer';
  if (displayConsumerId) displayConsumerId.textContent = `ID: ${profile.consumer_id}`;
  if (quickAccountLabel) quickAccountLabel.textContent = `${profile.consumer_id} (${profile.name})`;

  // Form Inputs
  const inputConsumerId = document.getElementById('inputConsumerId');
  const inputName = document.getElementById('inputName');
  const inputEmail = document.getElementById('inputEmail');
  const inputPhone = document.getElementById('inputPhone');
  const inputAddress = document.getElementById('inputAddress');

  if (inputConsumerId) inputConsumerId.value = profile.consumer_id;
  if (inputName) inputName.value = profile.name || '';
  if (inputEmail) inputEmail.value = profile.email || '';
  if (inputPhone) inputPhone.value = profile.phone || '';
  if (inputAddress) inputAddress.value = profile.billing_address || '';

  // Technical Specs
  const specMeterNo = document.getElementById('specMeterNo');
  const specSanctioned = document.getElementById('specSanctioned');
  const specTariff = document.getElementById('specTariff');
  const specPhase = document.getElementById('specPhase');

  if (specMeterNo) specMeterNo.textContent = profile.meter_number || 'MTR-2026-001';
  if (specSanctioned) specSanctioned.textContent = `${(profile.sanctioned_load_kw || 5.0).toFixed(2)} kW`;
  if (specTariff) specTariff.textContent = 'LT-1 Domestic Slabs (₹3.80 - ₹8.90)';
  if (specPhase) specPhase.textContent = profile.sanctioned_load_kw > 7 ? 'Three Phase 415V / 50Hz' : 'Single Phase 230V / 50Hz';

  // Checkboxes
  const checkAlertSms = document.getElementById('checkAlertSms');
  const checkAlertEmail = document.getElementById('checkAlertEmail');
  const checkAlertPeak = document.getElementById('checkAlertPeak');

  if (checkAlertSms) checkAlertSms.checked = Boolean(profile.alert_sms);
  if (checkAlertEmail) checkAlertEmail.checked = Boolean(profile.alert_email);
  if (checkAlertPeak) checkAlertPeak.checked = Boolean(profile.alert_peak_spike);
}

function renderLinkedAccounts(accounts, activeConsumerId) {
  const container = document.getElementById('linkedAccountsList');
  const pillCount = document.getElementById('pillAccountsCount');
  if (pillCount) pillCount.textContent = accounts ? accounts.length : 0;
  if (!container) return;

  container.innerHTML = '';

  if (!accounts || accounts.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #94a3b8;">
        No linked meter accounts found. Click "+ Link New Connection" to attach an account.
      </div>
    `;
    return;
  }

  accounts.forEach(acc => {
    const isThisAccount = (acc.consumer_id === activeConsumerId);
    const card = document.createElement('div');
    card.className = `account-card ${acc.is_primary ? 'is-primary' : ''}`;

    card.innerHTML = `
      <div>
        <div class="account-card-header">
          <span class="account-nick">${acc.nickname}</span>
          ${acc.is_primary ? '<span class="account-badge-primary">PRIMARY</span>' : ''}
        </div>
        <div class="account-meta-details" style="margin-top: 12px;">
          <div>Consumer ID: <strong>${acc.consumer_id}</strong></div>
          <div>Account Name: <strong>${acc.name || 'Consumer Account'}</strong></div>
          <div>Meter Number: <strong>${acc.meter_number || 'N/A'}</strong></div>
          <div>Sanctioned Load: <strong>${(acc.sanctioned_load_kw || 5.0).toFixed(1)} kW</strong></div>
        </div>
      </div>
      <div class="account-actions-row">
        ${
          isThisAccount 
            ? `<span style="font-size: 0.8rem; color: var(--electric-cyan); font-weight: 700; align-self: center;">● Currently Active</span>`
            : `<button class="btn-switch-account" onclick="switchActiveAccount('${acc.consumer_id}')">Switch to Account</button>`
        }
        ${
          !acc.is_primary 
            ? `
              <button class="btn-make-primary" onclick="setAccountPrimary(${acc.id})" title="Make this your default billing account">★ Set Primary</button>
              <button class="btn-unlink-account" onclick="unlinkAccountConnection(${acc.id}, '${acc.consumer_id}')" title="Unlink connection">✕ Unlink</button>
            ` 
            : ''
        }
      </div>
    `;
    container.appendChild(card);
  });
}

function renderSecurityData(security) {
  if (!security) return;
  const secLastChanged = document.getElementById('secLastChanged');
  const sessionDevice = document.getElementById('sessionDevice');
  const sessionIp = document.getElementById('sessionIp');

  if (secLastChanged && security.last_password_change) {
    secLastChanged.textContent = security.last_password_change;
  }
  if (sessionDevice && security.active_session?.device) {
    sessionDevice.textContent = security.active_session.device;
  }
  if (sessionIp && security.active_session?.ip) {
    sessionIp.textContent = `IP: ${security.active_session.ip} • Connected`;
  }
}

// Global actions for linked accounts
window.switchActiveAccount = function(targetConsumerId) {
  currentConsumerId = targetConsumerId;
  if (consumerSelector) consumerSelector.value = targetConsumerId;
  window.history.pushState({}, '', `?consumer_id=${targetConsumerId}`);
  updateNavLinks(targetConsumerId);
  loadSettingsData(targetConsumerId);
};

window.setAccountPrimary = async function(linkId) {
  try {
    const res = await fetch('/api/settings/accounts/primary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentConsumerId, link_id: linkId })
    });
    const result = await res.json();
    if (result.success) {
      loadSettingsData(currentConsumerId);
    } else {
      alert(result.message || 'Could not update primary account.');
    }
  } catch (err) {
    console.error('Error setting primary account:', err);
  }
};

window.unlinkAccountConnection = async function(linkId, targetId) {
  if (!confirm(`Are you sure you want to unlink connection ${targetId}? You can re-link it anytime.`)) {
    return;
  }
  try {
    const res = await fetch('/api/settings/accounts/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentConsumerId, link_id: linkId })
    });
    const result = await res.json();
    if (result.success) {
      loadSettingsData(currentConsumerId);
    } else {
      alert(result.message || 'Could not unlink account.');
    }
  } catch (err) {
    console.error('Error unlinking account:', err);
  }
};

// Profile Form Submission
const profileForm = document.getElementById('profileForm');
const profileStatusMsg = document.getElementById('profileStatusMsg');

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    profileStatusMsg.textContent = 'Saving changes...';
    profileStatusMsg.className = 'status-msg';

    const payload = {
      consumer_id: currentConsumerId,
      name: document.getElementById('inputName').value.trim(),
      email: document.getElementById('inputEmail').value.trim(),
      phone: document.getElementById('inputPhone').value.trim(),
      billing_address: document.getElementById('inputAddress').value.trim(),
      alert_sms: document.getElementById('checkAlertSms').checked,
      alert_email: document.getElementById('checkAlertEmail').checked,
      alert_peak_spike: document.getElementById('checkAlertPeak').checked
    };

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        profileStatusMsg.textContent = `✓ ${result.message}`;
        profileStatusMsg.className = 'status-msg success';
        // Refresh display name in navbar
        const displayConsumerName = document.getElementById('displayConsumerName');
        if (displayConsumerName) displayConsumerName.textContent = payload.name;
        setTimeout(() => {
          profileStatusMsg.textContent = '';
        }, 4000);
      } else {
        profileStatusMsg.textContent = `✗ ${result.message}`;
        profileStatusMsg.className = 'status-msg error';
      }
    } catch (err) {
      console.error('Profile update error:', err);
      profileStatusMsg.textContent = '✗ Network error saving profile.';
      profileStatusMsg.className = 'status-msg error';
    }
  });
}

// Password Reset Form Submission
const passwordForm = document.getElementById('passwordForm');
const passwordStatusMsg = document.getElementById('passwordStatusMsg');

if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordStatusMsg.textContent = 'Verifying & resetting...';
    passwordStatusMsg.className = 'status-msg';

    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;

    if (newPwd.length < 6) {
      passwordStatusMsg.textContent = '✗ New password must be at least 6 characters.';
      passwordStatusMsg.className = 'status-msg error';
      return;
    }

    if (newPwd !== confirmPwd) {
      passwordStatusMsg.textContent = '✗ New password and confirmation do not match.';
      passwordStatusMsg.className = 'status-msg error';
      return;
    }

    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_id: currentConsumerId,
          current_password: currentPwd,
          new_password: newPwd
        })
      });
      const result = await res.json();

      if (result.success) {
        passwordStatusMsg.textContent = `✓ ${result.message}`;
        passwordStatusMsg.className = 'status-msg success';
        passwordForm.reset();
        if (strengthBarFill) {
          strengthBarFill.className = 'strength-fill';
          strengthBarFill.style.width = '0%';
        }
        if (strengthText) {
          strengthText.textContent = 'Password Strength: Minimum 6 characters';
        }
        // Update last changed date
        const secLastChanged = document.getElementById('secLastChanged');
        if (secLastChanged) secLastChanged.textContent = 'Just now';
        setTimeout(() => {
          passwordStatusMsg.textContent = '';
        }, 5000);
      } else {
        passwordStatusMsg.textContent = `✗ ${result.message}`;
        passwordStatusMsg.className = 'status-msg error';
      }
    } catch (err) {
      console.error('Password reset error:', err);
      passwordStatusMsg.textContent = '✗ Network error updating password.';
      passwordStatusMsg.className = 'status-msg error';
    }
  });
}

// Modal: Link New Account
const linkModal = document.getElementById('linkAccountModal');
const btnOpenLinkModal = document.getElementById('btnOpenLinkModal');
const closeLinkModal = document.getElementById('closeLinkModal');
const linkAccountForm = document.getElementById('linkAccountForm');

if (btnOpenLinkModal && linkModal) {
  btnOpenLinkModal.addEventListener('click', () => {
    linkModal.classList.add('active');
  });
}

if (closeLinkModal && linkModal) {
  closeLinkModal.addEventListener('click', () => {
    linkModal.classList.remove('active');
  });
}

window.addEventListener('click', (e) => {
  if (e.target === linkModal) {
    linkModal.classList.remove('active');
  }
});

if (linkAccountForm) {
  linkAccountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetConsumerId = document.getElementById('linkConsumerId').value.trim();
    const nickname = document.getElementById('linkNickname').value.trim();

    try {
      const res = await fetch('/api/settings/accounts/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentConsumerId,
          consumer_id: targetConsumerId,
          nickname: nickname
        })
      });
      const result = await res.json();

      if (result.success) {
        linkModal.classList.remove('active');
        linkAccountForm.reset();
        loadSettingsData(currentConsumerId);
        alert(`Connection ${targetConsumerId} linked successfully!`);
      } else {
        alert(result.message || 'Could not link connection.');
      }
    } catch (err) {
      console.error('Link account error:', err);
      alert('Network error linking account.');
    }
  });
}

// Initial Data Load
loadSettingsData(currentConsumerId);
