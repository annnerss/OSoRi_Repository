import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; //
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './CalendarView.css'; 

function CalendarView({ currentDate, setCurrentDate }) {
  const { user } = useAuth(); //
  const [ledgers, setLedgers] = useState([]); // 동적 가계부 목록
  const [transactions, setTransactions] = useState([]); // 실제 거래 데이터
  const [activeLedgers, setActiveLedgers] = useState(['personal']); // 선택된 필터
  const [selectedDate, setSelectedDate] = useState(null);

  const userId = user?.userId || 1; //

  // 1. [핵심] 참여 중인 그룹 목록을 가져와서 필터 바 생성
  useEffect(() => {
    axios.get(`/osori/group/user/${userId}`) //
      .then(res => {
        const personal = { id: 'personal', name: '내 가계부', color: '#0066ff' };
        // DB의 GROUPB_ID와 TITLE을 가계부 포맷으로 매핑
        const groups = res.data.map((g, idx) => ({
          id: String(g.groupbId),
          name: g.title,
          color: ['#ff9f43', '#ee5253', '#10ac84', '#5f27cd'][idx % 4] // 그룹별 색상 랜덤 지정
        }));
        const combined = [personal, ...groups];
        setLedgers(combined);
        setActiveLedgers(combined.map(l => l.id)); // 초기값: 전체 선택
      })
      .catch(err => console.error("그룹 목록 로드 실패:", err));
  }, [userId]);

  // 2. 선택된 가계부들에 대한 통합 데이터 호출 (로직은 프로젝트 구조에 따라 확장 가능)
  useEffect(() => {
    // 여기에서 activeLedgers에 포함된 ID들의 데이터를 가져오는 API 호출 필요
    // 현재는 기존처럼 개인 데이터를 기본으로 가져오는 예시입니다.
    axios.get(`/osori/trans/user/${userId}`) //
      .then(res => setTransactions(res.data))
      .catch(err => console.error(err));
  }, [userId]);

  // --- 기존 필터링 및 렌더링 로직 (데이터 키 이름은 DB에 맞게 수정) ---

  const isAllSelected = activeLedgers.length === ledgers.length;

  const toggleAll = () => {
    setActiveLedgers(isAllSelected ? [] : ledgers.map(l => l.id));
  };

  const toggleLedger = (id) => {
    setActiveLedgers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  // 필터링된 데이터 계산 (DB 필드명인 transDate, amount, type 기준)
  const filteredData = useMemo(() => {
    return transactions.filter(item => {
      const ledgerId = item.groupbId ? String(item.groupbId) : 'personal';
      return activeLedgers.includes(ledgerId);
    });
  }, [transactions, activeLedgers]);

  // 날짜별 수입/지출 합계 표시 (달력 타일)
  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayData = filteredData.filter(item => item.transDate === dateString);
      
      if (dayData.length > 0) {
        const income = dayData.filter(i => i.type === 'IN').reduce((s, i) => s + (i.originalAmount || i.amount), 0);
        const expense = dayData.filter(i => i.type === 'OUT').reduce((s, i) => s + (i.originalAmount || i.amount), 0);
        
        return (
          <div className="amount-container">
            {income > 0 && <div className="income-tag">+{income.toLocaleString()}</div>}
            {expense > 0 && <div className="expense-tag">-{expense.toLocaleString()}</div>}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <main className="fade-in">
      <div className="calendar-page-container">
        {/* 상단 가계부 필터 바: 이제 DB에서 가져온 그룹들이 뜹니다! */}
        <div className="ledger-filter-bar">
          <label className="filter-chip all-filter">
            <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
            <span className="chip-name">전체</span>
          </label>
          <div className="divider"></div>
          {ledgers.map(l => (
            <label key={l.id} className="filter-chip">
              <input type="checkbox" checked={activeLedgers.includes(l.id)} onChange={() => toggleLedger(l.id)} />
              <span className="dot" style={{ backgroundColor: l.color }}></span>
              <span className="chip-name">{l.name}</span>
            </label>
          ))}
        </div>

        <div className="calendar-content-wrapper">
          <div className="calendar-card">
            <h2 className="calendar-header">📅 {user.nickName}님의 소비 달력</h2>
            <Calendar 
              onClickDay={(date) => setSelectedDate(date.toISOString().split('T')[0])} 
              tileContent={renderTileContent}
              formatDay={(locale, date) => date.getDate()}
              calendarType="gregory" 
              activeStartDate={currentDate}
              onActiveStartDateChange={({activeStartDate}) => setCurrentDate(activeStartDate)}
            />
          </div>
          {/* 하단 상세 내역 카드는 filteredData를 사용하여 표시 */}
        </div>
      </div>
    </main>
  );
}

export default CalendarView;