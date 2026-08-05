import { authHeaders, jsonRequest, request } from "./apiClient";

const hallsPath = "/api/halls";

export const hallService = {
  getAll(query = "", signal) {
    return request(`${hallsPath}${query}`, { signal });
  },
  getById(id, signal) {
    return request(`${hallsPath}/${encodeURIComponent(id)}`, { signal });
  },
  create(dto, token) {
    return jsonRequest(hallsPath, "POST", dto, token);
  },
  update(id, dto, token) {
    return jsonRequest(`${hallsPath}/${id}`, "PUT", dto, token);
  },
  deactivate(id, token) {
    return request(`${hallsPath}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },
};
