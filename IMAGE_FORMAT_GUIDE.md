# 📸 Hướng Dẫn Format Hình Ảnh Menu Items

## 🎯 Tỷ Lệ Hình Ảnh Được Sử Dụng

Trang menu sử dụng **aspect ratio 4:3** để hiển thị hình ảnh đồng nhất.

```css
aspectRatio: "4/3"
```

## 📐 Kích Thước Hình Ảnh Khuyến Nghị

### 1. **Kích thước tối ưu (Recommended)**
- **800 x 600 pixels** - Cân bằng giữa chất lượng và dung lượng
- **1200 x 900 pixels** - Chất lượng cao hơn cho màn hình Retina
- **1600 x 1200 pixels** - Chất lượng tối đa (cho photography chuyên nghiệp)

### 2. **Định dạng file**
- **WEBP**: Ưu tiên (dung lượng nhỏ, chất lượng tốt)
- **JPG/JPEG**: Phổ biến, dễ xử lý
- **PNG**: Nếu cần background trong suốt

### 3. **Dung lượng**
- Tối đa: **5MB** (đã được validate trong code)
- Khuyến nghị: **200KB - 500KB** (sau khi optimize)

## 🛠️ Cách Xử Lý Hình Quá Dài/Cao

### **Phương pháp 1: Crop về tỷ lệ 4:3**

#### Công cụ online miễn phí:
- **Canva** (https://canva.com)
  - Tạo design mới → Custom size → 800 x 600px
  - Upload ảnh → Fit vào khung → Download

- **Photopea** (https://photopea.com) - Free Photoshop online
  - File → New → 800 x 600px
  - Paste ảnh → Crop → Export as WEBP

- **iloveimg.com/crop-image**
  - Upload → Chọn Aspect Ratio 4:3 → Crop → Download

#### Photoshop/GIMP:
```
1. Mở ảnh
2. Crop Tool (C)
3. Chọn Ratio: 4:3
4. Adjust position để chọn phần đẹp nhất
5. Export as WEBP (Quality: 80-90%)
```

---

### **Phương pháp 2: Object-fit trong CSS** (Đã áp dụng)

Code hiện tại đã sử dụng `objectFit: "cover"`:

```tsx
<img 
  src={image}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover"  // Tự động crop để fit container
  }}
/>
```

**Lợi ích:**
- ✅ Hình tự động crop về 4:3
- ✅ Luôn fill đầy khung hình
- ✅ Không bị méo
- ❌ Có thể mất một phần nội dung ở cạnh (nếu hình quá dài)

---

### **Phương pháp 3: Object-fit: contain** (Backup option)

Nếu muốn hiển thị toàn bộ hình (không crop):

```tsx
<img 
  src={image}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "contain",  // Hiển thị full, có thể có viền đen
    background: "#000"     // Màu nền cho phần trống
  }}
/>
```

**Lợi ích:**
- ✅ Không mất nội dung
- ❌ Có viền đen/trống ở trên dưới hoặc 2 bên

---

### **Phương pháp 4: Resize trước khi upload**

#### Image Optimization Tools:

**Online:**
- **TinyPNG/TinyJPG** (https://tinypng.com) - Compress without quality loss
- **Squoosh** (https://squoosh.app) - Google's image optimizer
- **ImageOptim** (Mac only)

**Command line (ImageMagick):**
```bash
# Resize to 800x600 và crop center
magick input.jpg -resize 800x600^ -gravity center -extent 800x600 output.webp

# Convert to WEBP với quality 85%
magick input.jpg -quality 85 output.webp
```

**Bulk resize (Node.js - Sharp library):**
```javascript
const sharp = require('sharp');

sharp('input.jpg')
  .resize(800, 600, {
    fit: 'cover',
    position: 'center'
  })
  .webp({ quality: 85 })
  .toFile('output.webp');
```

---

## ✅ Checklist Trước Khi Upload

- [ ] Tỷ lệ 4:3 (hoặc sẽ tự crop bằng `objectFit: cover`)
- [ ] Kích thước: 800x600px hoặc 1200x900px
- [ ] Format: WEBP hoặc JPG
- [ ] Dung lượng: < 500KB (tối đa 5MB)
- [ ] Chất lượng: 80-90% (compression)
- [ ] Tên file: lowercase, không dấu, dùng dấu `-` (vd: `grilled-salmon.webp`)

---

## 🎨 Mẹo Chụp/Chọn Ảnh Món Ăn

1. **Góc chụp**: 45° hoặc top-down (từ trên xuống)
2. **Ánh sáng**: Tự nhiên, không quá tối
3. **Background**: Đơn giản, không lộn xộn
4. **Focus**: Món ăn là trung tâm (center composition)
5. **Màu sắc**: Tươi sáng, hấp dẫn
6. **Plating**: Bày biện đẹp mắt

---

## 📊 So Sánh Object-fit Values

| Value | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `cover` | Crop để fit, giữ tỷ lệ | **Đang dùng** - Tốt nhất cho menu |
| `contain` | Hiển thị full, có viền | Hình có nội dung quan trọng |
| `fill` | Stretch méo hình | ❌ Không nên dùng |
| `scale-down` | Như contain nhưng không phóng to | Hình nhỏ hơn container |

---

## 🔧 Code Implementation

### Current Code (Admin Menu):
```tsx
<div style={{ aspectRatio: '4/3' }}>
  <img 
    src={item.image}
    style={{
      width: "100%",
      height: "100%", 
      objectFit: "cover"
    }}
  />
</div>
```

### Customer Menu Food Detail:
```tsx
<div style={{ 
  width: "100%",
  aspectRatio: "4/3",
  overflow: "hidden"
}}>
  <img
    src={selectedFood.image}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }}
  />
</div>
```

---

## 📱 Responsive Considerations

Với `aspectRatio: "4/3"`:
- Mobile: Hình sẽ tự scale theo width của màn hình
- Tablet: Vẫn giữ tỷ lệ 4:3
- Desktop: Grid layout sẽ adjust size, nhưng vẫn 4:3

**Không cần media queries!** ✨

---

## 🚀 Quick Action

**Nếu có hình quá dài ngay bây giờ:**

1. Vào https://squoosh.app
2. Upload ảnh
3. Chọn Resize → Width: 800, Height: 600
4. Chọn WebP format
5. Quality: 85
6. Download
7. Upload vào app!

**Hoặc dùng Canva:**
1. Tạo design 800x600px
2. Upload ảnh vào
3. Position để chọn phần đẹp nhất
4. Download as WEBP
5. Done!
