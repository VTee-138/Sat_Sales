# Cập Nhật Hệ Thống Tag - Documentation

## Tổng Quan Thay Đổi

Hệ thống tag đã được cập nhật để loại bỏ việc đánh tag tên người và chỉ giữ lại các tag trạng thái. 

## Chi Tiết Thay Đổi

### 1. 🗑️ **Xóa Cột `nguoi_tiep_nhan`**
- Đã xóa cột `nguoi_tiep_nhan` khỏi bảng `sales_data` trong cả 2 database (chính và `sat`)
- Lý do: Không còn sử dụng tag tên người nữa

### 2. 🏷️ **Logic Tag Mới**
Chỉ còn 2 loại tag hoạt động:

| Tag Input | Trạng thái cập nhật | Mô tả |
|-----------|-------------------|-------|
| "Đã chuyển đổi" | "Đã chuyển khoản" | Khách hàng đã thực hiện chuyển khoản |
| "Không phản hồi" | "Không phản hồi" | Khách hàng không phản hồi tin nhắn |

**Lưu ý:** 
- Tag không phân biệt hoa thường (case-insensitive)
- Các tag khác sẽ được bỏ qua (không làm gì)

### 3. 📝 **Files Đã Cập Nhật**

#### `controllers/tagController.js`
```javascript
// Logic mới - chỉ xử lý tag trạng thái
const statusTags = {
  "đã chuyển đổi": "Đã chuyển khoản",
  "không phản hồi": "Không phản hồi"
};
```

#### `models/customerAdsModel.js`
- Xóa function `updateTag()` (không còn cần thiết)
- Giữ lại function `updateStatus()` cho việc cập nhật trạng thái

#### `services/scheduler.js`
- Loại bỏ filter `nguoi_tiep_nhan IS NOT NULL`
- Cập nhật query để không reference đến cột đã xóa

### 4. 📊 **Cấu Trúc Database Mới**

#### Bảng `sales_data` (sau khi cập nhật)
```sql
CREATE TABLE sales_data (
    id SERIAL PRIMARY KEY,
    ngay TIMESTAMP,
    page VARCHAR(255),
    ho_va_ten VARCHAR(255),
    link_facebook TEXT,
    tu_nhien_ads VARCHAR(32),
    tinh_trang VARCHAR(128),
    link_anh TEXT,
    noi_dung_ads TEXT,
    psid VARCHAR(64),
    link_box TEXT
);
```

**Thay đổi:**
- ❌ Đã xóa: `nguoi_tiep_nhan VARCHAR(255)`

### 5. 🧪 **Testing**

Đã tạo script test `test_tag_logic.js` để verify logic mới:
- ✅ Tag "Đã chuyển đổi" → "Đã chuyển khoản"
- ✅ Tag "Không phản hồi" → "Không phản hồi"  
- ✅ Tag case-insensitive hoạt động đúng
- ✅ Tag không hợp lệ được bỏ qua

### 6. 📁 **Scripts Hỗ Trợ**

| File | Mục đích |
|------|----------|
| `update_database_schema.js` | Xóa cột `nguoi_tiep_nhan` khỏi database chính |
| `update_sat_database.js` | Đồng bộ database `sat` |
| `test_tag_logic.js` | Test logic tag mới |

## Hướng Dẫn Sử Dụng

### Webhook Tag API
Endpoint: `POST /tag`

**Request Body Example:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "label": { "page_label_name": "Đã chuyển đổi" },
        "user": { "id": "user_psid_123" }
      }
    }]
  }]
}
```

**Response:**
- `200`: Thành công
- `400`: Thiếu PSID
- `500`: Lỗi server

### Các Trạng Thái Trong Hệ Thống

1. **"Đang tư vấn"** - Trạng thái mặc định khi tạo mới
2. **"Đã chuyển khoản"** - Từ tag "Đã chuyển đổi"  
3. **"Không phản hồi"** - Từ tag "Không phản hồi"

## Migration Notes

### Dữ Liệu Bị Mất
- Thông tin trong cột `nguoi_tiep_nhan` (10,888 records):
  - Nga: 2,682 records
  - Thanh: 2,242 records  
  - Hoài: 2,056 records
  - Đào Nhung: 1,803 records
  - Kiều: 1,654 records
  - Nhung: 446 records
  - nga: 5 records

### Backup Strategy (nếu cần)
Nếu cần khôi phục dữ liệu, có thể:
1. Tạo lại cột `nguoi_tiep_nhan`
2. Restore từ backup database
3. Hoặc sử dụng log để trace lại

## Rollback Plan

Nếu cần rollback:

1. **Tạo lại cột:**
```sql
ALTER TABLE sales_data ADD COLUMN nguoi_tiep_nhan VARCHAR(255);
```

2. **Khôi phục logic cũ trong controller:**
```javascript
const consultants = ["hoài","nga","kiều","thanh","đào nhung"];
// ...logic cũ
```

3. **Khôi phục function updateTag() trong model**

## Kết Luận

✅ **Hoàn thành thành công:**
- Logic tag đã được đơn giản hóa
- Database đã được tối ưu (loại bỏ cột không cần thiết)
- System vẫn hoạt động ổn định
- Test coverage đảm bảo chất lượng

🎯 **Lợi ích:**
- Code đơn giản hơn, dễ maintain
- Database gọn gàng hơn
- Logic rõ ràng và dễ hiểu
- Performance tốt hơn (ít cột hơn)
