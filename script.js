// script.js 파일

// =========================================================
// 1. 전역 변수 및 초기 설정
// =========================================================
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date(); // 현재 선택된 날짜 (기본값은 오늘)

// DOM 요소 가져오기
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYearDisplay = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDateDisplay = document.getElementById('selectedDate');

const eventDateInput = document.getElementById('eventDate');
const eventTypeInput = document.getElementById('eventType');
const eventContentInput = document.getElementById('eventContent');
const addEventBtn = document.getElementById('addEvent');
const eventList = document.getElementById('eventList');

const transactionDateInput = document.getElementById('transactionDate');
const transactionTypeInput = document.getElementById('transactionType');
const transactionContentInput = document.getElementById('transactionContent');
const transactionAmountInput = document.getElementById('transactionAmount');
const addTransactionBtn = document.getElementById('addTransaction');
const transactionList = document.getElementById('transactionList');

const totalIncomeDisplay = document.getElementById('totalIncome');
const totalExpenseDisplay = document.getElementById('totalExpense');
const netBalanceDisplay = document.getElementById('netBalance');

// 데이터 저장용 객체 (날짜를 키로 사용)
// 예: { "2025-06-12": { events: [], transactions: [] } }
let appData = {};

// =========================================================
// 2. 초기화 함수 (앱 로드 시 실행)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    loadData(); // 저장된 데이터 불러오기
    renderCalendar(); // 달력 그리기
    updateSelectedDateDisplay(selectedDate); // 선택된 날짜 표시 업데이트
    renderDailyDetails(selectedDate); // 선택된 날짜의 상세 내역 그리기

    // 초기 입력 필드 날짜를 오늘 날짜로 설정
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    eventDateInput.value = todayStr;
    transactionDateInput.value = todayStr;
});

// =========================================================
// 3. 달력 관련 함수
// =========================================================
function renderCalendar() {
    calendarGrid.innerHTML = ''; // 기존 달력 지우기

    // 요일 헤더 다시 추가 (CSS grid 때문에 매번 추가)
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    daysOfWeek.forEach(day => {
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('day-header');
        headerDiv.textContent = day;
        calendarGrid.appendChild(headerDiv);
    });

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 이번 달 1일의 요일 (0:일, 6:토)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // 이번 달의 마지막 날짜

    currentMonthYearDisplay.textContent = `${currentYear}년 ${currentMonth + 1}월`;

    // 이전 달의 빈 날짜 채우기
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    // 이번 달 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = day;
        dayDiv.dataset.date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // 오늘 날짜 표시
        const today = new Date();
        if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate()) {
            dayDiv.classList.add('today');
        }

        // 선택된 날짜 표시 (선택된 날짜가 오늘 날짜와 다를 경우)
        if (selectedDate.getFullYear() === currentYear &&
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getDate() === day &&
            !(currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate())) { // 오늘이 아닌 선택된 날짜
            dayDiv.classList.add('selected');
        } else if (selectedDate.getFullYear() === currentYear &&
                   selectedDate.getMonth() === currentMonth &&
                   selectedDate.getDate() === day &&
                   (currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate())) { // 오늘이면서 선택된 날짜
            dayDiv.classList.remove('today'); // today 클래스 제거 후 selected 유지
            dayDiv.classList.add('selected');
        }

        // 일정이 있는 날짜 표시 (점 같은 것으로) 및 툴팁 내용 추가
        const dateKey = dayDiv.dataset.date;
        if (appData[dateKey]) {
            const events = appData[dateKey].events || [];
            const transactions = appData[dateKey].transactions || [];

            // 개인 일정이 있으면 주황색 점
            const hasPersonalEvent = events.some(event => event.type === 'personal');
            if (hasPersonalEvent) {
                const indicator = document.createElement('span');
                indicator.classList.add('has-entry-indicator', 'indicator-personal-event');
                dayDiv.appendChild(indicator);
            }

            // 업무 일정이 있으면 파란색 점
            const hasBusinessEvent = events.some(event => event.type === 'business');
            if (hasBusinessEvent) {
                const indicator = document.createElement('span');
                indicator.classList.add('has-entry-indicator', 'indicator-business-event');
                dayDiv.appendChild(indicator);
            }
            // 수입/지출 점은 일단은 제외합니다. 필요시 위와 같은 방식으로 추가 가능.


            // 툴팁 내용 추가
            if (events.length > 0 || transactions.length > 0) {
                const tooltip = document.createElement('div');
                tooltip.classList.add('tooltip-content');

                const ul = document.createElement('ul');

                // 일정 추가
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.classList.add(`event-tooltip-${event.type}`); // 툴팁용 클래스 추가
                    li.textContent = `[${event.type === 'personal' ? '개인' : '업무'}] ${event.content}`;
                    ul.appendChild(li);
                });

                // 수입/지출 내역 추가 (옵션, 너무 많아지면 복잡할 수 있음)
                transactions.forEach(transaction => {
                    const li = document.createElement('li');
                    li.classList.add(`transaction-tooltip-${transaction.type}`); // 툴팁용 클래스 추가
                    const sign = transaction.type === 'income' ? '+' : '-';
                    li.textContent = `${sign}${transaction.amount.toLocaleString()}원: ${transaction.content}`;
                    ul.appendChild(li);
                });

                tooltip.appendChild(ul);
                dayDiv.appendChild(tooltip); // 날짜 셀에 툴팁 추가
            }
        }


        // 날짜 클릭 이벤트
        dayDiv.addEventListener('click', (event) => {
            const prevSelected = document.querySelector('.calendar-day.selected');
            if (prevSelected) {
                // 이전 선택된 날짜가 오늘 날짜였다면 today 클래스를 다시 부여
                const prevDate = new Date(prevSelected.dataset.date);
                const today = new Date();
                if (prevDate.getFullYear() === today.getFullYear() &&
                    prevDate.getMonth() === today.getMonth() &&
                    prevDate.getDate() === today.getDate()) {
                    prevSelected.classList.add('today');
                }
                prevSelected.classList.remove('selected');
            }
            dayDiv.classList.add('selected');
            selectedDate = new Date(dayDiv.dataset.date); // 선택된 날짜 업데이트
            updateSelectedDateDisplay(selectedDate);
            renderDailyDetails(selectedDate); // 상세 내역 업데이트
            updateInputDates(selectedDate); // 입력 필드 날짜도 업데이트
        });

        calendarGrid.appendChild(dayDiv);
    }
}

// 이전 달로 이동
prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

// 다음 달로 이동
nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

// =========================================================
// 4. 상세 내역 (일정 및 수입/지출) 관련 함수
// =========================================================
function updateSelectedDateDisplay(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[date.getDay()];
    selectedDateDisplay.textContent = `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

function updateInputDates(date) {
    const dateStr = date.toISOString().split('T')[0];
    eventDateInput.value = dateStr;
    transactionDateInput.value = dateStr;
}

function renderDailyDetails(date) {
    const dateKey = date.toISOString().split('T')[0];
    const dataForDate = appData[dateKey] || { events: [], transactions: [] };

    // 일정 목록 렌더링
    eventList.innerHTML = '';
    if (dataForDate.events.length === 0) {
        eventList.innerHTML = '<li>등록된 일정이 없습니다.</li>';
    } else {
        dataForDate.events.forEach((event, index) => {
            const li = document.createElement('li');
            li.classList.add(`event-${event.type}`); // CSS 클래스 추가 (personal/business)
            li.innerHTML = `
                <span>[${event.type === 'personal' ? '개인' : '업무'}] ${event.content}</span>
                <div>
                    <button class="edit-btn" data-type="event" data-index="${index}">수정</button>
                    <button class="delete-btn" data-type="event" data-index="${index}">삭제</button>
                </div>
            `;
            eventList.appendChild(li);
        });
    }

    // 수입/지출 목록 렌더링
    transactionList.innerHTML = '';
    let totalIncome = 0;
    let totalExpense = 0;

    if (dataForDate.transactions.length === 0) {
        transactionList.innerHTML = '<li>등록된 수입/지출 내역이 없습니다.</li>';
    } else {
        dataForDate.transactions.forEach((transaction, index) => {
            const li = document.createElement('li');
            li.classList.add(`transaction-${transaction.type}`); // CSS 클래스 추가 (income/expense)
            const sign = transaction.type === 'income' ? '+' : '-';
            li.innerHTML = `
                <span>${sign}${transaction.amount.toLocaleString()}원: ${transaction.content}</span>
                <div>
                    <button class="edit-btn" data-type="transaction" data-index="${index}">수정</button>
                    <button class="delete-btn" data-type="transaction" data-index="${index}">삭제</button>
                </div>
            `;
            transactionList.appendChild(li);

            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
    }

    // 총 수입/지출/순이익 업데이트
    totalIncomeDisplay.textContent = totalIncome.toLocaleString();
    totalExpenseDisplay.textContent = totalExpense.toLocaleString();
    netBalanceDisplay.textContent = (totalIncome - totalExpense).toLocaleString();

    // 동적으로 생성된 버튼에 이벤트 리스너 추가
    addDeleteEditListeners();
}

// =========================================================
// 5. 일정 추가/수정/삭제
// =========================================================
addEventBtn.addEventListener('click', () => {
    const date = eventDateInput.value;
    const type = eventTypeInput.value;
    const content = eventContentInput.value.trim();

    if (!date || !content) {
        alert('날짜와 내용을 모두 입력해주세요.');
        return;
    }

    // 데이터 구조 초기화
    if (!appData[date]) {
        appData[date] = { events: [], transactions: [] };
    }
    if (!appData[date].events) {
        appData[date].events = [];
    }

    appData[date].events.push({ type, content });
    saveData();
    renderDailyDetails(selectedDate);
    eventContentInput.value = ''; // 입력 필드 초기화
    renderCalendar(); // 일정 추가 시 달력에 표시될 수 있도록 캘린더 다시 그리기
});

// =========================================================
// 6. 수입/지출 추가/수정/삭제
// =========================================================
addTransactionBtn.addEventListener('click', () => {
    const date = transactionDateInput.value;
    const type = transactionTypeInput.value;
    const content = transactionContentInput.value.trim();
    const amount = parseInt(transactionAmountInput.value, 10); // 숫자로 변환

    if (!date || !content || isNaN(amount) || amount <= 0) {
        alert('날짜, 항목 내용, 유효한 금액을 모두 입력해주세요.');
        return;
    }

    // 데이터 구조 초기화
    if (!appData[date]) {
        appData[date] = { events: [], transactions: [] };
    }
    if (!appData[date].transactions) {
        appData[date].transactions = [];
    }

    appData[date].transactions.push({ type, content, amount });
    saveData();
    renderDailyDetails(selectedDate);
    transactionContentInput.value = ''; // 입력 필드 초기화
    transactionAmountInput.value = ''; // 입력 필드 초기화
    renderCalendar(); // 내역 추가 시 달력에 표시될 수 있도록 캘린더 다시 그리기
});

// 삭제 및 수정 버튼 이벤트 리스너 추가 함수 (동적으로 생성되므로 매번 호출)
function addDeleteEditListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (event) => { // 중복 호출 방지를 위해 onclick 사용
            const type = event.target.dataset.type; // 'event' 또는 'transaction'
            const index = parseInt(event.target.dataset.index);
            const dateKey = selectedDate.toISOString().split('T')[0];

            if (confirm('정말 삭제하시겠습니까?')) {
                if (type === 'event') {
                    appData[dateKey].events.splice(index, 1);
                } else if (type === 'transaction') {
                    appData[dateKey].transactions.splice(index, 1);
                }
                saveData();
                renderDailyDetails(selectedDate);
                renderCalendar(); // 내용 삭제 시 달력에 표시될 수 있도록 캘린더 다시 그리기
            }
        };
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.onclick = (event) => { // 중복 호출 방지를 위해 onclick 사용
            const type = event.target.dataset.type;
            const index = parseInt(event.target.dataset.index);
            const dateKey = selectedDate.toISOString().split('T')[0];

            if (type === 'event') {
                const currentEvent = appData[dateKey].events[index];
                const newContent = prompt('일정 내용을 수정하세요:', currentEvent.content);
                if (newContent !== null && newContent.trim() !== '') {
                    currentEvent.content = newContent.trim();
                    saveData();
                    renderDailyDetails(selectedDate);
                }
            } else if (type === 'transaction') {
                const currentTransaction = appData[dateKey].transactions[index];
                const newContent = prompt('항목 내용을 수정하세요:', currentTransaction.content);
                const newAmount = prompt('금액을 수정하세요:', currentTransaction.amount);

                const parsedAmount = parseInt(newAmount, 10);

                if (newContent !== null && newContent.trim() !== '' && newAmount !== null && !isNaN(parsedAmount) && parsedAmount > 0) {
                    currentTransaction.content = newContent.trim();
                    currentTransaction.amount = parsedAmount;
                    saveData();
                    renderDailyDetails(selectedDate);
                } else if (newContent !== null || newAmount !== null) { // 둘 중 하나라도 입력 시도했지만 유효성 검사 실패
                    alert('유효한 항목 내용과 금액을 입력해주세요.');
                }
            }
        };
    });
}


// =========================================================
// 7. 데이터 저장 및 불러오기 (로컬 스토리지 사용)
// =========================================================
function saveData() {
    // appData에서 빈 날짜 데이터를 제거하여 스토리지 낭비 방지
    for (const dateKey in appData) {
        if (appData.hasOwnProperty(dateKey)) {
            if (appData[dateKey].events.length === 0 && appData[dateKey].transactions.length === 0) {
                delete appData[dateKey];
            }
        }
    }
    localStorage.setItem('myScheduleApp', JSON.stringify(appData));
    console.log('데이터 저장됨:', appData);
}

function loadData() {
    const savedData = localStorage.getItem('myScheduleApp');
    if (savedData) {
        appData = JSON.parse(savedData);
        console.log('데이터 불러옴:', appData);
    }
}