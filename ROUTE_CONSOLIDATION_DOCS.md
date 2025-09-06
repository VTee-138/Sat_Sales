# Route Consolidation Documentation

## Tổng Quan

Đã gộp thành công 3 routes riêng biệt thành 1 route duy nhất `/sales` với đầy đủ chức năng.

## So Sánh Trước và Sau

### ❌ **TRƯỚC (3 routes riêng biệt):**
```
/messages    → messengerController.handle()
/ads_count   → adsCountController.handle() 
/tag         → tagController.handle()
```

### ✅ **SAU (1 route tổng hợp):**
```
/sales       → salesController.handle() (intelligent routing)
```

## Cách Hoạt Động

### Route `/sales`
- **GET `/sales`**: Webhook verification (Facebook)
- **POST `/sales`**: Xử lý tất cả loại webhook

### Logic Phân Biệt Webhook

`salesController.js` sử dụng **intelligent routing** dựa vào cấu trúc dữ liệu:

```javascript
// 1. TAG WEBHOOK - có changes với label
if (entry.changes?.[0]?.value?.label) {
  return handleTagWebhook(); // Xử lý tag trạng thái
}

// 2. ADS WEBHOOK - có messaging với referral
if (entry.messaging?.[0]?.referral?.ads_context_data) {
  return handleAdsCountWebhook(); // Xử lý ads tracking
}

// 3. MESSENGER WEBHOOK - có messaging thông thường
if (entry.messaging?.[0]) {
  return handleMessengerWebhook(); // Xử lý tin nhắn
}
```

## Chi Tiết Chức Năng

### 🏷️ **Tag Webhook** (Cũ: `/tag`)
**Cấu trúc data:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "label": { "page_label_name": "Đã chuyển đổi" },
        "user": { "id": "user_psid" }
      }
    }]
  }]
}
```

**Xử lý:**
- `"Đã chuyển đổi"` → `"Đã chuyển khoản"`
- `"Không phản hồi"` → `"Không phản hồi"`

### 📊 **Ads Count Webhook** (Cũ: `/ads_count`)
**Cấu trúc data:**
```json
{
  "entry": [{
    "messaging": [{
      "sender": { "id": "user_psid" },
      "referral": {
        "ads_context_data": {
          "ad_title": "Ad Title",
          "photo_url": "image_url"
        }
      }
    }]
  }]
}
```

**Xử lý:**
- Lưu PSID vào `ads_id` table
- Cập nhật `sales_data` với thông tin ads (nếu user đã tồn tại)

### 💬 **Messenger Webhook** (Cũ: `/messages`)
**Cấu trúc data:**
```json
{
  "entry": [{
    "messaging": [{
      "sender": { "id": "user_psid" },
      "message": {
        "mid": "message_id",
        "text": "Hello"
      }
    }]
  }]
}
```

**Xử lý:**
- Tạo user mới nếu chưa tồn tại
- Lấy tên từ Facebook API
- Set trạng thái mặc định: "Đang tư vấn"

## Files Được Tạo/Cập Nhật

### ➕ **Files Mới:**
- `controllers/salesController.js` - Controller tổng hợp
- `routes/salesRoutes.js` - Route tổng hợp
- `test_unified_route.js` - Test script

### 📝 **Files Cập Nhật:**
- `app.js` - Thay 3 routes cũ bằng `/sales`

### ❌ **Files Cũ (có thể xóa):**
- `routes/messengerRoutes.js`
- `routes/adsCountRoutes.js` 
- `routes/tagRoutes.js`
- `controllers/messengerController.js`
- `controllers/adsCountController.js`
- `controllers/tagController.js`

## Lợi Ích

### 🎯 **Từ Góc Độ Hệ Thống:**
- **Đơn giản hóa**: 1 endpoint thay vì 3
- **Dễ maintain**: Code tập trung trong 1 controller
- **Logging tốt hơn**: Tất cả webhook đều có log chi tiết
- **Error handling tốt hơn**: Xử lý lỗi tập trung

### 🔧 **Từ Góc Độ Facebook Setup:**
- **1 webhook URL**: `/sales` thay vì 3 URLs khác nhau
- **Dễ config**: Chỉ cần setup 1 webhook endpoint
- **Flexible**: Có thể handle nhiều loại webhook mới trong tương lai

### 📊 **Từ Góc Độ Performance:**
- **Ít connections**: Server chỉ cần handle 1 route
- **Better routing**: Logic phân biệt webhook hiệu quả
- **Reduced complexity**: Ít middleware, ít route handlers

## Facebook Webhook Configuration

### Cấu hình mới:
```
Webhook URL: https://yourdomain.com/sales
Verify Token: 1 (từ .env)

Subscribed Events:
- messages (cho messenger webhook)
- page_label_changes (cho tag webhook)  
- messaging_referrals (cho ads webhook)
```

## Testing & Verification

### ✅ **Đã Test Thành Công:**
- Tag webhook: "Đã chuyển đổi" và "Không phản hồi"
- Ads webhook: Referral data processing
- Messenger webhook: User creation và name fetching
- Unknown webhook: Proper handling và ignore
- Invalid webhook: Error handling

### 🧪 **Test Script:**
```bash
node test_unified_route.js
```

## Migration Guide

### Cập nhật Facebook Webhook Settings:
1. Đăng nhập Facebook Developer Console
2. Chọn App > Webhooks
3. Cập nhật endpoint URLs:
   - Từ: `/messages`, `/ads_count`, `/tag`
   - Thành: `/sales` (cho tất cả)

### Rollback Plan (nếu cần):
1. Restore `app.js` về version cũ
2. Sử dụng lại 3 routes riêng biệt
3. Update Facebook webhook config về 3 URLs cũ

## Kết Luận

✅ **Hoàn thành thành công:**
- Gộp 3 routes thành 1 route `/sales`
- Giữ nguyên 100% chức năng
- Cải thiện architecture và maintainability
- Test coverage đầy đủ
- Documentation chi tiết

🎯 **Lợi ích đạt được:**
- Đơn giản hóa hệ thống
- Dễ setup Facebook webhook
- Code dễ maintain hơn
- Performance tốt hơn
- Scalable cho tương lai

🚀 **Sẵn sàng production!**
