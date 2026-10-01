document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const passwordInput = document.getElementById('newPassword');
  const confirmInput = document.getElementById('confirmPassword');
  const alertBox = document.getElementById('alertBox');
  const submitButton = document.getElementById('submitButton');
  const loginLink = document.getElementById('loginLink');
  const token = new URLSearchParams(window.location.search).get('token');

  const showAlert = (message, type = 'error') => {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
  };

  if (!token) {
    form.hidden = true;
    showAlert('This password reset link is missing its token. Request a new link and try again.');
    loginLink.hidden = false;
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertBox.className = 'alert-box hidden';

    if (passwordInput.value !== confirmInput.value) {
      showAlert('The passwords do not match.');
      confirmInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Updating password...';

    try {
      const result = await window.TradspireAPI.request(
        `/api/users/reset-password/${encodeURIComponent(token)}`,
        { method: 'POST', body: { password: passwordInput.value } }
      );

      form.hidden = true;
      showAlert(result.message || 'Password reset successfully. You can now sign in.', 'success');
      loginLink.hidden = false;
    } catch (error) {
      showAlert(error.message || 'Unable to reset your password. Request a new link and try again.');
      submitButton.disabled = false;
      submitButton.textContent = 'Update password';
    }
  });
});