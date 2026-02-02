
import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import { useState,useRef } from "react";
import { faqApi } from "../../../api/faqApi";


const MyPageLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const scrollRef = useRef();
  const [isFaqModalOpen,setIsFaqModalOpen] =useState(false);
  const [faqList, setFaqList] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      message: '반가워요! 😊 똑똑한 돈 관리, 무엇부터 도와드릴까요?'
    }
  ]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  //faq 리스트 불러오기
  const fetchFaqList = async()=>{
      try{
        const data = await faqApi.faqList();

        setFaqList(data);
      }catch(error){
        console.error('FAQ 질문 목록 조회 실패',error);
        navigate('/mypage');    
      }
  }

  useEffect(() => {
  if (isFaqModalOpen) {
    fetchFaqList();
    setMessages([{
      id: 'welcome',
      type: 'bot',
      message: '반가워요! 😊 똑똑한 돈 관리, 무엇부터 도와드릴까요?'
    }]);
  }
}, [isFaqModalOpen]);

  const handleQuestionClick = (faqId) => {
  // 해당 질문과 답변 데이터
  const selectedFaq = faqList.find(item => item.faqId === faqId);
  
  if (!selectedFaq) return;

  const userMsg = { id: Date.now(), type: 'user', message: selectedFaq.question };
  setMessages(prev => [...prev, userMsg]);

  setTimeout(() => {
    const botMsg = { id: Date.now() + 1, type: 'bot', message: selectedFaq.answer };
    setMessages(prev => [...prev, botMsg]);
  }, 600); // 0.6초 뒤에 답변 등장
};


  return (
    <div className="mypage-container">
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer", padding: "0 20px 30px" }}>
          OSORI
        </div>

        <ul className="sidebar-menu">
          <li>
            <NavLink to="/mypage/assets" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>💰</span> 자산관리
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/calendarView" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>📅</span> 캘린더뷰
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/myBadges" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>🏆</span> 내 뱃지
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/profileSettings" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>⚙️</span> 프로필 설정
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/mypage/fixedTrans"
              className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
            >
              <span>📌</span> 고정지출
            </NavLink>
          </li>

          <li>
            <NavLink to="/mypage/challenge" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>🎯</span> 챌린지
            </NavLink>
          </li>

        </ul>

        <div className="faq-container">
          {isFaqModalOpen && (
            <div className="faq-dropdown">
              <h4 style={{ textAlign: "center", marginBottom: "15px" }}>FAQ</h4>
              
              {/* 채팅 영역 */}
              <div className="faq-chat-area" ref={scrollRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-row ${msg.type}`}>
                    <div className="chat-bubble">
                      {msg.message}
                    </div>
                  </div>
                ))}

                {/* 질문 선택 버튼 영역 */}
                {messages[messages.length - 1]?.type === 'bot' && (
                  <div className="question-list-area">
                    {faqList.length === 0 ? (
                      <p className="empty-msg">등록되어 있는 FAQ가 없습니다.</p>
                    ) : (
                      faqList.map((faq) => (
                        <button 
                          key={faq.faqId} 
                          className="faq-item-btn"
                          onClick={() => handleQuestionClick(faq.faqId)}
                        >
                          {faq.question}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <img className="qBot" 
            src="https://img.icons8.com/?size=100&id=f6ABPUNqMjFa&format=png&color=0066ff" 
            alt="질문봇 이미지"
            onClick={() => setIsFaqModalOpen(!isFaqModalOpen)}
          />
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </aside>

      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MyPageLayout;
