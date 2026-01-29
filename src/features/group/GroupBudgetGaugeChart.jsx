import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function GroupBudgetGauge({ transactions = [], groupbId, monthlyBudget, currentDate }) {
  if (!currentDate || !(currentDate instanceof Date)) return null;

  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const targetYM = `${targetYear}-${targetMonth}`;
  
  const currentSpent = transactions
    .filter(t => 
      String(t.groupbId) === String(groupbId) && 
      t.type?.toUpperCase() === 'OUT' && 
      t.date?.startsWith(targetYM)
    )
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  // 1. 초과 금액 및 예측치 계산
  const overAmount = currentSpent - monthlyBudget; // 초과액 계산
  const lastDay = new Date(targetYear, currentDate.getMonth() + 1, 0).getDate();
  const today = new Date();
  const dayPassed = today.getMonth() === currentDate.getMonth() ? today.getDate() : lastDay;
  const projected = dayPassed > 0 ? Math.round((currentSpent / dayPassed) * lastDay) : currentSpent;
  
  const percent = monthlyBudget > 0 ? Math.round((currentSpent / monthlyBudget) * 100) : 0;

  const getStatusColor = (pct) => {
    if (pct >= 90) return '#ff4d4f';
    if (pct >= 80) return '#fa8c16'; 
    if (pct >= 70) return '#fadb14'; 
    return '#52c41a'; 
  };

  const mainColor = getStatusColor(percent);

  const data = {
    labels: ['현재 사용액', '잔액'],
    datasets: [{
      data: [currentSpent, Math.max(0, monthlyBudget - currentSpent)],
      backgroundColor: [mainColor, '#f0f2f5'],
      circumference: 180,
      rotation: 270,
      borderWidth: 0,
      cutout: '80%',
      borderRadius: 5
    }]
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw.toLocaleString()}원`
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="info-card">
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>🎯 예산 달성률</h3>
      <div style={{ height: '180px', position: 'relative' }}>
        <Doughnut data={data} options={options} />
        <div style={{ 
            position: 'absolute', top: '70%', left: '50%', 
            transform: 'translate(-50%, -50%)', textAlign: 'center' 
        }}>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: mainColor }}>
            {percent}%
          </span>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
            {currentSpent.toLocaleString()}원 / {monthlyBudget.toLocaleString()}원
          </p>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        padding: '12px', 
        borderRadius: '12px', 
        background: `${mainColor}10`,
        border: `1px solid ${mainColor}40`
      }}>
        <p style={{ color: mainColor, fontSize: '0.85rem', margin: 0, fontWeight: '800' }}>
          {/* ✅ 템플릿 리터럴 문법 수정 (백틱 사용) */}
          {percent >= 100 
            ? `💸 ${overAmount.toLocaleString()}원 초과지출!` 
            : percent >= 90 
            ? '⚠️ 예산의 거의 다 썼어요! 지출에 주의하세요.' 
            : percent >= 70 
            ? '🟡 지출이 늘어나고 있어요. 확인이 필요합니다.' 
            : '✅ 아주 잘하고 계시네요! 계획적인 소비 중입니다.'}
        </p>
      </div>
    </div>
  );
}

export default GroupBudgetGauge;