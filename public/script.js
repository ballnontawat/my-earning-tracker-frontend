// script.js
const API_BASE_URL = 'YOUR_BACKEND_URL'; // **สำคัญ: เปลี่ยนเป็น URL ของ Back-end ของคุณ เช่น 'http://localhost:3000' หรือ 'https://your-app-name.onrender.com'**

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('login-message');

const calendarSection = document.getElementById('calendar-section');
const loggedInUserDisplay = document.getElementById('logged-in-user'); // เพิ่มสำหรับแสดงชื่อผู้ใช้
const currentMonthYearHeader = document.getElementById('current-month-year');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const calendarGrid = document.querySelector('.calendar-grid');
const logoutButton = document.getElementById('logout-button');

const noteModal = document.getElementById('note-modal'); // ตอนนี้คือ Earnings Modal
const closeModalButton = document.getElementById('close-modal');
const modalDateDisplay = document.getElementById('modal-date');
// Elements สำหรับแสดงและกรอกข้อมูลค่าแรง
const existingEarningsContainer = document.getElementById('existing-earnings-container');
const displayDailyWage = document.getElementById('display-daily-wage');
const displayOvertimePay = document.getElementById('display-overtime-pay');
const displayAllowance = document.getElementById('display-allowance');
const inputDailyWage = document.getElementById('input-daily-wage');
const inputOvertimePay = document.getElementById('input-overtime-pay');
const inputAllowance = document.getElementById('input-allowance');
const saveEarningsButton = document.getElementById('save-earnings-button');

// Elements สำหรับแสดงยอดรวมรายเดือน
const totalWageDisplay = document.getElementById('total-wage-display');
const totalOvertimeDisplay = document.getElementById('total-overtime-display');
const totalAllowanceDisplay = document.getElementById('total-allowance-display');
const grandTotalDisplay = document.getElementById('grand-total-display');

// --- State Variables ---
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null; // วันที่ที่เลือกในปฏิทิน
let loggedInUser = null; // เก็บข้อมูลผู้ใช้ที่ล็อกอิน { id, username }
let dailyEarningsData = {}; // เก็บข้อมูลค่าแรงรายวันของเดือนที่กำลังแสดงผล { 'YYYY-MM-DD': { daily_wage, overtime_pay, allowance } }


// --- Functions ---

// ฟังก์ชันสำหรับ Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value; // **หมายเหตุ: ในตัวอย่าง Back-end คุณใช้ username ด้วย ควรรับมาใน Front-end ด้วย**
    const username = "admin"; // **ตอนนี้ใช้ Hardcode ไปก่อน แต่ในระบบจริงต้องมีช่องให้กรอก username**

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }) // ส่ง username และ password ไป
        });

        const data = await response.json();

        if (response.ok) {
            loginMessage.textContent = 'Login successful!';
            loginMessage.style.color = 'green';
            loggedInUser = data.user; // เก็บข้อมูลผู้ใช้
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser)); // เก็บลง Local Storage
            
            // ซ่อน Login, แสดง Calendar
            loginSection.style.display = 'none';
            calendarSection.style.display = 'block';
            loggedInUserDisplay.textContent = `เข้าสู่ระบบโดย: ${loggedInUser.username}`; // แสดงชื่อผู้ใช้
            renderCalendar(); // แสดงปฏิทิน
        } else {
            loginMessage.textContent = data.message || 'Login failed.';
            loginMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error during login:', error);
        loginMessage.textContent = 'Server error. Please try again later.';
        loginMessage.style.color = 'red';
    }
});

// ฟังก์ชันสำหรับ Logout
logoutButton.addEventListener('click', () => {
    loggedInUser = null;
    localStorage.removeItem('loggedInUser');
    loginSection.style.display = 'block';
    calendarSection.style.display = 'none';
    passwordInput.value = ''; // เคลียร์รหัสผ่าน
    loginMessage.textContent = '';
});

// ฟังก์ชันสำหรับดึงข้อมูลค่าแรงรายวันของเดือนที่เลือก
async function fetchDailyEarnings() {
    if (!loggedInUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/daily-earnings/${loggedInUser.id}/${currentYear}/${currentMonth + 1}`); // +1 เพราะเดือนใน JS เริ่มจาก 0
        if (!response.ok) {
            throw new Error('Failed to fetch daily earnings');
        }
        const data = await response.json();
        dailyEarningsData = {}; // เคลียร์ข้อมูลเดิม
        data.forEach(item => {
            const dateKey = item.record_date.split('T')[0]; // แปลงให้เป็น YYYY-MM-DD
            dailyEarningsData[dateKey] = item;
        });
    } catch (error) {
        console.error('Error fetching daily earnings:', error);
        dailyEarningsData = {}; // หากมีข้อผิดพลาด ให้เคลียร์ข้อมูล
    }
}

// ฟังก์ชันสำหรับดึงยอดรวมรายเดือน
async function fetchMonthlySummary() {
    if (!loggedInUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/monthly-summary/${loggedInUser.id}/${currentYear}/${currentMonth + 1}`);
        if (!response.ok) {
            throw new Error('Failed to fetch monthly summary');
        }
        const summary = await response.json();
        totalWageDisplay.textContent = summary.total_wage.toLocaleString('th-TH');
        totalOvertimeDisplay.textContent = summary.total_overtime.toLocaleString('th-TH');
        totalAllowanceDisplay.textContent = summary.total_allowance.toLocaleString('th-TH');
        grandTotalDisplay.textContent = summary.grand_total.toLocaleString('th-TH');
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        totalWageDisplay.textContent = '0';
        totalOvertimeDisplay.textContent = '0';
        totalAllowanceDisplay.textContent = '0';
        grandTotalDisplay.textContent = '0';
    }
}


// ฟังก์ชันสำหรับแสดงปฏิทิน
async function renderCalendar() {
    currentMonthYearHeader.textContent = new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = ''; // Clear previous days

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday, 1 for Monday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Days of the week header
    const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Fetch data before rendering days
    await fetchDailyEarnings();
    await fetchMonthlySummary(); // ดึงยอดรวมมาแสดงด้วย

    // Empty cells for the first days of the week
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // Render days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = date.toISOString().split('T')[0]; // Format YYYY-MM-DD

        const dayCell = document.createElement('div');
        dayCell.classList.add('day');
        dayCell.innerHTML = `<span class="date-number">${day}</span>`;

        // Check if there are earnings for this day
        if (dailyEarningsData[dateKey]) {
            const earnings = dailyEarningsData[dateKey];
            const earningsDiv = document.createElement('div');
            earningsDiv.classList.add('earnings-summary');
            earningsDiv.innerHTML += `<small>ค่าแรง: ${earnings.daily_wage || 0}</small><br>`;
            earningsDiv.innerHTML += `<small>โอที: ${earnings.overtime_pay || 0}</small><br>`;
            earningsDiv.innerHTML += `<small>เบี้ยเลี้ยง: ${earnings.allowance || 0}</small>`;
            dayCell.appendChild(earningsDiv);
            dayCell.classList.add('has-data'); // เพิ่มคลาสเพื่อใช้ CSS เน้น
        }

        // Highlight current day
        if (date.toDateString() === new Date().toDateString()) {
            dayCell.classList.add('current-day');
        }

        dayCell.addEventListener('click', () => openEarningsModal(date));
        calendarGrid.appendChild(dayCell);
    }
}

// Function to open the earnings modal
function openEarningsModal(date) {
    selectedDate = date;
    modalDateDisplay.textContent = selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // เคลียร์ค่าในช่อง input และแสดงข้อมูลที่มีอยู่
    const dateKey = selectedDate.toISOString().split('T')[0];
    const existingEarnings = dailyEarningsData[dateKey];

    if (existingEarnings) {
        displayDailyWage.textContent = existingEarnings.daily_wage || 0;
        displayOvertimePay.textContent = existingEarnings.overtime_pay || 0;
        displayAllowance.textContent = existingEarnings.allowance || 0;
        
        inputDailyWage.value = existingEarnings.daily_wage || 0;
        inputOvertimePay.value = existingEarnings.overtime_pay || 0;
        inputAllowance.value = existingEarnings.allowance || 0;
    } else {
        displayDailyWage.textContent = '0';
        displayOvertimePay.textContent = '0';
        displayAllowance.textContent = '0';

        inputDailyWage.value = '0';
        inputOvertimePay.value = '0';
        inputAllowance.value = '0';
    }

    noteModal.style.display = 'block';
}

// Function to close the earnings modal
closeModalButton.addEventListener('click', () => {
    noteModal.style.display = 'none';
});

// Event listener for saving earnings
saveEarningsButton.addEventListener('click', async () => {
    if (!selectedDate || !loggedInUser) return;

    const recordDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyWage = parseFloat(inputDailyWage.value) || 0;
    const overtimePay = parseFloat(inputOvertimePay.value) || 0;
    const allowance = parseFloat(inputAllowance.value) || 0;

    try {
        const response = await fetch(`${API_BASE_URL}/api/daily-earnings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: loggedInUser.id,
                recordDate,
                dailyWage,
                overtimePay,
                allowance
            })
        });

        if (response.ok) {
            alert('บันทึกข้อมูลค่าแรงสำเร็จ!');
            noteModal.style.display = 'none';
            renderCalendar(); // Re-render calendar to show updated data
        } else {
            const errorData = await response.json();
            alert('บันทึกข้อมูลค่าแรงไม่สำเร็จ: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving earnings:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
});


// Navigation buttons
prevMonthButton.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

// Initial load check
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        loggedInUser = JSON.parse(storedUser);
        loginSection.style.display = 'none';
        calendarSection.style.display = 'block';
        loggedInUserDisplay.textContent = `เข้าสู่ระบบโดย: ${loggedInUser.username}`;
        renderCalendar();
    } else {
        loginSection.style.display = 'block';
        calendarSection.style.display = 'none';
    }
});