document.addEventListener('DOMContentLoaded', async () => {
  const message = document.querySelector('[data-profile-message]');
  if (!message) return;

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  };

  const renderUser = (user) => {
    const address = user.deliveryAddress || {};
    const displayUser = {
      ...user,
      deliveryAddress: {
        fullName: address.fullName || address.recipientName || user.name || '',
        recipientName: address.recipientName || address.fullName || user.name || '',
        phone: address.phone || '',
        addressLine1: address.addressLine1 || address.street || '',
        street: address.street || address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        region: address.region || '',
        postalCode: address.postalCode || '',
        country: address.country || 'Nigeria',
        instructions: address.instructions || ''
      }
    };
    document.querySelectorAll('[data-account-field]').forEach((field) => {
      const value = field.dataset.accountField.split('.').reduce((current, key) => current?.[key], displayUser);
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
    const profileUser = response.data?.user || response.user || {};
    user = {
      ...user,
      ...profileUser,
      deliveryAddress: {
        ...(user.deliveryAddress || {}),
        ...(profileUser.deliveryAddress || {})
      }
    };
    localStorage.setItem('user', JSON.stringify({ ...user }));
    renderUser(user);
    setMessage('Account details are up to date.');
  } catch (error) {
    setMessage(error.message || 'Your account details could not be loaded.', true);
  }
});