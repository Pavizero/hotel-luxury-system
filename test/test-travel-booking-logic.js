const fetch = require('node-fetch');

async function testTravelBookingLogic() {
  console.log('Testing travel booking logic...');
  
  try {
    // Test 1: Individual booking (1 room) - should be pending
    console.log('\n=== Test 1: Individual Travel Booking (1 room) ===');
    const individualResponse = await fetch('http://localhost:3000/api/travel/bulk-bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=travel' // Simulate travel user
      },
      body: JSON.stringify({
        checkIn: '2025-08-01',
        checkOut: '2025-08-03',
        rooms: 1,
        guests: 2,
        roomTypes: 'Standard',
        totalAmount: 200
      })
    });

    console.log('Individual booking status:', individualResponse.status);
    if (individualResponse.ok) {
      const result = await individualResponse.json();
      console.log('✅ Individual booking created successfully');
      console.log('Expected: status = "pending", checkin_status = "not_checked_in"');
    } else {
      const error = await individualResponse.text();
      console.log('❌ Individual booking failed:', error);
    }

    // Test 2: Bulk booking (2 rooms) - should be confirmed
    console.log('\n=== Test 2: Bulk Travel Booking (2 rooms) ===');
    const bulkResponse = await fetch('http://localhost:3000/api/travel/bulk-bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=travel'
      },
      body: JSON.stringify({
        checkIn: '2025-08-05',
        checkOut: '2025-08-07',
        rooms: 2,
        guests: 4,
        roomTypes: 'Deluxe',
        totalAmount: 600
      })
    });

    console.log('Bulk booking status:', bulkResponse.status);
    if (bulkResponse.ok) {
      const result = await bulkResponse.json();
      console.log('✅ Bulk booking created successfully');
      console.log('Expected: status = "confirmed", checkin_status = "not_checked_in"');
    } else {
      const error = await bulkResponse.text();
      console.log('❌ Bulk booking failed:', error);
    }

    // Test 3: Large bulk booking (5 rooms) - should be confirmed
    console.log('\n=== Test 3: Large Bulk Travel Booking (5 rooms) ===');
    const largeBulkResponse = await fetch('http://localhost:3000/api/travel/bulk-bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=travel'
      },
      body: JSON.stringify({
        checkIn: '2025-08-10',
        checkOut: '2025-08-12',
        rooms: 5,
        guests: 10,
        roomTypes: 'Executive Suite',
        totalAmount: 2500
      })
    });

    console.log('Large bulk booking status:', largeBulkResponse.status);
    if (largeBulkResponse.ok) {
      const result = await largeBulkResponse.json();
      console.log('✅ Large bulk booking created successfully');
      console.log('Expected: status = "confirmed", checkin_status = "not_checked_in"');
    } else {
      const error = await largeBulkResponse.text();
      console.log('❌ Large bulk booking failed:', error);
    }

    // Test 4: Check clerk dashboard can see travel bookings
    console.log('\n=== Test 4: Clerk Dashboard Integration ===');
    const clerkResponse = await fetch('http://localhost:3000/api/clerk/guests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=clerk'
      }
    });

    console.log('Clerk guests API status:', clerkResponse.status);
    if (clerkResponse.ok) {
      const data = await clerkResponse.json();
      console.log('✅ Clerk can see guests (including travel bookings)');
      console.log(`Total guests: ${data.guests?.length || 0}`);
      
      // Check for travel bookings
      const travelBookings = data.guests?.filter(g => g.is_travel_company) || [];
      console.log(`Travel bookings found: ${travelBookings.length}`);
    } else {
      const error = await clerkResponse.text();
      console.log('❌ Clerk guests API failed:', error);
    }

    console.log('\n=== Summary ===');
    console.log('✅ Travel booking logic tests completed');
    console.log('Expected behavior:');
    console.log('- Individual bookings (1 room): status = "pending"');
    console.log('- Bulk bookings (2+ rooms): status = "confirmed"');
    console.log('- All bookings: checkin_status = "not_checked_in"');
    console.log('- Only clerks can change checkin_status');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTravelBookingLogic(); 