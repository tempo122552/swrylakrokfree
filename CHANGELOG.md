# Changelog

บันทึกการเปลี่ยนแปลงสำคัญของ `สว รย รักษ์โลกและสิ่งแวดล้อม` เพื่อช่วยตรวจสอบย้อนหลังเมื่อ deploy หรือเกิดปัญหา

รูปแบบอ้างอิง [Keep a Changelog](https://keepachangelog.com/th/1.1.0/)

## [Unreleased]

### Added

- จำกัดการนำเข้านักเรียนสูงสุด 1,500 แถวต่อไฟล์ (`data/import-students.ts`)
- `parseImportPayload` สำหรับ validate JSON ตอนยืนยันนำเข้า (`data/import-students.ts`)
- ชุดทดสอบ `data/students-import.test.ts` สำหรับ bulk import
- ปุ่มดาวน์โหลด Excel หลังนำเข้านักเรียนสำเร็จ (`app/teacher/students/import-form.tsx`, `lib/student-import-result-xlsx.ts`)
- ไฟล์ `CHANGELOG.md` นี้

### Changed

- **การนำเข้านักเรียนจำนวนมาก**: ปรับ `importStudents` ให้ hash รหัสผ่านเริ่มต้น (`Password123!`) ครั้งเดียวต่อรอบนำเข้า แทนการ hash ทีละแถว (`data/students.ts`)
- **การนำเข้านักเรียนจำนวนมาก**: ห่อการสร้าง `User` + `StudentProfile` ใน Prisma transaction เดียว (all-or-nothing) และเช็คเลขประจำตัวซ้ำอีกครั้งใน transaction (`data/students.ts`)
- **การนำเข้านักเรียนจำนวนมาก**: ตอนยืนยันนำเข้าส่งข้อมูลเป็น JSON ก้อนเดียว (`importPayload`) แทน hidden fields หลายพันฟิลด์ (`app/teacher/students/import-form.tsx`, `app/teacher/actions.ts`)
- ข้อความ error เมื่อพบเลขประจำตัวซ้ำในระบบ: แสดงจำนวนรวมและตัวอย่าง 5 รายการแรก (`data/students.ts`)
- ข้อความสำเร็จหลังนำเข้า: แจ้งจำนวนที่นำเข้าและรหัสผ่านเริ่มต้นร่วมของทุกคน (`app/teacher/actions.ts`)

### Unchanged (ตามข้อตกลง)

- UI หลังนำเข้า: ยังแสดงตารางบัญชีที่สร้างแล้วครบทุกแถว และเพิ่มปุ่มดาวน์โหลด Excel
- ไม่มี background job / queue
- รหัสผ่านเริ่มต้นยังเป็น `Password123!`
- Template นำเข้ายังเป็น Excel (`.xlsx`)

### Rollback hints

ถ้านำเข้าแล้วมีปัญหา:

1. ตรวจว่า transaction rollback ทำงานหรือไม่ (ไม่ควรมีนักเรียนค้างครึ่งไฟล์)
2. ตรวจ log บน Render ว่า request timeout หรือไม่ (ถ้า timeout ให้แบ่งไฟล์เป็นหลายรอบก่อนแก้โค้ด)
3. ถ้าต้อง rollback โค้ด: revert commit ที่เกี่ยวกับ bulk import และ redeploy
4. รันทดสอบก่อน deploy: `npm run verify`

## [1.2.0] - 2026-06-02

### Added

- รายงานครูรายเดือนและภาคเรียน (`AcademicTerm`)
- กติกาขยะรองรับ `pointsPerUnit` (เช่น มือถือเก่า 300 แต้ม)

## [1.1.0] - 2026-06-01

### Added

- ลบนักเรียนอย่างปลอดภัย (เฉพาะที่ยังไม่มีประวัติการใช้งาน)
- รหัสผ่านเริ่มต้นร่วมสำหรับนักเรียนที่นำเข้า

## [1.0.0] - 2026-05-31

### Added

- MVP ระบบแลกขยะสะสมแต้ม
- Deploy บน Render + Supabase Postgres
