// 테스트용
// import React, { useEffect, useMemo, useState } from "react";
// import "./ChallengePage.css";
// import "./MyPage.css";
// import { challengeApi } from "../../../api/challengeApi.js";
// import { useAuth } from "../../../context/AuthContext";
// import { useGroupBudgets } from "../../../hooks/useGroupBudgets.js";

// export default function ChallengePage() {
//   const { user } = useAuth();

//   const displayName = useMemo(() => {
//     return (
//       user?.nickName ||
//       user?.nickname ||
//       user?.userName ||
//       user?.loginId ||
//       "회원"
//     );
//   }, [user]);

//   const { 
//     groupBudgetList, 
//     isLoading: isGroupLoading, 
//     fetchGroupBudgetList 
//   } = useGroupBudgets(user?.userId);

//   const [challengeMode, setChallengeMode] = useState("PERSONAL");
//   const [list, setList] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState("");

//   // 참여 모달
//   const [isJoinOpen, setIsJoinOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [joinForm, setJoinForm] = useState({ startDate: "", endDate: "" });
//   const [joinMsg, setJoinMsg] = useState("");

//   // ✅ 참여 완료된 챌린지 상태 저장 (버튼/기간 표시용)
//   const [joinedMap, setJoinedMap] = useState({});

//   const normalizeList = (data) => {
//     if (Array.isArray(data)) return data;
//     if (Array.isArray(data?.list)) return data.list;
//     if (Array.isArray(data?.data)) return data.data;
//     if (Array.isArray(data?.result)) return data.result;
//     return [];
//   };

//   const fetchChallenges = async () => {
//     setIsLoading(true);
//     setErrorMsg("");
//     try {
//       const data = await challengeApi.list({ challengeMode });
//       setList(normalizeList(data));
//     } catch (err) {
//       console.error(err);
//       setList([]);
//       setErrorMsg("챌린지 목록 조회 실패");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchChallenges();
//   }, [challengeMode]);

//   const get = (obj, ...keys) => {
//     for (const k of keys) {
//       if (obj && obj[k] != null) return obj[k];
//     }
//     return null;
//   };

//   const fmtType = (type) => {
//     switch (type) {
//       case "EXPENSE":
//         return "지출";
//       case "INCOME":
//         return "수입";
//       default:
//         return type;
//     }
//   };

//   const fmtDays = (days) => `${days}일`;

//   const toYMD = (d) => {
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `${yyyy}-${mm}-${dd}`;
//   };

//   const addDays = (ymd, add) => {
//     const d = new Date(ymd);
//     d.setDate(d.getDate() + add);
//     return toYMD(d);
//   };

//   // startDate 기준으로 상태 결정 (테스트용 UI 표시)
//   const calcJoinLabel = (startDate) => {
//     const today = toYMD(new Date());
//     return startDate > today ? "참여 예정" : "진행중";
//   };

//   const openJoin = (challenge) => {
//     const duration = Number(challenge?.duration || 0);
//     const today = toYMD(new Date());
//     const end = duration > 0 ? addDays(today, duration - 1) : today;

//     setSelected(challenge);
//     setJoinForm({ startDate: today, endDate: end });
//     setJoinMsg("");
//     setIsJoinOpen(true);
//   };

//   const closeJoin = () => {
//     setIsJoinOpen(false);
//     setSelected(null);
//     setJoinMsg("");
//   };

//   // ✅ 테스트용: 서버 호출 없이 버튼/기간만 먼저 반영
//   const submitJoin = async () => {
//     if (!user?.userId) {
//       alert("로그인이 필요함");
//       return;
//     }
//     if (!selected?.challengeId) {
//       alert("challengeId가 없음 (목록 데이터 확인 필요)");
//       return;
//     }
//     if (!joinForm.startDate || !joinForm.endDate) {
//       setJoinMsg("시작일/종료일을 입력해야 함");
//       return;
//     }

//     // 프론트 1차 검증: 기간이 duration과 맞는지
//     const duration = Number(selected?.duration || 0);
//     if (duration > 0) {
//       const s = new Date(joinForm.startDate);
//       const e = new Date(joinForm.endDate);
//       const days = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
//       if (days !== duration) {
//         setJoinMsg(`기간은 ${duration}일로 맞춰야 함`);
//         return;
//       }
//     }

//     // ✅ 서버 호출 안 함(테스트용)
//     const label = calcJoinLabel(joinForm.startDate);
//     setJoinedMap((prev) => ({
//       ...prev,
//       [selected.challengeId]: {
//         startDate: joinForm.startDate,
//         endDate: joinForm.endDate,
//         status: label === "참여 예정" ? "RESERVED" : "PROCEEDING",
//       },
//     }));

//     closeJoin();
//   };

//   return (
//     <main className="challenge-page">
//       <div className="challenge-header">
//         <h2>챌린지</h2>
//         <p>{displayName} 님, 목표를 정하고 재미있게 절약/관리하는 곳</p>

//         <div className="challenge-tab">
//           <button
//             className={challengeMode === "PERSONAL" ? "active" : ""}
//             onClick={() => setChallengeMode("PERSONAL")}
//           >
//             개인 챌린지
//           </button>
//           <button
//             className={challengeMode === "GROUP" ? "active" : ""}
//             onClick={() => setChallengeMode("GROUP")}
//           >
//             그룹 챌린지
//           </button>
//         </div>
//       </div>

//       <div className="challenge-list-wrapper">
//         <section className="challenge-list">
//           {isLoading && <p>불러오는 중...</p>}
//           {errorMsg && <p className="error">{errorMsg}</p>}

//           {list.map((c) => {
//             const id = get(c, "challengeId", "challenge_id", "id", "_id", "ID");
//             const desc = get(c, "description", "desc", "title", "name");
//             const category = get(c, "category");
//             const type = get(c, "type");
//             const duration = get(c, "duration", "days");

//             const normalized = {
//               challengeId: id,
//               description: desc,
//               category,
//               type,
//               duration: Number(duration || 0),
//               raw: c,
//             };

//             const joined = joinedMap?.[id];
//             const joinBtnText = joined
//               ? calcJoinLabel(joined.startDate)
//               : "참여하기";

//             const periodText = joined
//               ? `시작날짜(${joined.startDate}) ~ 종료날짜(${joined.endDate})`
//               : "";

//             return (
//               <article
//                 key={String(id) + desc}
//                 className={`challenge-list-item ${
//                   challengeMode === "GROUP" ? "group" : "personal"
//                 }`}
//               >
//                 {/* ✅ 왼쪽 영역 */}
//                 <div className="challenge-item-left">
//                   <div className="challenge-title">{desc}</div>

//                   <div className="challenge-info">
//                     <span>카테고리: {category || "전체"}</span>
//                     <span>구분: {fmtType(type)}</span>
//                     <span>기간: {fmtDays(duration)}</span>
//                   </div>

//                   {/* ✅ 여기로 내림: 왼쪽 빈 공간(화살표 방향)으로 확실히 감 */}
//                   {joined && (
//                     <div className="challenge-period-left">{periodText}</div>
//                   )}
//                 </div>

//                 {/* ✅ 오른쪽 버튼 영역 */}
//                 <div className="challenge-item-right">
//                   <button
//                     type="button"
//                     className={`challenge-join-btn ${joined ? "joined" : ""}`}
//                     onClick={() => openJoin(normalized)}
//                     disabled={!!joined}
//                     title={joined ? "이미 참여한 챌린지(테스트 반영됨)" : "참여하기"}
//                   >
//                     {joinBtnText}
//                   </button>
//                 </div>
//               </article>
//             );
//           })}
//         </section>
//       </div>

//       {/* 참여하기 모달 */}
//       {isJoinOpen && (
//         <div className="ch-modalOverlay" onMouseDown={closeJoin}>
//           <div className="ch-modal" onMouseDown={(e) => e.stopPropagation()}>
//             <div className="ch-modalHeader">
//               <h3>챌린지 참여</h3>
//               <button className="ch-x" onClick={closeJoin}>
//                 ×
//               </button>
//             </div>

//             <div className="ch-modalBody">
//               <div className="ch-row">
//                 <span className="ch-k">챌린지 ID</span>
//                 <span className="ch-v">{selected?.challengeId}</span>
//               </div>
//               <div className="ch-row">
//                 <span className="ch-k">내용</span>
//                 <span className="ch-v">{selected?.description}</span>
//               </div>
//               <div className="ch-row">
//                 <span className="ch-k">기간</span>
//                 <span className="ch-v">{fmtDays(selected?.duration)}</span>
//               </div>

//               <div className="ch-form">
//                 <label className="ch-label">
//                   시작일
//                   <input
//                     type="date"
//                     value={joinForm.startDate}
//                     onChange={(e) => {
//                       const startDate = e.target.value;
//                       const duration = Number(selected?.duration || 0);
//                       const endDate =
//                         duration > 0
//                           ? addDays(startDate, duration - 1)
//                           : joinForm.endDate;
//                       setJoinForm((p) => ({ ...p, startDate, endDate }));
//                       setJoinMsg("");
//                     }}
//                   />
//                 </label>

//                 <label className="ch-label">
//                   종료일
//                   <input
//                     type="date"
//                     value={joinForm.endDate}
//                     onChange={(e) => {
//                       setJoinForm((p) => ({ ...p, endDate: e.target.value }));
//                       setJoinMsg("");
//                     }}
//                   />
//                 </label>
//               </div>

//               {joinMsg && <p className="ch-msg">{joinMsg}</p>}
//             </div>

//             <div className="ch-modalFooter">
//               <button className="ch-btn ghost" onClick={closeJoin}>
//                 취소
//               </button>
//               <button className="ch-btn primary" onClick={submitJoin}>
//                 참여 확정
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }


//실전용 (api 호출)

import React, { useEffect, useMemo, useState } from "react";
import "./ChallengePage.css";
import "./MyPage.css";
import { challengeApi } from "../../../api/challengeApi.js";
import { useAuth } from "../../../context/AuthContext";
import { useGroupBudgets } from "../../../hooks/useGroupBudgets";

export default function ChallengePage() {
  const { user } = useAuth();

  const { 
    groupBudgetList, 
    isLoading: isGroupLoading, 
    fetchGroupBudgetList 
  } = useGroupBudgets(user?.userId);

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
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 참여 모달
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [joinForm, setJoinForm] = useState({ startDate: "", endDate: "" });
  const [joinMsg, setJoinMsg] = useState("");

  // ✅ 참여 완료된 챌린지 상태 저장 (버튼/기간 표시용)
  const [joinedMap, setJoinedMap] = useState({});

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
    if (challengeMode === "GROUP") {
      fetchGroupBudgetList();
    }else{
      setSelectedGroupId(null);
    }
    fetchChallenges();
  }, [challengeMode]);

  useEffect(() => {
    if (challengeMode === "GROUP" && groupBudgetList.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groupBudgetList[0].groupbId);
    }
  }, [groupBudgetList, challengeMode]);

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

  const toYMD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const addDays = (ymd, add) => {
    const d = new Date(ymd);
    d.setDate(d.getDate() + add);
    return toYMD(d);
  };

  // startDate 기준으로 상태 결정 (표시용)
  const calcJoinLabel = (startDate) => {
    const today = toYMD(new Date());
    return startDate > today ? "참여 예정" : "진행중";
  };

  const openJoin = (challenge) => {
    const duration = Number(challenge?.duration || 0);
    const today = toYMD(new Date());
    const end = duration > 0 ? addDays(today, duration - 1) : today;

    setSelected(challenge);
    setJoinForm({ startDate: today, endDate: end });
    setJoinMsg("");
    setIsJoinOpen(true);
  };

  const closeJoin = () => {
    setIsJoinOpen(false);
    setSelected(null);
    setJoinMsg("");
  };

  // ✅ 실전용: 서버 호출해서 참여 등록
  const submitJoin = async () => {
    if (!user?.userId) {
      alert("로그인이 필요함");
      return;
    }
    if (!selected?.challengeId) {
      alert("challengeId가 없음 (목록 데이터 확인 필요)");
      return;
    }
    if (!joinForm.startDate || !joinForm.endDate) {
      setJoinMsg("시작일/종료일을 입력해야 함");
      return;
    }

    // 프론트 1차 검증: 기간이 duration과 맞는지
    const duration = Number(selected?.duration || 0);
    if (duration > 0) {
      const s = new Date(joinForm.startDate);
      const e = new Date(joinForm.endDate);
      const days = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
      if (days !== duration) {
        setJoinMsg(`기간은 ${duration}일로 맞춰야 함`);
        return;
      }
    }

    try {
      setJoinMsg("");

      // ✅ 서버 호출
      const res = await challengeApi.join({
        userId: user.userId,
        challengeId: selected.challengeId,
        startDate: joinForm.startDate,
        endDate: joinForm.endDate,
       ...(challengeMode === "GROUP" && {groupbId: selectedGroupId})
      });

      // ✅ 서버 응답에 값이 있으면 우선 사용, 없으면 내가 보낸 값 사용
      const startDate =
        res?.startDate || res?.data?.startDate || joinForm.startDate;
      const endDate = res?.endDate || res?.data?.endDate || joinForm.endDate;

      // 서버가 status를 주면 그걸 쓰고, 없으면 계산해서 넣음
      const serverStatus = res?.status || res?.data?.status;
      const computedLabel = calcJoinLabel(startDate);
      const status =
        serverStatus ||
        (computedLabel === "참여 예정" ? "RESERVED" : "PROCEEDING");

      // ✅ UI 반영
      setJoinedMap((prev) => ({
        ...prev,
        [selected.challengeId]: { startDate, endDate, status },
      }));

      closeJoin();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "챌린지 참여 실패";
      setJoinMsg(msg);
      // 실패면 joinedMap에 안 들어가니까 자동으로 "참여하기" 유지됨
    }
  };

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

      <div className="challenge-list-wrapper">
        <section className="challenge-list">
          {isLoading && <p>불러오는 중...</p>}
          {errorMsg && <p className="error">{errorMsg}</p>}
          
          {/*그룹챌린지일 때 */}
          {challengeMode === "GROUP" && (
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

          {list.map((c) => {
            const id = get(c, "challengeId", "challenge_id", "id", "_id", "ID");
            const desc = get(c, "description", "desc", "title", "name");
            const category = get(c, "category");
            const type = get(c, "type");
            const duration = get(c, "duration", "days");

            const normalized = {
              challengeId: id,
              description: desc,
              category,
              type,
              duration: Number(duration || 0),
              raw: c,
            };

            const joined = joinedMap?.[id];
            const joinBtnText = joined
              ? calcJoinLabel(joined.startDate)
              : "참여하기";

            const periodText = joined
              ? `시작날짜(${joined.startDate}) ~ 종료날짜(${joined.endDate})`
              : "";

            return (
              <article
                key={String(id) + desc} 
                className={`challenge-list-item ${challengeMode.toLowerCase()}`}
              >
                <div className="challenge-item-left">
                  {/* 그룹가계부일 경우 */}
                  {challengeMode === "GROUP" && selectedGroupId && (
                    <span style={{ fontSize: '11px', color: '#4A90E2', fontWeight: 'bold' }}>
                      [ {groupBudgetList.find(g => g.groupbId === selectedGroupId)?.title} ] 그룹 가계부 대상
                    </span>
                  )}

                  <div className="challenge-title">{desc}</div>

                  <div className="challenge-info">
                    <span>카테고리: {category || "전체"}</span>
                    <span>구분: {fmtType(type)}</span>
                    <span>기간: {fmtDays(duration)}</span>
                  </div>

                  {joined && (
                    <div className="challenge-period-left">{periodText}</div>
                  )}
                </div>

                <div className="challenge-item-right">
                  <button
                    type="button"
                    className={`challenge-join-btn ${joined ? "joined" : ""}`}
                    onClick={() => openJoin(normalized)}
                    disabled={!!joined}
                    title={joined ? "이미 참여한 챌린지" : "참여하기"}
                  >
                    {joinBtnText}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {isJoinOpen && (
        <div className="ch-modalOverlay" onMouseDown={closeJoin}>
          <div className="ch-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ch-modalHeader">
              <h3>챌린지 참여</h3>
              <button className="ch-x" onClick={closeJoin}>
                ×
              </button>
            </div>

            <div className="ch-modalBody">
              <div className="ch-row">
                <span className="ch-k">챌린지 ID</span>
                <span className="ch-v">{selected?.challengeId}</span>
              </div>
              <div className="ch-row">
                <span className="ch-k">내용</span>
                <span className="ch-v">{selected?.description}</span>
              </div>
              <div className="ch-row">
                <span className="ch-k">기간</span>
                <span className="ch-v">{fmtDays(selected?.duration)}</span>
              </div>

              <div className="ch-form">
                <label className="ch-label">
                  시작일
                  <input
                    type="date"
                    value={joinForm.startDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const duration = Number(selected?.duration || 0);
                      const endDate =
                        duration > 0
                          ? addDays(startDate, duration - 1)
                          : joinForm.endDate;
                      setJoinForm((p) => ({ ...p, startDate, endDate }));
                      setJoinMsg("");
                    }}
                  />
                </label>

                <label className="ch-label">
                  종료일
                  <input
                    type="date"
                    value={joinForm.endDate}
                    onChange={(e) => {
                      setJoinForm((p) => ({ ...p, endDate: e.target.value }));
                      setJoinMsg("");
                    }}
                  />
                </label>
              </div>

              {joinMsg && <p className="ch-msg">{joinMsg}</p>}
            </div>

            <div className="ch-modalFooter">
              <button className="ch-btn ghost" onClick={closeJoin}>
                취소
              </button>
              <button className="ch-btn primary" onClick={submitJoin}>
                참여 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

