import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';import MainPage from './components/common/MainPage'
import MyPageLayout from './features/auth/pages/MyPageLayout';
import MyPage from './features/auth/pages/MyPage';
import CalendarView from './features/auth/pages/CalendarView';
import MyBadges from './features/auth/pages/MyBadges';
import ProfileSettings from './features/auth/pages/ProfileSettings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/mypage" element={<MyPageLayout />}>
          {/* /mypage 접속 시 기본으로 자산관리 페이지를 보여줌 */}
          <Route index element={<MyPage />} /> 
          <Route path="assets" element={<MyPage />} />
          <Route path="calendarView" element={<CalendarView />} />
          <Route path="myBadges" element={<MyBadges />} />
          <Route path="profileSettings" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App;
