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

  const normalizeDeliveryAddress = (address = {}, fallbackName = '') => {
    const fullName = address.fullName || address.recipientName || fallbackName || '';
    const addressLine1 = address.addressLine1 || address.street || '';
    return {
      fullName,
      recipientName: fullName,
      phone: address.phone || '',
      addressLine1,
      street: addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      region: address.region || '',
      postalCode: address.postalCode || '',
      country: address.country || 'Nigeria',
      instructions: address.instructions || ''
    };
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
  const userFromResponse = (response) => response?.data?.user || response?.user || {};
  const addressFieldsForForm = (address = {}, accountName = '') => normalizeDeliveryAddress(address, accountName);

  if (!token) {
    setMessage('Sign in to manage your settings.', true);
    profileForm.querySelectorAll('input, button').forEach((control) => { control.disabled = true; });
    passwordForm.querySelectorAll('input, button').forEach((control) => { control.disabled = true; });
    return;
  }

  try {
    const response = await window.TradspireAPI.request('/api/users/profile', { token });
    const user = userFromResponse(response);
    profileForm.elements.namedItem('name').value = user.name || '';
    profileForm.elements.namedItem('email').value = user.email || '';
    Object.entries(addressFieldsForForm(user.deliveryAddress, user.name)).forEach(([field, value]) => {
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
    const name = data.get('name').trim();
    const recipientName = data.get('fullName').trim() || name;
    const street = data.get('addressLine1').trim();
    const phone = data.get('phone').trim();
    const city = data.get('city').trim();
    const country = data.get('country').trim() || 'Nigeria';
    const deliveryAddress = normalizeDeliveryAddress({
      fullName: recipientName,
      recipientName,
      phone,
      addressLine1: street,
      street,
      city,
      country,
      region: data.get('region').trim(),
      postalCode: data.get('postalCode').trim(),
      addressLine2: data.get('addressLine2').trim(),
      instructions: data.get('instructions').trim()
    }, name);
    button.disabled = true;
    setMessage('Saving settings...');
    try {
      const response = await window.TradspireAPI.request('/api/users/profile', {
        method: 'PUT',
        token,
        body: { name, deliveryAddress }
      });
      const user = userFromResponse(response);
      storeUser({
        ...user,
        name: user.name || name,
        deliveryAddress: normalizeDeliveryAddress(user.deliveryAddress || deliveryAddress, user.name || name)
      });
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