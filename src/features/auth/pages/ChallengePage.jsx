
// src/features/auth/pages/ChallengePage.jsx

import React, { useEffect, useMemo, useState } from "react";
import "./ChallengePage.css";
import "./MyPage.css";
import { challengeApi } from "../../../api/challengeApi.js";
import { useAuth } from "../../../context/AuthContext";
import { useGroupBudgets } from "../../../hooks/useGroupBudgets";


// ✅ mockData 더이상 안씀 (서버가 MYTRANS 기준으로 검증)
// import { transactions } from "../../../Data/mockData";

const getValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
};

export default function ChallengePage() {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    return (
      user?.nickName ||
      user?.nickname ||
      user?.userName ||
      user?.loginId ||
      "회원"
    );
  }, [user]);

  const [challengeMode, setChallengeMode] = useState("PERSONAL");
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const { groupBudgetList = [], isLoading: isGroupLoading } = useGroupBudgets(user?.userId);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // 참여 모달
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [joinForm, setJoinForm] = useState({ startDate: "", endDate: "" });
  const [joinMsg, setJoinMsg] = useState("");

  // ✅ 참여 완료된 챌린지 상태 저장 (버튼/기간 표시용)
  const [joinedMap, setJoinedMap] = useState({});

  // ✅ 지난 챌린지 모달
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyMsg, setHistoryMsg] = useState("");

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  const parseDate = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v.slice(0, 10);
    try {
      return new Date(v).toISOString().slice(0, 10);
    } catch (e) {
      return "";
    }
  };

  const fmtType = (t) => {
    if (t === "IN") return "수입";
    if (t === "OUT") return "지출";
    return t || "-";
  };

  const fmtMode = (m) => {
    if (m === "PERSONAL") return "개인";
    if (m === "GROUP") return "그룹";
    return m || "-";
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const calcEndDate = (startDate, duration) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (Math.max(1, duration) - 1));
    return d.toISOString().slice(0, 10);
  };

  const openJoin = (challenge) => {
    setSelected(challenge);
    const start = todayStr;
    const end = calcEndDate(start, challenge?.duration || 1);
    setJoinForm({ startDate: start, endDate: end });
    setJoinMsg("");
    setIsJoinOpen(true);
  };

  const closeJoin = () => {
    setIsJoinOpen(false);
    setSelected(null);
    setJoinMsg("");
  };

  const openHistory = async () => {
    if (!user?.userId) {
      setHistoryMsg("로그인이 필요함");
      setIsHistoryOpen(true);
      return;
    }
    setHistoryMsg("");
    setIsHistoryOpen(true);

    try {
      const data = await challengeApi.myPastJoinedList({
        userId: user.userId,
        challengeMode,
      });
      setHistoryList(normalizeList(data));
    } catch (e) {
      setHistoryMsg(e?.message || "지난 챌린지 목록을 불러오지 못했음");
      setHistoryList([]);
    }
  };

  const closeHistory = () => {
    setIsHistoryOpen(false);
    setHistoryList([]);
    setHistoryMsg("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJoinForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadList = async (mode) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await challengeApi.list({ challengeMode: mode });
      setList(normalizeList(data));
    } catch (e) {
      setErrorMsg("챌린지 목록을 불러오지 못했음");
    } finally {
      setIsLoading(false);
    }
  };

  // ChallengePage.jsx 내 loadMyJoined 함수

  // ChallengePage.jsx

  const loadMyJoined = async (mode) => {
    if (!user?.userId) return;
    
    // ✅ 1. 가계부 전환 시 이전 데이터 잔상을 확실히 지우기 위해 초기화
    setJoinedMap({});
    
    try {
      let data;
      if (mode === "GROUP") {
        // ✅ 2. 그룹 모드일 때 선택된 가계부 ID가 없으면 실행 중단
        if (!selectedGroupId) return;
        
        // API 호출 시 selectedGroupId를 확실히 전달 (서버의 SELECT WHERE 절에 사용됨)
        data = await challengeApi.groupJoinedList(selectedGroupId); 
      } else {
        // 개인 모드 기존 로직 유지
        data = await challengeApi.myJoinedList({
          userId: user.userId,
          challengeMode: mode,
        });
      }

      const arr = normalizeList(data);
      const map = {};
      
      arr.forEach((row) => {
        // ✅ 3. 서버 응답 객체의 challengeId 필드명 확인 (Java DTO와 매칭)
        const id = row?.challengeId || row?.challenge_id;
        if (!id) return;

        // ✅ 4. 현재 선택된 가계부 ID와 일치하는 데이터만 맵에 저장 (프론트 2차 검증)
        // 서버에서 이미 필터링해서 주겠지만, 안전을 위해 로직 추가 가능
        if (mode === "GROUP" && String(row?.groupbId) !== String(selectedGroupId)) return;

        map[id] = {
          status: row?.status, // DB에 저장된 'PROCEEDING' 등
          startDate: parseDate(row?.startDate),
          endDate: parseDate(row?.endDate),
        };
      });

      setJoinedMap(map);
    } catch (e) {
      console.error("참여 목록 로드 실패", e);
    }
  };

  // const loadMyJoined = async (mode) => {
  //   if (!user?.userId) return;
  //   try {
  //     const data = await challengeApi.myJoinedList({
  //       userId: user.userId,
  //       challengeMode: mode,
  //     });
  //     const arr = normalizeList(data);
  //     const map = {};
  //     arr.forEach((row) => {
  //       const id = row?.challengeId || row?.challenge_id;
  //       if (!id) return;
  //       map[id] = {
  //         status: row?.status,
  //         startDate: parseDate(row?.startDate),
  //         endDate: parseDate(row?.endDate),
  //       };
  //     });
  //     setJoinedMap(map);
  //   } catch (e) {
  //     // 실패해도 화면은 떠야 하니 무시
  //   }
  // };


  // 그룹가계부
  // ❌ 기존 로직: selectedGroupId가 null이면 아무것도 안 나옴
  // ✅ 수정 로직: 그룹 모드일 때, ID가 있으면 필터링하고 없으면 전체를 보여주거나 첫 번째 그룹으로 유도

  const filteredList = useMemo(() => {
  if (challengeMode === "GROUP") {
    // 1. 선택된 가계부 ID가 없으면 아무것도 안 보여줌
    if (!selectedGroupId) return []; 

    return list.filter(c => {
      // 💡 현재 로그상 데이터에 groupbId가 없으므로, 
      // 만약 데이터에 ID가 없다면 '모든 가계부 공용'으로 간주하여 true를 반환하거나
      // 실제 데이터의 필드명을 다시 확인해야 합니다.
      const challengeGroupId = c.groupbId || c.group_id || c.groupId;
      
      // 만약 데이터에 그룹 정보가 아예 없다면(null/undefined), 
      // 일단 모든 가계부에서 보이도록 설정하여 화면 노출을 확인합니다.
      if (challengeGroupId === undefined || challengeGroupId === null) return true;
      
      return String(challengeGroupId) === String(selectedGroupId);
    });
  }
  return list; 
}, [list, challengeMode, selectedGroupId]);

  useEffect(() => {
    loadList(challengeMode); 
    loadMyJoined(challengeMode);

    if (challengeMode !== "GROUP") {
      setSelectedGroupId(null);
    }
  }, [challengeMode, user?.userId]);

  //그룹챌린지 탭 클릭 시 기본으로 첫번째 가계부 띄워주기
  useEffect(() => {
  // 그룹 모드이고, 가계부 리스트는 있는데, 아직 선택된 ID가 없다면 실행
  if (challengeMode === "GROUP" && groupBudgetList.length > 0 && !selectedGroupId) {
      // 첫 번째 가계부의 ID 추출 (DB 필드명에 따라 groupbId 또는 id 확인)
      const firstId = groupBudgetList[0].groupbId || groupBudgetList[0].group_id;
      if (firstId) {
        setSelectedGroupId(firstId);
      }
    }
  }, [challengeMode, groupBudgetList, selectedGroupId]);

  // ChallengePage.jsx 내 useEffect 부분
useEffect(() => {
  if (challengeMode === "GROUP") {
    if (selectedGroupId) {
      // 선택된 가계부가 있을 때만 해당 가계부의 참여 목록을 가져옴
      loadMyJoined("GROUP"); 
    } else {
      // 선택된 가계부가 없으면 참여 정보를 초기화하여 겹침 방지
      setJoinedMap({});
    }
  } else {
    loadMyJoined("PERSONAL");
  }
}, [challengeMode, selectedGroupId, user?.userId]); // selectedGroupId가 바뀔 때마다 실행



  // const getJoinLabel = (challengeId) => {
  //   const j = joinedMap[challengeId];
  //   if (!j) return "참여하기";
  //   if (j.status === "RESERVED") return "참여 예정";
  //   if (j.status === "PROCEEDING") return "진행중";
  //   if (j.status === "SUCCESS") return "성공";
  //   if (j.status === "FAILED") return "실패";
  //   return "참여중";
  // };

  // const isJoined = (challengeId) => !!joinedMap[challengeId];

  const pickMessage = (res) => {
    if (res == null) return "참여 완료";
    if (typeof res === "string") return res;
    if (typeof res === "object") {
      return (
        res?.message ||
        res?.msg ||
        res?.data?.message ||
        res?.data?.msg ||
        "참여 완료"
      );
    }
    return "참여 완료";
  };

  const pickErrorMessage = (e) => {
    return (
      e?.message ||
      e?.response?.data?.message ||
      e?.response?.data?.msg ||
      e?.data?.message ||
      "참여 실패"
    );
  };

  // ChallengePage.jsx 수정안

// ChallengePage.jsx

  const confirmJoin = async () => {
    if (!selected || !user?.userId) return;

    // 그룹 모드인데 가계부가 선택되지 않은 경우 방어 로직
    if (challengeMode === "GROUP" && !selectedGroupId) {
      setJoinMsg("대상 그룹 가계부를 선택해주세요.");
      return;
    }

    try {
      let res;

      if (challengeMode === "GROUP") {
        // ✅ [분기 1] 그룹 챌린지 참여 호출
        // groupChall 테이블 등록을 위해 groupbId를 반드시 포함합니다.
        res = await challengeApi.joinGroup({
          userId: user.userId,
          challengeId: selected.challengeId,
          groupbId: selectedGroupId,
          startDate: joinForm.startDate,
          endDate: joinForm.endDate,
        });
      } else {
        // ✅ [분기 2] 개인 챌린지 참여 호출
        res = await challengeApi.join({
          userId: user.userId,
          challengeId: selected.challengeId,
          startDate: joinForm.startDate,
          endDate: joinForm.endDate,
        });
      }

      setJoinMsg(pickMessage(res));

      // 2. 상태 업데이트를 위해 목록 재조회 및 모달 닫기
      setTimeout(async () => {
        await loadMyJoined(challengeMode); 
        closeJoin();
      }, 1500); 

    } catch (e) {
      console.error("참여 처리 중 에러 발생:", e);
      setJoinMsg(pickErrorMessage(e));
    }
  };

// const confirmJoin = async () => {
//   if (!selected || !user?.userId) return;

//   try {
//     // 1. 서버에 참여 요청
//     const res = await challengeApi.join({
//       userId: user.userId,
//       challengeId: selected.challengeId,
//       startDate: joinForm.startDate,
//       endDate: joinForm.endDate,
//     });

//     setJoinMsg(pickMessage(res));

//     // 2. ✅ 서버의 스케줄러가 상태를 바꿀 시간을 조금 더 줍니다 (1.5초)
//     // 그 후 내 참여 목록을 다시 불러와서 'FAILED' 혹은 'PROCEEDING' 상태를 UI에 반영합니다.
//     setTimeout(async () => {
//       await loadMyJoined(challengeMode); // 서버에서 최신 상태 다시 조회
//       closeJoin();
//     }, 1500); 

//   } catch (e) {
//     setJoinMsg(pickErrorMessage(e));
//   }
// };

  // getJoinLabel 함수 보강
  const getJoinLabel = (challengeId) => {
    const j = joinedMap[challengeId];
    // 맵에 데이터가 없으면 다시 참여 가능한 상태로 간주
    if (!j) return "참여하기"; 
    
    // if (j.status === "RESERVED") return "참여 예정";
    // if (j.status === "PROCEEDING") return "진행중";
    // if (j.status === "SUCCESS") return "성공";
    // if (j.status === "FAILED") return "실패";
    // return "참여중";
    switch(j.status) {
      case "SUCCESS": return "성공(완료)"; // 성공 시 문구 변경
      case "RESERVED": return "참여 예정";
      case "PROCEEDING": return "진행중";
      case "FAILED": return "참여하기"; // 실패 시 재도전 허용 (원치 않으시면 SUCCESS처럼 처리)
      default: return "참여중";
    }
  };

  // isJoined 판단 로직 수정
  // FAILED가 된 챌린지는 다시 '참여하기'가 뜨도록 하려면 status 체크가 필요합니다.
  const isJoined = (challengeId) => {
    const j = joinedMap[challengeId];
    if (!j) return false;
    // 실패(FAILED)했거나 성공(SUCCESS)한 챌린지는 다시 참여하기 버튼이 활성화되어야 함
    return j.status === "PROCEEDING" || j.status === "RESERVED" || j.status === "SUCCESS";
  };

  return (
    <div className="challenge-wrap">
      <div className="challenge-head">
        <h2 className="challenge-title">챌린지</h2>
        <div className="challenge-sub">
          {displayName} 님, 목표를 정하고 재밌게 절약/관리하는 곳
        </div>

        <div className="challenge-tab">
          <button
            className={`challenge-tabBtn ${
              challengeMode === "PERSONAL" ? "active" : ""
            }`}
            onClick={() => setChallengeMode("PERSONAL")}
          >
            개인 챌린지
          </button>
          <button
            className={`challenge-tabBtn ${
              challengeMode === "GROUP" ? "active" : ""
            }`}
            onClick={() => setChallengeMode("GROUP")}
          >
            그룹 챌린지
          </button>

          {/* ✅ 오른쪽에 "지난 챌린지" 버튼 추가 */}
          <button
            type="button"
            className="challenge-tabBtn challenge-history-btn"
            onClick={openHistory}
          >
            지난 챌린지
          </button>
        </div>
      </div>

      <div className="challenge-body">
        {isLoading && <div className="challenge-empty">불러오는 중...</div>}
        {!isLoading && errorMsg && (
          <div className="challenge-empty">{errorMsg}</div>
        )}
        {!isLoading && !errorMsg && list?.length === 0 && (
          <div className="challenge-empty">챌린지가 없음</div>
        )}

        {challengeMode === "GROUP" && groupBudgetList.length > 0 && (
          <div className="group-selection-area" style={{ marginBottom: '20px', padding: '10px' }}>
            <p style={{ fontSize: '14px', marginBottom: '8px', color: '#666' }}>대상 그룹 가계부 선택:</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {groupBudgetList.map((gb) => (
                <button
                  key={gb.groupbId}
                  onClick={() => setSelectedGroupId(gb.groupbId)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: selectedGroupId === gb.groupbId ? '#2c3e50' : '#fff',
                    color: selectedGroupId === gb.groupbId ? '#fff' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  {gb.title}
                </button>
              ))}
            </div>
          </div>
        )}

       

        {!isLoading && !errorMsg && filteredList?.length > 0 && (
          <div className="challenge-list">
            {filteredList.map((c) => {
              const id = c?.challengeId ?? c?.challenge_id;
              const desc = c?.description ?? c?.desc;
              const category = c?.category;
              const type = c?.type;
              const duration = c?.duration;
              const target = c?.target;
              const targetCount = c?.targetCount ?? c?.target_count;

              const j = joinedMap[id];
              const startDate = j?.startDate;
              const endDate = j?.endDate;

              return (
                <article key={String(id) + desc} className="cp-card">
                  <div className="cp-cardTop">
                    <div className="cp-badge">{fmtMode(challengeMode)}</div>
                    <div className="cp-id">{id}</div>
                  </div>
                  <p>
                    {challengeMode === "GROUP" && selectedGroupId && (
                      <span style={{ fontSize: '11px', color: '#4A90E2', fontWeight: 'bold' }}>
                        {/* groupBudgetList의 요소(g)가 가진 ID 필드명을 확인하세요 (groupbId인지 id인지) */}
                        [ {groupBudgetList.find(g => String(g.groupbId || g.id) === String(selectedGroupId))?.title || "선택된 가계부"} ] 대상
                      </span>
                    )}
                  </p>


                  <div className="cp-desc">{desc}</div>

                  <div className="cp-meta">
                    <div className="cp-metaRow">
                      <span className="cp-k">카테고리</span>
                      <span className="cp-v">{category || "전체"}</span>
                    </div>
                    <div className="cp-metaRow">
                      <span className="cp-k">구분</span>
                      <span className="cp-v">{fmtType(type)}</span>
                    </div>
                    <div className="cp-metaRow">
                      <span className="cp-k">기간</span>
                      <span className="cp-v">{duration}일</span>
                    </div>

                    {targetCount ? (
                      <div className="cp-metaRow">
                        <span className="cp-k">목표</span>
                        <span className="cp-v">{targetCount}회 이하</span>
                      </div>
                    ) : (
                      <div className="cp-metaRow">
                        <span className="cp-k">목표</span>
                        <span className="cp-v">
                          {target?.toLocaleString?.() || target}원 이하
                        </span>
                      </div>
                    )}
                  </div>

                  {startDate && endDate && (
                    <div className="cp-dates">
                      <div className="cp-date">
                        시작날짜({startDate}) ~ 종료날짜({endDate})
                      </div>
                    </div>
                  )}

                  <div className="cp-actions">
                    <button
                      className={`cp-joinBtn ${isJoined(id) ? "disabled" : ""}`}
                      onClick={() => {
                        if (isJoined(id)) return;
                        openJoin(c);
                      }}
                      disabled={isJoined(id)}
                    >
                      {getJoinLabel(id)}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 참여 모달 */}
      {isJoinOpen && selected && (
        <div className="ch-modalOverlay" onClick={closeJoin}>
          <div className="ch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ch-modalTitle">챌린지 참여</div>
            <div className="ch-modalDesc">
              <div className="ch-modalDescStrong">{selected?.description}</div>
              <div className="ch-modalDescSub">기간 {selected?.duration}일</div>
            </div>

            <div className="ch-form">
              <div className="ch-field">
                <label>시작일</label>
                <input
                  type="date"
                  name="startDate"
                  value={joinForm.startDate}
                  onChange={(e) => {
                    handleChange(e);
                    const v = e.target.value;
                    const end = calcEndDate(v, selected?.duration || 1);
                    setJoinForm((prev) => ({
                      ...prev,
                      startDate: v,
                      endDate: end,
                    }));
                  }}
                />
              </div>
              <div className="ch-field">
                <label>종료일</label>
                <input
                  type="date"
                  name="endDate"
                  value={joinForm.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {joinMsg && <div className="ch-msg">{joinMsg}</div>}

            <div className="ch-actions">
              <button className="ch-btn ghost" onClick={closeJoin}>
                취소
              </button>
              <button className="ch-btn primary" onClick={confirmJoin}>
                참여 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 지난 챌린지 모달 */}
      {isHistoryOpen && (
        <div className="ch-modalOverlay" onClick={closeHistory}>
          <div
            className="ch-modal ch-modal--history"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ch-modalTitle">지난 챌린지</div>

            {historyMsg && <div className="ch-msg">{historyMsg}</div>}

            {!historyMsg && historyList?.length === 0 && (
              <div className="challenge-empty">지난 챌린지가 없음</div>
            )}

            {!historyMsg && historyList?.length > 0 && (
              <div className="ch-historyList">
                {historyList.map((h) => {
                  const status = h?.status;
                  const statusCls =
                    status === "SUCCESS"
                      ? "success"
                      : status === "FAILED"
                      ? "failed"
                      : "";
                  return (
                    <div
                      key={`${h?.challengeId}-${h?.startDate}-${h?.endDate}`}
                      className="ch-historyItem"
                    >
                      <div className="ch-historyTop">
                        <div className="ch-historyTitle">{h?.description}</div>
                        <div className={`ch-historyStatus ${statusCls}`}>
                          {status === "SUCCESS"
                            ? "성공"
                            : status === "FAILED"
                            ? "실패"
                            : status}
                        </div>
                      </div>

                      <div className="ch-historyMeta">
                        <div>카테고리: {h?.category || "전체"}</div>
                        <div>구분: {fmtType(h?.type)}</div>
                        <div>기간: {h?.duration}일</div>
                        {h?.targetCount ? (
                          <div>목표: {h?.targetCount}회 이하</div>
                        ) : (
                          <div>
                            목표:{" "}
                            {(h?.target || 0).toLocaleString?.() || h?.target}원
                            이하
                          </div>
                        )}
                      </div>

                      <div className="ch-historyDate">
                        시작날짜({parseDate(h?.startDate)}) ~ 종료날짜(
                        {parseDate(h?.endDate)})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="ch-actions">
              <button className="ch-btn primary" onClick={closeHistory}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

