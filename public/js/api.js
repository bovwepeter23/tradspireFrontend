(function () {
  const localHosts = ['localhost', '127.0.0.1', '::1'];
  const apiScriptUrl = document.currentScript?.src;
  const defaultBaseUrl = localHosts.includes(window.location.hostname)
    ? 'http://localhost:5000'
    : 'https://tradspire-backend.vercel.app';
  const baseUrl = String(window.TRADSPIRE_API_URL || defaultBaseUrl).replace(/\/+$/, '');
  const toastContainer = () => {
    let container = document.querySelector('[data-api-toast-container]');
    if (!container) {
      container = document.createElement('div');
      container.className = 'api-toast-container';
      container.dataset.apiToastContainer = '';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-relevant', 'additions');
      document.body.append(container);
    }
    return container;
  };

  const showToast = (message, isError = false) => {
    const toast = document.createElement('div');
    toast.className = `api-toast${isError ? ' api-toast-error' : ' api-toast-success'}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    toastContainer().append(toast);
    window.setTimeout(() => toast.remove(), 5000);
  };

  if (apiScriptUrl) {
    const toastStylesheet = document.createElement('link');
    toastStylesheet.rel = 'stylesheet';
    toastStylesheet.href = new URL('../css/toast.css', apiScriptUrl).href;
    document.head.append(toastStylesheet);
  }

  const request = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    const body = options.body;
    const isFormData = body instanceof FormData;
    let requestBody = body;

    if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
    headers.set('Accept', 'application/json');

    if (body !== undefined && body !== null && !isFormData && typeof body !== 'string') {
      headers.set('Content-Type', 'application/json');
      requestBody = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: options.method || 'GET',
        headers,
        body: requestBody
      });
    } catch (error) {
      showToast(error.message || 'Unable to connect to the service.', true);
      throw error;
    }
    const responseText = await response.text();
    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        data = { message: responseText };
      }
    }

    const responseMessage = data && typeof data === 'object' && data.message;
    if (!response.ok) {
      const message = responseMessage || `Request failed (${response.status})`;
      showToast(message, true);
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    showToast(responseMessage || 'Request completed successfully.');
    return data;
  };

  window.TradspireAPI = { baseUrl, request };
})();
