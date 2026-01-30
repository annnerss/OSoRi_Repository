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
};

