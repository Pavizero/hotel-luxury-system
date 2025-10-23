-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist to ensure a clean slate for recreation
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS billing_records CASCADE; -- Added billing_records to drop
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_types CASCADE; -- New table to drop
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS travel_companies CASCADE;
DROP TABLE IF EXISTS loyalty_programs CASCADE;

-- Table for Loyalty Programs
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(255) UNIQUE NOT NULL,
    min_points INTEGER NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    benefits TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Travel Companies
CREATE TABLE travel_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255) UNIQUE,
    discount_rate DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Users (Customers, Clerks, Managers, Travel Company Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'customer', 'clerk', 'manager', 'travel'
    loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE SET NULL,
    loyalty_points INTEGER DEFAULT 0,
    employee_id VARCHAR(255) UNIQUE, -- For clerk/manager
    company_id UUID REFERENCES travel_companies(id) ON DELETE SET NULL, -- For travel company users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New Table for Room Types
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'Deluxe Ocean View', 'Executive Suite', 'Beach Villa'
    description TEXT,
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    capacity INTEGER NOT NULL,
    image_url VARCHAR(255),
    features TEXT[], -- Array of text for features like 'Wi-Fi', 'Balcony'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Rooms (now references room_types)
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(50) UNIQUE NOT NULL,
    room_type_id UUID REFERENCES room_types(id) ON DELETE RESTRICT NOT NULL, -- Link to room_types
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'cleaning'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Reservations (now references room_types and potentially rooms)
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    room_type_id UUID REFERENCES room_types(id) ON DELETE RESTRICT NOT NULL, -- Link to room_types
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL, -- Can be NULL if room not yet assigned
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INTEGER NOT NULL,
    special_requests TEXT,
    status VARCHAR(50) NOT NULL, -- 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL, -- e.g., 'pending', 'paid', 'refunded', 'partial', 'failed'
    payment_details_provided BOOLEAN DEFAULT FALSE,
    travel_company_id UUID REFERENCES travel_companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (check_out_date > check_in_date)
);

-- Table for Guests (actual people staying in rooms, linked to reservations)
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE, -- Can be NULL for walk-ins not tied to a reservation
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    check_in_date DATE NOT NULL, -- Date of check-in
    check_out_date DATE NOT NULL, -- Date of check-out
    num_guests INTEGER NOT NULL,
    room_type_id UUID REFERENCES room_types(id) ON DELETE RESTRICT NOT NULL, -- Link to room_types
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL, -- Actual room assigned
    status VARCHAR(50), -- 'pending-checkin', 'checked-in', 'checked-out', 'no-show', 'cancelled'
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Billing Records (for no-shows, travel company bills, etc.)
CREATE TABLE billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    travel_company_id UUID REFERENCES travel_companies(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_status VARCHAR(50) NOT NULL, -- 'paid', 'pending', 'overdue', 'refunded'
    payment_method VARCHAR(100),
    reference_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Travel Company Bulk Bookings (separate from individual reservations)
CREATE TABLE travel_company_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES travel_companies(id) ON DELETE RESTRICT NOT NULL,
    company_name VARCHAR(255) NOT NULL, -- Denormalized for easier reporting
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(50),
    booking_date DATE NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_rooms INTEGER NOT NULL,
    num_guests INTEGER NOT NULL,
    room_type_id UUID REFERENCES room_types(id) ON DELETE RESTRICT NOT NULL, -- Assuming one room type for bulk booking
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL, -- 'pending', 'confirmed', 'cancelled', 'completed'
    payment_status VARCHAR(50) NOT NULL, -- 'pending', 'paid', 'partial', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_reservations_check_in_date ON reservations(check_in_date);
CREATE INDEX idx_reservations_check_out_date ON reservations(check_out_date);
CREATE INDEX idx_guests_reservation_id ON guests(reservation_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_rooms_room_number ON rooms(room_number);
CREATE INDEX idx_room_types_name ON room_types(name);
CREATE INDEX idx_travel_company_bookings_company_id ON travel_company_bookings(company_id);
