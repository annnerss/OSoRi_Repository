// 1. 2026년 1월 상세 데이터 (사용자 가이드라인 반영)
const januaryData = [
  { tran_id: 0, store_name: "스타벅스 강남점", date: "2026-01-04", amount: 6500, is_shared: "N", category: "식비", type: "EXPENSE", memo: "라떼 한 잔", group_tran_id: null, user_id: 101 },
  { tran_id: 0, store_name: "CGV 강남", date: "2026-01-05", amount: 15000, is_shared: "N", category: "문화/여가", type: "EXPENSE", memo: "영화 관람", group_tran_id: null, user_id: 101 },
  { tran_id: 0, store_name: "이마트", date: "2026-01-02", amount: 45000, is_shared: "N", category: "생활/마트", type: "EXPENSE", memo: "주말 장보기", group_tran_id: null, user_id: 101 },
  { tran_id: 0, store_name: "올리브영", date: "2026-01-08", amount: 23000, is_shared: "N", category: "쇼핑", type: "EXPENSE", memo: "선크림 구매", group_tran_id: null, user_id: 101 },
  { tran_id: 0, store_name: "내과 의원", date: "2026-01-10", amount: 5500, is_shared: "N", category: "의료/건강", type: "EXPENSE", memo: "진료비", group_tran_id: null, user_id: 101 },
  { tran_id: 0, store_name: "카카오택시", date: "2026-01-12", amount: 8200, is_shared: "N", category: "교통/차량", type: "EXPENSE", memo: "야근 귀가", group_tran_id: null, user_id: 101 },
  { tran_id: 0, store_name: "정기 급여", date: "2026-01-25", amount: 3500000, is_shared: "N", category: "급여", type: "INCOME", memo: "1월 월급", group_tran_id: null, user_id: 101 },
  // ... 추가 18개 데이터는 아래 generator에서 자동으로 생성되어 합쳐집니다.
];

const generateMockData = () => {
  // 사용자의 6대 분류 체계 정의
  const categoryConfig = {
    "식비": ["스타벅스", "맥도날드", "식당", "파리바게뜨", "치킨배달", "이자카야"],
    "생활/마트": ["이마트", "GS25", "다이소", "미용실", "동네 마트"],
    "쇼핑": ["현대백화점", "올리브영", "무신사", "교보문고", "자라"],
    "의료/건강": ["동네약국", "치과", "헬스장", "한의원"],
    "교통/차량": ["지하철", "시내버스", "주유소", "카카오택시"],
    "문화/여가": ["CGV", "노래방", "넷플릭스", "야놀자 숙박"]
  };

  const categories = Object.keys(categoryConfig);
  const allData = [];
  let currentId = 1;

  // 2025년 7월 ~ 2025년 12월 데이터 생성
  for (let year = 2025; year <= 2026; year++) {
    const startMonth = (year === 2025) ? 6 : 0; // 2025년은 7월(index 6)부터
    const endMonth = (year === 2025) ? 11 : 0; // 2026년은 1월(index 0)만

    for (let month = startMonth; month <= endMonth; month++) {
      for (let i = 1; i <= 25; i++) {
        // 1월의 경우 위에서 정의한 januaryData와 중복되지 않게 i의 범위를 조절하거나 나중에 합칩니다.
        if (year === 2026 && month === 0 && i <= januaryData.length) continue;

        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const randomStore = categoryConfig[randomCat][Math.floor(Math.random() * categoryConfig[randomCat].length)];
        const isIncome = (i === 10); // 매달 10일 월급날 가정

        allData.push({
          tran_id: currentId++,
          store_name: isIncome ? "정기급여" : randomStore,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${day}`,
          amount: isIncome ? 3000000 : (Math.floor(Math.random() * 50) + 1) * 1000,
          is_shared: "N",
          category: isIncome ? "급여" : randomCat,
          type: isIncome ? "INCOME" : "EXPENSE",
          memo: isIncome ? "이번 달 월급" : "일반 지출",
          group_tran_id: null,
          user_id: 101
        });
      }
    }
  }

  // 1월 수동 데이터 ID 부여 후 합치기
  const adjustedJanData = januaryData.map(item => ({ ...item, tran_id: currentId++ }));
  
  return [...allData, ...adjustedJanData].sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const transactions = generateMockData();