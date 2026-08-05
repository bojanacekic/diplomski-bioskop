import { authHeaders, jsonRequest, request } from "./apiClient";

const ticketsPath = "/api/tickets";

export const ticketService = {
  getMine(token) {
    return request(`${ticketsPath}/me`, { headers: authHeaders(token) });
  },
  getAll(token) {
    return request(ticketsPath, { headers: authHeaders(token) });
  },
  purchase(dto, token) {
    return jsonRequest(ticketsPath, "POST", dto, token);
  },
  purchaseAtBoxOffice(dto, token) {
    return jsonRequest(`${ticketsPath}/box-office`, "POST", dto, token);
  },
  cancel(id, token) {
    return request(`${ticketsPath}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },
  validate(dto, token) {
    return jsonRequest(`${ticketsPath}/validate-entry`, "POST", dto, token);
  },
  downloadDocument(id, type, token) {
    return request(`${ticketsPath}/${id}/${type}`, {
      headers: authHeaders(token),
    });
  },
};
