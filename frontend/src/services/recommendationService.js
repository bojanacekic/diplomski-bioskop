import { authHeaders, request } from "./apiClient";

export const recommendationService = {
  getMine(token) {
    return request("/api/recommendations/me", { headers: authHeaders(token) });
  },
};
