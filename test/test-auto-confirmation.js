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

async function testAutoConfirmation() {
  try {
    console.log('Testing auto-confirmation when adding card details...');
    
    // Login as customer
    const customerCookie = await login('customer@hotel.com', 'password');
    console.log('✓ Login successful');

    // Get existing reservations
    const reservationsResponse = await fetch(`${BASE_URL}/api/reservations`, {
      headers: { 'Cookie': customerCookie }
    });
    
    if (!reservationsResponse.ok) {
      throw new Error('Failed to fetch reservations');
    }
    
    const reservationsData = await reservationsResponse.json();
    const reservations = Array.isArray(reservationsData) ? reservationsData : reservationsData.reservations;
    
    // Find a pending reservation
    const pendingReservation = reservations.find(r => r.status === 'pending' && r.checkin_status === 'not_checked_in' && !r.has_credit_card);
    
    if (!pendingReservation) {
      console.log('No pending reservations found. Creating one...');
      
      // Create a pending reservation first
      const createResponse = await fetch(`${BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': customerCookie
        },
        body: JSON.stringify({
          room_type_id: 'ffccf734-5e8f-11f0-ae43-f02f742fe0dc', // Use first available room type
          check_in_date: '2025-12-20',
          check_out_date: '2025-12-25',
          num_guests: 1,
          has_credit_card: false
        })
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('Failed to create test reservation:', errorData);
        return;
      }
      
      const newReservation = await createResponse.json();
      console.log('✓ Created pending reservation:', newReservation.reservation?.id || newReservation.id);
      
      // Now test the auto-confirmation
      const testReservationId = newReservation.reservation?.id || newReservation.id;
      
      console.log('\nTesting auto-confirmation...');
      console.log('Before: status = pending, has_credit_card = false');
      
      const updateResponse = await fetch(`${BASE_URL}/api/reservations/${testReservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': customerCookie
        },
        body: JSON.stringify({
          has_credit_card: true,
          credit_card_last4: '5678'
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('✗ Update failed:', errorData);
        return;
      }
      
      const updatedReservation = await updateResponse.json();
      const reservation = updatedReservation.reservation || updatedReservation;
      
      console.log('After: status =', reservation.status, ', has_credit_card =', reservation.has_credit_card);
      
      if (reservation.status === 'confirmed' && reservation.has_credit_card === true) {
        console.log('✓ SUCCESS: Reservation was auto-confirmed when adding card details!');
      } else {
        console.log('✗ FAILED: Reservation was not auto-confirmed');
      }
      
    } else {
      console.log('Found pending reservation:', pendingReservation.id);
      console.log('Before: status =', pendingReservation.status, ', has_credit_card =', pendingReservation.has_credit_card);
      
      const updateResponse = await fetch(`${BASE_URL}/api/reservations/${pendingReservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': customerCookie
        },
        body: JSON.stringify({
          has_credit_card: true,
          credit_card_last4: '5678'
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('✗ Update failed:', errorData);
        return;
      }
      
      const updatedReservation = await updateResponse.json();
      const reservation = updatedReservation.reservation || updatedReservation;
      
      console.log('After: status =', reservation.status, ', has_credit_card =', reservation.has_credit_card);
      
      if (reservation.status === 'confirmed' && reservation.has_credit_card === true) {
        console.log('✓ SUCCESS: Reservation was auto-confirmed when adding card details!');
      } else {
        console.log('✗ FAILED: Reservation was not auto-confirmed');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAutoConfirmation(); 