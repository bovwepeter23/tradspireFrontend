(function () {
  const localHosts = ['localhost', '127.0.0.1', '::1'];
  const defaultBaseUrl = localHosts.includes(window.location.hostname)
    ? 'http://localhost:5000'
    : 'https://tradspire-backend.vercel.app';
  const baseUrl = String(window.TRADSPIRE_API_URL || defaultBaseUrl).replace(/\/+$/, '');

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

    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: requestBody
    });
    const responseText = await response.text();
    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        data = { message: responseText };
      }
    }

    if (!response.ok) {
      const error = new Error(data.message || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }

    return data;
  };

  window.TradspireAPI = { baseUrl, request };
})();
