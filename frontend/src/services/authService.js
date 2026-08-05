import { jsonRequest, request } from "./apiClient";

const authPath = "/api/auth";

export const authService = {
  authenticate(registering, dto) {
    return jsonRequest(
      `${authPath}/${registering ? "register" : "login"}`,
      "POST",
      dto,
    );
  },
  forgotPassword(dto) {
    return jsonRequest(`${authPath}/forgot-password`, "POST", dto);
  },
  resetPassword(dto) {
    return jsonRequest(`${authPath}/reset-password`, "POST", dto);
  },
  getGatewayHealth(signal) {
    return request("/health", { cache: "no-store", signal });
  },
};
