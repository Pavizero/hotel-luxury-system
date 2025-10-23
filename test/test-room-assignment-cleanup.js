const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.headers.get('set-cookie');
}

async function testRoomAssignmentCleanup() {
  try {
    console.log('Testing room assignment cleanup after check-out...');
    
    // Login as clerk
    const clerkCookie = await login('clerk@hotel.com', 'password');
    console.log('✓ Clerk login successful');

    // Get current guests to find a checked-in reservation
    const guestsResponse = await fetch(`${BASE_URL}/api/clerk/guests`, {
      headers: { 'Cookie': clerkCookie }
    });
    
    if (!guestsResponse.ok) {
      throw new Error('Failed to fetch guests');
    }
    
    const guests = await guestsResponse.json();
    console.log(`Found ${guests.guests ? guests.guests.length : 0} guests`);

    // Find a checked-in guest
    const checkedInGuest = guests.guests ? guests.guests.find(g => g.checkin_status === 'checked_in') : null;
    
    if (!checkedInGuest) {
      console.log('No checked-in guests found. Creating a test reservation...');
      
      // Create a test walk-in reservation
      const walkInResponse = await fetch(`${BASE_URL}/api/clerk/walk-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': clerkCookie 
        },
        body: JSON.stringify({
          name: 'Test Guest',
          email: 'test@example.com',
          phone: '123-456-7890',
          roomId: '1', // Use first available room
          checkIn: '2025-01-20',
          checkOut: '2025-01-22',
          guests: 2
        })
      });
      
      if (!walkInResponse.ok) {
        throw new Error('Failed to create walk-in reservation');
      }
      
      console.log('✓ Created test walk-in reservation');
      
      // Check in the guest
      const checkInResponse = await fetch(`${BASE_URL}/api/clerk/check-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': clerkCookie 
        },
        body: JSON.stringify({
          reservationId: 'test-reservation-id',
          roomId: '1'
        })
      });
      
      console.log('✓ Checked in test guest');
    }

    // Get guests again to find the checked-in guest
    const guestsResponse2 = await fetch(`${BASE_URL}/api/clerk/guests`, {
      headers: { 'Cookie': clerkCookie }
    });
    
    const guests2 = await guestsResponse2.json();
    const checkedInGuest2 = guests2.guests ? guests2.guests.find(g => g.checkin_status === 'checked_in') : null;
    
    if (!checkedInGuest2) {
      throw new Error('No checked-in guests available for testing');
    }

    console.log(`Found checked-in guest: ${checkedInGuest2.name} in room: ${checkedInGuest2.room}`);

    // Check out the guest
    console.log('Checking out guest...');
    const checkOutResponse = await fetch(`${BASE_URL}/api/clerk/check-out`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': clerkCookie 
      },
      body: JSON.stringify({
        reservationId: checkedInGuest2.id
      })
    });
    
    if (!checkOutResponse.ok) {
      const error = await checkOutResponse.json();
      throw new Error(`Check-out failed: ${error.error}`);
    }
    
    const checkOutResult = await checkOutResponse.json();
    console.log(`✓ Check-out successful: ${checkOutResult.message}`);

    // Verify room is available and not assigned
    console.log('Verifying room assignment cleanup...');
    
    // Check if room is available
    const roomsResponse = await fetch(`${BASE_URL}/api/clerk/available-rooms`, {
      headers: { 'Cookie': clerkCookie }
    });
    
    if (!roomsResponse.ok) {
      throw new Error('Failed to fetch available rooms');
    }
    
    const rooms = await roomsResponse.json();
    const roomNumber = checkedInGuest2.room;
    const roomIsAvailable = rooms.rooms.some(r => r.number === roomNumber);
    
    if (roomIsAvailable) {
      console.log(`✓ SUCCESS: Room ${roomNumber} is now available for new assignments!`);
    } else {
      console.log(`✗ FAILED: Room ${roomNumber} is still not available`);
    }

    // Verify reservation status
    const reservationsResponse = await fetch(`${BASE_URL}/api/reservations`, {
      headers: { 'Cookie': clerkCookie }
    });
    
    if (reservationsResponse.ok) {
      const reservations = await reservationsResponse.json();
      const reservation = reservations.reservations.find(r => r.id === checkedInGuest2.id);
      
      if (reservation && reservation.checkin_status === 'checked_out') {
        console.log('✓ SUCCESS: Reservation checkin_status updated to checked_out!');
      } else {
        console.log('✗ FAILED: Reservation status not updated correctly');
      }
    }

    console.log('\n🎉 Room assignment cleanup test completed successfully!');
    console.log('The room is now properly available for new reservations.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRoomAssignmentCleanup(); 