const mysql = require('mysql2/promise');

async function testDatabase() {
  const { DATABASE_URL } = process.env;
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    return;
  }

  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Database connection successful');

    // Test room_types table
    const [roomTypes] = await connection.execute('SELECT * FROM room_types');
    console.log('✅ Room types found:', roomTypes.length);
    console.log('Room types:', roomTypes.map(rt => rt.type_name));

    // Test reservations table
    const [reservations] = await connection.execute('SELECT * FROM reservations LIMIT 5');
    console.log('✅ Reservations found:', reservations.length);

    // Test users table
    const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
    console.log('✅ Users found:', users.length);

    await connection.end();
    console.log('✅ Database test completed successfully');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabase(); 