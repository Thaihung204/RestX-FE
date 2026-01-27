# 🧪 Hướng dẫn Test Multi-tenant ở Localhost

## ✅ Cách 1: Sử dụng Hosts File (Khuyến nghị)

### Bước 1: Cấu hình `.env.local`
```bash
# Copy file mẫu
cp .env.local.example .env.local
```

Hoặc tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Bước 2: Edit File Hosts

**Windows:**
```powershell
# Run as Administrator
notepad C:\Windows\System32\drivers\etc\hosts
```

**Mac/Linux:**
```bash
sudo nano /etc/hosts
```

Thêm các dòng sau:
```
127.0.0.1   restx.local
127.0.0.1   www.restx.local
127.0.0.1   admin.restx.local
127.0.0.1   pizzahut.restx.local
127.0.0.1   kfc.restx.local
127.0.0.1   starbucks.restx.local
```

### Bước 3: Chạy Development Server
```bash
npm run dev
```

### Bước 4: Test các Domain

| URL | Mô tả | Route |
|-----|-------|-------|
| `http://restx.local:3000` | Landing page | `/` |
| `http://www.restx.local:3000` | Landing page | `/` |
| `http://admin.restx.local:3000` | Super Admin | `/tenants` |
| `http://pizzahut.restx.local:3000` | Tenant "pizzahut" | `/restaurant` |
| `http://kfc.restx.local:3000` | Tenant "kfc" | `/restaurant` |

---

## ⚡ Cách 2: Localhost (Development Mode)

Nếu không muốn edit hosts file:

```bash
# Chỉ cần chạy
npm run dev

# Truy cập
http://localhost:3000
```

**Lưu ý:** Ở mode này:
- ✅ Không có subdomain routing
- ✅ Tất cả routes đều accessible
- ❌ KHÔNG test được multi-tenant logic

---

## 🧩 Test với Console

Mở Browser Console để xem config:

```javascript
// Sẽ thấy log:
// 🌐 API Config Initialized: {
//   domain: "pizzahut.restx.local:3000",
//   baseUrl: "http://localhost:3000/api",
//   tenant: "pizzahut",
//   isAdmin: false,
//   isTenant: true
// }
```

---

## 🔍 Debug

### Kiểm tra tenant detection:
```typescript
// Trong component
const { tenant, isAdmin, isTenant, baseUrl } = useApiConfig();

console.log({
  tenant,     // "pizzahut" | "kfc" | null
  isAdmin,    // true nếu admin.restx.local
  isTenant,   // true nếu {tenant}.restx.local
  baseUrl     // API URL được sử dụng
});
```

### Test API calls:
```typescript
import axiosInstance from '@/lib/services/axiosInstance';

// Tự động dùng đúng baseURL theo domain
const response = await axiosInstance.get('/menu/items');
```

---

## 📝 Checklist

- [ ] File `.env.local` đã tạo với `NEXT_PUBLIC_API_URL`
- [ ] Hosts file đã thêm domain `*.restx.local`
- [ ] `npm run dev` đang chạy
- [ ] Test được access `http://admin.restx.local:3000`
- [ ] Console log hiển thị đúng tenant name
- [ ] API calls đi đến đúng base URL

---

## ⚠️ Troubleshooting

**Domain không resolve:**
```bash
# Test DNS
ping restx.local
# Phải trả về 127.0.0.1
```

**Permission denied khi edit hosts:**
```bash
# Windows: Chạy Notepad as Administrator
# Mac/Linux: Dùng sudo
```

**Browser cache:**
```bash
# Clear cache hoặc dùng Incognito mode
Ctrl + Shift + R  # Hard reload
```

**Port 3000 đã được sử dụng:**
```bash
# Đổi port
npm run dev -- -p 3001

# Truy cập: http://pizzahut.restx.local:3001
```

---

## 🚀 Production

Khi deploy production, chỉ cần:

```env
# .env.production
NEXT_PUBLIC_API_URL=https://api.restx.food
```

Middleware sẽ tự động routing cho:
- `restx.food` → Landing
- `admin.restx.food` → Admin
- `pizzahut.restx.food` → Tenant
