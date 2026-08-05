import { authHeaders, jsonRequest, request } from "./apiClient";

const ratingsPath = "/api/ratings";

export const ratingService = {
  getMine(token) {
    return request(`${ratingsPath}/me`, { headers: authHeaders(token) });
  },
  getAverages(signal) {
    return request(`${ratingsPath}/averages`, { signal });
  },
  rate(dto, token) {
    return jsonRequest(ratingsPath, "POST", dto, token);
  },
};
