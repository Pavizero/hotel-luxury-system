const fetch = require('node-fetch');

async function testReservationModification() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, login to get a session
    console.log('1. Logging in...');
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
    
    // Get user's reservations
    console.log('\n2. Fetching user reservations...');
    const reservationsResponse = await fetch(`${baseUrl}/api/reservations`, {
      headers: { 
        'Cookie': cookies 
      }
    });
    
    if (!reservationsResponse.ok) {
      throw new Error('Failed to fetch reservations');
    }
    
    const reservationsData = await reservationsResponse.json();
    const reservations = Array.isArray(reservationsData) ? reservationsData : reservationsData.reservations;
    console.log('✓ Found reservations:', reservations ? reservations.length : 0);
    
    if (!reservations || reservations.length === 0) {
      console.log('No reservations found to test modification. Please create a reservation for customer@hotel.com and rerun the test.');
      return;
    }
    
    // Print all reservation statuses for debugging
    console.log('\nAll reservations for customer@hotel.com:');
    reservations.forEach(r => {
      console.log(`- ID: ${r.id}, status: ${r.status}, checkin_status: ${r.checkin_status}`);
    });
    
    // Get the first reservation for modification that is modifiable and not checked in
    const reservationToModify = reservations.find(r => (r.status === 'pending' || r.status === 'confirmed') && r.checkin_status === 'not_checked_in');
    if (!reservationToModify) {
      console.log('No modifiable (pending or confirmed, not checked in) reservations found for testing.');
      return;
    }
    console.log('\n3. Testing modification of reservation:', reservationToModify.id);
    console.log('Current status:', reservationToModify.status);
    console.log('Current checkin_status:', reservationToModify.checkin_status);
    console.log('Has credit card:', reservationToModify.has_credit_card);
    
    // Test modification with payment details
    console.log('\n4. Modifying reservation with payment details...');
    const modificationData = {
      check_out_date: reservationToModify.check_out_date,
      num_guests: reservationToModify.num_guests,
      special_requests: 'Updated special requests for testing',
      has_credit_card: true,
      credit_card_last4: '1234',
      status: 'confirmed'
    };
    
    const modifyResponse = await fetch(`${baseUrl}/api/reservations/${reservationToModify.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies 
      },
      body: JSON.stringify(modificationData)
    });
    
    if (!modifyResponse.ok) {
      const errorData = await modifyResponse.json();
      console.log('✗ Modification failed:', errorData);
      return;
    }
    
    const modifiedReservation = await modifyResponse.json();
    console.log('✓ Modification successful');
    console.log('Updated status:', modifiedReservation.reservation.status);
    console.log('Updated has_credit_card:', modifiedReservation.reservation.has_credit_card);
    console.log('Updated credit_card_last4:', modifiedReservation.reservation.credit_card_last4);
    // Check that checkin_status is still not_checked_in
    if (modifiedReservation.reservation.checkin_status !== 'not_checked_in') {
      console.error('✗ checkin_status was incorrectly updated on confirmation!');
    } else {
      console.log('✓ checkin_status remains not_checked_in after confirmation');
    }

    // After modification, fetch and print the reservation's status and checkin_status
    const postModResponse = await fetch(`${baseUrl}/api/reservations/${reservationToModify.id}`);
    const postModReservation = await postModResponse.json();
    console.log('Post-modification status:', postModReservation.status || postModReservation.reservation?.status);
    console.log('Post-modification checkin_status:', postModReservation.checkin_status || postModReservation.reservation?.checkin_status);

    // Test that attempting to set both status and checkin_status is rejected
    console.log('\n5. Attempting to set both status and checkin_status in the same request...');
    const invalidUpdate = {
      status: 'confirmed',
      checkin_status: 'checked_in'
    };
    const invalidResponse = await fetch(`${baseUrl}/api/reservations/${reservationToModify.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(invalidUpdate)
    });
    if (!invalidResponse.ok) {
      const errorData = await invalidResponse.json();
      if (errorData.error && errorData.error.code === 'INVALID_STATUS_CHECKIN_COMBINATION') {
        console.log('✓ Correctly rejected attempt to set both status and checkin_status:', errorData.error.message);
      } else {
        console.error('✗ Unexpected error when setting both status and checkin_status:', errorData);
      }
    } else {
      console.error('✗ Server allowed setting both status and checkin_status together!');
    }

    // Verify the changes by fetching the reservation again
    console.log('\n6. Verifying changes...');
    const verifyResponse = await fetch(`${baseUrl}/api/reservations/${reservationToModify.id}`, {
      headers: { 
        'Cookie': cookies 
      }
    });
    
    if (!verifyResponse.ok) {
      throw new Error('Failed to verify reservation');
    }
    
    const verifiedReservation = await verifyResponse.json();
    console.log('✓ Verification successful');
    console.log('Final status:', verifiedReservation.status);
    console.log('Final has_credit_card:', verifiedReservation.has_credit_card);
    console.log('Final credit_card_last4:', verifiedReservation.credit_card_last4);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testReservationModification(); 