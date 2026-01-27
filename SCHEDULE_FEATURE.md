# Schedule Management Feature

## 📋 Tổng quan

Tính năng quản lý lịch làm việc (Schedule Management) cho phép admin quản lý ca làm việc của nhân viên theo tuần. Giao diện hiển thị dạng lịch với:
- **Hàng ngang**: Chia theo ca làm việc (có thể tùy chỉnh)
- **Hàng dọc**: Chia theo ngày trong tuần (7 ngày)
- **Một trang**: Hiển thị lịch làm việc của 1 tuần

## 🎯 Tính năng đã implement

### 1. ✅ Types & Interfaces
- `Shift`: Định nghĩa ca làm việc (9am-5pm, Morning, Afternoon, etc.)
- `StaffSchedule`: Lịch làm việc của staff
- `WeekSchedule`: Lịch làm việc cả tuần
- `StaffSummary`: Thống kê giờ làm của staff

### 2. ✅ Components

#### WeekNavigator
- Điều hướng giữa các tuần (Prev/Next)
- Nút "Today" để về tuần hiện tại
- Hiển thị thông tin tuần (Week Jan 27 - Feb 2, 2026)
- Nút Copy Week để copy lịch sang tuần khác

#### ScheduleGrid
- Grid layout với staff theo cột dọc, ngày theo hàng ngang
- Click vào cell để thêm/sửa shift
- Hiển thị shift với màu sắc theo role
- Delete shift bằng nút X khi hover
- Responsive design

#### ShiftEditor (Modal)
- Form để thêm/sửa shift
- Select staff, date, shift time, role
- Notes field (optional)
- Validation

#### StaffAvailability (Sidebar)
- Thống kê tổng: Total Staff, Shifts, Hours
- Workload của từng staff
- Progress bar (% of 56h/week)
- Legend màu sắc theo role

### 3. ✅ API Services
Tất cả API calls đã được chuẩn bị trong `scheduleService.ts`:
- `getWeekSchedule()` - Lấy lịch theo tuần
- `upsertSchedule()` - Tạo/cập nhật schedule
- `deleteSchedule()` - Xóa schedule
- `getShifts()` - Lấy danh sách shifts
- `createShift()` / `updateShift()` / `deleteShift()` - Quản lý shifts
- `exportSchedule()` - Export ra Excel/PDF
- `copyWeekSchedule()` - Copy lịch sang tuần khác

### 4. ✅ Main Page
- URL: `/admin/schedules`
- Tích hợp đầy đủ các components
- Mock data để demo (giống image bạn cung cấp)
- Export button (chưa kết nối backend)

### 5. ✅ Navigation
- Đã thêm "Schedules" vào sidebar
- Icon calendar
- Translation EN/VI

## 📁 Cấu trúc file đã tạo

```
RestX-FE/
├── app/
│   └── admin/
│       └── schedules/
│           └── page.tsx                    ✅ Main page
├── components/
│   └── admin/
│       └── schedule/
│           ├── WeekNavigator.tsx           ✅ Week navigation
│           ├── ScheduleGrid.tsx            ✅ Main grid
│           ├── ShiftEditor.tsx             ✅ Add/Edit modal
│           └── StaffAvailability.tsx       ✅ Stats sidebar
└── lib/
    ├── types/
    │   └── schedule.ts                     ✅ Type definitions
    └── services/
        └── scheduleService.ts              ✅ API service
```

## 🎨 Color Coding (Roles)

- 🔴 Kitchen: `#ef4444`
- 🔵 Cashier: `#3b82f6`
- 🟣 Barista: `#8b5cf6`
- 🟢 Manager: `#10b981`
- 🟠 Waiter: `#f59e0b`

## 🚀 Cách chạy

### 1. Frontend đã sẵn sàng
```bash
cd d:/RestX-FE
npm run dev
```

Truy cập: http://localhost:3000/admin/schedules

### 2. Mock Data
Hiện tại đang sử dụng mock data trong file `page.tsx`. Dữ liệu mẫu đã được tạo dựa trên image bạn cung cấp.

## ⚙️ Backend API cần phát triển

Để tính năng hoạt động hoàn toàn, cần implement các endpoints sau:

```typescript
// Schedules
GET    /api/schedules/week?weekStart=2026-01-27
POST   /api/schedules
PUT    /api/schedules/:id
DELETE /api/schedules/:id

// Shifts
GET    /api/shifts
POST   /api/shifts
PUT    /api/shifts/:id
DELETE /api/shifts/:id

// Stats & Export
GET    /api/schedules/stats?weekStart=2026-01-27
GET    /api/schedules/export?weekStart=2026-01-27&format=excel
POST   /api/schedules/copy
```

### Request/Response Examples

#### GET /api/schedules/week
```json
{
  "weekStart": "2026-01-26T00:00:00Z",
  "weekEnd": "2026-02-01T23:59:59Z",
  "shifts": [
    {
      "id": "1",
      "name": "9am - 5pm",
      "startTime": "09:00",
      "endTime": "17:00",
      "color": "#4CAF50",
      "duration": 8
    }
  ],
  "schedules": [
    {
      "id": "1",
      "staffId": "1",
      "staffName": "Ahsoka Tano",
      "staffInitials": "AT",
      "date": "2026-01-27",
      "shiftId": "1",
      "shiftName": "9am - 5pm",
      "role": "Cashier",
      "status": "scheduled"
    }
  ]
}
```

#### POST /api/schedules
```json
{
  "staffId": "1",
  "date": "2026-01-27",
  "shiftId": "1",
  "role": "Cashier",
  "notes": "Optional notes"
}
```

## 🔧 Kết nối Backend

Khi backend đã sẵn sàng, uncomment các dòng trong `app/admin/schedules/page.tsx`:

```typescript
// Line ~50: Uncomment
const data = await scheduleService.getWeekSchedule(
  startOfWeek(currentWeek, { weekStartsOn: 1 }).toISOString()
);

// Line ~60: Comment lại mock data
// const mockData: WeekSchedule = { ... };

// Line ~75: Uncomment
await scheduleService.upsertSchedule(schedule);

// Line ~84: Uncomment
await scheduleService.deleteSchedule(id);
```

## 📱 Features có thể mở rộng

1. **Drag & Drop** - Kéo thả shift giữa các cells
2. **Conflict Detection** - Cảnh báo khi staff có 2 shifts trùng giờ
3. **Bulk Actions** - Thêm nhiều shifts cùng lúc
4. **Templates** - Lưu template lịch và apply nhanh
5. **Notifications** - Gửi thông báo cho staff khi có thay đổi
6. **Mobile App** - Staff xem lịch trên điện thoại
7. **Swap Shifts** - Staff đề xuất đổi ca
8. **Overtime Tracking** - Tính giờ làm thêm tự động
9. **Print View** - In lịch làm việc

## 🐛 Testing

Checklist để test:
- [ ] Navigate giữa các tuần
- [ ] Click "Today" button
- [ ] Click vào cell để mở modal
- [ ] Add shift mới
- [ ] Edit shift có sẵn
- [ ] Delete shift
- [ ] Xem stats sidebar
- [ ] Test responsive trên mobile
- [ ] Kiểm tra màu sắc role

## 📝 Notes

- Mock data hiện tại match với image bạn cung cấp
- Tất cả components đã responsive
- Theme system (dark/light mode) đã được tích hợp
- i18n (EN/VI) đã hoàn chỉnh
- Ready để kết nối backend API

## 👥 Contributors

Frontend implementation by GitHub Copilot
Based on requirements: Schedule management with customizable shifts
