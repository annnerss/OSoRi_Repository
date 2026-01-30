import React, { useEffect, useMemo, useState } from "react";
import "./ChallengePage.css";
import "./MyPage.css";
import { challengeApi } from "../../../api/challengeApi.js";
import { useAuth } from "../../../context/AuthContext";
import { useGroupBudgets } from "../../../hooks/useGroupBudgets.js";

export default function ChallengePage() {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    return user?.nickName || user?.nickname || user?.userName || user?.loginId || "회원";
  }, [user]);

  const { 
    groupBudgetList, 
    isLoading: isGroupLoading, 
    fetchGroupBudgetList 
  } = useGroupBudgets(user?.userId);

  const [challengeMode, setChallengeMode] = useState("PERSONAL");
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  const fetchChallenges = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await challengeApi.list({ challengeMode });
      setList(normalizeList(data));
    } catch (err) {
      console.error(err);
      setList([]);
      setErrorMsg("챌린지 목록 조회 실패");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [challengeMode]);

  const get = (obj, ...keys) => {
    for (const k of keys) {
      if (obj && obj[k] != null) return obj[k];
    }
    return null;
  };

  const fmtType = (type) => {
    switch (type) {
      case "EXPENSE":
        return "지출";
      case "INCOME":
        return "수입";
      default:
        return type;
    }
  };

  const fmtDays = (days) => `${days}일`;

  return (
    <main className="challenge-page">
      <div className="challenge-header">
        <h2>챌린지</h2>
        <p>{displayName} 님, 목표를 정하고 재미있게 절약/관리하는 곳</p>
        <div className="challenge-tab">
          <button
            className={challengeMode === "PERSONAL" ? "active" : ""}
            onClick={() => setChallengeMode("PERSONAL")}
          >
            개인 챌린지
          </button>
          <button
            className={challengeMode === "GROUP" ? "active" : ""}
            onClick={() => setChallengeMode("GROUP")}
          >
            그룹 챌린지
          </button>
        </div>
      </div>

      {/* ✅ 챌린지 전체 감싸는 네모 박스 */}
      <div className="challenge-list-wrapper">
        <section className="challenge-list">
          {isLoading && <p>불러오는 중...</p>}
          {errorMsg && <p className="error">{errorMsg}</p>}

          {list.map((c) => {
            const id = get(c, "id", "_id", "ID");
            const desc = get(c, "description", "desc", "title", "name");
            const category = get(c, "category");
            const type = get(c, "type");
            const duration = get(c, "duration", "days");

            return (
              <article
                key={String(id) + desc}
                className={`challenge-list-item ${
                  challengeMode === "GROUP" ? "group" : "personal"
                }`}
              >
                <div className="challenge-item-left">
                  <div className="challenge-title">{desc}</div>
                  <div className="challenge-info">
                    <span>카테고리: {category || "전체"}</span>
                    <span>구분: {fmtType(type)}</span>
                    <span>기간: {fmtDays(duration)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="challenge-join-btn"
                  onClick={() => alert("참여 API는 백엔드 연결하면 붙이면 됨")}
                >
                  참여하기
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

