export const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;

export const request = async (path, options) => fetch(`${apiUrl}${path}`, options);
