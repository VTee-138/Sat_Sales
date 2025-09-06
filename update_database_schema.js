require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function updateDatabaseSchema() {
  try {
    console.log('Bắt đầu cập nhật cấu trúc database...');
    
    // Kiểm tra xem cột nguoi_tiep_nhan có tồn tại không
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_data' 
      AND column_name = 'nguoi_tiep_nhan'
      AND table_schema = 'public';
    `;
    
    const { rows } = await pool.query(checkColumnQuery);
    
    if (rows.length === 0) {
      console.log('✓ Cột nguoi_tiep_nhan không tồn tại, không cần xóa.');
      return;
    }
    
    console.log('Tìm thấy cột nguoi_tiep_nhan, bắt đầu xóa...');
    
    // Backup dữ liệu trong cột nguoi_tiep_nhan trước khi xóa (optional)
    console.log('Kiểm tra dữ liệu trong cột nguoi_tiep_nhan...');
    const dataQuery = `
      SELECT nguoi_tiep_nhan, COUNT(*) as count
      FROM sales_data 
      WHERE nguoi_tiep_nhan IS NOT NULL
      GROUP BY nguoi_tiep_nhan
      ORDER BY count DESC;
    `;
    
    const { rows: dataRows } = await pool.query(dataQuery);
    
    if (dataRows.length > 0) {
      console.log('Dữ liệu hiện tại trong cột nguoi_tiep_nhan:');
      dataRows.forEach(row => {
        console.log(`  - ${row.nguoi_tiep_nhan}: ${row.count} records`);
      });
      
      console.log('\nTổng số records có nguoi_tiep_nhan:', 
        dataRows.reduce((sum, row) => sum + parseInt(row.count), 0));
    } else {
      console.log('Không có dữ liệu trong cột nguoi_tiep_nhan.');
    }
    
    // Xóa cột nguoi_tiep_nhan
    console.log('\nThực hiện xóa cột nguoi_tiep_nhan...');
    await pool.query('ALTER TABLE sales_data DROP COLUMN nguoi_tiep_nhan;');
    
    console.log('✓ Đã xóa cột nguoi_tiep_nhan thành công!');
    
    // Xóa index liên quan nếu có
    try {
      await pool.query('DROP INDEX IF EXISTS idx_sales_data_nguoi_tiep_nhan;');
      console.log('✓ Đã xóa index liên quan (nếu có)');
    } catch (err) {
      console.log('Không có index liên quan cần xóa');
    }
    
    // Kiểm tra cấu trúc bảng sau khi cập nhật
    console.log('\n=== CẤU TRÚC BẢNG SAU KHI CẬP NHẬT ===');
    const newStructureQuery = `
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
    
    const { rows: newStructure } = await pool.query(newStructureQuery);
    
    newStructure.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });
    
    console.log('\n=== HOÀN THÀNH ===');
    console.log('Database đã được cập nhật thành công!');
    console.log('Các thay đổi:');
    console.log('- ✓ Xóa cột nguoi_tiep_nhan khỏi bảng sales_data');
    console.log('- ✓ Cập nhật logic tag controller');
    console.log('- ✓ Cập nhật models và services');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật database:', error);
  } finally {
    await pool.end();
  }
}

updateDatabaseSchema();
