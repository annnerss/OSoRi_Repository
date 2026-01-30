import { apiFetch } from "./http";

export const challengeApi = {
  list: ({ challengeMode } = {}) => {
    const qs = new URLSearchParams({ challengeMode });
    return apiFetch(`/challenges?${qs.toString()}`);
  },

  myList: ({ userId } = {}) => {
    const qs = new URLSearchParams();
    if (userId != null) qs.set("userId", userId);
    const query = qs.toString();
    return apiFetch(`/mychallenges${query ? `?${query}` : ""}`);
  },

  // 참여하기 (시작일 / 종료일 선택)
  join: ({ userId, challengeId, startDate, endDate } = {}) =>
    apiFetch(`/mychallenges`, {
      method: "POST",
      body: { userId, challengeId, startDate, endDate },
  }),

};

