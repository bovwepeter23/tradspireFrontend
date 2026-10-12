document.querySelectorAll('[data-password-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    if (!input) return;

    const showPassword = input.type === 'password';
    input.type = showPassword ? 'text' : 'password';
    button.textContent = showPassword ? 'Hide' : 'Show';
    button.setAttribute('aria-label', `${showPassword ? 'Hide' : 'Show'} password`);
    button.setAttribute('aria-pressed', String(showPassword));
  });
});