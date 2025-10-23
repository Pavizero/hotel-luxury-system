-- Comprehensive MySQL schema for Hotel Management System
-- Supports all roles: customer, clerk, manager, travel
-- Includes reservation workflow, billing, payments, and reporting

-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS billing_records;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS room_assignments;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS loyalty_programs;
DROP TABLE IF EXISTS travel_companies;
DROP TABLE IF EXISTS residential_suites;
DROP TABLE IF EXISTS service_charges;
DROP TABLE IF EXISTS daily_reports;

-- Create loyalty_programs table
CREATE TABLE loyalty_programs (
    id CHAR(36) PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    min_points INT NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    benefits TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create travel_companies table
CREATE TABLE travel_companies (
    id CHAR(36) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    discount_rate DECIMAL(5, 2) DEFAULT 10.00, -- 10% default discount
    credit_limit DECIMAL(10, 2) DEFAULT 10000.00,
    current_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table with enhanced structure
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'clerk', 'manager', 'travel') NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    loyalty_points INT DEFAULT 0,
    loyalty_program_id CHAR(36),
    employee_id VARCHAR(50) UNIQUE, -- For clerk/manager
    travel_company_id CHAR(36), -- For travel company users
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id),
    FOREIGN KEY (travel_company_id) REFERENCES travel_companies(id)
);

-- Create room_types table
CREATE TABLE room_types (
    id CHAR(36) PRIMARY KEY,
    type_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL,
    amenities TEXT, -- JSON-like string for MySQL compatibility
    is_residential BOOLEAN DEFAULT FALSE, -- For weekly/monthly suites
    weekly_rate DECIMAL(10, 2), -- For residential suites
    monthly_rate DECIMAL(10, 2), -- For residential suites
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table
CREATE TABLE rooms (
    id CHAR(36) PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    room_type_id CHAR(36) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance', 'cleaning', 'reserved') NOT NULL DEFAULT 'available',
    floor INT,
    is_residential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

-- Create reservations table with comprehensive status tracking
CREATE TABLE reservations (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    room_type_id CHAR(36) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'no-show') NOT NULL DEFAULT 'pending',
    checkin_status ENUM('not_checked_in', 'checked_in', 'checked_out') NOT NULL DEFAULT 'not_checked_in',
    total_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    final_price DECIMAL(10, 2) NOT NULL,
    special_requests TEXT,
    has_credit_card BOOLEAN DEFAULT FALSE,
    credit_card_last4 VARCHAR(4),
    is_walk_in BOOLEAN DEFAULT FALSE,
    is_travel_company BOOLEAN DEFAULT FALSE,
    travel_company_id CHAR(36),
    is_residential BOOLEAN DEFAULT FALSE,
    residential_duration ENUM('weekly', 'monthly'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (check_out_date > check_in_date),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_type_id) REFERENCES room_types(id),
    FOREIGN KEY (travel_company_id) REFERENCES travel_companies(id)
);

-- Create room_assignments table
CREATE TABLE room_assignments (
    id CHAR(36) PRIMARY KEY,
    reservation_id CHAR(36) UNIQUE NOT NULL,
    room_id CHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by CHAR(36) NOT NULL, -- clerk who assigned the room
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Create payments table
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    reservation_id CHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'travel_company') NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    processed_by CHAR(36), -- clerk who processed the payment
    notes TEXT,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Create service_charges table for additional services
CREATE TABLE service_charges (
    id CHAR(36) PRIMARY KEY,
    reservation_id CHAR(36) NOT NULL,
    service_type ENUM('restaurant', 'room_service', 'laundry', 'telephone', 'club_access', 'key_issuing', 'other') NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    charged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    charged_by CHAR(36) NOT NULL, -- clerk who added the charge
    is_paid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (charged_by) REFERENCES users(id)
);

-- Create billing_records table for no-show billing
CREATE TABLE billing_records (
    id CHAR(36) PRIMARY KEY,
    reservation_id CHAR(36) NOT NULL,
    billing_type ENUM('no_show', 'late_cancellation', 'damage', 'other') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    billed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    billed_by CHAR(36), -- system or clerk
    status ENUM('pending', 'paid', 'disputed') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (billed_by) REFERENCES users(id)
);

-- Create daily_reports table
CREATE TABLE daily_reports (
    id CHAR(36) PRIMARY KEY,
    report_date DATE NOT NULL,
    total_occupancy INT NOT NULL,
    total_rooms INT NOT NULL,
    occupancy_rate DECIMAL(5, 2) NOT NULL,
    total_revenue DECIMAL(10, 2) NOT NULL,
    total_reservations INT NOT NULL,
    total_check_ins INT NOT NULL,
    total_check_outs INT NOT NULL,
    total_cancellations INT NOT NULL,
    total_no_shows INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by CHAR(36), -- system or manager
    FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_travel_company ON reservations(travel_company_id);
CREATE INDEX idx_reservations_checkin_status ON reservations(checkin_status);
CREATE INDEX idx_reservations_status_checkin ON reservations(status, checkin_status);
CREATE INDEX idx_rooms_room_type_id ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_service_charges_reservation_id ON service_charges(reservation_id);
CREATE INDEX idx_billing_records_reservation_id ON billing_records(reservation_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);