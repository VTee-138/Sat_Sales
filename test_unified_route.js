require('dotenv').config();
const salesController = require('./controllers/salesController');

// Test cases cho tất cả các loại webhook
const testCases = [
  {
    name: '🏷️ TAG WEBHOOK - Đã chuyển đổi',
    body: {
      entry: [{
        changes: [{
          value: {
            label: { page_label_name: 'Đã chuyển đổi' },
            user: { id: 'test_tag_psid_001' }
          }
        }]
      }]
    }
  },
  {
    name: '🏷️ TAG WEBHOOK - Không phản hồi',
    body: {
      entry: [{
        changes: [{
          value: {
            label: { page_label_name: 'Không phản hồi' },
            user: { id: 'test_tag_psid_002' }
          }
        }]
      }]
    }
  },
  {
    name: '📊 ADS COUNT WEBHOOK - Referral',
    body: {
      entry: [{
        messaging: [{
          sender: { id: 'test_ads_psid_001' },
          referral: {
            ads_context_data: {
              ad_title: 'Test Ad Title',
              photo_url: 'https://example.com/ad_image.jpg'
            }
          }
        }]
      }]
    }
  },
  {
    name: '💬 MESSENGER WEBHOOK - Regular message',
    body: {
      entry: [{
        messaging: [{
          sender: { id: 'test_msg_psid_001' },
          message: {
            mid: 'test_message_id_123',
            text: 'Hello'
          }
        }]
      }]
    }
  },
  {
    name: '❓ UNKNOWN WEBHOOK - Should be ignored',
    body: {
      entry: [{
        unknown_field: {
          some_data: 'test'
        }
      }]
    }
  },
  {
    name: '❌ INVALID WEBHOOK - No entry',
    body: {
      invalid: 'data'
    }
  }
];

async function testUnifiedSalesRoute() {
  console.log('=== TEST UNIFIED SALES ROUTE ===\n');
  
  const pool = require('./config/db');
  
  try {
    // Thêm test data
    console.log('Chuẩn bị dữ liệu test...');
    
    const testPsids = [
      'test_tag_psid_001',
      'test_tag_psid_002', 
      'test_ads_psid_001',
      'test_msg_psid_001'
    ];
    
    for (const psid of testPsids) {
      // Kiểm tra và tạo test user nếu chưa có
      const exists = await pool.query('SELECT 1 FROM sales_data WHERE psid = $1', [psid]);
      
      if (exists.rows.length === 0) {
        await pool.query(`
          INSERT INTO sales_data (psid, ho_va_ten, page, tinh_trang, ngay) 
          VALUES ($1, $2, 'Bee2T', 'Đang tư vấn', NOW())
        `, [psid, `Test User ${psid}`]);
        console.log(`✓ Created test user: ${psid}`);
      } else {
        // Reset trạng thái
        await pool.query(`
          UPDATE sales_data 
          SET tinh_trang = 'Đang tư vấn', tu_nhien_ads = 'Tự nhiên'
          WHERE psid = $1
        `, [psid]);
        console.log(`✓ Reset test user: ${psid}`);
      }
    }
    
    console.log('\n--- TESTING UNIFIED SALES ROUTE ---');
    
    // Test từng case
    for (const testCase of testCases) {
      console.log(`\n${testCase.name}:`);
      
      // Mock request và response objects
      const req = { body: testCase.body };
      const res = {
        sendStatus: (code) => {
          console.log(`  ✅ Response: ${code}`);
          return { statusCode: code };
        }
      };
      
      // Gọi unified controller
      await salesController.handle(req, res);
    }
    
    console.log('\n--- KIỂM TRA KẾT QUẢ ---');
    
    // Kiểm tra kết quả trong database
    const results = await pool.query(`
      SELECT psid, ho_va_ten, tinh_trang, tu_nhien_ads, link_anh, noi_dung_ads
      FROM sales_data 
      WHERE psid LIKE 'test_%psid_%' 
      ORDER BY psid
    `);
    
    console.log('Trạng thái sau test:');
    results.rows.forEach(row => {
      console.log(`  ${row.psid}: ${row.tinh_trang} | ${row.tu_nhien_ads || 'N/A'} | ${row.noi_dung_ads || 'No ads'}`);
    });
    
    console.log('\n=== KẾT QUẢ MONG ĐỢI ===');
    console.log('✅ test_tag_psid_001: Đã chuyển khoản');
    console.log('✅ test_tag_psid_002: Không phản hồi');
    console.log('✅ test_ads_psid_001: Có ads data (noi_dung_ads, link_anh)');
    console.log('✅ test_msg_psid_001: User được tạo/cập nhật');
    
    console.log('\n🎉 TEST UNIFIED SALES ROUTE HOÀN THÀNH!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await pool.end();
  }
}

testUnifiedSalesRoute();
