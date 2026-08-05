import { authHeaders, jsonRequest, request } from "./apiClient";

const moviesPath = "/api/movies";

export const movieService = {
  getResponse(query = "", signal) {
    return request(`${moviesPath}${query}`, { signal });
  },
  async getAll(query = "", signal) {
    const response = await this.getResponse(query, signal);
    return response.ok
      ? response.json()
      : Promise.reject(new Error("Movies could not be loaded."));
  },
  getById(id, signal) {
    return request(`${moviesPath}/${encodeURIComponent(id)}`, { signal });
  },
  create(dto, token) {
    return jsonRequest(moviesPath, "POST", dto, token);
  },
  update(id, dto, token) {
    return jsonRequest(`${moviesPath}/${id}`, "PUT", dto, token);
  },
  changeStatus(id, dto, token) {
    return jsonRequest(`${moviesPath}/${id}/status`, "PATCH", dto, token);
  },
  withdraw(id, token) {
    return request(`${moviesPath}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },
};
