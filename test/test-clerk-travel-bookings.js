const fetch = require('node-fetch');

async function testClerkTravelBookings() {
  console.log('Testing clerk dashboard with travel bookings...');
  
  try {
    // Test 1: Check if clerk can see travel bookings
    console.log('\n=== Test 1: Clerk Guests API ===');
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
      console.log('✅ Clerk can see guests');
      console.log(`Total guests: ${data.guests?.length || 0}`);
      
      // Check for travel bookings
      const travelBookings = data.guests?.filter(g => g.is_travel_company) || [];
      console.log(`Travel bookings found: ${travelBookings.length}`);
      
      if (travelBookings.length > 0) {
        console.log('Travel booking details:');
        travelBookings.forEach((booking, index) => {
          console.log(`${index + 1}. ${booking.display_name}`);
          console.log(`   Status: ${booking.status}`);
          console.log(`   Check-in Status: ${booking.checkin_status}`);
          console.log(`   Room Type: ${booking.roomType}`);
          console.log(`   Balance: $${booking.balance}`);
        });
      }
    } else {
      const error = await clerkResponse.text();
      console.log('❌ Clerk guests API failed:', error);
    }

    // Test 2: Check if travel bookings show proper display names
    console.log('\n=== Test 2: Display Name Verification ===');
    if (clerkResponse.ok) {
      const data = await clerkResponse.json();
      const travelBookings = data.guests?.filter(g => g.is_travel_company) || [];
      
      travelBookings.forEach((booking, index) => {
        const expectedDisplayName = `${booking.name} (Travel)`;
        if (booking.display_name === expectedDisplayName) {
          console.log(`✅ Booking ${index + 1}: Display name correct`);
        } else {
          console.log(`❌ Booking ${index + 1}: Display name incorrect`);
          console.log(`   Expected: ${expectedDisplayName}`);
          console.log(`   Got: ${booking.display_name}`);
        }
      });
    }

    // Test 3: Check if travel bookings have proper status for check-in
    console.log('\n=== Test 3: Check-in Status Verification ===');
    if (clerkResponse.ok) {
      const data = await clerkResponse.json();
      const confirmedTravelBookings = data.guests?.filter(g => 
        g.is_travel_company && 
        g.status === 'confirmed' && 
        g.checkin_status === 'not_checked_in'
      ) || [];
      
      console.log(`Confirmed travel bookings ready for check-in: ${confirmedTravelBookings.length}`);
      
      if (confirmedTravelBookings.length > 0) {
        console.log('These bookings should show "Check In" button:');
        confirmedTravelBookings.forEach((booking, index) => {
          console.log(`${index + 1}. ${booking.display_name} - ${booking.roomType}`);
        });
      }
    }

    console.log('\n=== Summary ===');
    console.log('✅ Clerk dashboard travel booking tests completed');
    console.log('Expected behavior:');
    console.log('- Travel bookings show "(Travel)" in display name');
    console.log('- Travel bookings appear in clerk dashboard');
    console.log('- Confirmed travel bookings can be checked in');
    console.log('- Each reservation in bulk booking needs separate room assignment');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testClerkTravelBookings(); 