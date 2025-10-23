const fetch = require('node-fetch').default;

async function testSimpleAPI() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('Testing reservation API...');
    
    // First, login
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@hotel.com',
        password: 'password'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✓ Login successful');
    
    // Get all reservations
    const reservationsResponse = await fetch(`${baseUrl}/api/reservations`, {
      headers: { 'Cookie': cookies }
    });
    
    if (!reservationsResponse.ok) {
      throw new Error('Failed to fetch reservations');
    }
    
    const reservations = await reservationsResponse.json();
    console.log('✓ Found reservations:', reservations.length);
    
    if (reservations.length > 0) {
      const firstReservation = reservations[0];
      console.log('First reservation:', {
        id: firstReservation.id,
        room_type_name: firstReservation.room_type_name,
        room_type_id: firstReservation.room_type_id,
        status: firstReservation.status,
        has_credit_card: firstReservation.has_credit_card,
        credit_card_last4: firstReservation.credit_card_last4
      });
      
      // Test getting single reservation
      const singleReservationResponse = await fetch(`${baseUrl}/api/reservations/${firstReservation.id}`, {
        headers: { 'Cookie': cookies }
      });
      
      if (!singleReservationResponse.ok) {
        throw new Error('Failed to fetch single reservation');
      }
      
      const singleReservation = await singleReservationResponse.json();
      console.log('✓ Single reservation fetched:', {
        id: singleReservation.id,
        room_type_name: singleReservation.room_type_name,
        room_type_id: singleReservation.room_type_id,
        status: singleReservation.status,
        has_credit_card: singleReservation.has_credit_card,
        credit_card_last4: singleReservation.credit_card_last4
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSimpleAPI(); 