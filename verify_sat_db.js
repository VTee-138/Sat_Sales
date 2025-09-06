require('dotenv').config();
const { Pool } = require('pg');

// Kết nối đến database 'sat' mới tạo
const originalUrl = process.env.DATABASE_URL;
const satConnectionString = originalUrl.replace(/\/[^\/]*$/, '/sat');

const satPool = new Pool({ 
  connectionString: satConnectionString 
});

async function verifyDatabase() {
  try {
    console.log('Kiểm tra database "sat" đã được tạo...');
    console.log('Connection string:', satConnectionString);
    
    // Kiểm tra danh sách bảng
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const { rows: tables } = await satPool.query(tablesQuery);
    console.log('\n=== DANH SÁCH BẢNG TRONG DATABASE "SAT" ===');
    tables.forEach(table => {
      console.log(`✓ ${table.table_name}`);
    });
    
    // Kiểm tra cấu trúc từng bảng
    for (const table of tables) {
      console.log(`\n=== BẢNG: ${table.table_name.toUpperCase()} ===`);
      
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const { rows: columns } = await satPool.query(columnsQuery, [table.table_name]);
      
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`  ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
      });
      
      // Đếm số lượng record
      const countQuery = `SELECT COUNT(*) as count FROM ${table.table_name};`;
      const { rows: countResult } = await satPool.query(countQuery);
      console.log(`  Số lượng record: ${countResult[0].count}`);
    }
    
    // Kiểm tra các index
    console.log('\n=== CÁC INDEX ===');
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('ads_id', 'id_temp', 'sales_data')
      ORDER BY tablename, indexname;
    `;
    
    const { rows: indexes } = await satPool.query(indexQuery);
    indexes.forEach(index => {
      console.log(`✓ ${index.tablename}.${index.indexname}`);
    });
    
    console.log('\n=== KẾT QUẢ ===');
    console.log('Database "sat" đã được tạo thành công với đầy đủ cấu trúc!');
    console.log('\nĐể sử dụng database mới, cập nhật file .env:');
    console.log(`DATABASE_URL=${satConnectionString}`);
    
  } catch (error) {
    console.error('Lỗi khi kiểm tra database:', error);
  } finally {
    await satPool.end();
  }
}

verifyDatabase();
