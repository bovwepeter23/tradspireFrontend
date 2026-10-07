document.addEventListener('DOMContentLoaded', async () => {
  const profileForm = document.getElementById('profileForm');
  const passwordForm = document.getElementById('passwordForm');
  const message = document.querySelector('[data-settings-message]');
  if (!profileForm || !passwordForm || !message) return;

  let token = localStorage.getItem('token');

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  };

  [profileForm, passwordForm].forEach((form) => {
    form.addEventListener('invalid', (event) => {
      event.target.closest('.settings-disclosure')?.setAttribute('open', '');
    }, true);
  });

  const storeUser = (user) => {
    let previous = {};
    try {
      previous = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      localStorage.removeItem('user');
    }
    localStorage.setItem('user', JSON.stringify({ ...previous, ...user }));
  };

  if (!token) {
    setMessage('Sign in to manage your settings.', true);
    profileForm.querySelectorAll('input, button').forEach((control) => { control.disabled = true; });
    passwordForm.querySelectorAll('input, button').forEach((control) => { control.disabled = true; });
    return;
  }

  try {
    const response = await window.TradspireAPI.request('/api/users/profile', { token });
    const user = response.user || {};
    profileForm.elements.namedItem('name').value = user.name || '';
    profileForm.elements.namedItem('email').value = user.email || '';
    Object.entries(user.deliveryAddress || {}).forEach(([field, value]) => {
      const input = profileForm.elements.namedItem(field);
      if (input) input.value = value || '';
    });
    storeUser(user);
  } catch (error) {
    setMessage(error.message || 'Your settings could not be loaded.', true);
  }

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = profileForm.querySelector('[type="submit"]');
    const data = new FormData(profileForm);
    const deliveryAddress = Object.fromEntries(
      ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'region', 'postalCode', 'country']
        .map((field) => [field, data.get(field).trim()])
    );
    button.disabled = true;
    setMessage('Saving settings...');
    try {
      const response = await window.TradspireAPI.request('/api/users/profile', {
        method: 'PUT',
        token,
        body: { name: data.get('name').trim(), deliveryAddress }
      });
      storeUser(response.user || {});
      setMessage('Personal details and delivery address saved.');
    } catch (error) {
      setMessage(error.message || 'Your settings could not be saved.', true);
    } finally {
      button.disabled = false;
    }
  });

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const currentPassword = passwordForm.elements.namedItem('currentPassword').value;
    const newPassword = passwordForm.elements.namedItem('newPassword').value;
    const confirmPassword = passwordForm.elements.namedItem('confirmPassword').value;
    if (newPassword !== confirmPassword) {
      setMessage('The new passwords do not match.', true);
      passwordForm.elements.namedItem('confirmPassword').focus();
      return;
    }

    const button = passwordForm.querySelector('[type="submit"]');
    button.disabled = true;
    setMessage('Updating password...');
    try {
      const response = await window.TradspireAPI.request('/api/users/change-password', {
        method: 'PUT',
        token,
        body: { currentPassword, newPassword }
      });
      if (response.token) {
        token = response.token;
        localStorage.setItem('token', token);
      }
      passwordForm.reset();
      setMessage(response.message || 'Password updated successfully.');
    } catch (error) {
      setMessage(error.message || 'Your password could not be updated.', true);
    } finally {
      button.disabled = false;
    }
  });
});