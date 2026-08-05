import { authHeaders, jsonRequest, request } from "./apiClient";

const usersPath = "/api/users";

export const userService = {
  getMyProfile(token) {
    return request(`${usersPath}/me`, { headers: authHeaders(token) });
  },
  updateMyProfile(dto, token) {
    return jsonRequest(`${usersPath}/me`, "PUT", dto, token);
  },
  changeMyPassword(dto, token) {
    return jsonRequest(`${usersPath}/me/password`, "PUT", dto, token);
  },
  search(search, token) {
    return request(`${usersPath}?search=${encodeURIComponent(search)}`, {
      headers: authHeaders(token),
    });
  },
  update(id, dto, token) {
    return jsonRequest(`${usersPath}/${id}`, "PUT", dto, token);
  },
  changeRole(id, dto, token) {
    return jsonRequest(`${usersPath}/${id}/role`, "PATCH", dto, token);
  },
  deactivate(id, token) {
    return request(`${usersPath}/${id}/deactivate`, {
      method: "PATCH",
      headers: authHeaders(token),
    });
  },
  activate(id, token) {
    return request(`${usersPath}/${id}/activate`, {
      method: "PATCH",
      headers: authHeaders(token),
    });
  },
  getReservationCustomer(id, token) {
    return request(`${usersPath}/${id}/reservation-customer`, {
      headers: authHeaders(token),
    });
  },
};
