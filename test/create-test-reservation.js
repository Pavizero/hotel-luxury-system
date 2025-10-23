const fetch = require('node-fetch');

async function createTestReservation() {
  const baseUrl = 'http://localhost:3000';

  // 1. Login
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@hotel.com',
      password: 'password'
    })
  });
  if (!loginResponse.ok) {
    console.error('Login failed');
    process.exit(1);
  }
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✓ Login successful');

  // 2. Get a room type (just pick the first available)
  const roomTypesResponse = await fetch(`${baseUrl}/api/manager/rooms`, {
    headers: { 'Cookie': cookies }
  });
  if (!roomTypesResponse.ok) {
    console.error('Failed to fetch room types');
    process.exit(1);
  }
  const roomTypesData = await roomTypesResponse.json();
  const roomType = Array.isArray(roomTypesData) ? roomTypesData[0] : (roomTypesData.rooms ? roomTypesData.rooms[0] : null);
  if (!roomType) {
    console.error('No room types found');
    process.exit(1);
  }
  console.log('✓ Found room type:', roomType.id || roomType.room_type_id);

  // 3. Create a reservation
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const reservationData = {
    room_type_id: roomType.id || roomType.room_type_id,
    check_in_date: today.toISOString().split('T')[0],
    check_out_date: tomorrow.toISOString().split('T')[0],
    num_guests: 1,
    special_requests: 'Test reservation',
    has_credit_card: false
  };
  const reservationResponse = await fetch(`${baseUrl}/api/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify(reservationData)
  });
  if (!reservationResponse.ok) {
    const errorData = await reservationResponse.json();
    console.error('Failed to create reservation:', errorData);
    process.exit(1);
  }
  const reservation = await reservationResponse.json();
  console.log('✓ Reservation created:', reservation.reservation ? reservation.reservation.id : reservation.id);
}

createTestReservation(); 