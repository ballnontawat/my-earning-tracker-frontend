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
const loggedInUserSpan = document.getElementById('logged-in-user');
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

// Add elements for Custom Confirmation Modal (แทนที่ alert/confirm)
const confirmModal = document.createElement('div');
confirmModal.id = 'confirm-modal';
confirmModal.classList.add('modal'); // Re-use the existing modal class for styling
confirmModal.innerHTML = `
    <div class="modal-content">
        <span class="close-button" id="close-confirm-modal">&times;</span>
        <h3>ยืนยันการลบ</h3>
        <p>คุณต้องการลบโน้ตนี้หรือไม่?</p>
        <button id="confirm-delete-yes" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">ใช่</button>
        <button id="confirm-delete-no" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded ml-2">ไม่</button>
    </div>
`;
document.body.appendChild(confirmModal); // Append the modal to the body

const closeConfirmModalButton = document.getElementById('close-confirm-modal');
const confirmDeleteYesButton = document.getElementById('confirm-delete-yes');
const confirmDeleteNoButton = document.getElementById('confirm-delete-no');


// ---------------------------
// 2. Global Variables (ตัวแปรทั่วโลก)
// ---------------------------
let currentMonth = new Date().getMonth(); // Current month (0-11)
let currentYear = new Date().getFullYear(); // Current year
let selectedDate = null; // Selected date for note taking

// *** API_BASE_URL ที่ถูกต้อง (ตามที่คุณเคยแจ้งไว้) ***
const API_BASE_URL = 'https://my-calendar-backend-api.onrender.com/api';
// ----------------------------------------------------

let notes = {}; // Object to temporarily store notes (will be updated from API)
let loggedInUser = null; // Stores the currently logged-in user's info { name, colorClass }

// User configuration mapping passwords to user details
const userConfig = {
    'ball': { name: 'บอล', colorClass: 'note-ball', password: 'ball' },
    'ram': { name: 'ราม', colorClass: 'note-ram', password: 'ram' }
};

const thaiDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']; // เพิ่ม array ชื่อวันภาษาไทย

// ---------------------------
// 3. Functions (ฟังก์ชันการทำงาน)
// ---------------------------

// Function to show/hide different sections of the page
function showLogin() {
    loginSection.style.display = 'block';
    calendarSection.style.display = 'none';
    noteModal.style.display = 'none';
    confirmModal.style.display = 'none';
    loggedInUser = null;
    loggedInUserSpan.textContent = '';
    passwordInput.value = '';
}

function showCalendar() {
    loginSection.style.display = 'none';
    calendarSection.style.display = 'block';
    noteModal.style.display = 'none';
    confirmModal.style.display = 'none';
    if (loggedInUser) {
        loggedInUserSpan.textContent = `ผู้ใช้: ${loggedInUser.name}`;
    }
    renderCalendar();
}

// Function to render the calendar and fetch notes from the Backend
async function renderCalendar() {
    calendarGrid.innerHTML = ''; // Clear old dates

    // *** Fetch notes from Backend ***
    try {
        const response = await fetch(`${API_BASE_URL}/notes`);
        if (response.ok) {
            const fetchedNotes = await response.json();
            notes = {}; // Reinitialize notes object
            fetchedNotes.forEach(note => {
                notes[note.date] = { text: note.text, user_name: note.user_name };
            });
        } else {
            console.error('Failed to fetch notes:', response.status, response.statusText);
            loginMessage.textContent = 'ไม่สามารถดึงข้อมูลโน้ตได้';
            setTimeout(() => loginMessage.textContent = '', 3000);
        }
    } catch (error) {
        console.error('Error fetching notes:', error);
        loginMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
        setTimeout(() => loginMessage.textContent = '', 3000);
    }
    // *** End fetching notes from Backend ***

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday ...

    currentMonthYear.textContent = new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' });

    // Add day names to the grid (for desktop view, hidden on mobile by CSS)
    thaiDayNames.forEach(name => { // ใช้ thaiDayNames ที่ประกาศไว้ด้านบน
        const dayNameCell = document.createElement('div');
        dayNameCell.classList.add('day-name');
        dayNameCell.textContent = name;
        calendarGrid.appendChild(dayNameCell);
    });

    // สร้างช่องว่างของวันก่อนหน้า
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty-day');
        calendarGrid.appendChild(emptyCell);
    }

    // สร้างช่องวันสำหรับแต่ละวันในเดือน
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        
        // Determine the day of the week for styling
        const currentDay = new Date(currentYear, currentMonth, i);
        const dayOfWeek = currentDay.getDay(); // 0 for Sunday, 6 for Saturday
        if (dayOfWeek === 0) {
            dayCell.classList.add('sunday');
        } else if (dayOfWeek === 6) {
            dayCell.classList.add('saturday');
        } else {
            dayCell.classList.add('weekday');
        }

        // *** เริ่มต้นส่วนที่แก้ไขสำหรับแสดงชื่อวันในช่อง ***
        const dayNameInCellSpan = document.createElement('span'); // สร้าง span สำหรับชื่อวัน
        dayNameInCellSpan.classList.add('day-name-in-cell');
        dayNameInCellSpan.textContent = thaiDayNames[dayOfWeek]; // ใส่ชื่อวันภาษาไทย
        dayCell.appendChild(dayNameInCellSpan); // เพิ่มชื่อวันเข้าไปก่อนตัวเลข
        // *** สิ้นสุดส่วนที่แก้ไขสำหรับแสดงชื่อวันในช่อง ***

        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);

        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const noteData = notes[dateKey]; // Get note data (if any)
        if (noteData && noteData.text) {
            const noteDiv = document.createElement('div');
            noteDiv.classList.add('day-note');
            noteDiv.textContent = `${noteData.user_name}: ${noteData.text}`;
            
            // Apply user-specific color class
            const userColorClass = userConfig[Object.keys(userConfig).find(key => userConfig[key].name === noteData.user_name)]?.colorClass;
            if (userColorClass) {
                noteDiv.classList.add(userColorClass);
            }

            dayCell.appendChild(noteDiv);
        }

        // เพิ่ม Event Listener เมื่อคลิกที่ช่องวัน
        dayCell.addEventListener('click', () => {
            selectedDate = dateKey;
            modalDate.textContent = new Date(currentYear, currentMonth, i).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            noteText.value = (notes[dateKey] && notes[dateKey].text) ? notes[dateKey].text : '';
            
            // แสดง/ซ่อนปุ่มลบ ถ้ามีโน้ตอยู่
            if (notes[dateKey] && notes[dateKey].text) {
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
document.addEventListener('DOMContentLoaded', () => {
    // Check if user was previously logged in (e.g., from localStorage)
    // For this multi-user setup, we'll force login for simplicity
    const storedUserName = localStorage.getItem('loggedInUserName');
    const storedUserColorClass = localStorage.getItem('loggedInUserColorClass');

    if (storedUserName && storedUserColorClass) {
        const userKey = Object.keys(userConfig).find(key => userConfig[key].name === storedUserName);
        if (userKey) {
            loggedInUser = userConfig[userKey];
            showCalendar();
        } else {
            showLogin();
        }
    } else {
        showLogin();
    }
});

// จัดการการส่งฟอร์ม Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = passwordInput.value;

    const foundUser = Object.values(userConfig).find(u => u.password === password);

    if (foundUser) {
        loggedInUser = foundUser;
        loginMessage.textContent = '';
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loggedInUserName', loggedInUser.name);
        localStorage.setItem('loggedInUserColorClass', loggedInUser.colorClass);
        showCalendar();
    } else {
        loginMessage.textContent = 'รหัสผ่านไม่ถูกต้อง';
    }
    passwordInput.value = '';
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
saveNoteButton.addEventListener('click', async () => {
    if (selectedDate && loggedInUser) {
        const noteContent = noteText.value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date: selectedDate, text: noteContent, user_name: loggedInUser.name }),
            });
            if (response.ok) {
                notes[selectedDate] = { text: noteContent, user_name: loggedInUser.name };
                console.log('Note saved to backend successfully!');
            } else {
                console.error('Failed to save note to backend:', response.status, response.statusText);
                loginMessage.textContent = 'ไม่สามารถบันทึกโน้ตได้';
                setTimeout(() => loginMessage.textContent = '', 3000);
            }
        } catch (error) {
            console.error('Error saving note:', error);
            loginMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
            setTimeout(() => loginMessage.textContent = '', 3000);
        }

        noteModal.style.display = 'none';
        renderCalendar();
    } else if (!loggedInUser) {
        loginMessage.textContent = 'กรุณาเข้าสู่ระบบก่อนบันทึกโน้ต';
        setTimeout(() => loginMessage.textContent = '', 3000);
    }
});

// จัดการปุ่มลบโน้ต
deleteNoteButton.addEventListener('click', () => {
    if (selectedDate) {
        confirmModal.style.display = 'flex';
    }
});

// Event listener for "Yes" button in Custom Confirmation Modal
confirmDeleteYesButton.addEventListener('click', async () => {
    confirmModal.style.display = 'none';
    if (selectedDate) {
        try {
            const response = await fetch(`${API_BASE_URL}/notes/${selectedDate}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                delete notes[selectedDate];
                console.log('Note deleted from backend successfully!');
            } else {
                console.error('Failed to delete note from backend:', response.status, response.statusText);
                loginMessage.textContent = 'ไม่สามารถลบโน้ตได้';
                setTimeout(() => loginMessage.textContent = '', 3000);
            }
        } catch (error) {
            console.error('Error deleting note from backend:', error);
            loginMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
            setTimeout(() => loginMessage.textContent = '', 3000);
        }

        noteModal.style.display = 'none';
        renderCalendar();
    }
});

// Event listener for "No" button in Custom Confirmation Modal
confirmDeleteNoButton.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

// Handle close note modal button
closeModalButton.addEventListener('click', () => {
    noteModal.style.display = 'none';
});

// Handle close custom confirmation modal button
closeConfirmModalButton.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

// Handle clicks outside the modal to close (for noteModal)
window.addEventListener('click', (event) => {
    if (event.target == noteModal) {
        noteModal.style.display = 'none';
    }
    if (event.target == confirmModal) {
        confirmModal.style.display = 'none';
    }
});

// Handle logout button
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loggedInUserName');
    localStorage.removeItem('loggedInUserColorClass');
    showLogin();
});