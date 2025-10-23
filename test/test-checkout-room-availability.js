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

async function testCheckoutRoomAvailability() {
  try {
    console.log('Testing check-out room availability...');
    
    // Login as clerk
    const clerkCookie = await login('clerk@hotel.com', 'password');
    console.log('✓ Clerk login successful');

    // Get current guests (checked-in reservations)
    const guestsResponse = await fetch(`${BASE_URL}/api/clerk/guests`, {
      headers: { 'Cookie': clerkCookie }
    });
    
    if (!guestsResponse.ok) {
      throw new Error('Failed to fetch guests');
    }
    
    const guestsData = await guestsResponse.json();
    const guests = guestsData.guests || [];
    
    // Find a checked-in guest
    const checkedInGuest = guests.find(g => g.checkin_status === 'checked_in');
    
    if (!checkedInGuest) {
      console.log('No checked-in guests found. Please check in a guest first.');
      return;
    }
    
    console.log('Found checked-in guest:', checkedInGuest.name, 'in room:', checkedInGuest.room);
    
    // Get room status before check-out
    const roomsResponse = await fetch(`${BASE_URL}/api/manager/rooms`, {
      headers: { 'Cookie': await login('manager@hotel.com', 'password') }
    });
    
    if (roomsResponse.ok) {
      const roomsData = await roomsResponse.json();
      const room = roomsData.rooms?.find(r => r.number === checkedInGuest.room);
      if (room) {
        console.log('Room status before check-out:', room.status);
      }
    }
    
    // Check out the guest
    console.log('\nChecking out guest...');
    const checkoutResponse = await fetch(`${BASE_URL}/api/clerk/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': clerkCookie
      },
      body: JSON.stringify({
        reservationId: checkedInGuest.id
      })
    });
    
    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      console.error('✗ Check-out failed:', errorData);
      return;
    }
    
    const checkoutResult = await checkoutResponse.json();
    console.log('✓ Check-out successful:', checkoutResult.message);
    
    // Verify room is now available
    console.log('\nVerifying room availability...');
    const updatedRoomsResponse = await fetch(`${BASE_URL}/api/manager/rooms`, {
      headers: { 'Cookie': await login('manager@hotel.com', 'password') }
    });
    
    if (updatedRoomsResponse.ok) {
      const updatedRoomsData = await updatedRoomsResponse.json();
      const updatedRoom = updatedRoomsData.rooms?.find(r => r.number === checkedInGuest.room);
      
      if (updatedRoom) {
        console.log('Room status after check-out:', updatedRoom.status);
        if (updatedRoom.status === 'available') {
          console.log('✓ SUCCESS: Room is now available after check-out!');
        } else {
          console.log('✗ FAILED: Room is not available after check-out');
        }
      } else {
        console.log('Could not find room after check-out');
      }
    }
    
    // Verify reservation checkin_status is updated
    console.log('\nVerifying reservation status...');
    const reservationResponse = await fetch(`${BASE_URL}/api/reservations/${checkedInGuest.id}`, {
      headers: { 'Cookie': clerkCookie }
    });
    
    if (reservationResponse.ok) {
      const reservation = await reservationResponse.json();
      console.log('Reservation checkin_status after check-out:', reservation.checkin_status);
      if (reservation.checkin_status === 'checked_out') {
        console.log('✓ SUCCESS: Reservation checkin_status updated to checked_out!');
      } else {
        console.log('✗ FAILED: Reservation checkin_status not updated correctly');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCheckoutRoomAvailability(); 