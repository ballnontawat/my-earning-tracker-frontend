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
const loggedInUserSpan = document.getElementById('logged-in-user'); // New: Element to display logged-in user
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

// *** This is the API_BASE_URL that needs to be updated ***
// URL ที่ถูกต้องควรเป็น https://my-calendar-backend-api.onrender.com/api
const API_BASE_URL = 'https://my-calendar-backend-api.onrender.com/api'; // <--- บรรทัดนี้คือ URL ที่แก้ไขแล้ว!
// ----------------------------------------------------

let notes = {}; // Object to temporarily store notes (will be updated from API)
let loggedInUser = null; // New: Stores the currently logged-in user's info { name, colorClass }

// New: User configuration mapping passwords to user details
const userConfig = {
    'ball': { name: 'บอล', colorClass: 'note-ball', password: 'ball' }, // Added password to user config
    'ram': { name: 'ราม', colorClass: 'note-ram', password: 'ram' } // Added password to user config
};

// ---------------------------
// 3. Functions (ฟังก์ชันการทำงาน)
// ---------------------------

// Function to show/hide different sections of the page
function showLogin() {
    loginSection.style.display = 'block';
    calendarSection.style.display = 'none';
    noteModal.style.display = 'none';
    confirmModal.style.display = 'none'; // Hide confirm modal too
    loggedInUser = null; // Clear logged-in user on logout
    loggedInUserSpan.textContent = ''; // Clear user display
    passwordInput.value = ''; // Clear password field
}

function showCalendar() {
    loginSection.style.display = 'none';
    calendarSection.style.display = 'block';
    noteModal.style.display = 'none';
    confirmModal.style.display = 'none'; // Hide confirm modal too
    if (loggedInUser) {
        loggedInUserSpan.textContent = `ผู้ใช้: ${loggedInUser.name}`; // Display logged-in user
    }
    renderCalendar(); // Render the calendar when showing the calendar section
}

// Function to render the calendar and fetch notes from the Backend
async function renderCalendar() {
    calendarGrid.innerHTML = ''; // Clear old dates

    // *** Fetch notes from Backend ***
    try {
        const response = await fetch(`${API_BASE_URL}/notes`);
        if (response.ok) {
            const fetchedNotes = await response.json();
            // Clear old notes from the local object
            notes = {}; // Reinitialize notes object
            // Add fetched notes to the local notes object
            fetchedNotes.forEach(note => {
                // Store note with user_name
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

    // Define day names for display
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

    // Add day names to the grid
    dayNames.forEach(name => {
        const dayNameCell = document.createElement('div');
        dayNameCell.classList.add('day-name');
        dayNameCell.textContent = name;
        calendarGrid.appendChild(dayNameCell);
    });

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
        
        // Determine the day of the week for styling
        const currentDay = new Date(currentYear, currentMonth, i).getDay(); // 0 for Sunday, 6 for Saturday
        if (currentDay === 0) {
            dayCell.classList.add('sunday'); // Add class for Sunday
        } else if (currentDay === 6) {
            dayCell.classList.add('saturday'); // Add class for Saturday
        } else {
            dayCell.classList.add('weekday'); // Add class for other weekdays (optional, for general styling)
        }

        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);

        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const noteData = notes[dateKey]; // Get note data (if any)
        if (noteData && noteData.text) {
            const noteDiv = document.createElement('div');
            noteDiv.classList.add('day-note');
            // Add user's name to the note text and apply color class
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
            noteText.value = (notes[dateKey] && notes[dateKey].text) ? notes[dateKey].text : ''; // Display old note (if any)
            
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
    showLogin();
});

// จัดการการส่งฟอร์ม Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าเมื่อ submit ฟอร์ม
    const password = passwordInput.value;

    // Corrected logic: Find user by password (key of userConfig is the password)
    const foundUser = Object.values(userConfig).find(u => u.password === password); // Find user object directly

    if (foundUser) {
        loggedInUser = foundUser; // Store the user's name and colorClass
        loginMessage.textContent = ''; // Clear error message
        localStorage.setItem('isAuthenticated', 'true'); // Store login status (can be enhanced with user ID)
        localStorage.setItem('loggedInUserName', loggedInUser.name); // Store user name
        localStorage.setItem('loggedInUserColorClass', loggedInUser.colorClass); // Store user color class
        showCalendar(); // แสดงปฏิทิน
    } else {
        loginMessage.textContent = 'รหัสผ่านไม่ถูกต้อง';
    }
    passwordInput.value = ''; // Clear password field
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
    if (selectedDate && loggedInUser) { // Ensure a user is logged in
        const noteContent = noteText.value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send user_name along with date and text
                body: JSON.stringify({ date: selectedDate, text: noteContent, user_name: loggedInUser.name }),
            });
            if (response.ok) {
                // Update local object with new note data including user_name
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
        confirmModal.style.display = 'flex'; // Show confirmation modal
    }
});

// Event listener for "Yes" button in Custom Confirmation Modal
confirmDeleteYesButton.addEventListener('click', async () => {
    confirmModal.style.display = 'none'; // Hide confirmation modal
    if (selectedDate) {
        try {
            const response = await fetch(`${API_BASE_URL}/notes/${selectedDate}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                delete notes[selectedDate]; // Delete from local object after successful deletion
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
    confirmModal.style.display = 'none'; // Hide confirmation modal
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
    // For confirmModal
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

// Initial check on page load
document.addEventListener('DOMContentLoaded', () => {
    const storedUserName = localStorage.getItem('loggedInUserName');
    const storedUserColorClass = localStorage.getItem('loggedInUserColorClass');

    // Re-populate loggedInUser if data exists in localStorage
    if (storedUserName && storedUserColorClass) {
        // Find the user config based on the stored name to get the password (key)
        const userKey = Object.keys(userConfig).find(key => userConfig[key].name === storedUserName);
        if (userKey) {
            loggedInUser = userConfig[userKey]; // Set loggedInUser from userConfig
            showCalendar();
        } else {
            // If stored user not found in userConfig (e.g., userConfig changed), force login
            showLogin();
        }
    } else {
        showLogin();
    }
});
