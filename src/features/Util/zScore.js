// zScore.js 수정본

// [추가] 카테고리에 따른 위트 있는 메시지 생성 함수
const getWitMessage = (category, amount, limit) => {
  const diff = Math.round(amount - limit);
  const messages = {
    '식비': [`미슐랭 가이드 찍으러 가셨나요? 🍽️ (평소 대비 +${diff.toLocaleString()}원)`, `혹시 오늘이 생일이신가요? 지갑도 생각해주세요! 🎂`],
    '쇼핑': [`지름신이 강림하셨군요! 🛍️ (평소 대비 +${diff.toLocaleString()}원)`, `장바구니가 무거우면 지갑은 가벼워집니다...`],
    '생활/마트': [`장바구니가 꽤 무겁네요 😭 (평소 대비 +${diff.toLocaleString()}원)`],
    '의료/건강': [`건강이 최고지만, 지갑 건강도 챙겨주세요! 🏥`],
    '교통': [`이번 달은 이동이 정말 많으시네요! 🚗`],
    '문화/여가': [`인생은 즐겁지만 예산도 즐거워야 해요 🎭`],
    '기타': [`어디에 쓰셨나요? 예상치 못한 지출이 생겼어요! 🤔`]
  };
  const categoryMessages = messages[category] || messages['기타'];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
};

export const zScore = (transactions, currentDate) => {
  const notifications = [];
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split(/[/.-]/); 
    if (parts.length === 3) {
      let year = parseInt(parts[0]);
      let month = parseInt(parts[1]) - 1;
      let day = parseInt(parts[2]);
      if (year < 100) year += 2000; 
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  const categoryStats = {};
  
  // 1. 과거 데이터 집계
  transactions
    .filter(t => parseSafeDate(t.date || t.transDate) < new Date(currentYear, currentMonth, 1) && t.type?.toUpperCase() === 'OUT')
    .forEach(t => {
      const cat = t.category; 
      if (!categoryStats[cat]) categoryStats[cat] = [];
      categoryStats[cat].push(Math.abs(t.amount || t.originalAmount));
    });

  const thresholds = {};
  Object.keys(categoryStats).forEach(category => {
    const amounts = categoryStats[category];
    if (amounts.length < 3) return; 
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    thresholds[category] = mean + (1.96 * stdDev); 
  });

  // 2. 이번 달 지출 분석
  transactions
    .filter(t => {
      const d = parseSafeDate(t.date || t.transDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && t.type?.toUpperCase() === 'OUT';
    })
    .forEach(t => {
      const limit = thresholds[t.category];
      const amount = Math.abs(t.amount || t.originalAmount);
      if (limit && amount > limit) {
        notifications.push({
          id: `anomaly-${t.tranId || Math.random()}`, 
          message: getWitMessage(t.category, amount, limit), 
        });
      }
    });

  return notifications;
};