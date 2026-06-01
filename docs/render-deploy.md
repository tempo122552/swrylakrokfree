# Deploy ขึ้นออนไลน์ด้วย Render

คู่มือนี้เป็นเส้นทางที่แนะนำสำหรับ version แรกของ `สว รย รักษ์โลกและสิ่งแวดล้อม` เพราะ Render รองรับ Node.js web service และ Persistent Disk สำหรับเก็บไฟล์ SQLite ถาวร

## สิ่งที่ต้องรู้ก่อนเริ่ม

- ต้องมี GitHub repository ของ project นี้
- ต้องเลือก Render Web Service แบบมีค่าใช้จ่าย เพราะ Persistent Disk ใช้กับ paid web service
- ระบบจะเก็บฐานข้อมูลที่ `/opt/render/project/src/storage/prod.db`
- เปิด service แค่ 1 instance เพราะ SQLite + persistent disk ไม่เหมาะกับการ scale หลายเครื่องพร้อมกัน

## ไฟล์ที่เตรียมไว้แล้ว

โปรเจกต์มี `render.yaml` ที่ตั้งค่าให้ Render สร้าง service ตามนี้

- Runtime: Node
- Region: Singapore
- Build: `npm ci && npm run db:generate && npm run build`
- Start: `npm run db:deploy && npm run db:bootstrap && npm run start:render`
- Health check: `/api/health`
- Persistent disk: `/opt/render/project/src/storage`
- Database: `file:/opt/render/project/src/storage/prod.db`

## ขั้นตอนบน Render

1. สมัครหรือเข้าสู่ระบบ Render
2. อัปโหลด project นี้ขึ้น GitHub
3. ใน Render เลือก New > Blueprint
4. เลือก repository ของ project
5. Render จะอ่าน `render.yaml` และสร้าง web service ให้
6. รอ build และ deploy จนขึ้นสถานะ Live
7. เปิด URL ที่ Render ให้ เช่น `https://swrylakrok.onrender.com/login`
8. ตรวจสถานะระบบที่ `/api/health`

## บัญชีแรกหลัง deploy

ระบบจะสร้างบัญชีเริ่มต้นถ้ายังไม่มี

- ครูผู้ดูแลระบบ: `teacher.admin`
- เจ้าหน้าที่ทดลอง: `staff.demo`
- รหัสผ่านเริ่มต้น: `Password123!`

หลัง login ครั้งแรกให้เปลี่ยนรหัสผ่านทันที

## หลังเปิดใช้งานจริง

1. เปลี่ยนรหัสผ่านบัญชีเริ่มต้น
2. สร้างบัญชีเจ้าหน้าที่จริง
3. Import รายชื่อนักเรียนทั้งโรงเรียน
4. ทดสอบบันทึกการแลกขยะ 1 รายการ
5. ตรวจ dashboard และ backup
6. เก็บ backup เป็นรอบ เช่น ทุกสัปดาห์
