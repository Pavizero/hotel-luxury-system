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

    // Fetch all reservations (manager has access)
    const res = await fetch(`${BASE_URL}/api/reservations`, {
      headers: { 'Cookie': managerCookie }
    });
    const data = await res.json();
    const reservations = data.reservations || [];
    if (!reservations.length) {
      console.log('No reservations to delete.');
      return;
    }
    console.log(`Found ${reservations.length} reservations. Deleting...`);
    for (const r of reservations) {
      const del = await fetch(`${BASE_URL}/api/reservations/${r.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': managerCookie }
      });
      if (del.ok) {
        console.log(`Deleted reservation ${r.id}`);
      } else {
        const err = await del.json();
        console.log(`Failed to delete ${r.id}:`, err);
      }
    }
    console.log('All deletions attempted.');
  } catch (err) {
    console.error('Failed to clear reservations:', err);
  }
}

main(); 