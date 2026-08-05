import { jsonRequest } from "./apiClient";

export const supportService = {
  sendMessage(dto) {
    return jsonRequest("/api/support/chat", "POST", dto);
  },
};
