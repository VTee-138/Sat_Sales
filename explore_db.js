require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function exploreDatabase() {
  try {
    console.log('Kết nối đến database...');
    
    // Lấy danh sách tất cả các bảng
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const { rows: tables } = await pool.query(tablesQuery);
    console.log('\n=== DANH SÁCH CÁC BẢNG ===');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Lấy cấu trúc từng bảng
    for (const table of tables) {
      console.log(`\n=== CẤU TRÚC BẢNG: ${table.table_name.toUpperCase()} ===`);
      
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
      
      const { rows: columns } = await pool.query(columnsQuery, [table.table_name]);
      
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`  ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
      });
      
      // Lấy thông tin về constraints (khóa chính, khóa ngoại, unique)
      const constraintsQuery = `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = $1 
        AND tc.table_schema = 'public';
      `;
      
      const { rows: constraints } = await pool.query(constraintsQuery, [table.table_name]);
      
      if (constraints.length > 0) {
        console.log('  Constraints:');
        constraints.forEach(constraint => {
          let constraintInfo = `    ${constraint.constraint_type}: ${constraint.column_name}`;
          if (constraint.constraint_type === 'FOREIGN KEY') {
            constraintInfo += ` -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`;
          }
          console.log(constraintInfo);
        });
      }
      
      // Lấy vài dòng dữ liệu mẫu
      try {
        const sampleQuery = `SELECT * FROM ${table.table_name} LIMIT 3;`;
        const { rows: sampleData } = await pool.query(sampleQuery);
        
        if (sampleData.length > 0) {
          console.log('  Dữ liệu mẫu:');
          sampleData.forEach((row, index) => {
            console.log(`    Row ${index + 1}:`, JSON.stringify(row, null, 2));
          });
        }
      } catch (err) {
        console.log('  Không thể lấy dữ liệu mẫu:', err.message);
      }
    }
    
  } catch (error) {
    console.error('Lỗi khi khám phá database:', error);
  } finally {
    await pool.end();
  }
}

exploreDatabase();
