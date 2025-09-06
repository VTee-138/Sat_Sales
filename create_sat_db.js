require('dotenv').config();
const { Pool } = require('pg');

// Cấu hình để kết nối đến server PostgreSQL (không chỉ định database cụ thể)
const connectionString = process.env.DATABASE_URL;
const baseConnection = connectionString.replace(/\/[^\/]*$/, '/postgres'); // Kết nối đến database mặc định

const adminPool = new Pool({ 
  connectionString: baseConnection 
});

async function createSatDatabase() {
  try {
    console.log('Kết nối đến PostgreSQL server...');
    
    // Kiểm tra xem database 'sat' đã tồn tại chưa
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = 'sat';
    `;
    
    const { rows } = await adminPool.query(checkDbQuery);
    
    if (rows.length > 0) {
      console.log('Database "sat" đã tồn tại!');
      console.log('Bạn có muốn xóa và tạo lại không? (Tất cả dữ liệu sẽ bị mất)');
      console.log('Để tiếp tục, hãy comment dòng return ở dưới và chạy lại script.');
      return;
    }
    
    // Tạo database mới
    console.log('Tạo database "sat"...');
    await adminPool.query('CREATE DATABASE sat;');
    console.log('✓ Database "sat" đã được tạo thành công!');
    
    // Đóng kết nối admin
    await adminPool.end();
    
    // Kết nối đến database mới tạo
    const satConnectionString = connectionString.replace(/\/[^\/]*$/, '/sat');
    const satPool = new Pool({ 
      connectionString: satConnectionString 
    });
    
    console.log('Kết nối đến database "sat" và tạo bảng...');
    
    // Tạo bảng ads_id
    const createAdsIdTable = `
      CREATE TABLE ads_id (
        id SERIAL PRIMARY KEY,
        psid VARCHAR(64) NOT NULL,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await satPool.query(createAdsIdTable);
    console.log('✓ Bảng "ads_id" đã được tạo');
    
    // Tạo bảng id_temp
    const createIdTempTable = `
      CREATE TABLE id_temp (
        id SERIAL PRIMARY KEY,
        page_id VARCHAR(255)
      );
    `;
    
    await satPool.query(createIdTempTable);
    console.log('✓ Bảng "id_temp" đã được tạo');
    
    // Tạo bảng sales_data
    const createSalesDataTable = `
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
    `;
    
    await satPool.query(createSalesDataTable);
    console.log('✓ Bảng "sales_data" đã được tạo');
    
    // Tạo index cho các cột thường được tìm kiếm
    console.log('Tạo các index...');
    
    await satPool.query('CREATE INDEX idx_ads_id_psid ON ads_id(psid);');
    await satPool.query('CREATE INDEX idx_sales_data_psid ON sales_data(psid);');
    await satPool.query('CREATE INDEX idx_sales_data_ngay ON sales_data(ngay);');
    await satPool.query('CREATE INDEX idx_sales_data_tinh_trang ON sales_data(tinh_trang);');
    
    console.log('✓ Các index đã được tạo');
    
    // Thêm một số dữ liệu mẫu
    console.log('Thêm dữ liệu mẫu...');
    
    await satPool.query(`
      INSERT INTO id_temp (page_id) VALUES ('0');
    `);
    
    console.log('✓ Dữ liệu mẫu đã được thêm');
    
    // Hiển thị thông tin kết nối cho database mới
    console.log('\n=== THÔNG TIN KHAI BÁO MỚI ===');
    console.log('Để sử dụng database "sat", hãy cập nhật file .env với:');
    console.log('DATABASE_URL=' + satConnectionString);
    
    console.log('\n=== HOÀN THÀNH ===');
    console.log('Database "sat" đã được tạo thành công với cấu trúc tương tự database gốc!');
    
    await satPool.end();
    
  } catch (error) {
    console.error('Lỗi khi tạo database:', error);
  }
}

createSatDatabase();
