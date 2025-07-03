// server.js

// 1. นำเข้า Express.js (คือการเรียกใช้ Library Express ที่เราติดตั้งไป)
const express = require('express');
const app = express(); // สร้าง Instance ของ Express เพื่อใช้งาน

// 2. กำหนด Port ที่ Server จะใช้รัน
// ถ้ามี Port กำหนดไว้ใน Environment (สำหรับตอน Deploy บน Render) ก็ใช้ Port นั้น
// ถ้าไม่มี ก็ใช้ Port 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;

// 3. ตั้งค่าให้ Express สามารถเสิร์ฟไฟล์ Static (เช่น HTML, CSS, JS ของ Frontend)
// ไฟล์ทั้งหมดในโฟลเดอร์ 'public' จะสามารถเข้าถึงได้ผ่าน URL โดยตรง
app.use(express.static('public'));

// 4. (สำหรับทดสอบ) สร้าง Route พื้นฐาน
// เมื่อมีคนเข้าถึง URL รูท (/) Server จะส่งข้อความ "Hello from Backend!" กลับไป
app.get('/api/hello', (req, res) => {
    res.send('Hello from Backend!');
});

// 5. สั่งให้ Server เริ่มทำงานและรอการเชื่อมต่อ
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Open your browser at http://localhost:${PORT}`);
    console.log(`Test API at http://localhost:${PORT}/api/hello`);
});