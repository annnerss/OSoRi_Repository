import React, { useState, useEffect } from 'react';
import './GroupAccountBook.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import transApi from '../../api/transApi';
import GroupBudgetGauge from './GroupBudgetGaugeChart'
import MemberChart from './MemberChart';

const EXPENSE_CATEGORIES = [
  "식비", "생활/마트", "쇼핑", "의료/건강", 
  "교통", "문화/여가", "교육", "기타"
];

const INCOME_CATEGORIES = [
  "월급", "용돈", "금융소득", "상여금", "기타"
];

const TransactionModal = ({ isOpen, type, transaction, onClose, onSave, onDelete, groupInfo }) => {
    const [currentCategories, setCurrentCategories] = useState(EXPENSE_CATEGORIES);
    
    const [formData, setFormData] = useState({
        text: '', amount: 0, date: '', category: '기타', memo: '', type: 'OUT'
    });

    const today = new Date().toISOString().split('T')[0];

    const maxDate = (groupInfo?.endDate && groupInfo.endDate < today) 
                    ? groupInfo.endDate 
                    : today;

    useEffect(() => {
        if (transaction) {
            const transType = transaction.type || 'OUT';
            const categories = transType === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
            setCurrentCategories(categories);

            setFormData({
                text: transaction.text,
                amount: Math.abs(transaction.amount),
                date: transaction.date,
                category: transaction.category,
                memo: transaction.memo || '',
                type: transType
            });
        }
    }, [transaction]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateBlur = (e) => {
        const val = e.target.value;
        if (!val) return;

        if (groupInfo?.startDate && val < groupInfo.startDate) {
            alert(`그룹 시작일(${groupInfo.startDate}) 이전은 등록할 수 없습니다.`);
            setFormData(prev => ({ ...prev, date: groupInfo.startDate }));
        } 

        else if (val > maxDate) {
            const msg = maxDate === today 
                        ? "미래 날짜는 등록할 수 없습니다." 
                        : `그룹 종료일(${maxDate}) 이후는 등록할 수 없습니다.`;
            alert(msg);
            setFormData(prev => ({ ...prev, date: maxDate }));
        }
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value; 
        const newCategories = newType === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        setCurrentCategories(newCategories);
        setFormData(prev => ({
            ...prev,
            type: newType,
            category: newCategories[0] 
        }));
    };

    const isViewMode = type === 'view'; 
    const isDetailMode = type === 'edit' || type === 'view';

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} 
                 style={{ width: '95%', maxWidth: '650px', borderRadius: '35px', padding: '45px', background: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                
                <h3 style={{ marginTop: '-10px', marginBottom: '30px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800' }}>
                    {isDetailMode ? (isViewMode ? '📄 내역 상세' : '✏️ 내역 수정') : '🗑️ 삭제 확인'}
                </h3>

                {isDetailMode ? (
                    <>
                        <div className="modal-radio-group" style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
                            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name="type" value="IN" checked={formData.type === 'IN'} onChange={handleTypeChange} style={{ width: '22px', height: '22px' }} disabled={isViewMode} />
                                <span style={{ color: 'var(--income-color)', fontWeight: '800', fontSize: '1.2rem' }}>수입</span>
                            </label>
                            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name="type" value="OUT" checked={formData.type === 'OUT'} onChange={handleTypeChange} style={{ width: '22px', height: '22px' }} disabled={isViewMode} />
                                <span style={{ color: 'var(--expense-color)', fontWeight: '800', fontSize: '1.2rem' }}>지출</span>
                            </label>
                        </div>

                        <div className="modal-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ maxWidth: '200px' }}>
                                <label className="modal-label">날짜</label>
                                <input type="date" name="date" value={formData.date} className="modal-input" readOnly={isViewMode} disabled={isViewMode} 
                                       onChange={handleChange} onBlur={handleDateBlur} min={groupInfo?.startDate}  max={maxDate}/>
                            </div>
                            <div>
                                <label className="modal-label">내용</label>
                                <input type="text" name="text" value={formData.text} className="modal-input" readOnly={isViewMode} onChange={handleChange} />
                            </div>
                            <div style={{ maxWidth: '200px' }}>
                                <label className="modal-label">금액</label>
                                <input type="number" name="amount" value={formData.amount} className="modal-input" readOnly={isViewMode} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="modal-label">카테고리</label>
                                <select name="category" value={formData.category} className="modal-input" disabled={isViewMode} onChange={handleChange}>
                                    {currentCategories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="modal-label">메모</label>
                                <input type="text" name="memo" value={formData.memo} className="modal-input" readOnly={isViewMode} onChange={handleChange} placeholder={isViewMode ? "" : "메모를 입력하세요"} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ fontSize: '1.2rem', color: '#2d3436', lineHeight: '1.6' }}>
                            <strong>"{transaction?.text}"</strong> 내역을<br/>정말 삭제하시겠습니까?
                        </p>
                    </div>
                )}

                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '40px' }}>
                    <button className="modal-btn cancel" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', background: '#f1f3f5', fontWeight: '700', border: 'none' }}>취소</button>
                    {isDetailMode ? (
                        !isViewMode && <button className="modal-btn confirm" onClick={() => onSave({ ...transaction, ...formData })} style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary-color)', color: '#fff', fontWeight: '700', border: 'none' }}>수정</button>
                    ) : (
                        <button className="modal-btn delete" onClick={() => onDelete(transaction.id)} style={{ padding: '12px 24px', borderRadius: '12px', background: '#ff4d4f', color: '#fff', fontWeight: '700', border: 'none' }}>삭제</button>
                    )}
                </div>
            </div>
        </div>
    );
};

function GroupAccountBook() {
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showIncome, setShowIncome] = useState(false);
    const [showExpense, setShowExpense] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('view'); 
    const [selectedItem, setSelectedItem] = useState(null);

    const [currentDate, setCurrentDate] = useState(new Date());

    const [groupInfo, setGroupInfo] = useState({
        title: '그룹 가계부',
        budget: 0,
        startDate: '',
        endDate: ''
    });

    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentGroupId = searchParams.get('groupId');

    const fetchTransactions = () => {
        if (!currentGroupId) return; 
        
        transApi.getGroupTrans(currentGroupId)
            .then(data => {
                if (!data || !Array.isArray(data)) {
                    setTransactions([]);
                    return;
                }
                const mappedData = data.map(item => {
                    const rawDate = item.transDate || item.TRANS_DATE || "";
                    let formattedDate = rawDate;
                    if (rawDate && typeof rawDate === 'string' && rawDate.includes('/')) {
                        const [yy, mm, dd] = rawDate.split('/');
                        formattedDate = `20${yy}-${mm}-${dd}`;
                    }
                    return {
                        id: item.transId || item.TRAN_ID || item.trans_id || item.id || 0,
                        text: item.title || item.TITLE,
                        amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || 0),
                        date: formattedDate,
                        type: item.type || item.TYPE,
                        category: item.category || item.CATEGORY || '기타',
                        memo: item.memo || item.MEMO || '',
                        nickname: item.nickname || item.NICKNAME || '',
                        groupbId : currentGroupId
                    };
                });
                setTransactions(mappedData);
            })
            .catch(error => console.error("그룹 데이터 로드 실패:", error));
    };

    const fetchGroupInfo = () => {
        if (!currentGroupId) return;
        
        transApi.groupInfo(currentGroupId)
            .then(data => {
                if (data) {
                    setGroupInfo({
                        title: data.TITLE || data.title,
                        budget: Number(data.B_AMOUNT || data.budget || 0),
                        startDate:data.startDate,
                        endDate: data.endDate
                    });
                }
            })
            .catch(err => console.error("그룹 정보 로드 실패:", err));
    };

    useEffect(() => {
        fetchTransactions();
        fetchGroupInfo();
    }, [currentGroupId]); 

    const openViewModal = (item) => { setSelectedItem(item); setModalType('view'); setIsModalOpen(true); };
    const openEditModal = (e, item) => { e.stopPropagation(); setSelectedItem(item); setModalType('edit'); setIsModalOpen(true); };
    const openDeleteModal = (e, item) => { e.stopPropagation(); setSelectedItem(item); setModalType('delete'); setIsModalOpen(true); };

    const handleSave = async (updatedData) => {
        try {
            const currentUserId = user?.userId || user?.USER_ID || user?.id;
            if (!currentUserId || !currentGroupId) {
                alert("필수 정보가 누락되었습니다.");
                return;
            }
            const updateData = {
                transId: updatedData.id,        
                title: updatedData.text,        
                transDate: updatedData.date,     
                originalAmount: Number(updatedData.amount),
                category: updatedData.category, 
                type: updatedData.type,      
                memo: updatedData.memo || '',     
                groupBId: Number(currentGroupId),
            };
            await transApi.updateGroupTrans(updateData);
            alert("수정되었습니다.");
            setIsModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error(error);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await transApi.deleteGroupTrans(id);
            alert("삭제되었습니다.");
            setIsModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error(error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const filteredTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .filter((t) => {
            const matchesSearch = t.text.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesType = true;
            if (showIncome || showExpense) {
                if (showIncome && t.type?.toUpperCase() !== 'IN') matchesType = false;
                if (showExpense && t.type?.toUpperCase() !== 'OUT') matchesType = false;
            }

            let matchesDate = true;
            if (startDate && t.date < startDate) matchesDate = false;
            if (endDate && t.date > endDate) matchesDate = false;

            return matchesSearch && matchesType && matchesDate;
        });
    
    const handleIncomeToggle = () => { if (showIncome) { setShowIncome(false); } else { setShowIncome(true); setShowExpense(false); } };
    const handleExpenseToggle = () => { if (showExpense) { setShowExpense(false); } else { setShowExpense(true); setShowIncome(false); } };

    const totalIncome = transactions
        .filter(t => t.type === 'IN')
        .reduce((acc, cur) => acc + Number(cur.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'OUT')
        .reduce((acc, cur) => acc + Number(cur.amount), 0);

    return (
        <main className="fade-in">
            <div className='group'>
                <div className='left-side'>
                    <div className="card">
                        <TransactionModal 
                            isOpen={isModalOpen} type={modalType} transaction={selectedItem}
                            onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} groupInfo={groupInfo}
                        />

                        <header className="group-header">
                            <div className="group-title-area">
                                <span className="group-emoji">💰</span>
                                <h1 className="group-name">{groupInfo.title}</h1>
                            </div>
                            <div className="group-budget-area">
                                <span className="budget-label">목표 예산</span>
                                <div className="budget-value">
                                    <span className="budget-amount">{groupInfo.budget.toLocaleString()}</span>
                                    <span className="budget-unit">원</span>
                                </div>
                            </div>
                            <div className="group-date-badge">
                                🗓️ {groupInfo.startDate} ~ {groupInfo.endDate}
                            </div>
                        </header>

                    <div className="summary-section">
                        <div className="summary-card income-card">
                                <span className="summary-label">총 수입:</span>
                                <span className="summary-amount">+{totalIncome.toLocaleString()}원</span>
                            </div>
                            <div className="summary-card expense-card">
                                <span className="summary-label">총 지출:</span>
                                <span className="summary-amount">-{totalExpense.toLocaleString()}원</span>
                            </div>
                        </div>

                        <div className="search-wrapper">
                            <div className="filter-group">
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={showIncome} 
                                        onChange={handleIncomeToggle} 
                                    />
                                    <span className="label-text income">수입</span>
                                </label>
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={showExpense} 
                                        onChange={handleExpenseToggle} 
                                    />
                                    <span className="label-text expense">지출</span>
                                </label>
                            </div>
                            
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="내역 검색" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <div className="list-header">
                            <h3 className="section-title">거래 내역</h3>
                            <div className="date-filter-wrapper">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="date-input" />
                                <span className="date-separator">~</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="date-input" />
                            </div>
                        </div>
                        
                        <div className="list-container">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t, index) => (
                                    <div key={t.id || index} className="list-item" onClick={() => openViewModal(t)} style={{cursor: 'pointer'}}>
                                        <div className="item-info">
                                            <span className="item-text">
                                                {t.text} 
                                                {t.nickname && <span style={{fontSize:'0.8em', color:'#888', marginLeft:'5px'}}>({t.nickname})</span>}
                                            </span>
                                            <span className="item-date">{t.date}</span>
                                        </div>
                                        <div className="item-right">
                                            <span className={`item-amount ${t.type?.toUpperCase() === 'IN' ? 'income' : 'expense'}`}>
                                                {t.type?.toUpperCase() === 'IN' ? '+' : '-'}
                                                {Math.abs(t.amount).toLocaleString()}원
                                            </span>
                                            <div className="item-actions">
                                                <button className="action-btn" onClick={(e) => openEditModal(e, t)}>수정</button>
                                                <button className="action-btn del-btn" onClick={(e) => openDeleteModal(e, t)}>삭제</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">표시할 내역이 없습니다.</p>
                            )}
                        </div>
                        <button className="add-btn" onClick={() => navigate(`/mypage/group/${currentGroupId}/expenseForm`)}>새 내역 추가하기</button>
                    </div>
                </div>

                <div className='right-side'>
                    {/* <div className={styles['month-selector-container']}>
                        <div className={styles['month-nav-group']}>
                            <button onClick={handlePrevMonth} className={styles['nav-btn']}>◀</button>
                            <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{currentYear}년 {currentMonth}월 분석</span>
                            <button onClick={handleNextMonth} className={styles['nav-btn']}>▶</button>
                        </div>
                    </div> */}
                    <div className='chart-card'>
                        <div className='chart-main-container'>
                            <GroupBudgetGauge
                                transactions={transactions} 
                                groupbId={currentGroupId} 
                                monthlyBudget={groupInfo.budget} 
                                startDate={groupInfo.startDate}
                                endDate={groupInfo.endDate}
                            />
                        </div>
                    </div>
                    <div className='chart-card'>
                        <div className='chart-main-container'>
                            <MemberChart
                                transactions={transactions} 
                                groupbId={currentGroupId} 
                                startDate={groupInfo.startDate}
                                endDate={groupInfo.endDate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default GroupAccountBook;