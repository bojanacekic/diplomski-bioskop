export const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;

export const request = async (path, options) =>
  fetch(`${apiUrl}${path}`, options);

export const authHeaders = (token, json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const jsonRequest = (path, method, dto, token) =>
  request(path, {
    method,
    headers: authHeaders(token, true),
    body: JSON.stringify(dto),
  });
