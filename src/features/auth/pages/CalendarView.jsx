import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './CalendarView.css'; 

function CalendarView({
  transactions = [], 
  currentDate, 
  setCurrentDate
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [details, setDetails] = useState([]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      // 토요일(6)에 'saturday' 클래스 추가
      if (date.getDay() === 6) return 'saturday';
    }
    return null;
  };

  const handleMonthChange = ({ activeStartDate }) => {
    setCurrentDate(activeStartDate); 
  };

  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = formatDate(date);
      const dayData = transactions.filter(item => item.date === dateString);

      if (dayData.length > 0) {
        const totalIncome = dayData
          .filter(item => item.type === 'INCOME')
          .reduce((sum, item) => sum + item.amount, 0);

        const totalExpense = dayData
          .filter(item => item.type === 'EXPENSE')
          .reduce((sum, item) => sum + item.amount, 0);

        return (
          <div className="amount-container">
            {totalIncome > 0 && <div className="income-tag">+{totalIncome.toLocaleString()}</div>}
            {totalExpense > 0 && <div className="expense-tag">-{totalExpense.toLocaleString()}</div>}
          </div>
        );
      }
    }
    return null;
  };

  const handleDayClick = (date) => {
    const dateString = formatDate(date);
    const dayData = transactions.filter(item => item.date === dateString);
    setSelectedDate(dateString);
    setDetails(dayData);
  };

  return (
    <div className="calendar-page-container">
      <div className="calendar-card">
        <h2 className="calendar-header">📅 오소리 님의 소비 달력</h2>
        <Calendar 
          onClickDay={handleDayClick} 
          tileContent={renderTileContent}
          tileClassName={getTileClassName}
          formatDay={(locale, date) => date.getDate()}
          calendarType="gregory" 
          activeStartDate={currentDate}
          onActiveStartDateChange={handleMonthChange}
        />
      </div>

      <div className="detail-card">
        {selectedDate ? (
          <>
            <h3 className="detail-title">{selectedDate} 내역</h3>
            {details.length > 0 ? (
              <ul className="detail-list">
                {details.map(item => (
                  <li key={item.tran_id} className={`detail-item ${item.type.toLowerCase()}`}>
                    <div className="item-info">
                      <span className="item-category">{item.category}</span>
                      <span className="item-memo">{item.memo}</span>
                    </div>
                    <span className="item-amount">
                      {item.type === 'INCOME' ? '+' : '-'}{item.amount.toLocaleString()}원
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">내역이 없습니다.</p>
            )}
          </>
        ) : (
          <p className="no-data">날짜를 선택해 주세요.</p>
        )}
      </div>
    </div>
  );
}

export default CalendarView;