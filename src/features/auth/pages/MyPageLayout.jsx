import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './MyPage.css';

const MyPageLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="mypage-container">
      {/* 1. 고정 사이드바 */}
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate('/')} style={{cursor:'pointer', padding: '0 20px 30px'}}>
          OSORI
        </div>
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/mypage/assets" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span>💰</span> 자산관리
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/calendarView" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span>📅</span> 캘린더뷰
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/myBadges" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span>🏆</span> 내 뱃지
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/profileSettings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span>⚙️</span> 프로필 설정
            </NavLink>
          </li>
        </ul>
        
        <button className="logout-btn" onClick={() => navigate('/')}>로그아웃</button>
      </aside>

      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MyPageLayout;