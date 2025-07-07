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
const closeModalButton = document.getElementById('close-modal'); // ใช้ id ที่เพิ่มใน HTML ใหม่
const modalDate = document.getElementById('modal-date');

// newNoteTextInput และ addNewNoteButton สำหรับ 'เพิ่ม' โน้ตใหม่
const newNoteTextInput = document.getElementById('new-note-text');
const addNewNoteButton = document.getElementById('add-new-note-button');

const existingNotesContainer = document.getElementById('existing-notes-container'); // สำหรับแสดงโน้ตที่มีอยู่

// Add elements for Custom Confirmation Modal (สร้าง Modal ยืนยันการลบ)
const confirmModal = document.createElement('div');
confirmModal.id = 'confirm-modal';
confirmModal.classList.add('modal');
confirmModal.innerHTML = `
    <div class="modal-content">
        <span class="close-button" id="close-confirm-modal">&times;</span>
        <h3>ยืนยันการลบ</h3>
        <p>คุณต้องการลบโน้ตนี้หรือไม่?</p>
        <button id="confirm-delete-yes" class="confirm-button confirm-yes">ใช่</button>
        <button id="confirm-delete-no" class="confirm-button confirm-no">ไม่</button>
    </div>
`;
document.body.appendChild(confirmModal); // เพิ่ม Modal นี้เข้าใน body ของ HTML

const closeConfirmModalButton = document.getElementById('close-confirm-modal');
const confirmDeleteYesButton = document.getElementById('confirm-delete-yes');
const confirmDeleteNoButton = document.getElementById('confirm-delete-no');


// ---------------------------
// 2. Global Variables (ตัวแปรทั่วโลก)
// ---------------------------
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null; // Selected date for note taking
let noteToDeleteId = null; // เก็บ ID ของโน้ตที่กำลังจะลบ

// เปลี่ยน URL API ของคุณตามที่ Render.com ให้มา
const API_BASE_URL = 'https://my-calendar-backend-api.onrender.com/api'; 

// *** เปลี่ยนโครงสร้าง notes ให้เก็บ Array ของโน้ตสำหรับแต่ละวัน ***
// ตัวอย่าง: notes = { '2025-07-07': [{id: 'abc', text: 'ประชุม', user_name: 'บอล'}, {id: 'def', text: 'ส่งงาน', user_name: 'ราม'}] }
let notes = {};
let loggedInUser = null;

const userConfig = {
    'ball': { name: 'บอล', colorClass: 'note-ball', password: 'ball' },
    'ram': { name: 'ราม', colorClass: 'note-ram', password: 'ram' }
};

const thaiDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

// ---------------------------
// 3. Functions (ฟังก์ชันการทำงาน)
// ---------------------------

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

async function renderCalendar() {
    calendarGrid.innerHTML = ''; // ล้าง grid เดิมออก

    try {
        const response = await fetch(`${API_BASE_URL}/notes`);
        if (response.ok) {
            const fetchedNotes = await response.json();
            notes = {}; // Clear old notes
            // *** ปรับการจัดเก็บ fetchedNotes ให้เป็น Array ของโน้ตต่อวัน ***
            // วนลูปโน้ตที่ดึงมา และจัดกลุ่มตามวันที่
            fetchedNotes.forEach(note => {
                if (!notes[note.date]) {
                    notes[note.date] = []; // ถ้ายังไม่มี array สำหรับวันนี้ ให้สร้างใหม่
                }
                notes[note.date].push(note); // เพิ่มโน้ตเข้าไปใน Array ของวันนี้
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
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // แสดงเดือนและปีปัจจุบัน
    currentMonthYear.textContent = new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' });

    // สร้าง Header วันในสัปดาห์ (อาทิตย์-เสาร์)
    thaiDayNames.forEach(name => {
        const dayNameCell = document.createElement('div');
        dayNameCell.classList.add('day-name');
        dayNameCell.textContent = name;
        calendarGrid.appendChild(dayNameCell);
    });

    // สร้างช่องว่างสำหรับวันก่อนหน้าวันแรกของเดือน
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty-day');
        calendarGrid.appendChild(emptyCell);
    }

    // สร้างช่องวันสำหรับแต่ละวันในเดือน
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        
        const currentDay = new Date(currentYear, currentMonth, i);
        const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0) {
            dayCell.classList.add('sunday');
        } else if (dayOfWeek === 6) {
            dayCell.classList.add('saturday');
        } else {
            dayCell.classList.add('weekday');
        }

        // เพิ่มชื่อวันในช่อง (สำหรับ Mobile)
        const dayNameInCellSpan = document.createElement('span');
        dayNameInCellSpan.classList.add('day-name-in-cell');
        dayNameInCellSpan.textContent = thaiDayNames[dayOfWeek];
        dayCell.appendChild(dayNameInCellSpan);

        // เพิ่มเลขวัน
        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);

        // สร้าง DateKey ในรูปแบบ YYYY-MM-DD
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayNotes = notes[dateKey]; // *** ดึง Array ของโน้ตสำหรับวันนี้ ***

        if (dayNotes && dayNotes.length > 0) {
            // *** แสดงโน้ตทั้งหมดสำหรับวันนี้ใน Day Cell ***
            dayNotes.forEach(noteData => {
                const noteDiv = document.createElement('div');
                noteDiv.classList.add('day-note');
                noteDiv.textContent = `${noteData.user_name}: ${noteData.text}`; // แสดงชื่อผู้ใช้และข้อความ
                
                // เพิ่ม class สีตามผู้ใช้
                const userColorClass = userConfig[Object.keys(userConfig).find(key => userConfig[key].name === noteData.user_name)]?.colorClass;
                if (userColorClass) {
                    noteDiv.classList.add(userColorClass);
                }
                dayCell.appendChild(noteDiv); // เพิ่มโน้ตลงในช่องวัน
            });
        }

        // เพิ่ม Event Listener เมื่อคลิกที่ช่องวัน
        dayCell.addEventListener('click', () => {
            selectedDate = dateKey;
            // แสดงวันที่ใน Modal
            modalDate.textContent = new Date(currentYear, currentMonth, i).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            
            // *** แสดงโน้ตที่มีอยู่และปุ่มแก้ไข/ลบใน Modal ***
            renderNotesInModal(dateKey);

            noteModal.style.display = 'flex'; // แสดง Modal
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

// *** ฟังก์ชันใหม่: แสดงโน้ตใน Modal (มีปุ่มแก้ไข/ลบตามสิทธิ์) ***
function renderNotesInModal(dateKey) {
    existingNotesContainer.innerHTML = ''; // ล้างโน้ตเดิมใน Modal ออก
    const dayNotes = notes[dateKey] || []; // ดึงโน้ตสำหรับวันนี้

    if (dayNotes.length > 0) {
        // วนลูปแสดงโน้ตแต่ละบันทึก
        dayNotes.forEach(note => {
            const noteItemDiv = document.createElement('div');
            noteItemDiv.classList.add('modal-note-item'); // เพิ่ม class สำหรับจัด style ใน Modal
            
            const noteTextSpan = document.createElement('span');
            noteTextSpan.textContent = `${note.user_name}: ${note.text}`; // แสดงชื่อผู้ใช้และข้อความโน้ต
            noteItemDiv.appendChild(noteTextSpan);

            // เพิ่ม class สีตามผู้ใช้
            const userColorClass = userConfig[Object.keys(userConfig).find(key => userConfig[key].name === note.user_name)]?.colorClass;
            if (userColorClass) {
                noteTextSpan.classList.add(userColorClass);
            }

            // *** ปุ่มแก้ไขและลบ (มีเงื่อนไขสิทธิ์) ***
            if (note.user_name === loggedInUser.name) { // ถ้าโน้ตนี้เป็นของ user ที่ login อยู่
                const editButton = document.createElement('button');
                editButton.textContent = 'แก้ไข';
                editButton.classList.add('edit-note-button');
                editButton.onclick = () => openEditNoteModal(note); // เรียกฟังก์ชันแก้ไขโน้ต
                noteItemDiv.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'ลบ';
                deleteButton.classList.add('delete-note-button-inline'); 
                deleteButton.onclick = () => confirmDeleteNote(note.id); // เรียกฟังก์ชันยืนยันการลบโน้ต
                noteItemDiv.appendChild(deleteButton);
            } else {
                // ถ้าไม่ใช่โน้ตของตัวเอง ให้แสดงข้อความว่า "ดูอย่างเดียว"
                const viewOnlySpan = document.createElement('span');
                viewOnlySpan.textContent = ' (ดูอย่างเดียว)';
                viewOnlySpan.classList.add('view-only-text');
                noteItemDiv.appendChild(viewOnlySpan);
            }
            existingNotesContainer.appendChild(noteItemDiv); // เพิ่มโน้ตลงใน Modal
        });
    } else {
        existingNotesContainer.innerHTML = '<p>ยังไม่มีโน้ตสำหรับวันนี้</p>'; // ถ้าไม่มีโน้ต
    }

    // *** จัดการช่องเพิ่มโน้ตใหม่ (ไม่มีการจำกัดจำนวน) ***
    newNoteTextInput.style.display = 'block'; // ให้แสดงช่องเพิ่มโน้ต
    addNewNoteButton.style.display = 'inline-block'; // ให้แสดงปุ่มเพิ่มโน้ต
    newNoteTextInput.value = ''; // ล้างค่าในช่อง input สำหรับโน้ตใหม่
}

// *** ฟังก์ชันสำหรับเปิด Modal เพื่อแก้ไขโน้ต ***
// (ใช้ prompt/confirm ชั่วคราวเพื่อให้เห็นภาพ ถ้าต้องการ UI ที่สวยงามต้องสร้าง Modal แยกต่างหาก)
async function openEditNoteModal(note) {
    const newText = prompt(`แก้ไขโน้ตของ ${note.user_name}:`, note.text); // ใช้ prompt ให้ผู้ใช้แก้ไขข้อความ
    if (newText !== null && newText.trim() !== note.text.trim()) { // ถ้าผู้ใช้ใส่ข้อความและไม่เหมือนเดิม
        try {
            const response = await fetch(`${API_BASE_URL}/notes/${note.id}`, { // เรียก API PUT เพื่อแก้ไขโน้ต
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText, user_name: loggedInUser.name }) // ส่ง user_name ไป Backend เพื่อยืนยันสิทธิ์
            });
            if (response.ok) {
                const updatedNote = await response.json(); // Backend ควรส่งโน้ตที่อัปเดตแล้วกลับมา
                // อัปเดตโน้ตใน local notes object (ในหน่วยความจำของเบราว์เซอร์)
                const index = notes[note.date].findIndex(n => n.id === note.id);
                if (index !== -1) {
                    notes[note.date][index] = updatedNote; // แทนที่ด้วยโน้ตที่อัปเดตแล้ว
                }
                console.log('Note updated successfully!');
                renderCalendar(); // Render ปฏิทินใหม่เพื่อแสดงผลล่าสุด
                renderNotesInModal(selectedDate); // อัปเดต Modal ให้แสดงผลล่าสุด
            } else {
                const errorData = await response.json();
                console.error('Failed to update note:', response.status, errorData.message || response.statusText);
                alert(`ไม่สามารถแก้ไขโน้ตได้: ${errorData.message || 'เกิดข้อผิดพลาด'}`);
            }
        } catch (error) {
            console.error('Error updating note:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    }
}

// *** ฟังก์ชันสำหรับยืนยันการลบโน้ต ***
function confirmDeleteNote(noteId) {
    noteToDeleteId = noteId; // เก็บ ID โน้ตที่จะลบไว้
    confirmModal.style.display = 'flex'; // แสดง Modal ยืนยัน
}

// ---------------------------
// 4. Event Listeners (จัดการเหตุการณ์ต่างๆ)
// ---------------------------

// เมื่อ DOM โหลดเสร็จ (หน้าเว็บพร้อม)
document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบว่าเคย login ค้างไว้หรือไม่
    const storedUserName = localStorage.getItem('loggedInUserName');
    const storedUserColorClass = localStorage.getItem('loggedInUserColorClass');

    if (storedUserName && storedUserColorClass) {
        // ถ้ามีข้อมูล login ให้ลอง login ใหม่อัตโนมัติ
        const userKey = Object.keys(userConfig).find(key => userConfig[key].name === storedUserName);
        if (userKey) {
            loggedInUser = userConfig[userKey];
            showCalendar(); // แสดงปฏิทิน
        } else {
            showLogin(); // ถ้าหา user ไม่เจอ ให้แสดงหน้า login
        }
    } else {
        showLogin(); // ถ้าไม่มีข้อมูล login ให้แสดงหน้า login
    }
});

// เมื่อกด Submit form login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ป้องกันการ reload หน้า
    const password = passwordInput.value;

    const foundUser = Object.values(userConfig).find(u => u.password === password);

    if (foundUser) {
        loggedInUser = foundUser;
        loginMessage.textContent = ''; // ล้างข้อความ error
        // เก็บข้อมูล login ใน localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loggedInUserName', loggedInUser.name);
        localStorage.setItem('loggedInUserColorClass', loggedInUser.colorClass);
        showCalendar(); // แสดงปฏิทิน
    } else {
        loginMessage.textContent = 'รหัสผ่านไม่ถูกต้อง'; // แสดงข้อความ error
    }
    passwordInput.value = ''; // ล้างช่องรหัสผ่าน
});

// ปุ่ม "เดือนก่อนหน้า"
prevMonthButton.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(); // Render ปฏิทินใหม่
});

// ปุ่ม "เดือนถัดไป"
nextMonthButton.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(); // Render ปฏิทินใหม่
});

// *** เมื่อกดปุ่ม "เพิ่มโน้ต" ใน Modal ***
addNewNoteButton.addEventListener('click', async () => {
    if (selectedDate && loggedInUser) {
        const noteContent = newNoteTextInput.value.trim(); // ดึงข้อความโน้ตจากช่อง input
        if (!noteContent) {
            alert('กรุณาป้อนข้อความโน้ต');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notes`, { // เรียก API POST เพื่อเพิ่มโน้ต
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate, text: noteContent, user_name: loggedInUser.name }), // ส่งข้อมูลโน้ตและชื่อผู้ใช้ไป Backend
            });
            if (response.ok) {
                const newNote = await response.json(); // Backend ควรส่งโน้ตที่สร้างใหม่กลับมาพร้อม ID
                if (!notes[selectedDate]) {
                    notes[selectedDate] = [];
                }
                notes[selectedDate].push(newNote); // เพิ่มโน้ตใหม่เข้า Array ใน local notes object
                console.log('Note added to backend successfully!', newNote);
                newNoteTextInput.value = ''; // ล้างช่อง input
                renderCalendar(); // Render ปฏิทินใหม่เพื่อแสดงผล
                renderNotesInModal(selectedDate); // อัปเดต Modal ให้แสดงผลล่าสุด
            } else {
                const errorData = await response.json();
                console.error('Failed to add note to backend:', response.status, errorData.message || response.statusText);
                alert(`ไม่สามารถเพิ่มโน้ตได้: ${errorData.message || 'เกิดข้อผิดพลาด'}`);
            }
        } catch (error) {
            console.error('Error adding note:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    } else if (!loggedInUser) {
        alert('กรุณาเข้าสู่ระบบก่อนบันทึกโน้ต');
    }
});

// Event listener สำหรับปุ่ม "ใช่" ใน Custom Confirmation Modal (ยืนยันการลบ)
confirmDeleteYesButton.addEventListener('click', async () => {
    confirmModal.style.display = 'none'; // ปิด Modal ยืนยัน
    if (noteToDeleteId) { // ถ้ามี ID โน้ตที่จะลบ
        try {
            const response = await fetch(`${API_BASE_URL}/notes/${noteToDeleteId}`, { // เรียก API DELETE เพื่อลบโน้ต
                method: 'DELETE',
            });
            if (response.ok) {
                // ลบโน้ตออกจาก local notes object
                for (const dateKey in notes) {
                    notes[dateKey] = notes[dateKey].filter(note => note.id !== noteToDeleteId);
                }
                console.log('Note deleted from backend successfully!');
                renderCalendar(); // Render ปฏิทินใหม่เพื่อแสดงผล
                renderNotesInModal(selectedDate); // อัปเดต Modal ให้แสดงผลล่าสุด
            } else {
                const errorData = await response.json();
                console.error('Failed to delete note from backend:', response.status, errorData.message || response.statusText);
                alert(`ไม่สามารถลบโน้ตได้: ${errorData.message || 'เกิดข้อผิดพลาด'}`);
            }
        } catch (error) {
            console.error('Error deleting note from backend:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    }
    noteToDeleteId = null; // ล้าง ID โน้ตที่จะลบ
});

// Event listener สำหรับปุ่ม "ไม่" ใน Custom Confirmation Modal (ยกเลิกการลบ)
confirmDeleteNoButton.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    noteToDeleteId = null;
});

// ปุ่มปิด Modal โน้ต
closeModalButton.addEventListener('click', () => {
    noteModal.style.display = 'none';
});

// ปุ่มปิด Modal ยืนยันการลบ
closeConfirmModalButton.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

// เมื่อคลิกนอก Modal ให้ปิด Modal นั้นๆ
window.addEventListener('click', (event) => {
    if (event.target == noteModal) {
        noteModal.style.display = 'none';
    }
    if (event.target == confirmModal) {
        confirmModal.style.display = 'none';
    }
});

// ปุ่ม "ออกจากระบบ"
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loggedInUserName');
    localStorage.removeItem('loggedInUserColorClass');
    showLogin(); // แสดงหน้า login
});