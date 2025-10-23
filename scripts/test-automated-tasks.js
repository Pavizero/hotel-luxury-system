#!/usr/bin/env node

/**
 * Test Script for Automated Tasks
 * 
 * This script helps test the automated tasks by creating test data
 * and running the automated functions.
 */

const mysql = require('mysql2/promise');

// Database configuration - update these values
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password_here', // Update this
  database: 'hotel_luxury_system'
};

async function createTestData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create test reservations without payment
    console.log('\n📝 Creating test reservations without payment...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Insert test reservations
    await connection.execute(`
      INSERT INTO reservations (id, user_id, room_type_id, check_in_date, check_out_date, num_guests, status, total_price, has_credit_card)
      VALUES 
        (UUID(), (SELECT id FROM users WHERE email = 'customer@hotel.com' LIMIT 1), 
         (SELECT id FROM room_types WHERE type_name = 'Standard' LIMIT 1), 
         ?, DATE_ADD(?, INTERVAL 2 DAY), 2, 'pending-checkin', 20000, false),
        (UUID(), (SELECT id FROM users WHERE email = 'customer@hotel.com' LIMIT 1), 
         (SELECT id FROM room_types WHERE type_name = 'Deluxe' LIMIT 1), 
         ?, DATE_ADD(?, INTERVAL 1 DAY), 1, 'pending-checkin', 15000, false)
    `, [today, today, today, today]);

    console.log('✅ Created 2 test reservations without payment');

    // Create test no-show reservations
    console.log('\n📝 Creating test no-show reservations...');
    
    await connection.execute(`
      INSERT INTO reservations (id, user_id, room_type_id, check_in_date, check_out_date, num_guests, status, total_price, has_credit_card)
      VALUES 
        (UUID(), (SELECT id FROM users WHERE email = 'customer@hotel.com' LIMIT 1), 
         (SELECT id FROM room_types WHERE type_name = 'Suite' LIMIT 1), 
         ?, DATE_ADD(?, INTERVAL 3 DAY), 3, 'confirmed', 75000, true),
        (UUID(), (SELECT id FROM users WHERE email = 'travel.agency@hotel.com' LIMIT 1), 
         (SELECT id FROM room_types WHERE type_name = 'Deluxe' LIMIT 1), 
         ?, DATE_ADD(?, INTERVAL 2 DAY), 2, 'confirmed', 30000, true)
    `, [today, today, today, today]);

    console.log('✅ Created 2 test no-show reservations');

    // Show current reservations
    console.log('\n📊 Current reservations:');
    const [reservations] = await connection.execute(`
      SELECT r.id, r.status, r.has_credit_card, r.check_in_date, r.total_price, rt.type_name
      FROM reservations r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.check_in_date = ?
      ORDER BY r.created_at DESC
    `, [today]);

    reservations.forEach((res, index) => {
      console.log(`${index + 1}. ${res.type_name} - ${res.status} - Credit Card: ${res.has_credit_card} - Price: ${res.total_price}`);
    });

    console.log('\n🎯 Test data created successfully!');
    console.log('Now you can test the automated tasks in the Manager Dashboard.');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function checkResults() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    console.log('\n📊 Checking automated task results...');

    // Check cancelled reservations
    const [cancelled] = await connection.execute(`
      SELECT COUNT(*) as count FROM reservations WHERE status = 'cancelled'
    `);
    console.log(`❌ Cancelled reservations: ${cancelled[0].count}`);

    // Check no-show billing
    const [noShowBilling] = await connection.execute(`
      SELECT COUNT(*) as count FROM payments WHERE payment_method = 'no-show_charge'
    `);
    console.log(`💳 No-show billing records: ${noShowBilling[0].count}`);

    // Check no-show reservations
    const [noShowReservations] = await connection.execute(`
      SELECT COUNT(*) as count FROM reservations WHERE status = 'no-show'
    `);
    console.log(`🚫 No-show reservations: ${noShowReservations[0].count}`);

    // Show all reservation statuses
    const [statuses] = await connection.execute(`
      SELECT status, COUNT(*) as count FROM reservations GROUP BY status
    `);
    console.log('\n📈 Reservation status breakdown:');
    statuses.forEach(status => {
      console.log(`  ${status.status}: ${status.count}`);
    });

  } catch (error) {
    console.error('❌ Error checking results:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function cleanup() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    const today = new Date().toISOString().split('T')[0];
    
    // Delete test reservations
    await connection.execute(`
      DELETE FROM reservations WHERE check_in_date = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [today]);

    // Delete test payments
    await connection.execute(`
      DELETE FROM payments WHERE payment_method = 'no-show_charge' AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    console.log('✅ Cleaned up test data');

  } catch (error) {
    console.error('❌ Error cleaning up:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'create':
    createTestData();
    break;
  case 'check':
    checkResults();
    break;
  case 'cleanup':
    cleanup();
    break;
  default:
    console.log(`
🔧 Hotel Luxury System - Test Script

Usage:
  node scripts/test-automated-tasks.js <command>

Commands:
  create   - Create test data for automated tasks
  check    - Check results of automated tasks
  cleanup  - Clean up test data

Before running:
  1. Update the database password in this script
  2. Ensure the application is running
  3. Run 'create' to set up test data
  4. Test automated tasks in Manager Dashboard
  5. Run 'check' to see results
  6. Run 'cleanup' to remove test data
    `);
} 