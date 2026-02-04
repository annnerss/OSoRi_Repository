import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./MyBadges.css";

const API_BASE = "http://localhost:8080/osori";

/**
 * 기대 응답(예시)
 * [
 *  {
 *    badgeId, badgeName, badgeIconUrl,
 *    challengeMode: "PERSONAL" | "GROUP",
 *    challengeName,
 *    earnedAt,
 *    groupbName // 그룹일 때만
 *  }
 * ]
 */
export default function MyBadges() {
  const userId = Number(localStorage.getItem("userId")) || 1;

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      // ✅ 너 프로젝트의 뱃지 전체 조회 엔드포인트에 맞춰서 수정
      // 예: /api/badges/{userId} 가 "전체(개인+그룹)"를 내려준다는 가정
      const res = await axios.get(`${API_BASE}/api/badges/${userId}`);
      setBadges(Array.isArray(res.data) ? res.data : []);

    // api 호출 콘솔주석
      console.log("badges raw:", res.data);


    } catch (e) {
      console.error("뱃지 목록 조회 실패:", e);
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
    // eslint-disable-next-line
  }, [userId]);

  const { personalBadges, groupBadges } = useMemo(() => {
    const getMode = (b) =>
      (b.challengeMode || b.challenge_mode || b.mode || "").toString().toUpperCase();

    const personal = [];
    const group = [];

    for (const b of badges) {
    const challengeId = b.challengeId ?? b.CHALLENGE_ID ?? b.challenge_id;
    if (challengeId) group.push(b);
    else personal.push(b);
    }


    // 최근 발급일이 먼저 오게 정렬 (있을 때만)
    const getTime = (b) => {
      const v = b.earnedAt || b.issuedAt || b.createdAt || b.earned_at || b.issued_at;
      return v ? new Date(v).getTime() : 0;
    };

    personal.sort((a, b) => getTime(b) - getTime(a));
    group.sort((a, b) => getTime(b) - getTime(a));

    return { personalBadges: personal, groupBadges: group };
  }, [badges]);

  const renderBadgeCard = (b) => {
  const iconUrl = b.badgeIconUrl || b.badge_icon_url || "";
  const imgSrc = iconUrl ? `${API_BASE}${iconUrl}` : "";

  // ✅ 그룹/개인 분리 기준: BADGE.CHALLENGE_ID가 있으면 그룹
  const isGroupBadge = b.challengeId != null; // (백엔드에서 alias로 challengeId 내려준다는 가정)

  // ✅ 카드 제목: CHALLENGES.DESCRIPTION 우선, 없으면 badgeName (A_newbie 대비)
  const title =
    b.badgeId === 1
      ? "아기 오소리(회원가입)"
      : (b.challengeDesc || b.challenge_desc || b.badgeName || b.badge_name || "뱃지");

  // ✅ 발급일: USERBADGE.EARNED_AT
  const earnedRaw = b.earnedAt || b.earned_at;
  const earnedText = earnedRaw
    ? new Date(earnedText).toLocaleDateString("ko-KR")
    : "발급일 정보 없음";

  // ✅ 그룹 가계부명: GROUPBUDGET.TITLE
  const groupTitle = b.groupBudgetTitle || b.group_budget_title;

  return (
    <div className="badgecard" key={`${b.badgeId || b.badge_id}-${earnedRaw || ""}`}>
      <div className="badgecard-left">
        <div className={`badge-imgwrap ${isGroupBadge ? "is-group" : "is-personal"}`}>
          {imgSrc ? (
            <img className="badge-img" src={imgSrc} alt={title} />
          ) : (
            <div className="badge-fallback">🏅</div>
          )}
        </div>
      </div>

      <div className="badgecard-right">
        <div className="badgecard-toprow">
          {/* ✅ 뱃지이름 자리: description */}
          <div className="badge-name">{title}</div>

          <span className={`badge-pill ${isGroupBadge ? "pill-group" : "pill-personal"}`}>
            {isGroupBadge ? "그룹" : "개인"}
          </span>
        </div>

        <div className="badge-meta">
          {/* ✅ 그룹일 때만 가계부 표시 */}
          {isGroupBadge && (
            <div className="meta-line">
              <span className="meta-label">가계부</span>
              <span className="meta-value">{groupTitle || "가계부 정보 없음"}</span>
            </div>
          )}

          <div className="meta-line">
            <span className="meta-label">발급일</span>
            <span className="meta-value">{earnedText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


  const renderSection = (title, subtitle, list, isGroup) => (
    <section className="badge-section">
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-sub">{subtitle}</p>
        </div>
        <div className="section-count">{list.length}개</div>
      </div>

      {list.length === 0 ? (
        <div className="empty-card">
          <div className="empty-emoji">{isGroup ? "👥" : "👤"}</div>
          <div className="empty-title">{isGroup ? "아직 그룹 뱃지가 없어요." : "아직 개인 뱃지가 없어요."}</div>
          <div className="empty-sub">챌린지를 성공하면 뱃지가 여기에 쌓여요!</div>
        </div>
      ) : (
        <div className="badge-list">
          {list.map((b) => renderBadgeCard(b, isGroup))}
        </div>
      )}
    </section>
  );

  return (
    <main className="fade-in">
        <div className="mybadges-page">
        <div className="mybadges-header">
            <div>
            <h1 className="mybadges-title">내 뱃지</h1>
            <p className="mybadges-subtitle">
                개인/그룹 챌린지에서 획득한 뱃지를 분리해서 보여드려요.
            </p>
            </div>
        </div>

        {loading ? (
            <div className="state-card">
            <div className="spinner" />
            <div className="state-text">뱃지 정보를 불러오는 중...</div>
            </div>
        ) : (
            <>
            {/* ✅ 상단: 개인 */}
            {renderSection(
                "개인 뱃지",
                "혼자서 꾸준히 챌린지 달성! 기록이 쌓일수록 뱃지도 늘어나요.",
                personalBadges,
                false
            )}

            {/* ✅ 하단: 그룹 */}
            {renderSection(
                "그룹 뱃지",
                "함께 도전해서 성공했을 때 받는 뱃지예요. 어떤 가계부에서 받았는지도 확인해요.",
                groupBadges,
                true
            )}
            </>
        )}
        </div>
    </main>
  );
}
