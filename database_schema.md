# Database Schema Documentation

## Thông tin Database
- **Database gốc**: postgres (CONNECTION_STRING trong .env)
- **Database mới**: sat
- **Connection String mới**: `postgres://n8n_user:n8n_pass@100.87.193.97:5432/sat`

## Cấu trúc Bảng

### 1. Bảng `ads_id`
Lưu trữ thông tin ID của các quảng cáo.

```sql
CREATE TABLE ads_id (
    id SERIAL PRIMARY KEY,
    psid VARCHAR(64) NOT NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_ads_id_psid ON ads_id(psid);
```

**Mô tả cột:**
- `id`: Khóa chính, tự tăng
- `psid`: Page-scoped ID từ Facebook (64 ký tự)
- `time`: Thời gian tạo record

### 2. Bảng `id_temp`
Bảng tạm để lưu trữ page_id.

```sql
CREATE TABLE id_temp (
    id SERIAL PRIMARY KEY,
    page_id VARCHAR(255)
);
```

**Mô tả cột:**
- `id`: Khóa chính, tự tăng
- `page_id`: ID của trang Facebook

### 3. Bảng `sales_data`
Bảng chính lưu trữ dữ liệu bán hàng và thông tin khách hàng.

```sql
CREATE TABLE sales_data (
    id SERIAL PRIMARY KEY,
    ngay TIMESTAMP,
    page VARCHAR(255),
    nguoi_tiep_nhan VARCHAR(255),
    ho_va_ten VARCHAR(255),
    link_facebook TEXT,
    tu_nhien_ads VARCHAR(32),
    tinh_trang VARCHAR(128),
    link_anh TEXT,
    noi_dung_ads TEXT,
    psid VARCHAR(64),
    link_box TEXT
);

-- Indexes
CREATE INDEX idx_sales_data_psid ON sales_data(psid);
CREATE INDEX idx_sales_data_ngay ON sales_data(ngay);
CREATE INDEX idx_sales_data_tinh_trang ON sales_data(tinh_trang);
```

**Mô tả cột:**
- `id`: Khóa chính, tự tăng
- `ngay`: Ngày tạo record
- `page`: Tên trang Facebook (mặc định: "Bee2T")
- `nguoi_tiep_nhan`: Người tiếp nhận khách hàng
- `ho_va_ten`: Họ và tên khách hàng
- `link_facebook`: Link Facebook của khách hàng
- `tu_nhien_ads`: Loại traffic ("Tự nhiên" hoặc "Ads")
- `tinh_trang`: Tình trạng khách hàng (mặc định: "Đang tư vấn")
- `link_anh`: Link ảnh quảng cáo
- `noi_dung_ads`: Nội dung quảng cáo
- `psid`: Page-scoped ID từ Facebook
- `link_box`: Link tin nhắn/conversation

## Cách sử dụng

### 1. Để chuyển sang database mới:
Cập nhật file `.env`:
```
DATABASE_URL=postgres://n8n_user:n8n_pass@100.87.193.97:5432/sat
```

### 2. Để test kết nối:
```javascript
const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgres://n8n_user:n8n_pass@100.87.193.97:5432/sat'
});

// Test query
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Connected successfully:', res.rows[0]);
  }
  pool.end();
});
```

### 3. Migration dữ liệu từ database cũ (nếu cần):
Tạo script migration để copy dữ liệu từ database `postgres` sang database `sat`.

## Files được tạo
- `explore_db.js`: Script khám phá cấu trúc database gốc
- `create_sat_db.js`: Script tạo database mới
- `verify_sat_db.js`: Script kiểm tra database đã tạo
- `database_schema.md`: File documentation này

## Lưu ý
- Database mới có cùng cấu trúc với database gốc
- Tất cả indexes đã được tạo để tối ưu performance
- Database trống, sẵn sàng để sử dụng
- Có thể migration dữ liệu từ database cũ nếu cần
