import { authHeaders, jsonRequest, request } from "./apiClient";

const screeningsPath = "/api/screenings";

export const screeningService = {
  getAll(signal) {
    return request(screeningsPath, { signal });
  },
  create(dto, token) {
    return jsonRequest(screeningsPath, "POST", dto, token);
  },
  update(id, dto, token) {
    return jsonRequest(`${screeningsPath}/${id}`, "PUT", dto, token);
  },
  cancel(id, token) {
    return request(`${screeningsPath}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },
};
