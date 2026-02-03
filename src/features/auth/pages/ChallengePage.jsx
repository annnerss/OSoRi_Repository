
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
  const [rankings, setRankings] = useState({});

  // 참여 모달
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [joinForm, setJoinForm] = useState({ startDate: "", endDate: "" });
  const [joinMsg, setJoinMsg] = useState("");

  const [joinedMap, setJoinedMap] = useState({});

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

  // src/features/auth/pages/ChallengePage.jsx 내 95라인 근처 openHistory 함수

  const openHistory = async () => {
    if (!user?.userId) {
      setHistoryMsg("로그인이 필요함");
      setIsHistoryOpen(true);
      return;
    }

    if (challengeMode === "GROUP" && !selectedGroupId) {
      setHistoryMsg("조회할 그룹 가계부를 선택해주세요.");
      setIsHistoryOpen(true);
      return;
    }

    setHistoryList([]);
    setHistoryMsg("");
    setIsHistoryOpen(true);

    try {
      let data;
      if (challengeMode === "GROUP") {
        data = await challengeApi.groupPastJoinedList(selectedGroupId); 
      } else {
        // 기존 개인 챌린지 로직
        data = await challengeApi.myPastJoinedList({
          userId: user.userId,
          challengeMode,
        });
      }
      
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

const loadMyJoined = async (mode) => {
  if (!user?.userId) return;
  
  setJoinedMap({});
  
  try {
    let data;
    if (mode === "GROUP") {
      if (!selectedGroupId) return;
      data = await challengeApi.groupJoinedList(selectedGroupId); 
    } else {
      data = await challengeApi.myJoinedList({
        userId: user.userId,
        challengeMode: mode,
      });
    }

    const arr = normalizeList(data);
    const map = {};
    
    arr.forEach((row) => {
      const id = row?.challengeId || row?.challenge_id;
      if (!id) return;

      map[String(id)] = {
        status: row?.status,
        startDate: parseDate(row?.startDate || row?.start_date),
        endDate: parseDate(row?.endDate || row?.end_date),
      };
    });

    setJoinedMap(map);
    console.log("최종 구성된 joinedMap:", map);
  } catch (e) {
    console.error("참여 목록 로드 실패", e);
  }
};

//적게 지출하기 챌린지 실시간 순위 로직
const loadRanking = async (challengeId) => {
  try {
    const data = await challengeApi.getGroupRanking(selectedGroupId, challengeId);
    setRankings(prev => ({ ...prev, [challengeId]: data }));
  } catch (e) {
    console.error("순위 로드 실패", e);
  }
};

// 지출 입력 성공 후나 특정 액션 후에 실행되도록 유도
// const refreshData = async () => {
//     await loadMyJoined(challengeMode); // 참여 상태 갱신
//     if (challengeMode === "GROUP" && selectedGroupId) {
//         // 현재 진행 중인 챌린지 ID를 찾아 랭킹 강제 업데이트
//         Object.keys(joinedMap).forEach(id => {
//             if(joinedMap[id].status === 'PROCEEDING') loadRanking(id);
//         });
//     }
// };

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
  const filteredList = useMemo(() => {
  if (challengeMode === "GROUP") {
    if (!selectedGroupId) return []; 

    return list.filter(c => {
      const challengeGroupId = c.groupbId || c.group_id || c.groupId;
    
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

  useEffect(() => {
  if (challengeMode === "GROUP" && groupBudgetList.length > 0 && !selectedGroupId) {
      const firstId = groupBudgetList[0].groupbId || groupBudgetList[0].group_id;
      if (firstId) {
        setSelectedGroupId(firstId);
      }
    }
  }, [challengeMode, groupBudgetList, selectedGroupId]);

  useEffect(() => {
    if (challengeMode === "GROUP") {
      if (selectedGroupId) {
        loadMyJoined("GROUP"); 
      } else {
        setJoinedMap({});
      }
    } else {
      loadMyJoined("PERSONAL");
    }
  }, [challengeMode, selectedGroupId, user?.userId]); 

  useEffect(() => {
    if (challengeMode === "GROUP" && selectedGroupId && Object.keys(joinedMap).length > 0) {
      Object.keys(joinedMap).forEach((id) => {
        if (joinedMap[id]?.status === "PROCEEDING") {
          loadRanking(id);
        }
      });
    }
  }, [joinedMap, challengeMode, selectedGroupId]);

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

  const confirmJoin = async () => {
    if (!selected || !user?.userId) return;
    if (challengeMode === "GROUP" && !selectedGroupId) {
      setJoinMsg("대상 그룹 가계부를 선택해주세요.");
      return;
    }

    try {
      let res;

      if (challengeMode === "GROUP") {
        res = await challengeApi.joinGroup({
          userId: user.userId,
          challengeId: selected.challengeId,
          groupbId: selectedGroupId,
          startDate: joinForm.startDate,
          endDate: joinForm.endDate,
        });
      } else {
        res = await challengeApi.join({
          userId: user.userId,
          challengeId: selected.challengeId,
          startDate: joinForm.startDate,
          endDate: joinForm.endDate,
        });
      }

      setJoinMsg(pickMessage(res));

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
    switch(j.status) {
      case "SUCCESS": return "성공(완료)";
      case "RESERVED": return "참여 예정";
      case "PROCEEDING": return "진행중";
      case "FAILED": return "참여하기";
      default: return "참여중";
    }
  };

  const isJoined = (challengeId) => {
    const j = joinedMap[challengeId];
    if (!j) return false;
    // 실패(FAILED)했거나 성공(SUCCESS)한 챌린지는 다시 참여하기 버튼이 활성화되어야 함
    return j.status === "PROCEEDING" || j.status === "RESERVED" || j.status === "SUCCESS";
  };

  return (
    <main className="fade-in">
      <div className="content-header">
        <div className="challenge-wrap">
          <div className="challenge-head">
            <h2 className="challenge-title">챌린지</h2>
      
            <div className="challenge-sub">
              {displayName} 님, 목표를 정하고 재밌게 절약/관리하는 곳
            </div>
            </div>
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

            <button
              type="button"
              className="challenge-tabBtn challenge-history-btn"
              onClick={openHistory}
            >
              지난 챌린지
            </button>
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

                const j = joinedMap[String(id)];
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
                        <span className="cp-v">{duration === 0 ? "전체" : `${duration}일`}</span>
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

                      {/* 적게 지출하기 실시간 순위 */}
                    {j?.status === "PROCEEDING" && id==='group_reduceZero_competition' && (
                      <div className="cp-ranking-section" style={{
                        marginTop: '15px',
                        padding: '12px',
                        backgroundColor: '#f8fbff',
                        borderRadius: '10px',
                        border: '1px solid #e1e9f5'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50' }}>
                            🏆 실시간 그룹 순위 (지출 적은 순)
                          </span>
                          <button 
                            onClick={() => loadRanking(id)}
                            style={{ fontSize: '11px', color: '#4A90E2', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            새로고침 ↻
                          </button>
                        </div>
                        
                        {rankings[id] && rankings[id].length > 0 ? (
                          <div className="cp-ranking-list">
                            {rankings[id].slice(0, 3).map((rk, idx) => {
                              const isFirst = idx === 0;
                              return (
                                <div key={rk.userId} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 10px',
                                  marginBottom: '4px',
                                  backgroundColor: isFirst ? '#fff' : 'rgba(255,255,255,0.5)',
                                  borderRadius: '8px',
                                  boxShadow: isFirst ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                  border: isFirst ? '1px solid #ffeaa7' : '1px solid #eee'
                                }}>
                                  <span style={{ fontSize: '13px', color: isFirst ? '#d35400' : '#333', fontWeight: isFirst ? 'bold' : 'normal' }}>
                                    {isFirst ? '🥇 ' : `${idx + 1}위. `}
                                    {rk.nickname} {String(rk.userId) === String(user?.userId) && <small style={{color:'#999'}}>(나)</small>}
                                  </span>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: isFirst ? '#e67e22' : '#555' }}>
                                    {Number(rk.totalAmount).toLocaleString()}원
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '10px' }}>
                            아직 집계된 지출 내역이 없습니다.
                          </div>
                        )}
                      </div>
                    )}



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
    </main>
  );
}

