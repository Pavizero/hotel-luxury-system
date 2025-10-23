-- Migration to add checkin_status column and separate reservation status from check-in status
-- This resolves the confusion between reservation status (pending/confirmed/cancelled) and check-in status

-- Add the new checkin_status column

-- Migrate existing data
-- Set checkin_status based on current status values
UPDATE reservations SET checkin_status = 'checked_in' WHERE status = 'checked-in';
UPDATE reservations SET checkin_status = 'checked_out' WHERE status = 'checked-out';
UPDATE reservations SET checkin_status = 'not_checked_in' WHERE status IN ('pending', 'confirmed', 'cancelled', 'no-show');

-- Update status values to be more consistent
-- Change 'checked-in' to 'confirmed' (since they were already checked in, they must have been confirmed)
UPDATE reservations SET status = 'confirmed' WHERE status = 'checked-in';
-- Change 'checked-out' to 'confirmed' (since they completed their stay, they must have been confirmed)
UPDATE reservations SET status = 'confirmed' WHERE status = 'checked-out';

-- Add index for better performance on checkin_status queries
-- CREATE INDEX idx_reservations_checkin_status ON reservations(checkin_status);
-- CREATE INDEX idx_reservations_status_checkin ON reservations(status, checkin_status); 