document.addEventListener('DOMContentLoaded', async () => {
  const message = document.querySelector('[data-profile-message]');
  if (!message) return;

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  };

  const renderUser = (user) => {
    document.querySelectorAll('[data-account-field]').forEach((field) => {
      const value = field.dataset.accountField.split('.').reduce((current, key) => current?.[key], user);
      field.textContent = value || 'Not provided';
    });
  };

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    localStorage.removeItem('user');
  }
  renderUser(user);

  const token = localStorage.getItem('token');
  if (!token) {
    setMessage('Sign in to view your account details.', true);
    return;
  }

  try {
    const response = await window.TradspireAPI.request('/api/users/profile', { token });
    user = response.user || user;
    localStorage.setItem('user', JSON.stringify({ ...user }));
    renderUser(user);
    setMessage('Account details are up to date.');
  } catch (error) {
    setMessage(error.message || 'Your account details could not be loaded.', true);
  }
});