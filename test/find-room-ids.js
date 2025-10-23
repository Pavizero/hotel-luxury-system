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

async function main() {
  try {
    // Login as manager
    const managerCookie = await login('manager@hotel.com', 'password');

    // Fetch room types (manager endpoint)
    let res = await fetch(`${BASE_URL}/api/manager/rooms`, {
      headers: { 'Cookie': managerCookie }
    });
    let data = await res.json();
    if (res.ok && Array.isArray(data.rooms)) {
      console.log('Room Types:');
      data.rooms.forEach(rt => {
        console.log(`- id: ${rt.id}, name: ${rt.type_name}`);
      });
    } else {
      console.log('Room Types (raw):', data);
    }

    // Login as clerk
    const clerkCookie = await login('clerk@hotel.com', 'password');

    // Fetch available rooms (clerk endpoint)
    res = await fetch(`${BASE_URL}/api/clerk/available-rooms`, {
      headers: { 'Cookie': clerkCookie }
    });
    data = await res.json();
    if (res.ok && Array.isArray(data.rooms)) {
      console.log('\nAvailable Rooms:');
      data.rooms.forEach(r => {
        console.log(`- id: ${r.id}, number: ${r.room_number}, type: ${r.room_type_id}`);
      });
    } else {
      console.log('Available Rooms (raw):', data);
    }
  } catch (err) {
    console.error('Failed to fetch room types or rooms:', err);
  }
}

main(); 