import { authHeaders, jsonRequest, request } from "./apiClient";

const reservationsPath = "/api/reservations";

export const reservationService = {
  getMine(token) {
    return request(`${reservationsPath}/me`, { headers: authHeaders(token) });
  },
  getAll(token) {
    return request(reservationsPath, { headers: authHeaders(token) });
  },
  getReservedSeats(screeningId, token) {
    return request(`${reservationsPath}/screenings/${screeningId}/seats`, {
      headers: authHeaders(token),
    });
  },
  create(dto, token) {
    return jsonRequest(reservationsPath, "POST", dto, token);
  },
  cancel(id, token) {
    return request(`${reservationsPath}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },
  requestCashPayment(id, token) {
    return request(`${reservationsPath}/${id}/cash-payment`, {
      method: "PUT",
      headers: authHeaders(token),
    });
  },
};
