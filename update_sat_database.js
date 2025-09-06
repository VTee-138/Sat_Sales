require('dotenv').config();
const { Pool } = require('pg');

// Kết nối đến database 'sat'
const originalUrl = process.env.DATABASE_URL;
const satConnectionString = originalUrl.replace(/\/[^\/]*$/, '/sat');

const satPool = new Pool({ 
  connectionString: satConnectionString 
});

async function updateSatDatabase() {
  try {
    console.log('Cập nhật cấu trúc database "sat" để đồng bộ...');
    
    // Kiểm tra và xóa cột nguoi_tiep_nhan trong database sat
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_data' 
      AND column_name = 'nguoi_tiep_nhan'
      AND table_schema = 'public';
    `;
    
    const { rows } = await satPool.query(checkColumnQuery);
    
    if (rows.length > 0) {
      console.log('Xóa cột nguoi_tiep_nhan khỏi database sat...');
      await satPool.query('ALTER TABLE sales_data DROP COLUMN nguoi_tiep_nhan;');
      console.log('✓ Đã xóa cột nguoi_tiep_nhan khỏi database sat');
    } else {
      console.log('✓ Cột nguoi_tiep_nhan không tồn tại trong database sat');
    }
    
    // Kiểm tra cấu trúc cuối cùng
    console.log('\n=== CẤU TRÚC BẢNG SALES_DATA TRONG DATABASE SAT ===');
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'sales_data' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const { rows: structure } = await satPool.query(structureQuery);
    
    structure.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });
    
    console.log('\n✓ Database "sat" đã được đồng bộ thành công!');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật database sat:', error);
  } finally {
    await satPool.end();
  }
}

updateSatDatabase();
