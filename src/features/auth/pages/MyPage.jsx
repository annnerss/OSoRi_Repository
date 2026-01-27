import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";

const MyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.nickName || user?.nickname || user?.userName || "회원";
  const email = user?.email || "";
  const [transactions, setTransactions] = useState([]);

  useEffect(()=> {
    const userId = user?.userId || 0;
    axios.get(`/osori/trans/user/${userId}`)
      .then(response => {
        //에서 사용한 매핑 로직과 동일하게 적용
        const mappedData = response.data.map(item => ({
          amount: Number(item.originalAmount || 0),
          type: item.type || 'OUT'
        }));
        setTransactions(mappedData);
      })
      .catch(error => console.error("마이페이지 데이터 로드 실패:", error));
  }, [user]);

  

  const income = transactions
        .filter(t => t.type?.toUpperCase() === 'IN')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.type?.toUpperCase() === 'OUT')
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const total = income - expense;

  return (
    <main className="fade-in">
      <header className="content-header">
        <h2>마이페이지</h2>
        <p className="welcome-text">{displayName} 님 환영합니다.</p>
      </header>

      <section className="profile-fixed-card">
        <div className="info-card profile-main">
          <div className="profile-section">
            <div className="profile-img">👤</div>
            <div className="profile-details">
              <h3>{displayName}</h3>
              <p>{email}</p>
            </div>
          </div>
          <div className="alarm" style={{ border: "3px solid lightgray" }}>🔔</div>
        </div>
      </section>

      <div className="account-book-grid">
        <div className="info-card"
             onClick={() =>navigate("/mypage/myAccountBook")} 
             style={{ cursor: "pointer" }}
        >
          <div className="card-title-area">
            <h3>🏠 내 가계부</h3>
          </div>
          <div className="account-detail">
            <p className="amount">{total.toLocaleString()}원</p>
            <p className="desc">{expense.toLocaleString()}원</p>
          </div>
        </div>

        <div className="info-card">
          <div className="card-title-area">
            <h3>👨‍👩‍👧‍👦 그룹 가계부</h3>
            <span className="status-dot">2개 운영 중</span>
          </div>
          <div className="account-detail">
            <ul className="sidebar-menu">
              <li>
                <NavLink
                  to="/mypage/groupBudget"
                  className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                >
                  <span>🪙</span> 우리 가족 가계부
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/mypage/myBudget"
                  className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                >
                  <span>🪙</span> 연인과 함께 가계부
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyPage;

// import React from 'react';
// import { NavLink, Outlet, useNavigate } from 'react-router-dom';
// import './MyPage.css';

// const MyPage = () => {
//   const navigate = useNavigate();

//   return (
//       <main className="fade-in">
//         <header className="content-header">
//           <h2>마이페이지</h2>
//         </header>

//         {/* 프로필 카드 */}
//         <section className="profile-fixed-card">
//           <div className="info-card profile-main">
//             <div className="profile-section">
//               <div className="profile-img">👤</div>
//               <div className="profile-details">
//                 <h3>오소리 님</h3>
//                 <p>osori@example.com</p>
//               </div>
//             </div>
//             <div className="alarm" style={{border:"3px solid lightgray"}}>🔔</div>
//           </div>
//         </section>

//         {/* 가계부 섹션 */}
//         <div className="account-book-grid">
//           {/* 개인 가계부 관리 */}
//           <div className="info-card" /* onClick={상세보기 페이지로} */>
//             <div className="card-title-area">
//               <h3>🏠 내 가계부</h3>
//             </div>
//             <div className="account-detail">
//               <p className="amount">예산: 3,420,000원</p>
//               <p className="desc">지금까지 지출: 850,000원</p>
//             </div>
//           </div>

//           {/* 그룹 가계부 관리 */}
//           <div className="info-card">
//             <div className="card-title-area">
//               <h3>👨‍👩‍👧‍👦 그룹 가계부</h3>
//               <span className="status-dot">2개 운영 중</span>
//             </div>
//             <div className="account-detail">
//               {/*map으로 해당 회원의 그룹 가계부 조회 */}
//               <ul className="sidebar-menu">
//                 <li>
//                   <NavLink to="/mypage/groupBudget" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
//                     <span>🪙</span> 우리 가족 가계부
//                   </NavLink>
//                 </li>
//                 <li>
//                   <NavLink to="/mypage/myBudget" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
//                     <span>🪙</span> 연인과 함께 가계부
//                   </NavLink>
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </main>
//   );
// };

// export default MyPage;