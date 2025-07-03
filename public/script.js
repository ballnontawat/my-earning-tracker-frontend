// script.js

// ---------------------------
// 1. DOM Elements (ดึงองค์ประกอบ HTML มาใช้งาน)
// ---------------------------
const loginSection = document.getElementById('login-section');
const calendarSection = document.getElementById('calendar-section');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('login-message');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const calendarGrid = document.querySelector('.calendar-grid');
const logoutButton = document.getElementById('logout-button');

const noteModal = document.getElementById('note-modal');
const closeModalButton = noteModal.querySelector('.close-button');
const modalDate = document.getElementById('modal-date');
const noteText = document.getElementById('note-text');
const saveNoteButton = document.getElementById('save-note-button');
const deleteNoteButton = document.getElementById('delete-note-button');

// ---------------------------
// 2. Global Variables (ตัวแปรทั่วโลก)
// ---------------------------
let currentMonth = new Date().getMonth(); // เดือนปัจจุบัน (0-11)
let currentYear = new Date().getFullYear(); // ปีปัจจุบัน
let selectedDate = null; // วันที่ที่เลือกในปฏิทินสำหรับบันทึกโน้ต
const notes = {}; // Object สำหรับเก็บโน้ตชั่วคราว (Key: 'YYYY-MM-DD', Value: 'Note Text')

// ---------------------------
// 3. Functions (ฟังก์ชันการทำงาน)
// ---------------------------

// ฟังก์ชันสำหรับแสดง/ซ่อนส่วนต่างๆ ของหน้าเว็บ
function showLogin() {
    loginSection.style.display = 'block';
    calendarSection.style.display = 'none';
    noteModal.style.display = 'none';
}

function showCalendar() {
    loginSection.style.display = 'none';
    calendarSection.style.display = 'block';
    noteModal.style.display = 'none';
    renderCalendar(); // เมื่อแสดงปฏิทิน ให้สร้างปฏิทินขึ้นมา
}

// ฟังก์ชันสำหรับสร้างปฏิทิน
function renderCalendar() {
    calendarGrid.innerHTML = ''; // ล้างวันที่เก่าออกก่อน
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = อาทิตย์, 1 = จันทร์ ...

    currentMonthYear.textContent = new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' });

    // สร้างช่องว่างของวันก่อนหน้า (เพื่อให้วันแรกของเดือนตรงกับวันในสัปดาห์)
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty-day');
        calendarGrid.appendChild(emptyCell);
    }

    // สร้างช่องวันสำหรับแต่ละวันในเดือน
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        
        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);

        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const noteTextContent = notes[dateKey]; // ดึงโน้ต (ถ้ามี)
        if (noteTextContent) {
            const noteDiv = document.createElement('div');
            noteDiv.classList.add('day-note');
            noteDiv.textContent = noteTextContent;
            dayCell.appendChild(noteDiv);
        }

        // เพิ่ม Event Listener เมื่อคลิกที่ช่องวัน
        dayCell.addEventListener('click', () => {
            selectedDate = dateKey;
            modalDate.textContent = new Date(currentYear, currentMonth, i).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            noteText.value = notes[dateKey] || ''; // แสดงโน้ตเก่า (ถ้ามี)
            
            // แสดง/ซ่อนปุ่มลบ ถ้ามีโน้ตอยู่
            if (notes[dateKey]) {
                deleteNoteButton.style.display = 'inline-block';
            } else {
                deleteNoteButton.style.display = 'none';
            }
            
            noteModal.style.display = 'flex'; // แสดง modal
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

// ---------------------------
// 4. Event Listeners (จัดการเหตุการณ์ต่างๆ)
// ---------------------------

// เมื่อโหลดหน้าเว็บ ให้แสดงหน้า Login ก่อน
document.addEventListener('DOMContentLoaded', showLogin);

// จัดการการส่งฟอร์ม Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าเมื่อ submit ฟอร์ม
    const password = passwordInput.value;

    // *** นี่คือรหัสผ่านที่คุณกำหนดเองเพื่อทดสอบ ***
    // *** ในโปรเจกต์จริง ห้ามเก็บรหัสผ่านแบบนี้เด็ดขาด ต้องตรวจสอบกับ Backend เท่านั้น! ***
    if (password === '12345') { // รหัสผ่านทดสอบ
        loginMessage.textContent = ''; // ล้างข้อความ error
        localStorage.setItem('isAuthenticated', 'true'); // เก็บสถานะว่าล็อกอินแล้ว
        showCalendar(); // แสดงปฏิทิน
    } else {
        loginMessage.textContent = 'รหัสผ่านไม่ถูกต้อง';
    }
    passwordInput.value = ''; // ล้างช่องรหัสผ่าน
});

// จัดการปุ่มเปลี่ยนเดือน
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

// จัดการปุ่มบันทึกโน้ต
saveNoteButton.addEventListener('click', () => {
    if (selectedDate) {
        notes[selectedDate] = noteText.value; // บันทึกโน้ตลงใน object ชั่วคราว
        noteModal.style.display = 'none'; // ซ่อน modal
        renderCalendar(); // อัปเดตปฏิทินเพื่อแสดงโน้ต
    }
});

// จัดการปุ่มลบโน้ต
deleteNoteButton.addEventListener('click', () => {
    if (selectedDate && confirm('คุณต้องการลบโน้ตนี้หรือไม่?')) {
        delete notes[selectedDate]; // ลบโน้ตออกจาก object
        noteModal.style.display = 'none';
        renderCalendar();
    }
});


// จัดการปุ่มปิด Pop-up
closeModalButton.addEventListener('click', () => {
    noteModal.style.display = 'none';
});

// จัดการการคลิกนอก Pop-up เพื่อปิด
window.addEventListener('click', (event) => {
    if (event.target == noteModal) {
        noteModal.style.display = 'none';
    }
});

// จัดการปุ่มออกจากระบบ
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('isAuthenticated'); // ลบสถานะล็อกอิน
    notes = {}; // ล้างโน้ตชั่วคราว
    showLogin(); // กลับไปหน้า Login
});

// ตรวจสอบสถานะการล็อกอินเมื่อโหลดหน้าเว็บ
// ถ้าเคยล็อกอินไว้แล้ว ให้เข้าสู่หน้าปฏิทินได้เลย
if (localStorage.getItem('isAuthenticated') === 'true') {
    showCalendar();
} else {
    showLogin();
}