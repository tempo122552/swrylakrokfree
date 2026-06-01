# สว รย รักษ์โลกและสิ่งแวดล้อม

เว็บสะสมแต้มจากกิจกรรมแลกขยะของโรงเรียน รองรับ 3 บทบาทหลัก: สมาชิก, เจ้าหน้าที่ และครูผู้ดูแลระบบ

## Quick Start

```bash
npm ci
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

เปิดใช้งานที่ [http://localhost:3000](http://localhost:3000)

## บัญชีเริ่มต้น

- ครูผู้ดูแลระบบ: `teacher.admin`
- เจ้าหน้าที่ทดลอง: `staff.demo`
- รหัสผ่านเริ่มต้น: `Password123!`

นักเรียนใช้ `เลขประจำตัวนักเรียน` เป็นชื่อผู้ใช้

## Scripts สำคัญ

- `npm run dev`: เปิด development server
- `npm run verify`: ตรวจ lint, test และ production build
- `npm run db:push`: sync schema กับ SQLite สำหรับ local development
- `npm run db:deploy`: เตรียม schema บนฐานข้อมูลเป้าหมายสำหรับ MVP
- `npm run db:seed`: สร้างข้อมูลเริ่มต้น
- `npm run start`: เปิด server หลัง build

## Deploy

โปรเจกต์นี้เตรียมสำหรับ deploy ฟรีด้วย Render Free + Supabase Postgres Free แล้ว

อ่านขั้นตอนที่ [docs/render-deploy.md](docs/render-deploy.md)

หลัง deploy ตรวจสถานะระบบได้ที่ `/api/health`
