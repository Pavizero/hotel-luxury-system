-- Comprehensive seed data for Hotel Management System
-- Supports all roles, travel companies, residential suites, and test scenarios

-- Pre-hashed password for "password" using bcrypt with cost 10
-- Hash: $2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy

-- Use UUID() to generate UUIDs in MySQL
SET @bronze_lp_id = UUID();
SET @silver_lp_id = UUID();
SET @gold_lp_id = UUID();

-- Insert loyalty programs
INSERT INTO loyalty_programs (id, tier_name, min_points, discount_percentage, benefits) VALUES
(@bronze_lp_id, 'Bronze', 0, 0.00, 'Basic benefits, WiFi access'),
(@silver_lp_id, 'Silver', 500, 5.00, 'Free breakfast, late checkout, room upgrade'),
(@gold_lp_id, 'Gold', 1500, 10.00, 'Priority check-in, dedicated concierge, spa access');

-- Insert travel companies
SET @travel_company_1_id = UUID();
SET @travel_company_2_id = UUID();

INSERT INTO travel_companies (id, company_name, contact_person, email, phone, address, discount_rate, credit_limit) VALUES
(@travel_company_1_id, 'Luxury Tours Ltd', 'Sarah Johnson', 'sarah@luxurytours.com', '+1-555-0101', '123 Travel Street, New York, NY', 15.00, 25000.00),
(@travel_company_2_id, 'Global Travel Agency', 'Mike Chen', 'mike@globaltravel.com', '+1-555-0202', '456 Agency Ave, Los Angeles, CA', 12.00, 15000.00);

-- Insert users for all roles
SET @customer_user_id = UUID();
SET @clerk_user_id = UUID();
SET @manager_user_id = UUID();
SET @travel_user_id = UUID();
SET @travel_user_2_id = UUID();
SET @customer_2_id = UUID();
SET @customer_3_id = UUID();

-- Customer users
INSERT INTO users (id, name, email, password_hash, role, phone, address, loyalty_points, loyalty_program_id) VALUES
(@customer_user_id, 'John Customer', 'customer@hotel.com', '$2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy', 'customer', '+1-555-1001', '123 Main St, Anytown, USA', 150, @bronze_lp_id),
(@customer_2_id, 'Alice Smith', 'alice@hotel.com', '$2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy', 'customer', '+1-555-1002', '456 Oak Ave, Somewhere, USA', 750, @silver_lp_id),
(@customer_3_id, 'Bob Wilson', 'bob@hotel.com', '$2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy', 'customer', '+1-555-1003', '789 Pine Rd, Elsewhere, USA', 1600, @gold_lp_id);

-- Staff users
INSERT INTO users (id, name, email, password_hash, role, phone, employee_id) VALUES
(@clerk_user_id, 'Jane Clerk', 'clerk@hotel.com', '$2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy', 'clerk', '+1-555-2001', 'EMP001'),
(@manager_user_id, 'Bob Manager', 'manager@hotel.com', '$2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy', 'manager', '+1-555-2002', 'MGR001');

-- Travel company users
INSERT INTO users (id, name, email, password_hash, role, phone, travel_company_id) VALUES
(@travel_user_id, 'Sarah Johnson', 'sarah@luxurytours.com', '$2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy', 'travel', '+1-555-0101', @travel_company_1_id),
(@travel_user_2_id, 'Mike Chen', 'travel@hotel.com', '$2b$10$7caMyzGFkHVxVpYHcH2fTuktPBt27IAWAZUXnqWXeKr4LqLbgDzEy', 'travel', '+1-555-0202', @travel_company_2_id);

-- Insert room types
INSERT INTO room_types (id, type_name, description, base_price, capacity, amenities, is_residential, weekly_rate, monthly_rate) VALUES
('ffccf734-5e8f-11f0-ae43-f02f742fe0dc', 'Standard', 'Comfortable standard room with essential amenities', 100.00, 2, 'WiFi, TV, AC, Private Bathroom', FALSE, NULL, NULL),
('ffccf735-5e8f-11f0-ae43-f02f742fe0dc', 'Deluxe', 'Spacious deluxe room with premium amenities', 150.00, 3, 'WiFi, TV, AC, Private Bathroom, Mini Bar, Ocean View', FALSE, NULL, NULL),
('ffccf736-5e8f-11f0-ae43-f02f742fe0dc', 'Executive Suite', 'Luxurious executive suite with separate living area', 250.00, 4, 'WiFi, TV, AC, Private Bathroom, Mini Bar, Ocean View, Living Room, Butler Service', FALSE, NULL, NULL),
('ffccf737-5e8f-11f0-ae43-f02f742fe0dc', 'Residential Suite', 'Long-term residential accommodation with kitchen', 80.00, 2, 'WiFi, TV, AC, Private Bathroom, Kitchen, Weekly/Monthly Rates', TRUE, 500.00, 1800.00);

-- Rooms (including residential suites)
SET @room_101_id = UUID();
SET @room_102_id = UUID();
SET @room_201_id = UUID();
SET @room_301_id = UUID();
SET @room_401_id = UUID();
SET @room_501_id = UUID();
SET @room_601_id = UUID();

INSERT INTO rooms (id, room_number, room_type_id, status, floor, is_residential) VALUES
(@room_101_id, '101', 'ffccf734-5e8f-11f0-ae43-f02f742fe0dc', 'available', 1, FALSE),
(@room_102_id, '102', 'ffccf734-5e8f-11f0-ae43-f02f742fe0dc', 'occupied', 1, FALSE),
(@room_201_id, '201', 'ffccf735-5e8f-11f0-ae43-f02f742fe0dc', 'available', 2, FALSE),
(@room_301_id, '301', 'ffccf736-5e8f-11f0-ae43-f02f742fe0dc', 'maintenance', 3, FALSE),
(@room_401_id, '401', 'ffccf737-5e8f-11f0-ae43-f02f742fe0dc', 'available', 4, TRUE),
(@room_501_id, '501', 'ffccf737-5e8f-11f0-ae43-f02f742fe0dc', 'occupied', 5, TRUE),
(@room_601_id, '601', 'ffccf737-5e8f-11f0-ae43-f02f742fe0dc', 'available', 6, TRUE);

-- Reservations with various statuses and scenarios
SET @res_1_id = UUID();
SET @res_2_id = UUID();
SET @res_3_id = UUID();
SET @res_4_id = UUID();
SET @res_5_id = UUID();
SET @res_6_id = UUID();
SET @res_7_id = UUID();
SET @res_8_id = UUID();

-- Regular customer reservations
INSERT INTO reservations (id, user_id, room_type_id, check_in_date, check_out_date, num_guests, status, checkin_status, total_price, discount_amount, final_price, special_requests, has_credit_card, credit_card_last4) VALUES
(@res_1_id, @customer_user_id, 'ffccf734-5e8f-11f0-ae43-f02f742fe0dc', '2025-01-10', '2025-01-12', 2, 'confirmed', 'not_checked_in', 200.00, 0.00, 200.00, 'Non-smoking room, high floor preferred', TRUE, '1234'),
(@res_2_id, @customer_2_id, 'ffccf735-5e8f-11f0-ae43-f02f742fe0dc', '2025-01-15', '2025-01-18', 3, 'pending', 'not_checked_in', 450.00, 22.50, 427.50, 'Extra bed, ocean view preferred', FALSE, NULL),
(@res_3_id, @customer_3_id, 'ffccf736-5e8f-11f0-ae43-f02f742fe0dc', '2025-01-20', '2025-01-25', 4, 'confirmed', 'checked_in', 1250.00, 125.00, 1125.00, 'Anniversary celebration, champagne on arrival', TRUE, '5678'),
(@res_4_id, @customer_user_id, 'ffccf734-5e8f-11f0-ae43-f02f742fe0dc', '2025-01-01', '2025-01-03', 1, 'confirmed', 'checked_out', 200.00, 0.00, 200.00, NULL, TRUE, '9012');

-- Travel company reservations
INSERT INTO reservations (id, user_id, room_type_id, check_in_date, check_out_date, num_guests, status, checkin_status, total_price, discount_amount, final_price, special_requests, is_travel_company, travel_company_id) VALUES
(@res_5_id, @travel_user_id, 'ffccf736-5e8f-11f0-ae43-f02f742fe0dc', '2025-02-01', '2025-02-05', 4, 'confirmed', 'not_checked_in', 1000.00, 150.00, 850.00, 'Group booking for 4 rooms', TRUE, @travel_company_1_id),
(@res_6_id, @travel_user_2_id, 'ffccf735-5e8f-11f0-ae43-f02f742fe0dc', '2025-02-10', '2025-02-15', 3, 'pending', 'not_checked_in', 750.00, 90.00, 660.00, 'Corporate booking', TRUE, @travel_company_2_id);

-- Residential suite reservations
INSERT INTO reservations (id, user_id, room_type_id, check_in_date, check_out_date, num_guests, status, checkin_status, total_price, discount_amount, final_price, special_requests, is_residential, residential_duration) VALUES
(@res_7_id, @customer_2_id, 'ffccf737-5e8f-11f0-ae43-f02f742fe0dc', '2025-01-01', '2025-02-01', 2, 'confirmed', 'checked_in', 4500.00, 225.00, 4275.00, 'Monthly stay, business trip', TRUE, 'monthly'),
(@res_8_id, @customer_3_id, 'ffccf737-5e8f-11f0-ae43-f02f742fe0dc', '2025-01-15', '2025-01-29', 3, 'confirmed', 'not_checked_in', 2400.00, 120.00, 2280.00, 'Weekly stay, family vacation', TRUE, 'weekly');

-- Room Assignments
SET @room_assignment_1 = UUID();
SET @room_assignment_2 = UUID();
SET @room_assignment_3 = UUID();
SET @room_assignment_4 = UUID();

INSERT INTO room_assignments (id, reservation_id, room_id, assigned_by) VALUES
(@room_assignment_1, @res_1_id, @room_102_id, @clerk_user_id),
(@room_assignment_2, @res_3_id, @room_201_id, @clerk_user_id),
(@room_assignment_3, @res_7_id, @room_501_id, @clerk_user_id),
(@room_assignment_4, @res_5_id, @room_301_id, @clerk_user_id);

-- Payments
SET @payment_1_id = UUID();
SET @payment_2_id = UUID();
SET @payment_3_id = UUID();
SET @payment_4_id = UUID();

INSERT INTO payments (id, reservation_id, amount, payment_method, transaction_id, status, processed_by) VALUES
(@payment_1_id, @res_1_id, 200.00, 'credit_card', 'TRN001', 'completed', @clerk_user_id),
(@payment_2_id, @res_3_id, 1125.00, 'credit_card', 'TRN002', 'completed', @clerk_user_id),
(@payment_3_id, @res_5_id, 850.00, 'travel_company', 'TRN003', 'completed', @clerk_user_id),
(@payment_4_id, @res_7_id, 4275.00, 'bank_transfer', 'TRN004', 'completed', @clerk_user_id);

-- Service Charges
SET @service_charge_1 = UUID();
SET @service_charge_2 = UUID();
SET @service_charge_3 = UUID();

INSERT INTO service_charges (id, reservation_id, service_type, description, amount, charged_by) VALUES
(@service_charge_1, @res_3_id, 'room_service', 'Champagne and chocolate strawberries', 75.00, @clerk_user_id),
(@service_charge_2, @res_7_id, 'laundry', 'Weekly laundry service', 45.00, @clerk_user_id),
(@service_charge_3, @res_3_id, 'restaurant', 'Dinner at hotel restaurant', 120.00, @clerk_user_id);

-- Billing Records (for no-shows)
SET @billing_record_1 = UUID();

INSERT INTO billing_records (id, reservation_id, billing_type, amount, description, billed_by) VALUES
(@billing_record_1, @res_4_id, 'no_show', 100.00, 'No-show fee for reservation', @manager_user_id);

-- Daily Reports (sample data)
SET @daily_report_1 = UUID();

INSERT INTO daily_reports (id, report_date, total_occupancy, total_rooms, occupancy_rate, total_revenue, total_reservations, total_check_ins, total_check_outs, total_cancellations, total_no_shows, generated_by) VALUES
(@daily_report_1, '2025-01-10', 45, 60, 75.00, 8500.00, 12, 8, 5, 2, 1, @manager_user_id);