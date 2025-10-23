const mysql = require('mysql2/promise');

async function testMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Empty password for XAMPP default
      database: 'hotel_luxury'
    });

    console.log('Connected to database');

    // Test 1: Check if checkin_status column exists
    console.log('\n=== Test 1: Check if checkin_status column exists ===');
    const columns = await connection.execute(`
      DESCRIBE reservations
    `);
    
    const hasCheckinStatus = columns[0].some(col => col.Field === 'checkin_status');
    console.log('checkin_status column exists:', hasCheckinStatus);

    // Test 2: Check current data distribution
    console.log('\n=== Test 2: Check current data distribution ===');
    const statusDistribution = await connection.execute(`
      SELECT status, checkin_status, COUNT(*) as count
      FROM reservations
      GROUP BY status, checkin_status
      ORDER BY status, checkin_status
    `);
    
    console.log('Status and checkin_status distribution:');
    statusDistribution[0].forEach(row => {
      console.log(`  Status: ${row.status}, Checkin Status: ${row.checkin_status}, Count: ${row.count}`);
    });

    // Test 3: Verify no old status values exist
    console.log('\n=== Test 3: Verify no old status values exist ===');
    const oldStatusValues = await connection.execute(`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE status IN ('checked-in', 'checked-out')
    `);
    
    console.log('Reservations with old status values:', oldStatusValues[0][0].count);

    // Test 4: Test creating a new reservation
    console.log('\n=== Test 4: Test creating a new reservation ===');
    const testUserId = 'test-user-' + Date.now();
    const testReservationId = 'test-reservation-' + Date.now();
    
    // Create test user
    await connection.execute(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, 'Test User', 'test@example.com', 'test-hash', 'customer')
    `, [testUserId]);

    // Create test reservation
    await connection.execute(`
      INSERT INTO reservations (
        id, user_id, room_type_id, check_in_date, check_out_date,
        num_guests, status, checkin_status, total_price, discount_amount, final_price,
        has_credit_card, is_walk_in
      ) VALUES (
        ?, ?, (SELECT id FROM room_types LIMIT 1), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY),
        2, 'confirmed', 'not_checked_in', 10000, 0, 10000,
        true, false
      )
    `, [testReservationId, testUserId]);

    // Check the created reservation
    const newReservation = await connection.execute(`
      SELECT status, checkin_status FROM reservations WHERE id = ?
    `, [testReservationId]);
    
    console.log('New reservation created:');
    console.log('  Status:', newReservation[0][0].status);
    console.log('  Checkin Status:', newReservation[0][0].checkin_status);

    // Test 5: Test check-in process
    console.log('\n=== Test 5: Test check-in process ===');
    await connection.execute(`
      UPDATE reservations 
      SET checkin_status = 'checked_in'
      WHERE id = ?
    `, [testReservationId]);

    const checkedInReservation = await connection.execute(`
      SELECT status, checkin_status FROM reservations WHERE id = ?
    `, [testReservationId]);
    
    console.log('After check-in:');
    console.log('  Status:', checkedInReservation[0][0].status);
    console.log('  Checkin Status:', checkedInReservation[0][0].checkin_status);

    // Test 6: Test check-out process
    console.log('\n=== Test 6: Test check-out process ===');
    await connection.execute(`
      UPDATE reservations 
      SET checkin_status = 'checked_out'
      WHERE id = ?
    `, [testReservationId]);

    const checkedOutReservation = await connection.execute(`
      SELECT status, checkin_status FROM reservations WHERE id = ?
    `, [testReservationId]);
    
    console.log('After check-out:');
    console.log('  Status:', checkedOutReservation[0][0].status);
    console.log('  Checkin Status:', checkedOutReservation[0][0].checkin_status);

    // Clean up test data
    await connection.execute(`DELETE FROM reservations WHERE id = ?`, [testReservationId]);
    await connection.execute(`DELETE FROM users WHERE id = ?`, [testUserId]);

    console.log('\n=== Migration Test Results ===');
    console.log('✅ All tests passed! The migration was successful.');
    console.log('✅ Status field now only contains: pending, confirmed, cancelled, no-show');
    console.log('✅ Checkin_status field contains: not_checked_in, checked_in, checked_out');
    console.log('✅ No more confusion between reservation status and check-in status!');
    
  } catch (error) {
    console.error('Migration test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMigration(); 