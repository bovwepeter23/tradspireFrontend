const API_BASE_URL = 'tradspire-backend.vercel.app'; // e.g. https://tradspirebackend.vercel.app

// Tab Switcher
function switchTab(tabName) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const recoverForm = document.getElementById('recoverForm');
  const authTabs = document.getElementById('authTabs');
  const tabs = document.querySelectorAll('.tab-btn');
  
  hideAlert();

  // Hide all forms first
  loginForm.classList.add('hidden');
  registerForm.classList.add('hidden');
  recoverForm.classList.add('hidden');

  if (tabName === 'login') {
    authTabs.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
  } else if (tabName === 'register') {
    authTabs.classList.remove('hidden');
    registerForm.classList.remove('hidden');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
  } else if (tabName === 'recover') {
    authTabs.classList.add('hidden'); // Hide tabs during recovery view
    recoverForm.classList.remove('hidden');
  }
}

// Alert Helper
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alertBox');
  alertBox.textContent = message;
  alertBox.className = `alert-box ${type}`;
}

function hideAlert() {
  const alertBox = document.getElementById('alertBox');
  alertBox.className = 'alert-box hidden';
}

// 1. LOGIN HANDLER
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed');

    // Save JWT token locally
    localStorage.setItem('token', data.token);
    showAlert('Login successful! Redirecting...', 'success');
    
    // Redirect after brief pause
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1500);

  } catch (err) {
    showAlert(err.message, 'error');
  }
});

// 2. REGISTER HANDLER
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Registration failed');

    showAlert('Account created! Check your email to verify your account.', 'success');
    document.getElementById('registerForm').reset();

  } catch (err) {
    showAlert(err.message, 'error');
  }
});

// 3. RECOVER PASSWORD HANDLER
document.getElementById('recoverForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email = document.getElementById('recoverEmail').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/forgotpassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');

    showAlert('Password reset link sent to your email.', 'success');
    document.getElementById('recoverForm').reset();

  } catch (err) {
    showAlert(err.message, 'error');
  }
});