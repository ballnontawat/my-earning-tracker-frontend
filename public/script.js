// script.js
// **สำคัญ: เปลี่ยน API_BASE_URL ให้เป็น URL ของ Back-end Server ของคุณ**
// ถ้า Back-end รันบนเครื่องตัวเอง: 'http://localhost:3000'
// ถ้า Deploy บน Render.com: 'https://your-app-name.onrender.com'
const API_BASE_URL = 'https://my-earning-tracker-backend-api.onrender.com'; // <<< แก้ไขตรงนี้ !!!

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username'); // เพิ่ม username input
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('login-message');

const calendarSection = document.getElementById('calendar-section');
const loggedInUserDisplay = document.getElementById('logged-in-user');
const currentMonthYearHeader = document.getElementById('current-month-year');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const calendarGrid = document.querySelector('.calendar-grid');
const logoutButton = document.getElementById('logout-button');

const noteModal = document.getElementById('note-modal');
const closeModalButton = document.getElementById('close-modal');
const modalDateDisplay = document.getElementById('modal-date');
const existingEarningsContainer = document.getElementById('existing-earnings-container');
const displayDailyWage = document.getElementById('display-daily-wage');
const displayOvertimePay = document.getElementById('display-overtime-pay');
const displayAllowance = document.getElementById('display-allowance');
const inputDailyWage = document.getElementById('input-daily-wage');
const inputOvertimePay = document.getElementById('input-overtime-pay');
const inputAllowance = document.getElementById('input-allowance');
const saveEarningsButton = document.getElementById('save-earnings-button');

const totalWageDisplay = document.getElementById('total-wage-display');
const totalOvertimeDisplay = document.getElementById('total-overtime-display');
const totalAllowanceDisplay = document.getElementById('total-allowance-display');
const grandTotalDisplay = document.getElementById('grand-total-display');

// --- State Variables ---
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let loggedInUser = null; // จะเก็บ { id, username } ของผู้ใช้ที่ล็อกอิน
let dailyEarningsData = {}; // เก็บข้อมูลค่าแรงรายวันของเดือนที่ดึงมา

// --- Functions ---

// Event Listener สำหรับฟอร์ม Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // ป้องกันการรีโหลดหน้าเว็บ
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            loginMessage.textContent = 'Login successful!';
            loginMessage.style.color = 'green';
            loggedInUser = data.user; // เก็บข้อมูลผู้ใช้ที่ล็อกอิน (id, username)
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser)); // บันทึกใน Local Storage

            loginSection.style.display = 'none'; // ซ่อนส่วน Login
            calendarSection.style.display = 'block'; // แสดงส่วนปฏิทิน
            loggedInUserDisplay.textContent = `เข้าสู่ระบบโดย: ${loggedInUser.username}`;
            renderCalendar(); // เริ่มต้นสร้างปฏิทิน
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

// Event Listener สำหรับปุ่ม Logout
logoutButton.addEventListener('click', () => {
    loggedInUser = null;
    localStorage.removeItem('loggedInUser'); // ลบข้อมูลผู้ใช้จาก Local Storage
    loginSection.style.display = 'block'; // แสดงส่วน Login
    calendarSection.style.display = 'none'; // ซ่อนส่วนปฏิทิน
    usernameInput.value = ''; // เคลียร์ input
    passwordInput.value = '';
    loginMessage.textContent = '';
});

// ดึงข้อมูลค่าแรงรายวันสำหรับเดือนปัจจุบันจาก Back-end
async function fetchDailyEarnings() {
    if (!loggedInUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/daily-earnings/${loggedInUser.id}/${currentYear}/${currentMonth + 1}`);
        if (!response.ok) {
            throw new Error('Failed to fetch daily earnings');
        }
        const data = await response.json();
        dailyEarningsData = {}; // เคลียร์ข้อมูลเก่า
        data.forEach(item => {
            const dateKey = item.record_date.split('T')[0]; // แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD
            dailyEarningsData[dateKey] = item;
        });
    } catch (error) {
        console.error('Error fetching daily earnings:', error);
        dailyEarningsData = {}; // ถ้ามี error ให้เคลียร์ข้อมูล
    }
}

// ดึงยอดรวมค่าแรงรายเดือนจาก Back-end (ตามรอบตัดยอด 21-20)
async function fetchMonthlySummary() {
    if (!loggedInUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/monthly-summary/${loggedInUser.id}/${currentYear}/${currentMonth + 1}`);
        if (!response.ok) {
            throw new Error('Failed to fetch monthly summary');
        }
        const summary = await response.json();
        // แสดงผลยอดรวมในหน้าเว็บ
        totalWageDisplay.textContent = parseFloat(summary.total_wage || 0).toLocaleString('th-TH');
        totalOvertimeDisplay.textContent = parseFloat(summary.total_overtime || 0).toLocaleString('th-TH');
        totalAllowanceDisplay.textContent = parseFloat(summary.total_allowance || 0).toLocaleString('th-TH');
        grandTotalDisplay.textContent = parseFloat(summary.grand_total || 0).toLocaleString('th-TH');
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        // ถ้ามี error ให้แสดงเป็น 0
        totalWageDisplay.textContent = '0';
        totalOvertimeDisplay.textContent = '0';
        totalAllowanceDisplay.textContent = '0';
        grandTotalDisplay.textContent = '0';
    }
}

// ฟังก์ชันสร้างปฏิทิน
async function renderCalendar() {
    // แสดงเดือนและปีปัจจุบัน
    currentMonthYearHeader.textContent = new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = ''; // ล้างปฏิทินเก่า

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // วันแรกของเดือน (0=อาทิตย์, 1=จันทร์, ...)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // จำนวนวันในเดือน

    // เพิ่มหัวตารางวัน (อา, จ, อ,...)
    const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // ดึงข้อมูลค่าแรงและยอดรวมมาก่อนที่จะสร้างเซลล์ปฏิทิน
    await fetchDailyEarnings();
    await fetchMonthlySummary();

    // สร้างเซลล์ว่างสำหรับวันก่อนหน้าวันแรกของเดือน
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // สร้างเซลล์สำหรับแต่ละวันในเดือน
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

        const dayCell = document.createElement('div');
        dayCell.classList.add('day');
        dayCell.innerHTML = `<span class="date-number">${day}</span>`;

        // ถ้ามีข้อมูลค่าแรงสำหรับวันนี้ ให้แสดงในเซลล์
        if (dailyEarningsData[dateKey]) {
            const earnings = dailyEarningsData[dateKey];
            const earningsDiv = document.createElement('div');
            earningsDiv.classList.add('earnings-summary');
            earningsDiv.innerHTML += `<small>ค่าแรง: ${parseFloat(earnings.daily_wage || 0).toLocaleString('th-TH')}</small><br>`;
            earningsDiv.innerHTML += `<small>โอที: ${parseFloat(earnings.overtime_pay || 0).toLocaleString('th-TH')}</small><br>`;
            earningsDiv.innerHTML += `<small>เบี้ยเลี้ยง: ${parseFloat(earnings.allowance || 0).toLocaleString('th-TH')}</small>`;
            dayCell.appendChild(earningsDiv);
            dayCell.classList.add('has-data'); // เพิ่ม class เพื่อจัด style
        }

        // ไฮไลท์วันปัจจุบัน
        if (date.toDateString() === new Date().toDateString()) {
            dayCell.classList.add('current-day');
        }

        // เพิ่ม Event Listener สำหรับเปิด Modal เมื่อคลิกที่วัน
        dayCell.addEventListener('click', () => openEarningsModal(date));
        calendarGrid.appendChild(dayCell);
    }
}

// ฟังก์ชันเปิด Modal สำหรับบันทึก/แก้ไขค่าแรง
function openEarningsModal(date) {
    selectedDate = date;
    modalDateDisplay.textContent = selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const existingEarnings = dailyEarningsData[dateKey];

    // แสดงข้อมูลค่าแรงที่มีอยู่ (ถ้ามี) ใน Modal
    if (existingEarnings) {
        displayDailyWage.textContent = parseFloat(existingEarnings.daily_wage || 0).toLocaleString('th-TH');
        displayOvertimePay.textContent = parseFloat(existingEarnings.overtime_pay || 0).toLocaleString('th-TH');
        displayAllowance.textContent = parseFloat(existingEarnings.allowance || 0).toLocaleString('th-TH');
        
        // กำหนดค่าใน input fields ด้วยข้อมูลที่มีอยู่
        inputDailyWage.value = parseFloat(existingEarnings.daily_wage || 0);
        inputOvertimePay.value = parseFloat(existingEarnings.overtime_pay || 0);
        inputAllowance.value = parseFloat(existingEarnings.allowance || 0);
    } else {
        // ถ้าไม่มีข้อมูล ให้แสดงเป็น 0 และเคลียร์ input fields
        displayDailyWage.textContent = '0';
        displayOvertimePay.textContent = '0';
        displayAllowance.textContent = '0';

        inputDailyWage.value = '0';
        inputOvertimePay.value = '0';
        inputAllowance.value = '0';
    }

    noteModal.style.display = 'block'; // แสดง Modal
}

// Event Listener สำหรับปุ่มปิด Modal
closeModalButton.addEventListener('click', () => {
    noteModal.style.display = 'none'; // ซ่อน Modal
});

// Event Listener สำหรับปุ่มบันทึกข้อมูลค่าแรง
saveEarningsButton.addEventListener('click', async () => {
    if (!selectedDate || !loggedInUser) return; // ตรวจสอบว่ามีวันที่เลือกและผู้ใช้ล็อกอินอยู่

    const recordDate = selectedDate.toISOString().split('T')[0]; // วันที่ในรูปแบบ YYYY-MM-DD
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
            noteModal.style.display = 'none'; // ปิด Modal
            renderCalendar(); // รีเรนเดอร์ปฏิทินเพื่อแสดงข้อมูลใหม่
        } else {
            const errorData = await response.json();
            alert('บันทึกข้อมูลค่าแรงไม่สำเร็จ: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving earnings:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        noteModal.style.display = 'none'; // ปิด modal แม้เกิด error
    }
});

// Event Listener สำหรับปุ่มเดือนก่อนหน้า
prevMonthButton.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { // ถ้าเป็นเดือนก่อนหน้าเดือนมกราคม ให้ย้ายไปปีที่แล้ว
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(); // สร้างปฏิทินใหม่
});

// Event Listener สำหรับปุ่มเดือนถัดไป
nextMonthButton.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { // ถ้าเป็นเดือนถัดไปเดือนธันวาคม ให้ย้ายไปปีหน้า
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(); // สร้างปฏิทินใหม่
});

// เมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        loggedInUser = JSON.parse(storedUser); // ดึงข้อมูลผู้ใช้จาก Local Storage
        loginSection.style.display = 'none'; // ซ่อนส่วน Login
        calendarSection.style.display = 'block'; // แสดงส่วนปฏิทิน
        loggedInUserDisplay.textContent = `เข้าสู่ระบบโดย: ${loggedInUser.username}`;
        renderCalendar(); // สร้างปฏิทิน
    } else {
        loginSection.style.display = 'block'; // แสดงส่วน Login
        calendarSection.style.display = 'none'; // ซ่อนส่วนปฏิทิน
    }
});