-- Minimal clean seed data for hotel system testing

-- Room Types
INSERT INTO room_types (id, type_name, description, base_price, capacity, amenities, is_residential)
VALUES
  ('roomtype-std-001', 'Standard', 'Standard room', 100.00, 2, 'WiFi,TV,AC', 0),
  ('roomtype-dlx-001', 'Deluxe', 'Deluxe room', 150.00, 3, 'WiFi,TV,AC,Minibar', 0)
ON CONFLICT (id) DO NOTHING;

-- Rooms
INSERT INTO rooms (id, room_number, room_type_id, status)
VALUES
  ('room-101', '101', 'roomtype-std-001', 'available'),
  ('room-201', '201', 'roomtype-dlx-001', 'available')
ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO users (id, name, email, password_hash, role)
VALUES
  ('user-cust-001', 'Test Customer', 'customer@hotel.com', 'password', 'customer'),
  ('user-clerk-001', 'Test Clerk', 'clerk@hotel.com', 'password', 'clerk'),
  ('user-mgr-001', 'Test Manager', 'manager@hotel.com', 'password', 'manager')
ON CONFLICT (id) DO NOTHING;

-- Reservations
INSERT INTO reservations (id, user_id, room_type_id, check_in_date, check_out_date, num_guests, status, checkin_status, total_price, discount_amount, final_price, has_credit_card)
VALUES
  ('res-pending-001', 'user-cust-001', 'roomtype-std-001', '2025-12-01', '2025-12-05', 1, 'pending', 'not_checked_in', 400.00, 0.00, 400.00, false),
  ('res-confirmed-001', 'user-cust-001', 'roomtype-dlx-001', '2025-12-10', '2025-12-15', 2, 'confirmed', 'not_checked_in', 750.00, 0.00, 750.00, true)
ON CONFLICT (id) DO NOTHING;
