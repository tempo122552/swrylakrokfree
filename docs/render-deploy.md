# Deploy ฟรีด้วย Render + Supabase Postgres

คู่มือนี้เป็นเส้นทางฟรีที่แนะนำสำหรับ version แรกของ `สว รย รักษ์โลกและสิ่งแวดล้อม` โดยใช้ Render Free สำหรับรันเว็บ และ Supabase Free สำหรับฐานข้อมูล Postgres

## สิ่งที่เปลี่ยนจาก SQLite

- ไม่ใช้ไฟล์ `prisma/*.db` แล้ว
- ไม่ต้องใช้ Render Persistent Disk
- ใช้ Supabase Postgres แทน SQLite
- Prisma ใช้ `DATABASE_URL` สำหรับ runtime และ `DIRECT_URL` สำหรับ migration

## ไฟล์ที่เตรียมไว้แล้ว

โปรเจกต์มี `render.yaml` ที่ตั้งค่าให้ Render สร้าง service ตามนี้

- Runtime: Node
- Plan: Free
- Region: Singapore
- Build: `npm ci && npm run db:generate && npm run build`
- Start: `npm run db:deploy && npm run db:bootstrap && npm run start:render`
- Health check: `/api/health`

## Environment Variables ที่ต้องตั้งใน Render

ตั้งค่าใน Render > Environment

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
SESSION_SECRET="ค่าสุ่มยาวอย่างน้อย 32 ตัวอักษร"
```

หมายเหตุ: Supabase จะแสดง connection string ให้ใน Project Settings > Database > Connection string

## ขั้นตอนบน Supabase

1. สมัครหรือเข้าสู่ระบบ Supabase
2. สร้าง project ใหม่
3. ไปที่ Project Settings > Database
4. คัดลอก connection string แบบ pooled สำหรับ `DATABASE_URL`
5. คัดลอก direct connection string สำหรับ `DIRECT_URL`
6. นำค่าไปใส่ใน Render Environment

## ขั้นตอนบน Render

1. สมัครหรือเข้าสู่ระบบ Render
2. อัปโหลด project นี้ขึ้น GitHub
3. ใน Render เลือก New > Blueprint
4. เลือก repository ของ project
5. Render จะอ่าน `render.yaml` และสร้าง web service ให้
6. ใส่ `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`
7. รอ build และ deploy จนขึ้นสถานะ Live
8. เปิด URL ที่ Render ให้ เช่น `https://swrylakrok.onrender.com/login`
9. ตรวจสถานะระบบที่ `/api/health`

## บัญชีแรกหลัง deploy

ระบบจะสร้างบัญชีเริ่มต้นถ้ายังไม่มี

- ครูผู้ดูแลระบบ: `teacher.admin`
- เจ้าหน้าที่ทดลอง: `staff.demo`
- รหัสผ่านเริ่มต้น: `Password123!`

หลัง login ครั้งแรกให้เปลี่ยนรหัสผ่านทันที
