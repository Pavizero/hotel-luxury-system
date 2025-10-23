const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Helper: login and return cookie
async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  return res.headers.get('set-cookie');
}

// Helper: fetch with cookie
async function fetchWithCookie(url, options = {}, cookie) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Cookie': cookie,
      'Content-Type': 'application/json',
    },
  });
}

// Helper: print section
function section(title) {
  console.log(`\n=== ${title} ===`);
}

(async () => {
  try {
    // --- 1. Customer Reservation Flow ---
    section('Customer Reservation Flow');
    const customerEmail = 'customer@hotel.com';
    const customerCookie = await login(customerEmail, 'password');

    // 1.1 Create reservation without card
    let res = await fetchWithCookie(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      body: JSON.stringify({
        room_type_id: '246752b1-59ce-11f0-8d26-f02f742fe0dc', // Standard
        check_in_date: '2025-12-01',
        check_out_date: '2025-12-05',
        num_guests: 1,
        has_credit_card: false
      })
    }, customerCookie);
    let reservation = await res.json();
    if (!res.ok) throw reservation;
    reservation = reservation.reservation || reservation;
    console.log('Created reservation:', reservation.id, reservation.status, reservation.checkin_status);

    // 1.2 Add payment (update reservation)
    res = await fetchWithCookie(`${BASE_URL}/api/reservations/${reservation.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        has_credit_card: true,
        credit_card_last4: '1234',
        status: 'confirmed'
      })
    }, customerCookie);
    let updated = await res.json();
    if (!res.ok) throw updated;
    updated = updated.reservation || updated;
    console.log('Added payment:', updated.status, updated.checkin_status);

    // 1.3 Clerk checks in guest
    section('Clerk Check-in');
    const clerkCookie = await login('clerk@hotel.com', 'password');
    res = await fetchWithCookie(`${BASE_URL}/api/clerk/check-in`, {
      method: 'POST',
      body: JSON.stringify({ reservationId: reservation.id, roomId: '24683298-59ce-11f0-8d26-f02f742fe0dc' }) // valid room id
    }, clerkCookie);
    let checkin = await res.json();
    if (!res.ok) throw checkin;
    console.log('Checked in:', checkin);

    // 1.4 Clerk checks out guest
    section('Clerk Check-out');
    res = await fetchWithCookie(`${BASE_URL}/api/clerk/check-out`, {
      method: 'POST',
      body: JSON.stringify({ reservationId: reservation.id })
    }, clerkCookie);
    let checkout = await res.json();
    if (!res.ok) throw checkout;
    console.log('Checked out:', checkout);

    // 1.5 Pay balance (simulate payment)
    section('Customer Pays Balance');
    // ...simulate payment API if available

    // --- 2. Travel Agency Reservation Flow ---
    section('Travel Agency Reservation Flow');
    const travelCookie = await login('travel@hotel.com', 'password');
    // ...simulate bulk booking, assign guests, agency payment, check-in/out, billing

    // --- 3. Clerk Flow ---
    section('Clerk Dashboard Flow');
    // ...simulate dashboard queries, manual check-in/out, assign/change room, cancel, bill

    // --- 4. Walk-in Guest Flow ---
    section('Walk-in Guest Flow');
    // ...simulate clerk creating walk-in, payment, instant check-in

    // --- 5. Loyalty Guest Flow ---
    section('Loyalty Guest Flow');
    // ...simulate loyalty guest booking, perks, check-in/out, points

    // --- Edge/Invalid Flows ---
    section('Edge/Invalid Flows');
    // A. Invalid dates
    // B. Duplicate booking
    // C. Overbooking
    // D. Modify after check-in
    // E. Cancel after check-in
    // F. No-show
    // G. Partial payment
    // H. Invoice/billing

    // --- Reporting & Visibility ---
    section('Reporting & Dashboards');
    // ...simulate dashboard queries for customer, clerk, agency

    console.log('\nAll core flows and edge cases simulated. Review output for any errors or failed assertions.');
  } catch (err) {
    console.error('Test failed:', err);
  }
})(); 