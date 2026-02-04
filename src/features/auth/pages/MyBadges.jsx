import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./MyBadges.css";

/**
 * ✅ 기대 데이터 형태(예시)
 * badgeId, badgeName, badgeIconUrl, earnedAt(있으면)
 *
 * badgeIconUrl은 DB에 "/upload/badges/xxx.png" 형태로 저장되어 있다고 가정
 * -> 화면에서는 "http://localhost:8080/osori" + badgeIconUrl 로 붙임
 */

const API_BASE = "http://localhost:8080/osori";

export default function MyBadges() {
  const userId = Number(localStorage.getItem("userId")) || 1; // 네 프로젝트 방식에 맞게 바꿔도 됨

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent"); // recent | name
  const [selected, setSelected] = useState(null);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/badges/${userId}`);
      setBadges(res.data || []);
    } catch (e) {
      console.error("뱃지 조회 실패:", e);
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
    // eslint-disable-next-line
  }, [userId]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    let list = [...badges];
    if (keyword) {
      list = list.filter((b) =>
        String(b.badgeName || "")
          .toLowerCase()
          .includes(keyword)
      );
    }

    // earnedAt이 있으면 최근순을 정확히 정렬 가능
    if (sort === "recent") {
      list.sort((a, b) => {
        const ta = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
        const tb = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
        return tb - ta;
      });
    } else if (sort === "name") {
      list.sort((a, b) => String(a.badgeName || "").localeCompare(String(b.badgeName || ""), "ko"));
    }

    return list;
  }, [badges, q, sort]);

  const totalCount = badges.length;

  return (
    <div className="mybadges-page">
      {/* 헤더 */}
      <div className="mybadges-header">
        <div>
          <h1 className="mybadges-title">내 뱃지</h1>
          <p className="mybadges-subtitle">지금까지 획득한 모든 뱃지를 한눈에 확인해보세요.</p>
        </div>

        <div className="mybadges-stats">
          <div className="stat-card">
            <div className="stat-label">획득한 뱃지</div>
            <div className="stat-value">{totalCount}개</div>
          </div>
          <button className="refresh-btn" onClick={fetchBadges} disabled={loading}>
            새로고침
          </button>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="mybadges-controls">
        <div className="searchbox">
          <span className="search-icon">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="뱃지 이름으로 검색"
            className="search-input"
          />
        </div>

        <div className="control-right">
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">최근 획득순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      </div>

      {/* 바디 */}
      <div className="mybadges-body">
        {loading ? (
          <div className="state-card">
            <div className="spinner" />
            <div className="state-text">뱃지를 불러오는 중...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-card">
            <div className="state-emoji">🏅</div>
            <div className="state-text">
              {q ? "검색 결과가 없어요." : "아직 획득한 뱃지가 없어요."}
            </div>
            <div className="state-sub">챌린지를 성공하면 뱃지를 받을 수 있어요!</div>
          </div>
        ) : (
          <div className="badge-grid">
            {filtered.map((b) => {
              const imgSrc = b.badgeIconUrl ? `${API_BASE}${b.badgeIconUrl}` : "";
              return (
                <button
                  key={`${b.badgeId}-${b.badgeName}`}
                  className="badge-card"
                  onClick={() => setSelected(b)}
                  type="button"
                >
                  <div className="badge-imgwrap">
                    {imgSrc ? (
                      <img
                        className="badge-img"
                        src={imgSrc}
                        alt={b.badgeName}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="badge-fallback">🏅</div>
                    )}
                    <div className="badge-glow" />
                  </div>

                  <div className="badge-meta">
                    <div className="badge-name">{b.badgeName || "이름 없는 뱃지"}</div>
                    {b.earnedAt ? (
                      <div className="badge-date">
                        {new Date(b.earnedAt).toLocaleDateString("ko-KR")}
                      </div>
                    ) : (
                      <div className="badge-date muted">획득일 정보 없음</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 모달 */}
      {selected && (
        <div className="badge-modal" onClick={() => setSelected(null)} role="presentation">
          <div className="badge-modal-card" onClick={(e) => e.stopPropagation()} role="presentation">
            <button className="modal-close" onClick={() => setSelected(null)} type="button">
              ✕
            </button>

            <div className="modal-content">
              <div className="modal-imgwrap">
                {selected.badgeIconUrl ? (
                  <img
                    src={`${API_BASE}${selected.badgeIconUrl}`}
                    alt={selected.badgeName}
                    className="modal-img"
                  />
                ) : (
                  <div className="modal-fallback">🏅</div>
                )}
              </div>

              <div className="modal-text">
                <div className="modal-title">{selected.badgeName}</div>
                <div className="modal-desc">
                  {selected.earnedAt
                    ? `획득일: ${new Date(selected.earnedAt).toLocaleString("ko-KR")}`
                    : "획득일 정보가 없어요."}
                </div>

                <div className="modal-tip">
                  ✨ 챌린지를 많이 성공할수록 더 다양한 뱃지가 쌓여요!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
