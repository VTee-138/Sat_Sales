require('dotenv').config();
const tagController = require('./controllers/tagController');

// Mock dữ liệu test cho các loại tag mới
const testCases = [
  {
    name: 'Test tag "Đã chuyển đổi"',
    body: {
      entry: [{
        changes: [{
          value: {
            label: { page_label_name: 'Đã chuyển đổi' },
            user: { id: 'test_psid_001' }
          }
        }]
      }]
    }
  },
  {
    name: 'Test tag "Không phản hồi"',
    body: {
      entry: [{
        changes: [{
          value: {
            label: { page_label_name: 'Không phản hồi' },
            user: { id: 'test_psid_002' }
          }
        }]
      }]
    }
  },
  {
    name: 'Test tag không hợp lệ (không làm gì)',
    body: {
      entry: [{
        changes: [{
          value: {
            label: { page_label_name: 'Tag không hợp lệ' },
            user: { id: 'test_psid_003' }
          }
        }]
      }]
    }
  },
  {
    name: 'Test tag case insensitive "ĐÃ CHUYỂN ĐỔI"',
    body: {
      entry: [{
        changes: [{
          value: {
            label: { page_label_name: 'ĐÃ CHUYỂN ĐỔI' },
            user: { id: 'test_psid_004' }
          }
        }]
      }]
    }
  }
];

async function testTagLogic() {
  console.log('=== TEST LOGIC TAG MỚI ===\n');
  
  // Thêm test data vào database trước
  const pool = require('./config/db');
  
  try {
    console.log('Thêm dữ liệu test...');
    for (let i = 1; i <= 4; i++) {
      const psid = `test_psid_00${i}`;
      
      // Kiểm tra xem record đã tồn tại chưa
      const exists = await pool.query('SELECT 1 FROM sales_data WHERE psid = $1', [psid]);
      
      if (exists.rows.length === 0) {
        await pool.query(`
          INSERT INTO sales_data (psid, ho_va_ten, page, tinh_trang, ngay) 
          VALUES ($1, $2, 'Bee2T', 'Đang tư vấn', NOW())
        `, [psid, `Test User ${i}`]);
        console.log(`✓ Thêm test user ${i} với PSID: ${psid}`);
      } else {
        // Reset trạng thái về "Đang tư vấn"
        await pool.query(`
          UPDATE sales_data 
          SET tinh_trang = 'Đang tư vấn' 
          WHERE psid = $1
        `, [psid]);
        console.log(`✓ Reset trạng thái test user ${i} về "Đang tư vấn"`);
      }
    }
    
    console.log('\n--- Trạng thái ban đầu ---');
    const initialStatus = await pool.query(`
      SELECT psid, ho_va_ten, tinh_trang 
      FROM sales_data 
      WHERE psid LIKE 'test_psid_%' 
      ORDER BY psid
    `);
    
    initialStatus.rows.forEach(row => {
      console.log(`${row.psid}: ${row.ho_va_ten} - ${row.tinh_trang}`);
    });
    
    console.log('\n--- Thực hiện test các tag ---');
    
    // Test từng case
    for (const testCase of testCases) {
      console.log(`\n${testCase.name}:`);
      
      // Mock request và response objects
      const req = { body: testCase.body };
      const res = {
        sendStatus: (code) => {
          console.log(`  Response: ${code}`);
          return { statusCode: code };
        }
      };
      
      // Gọi controller
      await tagController.handle(req, res);
    }
    
    console.log('\n--- Trạng thái sau khi test ---');
    const finalStatus = await pool.query(`
      SELECT psid, ho_va_ten, tinh_trang 
      FROM sales_data 
      WHERE psid LIKE 'test_psid_%' 
      ORDER BY psid
    `);
    
    finalStatus.rows.forEach(row => {
      console.log(`${row.psid}: ${row.ho_va_ten} - ${row.tinh_trang}`);
    });
    
    console.log('\n=== KẾT QUẢ TEST ===');
    console.log('✅ Test hoàn thành!');
    console.log('Expected results:');
    console.log('- test_psid_001: Đang tư vấn -> Đã chuyển khoản');
    console.log('- test_psid_002: Đang tư vấn -> Không phản hồi');
    console.log('- test_psid_003: Đang tư vấn (không thay đổi)');
    console.log('- test_psid_004: Đang tư vấn -> Đã chuyển khoản');
    
  } catch (error) {
    console.error('Lỗi khi test:', error);
  } finally {
    await pool.end();
  }
}

testTagLogic();
